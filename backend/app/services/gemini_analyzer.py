"""Gemini AI-powered dataset analyzer for intelligent insights."""
import os
from pathlib import Path
import pandas as pd
import numpy as np
import google.generativeai as genai
from typing import Dict, Any, Optional, List
import json

# Configure Gemini API - load from .env file
from dotenv import load_dotenv

# Get the backend directory path
backend_dir = Path(__file__).parent.parent.parent
env_path = backend_dir / '.env'

# Load environment variables
load_dotenv(dotenv_path=env_path)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

print(f"[INFO] Loading .env from: {env_path}")
print(f"[INFO] .env exists: {env_path.exists()}")
print(f"[INFO] GEMINI_API_KEY loaded: {'YES' if GEMINI_API_KEY else 'NO'}")
if GEMINI_API_KEY:
    print(f"[INFO] API Key length: {len(GEMINI_API_KEY)} characters")


class GeminiAnalyzer:
    """Use Gemini AI to analyze datasets intelligently."""
    
    def __init__(self, csv_path: str):
        """Initialize with CSV path."""
        self.csv_path = csv_path
        self.df = pd.read_csv(csv_path)
        
        if GEMINI_API_KEY:
            genai.configure(api_key=GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
    
    def analyze_with_gemini(self) -> Dict[str, Any]:
        """Use Gemini to analyze the dataset and provide insights."""
        
        if not self.model:
            return self._fallback_analysis({})
        
        try:
            # Prepare comprehensive dataset info for Gemini
            sample_data = self.df.head(10).to_string()
            stats = self.df.describe().to_string()
            missing_vals = dict(self.df.isna().sum())
            
            prompt = f"""You are an expert actuarial data analyst. Analyze this dataset comprehensively.

DATASET INFORMATION:
- Filename: {os.path.basename(self.csv_path)}
- Total Rows: {len(self.df)}
- Total Columns: {len(self.df.columns)}
- Column Names: {list(self.df.columns)}
- Data Types: {dict(self.df.dtypes.astype(str))}

SAMPLE DATA (first 10 rows):
{sample_data}

STATISTICAL SUMMARY:
{stats}

MISSING VALUES:
{missing_vals}

ANALYSIS INSTRUCTIONS:
1. **Dataset Type Classification**: Determine the primary dataset type from these categories:
   - "time_series" - Has date/time index with numeric values suitable for forecasting (monthly sales, claims over time, etc.)
   - "survival_analysis" - Has time-to-event data (time + event/status columns)
   - "claims_triangle" - Has origin/accident year and development periods
   - "glm_frequency" - Has count data suitable for Poisson/Negative Binomial (claim counts, incidents, losses)
   - "glm_severity" - Has continuous positive amounts suitable for Gamma (claim amounts, costs, payments)
   - "glm_compatible" - Has numeric targets and features suitable for GLM pricing models
   - "insurance_claims" - Individual claim records with amounts/dates
   - "funeral_claims" - Mortality data with LIFE/BIRTH/DEATH dates
   - "unknown" - Does not fit above categories

2. **Time-Series Detection**: If the dataset has:
   - Date/time columns (date, month, year, period, timestamp) AND
   - Numeric values that change over time →
   - Classify as "time_series" for forecasting analysis

3. **GLM Suitability**: If the dataset has:
   - Count variables (claim_count, incidents, frequency) → classify as "glm_frequency"
   - Continuous positive amounts (claim_amount, severity, cost) → classify as "glm_severity"  
   - Numeric targets + features (age, gender, region, vehicle) → classify as "glm_compatible"
   - Use "glm_" prefix for any dataset suitable for actuarial pricing models

4. **Column Analysis**: For each column, identify its purpose (e.g., "Target variable for claim frequency", "Feature: policyholder age", "Categorical: geographic region")

5. **Recommended Visualizations**: Provide 2-3 specific graph recommendations with exact column names

6. **Business Insights**: Provide actuarial-specific insights and recommendations

Return your analysis as a JSON object with this EXACT structure:
{{
  "dataset_type": "time_series|glm_frequency|glm_severity|glm_compatible|survival_analysis|claims_triangle|insurance_claims|unknown",
  "description": "Brief description of the dataset",
  "key_insights": ["insight1", "insight2", "insight3", "insight4", "insight5"],
  "business_insights": ["business insight 1", "business insight 2"],
  "recommended_analysis": ["analysis type 1", "analysis type 2"],
  "recommended_graphs": [
    {{
      "type": "histogram|bar|scatter|line|boxplot",
      "fields": ["column_name"],
      "reason": "Why this visualization is useful"
    }}
  ],
  "data_quality": {{
    "completeness_score": 95,
    "strengths": ["strength1", "strength2"],
    "issues": ["issue1", "issue2"]
  }},
  "column_purposes": {{
    "column_name": "Purpose description"
  }},
  "recommendations": ["recommendation1", "recommendation2"],
  "is_valid": true
}}

IMPORTANT: 
- Always provide 2-3 recommended visualizations in the 'recommended_graphs' array
- For GLM-suitable datasets, explicitly use "glm_frequency", "glm_severity", or "glm_compatible" as dataset_type
- Be specific and actionable
- Focus on actuarial relevance
- Return ONLY valid JSON, no markdown formatting"""

            print(f"[INFO] Calling Gemini API for {os.path.basename(self.csv_path)}...")
            
            # Try to get response from Gemini with retry logic
            max_retries = 2
            for attempt in range(max_retries):
                try:
                    response = self.model.generate_content(prompt)
                    response_text = response.text
                    print(f"[INFO] Gemini responded (attempt {attempt + 1})")
                    break
                except Exception as api_error:
                    print(f"[WARN] Gemini API error (attempt {attempt + 1}/{max_retries}): {api_error}")
                    if attempt == max_retries - 1:
                        raise
                    import time
                    time.sleep(1)
            
            # Extract JSON from markdown if present
            original_response = response_text
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
                print(f"[INFO] Extracted JSON from markdown code block")
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
                print(f"[INFO] Extracted content from code block")
            
            # Try to parse JSON
            try:
                analysis = json.loads(response_text)
                analysis["gemini_powered"] = True
                
                # Ensure recommended_graphs exists, add fallback if missing
                if "recommended_graphs" not in analysis or not analysis["recommended_graphs"]:
                    print(f"[WARN] Gemini did not provide recommended_graphs, generating fallback")
                    analysis["recommended_graphs"] = self._generate_fallback_graphs()
                
                print(f"[INFO] Gemini analysis successful for {os.path.basename(self.csv_path)}")
                print(f"[INFO] Dataset type detected: {analysis.get('dataset_type', 'unknown')}")
                print(f"[INFO] Columns analyzed: {len(analysis.get('column_purposes', {}))}")
                print(f"[INFO] Recommended graphs: {len(analysis.get('recommended_graphs', []))}")
                return analysis
            except json.JSONDecodeError as json_err:
                print(f"[ERROR] JSON parse error: {json_err}")
                print(f"[INFO] Response preview (first 500 chars):")
                print(response_text[:500])
                print(f"[INFO] Full response (first 1000 chars):")
                print(original_response[:1000])
                raise
            
        except json.JSONDecodeError as e:
            print(f"[ERROR] Gemini JSON parse error: {e}")
            print(f"[WARN] Falling back to rule-based analysis")
            return self._fallback_analysis({})
        except Exception as e:
            print(f"[ERROR] Gemini analysis failed: {type(e).__name__}: {e}")
            print(f"[WARN] Falling back to rule-based analysis")
            import traceback
            traceback.print_exc()
            return self._fallback_analysis({})
    
    def _prepare_dataset_summary(self) -> Dict:
        """Prepare a summary of the dataset."""
        return {
            "rows": len(self.df),
            "columns": len(self.df.columns),
            "column_names": list(self.df.columns),
            "dtypes": dict(self.df.dtypes.astype(str)),
            "missing_values": int(self.df.isna().sum().sum()),
            "sample_data": self.df.head(5).to_dict('records')
        }
    
    def _fallback_analysis(self, summary: Dict) -> Dict[str, Any]:
        """Fallback rule-based analysis when Gemini is unavailable."""
        columns = [col.lower() for col in self.df.columns]
        
        # Detect based on column names
        has_life = 'life' in columns
        has_death = 'death' in columns
        has_birth = 'birth' in columns
        has_entry = 'entry' in columns
        
        if has_life and has_death and has_birth:
            dataset_type = "funeral_claims"
            description = f"Funeral/mortality dataset with {len(self.df)} life records tracking birth, entry, and death dates for actuarial analysis"
            recommended = ["Survival analysis", "Mortality rate calculation", "Life expectancy analysis"]
            is_valid = True
        else:
            has_time = any(c in columns for c in ['time', 'duration', 'followup'])
            has_event = any(c in columns for c in ['event', 'status', 'death'])
            
            if has_time and has_event:
                dataset_type = "survival_analysis"
                description = "Survival analysis dataset with time-to-event data for statistical modeling"
                recommended = ["Kaplan-Meier survival curves", "Cox proportional hazards", "Life tables"]
                is_valid = True
            else:
                dataset_type = "unknown"
                description = f"Dataset with {len(self.df)} rows and {len(self.df.columns)} columns. Column names: {', '.join(self.df.columns)}"
                recommended = ["Manual inspection required", "Data profiling"]
                is_valid = True
        
        return {
            "dataset_type": dataset_type,
            "confidence": "medium",
            "is_valid": is_valid,
            "description": description,
            "key_insights": [
                f"Dataset contains {len(self.df):,} observations",
                f"Has {len(self.df.columns)} variables: {', '.join(self.df.columns)}",
                f"Missing values: {int(self.df.isna().sum().sum())} ({(self.df.isna().sum().sum() / (len(self.df) * len(self.df.columns)) * 100):.1f}%)",
                f"Data types: {dict(self.df.dtypes.value_counts().to_dict())}"
            ],
            "recommended_analysis": recommended,
            "data_quality": {
                "completeness_score": f"{(1 - self.df.isna().sum().sum() / (len(self.df) * len(self.df.columns))) * 100:.1f}",
                "issues": [],
                "strengths": ["Data loaded successfully", f"{len(self.df):,} complete records"]
            },
            "column_purposes": self._analyze_column_purposes(),
            "business_insights": [f"Dataset appears to be {dataset_type} data"],
            "recommendations": ["Set GEMINI_API_KEY environment variable for AI-powered analysis"],
            "recommended_graphs": self._generate_fallback_graphs(),
            "gemini_powered": False
        }
    
    def _generate_fallback_graphs(self) -> List[Dict[str, Any]]:
        """Generate 2-3 deterministic graph recommendations based on dataset characteristics."""
        graphs = []
        
        # Get numeric and categorical columns
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = self.df.select_dtypes(include=['object', 'category']).columns.tolist()
        
        # Filter categorical columns with reasonable cardinality
        categorical_cols = [col for col in categorical_cols if self.df[col].nunique() < 20]
        
        # Rule 1: If we have numeric columns, recommend histogram for the first numeric column
        if numeric_cols:
            first_numeric = numeric_cols[0]
            graphs.append({
                "type": "histogram",
                "fields": [first_numeric],
                "reason": f"Distribution analysis of {first_numeric} to understand data spread and identify patterns",
                "params": {"bins": 20, "orientation": "vertical"}
            })
        
        # Rule 2: If we have categorical + numeric, recommend bar chart
        if categorical_cols and numeric_cols:
            graphs.append({
                "type": "bar",
                "fields": [categorical_cols[0], numeric_cols[0]],
                "reason": f"Compare {numeric_cols[0]} across different {categorical_cols[0]} categories",
                "params": {"orientation": "vertical"}
            })
        
        # Rule 3: If we have 2+ numeric columns, recommend scatter plot
        if len(numeric_cols) >= 2:
            graphs.append({
                "type": "scatter",
                "fields": [numeric_cols[0], numeric_cols[1]],
                "reason": f"Explore relationship between {numeric_cols[0]} and {numeric_cols[1]}",
                "params": {}
            })
        
        # Rule 4: If we have categorical column only, recommend bar chart of counts
        if categorical_cols and not numeric_cols:
            graphs.append({
                "type": "bar",
                "fields": [categorical_cols[0]],
                "reason": f"Frequency distribution of {categorical_cols[0]} categories",
                "params": {"orientation": "vertical"}
            })
        
        # Rule 5: If we have time-series data (date column + numeric), recommend line chart
        date_cols = [col for col in self.df.columns if 'date' in col.lower() or 'time' in col.lower()]
        if date_cols and numeric_cols:
            graphs.append({
                "type": "line",
                "fields": [date_cols[0], numeric_cols[0]],
                "reason": f"Trend analysis of {numeric_cols[0]} over {date_cols[0]}",
                "params": {}
            })
        
        # Ensure we return 2-3 graphs, prioritize first 3
        graphs = graphs[:3]
        
        # If we have less than 2 graphs, add a generic one
        if len(graphs) < 2 and numeric_cols:
            if len(numeric_cols) >= 2:
                graphs.append({
                    "type": "boxplot",
                    "fields": numeric_cols[:2],
                    "reason": "Statistical summary and outlier detection for numeric variables",
                    "params": {}
                })
        
        # Ensure at least 2 graphs
        if len(graphs) == 0:
            graphs.append({
                "type": "bar",
                "fields": [self.df.columns[0]],
                "reason": "Basic frequency distribution of the first column",
                "params": {"orientation": "vertical"}
            })
        
        return graphs if len(graphs) >= 2 else graphs + [{
            "type": "histogram",
            "fields": [self.df.columns[0]] if len(self.df.columns) > 0 else ["value"],
            "reason": "Additional data distribution visualization",
            "params": {"bins": 15}
        }]

    
    def _analyze_column_purposes(self) -> Dict[str, str]:
        """Analyze columns intelligently to provide meaningful descriptions."""
        purposes = {}
        
        for col in self.df.columns:
            col_lower = col.lower()
            dtype = str(self.df[col].dtype)
            unique_count = self.df[col].nunique()
            total_count = len(self.df[col])
            missing_count = self.df[col].isna().sum()
            
            # Analyze based on column name patterns
            if any(keyword in col_lower for keyword in ['id', 'identifier', 'code']):
                purposes[col] = f"Unique identifier ({unique_count} unique values)"
            elif any(keyword in col_lower for keyword in ['date', 'time', 'birth', 'death', 'entry']):
                purposes[col] = f"Date/time field tracking temporal information"
            elif any(keyword in col_lower for keyword in ['age', 'duration', 'year']):
                if 'int' in dtype or 'float' in dtype:
                    min_val = self.df[col].min() if not self.df[col].isna().all() else 'N/A'
                    max_val = self.df[col].max() if not self.df[col].isna().all() else 'N/A'
                    purposes[col] = f"Numeric measure of time/age (range: {min_val} to {max_val})"
                else:
                    purposes[col] = "Time-related categorical variable"
            elif any(keyword in col_lower for keyword in ['amount', 'value', 'price', 'cost', 'claim']):
                if 'int' in dtype or 'float' in dtype:
                    purposes[col] = f"Monetary or numeric value (${self.df[col].mean():.2f} average)" if not self.df[col].isna().all() else "Monetary value"
                else:
                    purposes[col] = "Financial data field"
            elif any(keyword in col_lower for keyword in ['name', 'description', 'label']):
                purposes[col] = f"Descriptive text field ({unique_count} unique values)"
            elif any(keyword in col_lower for keyword in ['status', 'type', 'category', 'class', 'group']):
                if unique_count < 20:
                    categories = self.df[col].value_counts().head(3).index.tolist()
                    purposes[col] = f"Categorical variable with {unique_count} categories (e.g., {', '.join(map(str, categories))})"
                else:
                    purposes[col] = f"Categorical variable ({unique_count} categories)"
            elif any(keyword in col_lower for keyword in ['count', 'number', 'quantity']):
                purposes[col] = f"Count or quantity measure"
            elif any(keyword in col_lower for keyword in ['rate', 'ratio', 'percent', 'proportion']):
                purposes[col] = f"Rate or percentage measure"
            # Analyze based on data characteristics
            elif 'int' in dtype or 'float' in dtype:
                if unique_count == 2:
                    purposes[col] = "Binary numeric indicator (0/1 or similar)"
                elif unique_count < 10:
                    purposes[col] = f"Discrete numeric variable ({unique_count} distinct values)"
                else:
                    mean_val = self.df[col].mean() if not self.df[col].isna().all() else 0
                    purposes[col] = f"Continuous numeric variable (mean: {mean_val:.2f})"
            elif 'object' in dtype or 'string' in dtype:
                if unique_count == total_count - missing_count:
                    purposes[col] = f"Unique text identifier or description"
                elif unique_count < 10:
                    purposes[col] = f"Categorical text variable ({unique_count} categories)"
                else:
                    purposes[col] = f"Text field with {unique_count} unique values"
            elif 'bool' in dtype:
                purposes[col] = "Boolean flag (True/False indicator)"
            elif 'datetime' in dtype:
                purposes[col] = "Date/time timestamp"
            else:
                purposes[col] = f"{dtype} data type with {unique_count} unique values"
            
            # Add missing value info if significant
            if missing_count > 0:
                missing_pct = (missing_count / total_count) * 100
                if missing_pct > 5:
                    purposes[col] += f" ({missing_pct:.1f}% missing)"
        
        return purposes



def analyze_with_gemini(csv_path: str) -> Dict[str, Any]:
    """Convenience function to analyze dataset with Gemini."""
    analyzer = GeminiAnalyzer(csv_path)
    return analyzer.analyze_with_gemini()
