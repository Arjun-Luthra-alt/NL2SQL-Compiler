# PROPOSAL DESCRIPTION

## Motivation (1 pt)
*(Max 300 words)*

Organizations today generate and store massive volumes of data in relational databases, yet extracting meaningful insights from this data remains a significant challenge. Business users — including managers, analysts, marketers, and operations staff — frequently need answers from their data but lack the technical expertise to write SQL queries. This creates a critical bottleneck: every data request must route through a limited pool of data engineers or analysts, causing delays ranging from hours to days.

The consequences are tangible. Decision-making slows down, opportunities are missed, and technical teams become overwhelmed with ad-hoc query requests instead of focusing on higher-value work. According to industry surveys, business users spend an average of 30% of their time waiting for data that could answer their questions.

Traditional solutions like dashboards and BI tools address part of this problem, but they are inherently rigid — they only answer pre-configured questions. When a user has a new, unexpected question, they're back to waiting for a developer.

The NL2SQL Compiler solves this by providing an AI-powered conversational agent that allows anyone to query databases using plain English. Instead of writing `SELECT department, AVG(salary) FROM employees GROUP BY department`, a user simply asks: *"What's the average salary by department?"* The system intelligently converts this natural language into SQL, executes it safely (read-only), and returns the answer with contextual explanations, data visualizations, and follow-up suggestions.

This project is important because it democratizes data access — putting the power of SQL into the hands of every employee, regardless of technical background. It reduces dependency on engineering teams, accelerates decision-making, and ultimately bridges the gap between data and the people who need it most.

---

## State of the Art / Current Solution (1 pt)
*(Max 200 words)*

Current approaches to the NL2SQL problem fall into three categories:

**1. Traditional BI Tools (Tableau, Power BI, Metabase):** These provide pre-built dashboards and visual query builders. However, they require upfront configuration, only answer pre-defined questions, and still demand a learning curve for non-technical users.

**2. Rule-Based NL2SQL Systems:** Early systems used pattern matching and grammar rules to convert text to SQL. These are brittle, support limited vocabulary, and fail with ambiguous or complex queries.

**3. LLM-Based Solutions (Text2SQL, ChatGPT + DB plugins):** Recent advances leverage large language models to generate SQL from natural language. Tools like LangChain's SQL Agent, OpenAI's Code Interpreter, and research models like DINSQL have shown promising results. However, most existing implementations suffer from:
- **No conversation context** — each query is independent, losing multi-turn understanding.
- **Tight coupling** — hard-coded to specific LLM providers or databases.
- **No safety guardrails** — risk of executing destructive queries.
- **No visualization** — results are returned as raw data.

Our project advances beyond these solutions by building a **multi-turn conversational agent** with pluggable architecture (SOLID principles), read-only safety enforcement, persistent conversation memory, automatic data visualization, and export capabilities — making it both more robust and more user-friendly than existing alternatives.

---

## Project Goals and Milestones (2 pts)
*(Max 300 words)*

### General Goals

The primary goal is to build an **Agentic NL2SQL Compiler** — an AI-powered conversational system that enables non-technical users to query relational databases using natural language, receive accurate answers with contextual explanations, and interact through a modern web interface.

### Specific Goals
1. **Accurate NL-to-SQL conversion** using LLMs with schema-aware prompting
2. **Multi-turn conversation support** so users can ask follow-up questions naturally
3. **Safe execution** with read-only query enforcement (SELECT only)
4. **Data visualization** — automatic chart generation from query results
5. **Pluggable architecture** following SOLID principles for easy extensibility
6. **Persistent memory** so conversations survive application restarts

### Milestones

**Sprint 1 — Core MVP (Completed):**
- ✅ Define abstract interfaces (ILLMService, IDatabaseAdapter, IMemoryStore, IAgent)
- ✅ Implement Groq LLM service with LangChain integration
- ✅ Implement SQLite database adapter with read-only enforcement
- ✅ Build the NL2SQL agent with conversation context handling
- ✅ Create FastAPI REST API (chat, sessions, schema, health endpoints)
- ✅ Build responsive web chat UI with dark theme
- ✅ Create multi-domain sample database (E-commerce, HR, Finance)

**Sprint 2 — Enhanced Features (Completed):**
- ✅ Persistent conversation storage using SQLite
- ✅ Data visualization with Chart.js (bar, line, pie, doughnut charts)
- ✅ CSV export functionality for query results
- ✅ Toast notifications and improved UX

**Sprint 3 — Extensibility (Planned):**
- ⬜ MySQL/PostgreSQL database adapter support
- ⬜ Additional LLM providers (OpenAI, Google Gemini)
- ⬜ Query explanation in plain English
- ⬜ User authentication and multi-user support

---

## Project Approach (3 pts)
*(Max 300 words)*

### Design Philosophy

The project follows **SOLID principles** and **Agile methodology** with iterative sprints. The architecture uses **Dependency Inversion** — the core agent depends on abstract interfaces, not concrete implementations, allowing any LLM provider, database engine, or storage backend to be swapped without modifying business logic.

### Technical Approach

**Agent Pipeline (5-step flow):**
1. **Receive** — User sends a natural language question
2. **Contextualize** — Agent retrieves conversation history for multi-turn understanding
3. **Generate** — LLM converts the question to SQL using schema-aware prompting
4. **Execute** — Database adapter runs the query (after read-only safety check)
5. **Respond** — LLM formats results into a friendly, contextual answer

### Platforms & Technologies

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Backend** | Python 3.9+ with FastAPI | Async support, auto-generated API docs, high performance |
| **LLM Framework** | LangChain + Groq API | Abstraction layer for LLM providers, fast inference via Groq |
| **LLM Model** | Llama 3.3 70B Versatile | Open-source, high accuracy for SQL generation tasks |
| **Database** | SQLite (via SQLAlchemy-compatible adapter) | Zero-config, file-based, perfect for development; pluggable for MySQL/PostgreSQL |
| **Memory Store** | SQLite (separate DB) | Persistent conversation history across restarts |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Lightweight, no build tools required, responsive design |
| **Visualization** | Chart.js | Client-side charting with multiple chart types |
| **Data Models** | Pydantic | Runtime validation, serialization, type safety |
| **Version Control** | Git | Standard source control |

### Key Design Decisions
- **Read-only enforcement** via regex-based query validation (blocks INSERT/UPDATE/DELETE/DROP)
- **Low-temperature prompting** (0.1) for SQL generation ensures deterministic, accurate queries
- **Context windowing** — last 6 messages sent to LLM for follow-up understanding

---

## System Architecture (High Level Diagram) (2 pts)

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │   Chat UI    │  │  Chart.js    │  │  CSV Export               │  │
│  │  (HTML/CSS/  │  │  Visualizer  │  │  (Download)               │  │
│  │   JS)        │  │              │  │                           │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────────┘  │
│         │                 │                      │                  │
│         └─────────────────┼──────────────────────┘                  │
│                           │  HTTP/JSON                              │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      FastAPI REST SERVER                              │
│                                                                       │
│   /api/chat    /api/sessions    /api/schema    /api/export/csv        │
│   /api/query   /api/health      /              /api/sessions/{id}     │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────┐        │
│   │              Request/Response Models (Pydantic)          │        │
│   │  ChatRequest, ChatResponse, SessionInfo, ExportRequest   │        │
│   └─────────────────────┬───────────────────────────────────┘        │
└─────────────────────────┼─────────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        NL2SQL AGENT                                   │
│                   (Orchestration Layer)                                │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────┐        │
│   │                  process_message()                       │        │
│   │                                                          │        │
│   │  1. Save user message to memory                          │        │
│   │  2. Retrieve conversation history (last 10 msgs)         │        │
│   │  3. Check if clarification needed                        │        │
│   │  4. Generate SQL via LLM (with schema + context)         │        │
│   │  5. Execute query (read-only enforced)                   │        │
│   │  6. Generate friendly response via LLM                   │        │
│   │  7. Save assistant response to memory                    │        │
│   └─────────────────────────────────────────────────────────┘        │
│                                                                       │
│   Uses INTERFACES only (Dependency Inversion Principle)               │
│     ┌──────────────┐  ┌─────────────────┐  ┌──────────────┐         │
│     │ ILLMService   │  │ IDatabaseAdapter │  │ IMemoryStore  │         │
│     └──────┬────────┘  └────────┬────────┘  └──────┬───────┘         │
└────────────┼────────────────────┼───────────────────┼─────────────────┘
             │                    │                   │
             ▼                    ▼                   ▼
┌────────────────────┐ ┌──────────────────┐ ┌─────────────────────┐
│  GroqLLMService    │ │ SQLiteDatabase   │ │ SqliteMemoryStore   │
│                    │ │ Adapter          │ │                     │
│ • generate()       │ │ • connect()      │ │ • create_session()  │
│ • generate_sql()   │ │ • execute_query()│ │ • add_message()     │
│ • get_model_name() │ │ • get_schema()   │ │ • get_messages()    │
│                    │ │ • is_read_only() │ │ • get_all_sessions()│
│  ┌──────────────┐  │ │                  │ │                     │
│  │ LangChain +  │  │ │  ┌────────────┐  │ │  ┌───────────────┐  │
│  │ Groq API     │  │ │  │ sample.db  │  │ │  │chat_history.db│  │
│  └──────────────┘  │ │  └────────────┘  │ │  └───────────────┘  │
└────────────────────┘ └──────────────────┘ └─────────────────────┘
      (Swappable)           (Swappable)           (Swappable)
```

**Key Architectural Properties:**
- **Pluggable Components** — Each service (LLM, Database, Memory) can be swapped independently
- **Interface Segregation** — Small, focused contracts for each service type
- **Single Responsibility** — Each class handles exactly one concern
- **Safety Layer** — Read-only enforcement sits in the database adapter, before any query execution

---

## Project Outcome / Deliverables (1 pt)
*(Max 200 words)*

The project delivers the following tangible outcomes:

**1. Working Web Application:**
A fully functional web-based chat interface where users can type natural language questions and receive SQL-powered answers with data tables, charts, and contextual explanations. Accessible at `http://localhost:8000`.

**2. Extensible Python Backend:**
A modular Python backend built on SOLID principles with clearly defined interfaces. New LLM providers (OpenAI, Gemini), database engines (MySQL, PostgreSQL), or storage backends can be added by implementing the corresponding interface — zero changes to existing code.

**3. RESTful API:**
9 documented API endpoints enabling programmatic access to the NL2SQL engine, supporting integration with external applications, CLIs, or mobile apps.

**4. Multi-Domain Sample Database:**
A pre-built SQLite database spanning 3 business domains (E-commerce, HR, Finance) with 10 tables and realistic data for comprehensive testing.

**5. Data Visualization & Export:**
Built-in charting capabilities (bar, line, pie, doughnut) and CSV export, transforming raw query results into actionable insights.

**6. Source Code & Documentation:**
Complete, well-documented source code with inline docstrings, project README, architecture documentation, and this proposal — enabling future development and academic evaluation.

---

## Assumptions
*(Max 100 words)*

1. Users have basic English proficiency to formulate questions about their data.
2. The target database schema is relational (SQL-based); NoSQL databases are out of scope.
3. A valid Groq API key is available for LLM inference (free tier sufficient for development).
4. Python 3.9+ is installed on the deployment machine.
5. The database is read-only for the agent — no data mutations are permitted.
6. Internet connectivity is available for LLM API calls (no offline mode).
7. The sample SQLite database is sufficient for demonstration; production databases may vary.

---

## References

1. **LangChain Documentation** — Framework for building LLM applications.
   https://python.langchain.com/docs/

2. **Groq API Documentation** — High-speed LLM inference platform.
   https://console.groq.com/docs

3. **FastAPI Documentation** — Modern Python web framework.
   https://fastapi.tiangolo.com/

4. **Chart.js** — Simple yet flexible JavaScript charting library.
   https://www.chartjs.org/docs/latest/

5. **Pydantic Documentation** — Data validation using Python type annotations.
   https://docs.pydantic.dev/

6. **SQLAlchemy Documentation** — Python SQL toolkit and ORM.
   https://www.sqlalchemy.org/

7. **Robert C. Martin** — *Clean Architecture: A Craftsman's Guide to Software Structure and Design*, 2017.
   (SOLID Principles reference)

8. **Rajkumar et al.** — *"Text-to-SQL Empowered by Large Language Models: A Benchmark Evaluation"*, 2022.
   https://arxiv.org/abs/2308.15363

9. **Pourreza & Rafiei** — *"DIN-SQL: Decomposed In-Context Learning of Text-to-SQL"*, 2023.
   https://arxiv.org/abs/2304.11015

10. **SQLite Documentation** — Self-contained, file-based database engine.
    https://www.sqlite.org/docs.html
