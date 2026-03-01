from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="HBC MCP Retrieval Server")

SPECS_DIR = Path(__file__).parent.parent.parent / "docs" / "specs"

class QueryRequest(BaseModel):
    query: str
    top_k: int = 3

def load_specs() -> List[Dict]:
    if not SPECS_DIR.exists():
        return []
    specs = []
    for md_file in SPECS_DIR.glob("*.md"):
        content = md_file.read_text(encoding="utf-8")
        specs.append({
            "filename": md_file.name,
            "path": str(md_file),
            "content": content,
            "title": content.split("\n")[0].replace("#", "").strip()
        })
    return specs

SPECS = load_specs()
VECTORIZER = TfidfVectorizer(stop_words="english")
if SPECS:
    CORPUS = [s["content"] for s in SPECS]
    TFIDF_MATRIX = VECTORIZER.fit_transform(CORPUS)

@app.get("/list_specs")
def list_specs() -> List[str]:
    return [s["filename"] for s in SPECS]

@app.post("/find_relevant_context")
def find_relevant_context(req: QueryRequest) -> List[Dict]:
    if not SPECS:
        raise HTTPException(status_code=404, detail="No specs found. Run docs/specs setup first.")
    
    query_vec = VECTORIZER.transform([req.query])
    sims = cosine_similarity(query_vec, TFIDF_MATRIX).flatten()
    top_indices = sims.argsort()[-req.top_k:][::-1]
    
    results = []
    for idx in top_indices:
        spec = SPECS[idx]
        snippet = spec["content"][:800] + "..." if len(spec["content"]) > 800 else spec["content"]
        results.append({
            "filename": spec["filename"],
            "relevance": float(sims[idx]),
            "snippet": snippet,
            "full_path": spec["path"]
        })
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)