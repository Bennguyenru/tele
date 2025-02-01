# Transaction Analysis & AI Chatbot

This project provides an AI-powered **transaction analysis tool** that detects anomalies in financial transactions and includes an AI chatbot for insights.

## 🚀 Features
- Upload **Deposit & Withdrawal** CSV files
- **Detect large transactions** using anomaly detection
- **AI Chatbot** to answer transaction-related queries
- **REST API** for file uploads and AI interactions
- **Deployable on Heroku, Render, or AWS**

## 📂 Project Structure
```
/transaction-analysis-bot
│── backend/                 # Node.js backend
│   ├── server.js             # Express server
│   ├── .env.example          # Environment variables template
│── docker/                  # Docker setup
│── .gitignore               # Ignore unnecessary files
│── package.json             # Node.js dependencies
│── README.md                # Project Documentation
```

## 🔧 Installation

### 1️⃣ Backend Setup
```bash
git clone https://github.com/your-username/transaction-analysis-bot.git
cd backend
npm install
cp .env.example .env  # Configure environment variables
node server.js
```

### 2️⃣ Deploy on Docker
```bash
docker-compose up --build
```

## 🛠️ Environment Variables
```ini
OPENAI_API_KEY=your-api-key
PORT=5000
```

## 📬 API Endpoints
| Method | Endpoint         | Description |
|--------|----------------|-------------|
| POST   | `/upload`      | Upload CSV files |
| POST   | `/chat`        | AI chatbot |

## 📜 License
MIT License