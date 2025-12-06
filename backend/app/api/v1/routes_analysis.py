"""Analysis API routes for survival and chain-ladder analysis."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import pandas as pd
from pathlib import Path

from app.api.v1.routes_datasets import get_dataset_path
from app.utils.job_store import create_job, get_job, update_job, list_jobs, save_result, get_result
from app.services.survival_models import compute_survival_dashboard
from app.services.reserving_chainladder import run_chain_ladder_from_csv
from app.services.glm_models import run_glm_analysis
from app.services.time_series import run_time_series_analysis
from app.services.mortality_models import compute_mortality_dashboard
from app.services.nlq_service import process_nlq


# Redis/RQ setup
try:
    from redis import Redis
    from rq import Queue
    import os
    
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", "6379"))
    redis_password = os.getenv("REDIS_PASSWORD", None)
    
    redis_conn = Redis(
        host=redis_host,
        port=redis_port,
        password=redis_password,
        decode_responses=True,
        ssl=True if redis_password else False,  # Upstash requires SSL
        ssl_cert_reqs=None  # Upstash doesn't require cert verification
    )
    
    # Test connection
    redis_conn.ping()
    
    task_queue = Queue(connection=redis_conn)
    RQ_AVAILABLE = True
    print("[INFO] Redis/RQ available - jobs will be queued")
except Exception as e:
    print(f"[WARN] RQ not available, will run jobs synchronously: {e}")
    RQ_AVAILABLE = False
    task_queue = None

router = APIRouter(prefix="/api/v1", tags=["analysis"])


class SurvivalRequest(BaseModel):
    dataset_id: str
    strata_col: Optional[str] = None


class ChainLadderRequest(BaseModel):
    dataset_id: str


class GLMRequest(BaseModel):
    dataset_id: str
    target_col: str
    feature_cols: Optional[List[str]] = None
    family: str = "auto"  # 'auto', 'poisson', 'negativebinomial', 'gamma'
    strata_col: Optional[str] = None


class TimeSeriesRequest(BaseModel):
    dataset_id: str
    date_col: Optional[str] = None  # Auto-detect if None
    value_col: Optional[str] = None  # Auto-detect if None
    forecast_periods: int = 12
    model_type: str = "auto"  # 'auto', 'arima', 'sarima', 'holt_winters', 'prophet'
    confidence_level: float = 0.95


class NLQRequest(BaseModel):
    dataset_id: str
    query: str


@router.post("/analysis/survival", status_code=202)
async def start_survival_analysis(request: SurvivalRequest) -> Dict:
    """
    Start survival analysis (enqueued).
    
    Returns:
        {
            "job_id": "job_<8hex>",
            "status": "queued"
        }
    """
    # Get dataset path
    csv_path = get_dataset_path(request.dataset_id)
    
    # Create job
    job = create_job(
        dataset_id=request.dataset_id,
        analysis_type="survival",
        params={"strata_col": request.strata_col}
    )
    
    # Enqueue or run synchronously
    if RQ_AVAILABLE and task_queue:
        # Enqueue job
        task_queue.enqueue(
            process_survival_job,
            job["job_id"],
            csv_path,
            request.strata_col,
            job_timeout='10m'
        )
    else:
        # Run synchronously (fallback for dev)
        process_survival_job(job["job_id"], csv_path, request.strata_col)
    
    return {
        "job_id": job["job_id"],
        "status": "queued"
    }


@router.post("/analysis/chainladder")
async def run_chainladder_analysis(request: ChainLadderRequest) -> Dict:
    """
    Run chain-ladder analysis (synchronous).
    
    Returns:
        {
            "development_factors": [1.2, 1.1, 1.03],
            "n_origin": 3,
            "n_dev": 3,
            "reserve_estimate": 12345.67
        }
    """
    # Get dataset path
    csv_path = get_dataset_path(request.dataset_id)
    
    try:
        result = run_chain_ladder_from_csv(csv_path)
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chain-ladder analysis failed: {str(e)}")


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str) -> Dict:
    """
    Get job status.
    
    Returns:
        {
            "job_id": "job_abc123",
            "status": "finished",
            "result_url": "/api/v1/analysis/results/job_abc123"
        }
    """
    try:
        job = get_job(job_id)
        
        response = {
            "job_id": job["job_id"],
            "status": job["status"]
        }
        
        if job["status"] == "finished":
            response["result_url"] = f"/api/v1/analysis/results/{job_id}"
        
        if job.get("error"):
            response["error"] = job["error"]
        
        return response
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")


@router.get("/jobs")
async def list_all_jobs() -> list:
    """
    List all jobs.
    
    Returns:
        List of job metadata
    """
    return list_jobs()


@router.get("/analysis/results/{job_id}")
async def get_analysis_result(job_id: str) -> Dict:
    """
    Get analysis result JSON.
    
    Returns:
        {
            "meta": {...},
            "overall_km": {...},
            "life_table": [...],
            "nelson_aalen": {...},
            "strata": {...},
            "cox": {...}
        }
    """
    try:
        result = get_result(job_id)
        return result
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Result for job {job_id} not found")


@router.get("/analysis/results/{job_id}/life_table.csv")
async def download_life_table_csv(job_id: str):
    """
    Download life table as CSV.
    """
    try:
        result = get_result(job_id)
        
        if "life_table" not in result or not result["life_table"]:
            raise HTTPException(status_code=404, detail="Life table not available")
        
        # Convert to DataFrame and CSV
        df = pd.DataFrame(result["life_table"])
        
        # Save to temp file
        csv_path = Path(f"backend/analysis_results/{job_id}_life_table.csv")
        df.to_csv(csv_path, index=False)
        
        return FileResponse(
            path=str(csv_path),
            filename=f"{job_id}_life_table.csv",
            media_type="text/csv"
        )
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Result for job {job_id} not found")


@router.get("/analysis/results/{job_id}/download")
async def download_result_json(job_id: str):
    """
    Download full result JSON.
    """
    try:
        result = get_result(job_id)
        
        return JSONResponse(
            content=result,
            headers={
                "Content-Disposition": f"attachment; filename={job_id}_result.json"
            }
        )
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Result for job {job_id} not found")


def process_survival_job(job_id: str, csv_path: str, strata_col: Optional[str] = None):
    """
    Process survival analysis job (called by RQ worker or synchronously).
    
    Args:
        job_id: Job ID
        csv_path: Path to CSV file
        strata_col: Optional stratification column
    """
    try:
        # Update status to started
        update_job(job_id, status="started")
        
        # Run analysis
        result = compute_survival_dashboard(csv_path, strata_col)
        
        # Save result
        result_path = save_result(job_id, result)
        
        # Update job to finished
        update_job(job_id, status="finished", result_path=result_path)
    
    except Exception as e:
        # Update job to failed
        update_job(job_id, status="failed", error=str(e))
        raise


@router.post("/analysis/glm", status_code=202)
async def start_glm_analysis(request: GLMRequest) -> Dict:
    """
    Start GLM analysis (enqueued).
    
    Returns:
        {
            "job_id": "job_<8hex>",
            "status": "queued"
        }
    """
    # Get dataset path
    csv_path = get_dataset_path(request.dataset_id)
    
    # Create job
    job = create_job(
        dataset_id=request.dataset_id,
        analysis_type="glm",
        params={
            "target_col": request.target_col,
            "feature_cols": request.feature_cols,
            "family": request.family,
            "strata_col": request.strata_col
        }
    )
    
    # Enqueue or run synchronously
    if RQ_AVAILABLE and task_queue:
        # Enqueue job
        task_queue.enqueue(
            process_glm_job,
            job["job_id"],
            csv_path,
            request.target_col,
            request.feature_cols,
            request.family,
            request.strata_col,
            job_timeout='15m'
        )
    else:
        # Run synchronously (fallback for dev)
        process_glm_job(
            job["job_id"],
            csv_path,
            request.target_col,
            request.feature_cols,
            request.family,
            request.strata_col
        )
    
    return {
        "job_id": job["job_id"],
        "status": "queued"
    }


@router.get("/analysis/glm-results/{job_id}")
async def get_glm_results(job_id: str) -> Dict:
    """
    Get GLM analysis results.
    
    Returns:
        {
            "model_info": {...},
            "coefficients": [...],
            "goodness_of_fit": {...},
            "residuals": {...},
            "feature_importance": [...],
            "partial_dependence": {...},
            "predictions": {...}
        }
    """
    try:
        result = get_result(job_id)
        return result
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"GLM result for job {job_id} not found")


def process_glm_job(
    job_id: str,
    csv_path: str,
    target_col: str,
    feature_cols: Optional[List[str]] = None,
    family: str = 'auto',
    strata_col: Optional[str] = None
):
    """
    Process GLM analysis job (called by RQ worker or synchronously).
    
    Args:
        job_id: Job ID
        csv_path: Path to CSV file
        target_col: Target variable column name
        feature_cols: Optional list of feature columns
        family: Model family
        strata_col: Optional stratification column
    """
    try:
        # Update status to started
        update_job(job_id, status="started")
        
        # Run GLM analysis
        result = run_glm_analysis(
            csv_path,
            target_col,
            feature_cols,
            family,
            strata_col
        )
        
        # Save result
        result_path = save_result(job_id, result)
        
        # Update job to finished
        update_job(job_id, status="finished", result_path=result_path)
    
    except Exception as e:
        # Update job to failed
        update_job(job_id, status="failed", error=str(e))
        raise


@router.post("/analysis/timeseries", status_code=202)
async def start_timeseries_analysis(request: TimeSeriesRequest) -> Dict:
    """
    Start time-series forecasting analysis (enqueued).
    
    Returns:
        {
            "job_id": "job_<8hex>",
            "status": "queued"
        }
    """
    # Get dataset path with fallback
    from app.api.v1.routes_datasets import DATASET_REGISTRY
    from app.utils.file_storage import UPLOAD_DIR
    from pathlib import Path
    
    if request.dataset_id in DATASET_REGISTRY:
        csv_path = DATASET_REGISTRY[request.dataset_id]["file_path"]
    else:
        # Search in uploaded_files directory
        possible_files = list(UPLOAD_DIR.glob(f"*{request.dataset_id}*"))
        if not possible_files:
            possible_files = list(UPLOAD_DIR.glob("*.csv"))
        
        if not possible_files:
            raise HTTPException(status_code=404, detail=f"Dataset {request.dataset_id} not found")
        
        csv_path = str(max(possible_files, key=lambda p: p.stat().st_mtime))
    
    # Create job
    job_id = create_job(
        dataset_id=request.dataset_id,
        analysis_type="timeseries",
        params={
            "date_col": request.date_col,
            "value_col": request.value_col,
            "forecast_periods": request.forecast_periods,
            "model_type": request.model_type,
            "confidence_level": request.confidence_level
        }
    )
    
    # Enqueue or run synchronously
    if RQ_AVAILABLE and task_queue:
        # Enqueue job
        task_queue.enqueue(
            process_timeseries_job,
            job_id,
            csv_path,
            request.date_col,
            request.value_col,
            request.forecast_periods,
            request.model_type,
            request.confidence_level,
            job_timeout='15m'
        )
    else:
        # Run synchronously (fallback for dev)
        process_timeseries_job(
            job_id,
            csv_path,
            request.date_col,
            request.value_col,
            request.forecast_periods,
            request.model_type,
            request.confidence_level
        )
    
    return {"job_id": job_id}


@router.get("/analysis/timeseries/results/{job_id}")
async def get_timeseries_results(job_id: str) -> Dict:
    """
    Get time-series forecast results.
    
    Returns:
        {
            "model_type": "arima|sarima|holt_winters|prophet",
            "forecast": {...},
            "historical": {...},
            "decomposition": {...},
            "metrics": {...},
            "seasonality": {...}
        }
    """
    try:
        result = get_result(job_id)
        return result
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Time-series result for job {job_id} not found")


def process_timeseries_job(
    job_id: str,
    csv_path: str,
    date_col: Optional[str] = None,
    value_col: Optional[str] = None,
    forecast_periods: int = 12,
    model_type: str = 'auto',
    confidence_level: float = 0.95
):
    """
    Process time-series forecasting job (called by RQ worker or synchronously).
    
    Args:
        job_id: Job ID
        csv_path: Path to CSV file
        date_col: Date column name (auto-detected if None)
        value_col: Value column name (auto-detected if None)
        forecast_periods: Number of periods to forecast
        model_type: Model type ('auto', 'arima', 'sarima', 'holt_winters', 'prophet')
        confidence_level: Confidence level for intervals
    """
    try:
        # Update status to started
        update_job(job_id, status="started")
        
        # Run time-series analysis
        result = run_time_series_analysis(
            csv_path,
            date_col,
            value_col,
            forecast_periods,
            model_type
        )
        
        # Save result
        result_path = save_result(job_id, result)
        
        # Update job to finished
        update_job(job_id, status="finished", result_path=result_path)
    
    except Exception as e:
        # Update job to failed
        update_job(job_id, status="failed", error=str(e))
        raise


class MortalityRequest(BaseModel):
    dataset_id: str
    graduation_method: str = "whittaker"  # 'whittaker', 'moving_average', 'spline'
    fit_models: bool = True  # Whether to fit Gompertz/Makeham


@router.post("/analysis/mortality")
async def analyze_mortality_table(request: MortalityRequest) -> Dict:
    """
    Analyze mortality table with life table computations, graduation, and model fitting.
    
    Returns:
        {
            "raw_data": {...},
            "life_table": [...],
            "graduated": {...},
            "fitted_models": {...},
            "kpis": {...}
        }
    """
    # Get dataset path with fallback
    from app.api.v1.routes_datasets import DATASET_REGISTRY
    from app.utils.file_storage import UPLOAD_DIR
    from pathlib import Path
    
    if request.dataset_id in DATASET_REGISTRY:
        csv_path = DATASET_REGISTRY[request.dataset_id]["file_path"]
    else:
        # Search in uploaded_files directory
        possible_files = list(UPLOAD_DIR.glob(f"*{request.dataset_id}*"))
        if not possible_files:
            possible_files = list(UPLOAD_DIR.glob("*.csv"))
        
        if not possible_files:
            raise HTTPException(status_code=404, detail=f"Dataset {request.dataset_id} not found")
        
        csv_path = str(max(possible_files, key=lambda p: p.stat().st_mtime))
    
    try:
        # Compute comprehensive mortality analytics
        result = compute_mortality_dashboard(csv_path)
        
        return result
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Mortality analysis failed: {str(e)}")


@router.get("/analysis/mortality/{dataset_id}")
async def get_mortality_analysis(dataset_id: str) -> Dict:
    """
    Get mortality analysis for a dataset.
    Convenience endpoint that calls the POST endpoint internally.
    """
    request = MortalityRequest(dataset_id=dataset_id)
    return await analyze_mortality_table(request)


# ============================================================================
# ML SURVIVAL MODELS ENDPOINTS
# ============================================================================

class MLSurvivalRequest(BaseModel):
    dataset_id: str
    time_col: str = 'time'
    event_col: str = 'event'
    feature_cols: Optional[List[str]] = None
    model_type: str = 'random_survival_forest'  # 'random_survival_forest', 'gradient_boosted', 'coxnet', 'compare_all'


class IndividualPredictionRequest(BaseModel):
    dataset_id: str
    features: Dict[str, float]
    time_col: str = 'time'
    event_col: str = 'event'
    model_type: str = 'random_survival_forest'


@router.post("/analysis/ml-survival/train", status_code=202)
async def train_ml_survival_model(request: MLSurvivalRequest) -> Dict:
    """
    Train ML-based survival model (Random Forest, Gradient Boosting, or CoxNet).
    
    Returns:
        {
            "job_id": "job_<8hex>",
            "status": "queued"
        }
    """
    # Get dataset path
    csv_path = get_dataset_path(request.dataset_id)
    
    # Create job
    job = create_job(
        dataset_id=request.dataset_id,
        analysis_type="ml_survival",
        params={
            "time_col": request.time_col,
            "event_col": request.event_col,
            "feature_cols": request.feature_cols,
            "model_type": request.model_type
        }
    )
    
    # Enqueue or run synchronously
    if RQ_AVAILABLE and task_queue:
        task_queue.enqueue(
            process_ml_survival_job,
            job["job_id"],
            csv_path,
            request.time_col,
            request.event_col,
            request.feature_cols,
            request.model_type,
            job_timeout='20m'
        )
    else:
        process_ml_survival_job(
            job["job_id"],
            csv_path,
            request.time_col,
            request.event_col,
            request.feature_cols,
            request.model_type
        )
    
    return {
        "job_id": job["job_id"],
        "status": "queued"
    }


@router.post("/analysis/ml-survival/compare")
async def compare_ml_survival_models(request: MLSurvivalRequest) -> Dict:
    """
    Compare multiple survival models (KM, Cox, RSF, GBS, CoxNet).
    
    Returns comprehensive comparison with concordance indices and best model.
    """
    csv_path = get_dataset_path(request.dataset_id)
    
    try:
        from app.services.ml_survival import compare_survival_models
        
        result = compare_survival_models(
            csv_path,
            request.time_col,
            request.event_col,
            request.feature_cols
        )
        
        return result
    
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail="scikit-survival not installed. Install with: pip install scikit-survival"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"ML survival comparison failed: {str(e)}")


@router.post("/analysis/ml-survival/predict-individual")
async def predict_individual_survival_curve(request: IndividualPredictionRequest) -> Dict:
    """
    Predict survival curve for an individual with given features.
    
    Returns:
        {
            "model_type": "random_survival_forest",
            "features": {...},
            "timeline": [...],
            "survival_probability": [...],
            "median_survival": 12.5
        }
    """
    csv_path = get_dataset_path(request.dataset_id)
    
    try:
        from app.services.ml_survival import predict_individual_survival
        
        result = predict_individual_survival(
            csv_path,
            request.features,
            request.time_col,
            request.event_col,
            request.model_type
        )
        
        return result
    
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail="scikit-survival not installed. Install with: pip install scikit-survival"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Individual prediction failed: {str(e)}")


@router.get("/analysis/ml-survival/results/{job_id}")
async def get_ml_survival_results(job_id: str) -> Dict:
    """
    Get ML survival model results.
    
    Returns:
        {
            "model_type": "random_survival_forest",
            "train_c_index": 0.85,
            "test_c_index": 0.82,
            "variable_importance": [...],
            "predictions": [...]
        }
    """
    try:
        result = get_result(job_id)
        return result
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"ML survival result for job {job_id} not found")


def process_ml_survival_job(
    job_id: str,
    csv_path: str,
    time_col: str = 'time',
    event_col: str = 'event',
    feature_cols: Optional[List[str]] = None,
    model_type: str = 'random_survival_forest'
):
    """
    Process ML survival model training job.
    
    Args:
        job_id: Job ID
        csv_path: Path to CSV file
        time_col: Time column name
        event_col: Event column name
        feature_cols: Feature columns
        model_type: Model type to train
    """
    try:
        # Update status to started
        update_job(job_id, status="started")
        
        # Import ML survival functions
        from app.services.ml_survival import (
            train_random_survival_forest,
            train_gradient_boosted_survival,
            train_coxnet_model,
            compare_survival_models
        )
        
        # Train model based on type
        if model_type == 'compare_all':
            result = compare_survival_models(csv_path, time_col, event_col, feature_cols)
        elif model_type == 'random_survival_forest':
            result = train_random_survival_forest(csv_path, time_col, event_col, feature_cols)
        elif model_type == 'gradient_boosted':
            result = train_gradient_boosted_survival(csv_path, time_col, event_col, feature_cols)
        elif model_type == 'coxnet':
            result = train_coxnet_model(csv_path, time_col, event_col, feature_cols)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        # Save result
        result_path = save_result(job_id, result)
        
        # Update job to finished
        update_job(job_id, status="finished", result_path=result_path)
    
    except Exception as e:
        # Update job to failed
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        update_job(job_id, status="failed", error=error_msg)
        raise


# ============================================================================
# AI-POWERED REPORT GENERATION ENDPOINTS
# ============================================================================

class ReportRequest(BaseModel):
    job_id: Optional[str] = None
    dataset_id: Optional[str] = None
    analysis_type: Optional[str] = None
    results: Optional[Dict[str, Any]] = None
    format: str = "pdf"  # 'pdf' or 'docx'


@router.post("/analysis/generate-report")
async def generate_report_from_job(request: ReportRequest):
    """
    Generate AI-powered comprehensive report from analysis results.
    
    Can be called with either:
    1. job_id - Generate report from saved job results
    2. analysis_type + results + dataset_id - Generate report from provided results
    
    Args:
        request: ReportRequest with job_id OR (analysis_type, results, dataset_id)
        
    Returns:
        FileResponse with PDF or Word document
    """
    try:
        from app.services.report_generator import generate_analysis_report
        
        # Get results from job_id or use provided results
        if request.job_id:
            # Get results from job
            result = get_result(request.job_id)
            job = get_job(request.job_id)
            analysis_type = job.get("analysis_type", "unknown")
            dataset_id = job.get("dataset_id", "unknown")
        elif request.results and request.analysis_type and request.dataset_id:
            # Use provided results
            result = request.results
            analysis_type = request.analysis_type
            dataset_id = request.dataset_id
        else:
            raise HTTPException(
                status_code=400,
                detail="Must provide either job_id OR (analysis_type, results, dataset_id)"
            )
        
        # Generate report
        report_path = generate_analysis_report(
            analysis_type=analysis_type,
            results=result,
            dataset_id=dataset_id,
            format=request.format
        )
        
        # Determine media type
        media_type = "application/pdf" if request.format == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        
        # Return file
        return FileResponse(
            path=report_path,
            filename=Path(report_path).name,
            media_type=media_type
        )
    
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Report generation dependencies not installed: {str(e)}"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.get("/analysis/report/{job_id}")
async def get_report_for_job(job_id: str, format: str = "pdf"):
    """
    Generate and download report for a specific job.
    
    Args:
        job_id: Job ID
        format: Report format ('pdf' or 'docx')
        
    Returns:
        FileResponse with generated report
    """
    request = ReportRequest(job_id=job_id, format=format)
    return await generate_report_from_job(request)


@router.api_route("/analysis/survival/report", methods=["GET", "POST"])
async def generate_survival_report(dataset_id: str, format: str = "pdf"):
    """
    Generate report for survival analysis.
    Runs analysis and generates report in one step.
    """
    # Run survival analysis
    survival_request = SurvivalRequest(dataset_id=dataset_id)
    job_response = await start_survival_analysis(survival_request)
    job_id = job_response["job_id"]
    
    # Wait for job to complete (with timeout)
    import time
    max_wait = 60  # 60 seconds
    waited = 0
    while waited < max_wait:
        job = get_job(job_id)
        if job["status"] == "finished":
            break
        elif job["status"] == "failed":
            raise HTTPException(status_code=500, detail=f"Analysis failed: {job.get('error')}")
        time.sleep(2)
        waited += 2
    
    if job["status"] != "finished":
        raise HTTPException(status_code=408, detail="Analysis timeout")
    
    # Generate report
    return await get_report_for_job(job_id, format)


@router.api_route("/analysis/glm/report", methods=["GET", "POST"])
async def generate_glm_report(
    dataset_id: str,
    target_col: str,
    feature_cols: Optional[List[str]] = None,
    family: str = "auto",
    format: str = "pdf"
):
    """
    Generate report for GLM analysis.
    Runs analysis and generates report in one step.
    """
    # Run GLM analysis
    glm_request = GLMRequest(
        dataset_id=dataset_id,
        target_col=target_col,
        feature_cols=feature_cols,
        family=family
    )
    job_response = await start_glm_analysis(glm_request)
    job_id = job_response["job_id"]
    
    # Wait for job to complete
    import time
    max_wait = 90  # 90 seconds
    waited = 0
    while waited < max_wait:
        job = get_job(job_id)
        if job["status"] == "finished":
            break
        elif job["status"] == "failed":
            raise HTTPException(status_code=500, detail=f"Analysis failed: {job.get('error')}")
        time.sleep(2)
        waited += 2
    
    if job["status"] != "finished":
        raise HTTPException(status_code=408, detail="Analysis timeout")
    
    # Generate report
    return await get_report_for_job(job_id, format)


@router.api_route("/analysis/ml-survival/report", methods=["GET", "POST"])
async def generate_ml_survival_report(
    dataset_id: str,
    time_col: str = 'time',
    event_col: str = 'event',
    feature_cols: Optional[List[str]] = None,
    model_type: str = 'random_survival_forest',
    format: str = "pdf"
):
    """
    Generate report for ML survival analysis.
    Runs analysis and generates report in one step.
    """
    # Run ML survival analysis
    ml_request = MLSurvivalRequest(
        dataset_id=dataset_id,
        time_col=time_col,
        event_col=event_col,
        feature_cols=feature_cols,
        model_type=model_type
    )
    job_response = await train_ml_survival_model(ml_request)
    job_id = job_response["job_id"]
    
    # Wait for job to complete
    import time
    max_wait = 120  # 120 seconds
    waited = 0
    while waited < max_wait:
        job = get_job(job_id)
        if job["status"] == "finished":
            break
        elif job["status"] == "failed":
            raise HTTPException(status_code=500, detail=f"Analysis failed: {job.get('error')}")
        time.sleep(2)
        waited += 2
    
    if job["status"] != "finished":
        raise HTTPException(status_code=408, detail="Analysis timeout")
    
    # Generate report
    return await get_report_for_job(job_id, format)


@router.api_route("/analysis/mortality/report", methods=["GET", "POST"])
async def generate_mortality_report(dataset_id: str, format: str = "pdf"):
    """
    Generate report for mortality analysis.
    Runs analysis and generates report in one step.
    """
    try:
        # Run mortality analysis
        mortality_request = MortalityRequest(dataset_id=dataset_id)
        result = await analyze_mortality_table(mortality_request)
        
        # Generate report directly from results
        from app.services.report_generator import generate_analysis_report
        
        report_path = generate_analysis_report(
            analysis_type="mortality",
            results=result,
            dataset_id=dataset_id,
            format=format
        )
        
        media_type = "application/pdf" if format == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        
        return FileResponse(
            path=report_path,
            filename=Path(report_path).name,
            media_type=media_type
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.api_route("/analysis/timeseries/report", methods=["GET", "POST"])
async def generate_timeseries_report(
    dataset_id: str,
    date_col: Optional[str] = None,
    value_col: Optional[str] = None,
    forecast_periods: int = 12,
    model_type: str = "auto",
    format: str = "pdf"
):
    """
    Generate report for time-series analysis.
    Runs analysis and generates report in one step.
    """
    # Run time-series analysis
    ts_request = TimeSeriesRequest(
        dataset_id=dataset_id,
        date_col=date_col,
        value_col=value_col,
        forecast_periods=forecast_periods,
        model_type=model_type
    )
    job_response = await start_timeseries_analysis(ts_request)
    job_id = job_response["job_id"]
    
    # Wait for job to complete
    import time
    max_wait = 90  # 90 seconds
    waited = 0
    while waited < max_wait:
        job = get_job(job_id)
        if job["status"] == "finished":
            break
        elif job["status"] == "failed":
            raise HTTPException(status_code=500, detail=f"Analysis failed: {job.get('error')}")
        time.sleep(2)
        waited += 2
    
    if job["status"] != "finished":
        raise HTTPException(status_code=408, detail="Analysis timeout")
    
    # Generate report
    return await get_report_for_job(job_id, format)


# ============================================================================
# NATURAL LANGUAGE QUERY ENDPOINT
# ============================================================================

@router.post("/nlq")
async def process_natural_language_query(request: NLQRequest) -> Dict:
    """
    Process natural language query and return chart data.
    
    Args:
        request: NLQRequest with dataset_id and query
    
    Returns:
        {
            "chart_type": "bar|line|scatter|histogram|pie",
            "chart_data": {...},  # Chart.js compatible data
            "reasoning": "AI explanation",
            "columns_used": ["col1", "col2"],
            "title": "Chart title"
        }
    
    Example queries:
        - "Plot claim severity by age"
        - "Show distribution of claim amounts"
        - "Compare survival curves across treatment groups"
        - "Bar chart of frequency by region"
    """
    try:
        # Get dataset path
        csv_path = get_dataset_path(request.dataset_id)
        
        # Process query
        print(f"[INFO] Processing NLQ: '{request.query}' for dataset {request.dataset_id}")
        result = process_nlq(csv_path, request.query)
        
        print(f"[INFO] NLQ processed successfully: {result['chart_type']}")
        return result
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Dataset {request.dataset_id} not found")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")
