"""
Migration script to register existing uploaded datasets.

This script scans the uploaded_files directory and registers any CSV files
that are not yet in the dataset registry.
"""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.utils.dataset_registry import load_registry, register_dataset
from app.utils.file_storage import UPLOAD_DIR
from datetime import datetime, timezone
import re


def extract_dataset_id_from_filename(filename: str) -> str:
    """
    Try to extract dataset_id from filename.
    Filenames are typically: ds_<8hex>_<original_name>.csv
    """
    match = re.match(r'(ds_[a-f0-9]{8})_', filename)
    if match:
        return match.group(1)
    
    # If no match, generate a new ID
    import uuid
    return f"ds_{uuid.uuid4().hex[:8]}"


def migrate_existing_datasets():
    """
    Scan uploaded_files directory and register any unregistered datasets.
    """
    print("[INFO] Starting dataset migration...")
    
    # Load current registry
    registry = load_registry()
    print(f"[INFO] Current registry has {len(registry)} datasets")
    
    # Get all CSV files in upload directory
    csv_files = list(UPLOAD_DIR.glob("*.csv"))
    print(f"[INFO] Found {len(csv_files)} CSV files in {UPLOAD_DIR}")
    
    registered_count = 0
    skipped_count = 0
    
    for csv_file in csv_files:
        # Try to extract dataset_id from filename
        dataset_id = extract_dataset_id_from_filename(csv_file.name)
        
        # Check if already registered
        if dataset_id in registry:
            print(f"[SKIP] {csv_file.name} already registered as {dataset_id}")
            skipped_count += 1
            continue
        
        # Register the dataset
        metadata = {
            "dataset_id": dataset_id,
            "filename": csv_file.name,
            "file_path": str(csv_file),
            "uploaded_at": datetime.fromtimestamp(csv_file.stat().st_mtime, tz=timezone.utc).isoformat(),
            "migrated": True
        }
        
        register_dataset(dataset_id, metadata)
        print(f"[REGISTERED] {csv_file.name} as {dataset_id}")
        registered_count += 1
    
    print(f"\n[SUMMARY]")
    print(f"  - Registered: {registered_count} new datasets")
    print(f"  - Skipped: {skipped_count} already registered")
    print(f"  - Total in registry: {len(load_registry())} datasets")
    print(f"\n[INFO] Migration complete!")


if __name__ == "__main__":
    migrate_existing_datasets()
