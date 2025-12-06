"""Actuarial mortality table analytics and graduation methods."""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from scipy.optimize import curve_fit
from scipy.interpolate import UnivariateSpline


def compute_life_table(ages: np.ndarray, qx: np.ndarray, radix: int = 100000) -> pd.DataFrame:
    """
    Compute full actuarial life table from mortality rates.
    
    Calculates: qx → lx → dx → Lx → Tx → ex
    
    Args:
        ages: Array of ages
        qx: Mortality rates (probability of death between age x and x+1)
        radix: Starting population (default 100,000)
        
    Returns:
        DataFrame with columns: age, qx, px, lx, dx, Lx, Tx, ex
    """
    n = len(ages)
    
    # Initialize arrays
    lx = np.zeros(n + 1)  # Survivors at age x (need n+1 for final age)
    dx = np.zeros(n)      # Deaths between age x and x+1
    Lx = np.zeros(n)      # Person-years lived between age x and x+1
    Tx = np.zeros(n)      # Total person-years lived above age x
    ex = np.zeros(n)      # Life expectancy at age x
    px = 1 - qx           # Survival probability
    
    # Starting population
    lx[0] = radix
    
    # Calculate lx (survivors) and dx (deaths)
    for i in range(n):
        dx[i] = lx[i] * qx[i]
        lx[i + 1] = lx[i] - dx[i]
    
    # Calculate Lx (person-years lived)
    for i in range(n):
        # Average of survivors at start and end of interval
        Lx[i] = (lx[i] + lx[i + 1]) / 2
    
    # Calculate Tx (total person-years above age x) - work backwards
    Tx[n - 1] = Lx[n - 1]
    for i in range(n - 2, -1, -1):
        Tx[i] = Tx[i + 1] + Lx[i]
    
    # Calculate ex (life expectancy)
    for i in range(n):
        if lx[i] > 0:
            ex[i] = Tx[i] / lx[i]
        else:
            ex[i] = 0
    
    # Create DataFrame
    life_table = pd.DataFrame({
        'age': ages,
        'qx': qx,
        'px': px,
        'lx': lx[:n],
        'dx': dx,
        'Lx': Lx,
        'Tx': Tx,
        'ex': ex
    })
    
    return life_table


def calculate_survival_probability(lx: np.ndarray, age_from: int, age_to: int) -> float:
    """
    Calculate probability of surviving from age_from to age_to.
    
    Args:
        lx: Array of survivors at each age
        age_from: Starting age
        age_to: Ending age
        
    Returns:
        Survival probability
    """
    if age_from >= len(lx) or age_to >= len(lx):
        return 0.0
    
    if lx[age_from] == 0:
        return 0.0
    
    return lx[age_to] / lx[age_from]


def fit_gompertz(ages: np.ndarray, qx: np.ndarray) -> Dict[str, Any]:
    """
    Fit Gompertz mortality model: μ(x) = α·exp(β·x)
    
    The Gompertz law states that mortality rate increases exponentially with age.
    
    Args:
        ages: Array of ages
        qx: Observed mortality rates
        
    Returns:
        Dictionary with parameters (alpha, beta), fitted values, and goodness-of-fit
    """
    # Convert qx to force of mortality μ(x) = -ln(1-qx)
    # For small qx, μ(x) ≈ qx
    mu_x = -np.log(1 - qx + 1e-10)  # Add small constant to avoid log(0)
    
    # Gompertz model: μ(x) = α·exp(β·x)
    def gompertz(x, alpha, beta):
        return alpha * np.exp(beta * x)
    
    try:
        # Fit the model
        params, _ = curve_fit(gompertz, ages, mu_x, p0=[0.0001, 0.1], maxfev=10000)
        alpha, beta = params
        
        # Generate fitted values
        mu_fitted = gompertz(ages, alpha, beta)
        qx_fitted = 1 - np.exp(-mu_fitted)
        
        # Calculate R-squared
        ss_res = np.sum((mu_x - mu_fitted) ** 2)
        ss_tot = np.sum((mu_x - np.mean(mu_x)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
        
        # Calculate RMSE
        rmse = np.sqrt(np.mean((qx - qx_fitted) ** 2))
        
        return {
            'model': 'gompertz',
            'parameters': {
                'alpha': float(alpha),
                'beta': float(beta)
            },
            'fitted_qx': qx_fitted.tolist(),
            'fitted_mu': mu_fitted.tolist(),
            'r_squared': float(r_squared),
            'rmse': float(rmse),
            'formula': 'μ(x) = α·exp(β·x)',
            'success': True
        }
    
    except Exception as e:
        return {
            'model': 'gompertz',
            'parameters': {},
            'fitted_qx': [],
            'error': str(e),
            'success': False
        }


def fit_makeham(ages: np.ndarray, qx: np.ndarray) -> Dict[str, Any]:
    """
    Fit Makeham mortality model: μ(x) = A + B·exp(C·x)
    
    The Makeham law extends Gompertz by adding a constant term A
    representing age-independent mortality (accidents, etc.).
    
    Args:
        ages: Array of ages
        qx: Observed mortality rates
        
    Returns:
        Dictionary with parameters (A, B, C), fitted values, and goodness-of-fit
    """
    # Convert qx to force of mortality
    mu_x = -np.log(1 - qx + 1e-10)
    
    # Makeham model: μ(x) = A + B·exp(C·x)
    def makeham(x, A, B, C):
        return A + B * np.exp(C * x)
    
    try:
        # Fit the model with initial guesses
        params, _ = curve_fit(makeham, ages, mu_x, p0=[0.0001, 0.0001, 0.1], maxfev=10000)
        A, B, C = params
        
        # Generate fitted values
        mu_fitted = makeham(ages, A, B, C)
        qx_fitted = 1 - np.exp(-mu_fitted)
        
        # Calculate R-squared
        ss_res = np.sum((mu_x - mu_fitted) ** 2)
        ss_tot = np.sum((mu_x - np.mean(mu_x)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
        
        # Calculate RMSE
        rmse = np.sqrt(np.mean((qx - qx_fitted) ** 2))
        
        return {
            'model': 'makeham',
            'parameters': {
                'A': float(A),
                'B': float(B),
                'C': float(C)
            },
            'fitted_qx': qx_fitted.tolist(),
            'fitted_mu': mu_fitted.tolist(),
            'r_squared': float(r_squared),
            'rmse': float(rmse),
            'formula': 'μ(x) = A + B·exp(C·x)',
            'success': True
        }
    
    except Exception as e:
        return {
            'model': 'makeham',
            'parameters': {},
            'fitted_qx': [],
            'error': str(e),
            'success': False
        }


def whittaker_henderson(qx: np.ndarray, order: int = 3, lambda_param: float = 100.0) -> np.ndarray:
    """
    Whittaker-Henderson graduation using penalized differences.
    
    Minimizes: Σ(qx_graduated - qx_raw)² + λ·Σ(Δ^d qx_graduated)²
    where Δ^d is the d-th order difference operator.
    
    Args:
        qx: Raw mortality rates
        order: Order of differences (typically 2 or 3)
        lambda_param: Smoothing parameter (larger = smoother)
        
    Returns:
        Graduated mortality rates
    """
    n = len(qx)
    
    # Create identity matrix for the fidelity term
    I = np.eye(n)
    
    # Create difference matrix D of order 'order'
    D = np.eye(n)
    for _ in range(order):
        D = np.diff(D, axis=0)
    
    # Whittaker-Henderson solution: (I + λ·D'D)^(-1) · qx
    penalty_matrix = lambda_param * (D.T @ D)
    
    # Add small regularization for numerical stability
    A = I + penalty_matrix + 1e-10 * np.eye(n)
    
    # Solve the system
    qx_graduated = np.linalg.solve(A, qx)
    
    # Ensure graduated values are valid probabilities [0, 1]
    qx_graduated = np.clip(qx_graduated, 0, 1)
    
    return qx_graduated


def moving_average_smooth(qx: np.ndarray, window_size: int = 5, weighted: bool = True) -> np.ndarray:
    """
    Smooth mortality rates using moving average.
    
    Args:
        qx: Raw mortality rates
        window_size: Size of moving window (must be odd)
        weighted: If True, use weighted average (center gets more weight)
        
    Returns:
        Smoothed mortality rates
    """
    if window_size % 2 == 0:
        window_size += 1  # Ensure odd window size
    
    n = len(qx)
    qx_smooth = np.zeros(n)
    half_window = window_size // 2
    
    if weighted:
        # Create triangular weights (center gets highest weight)
        weights = np.array([1 + half_window - abs(i - half_window) for i in range(window_size)])
        weights = weights / weights.sum()
    else:
        # Uniform weights
        weights = np.ones(window_size) / window_size
    
    for i in range(n):
        # Determine window boundaries
        start = max(0, i - half_window)
        end = min(n, i + half_window + 1)
        
        # Adjust weights for boundary cases
        if i < half_window or i >= n - half_window:
            window_len = end - start
            if weighted:
                w = np.array([1 + window_len // 2 - abs(j - window_len // 2) for j in range(window_len)])
                w = w / w.sum()
            else:
                w = np.ones(window_len) / window_len
            qx_smooth[i] = np.sum(qx[start:end] * w)
        else:
            qx_smooth[i] = np.sum(qx[start:end] * weights)
    
    return qx_smooth


def penalized_spline_smooth(ages: np.ndarray, qx: np.ndarray, smoothing_param: float = 0.1) -> np.ndarray:
    """
    Smooth mortality rates using penalized cubic splines.
    
    Args:
        ages: Array of ages
        qx: Raw mortality rates
        smoothing_param: Smoothing parameter (0 = interpolation, larger = smoother)
        
    Returns:
        Smoothed mortality rates
    """
    try:
        # Use scipy's UnivariateSpline with smoothing
        # s parameter controls smoothing (0 = interpolation)
        spline = UnivariateSpline(ages, qx, s=smoothing_param * len(ages))
        qx_smooth = spline(ages)
        
        # Ensure valid probabilities
        qx_smooth = np.clip(qx_smooth, 0, 1)
        
        return qx_smooth
    
    except Exception as e:
        print(f"Spline smoothing failed: {e}, returning original data")
        return qx


def compute_mortality_dashboard(csv_path: str) -> Dict[str, Any]:
    """
    Compute comprehensive mortality table analytics dashboard.
    
    Args:
        csv_path: Path to CSV file with mortality data
                 Expected columns: 'age' and 'qx' (or similar mortality rate column)
        
    Returns:
        Dictionary with:
        - raw_data: Original mortality data
        - life_table: Full actuarial life table
        - graduated: Graduated rates from different methods
        - fitted_models: Gompertz and Makeham fitted curves
        - kpis: Key performance indicators
    """
    # Load data
    df = pd.read_csv(csv_path)
    
    # Normalize column names
    df.columns = df.columns.str.strip().str.lower()
    
    # Find age and mortality rate columns
    age_col = None
    qx_col = None
    
    for col in df.columns:
        if col in ['age', 'x', 'ages']:
            age_col = col
        if col in ['qx', 'q_x', 'mortality', 'mortality_rate', 'death_rate', 'deaths']:
            qx_col = col
    
    if age_col is None:
        # Assume first column is age
        age_col = df.columns[0]
    
    if qx_col is None:
        # Assume second column is qx
        qx_col = df.columns[1] if len(df.columns) > 1 else df.columns[0]
    
    # Extract data
    ages = df[age_col].values
    qx_raw = df[qx_col].values
    
    # Ensure qx is in [0, 1] range
    if qx_raw.max() > 1:
        # Might be in percentage or per 1000
        if qx_raw.max() > 100:
            qx_raw = qx_raw / 1000  # Per 1000
        else:
            qx_raw = qx_raw / 100  # Percentage
    
    # Compute full life table
    life_table_df = compute_life_table(ages, qx_raw)
    
    # Apply graduation methods
    qx_whittaker = whittaker_henderson(qx_raw, order=3, lambda_param=100.0)
    qx_moving_avg = moving_average_smooth(qx_raw, window_size=5, weighted=True)
    qx_spline = penalized_spline_smooth(ages, qx_raw, smoothing_param=0.1)
    
    # Fit parametric models
    gompertz_fit = fit_gompertz(ages, qx_raw)
    makeham_fit = fit_makeham(ages, qx_raw)
    
    # Calculate KPIs
    life_expectancy_at_birth = float(life_table_df.loc[0, 'ex']) if len(life_table_df) > 0 else 0
    
    # Median age at death (age where lx = 0.5 * radix)
    radix = float(life_table_df.loc[0, 'lx']) if len(life_table_df) > 0 else 100000
    median_age_idx = np.argmin(np.abs(life_table_df['lx'].values - radix / 2))
    median_age_at_death = float(life_table_df.loc[median_age_idx, 'age'])
    
    # Total deaths in life table
    total_deaths = float(life_table_df['dx'].sum())
    
    # Prepare response
    return {
        'raw_data': {
            'ages': ages.tolist(),
            'qx': qx_raw.tolist()
        },
        'life_table': life_table_df.to_dict('records'),
        'graduated': {
            'whittaker_henderson': {
                'ages': ages.tolist(),
                'qx': qx_whittaker.tolist(),
                'method': 'Whittaker-Henderson (order=3, λ=100)'
            },
            'moving_average': {
                'ages': ages.tolist(),
                'qx': qx_moving_avg.tolist(),
                'method': 'Weighted Moving Average (window=5)'
            },
            'penalized_spline': {
                'ages': ages.tolist(),
                'qx': qx_spline.tolist(),
                'method': 'Penalized Cubic Spline'
            }
        },
        'fitted_models': {
            'gompertz': gompertz_fit,
            'makeham': makeham_fit
        },
        'kpis': {
            'life_expectancy_at_birth': life_expectancy_at_birth,
            'median_age_at_death': median_age_at_death,
            'total_population': radix,
            'total_deaths': total_deaths,
            'age_range': {
                'min': int(ages.min()),
                'max': int(ages.max())
            }
        },
        'metadata': {
            'n_ages': len(ages),
            'age_column': age_col,
            'qx_column': qx_col
        }
    }
