"""Time-series forecasting service for actuarial trend analysis and claims forecasting."""
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Statistical models
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import acf, pacf, adfuller
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf

# Auto ARIMA
try:
    from pmdarima import auto_arima
    PMDARIMA_AVAILABLE = True
except ImportError:
    PMDARIMA_AVAILABLE = False
    print("[WARN] pmdarima not available, auto ARIMA will use basic grid search")

# Prophet
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("[WARN] Prophet not available, Prophet forecasting will be disabled")

# Metrics
from sklearn.metrics import mean_squared_error, mean_absolute_error


class TimeSeriesAnalyzer:
    """Comprehensive time-series forecasting analyzer."""
    
    def __init__(self, csv_path: str, date_col: Optional[str] = None, value_col: Optional[str] = None):
        """
        Initialize time-series analyzer.
        
        Args:
            csv_path: Path to CSV file
            date_col: Name of date column (auto-detected if None)
            value_col: Name of value column (auto-detected if None)
        """
        self.csv_path = csv_path
        self.df = pd.read_csv(csv_path)
        
        # Auto-detect date and value columns
        self.date_col = date_col or self._detect_date_column()
        self.value_col = value_col or self._detect_value_column()
        
        # Prepare time series
        self.ts = self._prepare_time_series()
        
        # Analysis results
        self.seasonality_info = None
        self.decomposition = None
        self.models = {}
        
    def _detect_date_column(self) -> str:
        """Auto-detect date/time column."""
        # Check for datetime dtype
        for col in self.df.columns:
            if pd.api.types.is_datetime64_any_dtype(self.df[col]):
                return col
        
        # Check for date-like column names
        date_keywords = ['date', 'time', 'month', 'year', 'period', 'timestamp']
        for col in self.df.columns:
            if any(keyword in col.lower() for keyword in date_keywords):
                # Try to parse as date
                try:
                    pd.to_datetime(self.df[col])
                    return col
                except:
                    continue
        
        # Default to first column
        return self.df.columns[0]
    
    def _detect_value_column(self) -> str:
        """Auto-detect numeric value column."""
        # Get numeric columns
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Also check object columns that might contain numeric data (CSV parsing issue)
        for col in self.df.columns:
            if col != self.date_col and col not in numeric_cols and self.df[col].dtype == 'object':
                try:
                    # Try converting to numeric - use coerce to handle invalid values
                    converted = pd.to_numeric(self.df[col], errors='coerce')
                    # If at least some values were converted successfully, consider it numeric
                    if converted.notna().sum() > 0:
                        numeric_cols.append(col)
                except:
                    pass
        
        # Exclude date column if it's numeric
        numeric_cols = [col for col in numeric_cols if col != self.date_col]
        
        if not numeric_cols:
            raise ValueError("No numeric columns found for forecasting")
        
        # Prefer columns with keywords
        value_keywords = ['amount', 'value', 'claim', 'count', 'total', 'sum', 'revenue', 'sales', 'temperature', 'temp']
        for col in numeric_cols:
            if any(keyword in col.lower() for keyword in value_keywords):
                return col
        
        # Return first numeric column
        return numeric_cols[0]
    
    def _prepare_time_series(self) -> pd.Series:
        """Prepare time series with datetime index."""
        # Convert date column to datetime
        dates = pd.to_datetime(self.df[self.date_col])
        
        # Convert value column to numeric if it's object type
        values = self.df[self.value_col]
        if values.dtype == 'object':
            values = pd.to_numeric(values, errors='coerce')
        
        # Create series with datetime index
        ts = pd.Series(
            values.values,
            index=dates,
            name=self.value_col
        )
        
        # Sort by date
        ts = ts.sort_index()
        
        # Remove duplicates (keep last)
        ts = ts[~ts.index.duplicated(keep='last')]
        
        # Handle missing values (forward fill)
        ts = ts.fillna(method='ffill')
        
        return ts
    
    def detect_seasonality(self) -> Dict[str, Any]:
        """
        Detect seasonality in time series.
        
        Returns:
            Dictionary with seasonality information
        """
        if self.seasonality_info is not None:
            return self.seasonality_info
        
        # Infer frequency
        freq = pd.infer_freq(self.ts.index)
        
        # Determine potential seasonal periods
        if freq and 'M' in freq:
            seasonal_period = 12  # Monthly data -> yearly seasonality
        elif freq and 'Q' in freq:
            seasonal_period = 4   # Quarterly data
        elif freq and 'W' in freq:
            seasonal_period = 52  # Weekly data
        elif freq and 'D' in freq:
            seasonal_period = 7   # Daily data -> weekly seasonality
        else:
            seasonal_period = 12  # Default to 12
        
        # Test for stationarity
        try:
            adf_result = adfuller(self.ts.dropna())
            is_stationary = adf_result[1] < 0.05  # p-value < 0.05
        except:
            is_stationary = False
        
        # Calculate ACF to detect seasonality
        try:
            acf_values = acf(self.ts.dropna(), nlags=min(40, len(self.ts) // 2))
            
            # Check for significant peaks at seasonal lags
            seasonal_strength = 0.0
            if len(acf_values) > seasonal_period:
                seasonal_strength = abs(acf_values[seasonal_period])
            
            has_seasonality = seasonal_strength > 0.3
        except:
            has_seasonality = False
            seasonal_strength = 0.0
        
        self.seasonality_info = {
            'detected': has_seasonality,
            'period': seasonal_period,
            'strength': float(seasonal_strength),
            'is_stationary': is_stationary,
            'frequency': freq or 'unknown'
        }
        
        return self.seasonality_info
    
    def decompose_series(self, model: str = 'additive') -> Dict[str, Any]:
        """
        Decompose time series into trend, seasonal, and residual components.
        
        Args:
            model: 'additive' or 'multiplicative'
            
        Returns:
            Dictionary with decomposition components
        """
        if self.decomposition is not None:
            return self.decomposition
        
        # Detect seasonality first
        seasonality = self.detect_seasonality()
        period = seasonality['period']
        
        # Need at least 2 full periods
        if len(self.ts) < 2 * period:
            period = max(2, len(self.ts) // 4)
        
        try:
            # Perform decomposition
            decomp = seasonal_decompose(
                self.ts,
                model=model,
                period=period,
                extrapolate_trend='freq'
            )
            
            self.decomposition = {
                'trend': decomp.trend.tolist(),
                'seasonal': decomp.seasonal.tolist(),
                'residual': decomp.resid.tolist(),
                'periods': self.ts.index.strftime('%Y-%m-%d').tolist(),
                'model': model,
                'period': period
            }
        except Exception as e:
            print(f"[WARN] Decomposition failed: {e}")
            # Return simple trend (moving average)
            trend = self.ts.rolling(window=min(12, len(self.ts) // 4), center=True).mean()
            self.decomposition = {
                'trend': trend.tolist(),
                'seasonal': [0] * len(self.ts),
                'residual': (self.ts - trend).tolist(),
                'periods': self.ts.index.strftime('%Y-%m-%d').tolist(),
                'model': 'simple',
                'period': period
            }
        
        return self.decomposition
    
    def fit_arima(self, order: Optional[Tuple[int, int, int]] = None) -> Dict[str, Any]:
        """
        Fit ARIMA model.
        
        Args:
            order: (p, d, q) order, auto-selected if None
            
        Returns:
            Model results dictionary
        """
        if order is None:
            # Auto-select order
            if PMDARIMA_AVAILABLE:
                try:
                    auto_model = auto_arima(
                        self.ts,
                        start_p=0, start_q=0,
                        max_p=5, max_q=5,
                        seasonal=False,
                        stepwise=True,
                        suppress_warnings=True,
                        error_action='ignore'
                    )
                    order = auto_model.order
                except Exception as e:
                    print(f"[WARN] auto_arima failed: {e}, using default order")
                    order = (1, 1, 1)
            else:
                # Simple grid search
                order = self._grid_search_arima()
        
        # Fit ARIMA model
        try:
            model = ARIMA(self.ts, order=order)
            fitted_model = model.fit()
            
            self.models['arima'] = {
                'model': fitted_model,
                'order': order,
                'aic': fitted_model.aic,
                'bic': fitted_model.bic,
                'fitted_values': fitted_model.fittedvalues.tolist()
            }
            
            return self.models['arima']
        except Exception as e:
            print(f"[ERROR] ARIMA fitting failed: {e}")
            return None
    
    def fit_sarima(self, order: Optional[Tuple[int, int, int]] = None,
                   seasonal_order: Optional[Tuple[int, int, int, int]] = None) -> Dict[str, Any]:
        """
        Fit SARIMA model.
        
        Args:
            order: (p, d, q) order
            seasonal_order: (P, D, Q, s) seasonal order
            
        Returns:
            Model results dictionary
        """
        # Detect seasonality
        seasonality = self.detect_seasonality()
        
        if not seasonality['detected']:
            print("[INFO] No seasonality detected, SARIMA may not be necessary")
        
        if order is None:
            order = (1, 1, 1)
        
        if seasonal_order is None:
            s = seasonality['period']
            seasonal_order = (1, 1, 1, s)
        
        try:
            model = SARIMAX(self.ts, order=order, seasonal_order=seasonal_order)
            fitted_model = model.fit(disp=False)
            
            self.models['sarima'] = {
                'model': fitted_model,
                'order': order,
                'seasonal_order': seasonal_order,
                'aic': fitted_model.aic,
                'bic': fitted_model.bic,
                'fitted_values': fitted_model.fittedvalues.tolist()
            }
            
            return self.models['sarima']
        except Exception as e:
            print(f"[ERROR] SARIMA fitting failed: {e}")
            return None
    
    def fit_holt_winters(self, seasonal: str = 'add', seasonal_periods: Optional[int] = None) -> Dict[str, Any]:
        """
        Fit Holt-Winters (Triple Exponential Smoothing) model.
        
        Args:
            seasonal: 'add' or 'mul' for additive/multiplicative seasonality
            seasonal_periods: Seasonal period (auto-detected if None)
            
        Returns:
            Model results dictionary
        """
        # Detect seasonality
        seasonality = self.detect_seasonality()
        
        if seasonal_periods is None:
            seasonal_periods = seasonality['period']
        
        # Ensure we have enough data
        if len(self.ts) < 2 * seasonal_periods:
            print(f"[WARN] Not enough data for Holt-Winters (need {2 * seasonal_periods}, have {len(self.ts)})")
            return None
        
        try:
            model = ExponentialSmoothing(
                self.ts,
                seasonal_periods=seasonal_periods,
                trend='add',
                seasonal=seasonal
            )
            fitted_model = model.fit()
            
            # Calculate AIC/BIC manually (not provided by ExponentialSmoothing)
            residuals = self.ts - fitted_model.fittedvalues
            n = len(self.ts)
            k = 3 + seasonal_periods  # Number of parameters
            sse = np.sum(residuals ** 2)
            aic = n * np.log(sse / n) + 2 * k
            bic = n * np.log(sse / n) + k * np.log(n)
            
            self.models['holt_winters'] = {
                'model': fitted_model,
                'seasonal': seasonal,
                'seasonal_periods': seasonal_periods,
                'aic': aic,
                'bic': bic,
                'fitted_values': fitted_model.fittedvalues.tolist()
            }
            
            return self.models['holt_winters']
        except Exception as e:
            print(f"[ERROR] Holt-Winters fitting failed: {e}")
            return None
    
    def fit_prophet(self) -> Dict[str, Any]:
        """
        Fit Facebook Prophet model.
        
        Returns:
            Model results dictionary
        """
        if not PROPHET_AVAILABLE:
            print("[WARN] Prophet not available")
            return None
        
        try:
            # Prepare data for Prophet (needs 'ds' and 'y' columns)
            prophet_df = pd.DataFrame({
                'ds': self.ts.index,
                'y': self.ts.values
            })
            
            # Fit Prophet model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False
            )
            model.fit(prophet_df)
            
            # Get fitted values
            fitted = model.predict(prophet_df)
            
            # Calculate AIC/BIC manually
            residuals = self.ts.values - fitted['yhat'].values
            n = len(self.ts)
            k = 10  # Approximate number of parameters in Prophet
            sse = np.sum(residuals ** 2)
            aic = n * np.log(sse / n) + 2 * k
            bic = n * np.log(sse / n) + k * np.log(n)
            
            self.models['prophet'] = {
                'model': model,
                'aic': aic,
                'bic': bic,
                'fitted_values': fitted['yhat'].tolist()
            }
            
            return self.models['prophet']
        except Exception as e:
            print(f"[ERROR] Prophet fitting failed: {e}")
            return None
    
    def _grid_search_arima(self) -> Tuple[int, int, int]:
        """Simple grid search for ARIMA order."""
        best_aic = np.inf
        best_order = (1, 1, 1)
        
        for p in range(3):
            for d in range(2):
                for q in range(3):
                    try:
                        model = ARIMA(self.ts, order=(p, d, q))
                        fitted = model.fit()
                        if fitted.aic < best_aic:
                            best_aic = fitted.aic
                            best_order = (p, d, q)
                    except:
                        continue
        
        return best_order
    
    def auto_select_model(self, forecast_periods: int = 12) -> Dict[str, Any]:
        """
        Automatically select best model based on AIC/BIC and validation.
        
        Args:
            forecast_periods: Number of periods to forecast
            
        Returns:
            Complete analysis with best model selected
        """
        print("[INFO] Fitting all models for comparison...")
        
        # Fit all models
        self.fit_arima()
        self.fit_sarima()
        self.fit_holt_winters()
        self.fit_prophet()
        
        # Compare models
        model_comparison = []
        for name, model_info in self.models.items():
            if model_info is None:
                continue
            
            # Calculate RMSE on training data
            fitted = model_info['fitted_values']
            actual = self.ts.values[:len(fitted)]
            rmse = np.sqrt(mean_squared_error(actual, fitted))
            mae = mean_absolute_error(actual, fitted)
            
            model_comparison.append({
                'model': name,
                'aic': model_info['aic'],
                'bic': model_info['bic'],
                'rmse': float(rmse),
                'mae': float(mae)
            })
        
        # Select best model (lowest AIC)
        if model_comparison:
            best_model_name = min(model_comparison, key=lambda x: x['aic'])['model']
        else:
            print("[ERROR] No models successfully fitted")
            return None
        
        print(f"[INFO] Best model selected: {best_model_name}")
        
        # Generate forecast with best model
        result = self.forecast(best_model_name, forecast_periods)
        result['model_comparison'] = model_comparison
        result['best_model'] = best_model_name
        
        return result
    
    def forecast(self, model_type: str, forecast_periods: int = 12,
                 confidence_level: float = 0.95) -> Dict[str, Any]:
        """
        Generate forecast using specified model.
        
        Args:
            model_type: 'arima', 'sarima', 'holt_winters', or 'prophet'
            forecast_periods: Number of periods to forecast
            confidence_level: Confidence level for intervals (0.95 = 95%)
            
        Returns:
            Complete forecast results
        """
        # Ensure model is fitted
        if model_type not in self.models or self.models[model_type] is None:
            if model_type == 'arima':
                self.fit_arima()
            elif model_type == 'sarima':
                self.fit_sarima()
            elif model_type == 'holt_winters':
                self.fit_holt_winters()
            elif model_type == 'prophet':
                self.fit_prophet()
        
        model_info = self.models.get(model_type)
        if model_info is None:
            raise ValueError(f"Model {model_type} could not be fitted")
        
        # Generate forecast
        if model_type in ['arima', 'sarima']:
            forecast_result = model_info['model'].forecast(steps=forecast_periods)
            forecast_values = forecast_result.tolist() if hasattr(forecast_result, 'tolist') else list(forecast_result)
            
            # Get confidence intervals
            forecast_obj = model_info['model'].get_forecast(steps=forecast_periods)
            conf_int = forecast_obj.conf_int(alpha=1 - confidence_level)
            lower_bound = conf_int.iloc[:, 0].tolist()
            upper_bound = conf_int.iloc[:, 1].tolist()
            
        elif model_type == 'holt_winters':
            forecast_result = model_info['model'].forecast(steps=forecast_periods)
            forecast_values = forecast_result.tolist()
            
            # Approximate confidence intervals (Holt-Winters doesn't provide them directly)
            std_error = np.std(self.ts - model_info['model'].fittedvalues)
            z_score = 1.96 if confidence_level == 0.95 else 2.576
            lower_bound = [v - z_score * std_error for v in forecast_values]
            upper_bound = [v + z_score * std_error for v in forecast_values]
            
        elif model_type == 'prophet':
            # Create future dataframe
            future = model_info['model'].make_future_dataframe(periods=forecast_periods)
            forecast_df = model_info['model'].predict(future)
            
            # Extract forecast (last forecast_periods rows)
            forecast_values = forecast_df['yhat'].tail(forecast_periods).tolist()
            lower_bound = forecast_df['yhat_lower'].tail(forecast_periods).tolist()
            upper_bound = forecast_df['yhat_upper'].tail(forecast_periods).tolist()
        
        # Generate future periods
        last_date = self.ts.index[-1]
        freq = pd.infer_freq(self.ts.index) or 'M'
        future_periods = pd.date_range(start=last_date, periods=forecast_periods + 1, freq=freq)[1:]
        
        # Get decomposition
        decomposition = self.decompose_series()
        
        # Get seasonality info
        seasonality = self.detect_seasonality()
        
        # Calculate metrics
        fitted = model_info['fitted_values']
        actual = self.ts.values[:len(fitted)]
        rmse = float(np.sqrt(mean_squared_error(actual, fitted)))
        mae = float(mean_absolute_error(actual, fitted))
        mape = float(np.mean(np.abs((actual - fitted) / actual)) * 100)
        
        # Build result
        result = {
            'model_type': model_type,
            'parameters': self._get_model_parameters(model_type, model_info),
            'forecast': {
                'periods': future_periods.strftime('%Y-%m-%d').tolist(),
                'values': forecast_values,
                'lower_bound': lower_bound,
                'upper_bound': upper_bound,
                'confidence_level': confidence_level
            },
            'historical': {
                'periods': self.ts.index.strftime('%Y-%m-%d').tolist(),
                'actual': self.ts.tolist(),
                'fitted': fitted
            },
            'decomposition': decomposition,
            'metrics': {
                'rmse': rmse,
                'mae': mae,
                'mape': mape,
                'aic': model_info['aic'],
                'bic': model_info['bic']
            },
            'seasonality': seasonality,
            'metadata': {
                'date_column': self.date_col,
                'value_column': self.value_col,
                'n_observations': len(self.ts),
                'forecast_periods': forecast_periods
            }
        }
        
        return result
    
    def _get_model_parameters(self, model_type: str, model_info: Dict) -> Dict[str, Any]:
        """Extract model parameters for display."""
        if model_type == 'arima':
            return {'order': model_info['order']}
        elif model_type == 'sarima':
            return {
                'order': model_info['order'],
                'seasonal_order': model_info['seasonal_order']
            }
        elif model_type == 'holt_winters':
            return {
                'seasonal': model_info['seasonal'],
                'seasonal_periods': model_info['seasonal_periods']
            }
        elif model_type == 'prophet':
            return {'model': 'Prophet with automatic seasonality detection'}
        return {}
    
    def evaluate_model(self, model_type: str, test_size: int = 12) -> Dict[str, float]:
        """
        Evaluate model on test set.
        
        Args:
            model_type: Model to evaluate
            test_size: Number of periods to use as test set
            
        Returns:
            Dictionary of evaluation metrics
        """
        # Split data
        train = self.ts[:-test_size]
        test = self.ts[-test_size:]
        
        # Create new analyzer with training data
        temp_ts = self.ts
        self.ts = train
        
        # Fit and forecast
        if model_type == 'arima':
            self.fit_arima()
        elif model_type == 'sarima':
            self.fit_sarima()
        elif model_type == 'holt_winters':
            self.fit_holt_winters()
        elif model_type == 'prophet':
            self.fit_prophet()
        
        forecast_result = self.forecast(model_type, test_size)
        predictions = forecast_result['forecast']['values']
        
        # Restore original data
        self.ts = temp_ts
        
        # Calculate metrics
        rmse = float(np.sqrt(mean_squared_error(test, predictions)))
        mae = float(mean_absolute_error(test, predictions))
        mape = float(np.mean(np.abs((test - predictions) / test)) * 100)
        
        return {
            'rmse': rmse,
            'mae': mae,
            'mape': mape
        }


def _convert_to_json_serializable(obj):
    """Convert numpy types to Python native types for JSON serialization."""
    if isinstance(obj, dict):
        return {key: _convert_to_json_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [_convert_to_json_serializable(item) for item in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        # Handle inf and NaN values - convert to None for JSON compliance
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, float):
        # Handle Python float inf/NaN
        if np.isnan(obj) or np.isinf(obj):
            return None
        return obj
    else:
        return obj


def run_time_series_analysis(csv_path: str, date_col: Optional[str] = None,
                             value_col: Optional[str] = None,
                             forecast_periods: int = 12,
                             model_type: str = 'auto') -> Dict[str, Any]:
    """
    Convenience function to run time-series analysis.
    
    Args:
        csv_path: Path to CSV file
        date_col: Date column name (auto-detected if None)
        value_col: Value column name (auto-detected if None)
        forecast_periods: Number of periods to forecast
        model_type: 'auto', 'arima', 'sarima', 'holt_winters', or 'prophet'
        
    Returns:
        Complete forecast results
    """
    analyzer = TimeSeriesAnalyzer(csv_path, date_col, value_col)
    
    if model_type == 'auto':
        result = analyzer.auto_select_model(forecast_periods)
    else:
        result = analyzer.forecast(model_type, forecast_periods)
    
    # Convert numpy types to Python native types for JSON serialization
    return _convert_to_json_serializable(result)
