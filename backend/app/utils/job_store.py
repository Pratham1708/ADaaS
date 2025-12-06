"""Job store for managing analysis job metadata and results."""
from pathlib import Path
import json
from typing import Dict, Any, Optional

# Use local directories for job storage (ephemeral on free tier)
PROJECT_ROOT = Path(__file__).parent.parent.parent
JOBS_DIR = PROJECT_ROOT / "backend" / "jobs"
RESULTS_DIR = PROJECT_ROOT / "backend" / "analysis_results"


def ensure_dirs() -> None:
    """Ensure job and results directories exist."""
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def create_job(job_id: str, job_data: Dict[str, Any]) -> None:
    """
    Create a new job entry.
    
    Args:
        job_id: Unique job identifier
        job_data: Job metadata dictionary
    """
    ensure_dirs()
    job_file = JOBS_DIR / f"{job_id}.json"
    
    with open(job_file, 'w') as f:
        json.dump(job_data, f, indent=2)


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    """
    Get job metadata by ID.
    
    Args:
        job_id: Job identifier
        
    Returns:
        Job metadata dictionary or None if not found
    """
    ensure_dirs()
    job_file = JOBS_DIR / f"{job_id}.json"
    
    if not job_file.exists():
        return None
    
    with open(job_file, 'r') as f:
        return json.load(f)


def update_job(job_id: str, updates: Dict[str, Any]) -> None:
    """
    Update job metadata.
    
    Args:
        job_id: Job identifier
        updates: Dictionary of fields to update
    """
    job_data = get_job(job_id)
    if job_data:
        job_data.update(updates)
        create_job(job_id, job_data)


def save_result(job_id: str, result_data: Dict[str, Any]) -> str:
    """
    Save analysis results.
    
    Args:
        job_id: Job identifier
        result_data: Analysis results dictionary
        
    Returns:
        Path to saved results file
    """
    ensure_dirs()
    result_file = RESULTS_DIR / f"{job_id}_result.json"
    
    with open(result_file, 'w') as f:
        json.dump(result_data, f, indent=2)
    
    return str(result_file)


def get_result(job_id: str) -> Optional[Dict[str, Any]]:
    """
    Get analysis results by job ID.
    
    Args:
        job_id: Job identifier
        
    Returns:
        Results dictionary or None if not found
    """
    ensure_dirs()
    result_file = RESULTS_DIR / f"{job_id}_result.json"
    
    if not result_file.exists():
        return None
    
    with open(result_file, 'r') as f:
        return json.load(f)


def list_jobs() -> list:
    """
    List all jobs.
    
    Returns:
        List of job metadata dictionaries
    """
    ensure_dirs()
    jobs = []
    
    for job_file in JOBS_DIR.glob("*.json"):
        with open(job_file, 'r') as f:
            jobs.append(json.load(f))
    
    return jobs


def delete_job(job_id: str) -> bool:
    """
    Delete a job and its results.
    
    Args:
        job_id: Job identifier
        
    Returns:
        True if deleted, False if not found
    """
    ensure_dirs()
    job_file = JOBS_DIR / f"{job_id}.json"
    result_file = RESULTS_DIR / f"{job_id}_result.json"
    
    deleted = False
    
    if job_file.exists():
        job_file.unlink()
        deleted = True
    
    if result_file.exists():
        result_file.unlink()
        deleted = True
    
    return deleted


def get_jobs_by_dataset(dataset_id: str) -> list:
    """
    Get all jobs for a specific dataset.
    
    Args:
        dataset_id: Dataset identifier
        
    Returns:
        List of job metadata dictionaries
    """
    all_jobs = list_jobs()
    return [job for job in all_jobs if job.get('dataset_id') == dataset_id]


def get_job_count() -> int:
    """
    Get total number of jobs.
    
    Returns:
        Number of jobs
    """
    ensure_dirs()
    return len(list(JOBS_DIR.glob("*.json")))
