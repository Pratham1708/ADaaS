"""FastAPI main application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import routes_datasets, routes_analysis
import os

app = FastAPI(
    title="ADaaS - Actuarial Dashboard as a Service",
    description="FastAPI backend for survival analysis and chain-ladder reserving",
    version="1.0.0"
)

# CORS middleware - Use environment variable for production
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes_datasets.router)
app.include_router(routes_analysis.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "ADaaS API",
        "version": "1.0.0",
        "endpoints": {
            "datasets": "/api/v1/datasets",
            "analysis": "/api/v1/analysis"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
