"""Natural Language Query service for AI-powered data visualization."""
import os
import pandas as pd
import numpy as np
import google.generativeai as genai
from typing import Dict, Any, List, Optional
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
backend_dir = Path(__file__).parent.parent.parent
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print(f"[INFO] NLQ Service initialized with Gemini API")
else:
    print(f"[WARN] NLQ Service: No Gemini API key found")


class NLQService:
    """Natural Language Query service using Gemini AI."""
    
    def __init__(self, csv_path: str):
        """Initialize with dataset path."""
        self.csv_path = csv_path
        self.df = pd.read_csv(csv_path)
        
        if GEMINI_API_KEY:
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    
    def get_dataset_info(self) -> Dict[str, Any]:
        """Get dataset information for context."""
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = self.df.select_dtypes(include=['object', 'category']).columns.tolist()
        date_cols = [col for col in self.df.columns if 'date' in col.lower() or 'time' in col.lower()]
        
        return {
            "columns": list(self.df.columns),
            "numeric_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "date_columns": date_cols,
            "row_count": len(self.df),
            "sample_data": self.df.head(3).to_dict('records')
        }
    
    def interpret_query(self, query: str) -> Dict[str, Any]:
        """
        Interpret natural language query and generate chart plan.
        
        Args:
            query: Natural language query (e.g., "Plot claim severity by age")
        
        Returns:
            {
                "chart_type": "bar|line|scatter|histogram|pie|survival",
                "x_column": "column_name",
                "y_column": "column_name",
                "aggregation": "sum|mean|count|none",
                "group_by": "column_name" or null,
                "filters": {...},
                "reasoning": "AI explanation",
                "columns_used": ["col1", "col2"]
            }
        """
        if not self.model:
            return self._fallback_interpretation(query)
        
        dataset_info = self.get_dataset_info()
        
        prompt = f"""You are an expert data analyst. Interpret this natural language query and generate a chart plan.

DATASET INFORMATION:
- Available Columns: {dataset_info['columns']}
- Numeric Columns: {dataset_info['numeric_columns']}
- Categorical Columns: {dataset_info['categorical_columns']}
- Date/Time Columns: {dataset_info['date_columns']}
- Total Rows: {dataset_info['row_count']}

Sample Data (first 3 rows):
{json.dumps(dataset_info['sample_data'], indent=2)}

USER QUERY: "{query}"

INSTRUCTIONS:
1. Identify the intent (plot, compare, show distribution, analyze trend, etc.)
2. Select the most appropriate columns from the available columns
3. Choose the best chart type:
   - "bar" - for categorical comparisons or grouped data
   - "line" - for trends over time or continuous data
   - "scatter" - for relationships between two numeric variables
   - "histogram" - for distribution of a single numeric variable
   - "pie" - for proportions/percentages of categories
   - "heatmap" - for showing relationships between two categorical/discrete variables with a numeric value
   - "survival" - for survival analysis (if time and event columns exist)
   - "boxplot" - for statistical distribution and outliers

4. Determine aggregation method if needed:
   - "sum" - total values
   - "mean" - average values
   - "count" - frequency/count
   - "median" - median values
   - "none" - no aggregation (raw data)

5. Identify any grouping or filtering needed

6. Provide clear reasoning explaining your choices

Return your analysis as a JSON object with this EXACT structure:
{{
  "chart_type": "bar|line|scatter|histogram|pie|heatmap|survival|boxplot",
  "x_column": "column_name_from_dataset",
  "y_column": "column_name_from_dataset" or null,
  "aggregation": "sum|mean|count|median|none",
  "group_by": "column_name" or null,
  "filters": {{}},
  "reasoning": "Clear explanation of why this visualization was chosen and what it will show",
  "columns_used": ["column1", "column2"],
  "title": "Descriptive chart title"
}}

IMPORTANT:
- Only use columns that exist in the dataset
- Be specific and actionable
- If the query is ambiguous, make reasonable assumptions
- Return ONLY valid JSON, no markdown formatting
"""
        
        try:
            print(f"[INFO] Interpreting query: {query}")
            response = self.model.generate_content(prompt)
            response_text = response.text
            
            # Extract JSON from markdown if present
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            plan = json.loads(response_text)
            
            # Validate that we got a proper chart plan
            if not plan.get('chart_type') or not plan.get('x_column'):
                print(f"[WARN] Invalid chart plan from Gemini, using fallback")
                return self._fallback_interpretation(query)
            
            print(f"[INFO] Query interpreted successfully: {plan['chart_type']}")
            return plan
            
        except Exception as e:
            print(f"[ERROR] Query interpretation failed: {e}")
            return self._fallback_interpretation(query)
    
    def _fallback_interpretation(self, query: str) -> Dict[str, Any]:
        """Fallback interpretation when Gemini is unavailable."""
        query_lower = query.lower()
        dataset_info = self.get_dataset_info()
        
        # Simple keyword-based interpretation
        if any(word in query_lower for word in ['distribution', 'histogram', 'spread']):
            numeric_col = dataset_info['numeric_columns'][0] if dataset_info['numeric_columns'] else dataset_info['columns'][0]
            return {
                "chart_type": "histogram",
                "x_column": numeric_col,
                "y_column": None,
                "aggregation": "none",
                "group_by": None,
                "filters": {},
                "reasoning": f"Showing distribution of {numeric_col}",
                "columns_used": [numeric_col],
                "title": f"Distribution of {numeric_col}"
            }
        
        elif any(word in query_lower for word in ['compare', 'by', 'across']):
            cat_col = dataset_info['categorical_columns'][0] if dataset_info['categorical_columns'] else dataset_info['columns'][0]
            num_col = dataset_info['numeric_columns'][0] if dataset_info['numeric_columns'] else dataset_info['columns'][1]
            return {
                "chart_type": "bar",
                "x_column": cat_col,
                "y_column": num_col,
                "aggregation": "mean",
                "group_by": None,
                "filters": {},
                "reasoning": f"Comparing {num_col} across {cat_col}",
                "columns_used": [cat_col, num_col],
                "title": f"{num_col} by {cat_col}"
            }
        
        elif any(word in query_lower for word in ['trend', 'over time', 'timeline']):
            date_col = dataset_info['date_columns'][0] if dataset_info['date_columns'] else dataset_info['columns'][0]
            num_col = dataset_info['numeric_columns'][0] if dataset_info['numeric_columns'] else dataset_info['columns'][1]
            return {
                "chart_type": "line",
                "x_column": date_col,
                "y_column": num_col,
                "aggregation": "none",
                "group_by": None,
                "filters": {},
                "reasoning": f"Showing trend of {num_col} over {date_col}",
                "columns_used": [date_col, num_col],
                "title": f"{num_col} Trend"
            }
        
        else:
            # Default: bar chart of first categorical vs first numeric
            x_col = dataset_info['categorical_columns'][0] if dataset_info['categorical_columns'] else dataset_info['columns'][0]
            y_col = dataset_info['numeric_columns'][0] if dataset_info['numeric_columns'] else dataset_info['columns'][1]
            return {
                "chart_type": "bar",
                "x_column": x_col,
                "y_column": y_col,
                "aggregation": "mean",
                "group_by": None,
                "filters": {},
                "reasoning": f"Showing {y_col} by {x_col}",
                "columns_used": [x_col, y_col],
                "title": f"{y_col} by {x_col}"
            }
    
    def execute_chart_plan(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the chart plan and prepare data for visualization.
        
        Args:
            plan: Chart plan from interpret_query
        
        Returns:
            {
                "chart_type": "bar",
                "chart_data": {...},  # Chart.js compatible data
                "reasoning": "...",
                "columns_used": [...],
                "title": "..."
            }
        """
        try:
            chart_type = plan['chart_type']
            x_column = plan['x_column']
            y_column = plan.get('y_column')
            aggregation = plan.get('aggregation', 'none')
            group_by = plan.get('group_by')
            
            # Prepare data based on chart type
            if chart_type == 'histogram':
                return self._prepare_histogram(x_column, plan)
            
            elif chart_type == 'bar':
                return self._prepare_bar_chart(x_column, y_column, aggregation, plan)
            
            elif chart_type == 'line':
                return self._prepare_line_chart(x_column, y_column, aggregation, plan)
            
            elif chart_type == 'scatter':
                return self._prepare_scatter_chart(x_column, y_column, plan)
            
            elif chart_type == 'pie':
                return self._prepare_pie_chart(x_column, y_column, aggregation, plan)
            
            elif chart_type == 'boxplot':
                return self._prepare_boxplot(x_column, plan)
            
            elif chart_type == 'heatmap':
                return self._prepare_heatmap(x_column, y_column, plan)
            
            else:
                raise ValueError(f"Unsupported chart type: {chart_type}")
        
        except Exception as e:
            print(f"[ERROR] Chart plan execution failed: {e}")
            raise
    
    def _prepare_histogram(self, column: str, plan: Dict) -> Dict:
        """Prepare histogram data."""
        values = self.df[column].dropna()
        
        # Calculate histogram bins
        counts, bins = np.histogram(values, bins=20)
        bin_labels = [f"{bins[i]:.1f}-{bins[i+1]:.1f}" for i in range(len(bins)-1)]
        
        return {
            "chart_type": "histogram",
            "chart_data": {
                "labels": bin_labels,
                "datasets": [{
                    "label": column,
                    "data": counts.tolist(),
                    "backgroundColor": "rgba(33, 150, 243, 0.6)",
                    "borderColor": "rgba(33, 150, 243, 1)",
                    "borderWidth": 1
                }]
            },
            "reasoning": plan['reasoning'],
            "columns_used": plan['columns_used'],
            "title": plan['title']
        }
    
    def _prepare_bar_chart(self, x_column: str, y_column: str, aggregation: str, plan: Dict) -> Dict:
        """Prepare bar chart data."""
        if aggregation == 'count':
            # Count frequency
            data = self.df[x_column].value_counts().head(20)
            labels = data.index.tolist()
            values = data.values.tolist()
        else:
            # Group and aggregate
            grouped = self.df.groupby(x_column)[y_column]
            
            if aggregation == 'sum':
                data = grouped.sum()
            elif aggregation == 'mean':
                data = grouped.mean()
            elif aggregation == 'median':
                data = grouped.median()
            else:
                data = grouped.mean()
            
            data = data.head(20)
            labels = data.index.tolist()
            values = data.values.tolist()
        
        return {
            "chart_type": "bar",
            "chart_data": {
                "labels": labels,
                "datasets": [{
                    "label": y_column if y_column else x_column,
                    "data": values,
                    "backgroundColor": "rgba(76, 175, 80, 0.6)",
                    "borderColor": "rgba(76, 175, 80, 1)",
                    "borderWidth": 1
                }]
            },
            "reasoning": plan['reasoning'],
            "columns_used": plan['columns_used'],
            "title": plan['title']
        }
    
    def _prepare_line_chart(self, x_column: str, y_column: str, aggregation: str, plan: Dict) -> Dict:
        """Prepare line chart data."""
        # Sort by x column
        df_sorted = self.df[[x_column, y_column]].dropna().sort_values(x_column)
        
        if aggregation != 'none':
            # Group and aggregate
            grouped = df_sorted.groupby(x_column)[y_column]
            if aggregation == 'mean':
                data = grouped.mean()
            elif aggregation == 'sum':
                data = grouped.sum()
            else:
                data = grouped.mean()
            
            labels = data.index.tolist()
            values = data.values.tolist()
        else:
            labels = df_sorted[x_column].head(100).tolist()
            values = df_sorted[y_column].head(100).tolist()
        
        return {
            "chart_type": "line",
            "chart_data": {
                "labels": labels,
                "datasets": [{
                    "label": y_column,
                    "data": values,
                    "borderColor": "rgba(156, 39, 176, 1)",
                    "backgroundColor": "rgba(156, 39, 176, 0.2)",
                    "tension": 0.1,
                    "fill": True
                }]
            },
            "reasoning": plan['reasoning'],
            "columns_used": plan['columns_used'],
            "title": plan['title']
        }
    
    def _prepare_scatter_chart(self, x_column: str, y_column: str, plan: Dict) -> Dict:
        """Prepare scatter plot data."""
        df_clean = self.df[[x_column, y_column]].dropna()
        
        scatter_data = [
            {"x": row[x_column], "y": row[y_column]}
            for _, row in df_clean.head(500).iterrows()
        ]
        
        return {
            "chart_type": "scatter",
            "chart_data": {
                "datasets": [{
                    "label": f"{x_column} vs {y_column}",
                    "data": scatter_data,
                    "backgroundColor": "rgba(255, 152, 0, 0.6)",
                    "borderColor": "rgba(255, 152, 0, 1)"
                }]
            },
            "reasoning": plan['reasoning'],
            "columns_used": plan['columns_used'],
            "title": plan['title']
        }
    
    def _prepare_pie_chart(self, x_column: str, y_column: str, aggregation: str, plan: Dict) -> Dict:
        """Prepare pie chart data."""
        if aggregation == 'count' or not y_column:
            data = self.df[x_column].value_counts().head(10)
        else:
            data = self.df.groupby(x_column)[y_column].sum().head(10)
        
        labels = data.index.tolist()
        values = data.values.tolist()
        
        # Generate colors
        colors = [
            f"rgba({(i*50)%255}, {(i*80)%255}, {(i*120)%255}, 0.6)"
            for i in range(len(labels))
        ]
        
        return {
            "chart_type": "pie",
            "chart_data": {
                "labels": labels,
                "datasets": [{
                    "data": values,
                    "backgroundColor": colors
                }]
            },
            "reasoning": plan['reasoning'],
            "columns_used": plan['columns_used'],
            "title": plan['title']
        }
    
    def _prepare_boxplot(self, column: str, plan: Dict) -> Dict:
        """Prepare boxplot data (simplified as bar chart with quartiles)."""
        values = self.df[column].dropna().sort_values()
        
        if len(values) > 0:
            q1 = values.quantile(0.25)
            median = values.quantile(0.5)
            q3 = values.quantile(0.75)
            min_val = values.min()
            max_val = values.max()
            
            return {
                "chart_type": "bar",
                "chart_data": {
                    "labels": ['Min', 'Q1', 'Median', 'Q3', 'Max'],
                    "datasets": [{
                        "label": column,
                        "data": [min_val, q1, median, q3, max_val],
                        "backgroundColor": "rgba(244, 67, 54, 0.6)",
                        "borderColor": "rgba(244, 67, 54, 1)",
                        "borderWidth": 1
                    }]
                },
                "reasoning": plan['reasoning'],
                "columns_used": plan['columns_used'],
                "title": plan['title']
            }
        else:
            raise ValueError("No data available for boxplot")
    
    def _prepare_heatmap(self, x_column: str, y_column: str, plan: Dict) -> Dict:
        """Prepare heatmap data (matrix format)."""
        if not y_column:
            raise ValueError("Heatmap requires both x and y columns")
        
        # Create pivot table for heatmap
        # Group by both columns and count occurrences or aggregate a third column
        pivot_data = self.df.groupby([x_column, y_column]).size().unstack(fill_value=0)
        
        # Limit size for performance
        if len(pivot_data.index) > 20:
            pivot_data = pivot_data.head(20)
        if len(pivot_data.columns) > 20:
            pivot_data = pivot_data.iloc[:, :20]
        
        # Convert to format suitable for Chart.js heatmap (using matrix plugin)
        # For now, return as a simple grid that can be rendered as a table or converted to scatter
        x_labels = pivot_data.columns.tolist()
        y_labels = pivot_data.index.tolist()
        
        # Convert to scatter-like format with color intensity
        heatmap_data = []
        max_value = pivot_data.max().max() if not pivot_data.empty else 1
        
        # Pre-compute colors for each data point
        colors = []
        for i, y_val in enumerate(y_labels):
            for j, x_val in enumerate(x_labels):
                value = pivot_data.loc[y_val, x_val]
                color = self._get_heatmap_color(float(value), max_value)
                
                heatmap_data.append({
                    "x": str(x_val),
                    "y": str(y_val),
                    "v": float(value),
                    "r": 15
                })
                colors.append(color)
        
        return {
            "chart_type": "heatmap",
            "chart_data": {
                "datasets": [{
                    "label": f"{x_column} vs {y_column}",
                    "data": heatmap_data,
                    "backgroundColor": colors,
                    "borderColor": [c.replace('0.7', '1') for c in colors]
                }],
                "x_labels": x_labels,
                "y_labels": y_labels,
                "matrix": pivot_data.values.tolist()
            },
            "reasoning": plan['reasoning'],
            "columns_used": plan['columns_used'],
            "title": plan['title']
        }
    
    def _get_heatmap_color(self, value: float, max_value: float) -> str:
        """Generate color based on value intensity."""
        if max_value == 0:
            intensity = 0
        else:
            intensity = value / max_value
        
        # Blue to red gradient
        r = int(255 * intensity)
        b = int(255 * (1 - intensity))
        return f"rgba({r}, 100, {b}, 0.7)"



def process_nlq(csv_path: str, query: str) -> Dict[str, Any]:
    """
    Process natural language query and return chart data.
    
    Args:
        csv_path: Path to CSV file
        query: Natural language query
    
    Returns:
        Chart data with reasoning
    """
    service = NLQService(csv_path)
    plan = service.interpret_query(query)
    result = service.execute_chart_plan(plan)
    return result
