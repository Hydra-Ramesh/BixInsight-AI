"""
Visualization Agent - Recommends and generates chart data for interactive frontend visualizations.
Also generates Matplotlib/Seaborn static charts as base64 images.
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import base64
import io
import json
import os
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage


def get_llm():
    return ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model_name="llama-3.1-8b-instant",
        temperature=0.2,
        max_tokens=2048
    )


# Premium color palette
COLORS = [
    "#6366f1", "#8b5cf6", "#a78bfa", "#c084fc",
    "#f472b6", "#fb7185", "#f97316", "#fbbf24",
    "#34d399", "#2dd4bf", "#22d3ee", "#60a5fa"
]

plt.style.use('dark_background')
sns.set_theme(style="darkgrid", palette=COLORS)


def _fig_to_base64(fig) -> str:
    """Convert matplotlib figure to base64 string."""
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=120,
                facecolor='#1a1a2e', edgecolor='none')
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return b64


def _safe_json_data(data_list):
    """Convert data to JSON-safe format."""
    safe = []
    for item in data_list:
        safe_item = {}
        for k, v in item.items():
            if isinstance(v, (np.integer,)):
                safe_item[k] = int(v)
            elif isinstance(v, (np.floating,)):
                safe_item[k] = round(float(v), 2) if not np.isnan(v) else 0
            elif isinstance(v, (pd.Timestamp, np.datetime64)):
                safe_item[k] = str(v)
            elif pd.isna(v):
                safe_item[k] = 0
            else:
                safe_item[k] = v
        safe.append(safe_item)
    return safe


def generate_visualizations(state: dict) -> dict:
    """Generate chart data and static images for the dashboard."""
    df = state["df"]
    charts = []
    
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    datetime_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
    
    # ─── Chart 1: Distribution of top numeric columns (Bar Chart) ───
    if numeric_cols:
        top_num = numeric_cols[:4]
        summary_data = []
        for col in top_num:
            summary_data.append({
                "name": col.replace("_", " ").title(),
                "mean": round(float(df[col].mean()), 2),
                "median": round(float(df[col].median()), 2),
                "max": round(float(df[col].max()), 2)
            })
        
        # Matplotlib version
        fig, ax = plt.subplots(figsize=(10, 6))
        x = np.arange(len(top_num))
        width = 0.25
        ax.bar(x - width, [d["mean"] for d in summary_data], width, label='Mean', color=COLORS[0])
        ax.bar(x, [d["median"] for d in summary_data], width, label='Median', color=COLORS[1])
        ax.bar(x + width, [d["max"] for d in summary_data], width, label='Max', color=COLORS[2])
        ax.set_xticks(x)
        ax.set_xticklabels([d["name"] for d in summary_data], rotation=15)
        ax.legend()
        ax.set_title("Numeric Column Statistics", fontsize=14, fontweight='bold', color='white')
        img = _fig_to_base64(fig)
        
        charts.append({
            "chartType": "bar",
            "title": "Key Metrics Overview",
            "description": "Mean, median, and maximum values for numeric columns",
            "xKey": "name",
            "yKeys": ["mean", "median", "max"],
            "data": summary_data,
            "colors": COLORS[:3],
            "imageBase64": img
        })
    
    # ─── Chart 2: Time series line chart ───
    if datetime_cols and numeric_cols:
        date_col = datetime_cols[0]
        target_cols = numeric_cols[:3]
        df_sorted = df.sort_values(date_col)
        
        # Resample if too many data points
        if len(df_sorted) > 100:
            df_sorted = df_sorted.set_index(date_col)
            df_resampled = df_sorted[target_cols].resample('W').mean().reset_index()
            df_sorted = df_resampled
            date_col_name = df_sorted.columns[0]
        else:
            date_col_name = date_col
        
        line_data = []
        for _, row in df_sorted.iterrows():
            point = {"date": str(row[date_col_name])[:10]}
            for col in target_cols:
                if col in df_sorted.columns:
                    point[col] = round(float(row[col]) if pd.notna(row[col]) else 0, 2)
            line_data.append(point)
        
        line_data = line_data[:100]  # Limit data points
        
        # Matplotlib version
        fig, ax = plt.subplots(figsize=(12, 6))
        for i, col in enumerate(target_cols):
            if col in df_sorted.columns:
                vals = [d.get(col, 0) for d in line_data]
                ax.plot(range(len(vals)), vals, color=COLORS[i], label=col.replace("_", " ").title(), linewidth=2)
        ax.set_title("Trends Over Time", fontsize=14, fontweight='bold', color='white')
        ax.legend()
        step = max(1, len(line_data) // 8)
        ax.set_xticks(range(0, len(line_data), step))
        ax.set_xticklabels([line_data[i]["date"] for i in range(0, len(line_data), step)], rotation=45)
        img = _fig_to_base64(fig)
        
        charts.append({
            "chartType": "line",
            "title": "Trends Over Time",
            "description": f"Time series trends for key metrics over {date_col}",
            "xKey": "date",
            "yKeys": target_cols,
            "data": line_data,
            "colors": COLORS[:len(target_cols)],
            "imageBase64": img
        })
    
    # ─── Chart 3: Category distribution (Pie Chart) ───
    if categorical_cols:
        cat_col = categorical_cols[0]
        value_counts = df[cat_col].value_counts().head(8)
        pie_data = [{"name": str(k), "value": int(v)} for k, v in value_counts.items()]
        
        # Matplotlib version
        fig, ax = plt.subplots(figsize=(8, 8))
        labels = [d["name"] for d in pie_data]
        sizes = [d["value"] for d in pie_data]
        colors = COLORS[:len(pie_data)]
        wedges, texts, autotexts = ax.pie(sizes, labels=labels, colors=colors,
                                           autopct='%1.1f%%', startangle=90,
                                           textprops={'color': 'white', 'fontsize': 10})
        ax.set_title(f"Distribution of {cat_col.replace('_', ' ').title()}", 
                     fontsize=14, fontweight='bold', color='white')
        img = _fig_to_base64(fig)
        
        charts.append({
            "chartType": "pie",
            "title": f"{cat_col.replace('_', ' ').title()} Distribution",
            "description": f"Distribution of top {len(pie_data)} categories in {cat_col}",
            "xKey": "name",
            "yKeys": ["value"],
            "data": pie_data,
            "colors": colors,
            "imageBase64": img
        })
    
    # ─── Chart 4: Correlation Heatmap (as scatter for Recharts) ───
    if len(numeric_cols) >= 2:
        correlations = state.get("correlations", [])
        if correlations:
            top_corr = correlations[0]
            col1, col2 = top_corr["col1"], top_corr["col2"]
            scatter_data = _safe_json_data(
                df[[col1, col2]].dropna().head(200).to_dict('records')
            )
            
            # Seaborn correlation heatmap
            fig, ax = plt.subplots(figsize=(10, 8))
            corr_matrix = df[numeric_cols[:8]].corr()
            sns.heatmap(corr_matrix, annot=True, fmt='.2f', cmap='RdYlBu_r',
                       ax=ax, vmin=-1, vmax=1, linewidths=0.5,
                       annot_kws={"size": 9, "color": "white"})
            ax.set_title("Correlation Matrix", fontsize=14, fontweight='bold', color='white')
            plt.xticks(rotation=45, ha='right')
            plt.yticks(rotation=0)
            img = _fig_to_base64(fig)
            
            charts.append({
                "chartType": "scatter",
                "title": f"Correlation: {col1} vs {col2}",
                "description": f"Scatter plot showing correlation of {top_corr['correlation']} between {col1} and {col2}",
                "xKey": col1,
                "yKeys": [col2],
                "data": scatter_data,
                "colors": [COLORS[4]],
                "imageBase64": img
            })
    
    # ─── Chart 5: Area chart for numeric with categories ───
    if categorical_cols and numeric_cols:
        cat_col = categorical_cols[0]
        num_col = numeric_cols[0]
        
        grouped = df.groupby(cat_col)[num_col].agg(['mean', 'sum', 'count']).reset_index()
        grouped = grouped.sort_values('sum', ascending=False).head(10)
        
        area_data = _safe_json_data([{
            "name": str(row[cat_col]),
            "average": round(float(row["mean"]), 2),
            "total": round(float(row["sum"]), 2),
            "count": int(row["count"])
        } for _, row in grouped.iterrows()])
        
        # Matplotlib
        fig, ax = plt.subplots(figsize=(10, 6))
        names = [d["name"] for d in area_data]
        totals = [d["total"] for d in area_data]
        ax.fill_between(range(len(names)), totals, alpha=0.3, color=COLORS[0])
        ax.plot(range(len(names)), totals, color=COLORS[0], linewidth=2, marker='o')
        ax.set_xticks(range(len(names)))
        ax.set_xticklabels(names, rotation=45, ha='right')
        ax.set_title(f"{num_col.replace('_', ' ').title()} by {cat_col.replace('_', ' ').title()}", 
                     fontsize=14, fontweight='bold', color='white')
        img = _fig_to_base64(fig)
        
        charts.append({
            "chartType": "area",
            "title": f"{num_col.replace('_', ' ').title()} by Category",
            "description": f"Area chart showing {num_col} distributed across {cat_col} categories",
            "xKey": "name",
            "yKeys": ["average", "total"],
            "data": area_data,
            "colors": [COLORS[5], COLORS[6]],
            "imageBase64": img
        })
    
    # ─── Chart 6: Top values bar chart ───
    if numeric_cols and len(numeric_cols) >= 2:
        col = numeric_cols[0]
        top_n = df.nlargest(10, col)
        id_col = categorical_cols[0] if categorical_cols else df.columns[0]
        
        bar_data = _safe_json_data([{
            "name": str(row[id_col])[:20],
            col: round(float(row[col]), 2)
        } for _, row in top_n.iterrows()])
        
        fig, ax = plt.subplots(figsize=(10, 6))
        names = [d["name"] for d in bar_data]
        vals = [d[col] for d in bar_data]
        bars = ax.barh(range(len(names)), vals, color=COLORS[3])
        ax.set_yticks(range(len(names)))
        ax.set_yticklabels(names)
        ax.set_title(f"Top 10 by {col.replace('_', ' ').title()}", fontsize=14, fontweight='bold', color='white')
        ax.invert_yaxis()
        img = _fig_to_base64(fig)
        
        charts.append({
            "chartType": "bar",
            "title": f"Top 10 by {col.replace('_', ' ').title()}",
            "description": f"Top 10 records ranked by {col}",
            "xKey": "name",
            "yKeys": [col],
            "data": bar_data,
            "colors": [COLORS[3]],
            "imageBase64": img
        })
    
    # ─── Gather Candidates ───
    candidates = []
    if numeric_cols: candidates.append({"id": "overview_bar", "type": "bar", "title": "Key Metrics Overview"})
    if datetime_cols and numeric_cols: candidates.append({"id": "trends_line", "type": "line", "title": "Trends Over Time"})
    if categorical_cols: candidates.append({"id": "cat_pie", "type": "pie", "title": f"{categorical_cols[0].replace('_', ' ').title()} Distribution"})
    if len(numeric_cols) >= 2 and state.get("correlations"): candidates.append({"id": "corr_scatter", "type": "scatter", "title": "Correlation Analysis"})
    if categorical_cols and numeric_cols: candidates.append({"id": "area_cat", "type": "area", "title": f"{numeric_cols[0].replace('_', ' ').title()} by Category"})
    if len(numeric_cols) >= 2: candidates.append({"id": "top_bar", "type": "bar", "title": "Top Records"})

    # ─── LLM Smart Ranking & Recommendations ───
    final_charts = []
    
    try:
        llm = get_llm()
        prompt = f"""
You are a Data Visualization Expert.
Analyze the dataset summary and the available chart candidates.
Select the most insightful charts to show to the user and provide a 1-sentence 'recommendation' explaining WHY this chart is valuable for this specific data.

Dataset snapshot:
Numeric columns: {numeric_cols}
Categorical columns: {categorical_cols}

Available candidates:
{json.dumps(candidates, indent=2)}

Return ONLY a JSON list of objects containing 'id' and 'recommendation'. Rank them by importance.
Example:
[
  {{"id": "cat_pie", "recommendation": "A pie chart perfectly illustrates the market share breakdown across your top categories."}}
]
"""
        response = llm.invoke([SystemMessage(content="Return strictly valid JSON array."), HumanMessage(content=prompt)])
        content = response.content.replace("```json", "").replace("```", "").strip()
        selected = json.loads(content)
        
        # Merge recommendations into the generated charts
        for sel in selected:
            cid = sel.get("id")
            rec = sel.get("recommendation", "AI recommended visualization.")
            
            if cid == "overview_bar":
                 chart_data = {
                    "chartType": "bar",
                    "title": "Key Metrics Overview",
                    "description": "Mean, median, and maximum values for numeric columns",
                    "recommendation": rec,
                    "xKey": "name",
                    "yKeys": ["mean", "median", "max"],
                    "data": summary_data,
                    "colors": COLORS[:3]
                 }
                 # generate fig
                 fig, ax = plt.subplots(figsize=(10, 6))
                 x = np.arange(len(top_num))
                 width = 0.25
                 ax.bar(x - width, [d["mean"] for d in summary_data], width, label='Mean', color=COLORS[0])
                 ax.bar(x, [d["median"] for d in summary_data], width, label='Median', color=COLORS[1])
                 ax.bar(x + width, [d["max"] for d in summary_data], width, label='Max', color=COLORS[2])
                 ax.set_xticks(x)
                 ax.set_xticklabels([d["name"] for d in summary_data], rotation=15)
                 ax.legend()
                 ax.set_title("Numeric Column Statistics", fontsize=14, fontweight='bold', color='white')
                 chart_data["imageBase64"] = _fig_to_base64(fig)
                 final_charts.append(chart_data)
                 
            elif cid == "trends_line":
                 chart_data = {
                    "chartType": "line",
                    "title": "Trends Over Time",
                    "description": f"Time series trends for key metrics over {date_col}",
                    "recommendation": rec,
                    "xKey": "date",
                    "yKeys": target_cols,
                    "data": line_data,
                    "colors": COLORS[:len(target_cols)]
                 }
                 fig, ax = plt.subplots(figsize=(12, 6))
                 for i, col in enumerate(target_cols):
                    if col in df_sorted.columns:
                        vals = [d.get(col, 0) for d in line_data]
                        ax.plot(range(len(vals)), vals, color=COLORS[i], label=col.replace("_", " ").title(), linewidth=2)
                 ax.set_title("Trends Over Time", fontsize=14, fontweight='bold', color='white')
                 ax.legend()
                 step_val = max(1, len(line_data) // 8)
                 ax.set_xticks(range(0, len(line_data), step_val))
                 ax.set_xticklabels([line_data[i]["date"] for i in range(0, len(line_data), step_val)], rotation=45)
                 chart_data["imageBase64"] = _fig_to_base64(fig)
                 final_charts.append(chart_data)
                 
            elif cid == "cat_pie":
                 chart_data = {
                    "chartType": "pie",
                    "title": f"{cat_col.replace('_', ' ').title()} Distribution",
                    "description": f"Distribution of top categories in {cat_col}",
                    "recommendation": rec,
                    "xKey": "name",
                    "yKeys": ["value"],
                    "data": pie_data,
                    "colors": colors
                 }
                 fig, ax = plt.subplots(figsize=(8, 8))
                 labels = [d["name"] for d in pie_data]
                 sizes = [d["value"] for d in pie_data]
                 wedges, texts, autotexts = ax.pie(sizes, labels=labels, colors=colors,
                                                    autopct='%1.1f%%', startangle=90,
                                                    textprops={'color': 'white', 'fontsize': 10})
                 ax.set_title(chart_data["title"], fontsize=14, fontweight='bold', color='white')
                 chart_data["imageBase64"] = _fig_to_base64(fig)
                 final_charts.append(chart_data)
                 
            elif cid == "corr_scatter":
                 chart_data = {
                    "chartType": "scatter",
                    "title": f"Correlation: {col1} vs {col2}",
                    "description": f"Scatter plot showing correlation",
                    "recommendation": rec,
                    "xKey": col1,
                    "yKeys": [col2],
                    "data": scatter_data,
                    "colors": [COLORS[4]]
                 }
                 fig, ax = plt.subplots(figsize=(10, 8))
                 corr_matrix = df[numeric_cols[:8]].corr()
                 sns.heatmap(corr_matrix, annot=True, fmt='.2f', cmap='RdYlBu_r',
                            ax=ax, vmin=-1, vmax=1, linewidths=0.5,
                            annot_kws={"size": 9, "color": "white"})
                 ax.set_title("Correlation Matrix", fontsize=14, fontweight='bold', color='white')
                 plt.xticks(rotation=45, ha='right')
                 plt.yticks(rotation=0)
                 chart_data["imageBase64"] = _fig_to_base64(fig)
                 final_charts.append(chart_data)
                 
            elif cid == "area_cat":
                 chart_data = {
                    "chartType": "area",
                    "title": f"{num_col.replace('_', ' ').title()} by Category",
                    "description": f"Area chart showing {num_col} over {cat_col}",
                    "recommendation": rec,
                    "xKey": "name",
                    "yKeys": ["average", "total"],
                    "data": area_data,
                    "colors": [COLORS[5], COLORS[6]]
                 }
                 fig, ax = plt.subplots(figsize=(10, 6))
                 names = [d["name"] for d in area_data]
                 totals = [d["total"] for d in area_data]
                 ax.fill_between(range(len(names)), totals, alpha=0.3, color=COLORS[0])
                 ax.plot(range(len(names)), totals, color=COLORS[0], linewidth=2, marker='o')
                 ax.set_xticks(range(len(names)))
                 ax.set_xticklabels(names, rotation=45, ha='right')
                 ax.set_title(chart_data["title"], fontsize=14, fontweight='bold', color='white')
                 chart_data["imageBase64"] = _fig_to_base64(fig)
                 final_charts.append(chart_data)
                 
            elif cid == "top_bar":
                 chart_data = {
                    "chartType": "bar",
                    "title": f"Top 10 by {col.replace('_', ' ').title()}",
                    "description": f"Top 10 records ranked by {col}",
                    "recommendation": rec,
                    "xKey": "name",
                    "yKeys": [col],
                    "data": bar_data,
                    "colors": [COLORS[3]]
                 }
                 fig, ax = plt.subplots(figsize=(10, 6))
                 names = [d["name"] for d in bar_data]
                 vals = [d[col] for d in bar_data]
                 ax.barh(range(len(names)), vals, color=COLORS[3])
                 ax.set_yticks(range(len(names)))
                 ax.set_yticklabels(names)
                 ax.set_title(chart_data["title"], fontsize=14, fontweight='bold', color='white')
                 ax.invert_yaxis()
                 chart_data["imageBase64"] = _fig_to_base64(fig)
                 final_charts.append(chart_data)

    except Exception as e:
        print(f"Visualization LLM error: {e}")
        # Fallback to all charts without AI recommendations if LLM fails
        # (Assuming the original charts list is already prepared before this block)
        final_charts = charts

    # ─── Generate filters ───
    filters = []
    for c in categorical_cols[:5]:
        unique_vals = df[c].dropna().unique().tolist()
        if len(unique_vals) <= 50:
            filters.append({
                "column": c,
                "type": "select",
                "options": [str(v) for v in unique_vals[:30]]
            })
    
    for c in numeric_cols[:3]:
        filters.append({
            "column": c,
            "type": "range",
            "options": [round(float(df[c].min()), 2), round(float(df[c].max()), 2)]
        })
    
    for c in datetime_cols:
        filters.append({
            "column": c,
            "type": "date",
            "options": [str(df[c].min())[:10], str(df[c].max())[:10]]
        })
    
    # Cleaned data sample
    sample_data = _safe_json_data(df.head(50).to_dict('records'))
    
    state["charts"] = final_charts
    state["filters"] = filters
    state["cleaned_data_sample"] = sample_data
    
    return state
