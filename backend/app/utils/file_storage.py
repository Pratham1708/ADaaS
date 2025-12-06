"""File storage utilities for handling uploaded CSV files."""
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile
import uuid

# Use local directory for file uploads (ephemeral on free tier)
PROJECT_ROOT = Path(__file__).parent.parent.parent
UPLOAD_DIR = PROJECT_ROOT / "backend" / "uploaded_files"


def ensure_upload_dir() -> None:
    """Ensure the upload directory exists."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def generate_dataset_id() -> str:
    """Generate a unique dataset ID with ds_ prefix."""
    return f"ds_{uuid.uuid4().hex[:8]}"


async def save_uploaded_file(file: UploadFile) -> Tuple[str, str, str]:
    """
    Save an uploaded file and return dataset metadata.
    
    Args:
        file: The uploaded file from FastAPI
        
    Returns:
        Tuple of (dataset_id, file_path, filename)
    """
    ensure_upload_dir()
    
    dataset_id = generate_dataset_id()
    filename = file.filename or "unknown.csv"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Return relative path from repo root
    relative_path = str(file_path)
    
    return dataset_id, relative_path, filename


def get_file_path(filename: str) -> Path:
    """Get the full path for a given filename."""
    return UPLOAD_DIR / filename


def list_uploaded_files() -> list:
    """List all uploaded files with metadata."""
    ensure_upload_dir()
    files = []
    
    for file_path in UPLOAD_DIR.glob("*.csv"):
        files.append({
            "filename": file_path.name,
            "path": str(file_path),
            "size": file_path.stat().st_size
        })
    
    return files
