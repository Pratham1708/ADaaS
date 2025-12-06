"""Dataset management API routes."""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Dict
from datetime import datetime, timezone
import pandas as pd
from app.utils.file_storage import save_uploaded_file, list_uploaded_files
from app.services.dataset_analyzer import analyze_dataset
from app.services.gemini_analyzer import analyze_with_gemini
from app.utils.dataset_registry import (
    load_registry,
    save_registry,
    register_dataset,
    get_dataset,
    list_all_datasets as list_datasets_from_registry,
    delete_dataset as delete_from_registry,
    update_dataset,
    cleanup_missing_files
)

router = APIRouter(prefix="/api/v1/datasets", tags=["datasets"])

# Load persistent dataset registry on startup
DATASET_REGISTRY = load_registry()
AI_ANALYSIS_CACHE: Dict[str, Dict] = {}

# Clean up any datasets with missing files
cleanup_missing_files()
print(f"[INFO] Loaded {len(DATASET_REGISTRY)} datasets from persistent registry")


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)) -> Dict:
    """
    Upload a CSV dataset.
    
    Returns:
        {
            "dataset_id": "ds_<8hex>",
            "file_path": "backend/uploaded_files/filename.csv",
            "filename": "filename.csv"
        }
    """
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        dataset_id, file_path, filename = await save_uploaded_file(file)
        
        # Register dataset in persistent storage
        metadata = {
            "dataset_id": dataset_id,
            "filename": filename,
            "file_path": file_path,
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
        register_dataset(dataset_id, metadata)
        
        # Also update in-memory cache for current session
        DATASET_REGISTRY[dataset_id] = metadata
        
        return {
            "dataset_id": dataset_id,
            "file_path": file_path,
            "filename": filename
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/analyze/{dataset_id}")
async def analyze_dataset_endpoint(dataset_id: str) -> Dict:
    """
    Analyze dataset to determine type and validate for actuarial analysis.
    
    Returns:
        {
            "dataset_type": "survival" | "claims_triangle" | "unknown",
            "is_valid": bool,
            "issues": [...],
            "recommendations": [...],
            "metadata": {...},
            "column_info": [...]
        }
    """
    # Try to find file path from registry or by searching uploaded files
    if dataset_id in DATASET_REGISTRY:
        file_path = DATASET_REGISTRY[dataset_id]["file_path"]
    else:
        # Search in uploaded_files directory
        from pathlib import Path
        from app.utils.file_storage import UPLOAD_DIR
        
        # Look for any file matching the dataset_id pattern
        possible_files = list(UPLOAD_DIR.glob(f"*{dataset_id}*"))
        if not possible_files:
            # Try to find by just searching all files
            possible_files = list(UPLOAD_DIR.glob("*.csv"))
        
        if not possible_files:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
        
        # Use the most recent file
        file_path = str(max(possible_files, key=lambda p: p.stat().st_mtime))
    
    try:
        analysis = analyze_dataset(file_path)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze-smart/{dataset_id}")
async def analyze_with_ai(dataset_id: str) -> Dict:
    """
    Analyze dataset using Gemini AI for intelligent insights.
    Falls back to rule-based if Gemini unavailable.
    """
    # Try to find file path
    if dataset_id in DATASET_REGISTRY:
        file_path = DATASET_REGISTRY[dataset_id]["file_path"]
    else:
        from pathlib import Path
        from app.utils.file_storage import UPLOAD_DIR
        
        possible_files = list(UPLOAD_DIR.glob(f"*{dataset_id}*"))
        if not possible_files:
            possible_files = list(UPLOAD_DIR.glob("*.csv"))
        
        if not possible_files:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
        
        file_path = str(max(possible_files, key=lambda p: p.stat().st_mtime))
    
    try:
        # Use Gemini analyzer for pure AI analysis
        from app.services.gemini_analyzer import analyze_with_gemini
        from app.services.dataset_analyzer import analyze_dataset
        
        gemini_result = analyze_with_gemini(file_path)
        
        # If Gemini returns 'unknown', use dataset_analyzer as fallback for better detection
        dataset_type = gemini_result.get("dataset_type", "unknown")
        if dataset_type == "unknown":
            print(f"[INFO] Gemini returned 'unknown', using dataset_analyzer fallback")
            fallback_analysis = analyze_dataset(file_path)
            fallback_type = fallback_analysis.get("dataset_type", "unknown")
            print(f"[INFO] Dataset analyzer detected: {fallback_type}")
            
            # Use fallback type if it's more specific
            if fallback_type != "unknown":
                dataset_type = fallback_type
                print(f"[INFO] Using fallback dataset type: {dataset_type}")
        
        # Use Gemini's validation directly
        return {
            "dataset_type": dataset_type,
            "is_valid": gemini_result.get("is_valid", True),
            "issues": gemini_result.get("data_quality", {}).get("issues", []),
            "recommendations": gemini_result.get("recommendations", []),
            "metadata": {
                "rows": len(pd.read_csv(file_path)),
                "columns": len(pd.read_csv(file_path).columns),
                "column_names": list(pd.read_csv(file_path).columns),
                "missing_values": int(pd.read_csv(file_path).isna().sum().sum())
            },
            "column_info": [],
            "gemini_insights": gemini_result,
            "ai_powered": gemini_result.get("gemini_powered", False)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Analysis failed: {str(e)}")


@router.get("/{dataset_id}/data")
async def get_dataset_data(dataset_id: str, limit: int = 1000) -> List[Dict]:
    """
    Fetch raw dataset data for visualization.
    Returns first 'limit' rows as JSON array of objects.
    """
    # Try to find file path
    if dataset_id in DATASET_REGISTRY:
        file_path = DATASET_REGISTRY[dataset_id]["file_path"]
    else:
        from pathlib import Path
        from app.utils.file_storage import UPLOAD_DIR
        
        possible_files = list(UPLOAD_DIR.glob(f"*{dataset_id}*"))
        if not possible_files:
            possible_files = list(UPLOAD_DIR.glob("*.csv"))
        
        if not possible_files:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
        
        file_path = str(max(possible_files, key=lambda p: p.stat().st_mtime))
    
    try:
        df = pd.read_csv(file_path)
        # Limit rows for performance
        df_limited = df.head(limit)
        
        # Replace Infinity and NaN with None for JSON serialization
        import numpy as np
        df_limited = df_limited.replace([np.inf, -np.inf], None)
        df_limited = df_limited.where(pd.notna(df_limited), None)
        
        # Convert to list of dictionaries
        data = df_limited.to_dict(orient='records')
        print(f"[INFO] Returning {len(data)} rows for dataset {dataset_id}")
        return data
    except Exception as e:
        print(f"[ERROR] Failed to read dataset: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to read dataset: {str(e)}")


@router.post("/generate-dashboard/{dataset_id}")
async def generate_dashboard(dataset_id: str) -> Dict:
    """
    Automatically generate dashboard for the dataset.
    Analyzes the data type and runs appropriate analysis.
    
    Returns:
        {
            "job_id": "job_xxx" or null,
            "dashboard_url": "/analysis/job_xxx" or "/dashboard/dataset_xxx",
            "analysis_type": "survival" | "chainladder" | "general",
            "status": "completed" | "processing"
        }
    """
    # Try to find file path from registry or by searching uploaded files
    if dataset_id in DATASET_REGISTRY:
        file_path = DATASET_REGISTRY[dataset_id]["file_path"]
    else:
        # Search in uploaded_files directory
        from pathlib import Path
        from app.utils.file_storage import UPLOAD_DIR
        
        # Look for any file matching the dataset_id pattern
        possible_files = list(UPLOAD_DIR.glob(f"*{dataset_id}*"))
        if not possible_files:
            # Try to find by just searching all files
            possible_files = list(UPLOAD_DIR.glob("*.csv"))
        
        if not possible_files:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found. Please upload the file again.")
        
        # Use the most recent file
        file_path = str(max(possible_files, key=lambda p: p.stat().st_mtime))
    
    try:
        # First analyze to determine type
        print(f"[INFO] Generating dashboard for dataset: {dataset_id}")
        print(f"[INFO] File path: {file_path}")
        
        analysis = analyze_dataset(file_path)
        dataset_type = analysis["dataset_type"]
        
        print(f"[INFO] Dataset type detected: {dataset_type}")
        
        # Import here to avoid circular imports
        from app.api.v1.routes_analysis import process_survival_job, run_chain_ladder_from_csv
        from app.utils.job_store import create_job
        
        # Separate mortality tables from survival analysis
        mortality_types = ["mortality_table"]
        survival_types = ["survival_analysis", "clinical_survival", "insurance_survival", "funeral_claims"]
        triangle_types = ["claims_triangle", "potential_triangle"]
        
        # Handle mortality tables with dedicated dashboard
        if dataset_type in mortality_types:
            print(f"[INFO] Routing to mortality dashboard for {dataset_id}")
            return {
                "job_id": None,
                "dashboard_url": f"/mortality-dashboard/{dataset_id}",
                "analysis_type": "mortality",
                "dataset_type": dataset_type,
                "status": "completed",
                "message": "Mortality table detected. Routing to mortality analytics dashboard."
            }
        
        if dataset_type in survival_types:
            # Create and process survival job immediately
            job = create_job(dataset_id=dataset_id, analysis_type="survival", params={})
            
            # Process synchronously for immediate dashboard
            try:
                print(f"[INFO] Processing survival job for {dataset_id}...")
                process_survival_job(job["job_id"], file_path, strata_col=None)
                print(f"[INFO] Survival job completed successfully")
                return {
                    "job_id": job["job_id"],
                    "dashboard_url": f"/analysis/{job['job_id']}",
                    "analysis_type": "survival",
                    "dataset_type": dataset_type,
                    "status": "completed"
                }
            except Exception as e:
                print(f"[ERROR] Survival job failed: {type(e).__name__}: {e}")
                import traceback
                traceback.print_exc()
                
                # Fallback to general dashboard
                print(f"[WARN] Falling back to general dashboard")
                return {
                    "job_id": job["job_id"],
                    "dashboard_url": f"/general-dashboard/{dataset_id}",
                    "analysis_type": "survival",
                    "dataset_type": dataset_type,
                    "status": "failed",
                    "error": str(e)
                }
        
        
        elif dataset_type in triangle_types:
            # Run chain-ladder analysis
            result = run_chain_ladder_from_csv(file_path)
            # Store result for dashboard
            from app.utils.job_store import save_result
            job_id = f"cl_{dataset_id}"
            save_result(job_id, result)
            
            return {
                "job_id": job_id,
                "dashboard_url": f"/chainladder-dashboard/{dataset_id}",
                "analysis_type": "chainladder",
                "dataset_type": dataset_type,
                "status": "completed",
                "result": result
            }
        
        # GLM-compatible datasets
        glm_types = ["glm_frequency", "glm_severity", "glm_compatible", "insurance_claims"]
        
        if dataset_type in glm_types:
            # For GLM, we need user to specify target column
            # Return general dashboard with GLM option
            dashboard_url = f"/general-dashboard/{dataset_id}"
            print(f"[INFO] GLM-compatible dataset detected. Showing general dashboard with GLM option.")
            return {
                "job_id": None,
                "dashboard_url": dashboard_url,
                "analysis_type": "general",
                "dataset_type": dataset_type,
                "status": "completed",
                "message": f"GLM-compatible dataset detected. Use general dashboard to configure and run GLM analysis.",
                "glm_compatible": True
            }
        
        else:
            # For other types, create a general dashboard
            dashboard_url = f"/general-dashboard/{dataset_id}"
            print(f"[INFO] Returning general dashboard URL: {dashboard_url}")
            return {
                "job_id": None,
                "dashboard_url": dashboard_url,
                "analysis_type": "general",
                "dataset_type": dataset_type,
                "status": "completed",
                "message": f"Created general dashboard for {dataset_type} data"
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard generation failed: {str(e)}")


@router.get("")
async def list_datasets() -> List[Dict]:
    """
    List all uploaded datasets.
    
    Returns:
        [
            {
                "dataset_id": "ds_abc12345",
                "filename": "sample.csv",
                "uploaded_at": "2025-11-29T12:00:00Z"
            },
            ...
        ]
    """
    # Reload from persistent storage to get latest data
    global DATASET_REGISTRY
    DATASET_REGISTRY = load_registry()
    
    # Return datasets sorted by upload time (newest first)
    return list_datasets_from_registry()


@router.get("/survival-analysis/{dataset_id}")
async def get_survival_analysis(dataset_id: str) -> Dict:
    """
    Get survival analysis for a dataset if applicable.
    
    Returns:
        Survival analysis data with KPIs and graphs, or None if not applicable
    """
    # Try to find file path
    if dataset_id in DATASET_REGISTRY:
        file_path = DATASET_REGISTRY[dataset_id]["file_path"]
    else:
        from pathlib import Path
        from app.utils.file_storage import UPLOAD_DIR
        
        possible_files = list(UPLOAD_DIR.glob(f"*{dataset_id}*"))
        if not possible_files:
            possible_files = list(UPLOAD_DIR.glob("*.csv"))
        
        if not possible_files:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
        
        file_path = str(max(possible_files, key=lambda p: p.stat().st_mtime))
    
    try:
        # Check if dataset has survival data columns
        df = pd.read_csv(file_path)
        
        print(f"[INFO] Dataset columns: {list(df.columns)}")
        print(f"[INFO] Number of rows: {len(df)}")
        
        # Normalize column names to lowercase for matching
        df.columns = df.columns.str.strip().str.lower()
        
        # Check for time and event columns (standard survival analysis)
        # Accept 'status' as alternative to 'event'
        has_time = 'time' in df.columns
        has_event = 'event' in df.columns or 'status' in df.columns
        has_time_event = has_time and has_event
        
        # If status column exists, rename it to event
        if 'status' in df.columns and 'event' not in df.columns:
            print(f"[INFO] Found 'status' column, renaming to 'event'")
            df.rename(columns={'status': 'event'}, inplace=True)
        
        # Normalize event coding to standard 0=censored, 1=event
        if has_time_event and 'event' in df.columns:
            unique_values = sorted(df['event'].dropna().unique())
            print(f"[INFO] Event/status unique values: {unique_values}")
            
            # Detect coding scheme
            if set(unique_values) == {1, 2}:
                # Reverse coding: 1=censored, 2=event
                print(f"[INFO] Detected reverse coding (1=censored, 2=event)")
                print(f"[INFO] Converting to standard coding (0=censored, 1=event)")
                df['event'] = df['event'].apply(lambda x: 0 if x == 1 else 1 if x == 2 else x)
            elif set(unique_values) == {0, 1}:
                # Standard coding: 0=censored, 1=event
                print(f"[INFO] Using standard coding (0=censored, 1=event)")
            elif len(unique_values) == 2:
                # Unknown coding with 2 values - assume lower=censored, higher=event
                lower, higher = unique_values[0], unique_values[1]
                print(f"[INFO] Detected custom coding ({lower}=censored, {higher}=event)")
                print(f"[INFO] Converting to standard coding (0=censored, 1=event)")
                df['event'] = df['event'].apply(lambda x: 0 if x == lower else 1 if x == higher else x)
            else:
                print(f"[WARN] Warning: Unexpected event values: {unique_values}")
                print(f"[INFO] Assuming highest value = event, others = censored")
                max_val = max(unique_values)
                df['event'] = df['event'].apply(lambda x: 1 if x == max_val else 0)
        
        # Check for date-based survival data (LIFE, BIRTH, DEATH, ENTRY)
        has_date_columns = all(col in df.columns for col in ['life', 'birth', 'death'])
        
        print(f"[INFO] Has time/event columns: {has_time_event}")
        print(f"[INFO] Has LIFE/BIRTH/DEATH columns: {has_date_columns}")
        
        if not has_time_event and not has_date_columns:
            print(f"[WARN] No survival columns found. Dataset cannot be used for survival analysis.")
            print(f"[INFO] Looking for: 'time' + ('event' or 'status') OR 'life' + 'birth' + 'death'")
            return {
                "has_survival_data": False,
                "message": "Dataset does not contain survival analysis columns"
            }
        
        # Save the normalized dataframe to a temporary file
        if has_time_event:
            print(f"[INFO] Found survival columns: time and event")
            import tempfile
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False)
            df.to_csv(temp_file.name, index=False)
            file_path = temp_file.name
            print(f"[INFO] Saved normalized data to temp file: {file_path}")
        
        
        # If we have date columns, convert to time/event format
        if has_date_columns and not has_time_event:
            print(f"[INFO] Converting date columns to time/event format")
            # Convert dates to datetime
            df['BIRTH'] = pd.to_datetime(df['BIRTH'], errors='coerce')
            df['DEATH'] = pd.to_datetime(df['DEATH'], errors='coerce')
            
            # For censored observations, use ENTRY date or a reference date
            if 'ENTRY' in df.columns:
                df['ENTRY'] = pd.to_datetime(df['ENTRY'], errors='coerce')
                # For censored: time from BIRTH to ENTRY
                # For events: time from BIRTH to DEATH
                df['time'] = df.apply(
                    lambda row: (row['DEATH'] - row['BIRTH']).days / 365.25 
                    if pd.notna(row['DEATH']) 
                    else (row['ENTRY'] - row['BIRTH']).days / 365.25 
                    if pd.notna(row['ENTRY'])
                    else None,
                    axis=1
                )
            else:
                # If no ENTRY, use current date for censored observations
                from datetime import datetime
                current_date = pd.Timestamp(datetime.now())
                df['time'] = df.apply(
                    lambda row: (row['DEATH'] - row['BIRTH']).days / 365.25 
                    if pd.notna(row['DEATH']) 
                    else (current_date - row['BIRTH']).days / 365.25,
                    axis=1
                )
            
            # Event indicator (1 if death occurred, 0 if censored)
            df['event'] = df['DEATH'].notna().astype(int)
            
            # Remove rows with invalid time
            df = df[df['time'].notna() & (df['time'] > 0)]
            
            print(f"[INFO] Converted: {len(df)} rows, {df['event'].sum()} events, {(~df['event'].astype(bool)).sum()} censored")
            print(f"[INFO] Time range: {df['time'].min():.2f} to {df['time'].max():.2f} years")
            print(f"[INFO] Unique time points: {df['time'].nunique()}")
            
            # Save temporary file with time/event columns
            import tempfile
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False)
            df.to_csv(temp_file.name, index=False)
            file_path = temp_file.name
        
        # Compute survival analysis
        from app.services.survival_models import compute_survival_dashboard
        
        print(f"[INFO] Computing survival analysis...")
        survival_data = compute_survival_dashboard(file_path)
        
        print(f"[INFO] Survival data computed:")
        print(f"[INFO] - Meta: {survival_data.get('meta', {})}")
        print(f"[INFO] - KM timeline length: {len(survival_data.get('overall_km', {}).get('timeline', []))}")
        print(f"[INFO] - KM survival length: {len(survival_data.get('overall_km', {}).get('survival', []))}")
        
        return {
            "has_survival_data": True,
            "survival_analysis": survival_data
        }
    
    except Exception as e:
        # If survival analysis fails, return that it's not applicable
        return {
            "has_survival_data": False,
            "message": f"Survival analysis not applicable: {str(e)}"
        }


def get_dataset_path(dataset_id: str) -> str:
    """
    Get file path for a dataset ID.
    
    Args:
        dataset_id: The dataset ID
        
    Returns:
        File path
        
    Raises:
        HTTPException: If dataset not found
    """
    # Reload from persistent storage to ensure we have latest data
    global DATASET_REGISTRY
    DATASET_REGISTRY = load_registry()
    
    if dataset_id not in DATASET_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found in registry")
    
    return DATASET_REGISTRY[dataset_id]["file_path"]


@router.get("/{dataset_id}/data-quality")
async def analyze_data_quality(dataset_id: str) -> Dict:
    """
    Analyze dataset quality and provide cleaning recommendations.
    
    Returns:
        {
            "dataset_info": {...},
            "quality_score": 85,
            "issues": {...},
            "recommendations": [...],
            "gemini_insights": {...}
        }
    """
    # Try to find file path
    if dataset_id in DATASET_REGISTRY:
        file_path = DATASET_REGISTRY[dataset_id]["file_path"]
    else:
        from pathlib import Path
        from app.utils.file_storage import UPLOAD_DIR
        
        possible_files = list(UPLOAD_DIR.glob(f"*{dataset_id}*"))
        if not possible_files:
            possible_files = list(UPLOAD_DIR.glob("*.csv"))
        
        if not possible_files:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
        
        file_path = str(max(possible_files, key=lambda p: p.stat().st_mtime))
    
    try:
        from app.services.data_cleaning_ai import analyze_dataset_quality
        
        print(f"[INFO] Analyzing data quality for dataset: {dataset_id}")
        analysis = analyze_dataset_quality(file_path)
        
        print(f"[INFO] Quality score: {analysis['quality_score']}")
        print(f"[INFO] Found {len(analysis['recommendations'])} recommendations")
        
        return analysis
    
    except Exception as e:
        print(f"[ERROR] Data quality analysis failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Quality analysis failed: {str(e)}")


@router.post("/{dataset_id}/apply-cleaning")
async def apply_data_cleaning(dataset_id: str, request: Dict) -> Dict:
    """
    Apply selected cleaning transformations to dataset.
    
    Request body:
        {
            "transformations": ["rec_001", "rec_002"],
            "recommendations": [...]  // Full recommendations list
        }
    
    Returns:
        {
            "cleaned_dataset_id": "ds_xxx_cleaned",
            "file_path": "...",
            "applied_transformations": [...],
            "quality_improvement": {...}
        }
    """
    # Try to find file path
    if dataset_id in DATASET_REGISTRY:
        file_path = DATASET_REGISTRY[dataset_id]["file_path"]
    else:
        from pathlib import Path
        from app.utils.file_storage import UPLOAD_DIR
        
        possible_files = list(UPLOAD_DIR.glob(f"*{dataset_id}*"))
        if not possible_files:
            possible_files = list(UPLOAD_DIR.glob("*.csv"))
        
        if not possible_files:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
        
        file_path = str(max(possible_files, key=lambda p: p.stat().st_mtime))
    
    try:
        from app.services.data_cleaning_ai import apply_cleaning_transformations
        from pathlib import Path
        import uuid
        
        # Get selected transformations
        selected_ids = request.get("transformations", [])
        recommendations = request.get("recommendations", [])
        
        if not selected_ids:
            raise HTTPException(status_code=400, detail="No transformations selected")
        
        if not recommendations:
            raise HTTPException(status_code=400, detail="Recommendations list required")
        
        print(f"[INFO] Applying {len(selected_ids)} transformations to dataset: {dataset_id}")
        
        # Create cleaned datasets directory
        backend_dir = Path(__file__).parent.parent.parent.parent
        cleaned_dir = backend_dir / "cleaned_datasets"
        cleaned_dir.mkdir(exist_ok=True)
        
        # Generate cleaned dataset ID and path
        cleaned_id = f"{dataset_id}_cleaned_{uuid.uuid4().hex[:8]}"
        output_path = str(cleaned_dir / f"{cleaned_id}.csv")
        
        # Apply transformations
        results = apply_cleaning_transformations(
            file_path, 
            recommendations, 
            selected_ids, 
            output_path
        )
        
        # Register cleaned dataset in persistent storage
        cleaned_metadata = {
            "dataset_id": cleaned_id,
            "filename": f"{cleaned_id}.csv",
            "file_path": output_path,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "original_dataset_id": dataset_id,
            "is_cleaned": True
        }
        register_dataset(cleaned_id, cleaned_metadata)
        
        # Also update in-memory cache
        DATASET_REGISTRY[cleaned_id] = cleaned_metadata
        
        print(f"[INFO] Cleaned dataset saved: {cleaned_id}")
        print(f"[INFO] Quality improvement: {results['quality_improvement']}")
        
        return {
            "cleaned_dataset_id": cleaned_id,
            "file_path": output_path,
            "applied_transformations": results["applied_transformations"],
            "quality_improvement": results["quality_improvement"],
            "changes_summary": results["changes_summary"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Data cleaning failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Data cleaning failed: {str(e)}")


# ============================================================================
# WORKSPACE PROFILING ENDPOINTS
# ============================================================================

@router.get("/{dataset_id}/profile")
async def get_dataset_profile(dataset_id: str) -> Dict:
    """
    Get comprehensive dataset profile including statistics, quality, and metadata.
    
    Returns:
        {
            "overview": {...},
            "columns": [...],
            "data_quality": {...},
            "sample_data": [...]
        }
    """
    # Try to find file path
    if dataset_id in DATASET_REGISTRY:
        file_path = DATASET_REGISTRY[dataset_id]["file_path"]
    else:
        from pathlib import Path
        from app.utils.file_storage import UPLOAD_DIR
        
        possible_files = list(UPLOAD_DIR.glob(f"*{dataset_id}*"))
        if not possible_files:
            possible_files = list(UPLOAD_DIR.glob("*.csv"))
        
        if not possible_files:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
        
        file_path = str(max(possible_files, key=lambda p: p.stat().st_mtime))
    
    try:
        from app.services.dataset_profiler import DatasetProfiler
        
        print(f"[INFO] Profiling dataset: {dataset_id}")
        profiler = DatasetProfiler(file_path)
        profile = profiler.get_full_profile()
        
        print(f"[INFO] Profile generated: {profile['overview']['total_rows']} rows, {profile['overview']['total_columns']} columns")
        return profile
    
    except Exception as e:
        print(f"[ERROR] Dataset profiling failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Profiling failed: {str(e)}")


@router.get("/{dataset_id}/correlations")
async def get_correlations(dataset_id: str) -> Dict:
    """
    Get correlation matrices for numeric and categorical variables.
    
    Returns:
        {
            "numeric_correlations": {
                "columns": [...],
                "matrix": [[...]],
                "strong_correlations": [...]
            },
            "categorical_correlations": {...}
        }
    """
    # Try to find file path
    if dataset_id in DATASET_REGISTRY:
        file_path = DATASET_REGISTRY[dataset_id]["file_path"]
    else:
        from pathlib import Path
        from app.utils.file_storage import UPLOAD_DIR
        
        possible_files = list(UPLOAD_DIR.glob(f"*{dataset_id}*"))
        if not possible_files:
            possible_files = list(UPLOAD_DIR.glob("*.csv"))
        
        if not possible_files:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
        
        file_path = str(max(possible_files, key=lambda p: p.stat().st_mtime))
    
    try:
        from app.services.dataset_profiler import DatasetProfiler
        
        print(f"[INFO] Computing correlations for dataset: {dataset_id}")
        profiler = DatasetProfiler(file_path)
        correlations = profiler.get_correlations()
        
        return correlations
    
    except Exception as e:
        print(f"[ERROR] Correlation analysis failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Correlation analysis failed: {str(e)}")


@router.get("/{dataset_id}/distributions")
async def get_distributions(dataset_id: str, column: str = None) -> Dict:
    """
    Get distribution data for histograms and box plots.
    
    Args:
        column: Optional column name to get distribution for specific column
    
    Returns:
        Distribution data for all columns or specific column
    """
    # Try to find file path
    if dataset_id in DATASET_REGISTRY:
        file_path = DATASET_REGISTRY[dataset_id]["file_path"]
    else:
        from pathlib import Path
        from app.utils.file_storage import UPLOAD_DIR
        
        possible_files = list(UPLOAD_DIR.glob(f"*{dataset_id}*"))
        if not possible_files:
            possible_files = list(UPLOAD_DIR.glob("*.csv"))
        
        if not possible_files:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
        
        file_path = str(max(possible_files, key=lambda p: p.stat().st_mtime))
    
    try:
        from app.services.dataset_profiler import DatasetProfiler
        
        print(f"[INFO] Getting distributions for dataset: {dataset_id}, column: {column}")
        profiler = DatasetProfiler(file_path)
        distributions = profiler.get_distributions(column)
        
        return distributions
    
    except Exception as e:
        print(f"[ERROR] Distribution analysis failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Distribution analysis failed: {str(e)}")


@router.get("/{dataset_id}/missing-heatmap")
async def get_missing_heatmap(dataset_id: str) -> Dict:
    """
    Get missing value heatmap data.
    
    Returns:
        {
            "matrix": [[...]],
            "row_labels": [...],
            "column_labels": [...],
            "missing_by_column": {...},
            "missing_by_row": [...],
            "total_cells": int,
            "missing_cells": int
        }
    """
    # Try to find file path
    if dataset_id in DATASET_REGISTRY:
        file_path = DATASET_REGISTRY[dataset_id]["file_path"]
    else:
        from pathlib import Path
        from app.utils.file_storage import UPLOAD_DIR
        
        possible_files = list(UPLOAD_DIR.glob(f"*{dataset_id}*"))
        if not possible_files:
            possible_files = list(UPLOAD_DIR.glob("*.csv"))
        
        if not possible_files:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
        
        file_path = str(max(possible_files, key=lambda p: p.stat().st_mtime))
    
    try:
        from app.services.dataset_profiler import DatasetProfiler
        
        print(f"[INFO] Generating missing value heatmap for dataset: {dataset_id}")
        profiler = DatasetProfiler(file_path)
        heatmap_data = profiler.get_missing_heatmap()
        
        print(f"[INFO] Heatmap generated: {heatmap_data['missing_cells']} missing cells out of {heatmap_data['total_cells']}")
        return heatmap_data
    
    except Exception as e:
        print(f"[ERROR] Missing heatmap generation failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Missing heatmap generation failed: {str(e)}")


@router.get("/{dataset_id}/data-dictionary")
async def get_data_dictionary(dataset_id: str) -> List[Dict]:
    """
    Get auto-generated data dictionary with column metadata and quality flags.
    
    Returns:
        [
            {
                "column_name": str,
                "data_type": str,
                "missing_count": int,
                "missing_percentage": float,
                "unique_values": int,
                "sample_values": [...],
                "description": str,
                "quality_flags": [...]
            },
            ...
        ]
    """
    # Try to find file path
    if dataset_id in DATASET_REGISTRY:
        file_path = DATASET_REGISTRY[dataset_id]["file_path"]
    else:
        from pathlib import Path
        from app.utils.file_storage import UPLOAD_DIR
        
        possible_files = list(UPLOAD_DIR.glob(f"*{dataset_id}*"))
        if not possible_files:
            possible_files = list(UPLOAD_DIR.glob("*.csv"))
        
        if not possible_files:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
        
        file_path = str(max(possible_files, key=lambda p: p.stat().st_mtime))
    
    try:
        from app.services.dataset_profiler import DatasetProfiler
        
        print(f"[INFO] Generating data dictionary for dataset: {dataset_id}")
        profiler = DatasetProfiler(file_path)
        dictionary = profiler.get_data_dictionary()
        
        # Integrate AI descriptions
        try:
            # Check cache first
            ai_analysis = AI_ANALYSIS_CACHE.get(dataset_id)
            
            if not ai_analysis:
                print(f"[INFO] Fetching AI analysis for dictionary enrichment...")
                # This might take a few seconds
                ai_analysis = analyze_with_gemini(file_path)
                AI_ANALYSIS_CACHE[dataset_id] = ai_analysis
            
            if ai_analysis and "column_purposes" in ai_analysis:
                ai_descriptions = ai_analysis["column_purposes"]
                print(f"[INFO] Enriching dictionary with {len(ai_descriptions)} AI descriptions")
                
                for entry in dictionary:
                    col_name = entry["column_name"]
                    # Try exact match or case-insensitive match
                    if col_name in ai_descriptions:
                        entry["description"] = ai_descriptions[col_name]
                        entry["ai_generated"] = True
                    else:
                        # Try finding case-insensitive match
                        for ai_col, desc in ai_descriptions.items():
                            if ai_col.lower() == col_name.lower():
                                entry["description"] = desc
                                entry["ai_generated"] = True
                                break
        except Exception as ai_err:
            print(f"[WARN] AI enrichment failed: {ai_err}")
            # Continue with rule-based descriptions
        
        print(f"[INFO] Data dictionary generated: {len(dictionary)} columns")
        return dictionary
    
    except Exception as e:
        print(f"[ERROR] Data dictionary generation failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Data dictionary generation failed: {str(e)}")

