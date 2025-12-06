"""AI-powered data cleaning and preprocessing service."""
import os
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from pathlib import Path
import google.generativeai as genai
from scipy import stats
import json
from datetime import datetime

# Load Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class DataCleaningAnalyzer:
    """Analyze dataset quality and recommend cleaning transformations."""
    
    def __init__(self, csv_path: str):
        """Initialize with CSV path."""
        self.csv_path = csv_path
        self.df = pd.read_csv(csv_path)
        self.recommendations = []
        self.quality_score = 100
        
    def analyze_quality(self) -> Dict[str, Any]:
        """
        Comprehensive data quality analysis.
        
        Returns:
            Dictionary with quality issues and recommendations
        """
        issues = {
            "missing_values": self._detect_missing_values(),
            "outliers": self._detect_outliers(),
            "skewness": self._detect_skewness(),
            "type_issues": self._detect_type_inconsistencies(),
            "encoding_issues": self._detect_encoding_issues()
        }
        
        # Generate recommendations based on issues
        self._generate_recommendations(issues)
        
        # Calculate overall quality score
        self._calculate_quality_score(issues)
        
        # Get Gemini AI insights
        gemini_insights = self._get_gemini_insights(issues)
        
        return {
            "dataset_info": {
                "rows": len(self.df),
                "columns": len(self.df.columns),
                "column_names": list(self.df.columns)
            },
            "quality_score": self.quality_score,
            "issues": issues,
            "recommendations": self.recommendations,
            "gemini_insights": gemini_insights
        }
    
    def _detect_missing_values(self) -> List[Dict[str, Any]]:
        """Detect missing values in dataset."""
        missing_info = []
        
        for col in self.df.columns:
            missing_count = self.df[col].isna().sum()
            if missing_count > 0:
                missing_pct = (missing_count / len(self.df)) * 100
                
                # Determine pattern
                pattern = "random"
                if missing_pct > 50:
                    pattern = "systematic_high"
                elif self.df[col].isna().iloc[:10].sum() > 5:
                    pattern = "beginning_heavy"
                
                missing_info.append({
                    "column": col,
                    "count": int(missing_count),
                    "percentage": round(missing_pct, 2),
                    "pattern": pattern,
                    "dtype": str(self.df[col].dtype)
                })
        
        return missing_info
    
    def _detect_outliers(self) -> List[Dict[str, Any]]:
        """Detect outliers in numeric columns using IQR and Z-score."""
        outlier_info = []
        
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            data = self.df[col].dropna()
            if len(data) < 4:
                continue
            
            # IQR method
            Q1 = data.quantile(0.25)
            Q3 = data.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            iqr_outliers = ((data < lower_bound) | (data > upper_bound)).sum()
            
            # Z-score method
            z_scores = np.abs(stats.zscore(data))
            z_outliers = (z_scores > 3).sum()
            
            if iqr_outliers > 0 or z_outliers > 0:
                outlier_pct = (iqr_outliers / len(data)) * 100
                
                outlier_info.append({
                    "column": col,
                    "iqr_outliers": int(iqr_outliers),
                    "z_score_outliers": int(z_outliers),
                    "percentage": round(outlier_pct, 2),
                    "lower_bound": float(lower_bound),
                    "upper_bound": float(upper_bound),
                    "min": float(data.min()),
                    "max": float(data.max())
                })
        
        return outlier_info
    
    def _detect_skewness(self) -> List[Dict[str, Any]]:
        """Detect skewness in numeric columns."""
        skewness_info = []
        
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            data = self.df[col].dropna()
            if len(data) < 3:
                continue
            
            skew_value = data.skew()
            
            # Classify skewness
            if abs(skew_value) > 1:
                severity = "high"
            elif abs(skew_value) > 0.5:
                severity = "moderate"
            else:
                continue  # Skip low skewness
            
            direction = "right" if skew_value > 0 else "left"
            
            skewness_info.append({
                "column": col,
                "skewness": round(float(skew_value), 3),
                "severity": severity,
                "direction": direction
            })
        
        return skewness_info
    
    def _detect_type_inconsistencies(self) -> List[Dict[str, Any]]:
        """Detect data type inconsistencies."""
        type_issues = []
        
        for col in self.df.columns:
            # Check if object column contains mostly numbers
            if self.df[col].dtype == 'object':
                # Try to convert to numeric
                numeric_convertible = pd.to_numeric(self.df[col], errors='coerce')
                conversion_rate = numeric_convertible.notna().sum() / len(self.df)
                
                if conversion_rate > 0.8:  # 80% can be converted
                    type_issues.append({
                        "column": col,
                        "current_type": "object",
                        "suggested_type": "numeric",
                        "conversion_rate": round(conversion_rate * 100, 2),
                        "issue": "Numeric values stored as text"
                    })
                
                # Check for date patterns
                date_patterns = [
                    r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
                    r'\d{2}/\d{2}/\d{4}',  # MM/DD/YYYY
                    r'\d{2}-\d{2}-\d{4}'   # DD-MM-YYYY
                ]
                
                sample = self.df[col].dropna().astype(str).head(100)
                for pattern in date_patterns:
                    if sample.str.match(pattern).sum() > len(sample) * 0.5:
                        type_issues.append({
                            "column": col,
                            "current_type": "object",
                            "suggested_type": "datetime",
                            "conversion_rate": 100,
                            "issue": "Date values stored as text"
                        })
                        break
        
        return type_issues
    
    def _detect_encoding_issues(self) -> List[Dict[str, Any]]:
        """Detect encoding issues in text columns."""
        encoding_issues = []
        
        text_cols = self.df.select_dtypes(include=['object']).columns
        
        for col in text_cols:
            data = self.df[col].dropna().astype(str)
            
            # Check for common encoding issues
            issues_found = []
            
            # Check for non-ASCII characters
            non_ascii_count = data.str.contains(r'[^\x00-\x7F]', regex=True).sum()
            if non_ascii_count > 0:
                issues_found.append(f"{non_ascii_count} values with non-ASCII characters")
            
            # Check for common mojibake patterns
            mojibake_patterns = ['Ã', 'â€', 'Â']
            for pattern in mojibake_patterns:
                if data.str.contains(pattern, regex=False).any():
                    issues_found.append("Possible encoding corruption detected")
                    break
            
            if issues_found:
                encoding_issues.append({
                    "column": col,
                    "issues": issues_found,
                    "affected_rows": int(non_ascii_count)
                })
        
        return encoding_issues
    
    def _generate_recommendations(self, issues: Dict[str, List]) -> None:
        """Generate cleaning recommendations based on detected issues."""
        rec_id = 1
        
        # Missing value recommendations
        for issue in issues["missing_values"]:
            col = issue["column"]
            pct = issue["percentage"]
            dtype = issue["dtype"]
            
            if pct > 50:
                action = f"Consider removing column (>{pct}% missing)"
                priority = "medium"
            elif dtype in ['int64', 'float64']:
                action = "Impute with median value"
                priority = "high" if pct > 10 else "medium"
            elif dtype == 'object':
                action = "Impute with mode (most frequent value)"
                priority = "high" if pct > 10 else "medium"
            else:
                action = "Forward-fill or backward-fill"
                priority = "low"
            
            self.recommendations.append({
                "id": f"rec_{rec_id:03d}",
                "type": "imputation",
                "column": col,
                "issue": f"{pct}% missing values ({issue['count']} rows)",
                "action": action,
                "priority": priority,
                "impact": f"Enables analysis on {issue['count']} additional rows",
                "method": self._get_imputation_method(dtype, pct)
            })
            rec_id += 1
        
        # Outlier recommendations
        for issue in issues["outliers"]:
            col = issue["column"]
            pct = issue["percentage"]
            
            if pct > 10:
                action = "Cap outliers at 1st and 99th percentiles"
                priority = "high"
            else:
                action = f"Cap outliers using IQR method (bounds: {issue['lower_bound']:.2f} to {issue['upper_bound']:.2f})"
                priority = "medium"
            
            self.recommendations.append({
                "id": f"rec_{rec_id:03d}",
                "type": "outlier_treatment",
                "column": col,
                "issue": f"{issue['iqr_outliers']} outliers detected ({pct}%)",
                "action": action,
                "priority": priority,
                "impact": f"Reduces extreme values affecting {issue['iqr_outliers']} rows",
                "method": "iqr_capping"
            })
            rec_id += 1
        
        # Skewness recommendations
        for issue in issues["skewness"]:
            col = issue["column"]
            severity = issue["severity"]
            
            if severity == "high":
                action = "Apply log transformation to reduce skewness"
                priority = "medium"
            else:
                action = "Apply square root transformation"
                priority = "low"
            
            self.recommendations.append({
                "id": f"rec_{rec_id:03d}",
                "type": "normalization",
                "column": col,
                "issue": f"{severity.capitalize()} {issue['direction']} skewness ({issue['skewness']})",
                "action": action,
                "priority": priority,
                "impact": "Improves distribution for statistical analysis",
                "method": "log_transform" if severity == "high" else "sqrt_transform"
            })
            rec_id += 1
        
        # Type inconsistency recommendations
        for issue in issues["type_issues"]:
            col = issue["column"]
            suggested = issue["suggested_type"]
            
            if suggested == "numeric":
                action = f"Convert to numeric type ({issue['conversion_rate']}% convertible)"
                priority = "high"
                method = "to_numeric"
            elif suggested == "datetime":
                action = "Parse as datetime"
                priority = "high"
                method = "to_datetime"
            else:
                continue
            
            self.recommendations.append({
                "id": f"rec_{rec_id:03d}",
                "type": "type_conversion",
                "column": col,
                "issue": issue["issue"],
                "action": action,
                "priority": priority,
                "impact": "Enables proper numeric/date operations",
                "method": method
            })
            rec_id += 1
        
        # Encoding recommendations
        for issue in issues["encoding_issues"]:
            col = issue["column"]
            
            self.recommendations.append({
                "id": f"rec_{rec_id:03d}",
                "type": "encoding_fix",
                "column": col,
                "issue": ", ".join(issue["issues"]),
                "action": "Fix encoding issues and normalize text",
                "priority": "medium",
                "impact": f"Cleans {issue['affected_rows']} text values",
                "method": "encoding_fix"
            })
            rec_id += 1
    
    def _get_imputation_method(self, dtype: str, pct: float) -> str:
        """Determine best imputation method."""
        if pct > 50:
            return "drop_column"
        elif dtype in ['int64', 'float64']:
            return "median"
        elif dtype == 'object':
            return "mode"
        else:
            return "forward_fill"
    
    def _calculate_quality_score(self, issues: Dict[str, List]) -> None:
        """Calculate overall data quality score (0-100)."""
        score = 100
        
        # Deduct for missing values
        total_cells = len(self.df) * len(self.df.columns)
        missing_cells = self.df.isna().sum().sum()
        missing_penalty = (missing_cells / total_cells) * 30
        score -= missing_penalty
        
        # Deduct for outliers
        outlier_penalty = min(len(issues["outliers"]) * 2, 20)
        score -= outlier_penalty
        
        # Deduct for type issues
        type_penalty = len(issues["type_issues"]) * 5
        score -= type_penalty
        
        # Deduct for encoding issues
        encoding_penalty = len(issues["encoding_issues"]) * 3
        score -= encoding_penalty
        
        self.quality_score = max(0, round(score, 1))
    
    def _get_gemini_insights(self, issues: Dict[str, List]) -> Dict[str, Any]:
        """Get AI-powered insights from Gemini."""
        if not GEMINI_API_KEY:
            return {
                "available": False,
                "message": "Gemini API key not configured"
            }
        
        try:
            # Prepare summary for Gemini
            summary = {
                "total_rows": len(self.df),
                "total_columns": len(self.df.columns),
                "missing_value_columns": len(issues["missing_values"]),
                "outlier_columns": len(issues["outliers"]),
                "type_issues": len(issues["type_issues"]),
                "quality_score": self.quality_score
            }
            
            prompt = f"""Analyze this dataset quality report and provide insights:

Dataset: {len(self.df)} rows, {len(self.df.columns)} columns
Quality Score: {self.quality_score}/100

Issues Found:
- Missing Values: {len(issues['missing_values'])} columns affected
- Outliers: {len(issues['outliers'])} columns with outliers
- Type Inconsistencies: {len(issues['type_issues'])} columns
- Skewness: {len(issues['skewness'])} columns
- Encoding Issues: {len(issues['encoding_issues'])} columns

Top Recommendations:
{json.dumps(self.recommendations[:5], indent=2)}

Provide:
1. A brief summary (2-3 sentences) of the data quality
2. Top 3 priority actions the user should take
3. Potential business impact of not addressing these issues

Format as JSON with keys: summary, priority_actions (array), business_impact"""

            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            # Parse JSON response
            text = response.text.strip()
            if text.startswith('```json'):
                text = text[7:]
            if text.endswith('```'):
                text = text[:-3]
            
            insights = json.loads(text.strip())
            insights["available"] = True
            
            return insights
            
        except Exception as e:
            print(f"[WARN] Gemini insights failed: {e}")
            return {
                "available": False,
                "error": str(e),
                "summary": "AI insights unavailable",
                "priority_actions": [],
                "business_impact": ""
            }


class DataCleaner:
    """Apply data cleaning transformations."""
    
    def __init__(self, csv_path: str):
        """Initialize with CSV path."""
        self.csv_path = csv_path
        self.df = pd.read_csv(csv_path)
        self.original_df = self.df.copy()
        self.applied_transformations = []
    
    def apply_transformations(self, recommendations: List[Dict[str, Any]], 
                             selected_ids: List[str]) -> Dict[str, Any]:
        """
        Apply selected cleaning transformations.
        
        Args:
            recommendations: List of all recommendations
            selected_ids: List of recommendation IDs to apply
            
        Returns:
            Dictionary with results and cleaned dataset info
        """
        # Filter to selected recommendations
        to_apply = [r for r in recommendations if r["id"] in selected_ids]
        
        for rec in to_apply:
            try:
                self._apply_transformation(rec)
                self.applied_transformations.append({
                    "id": rec["id"],
                    "column": rec["column"],
                    "type": rec["type"],
                    "status": "success"
                })
            except Exception as e:
                self.applied_transformations.append({
                    "id": rec["id"],
                    "column": rec["column"],
                    "type": rec["type"],
                    "status": "failed",
                    "error": str(e)
                })
        
        # Calculate quality improvement
        before_score = self._calculate_simple_quality_score(self.original_df)
        after_score = self._calculate_simple_quality_score(self.df)
        
        return {
            "applied_transformations": self.applied_transformations,
            "quality_improvement": {
                "before_score": before_score,
                "after_score": after_score,
                "improvement": round(after_score - before_score, 1)
            },
            "changes_summary": self._generate_changes_summary()
        }
    
    def _apply_transformation(self, rec: Dict[str, Any]) -> None:
        """Apply a single transformation."""
        col = rec["column"]
        method = rec.get("method", "")
        
        if rec["type"] == "imputation":
            if method == "median":
                self.df[col].fillna(self.df[col].median(), inplace=True)
            elif method == "mode":
                self.df[col].fillna(self.df[col].mode()[0], inplace=True)
            elif method == "forward_fill":
                self.df[col].fillna(method='ffill', inplace=True)
            elif method == "drop_column":
                self.df.drop(columns=[col], inplace=True)
        
        elif rec["type"] == "outlier_treatment":
            if method == "iqr_capping":
                Q1 = self.df[col].quantile(0.25)
                Q3 = self.df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                self.df[col] = self.df[col].clip(lower=lower_bound, upper=upper_bound)
        
        elif rec["type"] == "normalization":
            if method == "log_transform":
                # Add small constant to handle zeros
                self.df[col] = np.log1p(self.df[col])
            elif method == "sqrt_transform":
                self.df[col] = np.sqrt(self.df[col].clip(lower=0))
        
        elif rec["type"] == "type_conversion":
            if method == "to_numeric":
                self.df[col] = pd.to_numeric(self.df[col], errors='coerce')
            elif method == "to_datetime":
                self.df[col] = pd.to_datetime(self.df[col], errors='coerce')
        
        elif rec["type"] == "encoding_fix":
            # Basic encoding fix - remove non-ASCII characters
            self.df[col] = self.df[col].astype(str).str.encode('ascii', 'ignore').str.decode('ascii')
    
    def _calculate_simple_quality_score(self, df: pd.DataFrame) -> float:
        """Calculate a simple quality score for comparison."""
        score = 100
        
        # Missing values penalty
        total_cells = len(df) * len(df.columns)
        missing_cells = df.isna().sum().sum()
        if total_cells > 0:
            missing_penalty = (missing_cells / total_cells) * 30
            score -= missing_penalty
        
        return max(0, round(score, 1))
    
    def _generate_changes_summary(self) -> str:
        """Generate human-readable summary of changes."""
        successful = [t for t in self.applied_transformations if t["status"] == "success"]
        failed = [t for t in self.applied_transformations if t["status"] == "failed"]
        
        summary = f"Applied {len(successful)} transformations successfully"
        if failed:
            summary += f", {len(failed)} failed"
        
        # Group by type
        by_type = {}
        for t in successful:
            t_type = t["type"]
            by_type[t_type] = by_type.get(t_type, 0) + 1
        
        if by_type:
            summary += ". Changes: " + ", ".join([f"{count} {ttype}" for ttype, count in by_type.items()])
        
        return summary
    
    def save_cleaned_dataset(self, output_path: str) -> str:
        """Save cleaned dataset to file."""
        self.df.to_csv(output_path, index=False)
        return output_path
    
    def get_cleaned_dataframe(self) -> pd.DataFrame:
        """Get the cleaned dataframe."""
        return self.df


def analyze_dataset_quality(csv_path: str) -> Dict[str, Any]:
    """
    Convenience function to analyze dataset quality.
    
    Args:
        csv_path: Path to CSV file
        
    Returns:
        Quality analysis results
    """
    analyzer = DataCleaningAnalyzer(csv_path)
    return analyzer.analyze_quality()


def apply_cleaning_transformations(csv_path: str, recommendations: List[Dict[str, Any]], 
                                   selected_ids: List[str], output_path: str) -> Dict[str, Any]:
    """
    Convenience function to apply cleaning transformations.
    
    Args:
        csv_path: Path to original CSV file
        recommendations: List of all recommendations
        selected_ids: List of recommendation IDs to apply
        output_path: Path to save cleaned dataset
        
    Returns:
        Transformation results
    """
    cleaner = DataCleaner(csv_path)
    results = cleaner.apply_transformations(recommendations, selected_ids)
    cleaner.save_cleaned_dataset(output_path)
    results["cleaned_file_path"] = output_path
    return results
