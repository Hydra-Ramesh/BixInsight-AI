"""
BixInsight AI - Python Analysis Service
FastAPI server that receives CSV files, processes them through the AI pipeline,
and returns analysis results with charts and insights.
"""

import os
import io
import traceback
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from agents.graph import run_analysis_pipeline
from agents.chat_agent import answer_question
from utils.vector_store import get_vector_store, store_data_context
from data_transform import transform_data
from export_pptx import create_ppt

class ChatRequest(BaseModel):
    question: str
    context: dict
    chat_history: list = []

class TransformRequest(BaseModel):
    data: list
    operation: str
    column: str

class ExportRequest(BaseModel):
    analysis: dict

app = FastAPI(
    title="BixInsight AI Analysis Service",
    description="AI-powered business data analysis engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "BixInsight AI Analysis Engine",
        "version": "1.0.0"
    }

@app.post("/transform")
async def handle_transform(req: TransformRequest):
    import numpy as np
    try:
        df = pd.DataFrame(req.data)
        df_clean = transform_data(df, req.operation, req.column)
        
        columns_info = []
        for col in df_clean.columns:
            dtype = str(df_clean[col].dtype)
            null_count = int(df_clean[col].isna().sum())
            unique_count = int(df_clean[col].nunique())
            
            if pd.api.types.is_numeric_dtype(df_clean[col]):
                col_type = "numeric"
            elif pd.api.types.is_datetime64_any_dtype(df_clean[col]):
                col_type = "datetime"
            else:
                col_type = "categorical"
                
            sample = df_clean[col].dropna().head(3).tolist()

            columns_info.append({
                "name": col,
                "type": col_type,
                "dtype": dtype,
                "nullCount": null_count,
                "uniqueCount": unique_count,
                "sample": sample
            })

        df_clean = df_clean.replace([np.inf, -np.inf, np.nan], None)
        
        return {
            "status": "success",
            "columns": columns_info,
            "rowCount": len(df_clean),
            "columnCount": len(df_clean.columns),
            "sampleData": df_clean.head(100).to_dict(orient="records")
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import Response

@app.post("/export/pptx")
async def handle_export_pptx(req: ExportRequest):
    try:
        ppt_bytes = create_ppt(req.analysis)
        return Response(
            content=ppt_bytes,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={
                "Content-Disposition": f"attachment; filename=export.pptx"
            }
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PPTX Generation failed: {str(e)}")


@app.post("/analyze")
async def analyze_csv(file: UploadFile = File(...)):
    """
    Receive a CSV file, run the AI analysis pipeline, and return results.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        # Read CSV file
        contents = await file.read()
        
        # Try different encodings
        df = None
        for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
            try:
                df = pd.read_csv(io.BytesIO(contents), encoding=encoding)
                break
            except (UnicodeDecodeError, pd.errors.ParserError):
                continue
        
        if df is None:
            raise HTTPException(status_code=400, detail="Could not parse CSV file. Please verify the file format.")
        
        if len(df) == 0:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        if len(df.columns) < 2:
            raise HTTPException(status_code=400, detail="CSV file must have at least 2 columns")
        
        print(f"📊 Processing: {file.filename} ({len(df)} rows × {len(df.columns)} columns)")
        
        # Run the analysis pipeline
        result = run_analysis_pipeline(df)
        
        # Store context in vector DB
        try:
            _, collection = get_vector_store()
            context_docs = [
                f"Dataset: {file.filename}, {result['row_count']} rows, {result['column_count']} columns",
                f"Summary: {result['summary']}",
                f"Cleaning: {result['cleaning_report']}"
            ]
            store_data_context(collection, file.filename, context_docs)
        except Exception as e:
            print(f"Vector store warning: {e}")
        
        print(f"✅ Analysis complete: {len(result['charts'])} charts, {len(result['insights'])} insights")
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/chat")
async def chat_with_data(request: ChatRequest):
    """
    Answer a question about the user's data using RAG + LLM.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        # Try to get vector store for additional context
        vector_collection = None
        try:
            _, collection = get_vector_store()
            vector_collection = collection
        except Exception as e:
            print(f"Vector store warning: {e}")

        print(f"💬 Chat question: {request.question[:100]}")

        result = answer_question(
            question=request.question,
            context=request.context,
            chat_history=request.chat_history,
            vector_collection=vector_collection
        )

        print(f"✅ Chat answer generated ({len(result['answer'])} chars)")

        return result

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    print("\n🧠 BixInsight AI Analysis Service starting...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
