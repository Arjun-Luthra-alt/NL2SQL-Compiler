"""
FastAPI Server for NL2SQL Compiler

REST API endpoints for the chat interface.
Sprint 2: Added persistent memory and CSV export.
"""

import os
import io
import csv
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our components
from ..services import GroqLLMService, SQLiteDatabaseAdapter, SqliteMemoryStore
from ..agent import NL2SQLAgent


# Global instances (initialized on startup)
llm_service: Optional[GroqLLMService] = None
db_adapter: Optional[SQLiteDatabaseAdapter] = None
memory_store: Optional[SqliteMemoryStore] = None
agent: Optional[NL2SQLAgent] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    global llm_service, db_adapter, memory_store, agent
    
    print("🚀 Starting NL2SQL Compiler...")
    
    # Initialize services
    try:
        llm_service = GroqLLMService()
        print(f"✅ LLM Service initialized: {llm_service.get_model_name()}")
        
        db_adapter = SQLiteDatabaseAdapter()
        connected = await db_adapter.connect()
        if connected:
            print(f"✅ Database connected: {db_adapter.db_path}")
        else:
            print("⚠️ Database connection failed")
        
        # Use persistent SQLite memory store
        memory_store = SqliteMemoryStore()
        print(f"✅ Persistent memory store initialized: {memory_store.db_path}")
        
        # Create the agent
        agent = NL2SQLAgent(
            llm_service=llm_service,
            database_adapter=db_adapter,
            memory_store=memory_store
        )
        print("✅ NL2SQL Agent ready!")
        
    except Exception as e:
        print(f"❌ Startup error: {e}")
        raise
    
    yield
    
    # Cleanup on shutdown
    print("👋 Shutting down...")
    if db_adapter:
        await db_adapter.disconnect()


def create_app() -> FastAPI:
    """Factory function to create the FastAPI app."""
    
    app = FastAPI(
        title="NL2SQL Compiler",
        description="An AI agent that converts natural language to SQL queries",
        version="0.2.0",  # Sprint 2
        lifespan=lifespan
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Mount static files
    static_path = os.path.join(os.path.dirname(__file__), "..", "..", "static")
    if os.path.exists(static_path):
        app.mount("/static", StaticFiles(directory=static_path), name="static")
    
    return app


# Create the app
app = create_app()


# ==========================================
# Request/Response Models
# ==========================================

class ChatRequest(BaseModel):
    """Chat message request."""
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat response."""
    message: str
    session_id: str
    sql_query: Optional[str] = None
    data: Optional[dict] = None
    needs_clarification: bool = False
    error: Optional[str] = None


class SessionInfo(BaseModel):
    """Session information."""
    session_id: str
    title: Optional[str] = None
    message_count: int
    created_at: str
    updated_at: str


class ExportRequest(BaseModel):
    """Request for exporting data."""
    columns: List[str]
    rows: List[List]
    filename: Optional[str] = "export"


# ==========================================
# API Endpoints
# ==========================================

@app.get("/")
async def root():
    """Serve the main chat UI."""
    static_path = os.path.join(os.path.dirname(__file__), "..", "..", "static", "index.html")
    return FileResponse(static_path)


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process a chat message and return the agent's response."""
    
    if not agent:
        raise HTTPException(status_code=500, detail="Agent not initialized")
    
    # Create new session if not provided
    session_id = request.session_id
    if not session_id:
        session = await memory_store.create_session()
        session_id = session.session_id
    
    # Process the message
    response = await agent.process_message(
        user_message=request.message,
        session_id=session_id
    )
    
    return ChatResponse(
        message=response.message,
        session_id=session_id,
        sql_query=response.sql_query,
        data=response.query_result,
        needs_clarification=response.needs_clarification,
        error=response.error
    )


@app.get("/api/sessions")
async def get_sessions():
    """Get all conversation sessions."""
    
    if not memory_store:
        raise HTTPException(status_code=500, detail="Memory store not initialized")
    
    sessions = await memory_store.get_all_sessions()
    
    # Get message counts for each session
    result = []
    for s in sessions:
        messages = await memory_store.get_messages(s.session_id)
        result.append(SessionInfo(
            session_id=s.session_id,
            title=s.title,
            message_count=len(messages),
            created_at=s.created_at.isoformat(),
            updated_at=s.updated_at.isoformat()
        ))
    
    return result


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """Get a specific session with all messages."""
    
    if not memory_store:
        raise HTTPException(status_code=500, detail="Memory store not initialized")
    
    session = await memory_store.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session.session_id,
        "title": session.title,
        "created_at": session.created_at.isoformat(),
        "updated_at": session.updated_at.isoformat(),
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "timestamp": m.timestamp.isoformat(),
                "metadata": m.metadata
            }
            for m in session.messages
        ]
    }


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a conversation session."""
    
    if not memory_store:
        raise HTTPException(status_code=500, detail="Memory store not initialized")
    
    deleted = await memory_store.delete_session(session_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"success": True}


@app.get("/api/schema")
async def get_schema():
    """Get the database schema summary."""
    
    if not agent:
        raise HTTPException(status_code=500, detail="Agent not initialized")
    
    schema = await agent.get_schema_summary()
    suggestions = await agent.suggest_questions()
    
    return {
        "schema": schema,
        "suggested_questions": suggestions
    }


@app.post("/api/export/csv")
async def export_csv(request: ExportRequest):
    """Export data as CSV file."""
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(request.columns)
    
    # Write data rows
    for row in request.rows:
        writer.writerow(row)
    
    # Prepare response
    output.seek(0)
    
    filename = f"{request.filename}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@app.get("/api/query")
async def direct_query(q: str = Query(..., description="Natural language query")):
    """Direct query endpoint for quick queries without session."""
    
    if not agent:
        raise HTTPException(status_code=500, detail="Agent not initialized")
    
    # Create a temporary session
    session = await memory_store.create_session()
    
    # Process the query
    response = await agent.process_message(
        user_message=q,
        session_id=session.session_id
    )
    
    return {
        "query": q,
        "message": response.message,
        "sql_query": response.sql_query,
        "data": response.query_result,
        "error": response.error
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "0.2.0",
        "llm": llm_service.get_model_name() if llm_service else "not initialized",
        "database": db_adapter.db_path if db_adapter else "not connected",
        "memory": "persistent (SQLite)"
    }
