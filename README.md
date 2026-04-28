# NL2SQL Compiler 🚀

An **AI-powered conversational agent** that lets non-technical users query databases using natural language. Built with SOLID principles and designed for extensibility.

![Python](https://img.shields.io/badge/Python-3.9+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)
![LangChain](https://img.shields.io/badge/LangChain-0.1.4-orange)

## ✨ Features

- 💬 **Natural Language Queries**: Ask questions in plain English, get SQL results
- 🔄 **Multi-turn Conversations**: Context-aware follow-up questions
- 📊 **Smart Responses**: Answers with context and helpful suggestions
- 🛡️ **Read-only Safety**: Only SELECT queries allowed for security
- 🔌 **Pluggable Architecture**: Easy to swap LLMs, databases, and storage
- 🎨 **Beautiful Chat UI**: Modern, dark-themed responsive interface

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Chat UI                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     FastAPI Server                          │
│                  /chat, /sessions, /schema                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    NL2SQL Agent                             │
│         (LLM Service + Database Adapter + Memory)           │
└───────────────────────────────────────────────────────────┘
```

### SOLID Principles Applied

| Principle | Implementation |
|-----------|----------------|
| **S**ingle Responsibility | Each class has one job (LLM, Database, Memory, Agent) |
| **O**pen/Closed | Add new LLM providers without changing agent code |
| **L**iskov Substitution | Any database adapter can replace another |
| **I**nterface Segregation | Small, focused interfaces |
| **D**ependency Inversion | Core depends on abstractions, not implementations |

## 📁 Project Structure

```
NL2SQL Compiler/
├── main.py                 # Application entry point
├── requirements.txt        # Python dependencies
├── .env                    # Configuration
│
├── src/
│   ├── interfaces/         # Abstract interfaces (contracts)
│   │   ├── llm_interface.py
│   │   ├── database_interface.py
│   │   ├── memory_interface.py
│   │   └── agent_interface.py
│   │
│   ├── services/           # Concrete implementations
│   │   ├── llm_service.py      # Groq LLM
│   │   ├── database_service.py # SQLite adapter
│   │   └── memory_service.py   # In-memory storage
│   │
│   ├── agent/              # Agent logic
│   │   └── nl2sql_agent.py
│   │
│   └── api/                # REST API
│       └── server.py
│
├── static/                 # Frontend files
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
└── scripts/                # Utility scripts
    └── create_sample_db.py
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

The `.env` file is already set up. Make sure your Groq API key is configured:

```env
GROQ_API_KEY=your_key_here
LLM_PROVIDER=groq
LLM_MODEL=llama-3.3-70b-versatile
DB_PATH=./sample.db
```

### 3. Create Sample Database

```bash
python scripts/create_sample_db.py
```

This creates a multi-domain database with:
- **E-commerce**: customers, products, orders, order_items
- **HR**: departments, employees, leaves
- **Finance**: accounts, transactions, budgets

### 4. Run the Application

```bash
python main.py
```

Open your browser at **http://localhost:8000**

## 💡 Example Queries

### E-commerce
- "How many customers do we have?"
- "What are the top 5 selling products?"
- "Show me orders from last week"
- "Which customers are premium members?"

### HR
- "List all employees in the Engineering department"
- "What's the average salary by department?"
- "Who took the most leaves this month?"
- "Show employees hired in 2023"

### Finance
- "What's our total account balance?"
- "Show recent transactions over 100000"
- "Which category has the highest budget?"
- "List all debit transactions"

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Chat UI |
| `/api/chat` | POST | Send a message |
| `/api/sessions` | GET | List all sessions |
| `/api/sessions/{id}` | GET | Get session details |
| `/api/sessions/{id}` | DELETE | Delete a session |
| `/api/schema` | GET | Get database schema |
| `/api/health` | GET | Health check |

## 🔌 Extending the System

### Adding a New LLM Provider

1. Create a new file in `src/services/` (e.g., `openai_service.py`)
2. Implement the `ILLMService` interface
3. Use it in the agent initialization

```python
from src.interfaces import ILLMService

class OpenAILLMService(ILLMService):
    async def generate(self, messages, system_prompt=None, temperature=0.7):
        # Your implementation
        pass
    
    async def generate_sql(self, query, schema, context=None):
        # Your implementation
        pass
    
    def get_model_name(self):
        return "gpt-4"
```

### Adding a New Database Type

1. Create a new file in `src/services/` (e.g., `mysql_service.py`)
2. Implement the `IDatabaseAdapter` interface
3. Use it in the server initialization

## 📜 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please follow the SOLID principles when adding new features.

---

Built with using Python, FastAPI, LangChain, and Groq
