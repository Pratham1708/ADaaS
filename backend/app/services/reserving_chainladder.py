"""Chain-ladder reserving models for claims triangles."""
import pandas as pd
import numpy as np
from typing import Dict, Any


def run_chain_ladder_from_csv(csv_path: str) -> Dict[str, Any]:
    """
    Run chain-ladder reserving analysis on a cumulative triangle.
    
    Args:
        csv_path: Path to CSV file with triangle data
                  First column is 'origin', subsequent columns are dev periods
        
    Returns:
        Dictionary with development_factors, n_origin, n_dev, reserve_estimate
        
    Raises:
        ValueError: If CSV format is invalid
    """
    # Load triangle
    df = pd.read_csv(csv_path)
    
    if 'origin' not in df.columns:
        raise ValueError("CSV must contain 'origin' column")
    
    # Extract development columns
    dev_cols = [col for col in df.columns if col != 'origin']
    
    if len(dev_cols) < 2:
        raise ValueError("Triangle must have at least 2 development periods")
    
    # Convert to numeric
    triangle = df[dev_cols].apply(pd.to_numeric, errors='coerce')
    n_origin = len(triangle)
    n_dev = len(dev_cols)
    
    # Compute development factors
    dev_factors = compute_development_factors(triangle)
    
    # Project ultimate values
    ultimate = project_ultimate(triangle, dev_factors)
    
    # Compute reserve estimate
    # Reserve = Ultimate - Latest Diagonal
    latest_diagonal = get_latest_diagonal(triangle)
    reserve_estimate = float((ultimate - latest_diagonal).sum())
    
    return {
        "development_factors": dev_factors,
        "n_origin": n_origin,
        "n_dev": n_dev,
        "reserve_estimate": reserve_estimate
    }


def compute_development_factors(triangle: pd.DataFrame) -> list:
    """
    Compute age-to-age development factors.
    
    Uses simple volume-weighted average (sum-to-sum method).
    
    Args:
        triangle: DataFrame with development periods as columns
        
    Returns:
        List of development factors (length = n_dev - 1)
    """
    dev_factors = []
    n_dev = len(triangle.columns)
    
    for i in range(n_dev - 1):
        col_current = triangle.columns[i]
        col_next = triangle.columns[i + 1]
        
        # Get valid pairs (both non-null)
        valid_mask = triangle[col_current].notna() & triangle[col_next].notna()
        
        if valid_mask.sum() == 0:
            # No valid pairs, use 1.0 as default
            dev_factors.append(1.0)
            continue
        
        sum_current = triangle.loc[valid_mask, col_current].sum()
        sum_next = triangle.loc[valid_mask, col_next].sum()
        
        if sum_current == 0:
            dev_factors.append(1.0)
        else:
            factor = sum_next / sum_current
            dev_factors.append(float(factor))
    
    return dev_factors


def project_ultimate(triangle: pd.DataFrame, dev_factors: list) -> pd.Series:
    """
    Project ultimate values for each origin year.
    
    Args:
        triangle: DataFrame with development periods as columns
        dev_factors: List of age-to-age factors
        
    Returns:
        Series of ultimate values indexed by origin year
    """
    n_dev = len(triangle.columns)
    ultimate = pd.Series(index=triangle.index, dtype=float)
    
    for idx, row in triangle.iterrows():
        # Find latest non-null value
        latest_value = None
        latest_age = None
        
        for age in range(n_dev - 1, -1, -1):
            if pd.notna(row.iloc[age]):
                latest_value = row.iloc[age]
                latest_age = age
                break
        
        if latest_value is None:
            ultimate[idx] = 0.0
            continue
        
        # Project to ultimate using remaining factors
        projected = latest_value
        for age in range(latest_age, n_dev - 1):
            projected *= dev_factors[age]
        
        ultimate[idx] = projected
    
    return ultimate


def get_latest_diagonal(triangle: pd.DataFrame) -> pd.Series:
    """
    Extract the latest diagonal (most recent values for each origin).
    
    Args:
        triangle: DataFrame with development periods as columns
        
    Returns:
        Series of latest values indexed by origin year
    """
    latest = pd.Series(index=triangle.index, dtype=float)
    
    for idx, row in triangle.iterrows():
        # Find latest non-null value
        for age in range(len(row) - 1, -1, -1):
            if pd.notna(row.iloc[age]):
                latest[idx] = row.iloc[age]
                break
        
        if pd.isna(latest[idx]):
            latest[idx] = 0.0
    
    return latest
