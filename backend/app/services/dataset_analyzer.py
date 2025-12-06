"""AI-powered dataset analyzer for actuarial data validation."""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path


class DatasetAnalyzer:
    """Intelligent analyzer for actuarial datasets."""
    
    def __init__(self, csv_path: str):
        """Initialize analyzer with CSV path."""
        self.csv_path = csv_path
        self.df = None
        self.analysis_result = {}
        
    def analyze(self) -> Dict[str, Any]:
        """
        Perform comprehensive dataset analysis.
        
        Returns:
            Dictionary with analysis results including:
            - dataset_type: 'survival', 'claims_triangle', 'unknown'
            - is_valid: bool
            - issues: list of validation issues
            - recommendations: list of suggestions
            - metadata: dataset statistics
        """
        try:
            self.df = pd.read_csv(self.csv_path)
        except Exception as e:
            return {
                "dataset_type": "unknown",
                "is_valid": False,
                "issues": [f"Failed to read CSV: {str(e)}"],
                "recommendations": ["Ensure file is valid CSV format"],
                "metadata": {}
            }
        
        # Detect dataset type
        dataset_type = self._detect_dataset_type()
        
        # Validate based on type
        survival_types = ["survival_analysis", "clinical_survival", "insurance_survival"]
        triangle_types = ["claims_triangle", "potential_triangle"]
        
        if dataset_type in survival_types or dataset_type == "mortality_table":
            validation = self._validate_survival_data()
        elif dataset_type == "funeral_claims":
            validation = self._validate_funeral_data()
        elif dataset_type in triangle_types:
            validation = self._validate_triangle_data()
        else:
            validation = {
                "is_valid": True,  # Allow other types to proceed
                "issues": [],
                "recommendations": [f"Detected as '{dataset_type}'. Will attempt general analysis."]
            }
        
        # Add metadata
        metadata = self._extract_metadata()
        
        # Add data preview
        preview = self._get_data_preview()
        
        return {
            "dataset_type": dataset_type,
            "is_valid": validation["is_valid"],
            "issues": validation.get("issues", []),
            "recommendations": validation.get("recommendations", []),
            "metadata": metadata,
            "column_info": self._analyze_columns(),
            "preview": preview
        }
        
        return {
            "dataset_type": dataset_type,
            "is_valid": validation["is_valid"],
            "issues": validation.get("issues", []),
            "recommendations": validation.get("recommendations", []),
            "metadata": metadata,
            "column_info": self._analyze_columns()
        }
    
    def _detect_dataset_type(self) -> str:
        """Detect specific actuarial dataset type with intelligent analysis."""
        columns = [col.lower() for col in self.df.columns]
        column_set = set(columns)
        
        # Analyze column names and content for specific patterns
        
        # 0. TIME-SERIES DATA - Check for temporal data suitable for forecasting
        # Look for date/time columns
        date_cols = []
        for col in self.df.columns:
            col_lower = col.lower()
            # Check if column is datetime type
            if pd.api.types.is_datetime64_any_dtype(self.df[col]):
                date_cols.append(col)
                continue
            
            # Check if column name suggests date/time
            if any(keyword in col_lower for keyword in ['date', 'time', 'month', 'year', 'period', 'timestamp', 'quarter', 'day']):
                # Try to parse as date
                try:
                    pd.to_datetime(self.df[col], errors='coerce')
                    date_cols.append(col)
                    continue
                except:
                    pass
            
            # Even if column name doesn't suggest date, try parsing first column as date
            # (common pattern in time series datasets)
            if col == self.df.columns[0] and self.df[col].dtype == 'object':
                try:
                    parsed_dates = pd.to_datetime(self.df[col], errors='coerce')
                    # If most values parse successfully, consider it a date column
                    if parsed_dates.notna().sum() / len(self.df) > 0.8:
                        date_cols.append(col)
                        continue
                except:
                    pass
        
        # Get numeric columns
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Also check object columns that might contain numeric data (CSV parsing issue)
        for col in self.df.columns:
            if col not in date_cols and col not in numeric_cols and self.df[col].dtype == 'object':
                try:
                    # Try converting to numeric - use coerce to handle invalid values like "?0.2"
                    converted = pd.to_numeric(self.df[col], errors='coerce')
                    # If at least 50% of values were converted successfully, consider it numeric
                    valid_ratio = converted.notna().sum() / len(self.df)
                    if valid_ratio > 0.5:
                        numeric_cols.append(col)
                        print(f"[INFO] Detected numeric column '{col}' (object type, {valid_ratio*100:.1f}% valid values)")
                except:
                    pass
        
        # If we have date column(s) + numeric column(s), it's time-series
        if date_cols and len(numeric_cols) >= 1:
            print(f"[INFO] Potential time-series detected: {len(date_cols)} date columns, {len(numeric_cols)} numeric columns")
            # Additional check: ensure it's not just a single date column with IDs
            # Time-series should have sequential dates
            if len(self.df) >= 3:  # Need at least 3 observations for time-series
                # Check if dates are sequential (not all the same)
                try:
                    dates = pd.to_datetime(self.df[date_cols[0]], errors='coerce')
                    unique_dates = dates.nunique()
                    print(f"[INFO] Date column '{date_cols[0]}' has {unique_dates} unique values out of {len(self.df)} rows")
                    if unique_dates >= 3:  # At least 3 different dates
                        print(f"[INFO] Classified as time_series")
                        return "time_series"
                except Exception as e:
                    print(f"[WARN] Failed to parse dates: {e}")
                    pass
        
        # 1. MORTALITY / LIFE TABLE DATA
        mortality_indicators = {'age', 'death', 'deaths', 'mortality', 'qx', 'lx', 'dx', 'px'}
        if len(column_set & mortality_indicators) >= 2:
            return "mortality_table"
        
        # 2. FUNERAL / DEATH CLAIMS DATA - Check for specific funeral columns
        # Check for LIFE, BIRTH, ENTRY, DEATH pattern (common in funeral data)
        if 'life' in columns and 'death' in columns:
            return "funeral_claims"

        
        funeral_indicators = {'funeral', 'burial', 'cremation', 'death_date', 'deceased', 'cause_of_death', 'birth', 'entry'}
        if any(ind in ' '.join(columns) for ind in funeral_indicators):
            return "funeral_claims"
        
        # 3. SURVIVAL ANALYSIS DATA (clinical/medical) - CHECK THIS BEFORE TRIANGLE!
        has_time = any(col in columns for col in ['time', 'duration', 'followup', 'survival_time', 'days', 'months', 'years'])
        has_event = any(col in columns for col in ['event', 'status', 'death', 'censored', 'died'])
        
        # IMPORTANT: If we have time AND event columns, it's survival data, not triangle!
        if has_time and has_event:
            # Check if it's medical/clinical data
            medical_indicators = {'treatment', 'diagnosis', 'patient', 'hospital', 'therapy', 'drug'}
            if any(ind in ' '.join(columns) for ind in medical_indicators):
                return "clinical_survival"
            
            # Check if it's insurance/actuarial survival
            insurance_indicators = {'policy', 'premium', 'insured', 'coverage', 'claim'}
            if any(ind in ' '.join(columns) for ind in insurance_indicators):
                return "insurance_survival"
            
            # Default to survival analysis
            return "survival_analysis"
        
        # 4. CLAIMS TRIANGLE (reserving) - Only check if NOT survival data
        has_origin = 'origin' in columns or 'accident_year' in columns or 'ay' in columns or 'year' in columns
        dev_cols = [col for col in columns if 'dev' in col or 'development' in col or col.startswith('lag')]
        
        # Only consider it a triangle if it has EXPLICIT triangle structure
        if has_origin and len(dev_cols) >= 2:
            return "claims_triangle"
        
        # 5. INSURANCE CLAIMS DATA (individual claims)
        claims_indicators = {'claim_id', 'claim_amount', 'claim_date', 'loss_date', 'reported_date', 'settled_date'}
        if len(column_set & claims_indicators) >= 2:
            return "insurance_claims"
        
        # 5b. GLM-COMPATIBLE DATA (actuarial pricing)
        # Check for count data (frequency modeling)
        count_indicators = {'claim_count', 'claims', 'incidents', 'losses', 'count', 'frequency'}
        amount_indicators = {'claim_amount', 'loss_amount', 'severity', 'cost', 'payment', 'amount', 'expenses', 'charges', 'premium'}
        
        # Check if we have potential target variables for GLM
        has_count_target = any(ind in ' '.join(columns) for ind in count_indicators)
        has_amount_target = any(ind in ' '.join(columns) for ind in amount_indicators)
        
        # Check for common actuarial/insurance features (broader set)
        feature_indicators = {'age', 'gender', 'sex', 'region', 'vehicle', 'exposure', 'risk', 'class', 'type', 
                            'bmi', 'children', 'smoker', 'married', 'education', 'occupation'}
        has_features = len(column_set & feature_indicators) >= 2
        
        if (has_count_target or has_amount_target) and has_features:
            if has_count_target:
                return "glm_frequency"
            elif has_amount_target:
                return "glm_severity"
        
        # Broader check: if we have numeric columns with insurance/actuarial features
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        if len(numeric_cols) >= 2 and has_features:
            # Has numeric targets and insurance features
            return "glm_compatible"
        
        # Check for numeric columns that could be GLM targets
        if len(numeric_cols) >= 2:  # At least one target + one feature
            # Check if any numeric column looks like count data (non-negative integers)
            for col in numeric_cols:
                if (self.df[col] >= 0).all() and np.allclose(self.df[col].dropna(), self.df[col].dropna().astype(int)):
                    if len(numeric_cols) >= 3:  # Has potential features
                        return "glm_compatible"
        
        # 6. POLICY DATA
        policy_indicators = {'policy_id', 'policy_number', 'premium', 'sum_assured', 'coverage', 'policy_date'}
        if len(column_set & policy_indicators) >= 2:
            return "insurance_policy"
        
        # 7. ANNUITY DATA
        annuity_indicators = {'annuity', 'pension', 'retirement', 'payout', 'annuitant'}
        if any(ind in ' '.join(columns) for ind in annuity_indicators):
            return "annuity_data"
        
        # 8. Check numeric columns for potential triangle - ONLY if no time/event columns
        if not has_time and not has_event:
            numeric_cols = self.df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) >= 4 and len(self.df) >= 4:
                # Could be triangle without explicit labels - but be conservative
                # Check if it looks like a triangle (decreasing non-null counts per row)
                null_counts = self.df[numeric_cols].isna().sum(axis=1)
                if null_counts.is_monotonic_increasing:
                    return "potential_triangle"
        
        
        # 9. GENERAL ACTUARIAL DATA
        actuarial_indicators = {'exposure', 'incurred', 'paid', 'reserve', 'ultimate', 'loss_ratio'}
        if len(column_set & actuarial_indicators) >= 1:
            return "actuarial_data"
        
        return "unknown"
    
    def _validate_survival_data(self) -> Dict:
        """Validate survival analysis dataset."""
        issues = []
        recommendations = []
        
        # Find time and event columns
        time_col = self._find_column(['time', 'duration', 'followup', 'survival_time'])
        event_col = self._find_column(['event', 'status', 'death', 'censored'])
        
        if not time_col:
            issues.append("Missing time/duration column")
            recommendations.append("Add a column named 'time', 'duration', or 'followup' with numeric values")
        else:
            # Validate time column
            if not pd.api.types.is_numeric_dtype(self.df[time_col]):
                issues.append(f"Time column '{time_col}' must be numeric")
            if (self.df[time_col] < 0).any():
                issues.append("Time values cannot be negative")
            if self.df[time_col].isna().any():
                issues.append(f"Time column has {self.df[time_col].isna().sum()} missing values")
        
        if not event_col:
            issues.append("Missing event/status column")
            recommendations.append("Add a column named 'event' or 'status' with binary values (0/1)")
        else:
            # Validate event column
            unique_events = self.df[event_col].dropna().unique()
            if not all(val in [0, 1, '0', '1', True, False] for val in unique_events):
                issues.append(f"Event column should contain only 0/1 values, found: {unique_events}")
        
        # Check sample size
        if len(self.df) < 10:
            issues.append(f"Sample size too small ({len(self.df)} rows). Need at least 10 observations")
        
        # Check for potential covariates
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        covariate_cols = [col for col in numeric_cols if col not in [time_col, event_col]]
        
        if len(covariate_cols) == 0:
            recommendations.append("Consider adding covariates (age, gender, etc.) for richer analysis")
        
        is_valid = len(issues) == 0
        
        return {
            "is_valid": is_valid,
            "issues": issues,
            "recommendations": recommendations
        }
    
    def _validate_funeral_data(self) -> Dict:
        """Validate funeral/death claims dataset."""
        issues = []
        recommendations = []
        
        # Check for expected funeral data columns
        columns_lower = [col.lower() for col in self.df.columns]
        
        # Common funeral data patterns
        has_life = 'life' in columns_lower
        has_death = 'death' in columns_lower
        has_birth = 'birth' in columns_lower
        has_entry = 'entry' in columns_lower
        
        if not (has_life or has_death):
            issues.append("Expected LIFE or DEATH column for funeral data")
        
        # Check sample size
        if len(self.df) < 10:
            issues.append(f"Sample size too small ({len(self.df)} rows)")
        
        # Check for date columns that should be dates
        for col in self.df.columns:
            if col.lower() in ['birth', 'death', 'entry', 'life']:
                # Check if it looks like date data
                if not pd.api.types.is_numeric_dtype(self.df[col]) and not pd.api.types.is_datetime64_any_dtype(self.df[col]):
                    recommendations.append(f"Column '{col}' may need to be converted to date format")
        
        # Check for missing values
        missing_pct = (self.df.isna().sum().sum() / (len(self.df) * len(self.df.columns))) * 100
        if missing_pct > 20:
            recommendations.append(f"High percentage of missing values ({missing_pct:.1f}%)")
        
        is_valid = len(issues) == 0
        
        return {
            "is_valid": is_valid,
            "issues": issues,
            "recommendations": recommendations
        }
    
    def _validate_triangle_data(self) -> Dict:
        """Validate claims triangle dataset."""
        issues = []
        recommendations = []
        
        # Check for origin column
        origin_col = self._find_column(['origin', 'accident_year', 'ay', 'year'])
        
        if not origin_col:
            # Assume first column is origin
            origin_col = self.df.columns[0]
            recommendations.append(f"Assuming '{origin_col}' is the origin/accident year column")
        
        # Get development columns (numeric columns excluding origin)
        dev_cols = [col for col in self.df.columns if col != origin_col and pd.api.types.is_numeric_dtype(self.df[col])]
        
        if len(dev_cols) < 2:
            issues.append(f"Need at least 2 development periods, found {len(dev_cols)}")
        
        # Check triangle shape
        if len(self.df) < 2:
            issues.append(f"Need at least 2 origin years, found {len(self.df)}")
        
        # Validate numeric values
        for col in dev_cols:
            if (self.df[col].dropna() < 0).any():
                issues.append(f"Column '{col}' contains negative values (claims should be positive)")
        
        # Check for proper triangle structure (upper triangle pattern)
        null_pattern_valid = True
        for i, row in self.df.iterrows():
            non_null_count = row[dev_cols].notna().sum()
            expected_count = len(dev_cols) - i
            if non_null_count > expected_count:
                null_pattern_valid = False
                break
        
        if not null_pattern_valid:
            recommendations.append("Triangle structure may not follow standard upper-triangle pattern")
        
        is_valid = len(issues) == 0
        
        return {
            "is_valid": is_valid,
            "issues": issues,
            "recommendations": recommendations
        }
    
    def _find_column(self, candidates: List[str]) -> Optional[str]:
        """Find first matching column from candidates list."""
        columns_lower = {col.lower(): col for col in self.df.columns}
        for candidate in candidates:
            if candidate.lower() in columns_lower:
                return columns_lower[candidate.lower()]
        return None
    
    def _extract_metadata(self) -> Dict:
        """Extract dataset metadata."""
        return {
            "rows": len(self.df),
            "columns": len(self.df.columns),
            "column_names": list(self.df.columns),
            "missing_values": int(self.df.isna().sum().sum()),
            "memory_usage_mb": round(self.df.memory_usage(deep=True).sum() / 1024 / 1024, 2)
        }
    
    def _analyze_columns(self) -> List[Dict]:
        """Analyze each column's characteristics."""
        column_info = []
        
        for col in self.df.columns:
            info = {
                "name": col,
                "dtype": str(self.df[col].dtype),
                "missing": int(self.df[col].isna().sum()),
                "unique": int(self.df[col].nunique())
            }
            
            if pd.api.types.is_numeric_dtype(self.df[col]):
                info.update({
                    "min": float(self.df[col].min()) if not self.df[col].isna().all() else None,
                    "max": float(self.df[col].max()) if not self.df[col].isna().all() else None,
                    "mean": float(self.df[col].mean()) if not self.df[col].isna().all() else None
                })
            
            column_info.append(info)
        
        return column_info
    
    def _get_data_preview(self) -> List[Dict]:
        """Get first few rows as preview."""
        preview_rows = self.df.head(5).to_dict('records')
        # Convert any NaN to None for JSON serialization
        for row in preview_rows:
            for key, value in row.items():
                if pd.isna(value):
                    row[key] = None
        return preview_rows
    
    def _get_general_recommendations(self) -> List[str]:
        """Get general recommendations for unknown dataset types."""
        return [
            "For survival analysis: Include 'time' and 'event' columns",
            "For chain-ladder: Include 'origin' column and development period columns (dev0, dev1, etc.)",
            "Ensure numeric columns contain valid numbers",
            "Remove or handle missing values appropriately",
            "Check column names match expected format"
        ]


def analyze_dataset(csv_path: str) -> Dict[str, Any]:
    """
    Convenience function to analyze a dataset.
    
    Args:
        csv_path: Path to CSV file
        
    Returns:
        Analysis results dictionary
    """
    analyzer = DatasetAnalyzer(csv_path)
    return analyzer.analyze()
