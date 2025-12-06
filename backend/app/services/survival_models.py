"""Survival analysis models using lifelines library."""
import pandas as pd
import numpy as np
from typing import Dict, Optional, List, Any
from lifelines import KaplanMeierFitter, NelsonAalenFitter, CoxPHFitter
from lifelines.statistics import multivariate_logrank_test
from pathlib import Path


def compute_survival_dashboard(csv_path: str, strata_col: Optional[str] = None) -> Dict[str, Any]:
    """
    Compute comprehensive survival analysis dashboard.
    
    Args:
        csv_path: Path to CSV file with survival data
        strata_col: Optional column name for stratified analysis
        
    Returns:
        Dictionary with meta, overall_km, life_table, nelson_aalen, strata, cox
        
    Raises:
        ValueError: If required columns are missing or invalid
    """
    # Load data
    df = pd.read_csv(csv_path)
    
    # Auto-detect time column
    time_col = None
    time_candidates = ['time', 'duration', 'TIME', 'DURATION', 'Time', 'Duration', 'survival_time', 'follow_up']
    for col in time_candidates:
        if col in df.columns:
            time_col = col
            break
    
    if time_col is None:
        # Try to find any numeric column that might represent time
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if numeric_cols:
            time_col = numeric_cols[0]  # Use first numeric column as fallback
        else:
            raise ValueError(f"CSV must contain a time column. Tried: {time_candidates}")
    
    # Auto-detect event column
    event_col = None
    event_candidates = ['event', 'status', 'EVENT', 'STATUS', 'Event', 'Status', 'DEATH', 'death', 'Death', 'censored']
    for col in event_candidates:
        if col in df.columns:
            event_col = col
            break
    
    if event_col is None:
        # Try to find a binary column (0/1 values)
        for col in df.columns:
            if col != time_col and df[col].dtype in [np.int64, np.float64]:
                unique_vals = df[col].dropna().unique()
                if len(unique_vals) <= 2 and set(unique_vals).issubset({0, 1, 0.0, 1.0}):
                    event_col = col
                    break
        
        if event_col is None:
            raise ValueError(f"CSV must contain an event/status column. Tried: {event_candidates}")
    
    # Rename columns to standard names for processing
    df = df.rename(columns={time_col: 'time', event_col: 'event'})
    
    # Log detected columns
    print(f"[INFO] Detected time column: '{time_col}' -> 'time'")
    print(f"[INFO] Detected event column: '{event_col}' -> 'event'")

    
    # Ensure numeric types
    df['time'] = pd.to_numeric(df['time'], errors='coerce')
    df['event'] = pd.to_numeric(df['event'], errors='coerce')
    
    # Drop rows with missing time or event
    df = df.dropna(subset=['time', 'event'])
    
    if len(df) == 0:
        raise ValueError("No valid data rows after cleaning")
    
    # Compute metadata
    n = len(df)
    n_events = int(df['event'].sum())
    n_censored = n - n_events
    median_follow_up = float(df['time'].median())
    
    meta = {
        "n": n,
        "n_events": n_events,
        "n_censored": n_censored,
        "median_follow_up": median_follow_up
    }
    
    # Overall Kaplan-Meier
    kmf = KaplanMeierFitter()
    kmf.fit(df['time'], df['event'])
    
    overall_km = {
        "timeline": kmf.survival_function_.index.tolist(),
        "survival": kmf.survival_function_['KM_estimate'].tolist(),
        "lower_ci": kmf.confidence_interval_['KM_estimate_lower_0.95'].tolist(),
        "upper_ci": kmf.confidence_interval_['KM_estimate_upper_0.95'].tolist()
    }
    
    # Life table
    life_table = compute_life_table(df['time'], df['event'])
    
    # Nelson-Aalen cumulative hazard
    naf = NelsonAalenFitter()
    naf.fit(df['time'], df['event'])
    
    nelson_aalen = {
        "timeline": naf.cumulative_hazard_.index.tolist(),
        "cumhaz": naf.cumulative_hazard_['NA_estimate'].tolist()
    }
    
    # Stratified analysis
    strata_result = None
    if strata_col and strata_col in df.columns:
        strata_result = compute_stratified_analysis(df, strata_col)
    else:
        strata_result = {
            "column": None,
            "results": [],
            "logrank_p": None
        }
    
    # Cox proportional hazards
    cox_result = compute_cox_model(df)
    
    return {
        "meta": meta,
        "overall_km": overall_km,
        "life_table": life_table,
        "nelson_aalen": nelson_aalen,
        "strata": strata_result,
        "cox": cox_result
    }


def compute_life_table(time: pd.Series, event: pd.Series) -> List[Dict]:
    """
    Compute life table with at-risk, observed, censored counts.
    
    Args:
        time: Time values
        event: Event indicators (1=event, 0=censored)
        
    Returns:
        List of dictionaries with time, at_risk, observed, censored
    """
    df = pd.DataFrame({'time': time, 'event': event})
    df = df.sort_values('time')
    
    unique_times = sorted(df['time'].unique())
    life_table = []
    
    n_at_risk = len(df)
    
    for t in unique_times:
        events_at_t = df[(df['time'] == t) & (df['event'] == 1)]
        censored_at_t = df[(df['time'] == t) & (df['event'] == 0)]
        
        n_events = len(events_at_t)
        n_censored = len(censored_at_t)
        
        life_table.append({
            "time": float(t),
            "at_risk": n_at_risk,
            "observed": n_events,
            "censored": n_censored
        })
        
        n_at_risk -= (n_events + n_censored)
    
    return life_table


def compute_stratified_analysis(df: pd.DataFrame, strata_col: str) -> Dict:
    """
    Compute stratified Kaplan-Meier curves and log-rank test.
    
    Args:
        df: DataFrame with time, event, and strata column
        strata_col: Column name for stratification
        
    Returns:
        Dictionary with column, results (per-group KM), logrank_p
    """
    groups = df[strata_col].unique()
    results = []
    
    for group in groups:
        group_df = df[df[strata_col] == group]
        
        if len(group_df) < 2:
            continue
        
        kmf = KaplanMeierFitter()
        kmf.fit(group_df['time'], group_df['event'], label=str(group))
        
        results.append({
            "group": str(group),
            "n": len(group_df),
            "timeline": kmf.survival_function_.index.tolist(),
            "survival": kmf.survival_function_[str(group)].tolist(),
            "lower_ci": kmf.confidence_interval_[f'{group}_lower_0.95'].tolist(),
            "upper_ci": kmf.confidence_interval_[f'{group}_upper_0.95'].tolist()
        })
    
    # Log-rank test
    logrank_p = None
    if len(results) >= 2:
        try:
            test_result = multivariate_logrank_test(
                df['time'],
                df[strata_col],
                df['event']
            )
            logrank_p = float(test_result.p_value)
        except Exception:
            logrank_p = None
    
    return {
        "column": strata_col,
        "results": results,
        "logrank_p": logrank_p
    }


def compute_cox_model(df: pd.DataFrame) -> Dict:
    """
    Fit Cox proportional hazards model.
    
    Args:
        df: DataFrame with time, event, and covariates
        
    Returns:
        Dictionary with concordance and summary (coefficient rows)
    """
    # Identify numeric covariates (exclude time and event)
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    covariates = [col for col in numeric_cols if col not in ['time', 'event']]
    
    if len(covariates) == 0 or len(df) < 10:
        # Not enough data or no covariates
        return {
            "concordance": None,
            "summary": []
        }
    
    try:
        # Prepare data for Cox model
        cox_df = df[['time', 'event'] + covariates].dropna()
        
        if len(cox_df) < 10:
            return {"concordance": None, "summary": []}
        
        cph = CoxPHFitter()
        cph.fit(cox_df, duration_col='time', event_col='event')
        
        # Extract summary
        summary_df = cph.summary
        summary = []
        
        for idx, row in summary_df.iterrows():
            summary.append({
                "covariate": str(idx),
                "coef": float(row['coef']),
                "exp_coef": float(row['exp(coef)']),
                "se_coef": float(row['se(coef)']),
                "z": float(row['z']),
                "p": float(row['p'])
            })
        
        return {
            "concordance": float(cph.concordance_index_),
            "summary": summary
        }
    
    except Exception as e:
        # Cox model failed (e.g., convergence issues)
        return {
            "concordance": None,
            "summary": [],
            "error": str(e)
        }
