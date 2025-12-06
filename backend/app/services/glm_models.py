"""Generalized Linear Model (GLM) analysis for actuarial pricing."""
import pandas as pd
import numpy as np
from typing import Dict, Optional, List, Any, Tuple
from pathlib import Path
import warnings

# Statistical modeling
import statsmodels.api as sm
from statsmodels.genmod.families import Poisson, NegativeBinomial, Gamma
from statsmodels.genmod.families.links import log as LogLink
from scipy import stats


def fit_glm_model(
    df: pd.DataFrame,
    target_col: str,
    feature_cols: List[str],
    family: str = 'poisson',
    link: str = 'log'
) -> Tuple[Any, pd.DataFrame]:
    """
    Fit a Generalized Linear Model.
    
    Args:
        df: DataFrame with data
        target_col: Name of target variable column
        feature_cols: List of feature column names
        family: Model family ('poisson', 'negativebinomial', 'gamma')
        link: Link function (currently only 'log' supported)
        
    Returns:
        Tuple of (fitted model, prepared dataframe with encoded features)
        
    Raises:
        ValueError: If target or features are invalid
    """
    # Validate inputs
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in dataframe")
    
    for col in feature_cols:
        if col not in df.columns:
            raise ValueError(f"Feature column '{col}' not found in dataframe")
    
    # Prepare data
    df_model = df[[target_col] + feature_cols].copy()
    
    # Handle missing values
    df_model = df_model.dropna()
    
    if len(df_model) < 10:
        raise ValueError("Insufficient data after removing missing values (need at least 10 rows)")
    
    # Identify categorical columns
    categorical_cols = df_model[feature_cols].select_dtypes(include=['object', 'category']).columns.tolist()
    
    # One-hot encode categorical variables
    if categorical_cols:
        df_model = pd.get_dummies(df_model, columns=categorical_cols, drop_first=True)
        # Update feature columns list
        feature_cols = [col for col in df_model.columns if col != target_col]
    
    # Ensure all columns are numeric
    for col in df_model.columns:
        if df_model[col].dtype == 'object':
            # Try to convert to numeric
            df_model[col] = pd.to_numeric(df_model[col], errors='coerce')
    
    # Drop any rows with NaN after conversion
    df_model = df_model.dropna()
    
    if len(df_model) < 10:
        raise ValueError("Insufficient data after encoding and cleaning (need at least 10 rows)")
    
    # Prepare X (features) and y (target)
    X = df_model[feature_cols]
    y = df_model[target_col]
    
    # Ensure X and y are numeric
    X = X.astype(float)
    y = y.astype(float)
    
    # Add constant term
    X = sm.add_constant(X)
    
    # Select family
    if family.lower() == 'poisson':
        family_obj = Poisson(link=LogLink())
    elif family.lower() == 'negativebinomial':
        family_obj = NegativeBinomial(link=LogLink())
    elif family.lower() == 'gamma':
        family_obj = Gamma(link=LogLink())
    else:
        raise ValueError(f"Unsupported family: {family}. Use 'poisson', 'negativebinomial', or 'gamma'")
    
    # Fit model
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        model = sm.GLM(y, X, family=family_obj)
        fitted_model = model.fit()
    
    return fitted_model, df_model


def compute_goodness_of_fit(model: Any, df: pd.DataFrame) -> Dict[str, float]:
    """
    Calculate goodness-of-fit statistics.
    
    Args:
        model: Fitted statsmodels GLM model
        df: DataFrame used for fitting
        
    Returns:
        Dictionary with AIC, BIC, deviance, Pearson chi-square, pseudo R²
    """
    n_obs = model.nobs
    
    # Calculate pseudo R-squared (McFadden's)
    # R² = 1 - (log-likelihood of fitted model / log-likelihood of null model)
    null_deviance = model.null_deviance
    deviance = model.deviance
    pseudo_r2 = 1 - (deviance / null_deviance) if null_deviance > 0 else 0
    
    return {
        "aic": float(model.aic),
        "bic": float(model.bic),
        "deviance": float(model.deviance),
        "pearson_chi2": float(model.pearson_chi2),
        "pseudo_r2": float(pseudo_r2),
        "null_deviance": float(null_deviance),
        "n_observations": int(n_obs)
    }


def calculate_deviance_residuals(model: Any) -> Dict[str, List[float]]:
    """
    Calculate deviance and Pearson residuals.
    
    Args:
        model: Fitted statsmodels GLM model
        
    Returns:
        Dictionary with fitted values, deviance residuals, Pearson residuals
    """
    fitted_values = model.fittedvalues
    deviance_resid = model.resid_deviance
    pearson_resid = model.resid_pearson
    
    return {
        "fitted_values": fitted_values.tolist(),
        "deviance_residuals": deviance_resid.tolist(),
        "pearson_residuals": pearson_resid.tolist()
    }


def compute_feature_importance(model: Any, feature_names: List[str]) -> List[Dict[str, Any]]:
    """
    Calculate feature importance based on coefficient magnitudes and z-scores.
    
    Args:
        model: Fitted statsmodels GLM model
        feature_names: List of feature names (excluding constant)
        
    Returns:
        List of dictionaries with feature importance rankings
    """
    # Get coefficients and p-values
    params = model.params
    pvalues = model.pvalues
    
    # Calculate importance scores (absolute z-score)
    # Higher absolute z-score = more important
    z_scores = np.abs(params / model.bse)
    
    importance_list = []
    
    for i, name in enumerate(params.index):
        if name == 'const':
            continue
            
        importance_list.append({
            "feature": name,
            "coefficient": float(params[name]),
            "abs_coefficient": float(np.abs(params[name])),
            "z_score": float(z_scores[name]),
            "p_value": float(pvalues[name]),
            "importance": float(z_scores[name])  # Using z-score as importance
        })
    
    # Sort by importance (descending)
    importance_list.sort(key=lambda x: x['importance'], reverse=True)
    
    # Add rank
    for rank, item in enumerate(importance_list, 1):
        item['rank'] = rank
    
    return importance_list


def calculate_partial_dependence(
    model: Any,
    df: pd.DataFrame,
    feature: str,
    grid_points: int = 50
) -> Dict[str, List[float]]:
    """
    Calculate partial dependence for a single feature.
    
    Args:
        model: Fitted statsmodels GLM model
        df: DataFrame with model data (already encoded)
        feature: Feature name to calculate PDP for
        grid_points: Number of grid points
        
    Returns:
        Dictionary with grid values and predictions
    """
    # Get feature column
    if feature not in df.columns:
        # Feature might be encoded (categorical)
        matching_cols = [col for col in df.columns if col.startswith(feature + '_')]
        if not matching_cols:
            return {"values": [], "predictions": []}
        # For categorical, we'll just return the encoded columns
        # This is a simplified approach
        return {"values": [], "predictions": []}
    
    feature_col = df[feature]
    
    # Create grid of values
    if feature_col.dtype in ['int64', 'float64']:
        # Numeric feature
        min_val = feature_col.min()
        max_val = feature_col.max()
        grid = np.linspace(min_val, max_val, grid_points)
    else:
        # Categorical feature (shouldn't happen after encoding, but handle it)
        unique_vals = feature_col.unique()
        grid = unique_vals[:grid_points]
    
    predictions = []
    
    # For each grid point, predict with feature set to that value
    for val in grid:
        # Create copy of dataframe
        df_temp = df.copy()
        df_temp[feature] = val
        
        # Get feature columns (all except target)
        X_temp = df_temp[model.model.exog_names[1:]]  # Exclude 'const'
        X_temp = sm.add_constant(X_temp)
        
        # Predict
        pred = model.predict(X_temp)
        predictions.append(float(pred.mean()))
    
    return {
        "values": grid.tolist() if isinstance(grid, np.ndarray) else list(grid),
        "predictions": predictions
    }


def auto_detect_family(df: pd.DataFrame, target_col: str) -> str:
    """
    Automatically detect appropriate GLM family based on target variable.
    
    Args:
        df: DataFrame
        target_col: Target column name
        
    Returns:
        Recommended family: 'poisson', 'negativebinomial', or 'gamma'
    """
    target = df[target_col].dropna()
    
    # Check if all values are non-negative
    if (target < 0).any():
        raise ValueError(f"Target variable '{target_col}' contains negative values. GLM requires non-negative targets.")
    
    # Check if values are integers (count data)
    is_integer = np.allclose(target, target.astype(int))
    
    if is_integer:
        # Count data - check for overdispersion
        mean_val = target.mean()
        var_val = target.var()
        
        # If variance >> mean, use Negative Binomial
        if var_val > mean_val * 1.5:
            return 'negativebinomial'
        else:
            return 'poisson'
    else:
        # Continuous positive data - use Gamma
        return 'gamma'


def run_glm_analysis(
    csv_path: str,
    target_col: str,
    feature_cols: Optional[List[str]] = None,
    family: str = 'auto',
    strata_col: Optional[str] = None
) -> Dict[str, Any]:
    """
    Run complete GLM analysis pipeline.
    
    Args:
        csv_path: Path to CSV file
        target_col: Target variable column name
        feature_cols: List of feature columns (auto-detect if None)
        family: Model family ('auto', 'poisson', 'negativebinomial', 'gamma')
        strata_col: Optional stratification column (for future use)
        
    Returns:
        Comprehensive results dictionary
        
    Raises:
        ValueError: If data is invalid or model fails to fit
    """
    # Load data
    df = pd.read_csv(csv_path)
    
    # Validate target column
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in dataset")
    
    # Auto-detect features if not provided
    if feature_cols is None:
        # Use all numeric and categorical columns except target
        feature_cols = [col for col in df.columns if col != target_col]
        
        # Remove ID-like columns (heuristic)
        feature_cols = [col for col in feature_cols if not col.lower().endswith('_id') 
                       and col.lower() != 'id']
    
    # Auto-detect family if requested
    if family.lower() == 'auto':
        family = auto_detect_family(df, target_col)
        print(f"[INFO] Auto-detected family: {family}")
    
    # Fit model
    try:
        fitted_model, df_model = fit_glm_model(df, target_col, feature_cols, family)
    except Exception as e:
        raise ValueError(f"Model fitting failed: {str(e)}")
    
    # Extract coefficients
    coefficients = []
    for name in fitted_model.params.index:
        coefficients.append({
            "feature": name,
            "coef": float(fitted_model.params[name]),
            "std_err": float(fitted_model.bse[name]),
            "z": float(fitted_model.tvalues[name]),
            "p_value": float(fitted_model.pvalues[name]),
            "exp_coef": float(np.exp(fitted_model.params[name])),
            "ci_lower": float(fitted_model.conf_int().loc[name, 0]),
            "ci_upper": float(fitted_model.conf_int().loc[name, 1])
        })
    
    # Goodness of fit
    gof = compute_goodness_of_fit(fitted_model, df_model)
    
    # Residuals
    residuals = calculate_deviance_residuals(fitted_model)
    
    # Feature importance
    feature_names = [col for col in df_model.columns if col != target_col]
    importance = compute_feature_importance(fitted_model, feature_names)
    
    # Partial dependence for top 5 numeric features
    partial_dep = {}
    numeric_features = df_model.select_dtypes(include=['int64', 'float64']).columns.tolist()
    numeric_features = [f for f in numeric_features if f != target_col and f in feature_names]
    
    # Get top 5 important numeric features
    top_features = [item['feature'] for item in importance if item['feature'] in numeric_features][:5]
    
    for feature in top_features:
        try:
            pd_result = calculate_partial_dependence(fitted_model, df_model, feature)
            if pd_result['values']:  # Only add if we got results
                partial_dep[feature] = pd_result
        except Exception as e:
            print(f"[WARN] Could not calculate partial dependence for {feature}: {e}")
    
    # Predictions summary
    predictions = fitted_model.fittedvalues
    observed = df_model[target_col]
    
    prediction_summary = {
        "mean_predicted": float(predictions.mean()),
        "mean_observed": float(observed.mean()),
        "median_predicted": float(predictions.median()),
        "median_observed": float(observed.median()),
        "min_predicted": float(predictions.min()),
        "max_predicted": float(predictions.max()),
        "correlation": float(np.corrcoef(predictions, observed)[0, 1])
    }
    
    # Compile results
    results = {
        "model_info": {
            "family": family,
            "link": "log",
            "n_observations": int(fitted_model.nobs),
            "n_features": len(feature_cols),
            "n_parameters": len(fitted_model.params),
            "converged": bool(fitted_model.converged)
        },
        "coefficients": coefficients,
        "goodness_of_fit": gof,
        "residuals": residuals,
        "feature_importance": importance,
        "partial_dependence": partial_dep,
        "predictions": prediction_summary
    }
    
    return results
