"""JSON-based job store for tracking analysis jobs."""
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional, List
import os

# Use /data for Render persistent disk, fallback to local for development
if os.getenv("RENDER"):
    JOBS_DIR = Path("/data/jobs")
    RESULTS_DIR = Path("/data/analysis_results")
else:
    # Get project root
    PROJECT_ROOT = Path(__file__).parent.parent.parent
    JOBS_DIR = PROJECT_ROOT / "backend" / "jobs"
    RESULTS_DIR = PROJECT_ROOT / "backend" / "analysis_results"


def ensure_dirs() -> None:
    """Ensure job and results directories exist."""
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def generate_job_id() -> str:
    """Generate a unique job ID with job_ prefix."""
    return f"job_{uuid.uuid4().hex[:8]}"


def get_timestamp() -> str:
    """Get current timestamp in ISO 8601 format (UTC)."""
    return datetime.now(timezone.utc).isoformat()


def create_job(dataset_id: str, analysis_type: str, params: Optional[Dict] = None) -> Dict:
    """
    Create a new job entry.
    
    Args:
        dataset_id: The dataset to analyze
        analysis_type: Type of analysis (survival, chainladder)
        params: Optional analysis parameters
        
    Returns:
        Job metadata dictionary
    """
    ensure_dirs()
    
    job_id = generate_job_id()
    job_data = {
        "job_id": job_id,
        "dataset_id": dataset_id,
        "analysis_type": analysis_type,
        "params": params or {},
        "status": "queued",
        "created_at": get_timestamp(),
        "updated_at": get_timestamp(),
        "result_path": None,
        "error": None
    }
    
    job_file = JOBS_DIR / f"{job_id}.json"
    with open(job_file, "w") as f:
        json.dump(job_data, f, indent=2)
    
    return job_data


def update_job(job_id: str, **kwargs) -> Dict:
    """
    Update job metadata.
    
    Args:
        job_id: The job ID to update
        **kwargs: Fields to update (status, result_path, error, etc.)
        
    Returns:
        Updated job metadata
    """
    job_file = JOBS_DIR / f"{job_id}.json"
    
    if not job_file.exists():
        raise FileNotFoundError(f"Job {job_id} not found")
    
    with open(job_file, "r") as f:
        job_data = json.load(f)
    
    # Update fields
    for key, value in kwargs.items():
        job_data[key] = value
    
    job_data["updated_at"] = get_timestamp()
    
    with open(job_file, "w") as f:
        json.dump(job_data, f, indent=2)
    
    return job_data


def get_job(job_id: str) -> Dict:
    """
    Get job metadata.
    
    Args:
        job_id: The job ID to retrieve
        
    Returns:
        Job metadata dictionary
    """
    job_file = JOBS_DIR / f"{job_id}.json"
    
    if not job_file.exists():
        raise FileNotFoundError(f"Job {job_id} not found")
    
    with open(job_file, "r") as f:
        return json.load(f)


def list_jobs() -> List[Dict]:
    """
    List all jobs.
    
    Returns:
        List of job metadata dictionaries
    """
    ensure_dirs()
    jobs = []
    
    for job_file in JOBS_DIR.glob("job_*.json"):
        with open(job_file, "r") as f:
            jobs.append(json.load(f))
    
    # Sort by created_at descending
    jobs.sort(key=lambda x: x["created_at"], reverse=True)
    
    return jobs


def save_result(job_id: str, result_data: Dict) -> str:
    """
    Save analysis result.
    
    Args:
        job_id: The job ID
        result_data: Analysis result dictionary
        
    Returns:
        Path to saved result file
    """
    ensure_dirs()
    
    result_file = RESULTS_DIR / f"{job_id}.json"
    with open(result_file, "w") as f:
        json.dump(result_data, f, indent=2)
    
    return str(result_file)


def get_result(job_id: str) -> Dict:
    """
    Get analysis result.
    
    Args:
        job_id: The job ID
        
    Returns:
        Analysis result dictionary
    """
    result_file = RESULTS_DIR / f"{job_id}.json"
    
    if not result_file.exists():
        raise FileNotFoundError(f"Result for job {job_id} not found")
    
    with open(result_file, "r") as f:
        return json.load(f)
