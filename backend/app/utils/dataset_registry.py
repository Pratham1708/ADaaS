"""Persistent storage for dataset registry using JSON files."""
import json
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime, timezone
import threading

# Path to registry file
BACKEND_DIR = Path(__file__).parent.parent.parent
REGISTRY_FILE = BACKEND_DIR / "dataset_registry.json"
REGISTRY_LOCK = threading.Lock()


def load_registry() -> Dict[str, Dict]:
    """
    Load dataset registry from JSON file.
    
    Returns:
        Dictionary mapping dataset_id to metadata
    """
    with REGISTRY_LOCK:
        if not REGISTRY_FILE.exists():
            return {}
        
        try:
            with open(REGISTRY_FILE, 'r', encoding='utf-8') as f:
                registry = json.load(f)
                print(f"[INFO] Loaded {len(registry)} datasets from registry")
                return registry
        except Exception as e:
            print(f"[ERROR] Failed to load registry: {e}")
            return {}


def save_registry(registry: Dict[str, Dict]) -> None:
    """
    Save dataset registry to JSON file.
    
    Args:
        registry: Dictionary mapping dataset_id to metadata
    """
    with REGISTRY_LOCK:
        try:
            # Ensure directory exists
            REGISTRY_FILE.parent.mkdir(parents=True, exist_ok=True)
            
            # Write to temp file first, then rename (atomic operation)
            temp_file = REGISTRY_FILE.with_suffix('.tmp')
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(registry, f, indent=2, ensure_ascii=False)
            
            # Atomic rename
            temp_file.replace(REGISTRY_FILE)
            print(f"[INFO] Saved {len(registry)} datasets to registry")
        except Exception as e:
            print(f"[ERROR] Failed to save registry: {e}")
            raise


def register_dataset(dataset_id: str, metadata: Dict) -> None:
    """
    Register a new dataset in the persistent registry.
    
    Args:
        dataset_id: Unique dataset identifier
        metadata: Dataset metadata (filename, file_path, uploaded_at, etc.)
    """
    registry = load_registry()
    registry[dataset_id] = metadata
    save_registry(registry)
    print(f"[INFO] Registered dataset: {dataset_id}")


def get_dataset(dataset_id: str) -> Optional[Dict]:
    """
    Get dataset metadata from registry.
    
    Args:
        dataset_id: Dataset identifier
        
    Returns:
        Dataset metadata or None if not found
    """
    registry = load_registry()
    return registry.get(dataset_id)


def list_all_datasets() -> list:
    """
    List all registered datasets.
    
    Returns:
        List of dataset metadata dictionaries
    """
    registry = load_registry()
    datasets = list(registry.values())
    # Sort by upload time (newest first)
    datasets.sort(key=lambda x: x.get("uploaded_at", ""), reverse=True)
    return datasets


def delete_dataset(dataset_id: str) -> bool:
    """
    Delete dataset from registry.
    
    Args:
        dataset_id: Dataset identifier
        
    Returns:
        True if deleted, False if not found
    """
    registry = load_registry()
    if dataset_id in registry:
        del registry[dataset_id]
        save_registry(registry)
        print(f"[INFO] Deleted dataset from registry: {dataset_id}")
        return True
    return False


def update_dataset(dataset_id: str, updates: Dict) -> bool:
    """
    Update dataset metadata in registry.
    
    Args:
        dataset_id: Dataset identifier
        updates: Dictionary of fields to update
        
    Returns:
        True if updated, False if not found
    """
    registry = load_registry()
    if dataset_id in registry:
        registry[dataset_id].update(updates)
        save_registry(registry)
        print(f"[INFO] Updated dataset: {dataset_id}")
        return True
    return False


def find_dataset_by_filename(filename: str) -> Optional[Dict]:
    """
    Find dataset by filename.
    
    Args:
        filename: Filename to search for
        
    Returns:
        Dataset metadata or None if not found
    """
    registry = load_registry()
    for dataset in registry.values():
        if dataset.get("filename") == filename:
            return dataset
    return None


def cleanup_missing_files() -> int:
    """
    Remove datasets from registry if their files no longer exist.
    
    Returns:
        Number of datasets removed
    """
    registry = load_registry()
    to_remove = []
    
    for dataset_id, metadata in registry.items():
        file_path = metadata.get("file_path")
        if file_path and not Path(file_path).exists():
            to_remove.append(dataset_id)
    
    for dataset_id in to_remove:
        del registry[dataset_id]
    
    if to_remove:
        save_registry(registry)
        print(f"[INFO] Cleaned up {len(to_remove)} missing datasets")
    
    return len(to_remove)
