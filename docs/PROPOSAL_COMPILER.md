# PROPOSAL DESCRIPTION

## Motivation (1 pt)

The idea behind this project came from a simple frustration — why do people still need to learn SQL just to ask a question about their own data? If you think about it, SQL is essentially a structured language with rigid syntax rules, and natural language is flexible, messy, and full of ambiguity. Bridging these two worlds is fundamentally a compilation problem.

In traditional compiler design, we translate one language (source) into another (target). Here, the source language is English and the target language is SQL. This is a fascinating and challenging compilation problem because unlike programming languages, natural language doesn't follow a formal grammar — it's context-dependent, ambiguous, and constantly evolving.

From a practical standpoint, this problem matters a lot. Businesses store their critical data in relational databases, but the majority of employees — managers, analysts, marketing teams — can't write SQL. They depend on developers for every data request, which creates bottlenecks and slows down decision-making. A compiler that can accurately translate "show me the top 5 customers by revenue" into a valid SELECT query would remove this dependency entirely.

What makes this project particularly interesting from a compiler design perspective is that we're dealing with a source language (English) that has no formal grammar specification. Traditional compilers rely on well-defined lexical rules and context-free grammars. Our compiler must handle the inherent ambiguity of human language — things like synonyms, implicit references, and context from previous queries in a conversation. This pushes us beyond textbook compiler design into the territory of AI-augmented compilation, where Large Language Models serve as intelligent components within the compiler pipeline.

---

## State of the Art / Current Solution (1 pt)

The NL2SQL translation problem has been approached from multiple angles over the years.

Early attempts used **rule-based systems** — essentially hand-crafted grammars and pattern matching. These worked like simple compilers with fixed lexical rules and rigid parsing, but they broke down quickly with any variation in phrasing. If the system expected "show me" but the user typed "display" or "what are," it would fail.

More recent approaches use **sequence-to-sequence neural models** trained specifically on NL2SQL datasets like Spider and WikiSQL. Models such as RAT-SQL, BRIDGE, and DIN-SQL treat the problem as a machine translation task — translating from one sequence (English) to another (SQL). These achieve decent accuracy but struggle with multi-turn conversations and unseen database schemas.

The latest wave uses **Large Language Models** (GPT-4, Llama, etc.) with in-context learning. Tools like LangChain's SQL Agent feed the database schema into the LLM prompt and let the model generate SQL directly. However, most of these are single-turn — they don't maintain conversation context, lack safety guardrails against destructive queries, and don't provide user-friendly output like visualizations.

Our project builds on this LLM-based approach but structures it as a **proper compiler pipeline** with distinct phases — lexical analysis, semantic analysis, code generation, and optimization — giving us better control, safety, and extensibility than monolithic LLM-only solutions.

---

## Project Goals and Milestones (2 pts)

### General Goals

The primary goal is to design and build a **Natural Language to SQL Compiler** — a system that takes English text as input and produces valid, optimized SQL queries as output. Unlike a traditional compiler that processes code, our compiler processes human language, making it a unique application of compiler design principles to the NLP domain.

### Specific Goals

1. **Build a multi-phase compiler pipeline** that mirrors classical compiler architecture — tokenization, parsing, semantic analysis, intermediate representation, and code generation
2. **Handle ambiguity** in natural language through schema-aware semantic analysis
3. **Support multi-turn compilation** where context from previous queries informs the current translation (similar to how compilers handle scope and symbol tables)
4. **Enforce safety constraints** — the compiler should only generate read-only (SELECT) queries, acting as a semantic check before code generation
5. **Provide a usable interface** — a web-based frontend where users can interact with the compiler conversationally

### Milestones

**Milestone 1 — Compiler Core (Completed):**
- Defined the compiler's interface contracts (abstract classes for each phase)
- Implemented the lexical + semantic analysis phase using LLM with schema context
- Built the code generation phase (natural language → SQL)
- Added safety validation (read-only query enforcement)
- Created a multi-domain test database for compiler testing

**Milestone 2 — Enhanced Output & Persistence (Completed):**
- Added persistent symbol table (conversation memory via SQLite)
- Implemented output visualization (Chart.js for result rendering)
- Added data export capabilities (CSV)

**Milestone 3 — Compiler Extensibility (Planned):**
- Support multiple target languages (MySQL, PostgreSQL dialects)
- Support multiple frontend parsers (OpenAI, Gemini as alternative analysis engines)
- Add query explanation (decompilation — SQL back to English)

---

## Project Approach (3 pts)

### Compiler Pipeline Design

We model our system as a **6-phase compiler pipeline**, drawing direct parallels to classical compiler theory:

**Phase 1 — Lexical Analysis (Tokenization):**
The user's natural language input is received and preprocessed. The LLM internally tokenizes the input, identifying key entities (table names, column references, operations like "total," "average," "top 5") — analogous to how a traditional lexer identifies keywords, identifiers, and operators.

**Phase 2 — Syntax & Semantic Analysis (Parsing + Schema Binding):**
The system loads the database schema (our "symbol table") and feeds it alongside the user's query to the LLM. The LLM acts as both parser and semantic analyzer — understanding sentence structure, resolving ambiguous references (e.g., "revenue" maps to `total_amount` in the `orders` table), and binding natural language entities to schema objects.

**Phase 3 — Context Resolution (Scope Analysis):**
For multi-turn conversations, the compiler retrieves the last 6 messages from the conversation history — similar to how compilers maintain scope chains. This allows follow-up queries like "now sort that by date" to reference the previous query's context.

**Phase 4 — Code Generation (SQL Emission):**
The LLM generates the target SQL code using low-temperature (0.1) sampling for deterministic output. Post-processing strips markdown artifacts and validates syntax.

**Phase 5 — Safety Validation (Static Analysis):**
Before execution, a regex-based static analyzer checks the generated SQL for dangerous operations (INSERT, UPDATE, DELETE, DROP). Only SELECT, WITH, and EXPLAIN statements pass through — acting as our compiler's type-checking phase.

**Phase 6 — Execution & Response Generation:**
The validated SQL is executed against the database, and results are fed back to the LLM to generate a human-readable explanation — effectively a "decompilation" of raw data into English.

### Technologies Used

- **Python 3.9+** — Implementation language
- **LangChain + Groq API (Llama 3.3 70B)** — Powers the LLM-based compiler phases
- **FastAPI** — REST API for the compiler interface
- **SQLite** — Target database engine + persistent memory store
- **Pydantic** — Data validation for compiler I/O models
- **Chart.js** — Output visualization
- **HTML/CSS/JavaScript** — Web frontend

---

## System Architecture (High Level Diagram) (2 pts)

```
                        NL2SQL COMPILER ARCHITECTURE
                    (Mapped to Compiler Design Phases)

    ┌─────────────────────────────────────────────────────────┐
    │                    SOURCE INPUT                         │
    │              (Natural Language Query)                    │
    │         "Show me top 5 customers by revenue"            │
    └────────────────────────┬────────────────────────────────┘
                             │
                             ▼
    ┌─────────────────────────────────────────────────────────┐
    │              PHASE 1: LEXICAL ANALYSIS                  │
    │                                                         │
    │   • Input preprocessing & tokenization                  │
    │   • Entity recognition (tables, columns, operations)    │
    │   • Keyword identification ("top", "by", "show")        │
    │                                                         │
    │   Implemented via: LLM Tokenizer (Llama 3.3)            │
    └────────────────────────┬────────────────────────────────┘
                             │
                             ▼
    ┌─────────────────────────────────────────────────────────┐
    │        PHASE 2: SYNTAX & SEMANTIC ANALYSIS              │
    │                                                         │
    │   • Parse sentence structure (intent detection)         │
    │   • Schema binding ("revenue" → orders.total_amount)    │
    │   • Ambiguity resolution using database context         │
    │                                                         │
    │   Symbol Table: Database Schema (loaded at startup)     │
    │   ┌───────────────────────────────────────────────┐     │
    │   │  customers(id, name, email, city, country)    │     │
    │   │  orders(id, customer_id, total_amount, status)│     │
    │   │  products(id, name, category, price, rating)  │     │
    │   │  employees(id, name, department_id, salary)   │     │
    │   │  ... (10 tables across 3 domains)             │     │
    │   └───────────────────────────────────────────────┘     │
    │                                                         │
    │   Implemented via: LLM + Schema-Aware Prompting         │
    └────────────────────────┬────────────────────────────────┘
                             │
                             ▼
    ┌─────────────────────────────────────────────────────────┐
    │          PHASE 3: CONTEXT RESOLUTION                    │
    │              (Scope Analysis)                            │
    │                                                         │
    │   • Retrieve conversation history (last 6 messages)     │
    │   • Resolve references ("sort THAT by date")            │
    │   • Maintain multi-turn compilation state               │
    │                                                         │
    │   Scope Store: SQLite Memory DB (chat_history.db)       │
    │                                                         │
    │   Implemented via: SqliteMemoryStore                     │
    └────────────────────────┬────────────────────────────────┘
                             │
                             ▼
    ┌─────────────────────────────────────────────────────────┐
    │           PHASE 4: CODE GENERATION                      │
    │              (SQL Emission)                              │
    │                                                         │
    │   • Generate target SQL from analyzed input              │
    │   • Low-temperature (0.1) for deterministic output      │
    │   • Post-processing: strip markdown, clean whitespace   │
    │                                                         │
    │   Output: SELECT c.name, SUM(o.total_amount) AS rev     │
    │           FROM customers c JOIN orders o                 │
    │           ON c.id = o.customer_id                        │
    │           GROUP BY c.name ORDER BY rev DESC LIMIT 5;     │
    │                                                         │
    │   Implemented via: GroqLLMService.generate_sql()        │
    └────────────────────────┬────────────────────────────────┘
                             │
                             ▼
    ┌─────────────────────────────────────────────────────────┐
    │         PHASE 5: SAFETY VALIDATION                      │
    │            (Static Analysis)                             │
    │                                                         │
    │   • Regex-based dangerous keyword detection             │
    │   • Blocked: INSERT, UPDATE, DELETE, DROP, ALTER,       │
    │             TRUNCATE, GRANT, REVOKE, EXEC               │
    │   • Allowed: SELECT, WITH (CTE), EXPLAIN, PRAGMA       │
    │   • Comment stripping before analysis                   │
    │                                                         │
    │   Implemented via: SQLiteDatabaseAdapter.is_read_only() │
    └────────────────────────┬────────────────────────────────┘
                             │
                             ▼
    ┌─────────────────────────────────────────────────────────┐
    │        PHASE 6: EXECUTION & OUTPUT GENERATION           │
    │            (Runtime + Decompilation)                     │
    │                                                         │
    │   • Execute validated SQL against target database        │
    │   • Format results as data table                        │
    │   • Generate English explanation (SQL → English)        │
    │   • Render charts (Bar, Line, Pie, Doughnut)            │
    │   • Enable CSV export                                   │
    │                                                         │
    │   Implemented via: NL2SQLAgent + FastAPI + Chart.js     │
    └────────────────────────┬────────────────────────────────┘
                             │
                             ▼
    ┌─────────────────────────────────────────────────────────┐
    │                    TARGET OUTPUT                         │
    │                                                         │
    │   • SQL Query (generated code)                          │
    │   • Data Table (execution result)                       │
    │   • English Explanation (decompiled output)             │
    │   • Visualization (charts)                              │
    │   • Export (CSV file)                                    │
    └─────────────────────────────────────────────────────────┘
```

---

## Project Outcome / Deliverables (1 pt)

The project delivers a working **Natural Language to SQL Compiler** with the following outputs:

**1. Compiler Engine:** A Python-based compilation pipeline that takes English text as input and produces valid SQL as output, handling tokenization, semantic analysis, code generation, and safety validation — all modeled after classical compiler phases.

**2. Interactive Compiler Frontend:** A web-based interface where users can type natural language queries and see the compiled SQL, execution results, and English explanations in real time. This serves as the "IDE" for our compiler.

**3. Multi-Turn Compilation Support:** A persistent context system (analogous to a compiler's symbol table and scope chain) that maintains conversation state across queries, enabling follow-up references.

**4. Safety Analyzer:** A static analysis module that validates generated SQL before execution, blocking any destructive operations — similar to how compilers perform type checking and error detection.

**5. Compiler Test Suite:** A multi-domain sample database (E-commerce, HR, Finance — 10 tables) serving as the test environment for verifying compilation accuracy across diverse query patterns.

**6. Complete Source Code & Documentation:** Well-structured, documented codebase following SOLID design principles, enabling future extensions like new target SQL dialects or alternative parsing engines.

---

## Assumptions

1. The source language is conversational English — we do not support other natural languages at this stage.
2. The target language is SQL (specifically SQLite dialect), though the architecture supports adding other SQL dialects.
3. An internet connection is required since the LLM-based compiler phases rely on cloud-hosted models via the Groq API.
4. The compiler operates in read-only mode — it generates SELECT queries only and intentionally blocks any data modification statements.
5. Python 3.9 or higher is installed on the host machine.
6. Users phrase their queries as questions or commands about data, not as arbitrary conversation.

---

## References

1. Aho, A.V., Lam, M.S., Sethi, R. and Ullman, J.D. — *Compilers: Principles, Techniques, and Tools* (Dragon Book), 2nd Edition, 2006. (Core compiler theory reference)

2. Zhong, V., Xiong, C. and Socher, R. — *"Seq2SQL: Generating Structured Queries from Natural Language using Reinforcement Learning"*, 2017. https://arxiv.org/abs/1709.00103

3. Yu, T. et al. — *"Spider: A Large-Scale Human-Labeled Dataset for Complex and Cross-Domain Semantic Parsing and Text-to-SQL Task"*, 2018. https://arxiv.org/abs/1809.08887

4. Pourreza, M. and Rafiei, D. — *"DIN-SQL: Decomposed In-Context Learning of Text-to-SQL with Self-Correction"*, 2023. https://arxiv.org/abs/2304.11015

5. Rajkumar, N. et al. — *"Evaluating the Text-to-SQL Capabilities of Large Language Models"*, 2022. https://arxiv.org/abs/2308.15363

6. LangChain Documentation — Framework for LLM application development. https://python.langchain.com/docs/

7. Groq API Documentation — High-performance LLM inference. https://console.groq.com/docs

8. FastAPI Documentation — Modern async Python web framework. https://fastapi.tiangolo.com/

9. Chart.js Documentation — Client-side JavaScript charting. https://www.chartjs.org/docs/latest/

10. SQLite Documentation — Embedded relational database engine. https://www.sqlite.org/docs.html
