"""Dataset profiling service for comprehensive data analysis and quality assessment."""
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from pathlib import Path
import json
from scipy import stats
from scipy.stats import chi2_contingency


class DatasetProfiler:
    """Comprehensive dataset profiling and analysis."""
    
    def __init__(self, csv_path: str):
        """Initialize profiler with dataset path."""
        self.csv_path = csv_path
        self.df = pd.read_csv(csv_path)
        self.numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        self.categorical_cols = self.df.select_dtypes(include=['object', 'category']).columns.tolist()

    def _sanitize_json(self, data: Any) -> Any:
        """Recursively sanitize data for JSON serialization (handle NaN/Inf)."""
        if isinstance(data, dict):
            return {k: self._sanitize_json(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._sanitize_json(v) for v in data]
        elif isinstance(data, float):
            if np.isnan(data) or np.isinf(data):
                return None
            return data
        elif isinstance(data, np.integer):
            return int(data)
        elif isinstance(data, np.floating):
            if np.isnan(data) or np.isinf(data):
                return None
            return float(data)
        elif isinstance(data, np.ndarray):
            return self._sanitize_json(data.tolist())
        return data
    
    def get_full_profile(self) -> Dict[str, Any]:
        """Get comprehensive dataset profile."""
        profile = {
            "overview": self.get_overview(),
            "columns": self.get_column_profiles(),
            "data_quality": self.get_data_quality_score(),
            "sample_data": self.df.head(10).to_dict('records')
        }
        return self._sanitize_json(profile)
    
    def get_overview(self) -> Dict[str, Any]:
        """Get dataset overview statistics."""
        return {
            "total_rows": len(self.df),
            "total_columns": len(self.df.columns),
            "numeric_columns": len(self.numeric_cols),
            "categorical_columns": len(self.categorical_cols),
            "total_missing": int(self.df.isna().sum().sum()),
            "missing_percentage": float((self.df.isna().sum().sum() / (len(self.df) * len(self.df.columns))) * 100),
            "memory_usage_mb": float(self.df.memory_usage(deep=True).sum() / 1024 / 1024),
            "duplicate_rows": int(self.df.duplicated().sum())
        }
    
    def get_column_profiles(self) -> List[Dict[str, Any]]:
        """Get detailed profile for each column."""
        profiles = []
        
        for col in self.df.columns:
            profile = {
                "name": col,
                "dtype": str(self.df[col].dtype),
                "missing_count": int(self.df[col].isna().sum()),
                "missing_percentage": float((self.df[col].isna().sum() / len(self.df)) * 100),
                "unique_count": int(self.df[col].nunique()),
                "unique_percentage": float((self.df[col].nunique() / len(self.df)) * 100)
            }
            
            # Numeric column statistics
            if col in self.numeric_cols:
                profile.update(self._get_numeric_stats(col))
            
            # Categorical column statistics
            elif col in self.categorical_cols:
                profile.update(self._get_categorical_stats(col))
            
            profiles.append(profile)
        
        return profiles
    
    def _get_numeric_stats(self, col: str) -> Dict[str, Any]:
        """Get statistics for numeric column."""
        data = self.df[col].dropna()
        
        if len(data) == 0:
            return {"type": "numeric", "stats": {}}
        
        q1 = float(data.quantile(0.25))
        q3 = float(data.quantile(0.75))
        iqr = q3 - q1
        
        # Outlier detection using IQR method
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        outliers = data[(data < lower_bound) | (data > upper_bound)]
        
        return {
            "type": "numeric",
            "stats": {
                "mean": float(data.mean()),
                "median": float(data.median()),
                "std": float(data.std()),
                "min": float(data.min()),
                "max": float(data.max()),
                "q1": q1,
                "q3": q3,
                "iqr": iqr,
                "skewness": float(data.skew()),
                "kurtosis": float(data.kurtosis()),
                "outlier_count": len(outliers),
                "outlier_percentage": float((len(outliers) / len(data)) * 100)
            },
            "sample_values": data.head(5).tolist()
        }
    
    def _get_categorical_stats(self, col: str) -> Dict[str, Any]:
        """Get statistics for categorical column."""
        data = self.df[col].dropna()
        
        if len(data) == 0:
            return {"type": "categorical", "stats": {}}
        
        value_counts = data.value_counts()
        
        return {
            "type": "categorical",
            "stats": {
                "mode": str(value_counts.index[0]) if len(value_counts) > 0 else None,
                "mode_frequency": int(value_counts.iloc[0]) if len(value_counts) > 0 else 0,
                "mode_percentage": float((value_counts.iloc[0] / len(data)) * 100) if len(value_counts) > 0 else 0,
                "cardinality": len(value_counts)
            },
            "top_values": [
                {"value": str(val), "count": int(count), "percentage": float((count / len(data)) * 100)}
                for val, count in value_counts.head(10).items()
            ],
            "sample_values": data.head(5).tolist()
        }
    
    def get_correlations(self) -> Dict[str, Any]:
        """Get correlation matrices for numeric and categorical variables."""
        result = {
            "numeric_correlations": None,
            "categorical_correlations": None
        }
        
        # Numeric correlations (Pearson)
        if len(self.numeric_cols) >= 2:
            corr_matrix = self.df[self.numeric_cols].corr()
            
            # Convert to list format for heatmap
            result["numeric_correlations"] = {
                "columns": self.numeric_cols,
                "matrix": corr_matrix.values.tolist(),
                "strong_correlations": self._find_strong_correlations(corr_matrix)
            }
        
        # Categorical correlations (Cramér's V)
        if len(self.categorical_cols) >= 2:
            result["categorical_correlations"] = self._calculate_cramers_v()
        
        return self._sanitize_json(result)
    
    def _find_strong_correlations(self, corr_matrix: pd.DataFrame, threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Find strong correlations above threshold."""
        strong_corrs = []
        
        for i in range(len(corr_matrix.columns)):
            for j in range(i + 1, len(corr_matrix.columns)):
                corr_value = corr_matrix.iloc[i, j]
                if abs(corr_value) >= threshold:
                    strong_corrs.append({
                        "col1": corr_matrix.columns[i],
                        "col2": corr_matrix.columns[j],
                        "correlation": float(corr_value),
                        "strength": "strong positive" if corr_value >= threshold else "strong negative"
                    })
        
        return strong_corrs
    
    def _calculate_cramers_v(self) -> Dict[str, Any]:
        """Calculate Cramér's V for categorical variables."""
        n_cats = len(self.categorical_cols)
        cramers_matrix = np.zeros((n_cats, n_cats))
        
        for i, col1 in enumerate(self.categorical_cols):
            for j, col2 in enumerate(self.categorical_cols):
                if i == j:
                    cramers_matrix[i, j] = 1.0
                else:
                    cramers_matrix[i, j] = self._cramers_v_stat(col1, col2)
        
        return {
            "columns": self.categorical_cols,
            "matrix": cramers_matrix.tolist()
        }
    
    def _cramers_v_stat(self, col1: str, col2: str) -> float:
        """Calculate Cramér's V statistic between two categorical columns."""
        try:
            confusion_matrix = pd.crosstab(self.df[col1], self.df[col2])
            chi2 = chi2_contingency(confusion_matrix)[0]
            n = confusion_matrix.sum().sum()
            min_dim = min(confusion_matrix.shape) - 1
            
            if min_dim == 0:
                return 0.0
            
            cramers_v = np.sqrt(chi2 / (n * min_dim))
            return float(cramers_v)
        except:
            return 0.0
    
    def get_distributions(self, column: Optional[str] = None) -> Dict[str, Any]:
        """Get distribution data for histograms and box plots."""
        if column:
            return self._sanitize_json({column: self._get_column_distribution(column)})
        
        # Get distributions for all columns
        distributions = {}
        for col in self.df.columns:
            distributions[col] = self._get_column_distribution(col)
        
        return self._sanitize_json(distributions)
    
    def _get_column_distribution(self, col: str) -> Dict[str, Any]:
        """Get distribution data for a single column."""
        if col in self.numeric_cols:
            return self._get_numeric_distribution(col)
        elif col in self.categorical_cols:
            return self._get_categorical_distribution(col)
        else:
            return {"type": "unknown"}
    
    def _get_numeric_distribution(self, col: str) -> Dict[str, Any]:
        """Get histogram and box plot data for numeric column."""
        data = self.df[col].dropna()
        
        if len(data) == 0:
            return {"type": "numeric", "histogram": None, "boxplot": None}
        
        # Histogram data
        hist, bin_edges = np.histogram(data, bins=30)
        
        # Box plot data
        q1 = float(data.quantile(0.25))
        q3 = float(data.quantile(0.75))
        iqr = q3 - q1
        lower_whisker = float(data[data >= q1 - 1.5 * iqr].min())
        upper_whisker = float(data[data <= q3 + 1.5 * iqr].max())
        outliers = data[(data < q1 - 1.5 * iqr) | (data > q3 + 1.5 * iqr)].tolist()
        
        return {
            "type": "numeric",
            "histogram": {
                "counts": hist.tolist(),
                "bin_edges": bin_edges.tolist(),
                "bin_centers": [(bin_edges[i] + bin_edges[i + 1]) / 2 for i in range(len(bin_edges) - 1)]
            },
            "boxplot": {
                "min": lower_whisker,
                "q1": q1,
                "median": float(data.median()),
                "q3": q3,
                "max": upper_whisker,
                "outliers": outliers[:100]  # Limit outliers for performance
            }
        }
    
    def _get_categorical_distribution(self, col: str) -> Dict[str, Any]:
        """Get value counts for categorical column."""
        data = self.df[col].dropna()
        
        if len(data) == 0:
            return {"type": "categorical", "value_counts": []}
        
        value_counts = data.value_counts().head(20)  # Limit to top 20
        
        return {
            "type": "categorical",
            "value_counts": [
                {"label": str(val), "count": int(count)}
                for val, count in value_counts.items()
            ]
        }
    
    def get_missing_heatmap(self) -> Dict[str, Any]:
        """Get missing value heatmap data."""
        # Create binary matrix (1 = missing, 0 = present)
        missing_matrix = self.df.isna().astype(int)
        
        # Sample rows if dataset is too large
        max_rows = 100
        if len(missing_matrix) > max_rows:
            # Sample evenly distributed rows
            indices = np.linspace(0, len(missing_matrix) - 1, max_rows, dtype=int)
            missing_matrix = missing_matrix.iloc[indices]
        
        return {
            "matrix": missing_matrix.values.tolist(),
            "row_labels": [f"Row {i}" for i in range(len(missing_matrix))],
            "column_labels": missing_matrix.columns.tolist(),
            "missing_by_column": self.df.isna().sum().to_dict(),
            "missing_by_row": missing_matrix.sum(axis=1).tolist(),
            "total_cells": len(self.df) * len(self.df.columns),
            "missing_cells": int(self.df.isna().sum().sum())
        }
        return self._sanitize_json(result)
    
    def get_data_dictionary(self) -> List[Dict[str, Any]]:
        """Generate auto-generated data dictionary."""
        dictionary = []
        
        for col in self.df.columns:
            entry = {
                "column_name": col,
                "data_type": str(self.df[col].dtype),
                "missing_count": int(self.df[col].isna().sum()),
                "missing_percentage": float((self.df[col].isna().sum() / len(self.df)) * 100),
                "unique_values": int(self.df[col].nunique()),
                "sample_values": self.df[col].dropna().head(3).tolist(),
                "description": self._generate_column_description(col),
                "quality_flags": self._get_quality_flags(col)
            }
            
            # Add type-specific metadata
            if col in self.numeric_cols:
                data = self.df[col].dropna()
                if len(data) > 0:
                    entry["value_range"] = f"{data.min():.2f} to {data.max():.2f}"
                    entry["mean"] = float(data.mean())
            elif col in self.categorical_cols:
                entry["cardinality"] = int(self.df[col].nunique())
                mode = self.df[col].mode()
                if len(mode) > 0:
                    entry["most_common"] = str(mode[0])
            
            dictionary.append(entry)
        
            dictionary.append(entry)
        
        return self._sanitize_json(dictionary)
    
    def _generate_column_description(self, col: str) -> str:
        """Generate automatic description for column."""
        col_lower = col.lower()
        
        # Pattern-based descriptions
        if any(kw in col_lower for kw in ['id', 'identifier', 'code']):
            return f"Unique identifier column with {self.df[col].nunique()} distinct values"
        elif any(kw in col_lower for kw in ['date', 'time', 'timestamp']):
            return "Temporal data field tracking date/time information"
        elif any(kw in col_lower for kw in ['age', 'year', 'duration']):
            return "Numeric measure representing time or age"
        elif any(kw in col_lower for kw in ['amount', 'price', 'cost', 'value']):
            return "Monetary or numeric value field"
        elif any(kw in col_lower for kw in ['name', 'description', 'label']):
            return "Descriptive text field"
        elif any(kw in col_lower for kw in ['status', 'type', 'category', 'class']):
            return f"Categorical variable with {self.df[col].nunique()} categories"
        elif col in self.numeric_cols:
            return "Numeric variable for quantitative analysis"
        elif col in self.categorical_cols:
            return "Categorical variable for grouping and classification"
        else:
            return "Data column for analysis"
    
    def _get_quality_flags(self, col: str) -> List[str]:
        """Get data quality flags for column."""
        flags = []
        
        missing_pct = (self.df[col].isna().sum() / len(self.df)) * 100
        
        if missing_pct > 50:
            flags.append("HIGH_MISSING")
        elif missing_pct > 20:
            flags.append("MODERATE_MISSING")
        
        if col in self.numeric_cols:
            data = self.df[col].dropna()
            if len(data) > 0:
                # Check for outliers
                q1 = data.quantile(0.25)
                q3 = data.quantile(0.75)
                iqr = q3 - q1
                outliers = data[(data < q1 - 1.5 * iqr) | (data > q3 + 1.5 * iqr)]
                
                if len(outliers) / len(data) > 0.1:
                    flags.append("OUTLIERS_DETECTED")
                
                # Check for skewness
                if abs(data.skew()) > 2:
                    flags.append("HIGHLY_SKEWED")
        
        elif col in self.categorical_cols:
            # Check for high cardinality
            if self.df[col].nunique() > len(self.df) * 0.9:
                flags.append("HIGH_CARDINALITY")
            
            # Check for imbalanced categories
            value_counts = self.df[col].value_counts()
            if len(value_counts) > 0:
                max_freq = value_counts.iloc[0] / len(self.df)
                if max_freq > 0.95:
                    flags.append("IMBALANCED")
        
        if len(flags) == 0:
            flags.append("GOOD_QUALITY")
        
        return flags
    
    def get_data_quality_score(self) -> Dict[str, Any]:
        """Calculate overall data quality score."""
        # Completeness score
        completeness = (1 - (self.df.isna().sum().sum() / (len(self.df) * len(self.df.columns)))) * 100
        
        # Uniqueness score (check for duplicates)
        uniqueness = (1 - (self.df.duplicated().sum() / len(self.df))) * 100
        
        # Consistency score (based on data types and outliers)
        consistency_issues = 0
        for col in self.numeric_cols:
            data = self.df[col].dropna()
            if len(data) > 0:
                q1 = data.quantile(0.25)
                q3 = data.quantile(0.75)
                iqr = q3 - q1
                outliers = data[(data < q1 - 1.5 * iqr) | (data > q3 + 1.5 * iqr)]
                if len(outliers) / len(data) > 0.1:
                    consistency_issues += 1
        
        consistency = max(0, (1 - (consistency_issues / max(len(self.numeric_cols), 1))) * 100)
        
        # Overall score (weighted average)
        overall_score = (completeness * 0.5 + uniqueness * 0.3 + consistency * 0.2)
        
        return {
            "overall_score": round(overall_score, 2),
            "completeness_score": round(completeness, 2),
            "uniqueness_score": round(uniqueness, 2),
            "consistency_score": round(consistency, 2),
            "grade": self._get_quality_grade(overall_score)
        }
    
    def _get_quality_grade(self, score: float) -> str:
        """Get quality grade based on score."""
        if score >= 90:
            return "Excellent"
        elif score >= 75:
            return "Good"
        elif score >= 60:
            return "Fair"
        else:
            return "Poor"


def profile_dataset(csv_path: str) -> Dict[str, Any]:
    """Convenience function to profile a dataset."""
    profiler = DatasetProfiler(csv_path)
    return profiler.get_full_profile()
