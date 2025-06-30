import openai
import pymysql
import os
import re
import json
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
    "database": "vizql",
}


def get_mysql_schema():
    """
    Dynamically fetch all table names and their columns from the database.
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
            # Step 1: Extract schema
            schema = get_mysql_schema()

            # Step 2: Generate SQL from NL using OpenAI
            sql_prompt = f"""
You are a MySQL expert.

Here is the current database schema:
{schema}

Write an optimal MySQL SELECT query for the following natural language request.
The query may involve joins, filters, grouping, or sorting.

NL Question:
\"{question}\"

Only output the SQL query. Do not explain anything.
"""

            completion = openai.ChatCompletion.create(
                engine=deployment_name,
                messages=[
                    {"role": "system", "content": "You are a MySQL expert."},
                    {"role": "user", "content": sql_prompt}
                ]
            )

            response_content = completion["choices"][0]["message"]["content"]
            sql_match = re.search(r"(SELECT[\s\S]+?;)", response_content, re.IGNORECASE)

            if not sql_match:
                return Response({"error": "Could not extract a valid SQL query."}, status=400)

            sql_query = sql_match.group(1).strip()

            # Step 3: Execute the SQL query
            conn = pymysql.connect(**DB_CONFIG)
            with conn.cursor() as cursor:
                cursor.execute(sql_query)
                rows = cursor.fetchall()
                columns = [desc[0] for desc in cursor.description]
                result = [dict(zip(columns, row)) for row in rows]

            # Step 4: Generate explanation
            explanation_prompt = f"Summarize the result of this query in one sentence:\n{sql_query}\n\nResult: {json.dumps(result[:10])}"

            explanation_completion = openai.ChatCompletion.create(
                engine=deployment_name,
                messages=[
                    {"role": "system", "content": "You summarize SQL result into a simple sentence."},
                    {"role": "user", "content": explanation_prompt}
                ]
            )

            explanation = explanation_completion["choices"][0]["message"]["content"]

            return Response({
                "sql": sql_query,
                "result": result,
                "explanation": explanation
            })

        except Exception as e:
            return Response({"error": str(e)}, status=500)
