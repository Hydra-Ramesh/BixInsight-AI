"""
Data Cleaning Agent - Uses Pandas + Groq LLM to intelligently clean CSV data.
Handles: missing values, type conversion, outlier detection, deduplication.
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
        temperature=0.1,
        max_tokens=2048
    )


def clean_data(state: dict) -> dict:
    """
    Main cleaning function. Takes state with 'df' and returns cleaned df + report.
    """
    df = state["df"].copy()
    report_steps = []
    
    original_shape = df.shape
    report_steps.append(f"📊 Original data: {original_shape[0]} rows × {original_shape[1]} columns")
    
    # Step 1: Remove completely empty rows/columns
    empty_rows = df.isna().all(axis=1).sum()
    if empty_rows > 0:
        df = df.dropna(how='all')
        report_steps.append(f"🗑️ Removed {empty_rows} completely empty rows")
    
    empty_cols = df.columns[df.isna().all()]
    if len(empty_cols) > 0:
        df = df.drop(columns=empty_cols)
        report_steps.append(f"🗑️ Removed {len(empty_cols)} empty columns: {list(empty_cols)}")
    
    # Step 2: Remove duplicate rows
    dup_count = df.duplicated().sum()
    if dup_count > 0:
        df = df.drop_duplicates()
        report_steps.append(f"🔄 Removed {dup_count} duplicate rows")
    
    # Step 3: Clean column names
    original_cols = list(df.columns)
    df.columns = (df.columns
        .str.strip()
        .str.lower()
        .str.replace(r'[^\w\s]', '', regex=True)
        .str.replace(r'\s+', '_', regex=True))
    renamed = [(o, n) for o, n in zip(original_cols, df.columns) if o != n]
    if renamed:
        report_steps.append(f"✏️ Standardized {len(renamed)} column names")
    
    # Step 4: Intelligent type conversion
    for col in df.columns:
        # Try numeric conversion
        if df[col].dtype == 'object':
            # Remove currency symbols and commas for numeric detection
            cleaned = df[col].astype(str).str.replace(r'[$€£¥,]', '', regex=True).str.strip()
            try:
                numeric_vals = pd.to_numeric(cleaned, errors='coerce')
                non_null_orig = df[col].notna().sum()
                non_null_numeric = numeric_vals.notna().sum()
                if non_null_orig > 0 and non_null_numeric / non_null_orig > 0.7:
                    df[col] = numeric_vals
                    report_steps.append(f"🔢 Converted '{col}' to numeric")
                    continue
            except Exception:
                pass
            
            # Try datetime conversion
            try:
                date_vals = pd.to_datetime(df[col], errors='coerce')
                non_null_date = date_vals.notna().sum()
                if non_null_orig > 0 and non_null_date / non_null_orig > 0.7:
                    df[col] = date_vals
                    report_steps.append(f"📅 Converted '{col}' to datetime")
                    continue
            except Exception:
                pass
    
    # Step 5: Handle missing values
    for col in df.columns:
        null_count = df[col].isna().sum()
        if null_count == 0:
            continue
        
        null_pct = null_count / len(df) * 100
        
        if null_pct > 60:
            # Too many nulls - drop column
            df = df.drop(columns=[col])
            report_steps.append(f"🗑️ Dropped '{col}' ({null_pct:.0f}% missing)")
        elif pd.api.types.is_numeric_dtype(df[col]):
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            report_steps.append(f"📈 Filled {null_count} missing values in '{col}' with median ({median_val:.2f})")
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].fillna(method='ffill').fillna(method='bfill')
            report_steps.append(f"📅 Forward-filled {null_count} missing dates in '{col}'")
        else:
            mode_val = df[col].mode()
            if len(mode_val) > 0:
                df[col] = df[col].fillna(mode_val[0])
                report_steps.append(f"📝 Filled {null_count} missing values in '{col}' with mode")
    
    # Step 6: Outlier detection for numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        if IQR > 0:
            lower = Q1 - 3 * IQR
            upper = Q3 + 3 * IQR
            outliers = ((df[col] < lower) | (df[col] > upper)).sum()
            if outliers > 0:
                report_steps.append(f"⚠️ Detected {outliers} potential outliers in '{col}'")
    
    final_shape = df.shape
    report_steps.append(f"✅ Cleaned data: {final_shape[0]} rows × {final_shape[1]} columns")
    
    cleaning_report = "\n".join(report_steps)
    
    # Use LLM to generate a summary of the cleaning
    try:
        llm = get_llm()
        summary_prompt = f"""Based on this data cleaning report, generate a brief 2-3 sentence summary of what was done:

{cleaning_report}

Data went from {original_shape[0]}×{original_shape[1]} to {final_shape[0]}×{final_shape[1]}.
Column types: {dict(df.dtypes.astype(str).value_counts())}"""

        response = llm.invoke([
            SystemMessage(content="You are a data analyst. Summarize data cleaning results concisely."),
            HumanMessage(content=summary_prompt)
        ])
        cleaning_summary = response.content
    except Exception as e:
        cleaning_summary = cleaning_report
    
    state["df"] = df
    state["cleaning_report"] = cleaning_report
    state["cleaning_summary"] = cleaning_summary
    return state
