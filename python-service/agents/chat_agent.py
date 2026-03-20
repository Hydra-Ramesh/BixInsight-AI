"""
Chat Agent - Answers user questions about their uploaded data using RAG + Groq LLM.
Uses analysis context (summary, columns, sample data) + ChromaDB vector store for context retrieval.
"""

import json
import os
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage


def get_llm():
    return ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model_name="llama-3.1-8b-instant",
        temperature=0.4,
        max_tokens=4096
    )


SYSTEM_PROMPT = """You are BixInsight AI, an expert business data analyst assistant.
You have access to a dataset that the user uploaded. Use the provided context to answer questions accurately.

Rules:
- Answer based ONLY on the data context provided. Do not make up data.
- If you cannot answer from the given context, say so clearly.
- Use specific numbers, column names, and data points when possible.
- Keep answers concise but thorough (2-5 sentences).
- Use markdown formatting for better readability.

INTERACTIVE CHARTS:
If the user explicitly asks you to generate a chart, plot, or visualization, you MUST include a JSON configuration block in your response.
Wrap the JSON exactly like this:
[[CHART_DATA: { "chartType": "bar", "xKey": "Category", "yKeys": ["Sales"], "data": [{"Category": "A", "Sales": 10}, {"Category": "B", "Sales": 20}] } ]]

Supported chartTypes: "bar", "line", "pie", "area", "scatter".
Ensure the "data" array contains aggregated/grouped data based on the sample data context. Do NOT try to plot thousands of rows, group them first in the JSON payload structure.
"""


def build_data_context(context: dict) -> str:
    """Build a rich context string from the analysis data."""
    parts = []

    if context.get("file_name"):
        parts.append(f"**Dataset**: {context['file_name']}")

    if context.get("summary"):
        parts.append(f"**Summary**: {context['summary']}")

    if context.get("columns"):
        col_info = []
        for col in context["columns"][:20]:
            col_str = f"  - {col['name']} (type: {col.get('dtype', 'unknown')}, " \
                      f"nulls: {col.get('nullCount', 0)}, " \
                      f"unique: {col.get('uniqueCount', 'N/A')})"
            if col.get("sample"):
                col_str += f" — sample: {col['sample'][:3]}"
            col_info.append(col_str)
        parts.append("**Columns**:\n" + "\n".join(col_info))

    if context.get("sample_data"):
        sample_str = json.dumps(context["sample_data"][:10], indent=2, default=str)
        # Truncate if too long
        if len(sample_str) > 3000:
            sample_str = sample_str[:3000] + "\n  ... (truncated)"
        parts.append(f"**Sample Data (first rows)**:\n```json\n{sample_str}\n```")

    if context.get("cleaning_report"):
        parts.append(f"**Cleaning Report**: {context['cleaning_report']}")

    if context.get("insights"):
        insight_strs = []
        for ins in context["insights"][:5]:
            insight_strs.append(f"  - [{ins.get('category', '')}] {ins.get('title', '')}: {ins.get('description', '')}")
        parts.append("**Key Insights**:\n" + "\n".join(insight_strs))

    if context.get("stats"):
        stats_str = json.dumps(context["stats"], indent=2, default=str)
        if len(stats_str) > 2000:
            stats_str = stats_str[:2000] + "\n  ... (truncated)"
        parts.append(f"**Statistics**:\n```json\n{stats_str}\n```")

    return "\n\n".join(parts)


def answer_question(question: str, context: dict, chat_history: list = None,
                    vector_collection=None) -> dict:
    """
    Answer a user question about their data.

    Args:
        question: The user's question
        context: Dict with keys: summary, columns, sample_data, cleaning_report, file_name, insights, stats
        chat_history: List of prior messages [{"role": "user"/"assistant", "content": "..."}]
        vector_collection: Optional ChromaDB collection for RAG context

    Returns:
        {"answer": str, "sources": list}
    """
    llm = get_llm()
    sources = []

    # Build data context
    data_context = build_data_context(context)

    # Query vector store for additional context if available
    vector_context = ""
    if vector_collection:
        try:
            results = vector_collection.query(
                query_texts=[question],
                n_results=3
            )
            if results and results.get("documents") and results["documents"][0]:
                vector_docs = results["documents"][0]
                vector_context = "\n**Additional Context from Knowledge Base**:\n" + \
                                 "\n".join(f"- {doc}" for doc in vector_docs)
                sources = vector_docs
        except Exception as e:
            print(f"Vector store query warning: {e}")

    # Build messages
    messages = [SystemMessage(content=SYSTEM_PROMPT)]

    # Add data context as a system-level injection
    messages.append(HumanMessage(content=f"Here is the dataset context for answering questions:\n\n{data_context}{vector_context}"))

    # Add chat history (last 10 messages to keep context manageable)
    if chat_history:
        for msg in chat_history[-10:]:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                from langchain_core.messages import AIMessage
                messages.append(AIMessage(content=msg["content"]))

    # Add the current question
    messages.append(HumanMessage(content=question))

    try:
        response = llm.invoke(messages)
        answer = response.content
    except Exception as e:
        print(f"Chat LLM error: {e}")
        answer = "I'm sorry, I encountered an error while processing your question. Please try again."

    return {
        "answer": answer,
        "sources": sources
    }
