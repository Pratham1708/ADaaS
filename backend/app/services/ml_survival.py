"""Machine Learning-based Survival Models using scikit-survival."""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

try:
    from sksurv.ensemble import RandomSurvivalForest, GradientBoostingSurvivalAnalysis
    from sksurv.linear_model import CoxnetSurvivalAnalysis, CoxPHSurvivalAnalysis
    from sksurv.metrics import concordance_index_censored, integrated_brier_score
    from sksurv.util import Surv
    SKSURV_AVAILABLE = True
except ImportError:
    SKSURV_AVAILABLE = False
    print("[WARN] scikit-survival not available. ML survival models will not work.")

from lifelines import KaplanMeierFitter, CoxPHFitter
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


def check_sksurv_available():
    """Check if scikit-survival is available."""
    if not SKSURV_AVAILABLE:
        raise ImportError(
            "scikit-survival is required for ML survival models. "
            "Install with: pip install scikit-survival"
        )


def prepare_survival_data(
    df: pd.DataFrame,
    time_col: str = 'time',
    event_col: str = 'event',
    feature_cols: Optional[List[str]] = None
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Prepare data for scikit-survival models.
    
    Args:
        df: DataFrame with survival data
        time_col: Name of time column
        event_col: Name of event column (1=event, 0=censored)
        feature_cols: List of feature column names (auto-detect if None)
        
    Returns:
        Tuple of (X features, y structured array, feature_names)
    """
    # Auto-detect feature columns if not provided
    if feature_cols is None:
        # Use all numeric columns except time and event
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        feature_cols = [col for col in numeric_cols if col not in [time_col, event_col]]
    
    # Remove any columns with missing values or non-numeric
    valid_features = []
    for col in feature_cols:
        if col in df.columns and df[col].notna().all() and pd.api.types.is_numeric_dtype(df[col]):
            valid_features.append(col)
    
    if len(valid_features) == 0:
        raise ValueError("No valid numeric features found for ML survival models")
    
    # Extract features
    X = df[valid_features].values.astype(np.float64)
    
    # Create structured array for survival outcome
    # scikit-survival requires structured array with (event, time)
    y = Surv.from_dataframe(event_col, time_col, df)
    
    return X, y, valid_features


def train_random_survival_forest(
    csv_path: str,
    time_col: str = 'time',
    event_col: str = 'event',
    feature_cols: Optional[List[str]] = None,
    n_estimators: int = 100,
    max_depth: Optional[int] = None,
    min_samples_split: int = 10,
    min_samples_leaf: int = 6,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Train Random Survival Forest model.
    
    Args:
        csv_path: Path to CSV file
        time_col: Time column name
        event_col: Event column name
        feature_cols: Feature columns (auto-detect if None)
        n_estimators: Number of trees
        max_depth: Maximum tree depth
        min_samples_split: Minimum samples to split
        min_samples_leaf: Minimum samples per leaf
        random_state: Random seed
        
    Returns:
        Dictionary with model results, variable importance, predictions
    """
    check_sksurv_available()
    
    # Load data
    df = pd.read_csv(csv_path)
    
    # Validate required columns
    if time_col not in df.columns:
        raise ValueError(f"Time column '{time_col}' not found")
    if event_col not in df.columns:
        raise ValueError(f"Event column '{event_col}' not found")
    
    # Prepare data
    X, y, feature_names = prepare_survival_data(df, time_col, event_col, feature_cols)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_state
    )
    
    # Train Random Survival Forest
    rsf = RandomSurvivalForest(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        random_state=random_state,
        n_jobs=-1
    )
    
    # Get unique event times
    unique_times = np.unique(y_train['time'])
    
    # Extract survival probabilities at each time point
    predictions = []
    for i, surv_func in enumerate(surv_funcs):
        surv_probs = [surv_func(t) for t in unique_times]
        predictions.append({
            'sample_id': int(i),
            'timeline': unique_times.tolist(),
            'survival_prob': surv_probs,
            'actual_time': float(y_test[i]['time']),
            'actual_event': bool(y_test[i]['event'])
        })
    
    return {
        'model_type': 'random_survival_forest',
        'n_estimators': n_estimators,
        'max_depth': max_depth,
        'train_c_index': float(train_c_index),
        'test_c_index': float(test_c_index),
        'n_train': len(X_train),
        'n_test': len(X_test),
        'n_features': len(feature_names),
        'feature_names': feature_names,
        'variable_importance': importance_df.to_dict('records'),
        'predictions': predictions,
        'unique_times': unique_times.tolist()
    }


def train_gradient_boosted_survival(
    csv_path: str,
    time_col: str = 'time',
    event_col: str = 'event',
    feature_cols: Optional[List[str]] = None,
    n_estimators: int = 100,
    learning_rate: float = 0.1,
    max_depth: int = 3,
    min_samples_split: int = 10,
    min_samples_leaf: int = 6,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Train Gradient Boosted Survival model.
    
    Args:
        csv_path: Path to CSV file
        time_col: Time column name
        event_col: Event column name
        feature_cols: Feature columns (auto-detect if None)
        n_estimators: Number of boosting stages
        learning_rate: Learning rate
        max_depth: Maximum tree depth
        min_samples_split: Minimum samples to split
        min_samples_leaf: Minimum samples per leaf
        random_state: Random seed
        
    Returns:
        Dictionary with model results, variable importance, predictions
    """
    check_sksurv_available()
    
    # Load data
    df = pd.read_csv(csv_path)
    
    # Prepare data
    X, y, feature_names = prepare_survival_data(df, time_col, event_col, feature_cols)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_state
    )
    
    # Train Gradient Boosted Survival
    gbs = GradientBoostingSurvivalAnalysis(
        n_estimators=n_estimators,
        learning_rate=learning_rate,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        random_state=random_state
    )
    
    gbs.fit(X_train, y_train)
    
    # Compute concordance index
    train_c_index = gbs.score(X_train, y_train)
    test_c_index = gbs.score(X_test, y_test)
    
    # Variable importance
    importance = gbs.feature_importances_
    importance_df = pd.DataFrame({
        'feature': feature_names,
        'importance': importance
    }).sort_values('importance', ascending=False)
    
    # Predict survival functions for test set
    surv_funcs = gbs.predict_survival_function(X_test[:10])
    
    # Get unique event times
    unique_times = np.unique(y_train['time'])
    
    # Extract survival probabilities
    predictions = []
    for i, surv_func in enumerate(surv_funcs):
        surv_probs = [surv_func(t) for t in unique_times]
        predictions.append({
            'sample_id': int(i),
            'timeline': unique_times.tolist(),
            'survival_prob': surv_probs,
            'actual_time': float(y_test[i]['time']),
            'actual_event': bool(y_test[i]['event'])
        })
    
    return {
        'model_type': 'gradient_boosted_survival',
        'n_estimators': n_estimators,
        'learning_rate': learning_rate,
        'max_depth': max_depth,
        'train_c_index': float(train_c_index),
        'test_c_index': float(test_c_index),
        'n_train': len(X_train),
        'n_test': len(X_test),
        'n_features': len(feature_names),
        'feature_names': feature_names,
        'variable_importance': importance_df.to_dict('records'),
        'predictions': predictions,
        'unique_times': unique_times.tolist()
    }


def train_coxnet_model(
    csv_path: str,
    time_col: str = 'time',
    event_col: str = 'event',
    feature_cols: Optional[List[str]] = None,
    alpha_min_ratio: float = 0.01,
    l1_ratio: float = 0.5,
    n_alphas: int = 100,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Train CoxNet (penalized Cox) model with elastic net regularization.
    
    Args:
        csv_path: Path to CSV file
        time_col: Time column name
        event_col: Event column name
        feature_cols: Feature columns (auto-detect if None)
        alpha_min_ratio: Ratio of smallest to largest alpha
        l1_ratio: Elastic net mixing (0=Ridge, 1=Lasso)
        n_alphas: Number of alphas to try
        random_state: Random seed
        
    Returns:
        Dictionary with model results, coefficients, predictions
    """
    check_sksurv_available()
    
    # Load data
    df = pd.read_csv(csv_path)
    
    # Prepare data
    X, y, feature_names = prepare_survival_data(df, time_col, event_col, feature_cols)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_state
    )
    
    # Standardize features (important for penalized models)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train CoxNet
    coxnet = CoxnetSurvivalAnalysis(
        l1_ratio=l1_ratio,
        alpha_min_ratio=alpha_min_ratio,
        n_alphas=n_alphas,
        fit_baseline_model=True
    )
    
    coxnet.fit(X_train_scaled, y_train)
    
    # Compute concordance index
    train_c_index = coxnet.score(X_train_scaled, y_train)
    test_c_index = coxnet.score(X_test_scaled, y_test)
    
    # Get coefficients at optimal alpha
    coef = coxnet.coef_
    coef_df = pd.DataFrame({
        'feature': feature_names,
        'coefficient': coef,
        'abs_coefficient': np.abs(coef)
    }).sort_values('abs_coefficient', ascending=False)
    
    # Count non-zero coefficients
    n_nonzero = np.sum(coef != 0)
    
    # Predict risk scores
    risk_scores_test = coxnet.predict(X_test_scaled)
    
    return {
        'model_type': 'coxnet',
        'l1_ratio': l1_ratio,
        'alpha_min_ratio': alpha_min_ratio,
        'n_alphas': n_alphas,
        'optimal_alpha': float(coxnet.alphas_[0]) if len(coxnet.alphas_) > 0 else None,
        'train_c_index': float(train_c_index),
        'test_c_index': float(test_c_index),
        'n_train': len(X_train),
        'n_test': len(X_test),
        'n_features': len(feature_names),
        'n_nonzero_coef': int(n_nonzero),
        'feature_names': feature_names,
        'coefficients': coef_df.to_dict('records'),
        'risk_scores_sample': risk_scores_test[:10].tolist()
    }


def compare_survival_models(
    csv_path: str,
    time_col: str = 'time',
    event_col: str = 'event',
    feature_cols: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Train and compare multiple survival models.
    
    Args:
        csv_path: Path to CSV file
        time_col: Time column name
        event_col: Event column name
        feature_cols: Feature columns (auto-detect if None)
        
    Returns:
        Dictionary with results from all models and comparison metrics
    """
    results = {
        'models': {},
        'comparison': {},
        'best_model': None
    }
    
    # Train Kaplan-Meier (baseline)
    try:
        df = pd.read_csv(csv_path)
        kmf = KaplanMeierFitter()
        kmf.fit(df[time_col], df[event_col])
        
        results['models']['kaplan_meier'] = {
            'model_type': 'kaplan_meier',
            'timeline': kmf.survival_function_.index.tolist(),
            'survival': kmf.survival_function_['KM_estimate'].tolist(),
            'median_survival': float(kmf.median_survival_time_) if kmf.median_survival_time_ else None
        }
    except Exception as e:
        results['models']['kaplan_meier'] = {'error': str(e)}
    
    # Train Cox PH (baseline parametric)
    try:
        df = pd.read_csv(csv_path)
        X, y, feature_names = prepare_survival_data(df, time_col, event_col, feature_cols)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Use lifelines Cox for baseline
        cox_df = pd.DataFrame(X_train, columns=feature_names)
        cox_df[time_col] = y_train['time']
        cox_df[event_col] = y_train['event']
        
        cph = CoxPHFitter()
        cph.fit(cox_df, duration_col=time_col, event_col=event_col)
        
        results['models']['cox_ph'] = {
            'model_type': 'cox_ph',
            'concordance': float(cph.concordance_index_),
            'n_features': len(feature_names)
        }
    except Exception as e:
        results['models']['cox_ph'] = {'error': str(e)}
    
    # Train ML models if available
    if SKSURV_AVAILABLE:
        # Random Survival Forest
        try:
            rsf_results = train_random_survival_forest(
                csv_path, time_col, event_col, feature_cols
            )
            results['models']['random_survival_forest'] = rsf_results
        except Exception as e:
            results['models']['random_survival_forest'] = {'error': str(e)}
        
        # Gradient Boosted Survival
        try:
            gbs_results = train_gradient_boosted_survival(
                csv_path, time_col, event_col, feature_cols
            )
            results['models']['gradient_boosted_survival'] = gbs_results
        except Exception as e:
            results['models']['gradient_boosted_survival'] = {'error': str(e)}
        
        # CoxNet
        try:
            coxnet_results = train_coxnet_model(
                csv_path, time_col, event_col, feature_cols
            )
            results['models']['coxnet'] = coxnet_results
        except Exception as e:
            results['models']['coxnet'] = {'error': str(e)}
    
    # Compare models by concordance index
    c_indices = {}
    for model_name, model_results in results['models'].items():
        if 'error' not in model_results:
            if 'test_c_index' in model_results:
                c_indices[model_name] = model_results['test_c_index']
            elif 'concordance' in model_results:
                c_indices[model_name] = model_results['concordance']
    
    if c_indices:
        best_model = max(c_indices, key=c_indices.get)
        results['best_model'] = best_model
        results['comparison'] = {
            'concordance_indices': c_indices,
            'best_model': best_model,
            'best_c_index': c_indices[best_model]
        }
    
    return results


def predict_individual_survival(
    csv_path: str,
    individual_features: Dict[str, float],
    time_col: str = 'time',
    event_col: str = 'event',
    model_type: str = 'random_survival_forest'
) -> Dict[str, Any]:
    """
    Predict survival curve for an individual with given features.
    
    Args:
        csv_path: Path to training CSV file
        individual_features: Dictionary of feature values
        time_col: Time column name
        event_col: Event column name
        model_type: Type of model to use
        
    Returns:
        Dictionary with predicted survival curve
    """
    check_sksurv_available()
    
    # Load and prepare training data
    df = pd.read_csv(csv_path)
    feature_cols = list(individual_features.keys())
    X, y, feature_names = prepare_survival_data(df, time_col, event_col, feature_cols)
    
    # Train model
    if model_type == 'random_survival_forest':
        model = RandomSurvivalForest(n_estimators=100, random_state=42, n_jobs=-1)
    elif model_type == 'gradient_boosted_survival':
        model = GradientBoostingSurvivalAnalysis(n_estimators=100, random_state=42)
    else:
        raise ValueError(f"Unknown model type: {model_type}")
    
    model.fit(X, y)
    
    # Prepare individual features
    X_individual = np.array([[individual_features[f] for f in feature_names]])
    
    # Predict survival function
    surv_func = model.predict_survival_function(X_individual)[0]
    
    # Get time points
    unique_times = np.unique(y['time'])
    survival_probs = [surv_func(t) for t in unique_times]
    
    return {
        'model_type': model_type,
        'features': individual_features,
        'timeline': unique_times.tolist(),
        'survival_probability': survival_probs,
        'median_survival': float(unique_times[np.argmin(np.abs(np.array(survival_probs) - 0.5))])
    }
