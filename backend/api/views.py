import openai
import pymysql
import os
import re
from dotenv import load_dotenv
from rest_framework.views import APIView
from rest_framework.response import Response

load_dotenv()

# Azure OpenAI config
openai.api_type = "azure"
openai.api_base = os.getenv("AZURE_OPENAI_ENDPOINT")
openai.api_version = "2023-05-15"
openai.api_key = os.getenv("AZURE_OPENAI_KEY")
deployment_name = os.getenv("AZURE_DEPLOYMENT_NAME")

# MySQL DB config
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Admin#123456",
    "database": "company",
}


def get_mysql_schema():
    """
    Dynamically fetch all table names and columns from the MySQL database.
    """
    schema = ""
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES;")
            tables = [row[0] for row in cursor.fetchall()]
            for table in tables:
                cursor.execute(f"SHOW COLUMNS FROM {table};")
                columns = cursor.fetchall()
                schema += f"Table: {table}\nColumns:\n"
                for col in columns:
                    schema += f"- {col[0]} ({col[1]})\n"
                schema += "\n"
    except Exception as e:
        schema += f"# Error retrieving schema: {str(e)}"
    finally:
        conn.close()
    return schema


class AskQuestionAPIView(APIView):
    def post(self, request):
        question = request.data.get("question")
        if not question:
            return Response({"error": "Question is required."}, status=400)

        try:
            # Fetch schema from the actual MySQL database
            schema = get_mysql_schema()

            # Step 1: Convert natural language to SQL
            sql_prompt = f"""
Use the following MySQL schema to write a valid SQL SELECT query.

{schema}

Convert this natural language question into a valid MySQL SELECT query:
"{question}"

Only output the raw SQL query. Do not explain anything.
"""

            completion = openai.ChatCompletion.create(
                engine=deployment_name,
                messages=[
                    {"role": "system", "content": "You are a MySQL expert."},
                    {"role": "user", "content": sql_prompt}
                ]
            )

            raw_response = completion["choices"][0]["message"]["content"]
            sql_match = re.search(r"(SELECT|UPDATE|INSERT|DELETE)[\s\S]+?;", raw_response, re.IGNORECASE)

            if not sql_match:
                return Response({"error": "Could not extract a valid SQL query."}, status=400)

            sql_query = sql_match.group(0).strip()

            # Step 2: Execute SQL
            conn = pymysql.connect(**DB_CONFIG)
            with conn.cursor() as cursor:
                cursor.execute(sql_query)
                rows = cursor.fetchall()
                columns = [desc[0] for desc in cursor.description]
                result = [dict(zip(columns, row)) for row in rows]

            # Step 3: Ask OpenAI to summarize the result
            explanation_prompt = f"Here is the SQL result: {result}. Summarize it in one sentence."
            explanation = openai.ChatCompletion.create(
                engine=deployment_name,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that summarizes SQL results."},
                    {"role": "user", "content": explanation_prompt}
                ]
            )["choices"][0]["message"]["content"]

            return Response({
                "sql": sql_query,
                "result": result,
                "explanation": explanation
            })

        except Exception as e:
            return Response({"error": str(e)}, status=500)
