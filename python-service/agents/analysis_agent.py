"""
Analysis Agent - Uses Pandas + Groq LLM to perform statistical analysis and generate business insights.
"""

import pandas as pd
import numpy as np
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
import json
import os


def get_llm():
    return ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model_name="llama-3.1-8b-instant",
        temperature=0.3,
        max_tokens=4096
    )


def analyze_data(state: dict) -> dict:
    """
    Perform statistical analysis and generate business insights.
    """
    df = state["df"]
    insights = []
    
    # Basic statistics
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    datetime_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
    
    # Generate data profile
    profile = {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "numeric_columns": len(numeric_cols),
        "categorical_columns": len(categorical_cols),
        "datetime_columns": len(datetime_cols),
        "memory_usage": f"{df.memory_usage(deep=True).sum() / 1024:.1f} KB"
    }
    
    # Statistical summaries for numeric columns
    stats_summary = {}
    for col in numeric_cols[:10]:  # Limit to 10 columns
        stats_summary[col] = {
            "mean": round(float(df[col].mean()), 2),
            "median": round(float(df[col].median()), 2),
            "std": round(float(df[col].std()), 2),
            "min": round(float(df[col].min()), 2),
            "max": round(float(df[col].max()), 2),
            "skewness": round(float(df[col].skew()), 2)
        }
    
    # Correlation analysis
    correlations = []
    if len(numeric_cols) >= 2:
        corr_matrix = df[numeric_cols].corr()
        for i in range(len(numeric_cols)):
            for j in range(i + 1, len(numeric_cols)):
                corr_val = corr_matrix.iloc[i, j]
                if abs(corr_val) > 0.5:
                    correlations.append({
                        "col1": numeric_cols[i],
                        "col2": numeric_cols[j],
                        "correlation": round(float(corr_val), 3)
                    })
        correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)
    
    # Trend detection for datetime + numeric combinations
    trends = []
    if datetime_cols and numeric_cols:
        date_col = datetime_cols[0]
        df_sorted = df.sort_values(date_col)
        for num_col in numeric_cols[:5]:
            try:
                values = df_sorted[num_col].values
                if len(values) > 2:
                    first_half = np.nanmean(values[:len(values)//2])
                    second_half = np.nanmean(values[len(values)//2:])
                    if first_half != 0:
                        change_pct = ((second_half - first_half) / abs(first_half)) * 100
                        if abs(change_pct) > 5:
                            direction = "increasing" if change_pct > 0 else "decreasing"
                            trends.append({
                                "column": num_col,
                                "direction": direction,
                                "change_percent": round(change_pct, 1)
                            })
            except Exception:
                pass
    
    # Category distribution analysis
    category_info = {}
    for col in categorical_cols[:5]:
        value_counts = df[col].value_counts().head(10)
        category_info[col] = {
            "unique_count": int(df[col].nunique()),
            "top_values": {str(k): int(v) for k, v in value_counts.items()}
        }
    
    # Use LLM to generate business insights
    try:
        llm = get_llm()
        
        data_context = f"""
Dataset Overview:
- {profile['total_rows']} rows × {profile['total_columns']} columns
- Numeric columns: {numeric_cols[:8]}
- Categorical columns: {categorical_cols[:8]}
- Date columns: {datetime_cols}

Statistical Summary:
{json.dumps(stats_summary, indent=2)[:2000]}

Top Correlations:
{json.dumps(correlations[:5], indent=2)}

Trends Detected:
{json.dumps(trends, indent=2)}

Category Distributions:
{json.dumps(category_info, indent=2)[:1500]}
"""
        
        response = llm.invoke([
            SystemMessage(content="""You are a business intelligence analyst. Analyze the data and generate exactly 5-7 business insights.[
Return ONLY a valid JSON array with objects having these fields:
- "category": one of "trend", "anomaly", "correlation", "summary", "recommendation"
- "title": short insight title (max 10 words)
- "description": detailed insight (2-3 sentences)
- "importance": "high", "medium", or "low"
- "metric": relevant column name or empty string
- "value": key metric value or empty string

Example format:
[{"category":"trend","title":"Revenue Growing Steadily","description":"Revenue shows a consistent 15% growth...","importance":"high","metric":"revenue","value":"15% growth"}]
"""),
            HumanMessage(content=f"Analyze this business data and provide insights:\n{data_context}")
        ])
        
        try:
            content = response.content.strip()
            # Extract JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            llm_insights = json.loads(content)
            if isinstance(llm_insights, list):
                insights = llm_insights
        except (json.JSONDecodeError, IndexError):
            pass
    except Exception as e:
        print(f"LLM analysis error: {e}")
    
    # Fallback insights from statistical analysis
    if not insights:
        # Generate basic insights from statistics
        if stats_summary:
            top_col = max(stats_summary.keys(), key=lambda c: stats_summary[c]["mean"])
            insights.append({
                "category": "summary",
                "title": f"Highest Average: {top_col}",
                "description": f"The column '{top_col}' has the highest mean value of {stats_summary[top_col]['mean']}.",
                "importance": "medium",
                "metric": top_col,
                "value": str(stats_summary[top_col]["mean"])
            })
        
        if correlations:
            top_corr = correlations[0]
            insights.append({
                "category": "correlation",
                "title": f"Strong Correlation Found",
                "description": f"'{top_corr['col1']}' and '{top_corr['col2']}' have a correlation of {top_corr['correlation']}.",
                "importance": "high",
                "metric": f"{top_corr['col1']} vs {top_corr['col2']}",
                "value": str(top_corr["correlation"])
            })
        
        for trend in trends[:3]:
            insights.append({
                "category": "trend",
                "title": f"{trend['column']} is {trend['direction']}",
                "description": f"The metric '{trend['column']}' shows a {trend['direction']} trend with a {trend['change_percent']}% change.",
                "importance": "high" if abs(trend["change_percent"]) > 20 else "medium",
                "metric": trend["column"],
                "value": f"{trend['change_percent']}%"
            })
    
    # Generate summary
    try:
        llm = get_llm()
        summary_response = llm.invoke([
            SystemMessage(content="You are a data analyst. Generate a concise 3-4 sentence executive summary of this dataset."),
            HumanMessage(content=f"Dataset: {profile['total_rows']} rows, {profile['total_columns']} columns.\nColumns: {list(df.columns)}\nNumeric stats: {json.dumps(stats_summary, indent=2)[:1000]}")
        ])
        summary = summary_response.content
    except Exception:
        summary = f"Dataset contains {profile['total_rows']} rows and {profile['total_columns']} columns with {profile['numeric_columns']} numeric and {profile['categorical_columns']} categorical features."
    
    # Build column metadata
    columns_meta = []
    for col in df.columns:
        col_meta = {
            "name": col,
            "dtype": str(df[col].dtype),
            "nullCount": int(df[col].isna().sum()),
            "uniqueCount": int(df[col].nunique()),
            "sample": df[col].dropna().head(5).tolist()
        }
        # Convert numpy types for JSON serialization
        col_meta["sample"] = [
            str(v) if isinstance(v, (pd.Timestamp, np.datetime64)) else
            float(v) if isinstance(v, (np.floating, np.integer)) else v
            for v in col_meta["sample"]
        ]
        columns_meta.append(col_meta)
    
    state["insights"] = insights
    state["summary"] = summary
    state["columns_meta"] = columns_meta
    state["stats_summary"] = stats_summary
    state["correlations"] = correlations
    state["trends"] = trends
    state["category_info"] = category_info
    state["profile"] = profile
    
    return state
