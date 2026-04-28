# NL2SQL Compiler: Interview Preparation Guide

This guide contains everything you need to thoroughly explain your NL2SQL Compiler project in an interview. It is structured to help you outline the problem, your architecture, the tech stack, and the flow of the application mathematically and algorithmically.

## 1. The Core "Elevator Pitch" (What is it?)
**Goal:** An AI-powered conversational agent that enables non-technical users to query relational databases using natural language.
**Value Proposition:** Business users often need insights from databases but don't know SQL. Instead of waiting for a data engineer, they can ask questions in plain English. The system translates the question into executable SQL, runs it against the database securely, and returns the results in a friendly, conversational format.
**Key Features:** Multi-turn context-aware conversations, read-only safety, intelligent follow-up suggestions, and a pluggable architecture.

## 2. Tech Stack & Environment
- **Language:** Python 3.9+
- **Backend Framework:** FastAPI (creates fast, asynchronous REST APIs for chat, sessions, and schema handling). Server runs on Uvicorn.
- **AI / LLM Orchestration:** LangChain (used to prompt and manage the LLM integration).
- **LLM Provider:** Groq API (specifically utilizing the fast `llama-3.3-70b-versatile` model for generation without latency).
- **Database:** SQLite serves as the underlying sample database covering domains like E-commerce, HR, and Finance.
- **Frontend:** HTML, vanilla CSS (Dark-themed, modern responsive UI), and JavaScript. 

## 3. Architecture & Design Patterns (Crucial for Interviews)
This is where you can show off your software engineering skills. The project strictly adheres to **SOLID Principles** which makes it a highly maintainable, enterprise-ready system:

- **S - Single Responsibility:** Components are modularized. The LLM Service, Database Adapter, Memory Store, and the core Agent each have exactly **one** job.
- **O - Open/Closed:** The system is open for extension but closed for modification. You can add a new LLM provider (like OpenAI) or a new Database (like PostgreSQL) simply by writing a new adapter class without touching the core agent code.
- **L - Liskov Substitution:** The application uses abstractions. Any concrete Database Adapter or LLM Service can be swapped out without breaking the system.
- **I - Interface Segregation:** The project uses small, focused interfaces (`ILLMService`, `IDatabaseAdapter`, `IMemoryStore`, `IAgent`) located in the `src/interfaces` folder.
- **D - Dependency Inversion:** The core orchestrator (`NL2SQLAgent`) does not depend on a specific database or LLM. They are *injected* into the agent when it initializes.

## 4. How the System Works: Complete Data Flow
If an interviewer asks, *"Walk me through what happens when a user types a message,"* explain it in these programmatic phases:

### Phase 1: Input & Context Retrieval
1. The user's natural language input hits the FastApi (`POST /api/chat`) endpoint.
2. The core `NL2SQLAgent` receives the prompt. It queries the `IMemoryStore` to fetch the previous chat history (to maintain conversational context).
3. The Agent fetches the current database schema summary (tables, columns, types) from the `IDatabaseAdapter`.

### Phase 2: Lexical/Semantic Check (Clarification)
4. The system validates if the query is too ambiguous (e.g., just saying "show" or "find"). 
5. If ambiguous, the agent intercepts the prompt, passing the schema to the LLM to generate a helpful **clarifying question**.

### Phase 3: Translation Phase (NL to SQL Code Generation)
6. The `ILLMService` gets a payload containing the user's question, the conversation context, and the full text explanation of the DB schema.
7. The LLM translates the intent and outputs a valid SQL query specific to the SQLite dialect.

### Phase 4: Execution Phase (Safe Querying)
8. The `IDatabaseAdapter` receives the generated SQL string.
9. **Critical Security Step:** The system enforces **Read-only Safety**. It validates that the query is ONLY a `SELECT` statement preventing SQL injection attacks or destructive operations like `DROP` or `DELETE`.
10. The DB adapter executes the secure query and retrieves the rows.

### Phase 5: Synthesis Phase (Data to Natural Language)
11. The raw SQL payload (column names, rows, row counts) is passed back to the LLM.
12. A "Response Prompt" instructs the LLM to synthesize these raw data points into a friendly, plain English summary. 
13. *Error Handling:* If the SQL query failed at execution, the LLM catches the exception message and explains the error to the user in non-technical terms, suggesting a rephrase.

### Phase 6: Persistence & Response
14. Both the user message and assistant answer (including metadata like the exact SQL query run) are committed to the `chat_history.db`.
15. The formatted answer is served back to the React UI.

## 5. How to Guide the Interview Conversation
When answering questions, prioritize bringing up these 3 major "wins" of the project:
1. **"One of the biggest challenges I solved was Security."** Talk about how giving an AI access to a database is dangerous, so you engineered a strict read-only / SELECT-only layer.
2. **"I built this like an actual compiler."** Explain your thought process in treating the AI like a compiler: Lexical analysis (Clarification), Code Generation (NL to SQL), and Execution. 
3. **"The system is completely decoupled."** Emphasize that because of your interface-driven design, migrating this project from SQLite/Groq to AWS RDS/OpenAI would take minutes, not days.
