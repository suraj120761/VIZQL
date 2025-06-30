# VIZQL
# VIZQL - Natural Language to SQL Chart Dashboard

VIZQL is an AI-powered data exploration tool that lets users ask questions in natural language, which are then converted into SQL queries and visualized as interactive charts. It's designed for non-technical users to explore structured databases effortlessly.

---

## 🚀 Features

- 🔍 Ask questions in plain English
- 🤖 Auto-converts questions into SQL queries using Azure OpenAI
- 📊 Visualizes SQL results using Chart.js (Bar, Pie, Line, etc.)
- 🧾 Shows the raw SQL query and summary explanation
- 🧠 Backend powered by Django + REST API
- ⚡ Frontend built with React + Vite

---

## 🛠️ Tech Stack

| Layer        | Technology           |
| ------------ | ------------------- |
| Frontend     | React, Vite, Chart.js |
| Backend      | Django, Django REST framework |
| AI/NLP       | Azure OpenAI (ChatCompletion) |
| Database     | MySQL |
| Env & Auth   | dotenv, .env files |

---

## 💻 Project Setup

### 🔧 1. Backend (Django + API)

```bash
# Step into backend folder
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate   # On Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver

 Make sure you configure your .env file:
AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
AZURE_DEPLOYMENT_NAME=gpt-35-turbo


 2. Frontend (React + Vite)
bash
Copy
Edit
# Step into frontend folder
cd frontend

# Install node packages
npm install

# Start frontend server
npm run dev

npm install jspdf html2canvas # for download

VIZQL/
│
├── backend/
│   ├── api/
│   ├── core/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env               # (DO NOT COMMIT)
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── README.md
└── .gitignore

