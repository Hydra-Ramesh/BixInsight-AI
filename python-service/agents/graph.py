"""
LangGraph Agent Pipeline - Orchestrates the data analysis workflow:
  1. Data Cleaning → 2. Statistical Analysis → 3. Visualization Generation
"""

from typing import TypedDict, Any
from langgraph.graph import StateGraph, END
from agents.cleaning_agent import clean_data
from agents.analysis_agent import analyze_data
from agents.visualization_agent import generate_visualizations
import pandas as pd


class AnalysisState(TypedDict):
    df: Any
    cleaning_report: str
    cleaning_summary: str
    summary: str
    insights: list
    charts: list
    filters: list
    columns_meta: list
    stats_summary: dict
    correlations: list
    trends: list
    category_info: dict
    profile: dict
    cleaned_data_sample: list
    error: str
    status: str


def create_analysis_graph():
    """Create the LangGraph state graph for the analysis pipeline."""
    
    workflow = StateGraph(AnalysisState)
    
    # Add nodes
    workflow.add_node("clean", clean_node)
    workflow.add_node("analyze", analyze_node)
    workflow.add_node("visualize", visualize_node)
    
    # Define edges
    workflow.set_entry_point("clean")
    workflow.add_edge("clean", "analyze")
    workflow.add_edge("analyze", "visualize")
    workflow.add_edge("visualize", END)
    
    return workflow.compile()


def clean_node(state: AnalysisState) -> AnalysisState:
    """Cleaning node wrapper."""
    state["status"] = "cleaning"
    result = clean_data(state)
    return result


def analyze_node(state: AnalysisState) -> AnalysisState:
    """Analysis node wrapper."""
    state["status"] = "analyzing"
    result = analyze_data(state)
    return result


def visualize_node(state: AnalysisState) -> AnalysisState:
    """Visualization node wrapper."""
    state["status"] = "visualizing"
    result = generate_visualizations(state)
    return result


def run_analysis_pipeline(df: pd.DataFrame) -> dict:
    """Run the full analysis pipeline on a DataFrame."""
    graph = create_analysis_graph()
    
    initial_state: AnalysisState = {
        "df": df,
        "cleaning_report": "",
        "cleaning_summary": "",
        "summary": "",
        "insights": [],
        "charts": [],
        "filters": [],
        "columns_meta": [],
        "stats_summary": {},
        "correlations": [],
        "trends": [],
        "category_info": {},
        "profile": {},
        "cleaned_data_sample": [],
        "error": "",
        "status": "started"
    }
    
    result = graph.invoke(initial_state)
    
    return {
        "row_count": result["profile"].get("total_rows", 0),
        "column_count": result["profile"].get("total_columns", 0),
        "columns": result["columns_meta"],
        "summary": result["summary"],
        "cleaning_report": result["cleaning_report"],
        "charts": result["charts"],
        "insights": result["insights"],
        "filters": result["filters"],
        "cleaned_data_sample": result["cleaned_data_sample"]
    }
