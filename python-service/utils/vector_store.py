import chromadb
from chromadb.config import Settings
import os
from dotenv import load_dotenv

load_dotenv()

CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")

def get_vector_store():
    """Create and return a ChromaDB client and collection for storing data context."""
    client = chromadb.Client(Settings(
        anonymized_telemetry=False,
        is_persistent=True,
        persist_directory=CHROMA_DB_PATH
    ))
    
    collection = client.get_or_create_collection(
        name="analysis_context",
        metadata={"hnsw:space": "cosine"}
    )
    
    return client, collection

def store_data_context(collection, analysis_id: str, documents: list[str], metadatas: list[dict] = None):
    """Store data context in vector store for retrieval."""
    ids = [f"{analysis_id}_{i}" for i in range(len(documents))]
    collection.add(
        documents=documents,
        ids=ids,
        metadatas=metadatas or [{"analysis_id": analysis_id}] * len(documents)
    )

def query_context(collection, query: str, n_results: int = 5):
    """Query the vector store for relevant context."""
    results = collection.query(
        query_texts=[query],
        n_results=n_results
    )
    return results
