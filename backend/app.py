import sys
from pathlib import Path
import os
import glob # Added for NCM file search

# Ensure backend directory is in path for local imports
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # Added for static files
from fastapi.responses import FileResponse # Added for SPA routing
from services.gemini_service import gemini_service
from services.ncm_service import ncm_service
from models import InvoiceData
import uvicorn

app = FastAPI(title="Leitor de Invoice para PLI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("DEBUG: Registering NCM routes...")
    await ncm_service.init()

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/extract", response_model=InvoiceData)
async def extract_invoice(
    file: UploadFile = File(...),
    api_key: str = Form(...)
):
    if not api_key:
        raise HTTPException(status_code=400, detail="API Key is required")
    
    try:
        content = await file.read()
        filename = file.filename or "uploaded_file"
        mime_type = file.content_type or "application/pdf"
        
        result = await gemini_service.extract_invoice_data(
            content=content,
            mime_type=mime_type,
            filename=filename,
            api_key=api_key
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ncm/search")
async def search_ncm(term: str = ""):
    return ncm_service.search(term)

@app.get("/api/ncm/status")
async def get_ncm_status():
    """Get current status and metrics of the NCM service."""
    return ncm_service.get_metrics()

@app.get("/api/ncm/inspect")
async def inspect_ncm_data():
    """Get the raw NCM data loaded in memory."""
    data = ncm_service.get_raw_data()
    if not data:
        raise HTTPException(status_code=404, detail="NCM data not loaded or unavailable")
    return data

@app.get("/api/ncm/{code}")
async def get_ncm_details(code: str):
    result = ncm_service.get_description(code)
    if not result:
        raise HTTPException(status_code=404, detail="NCM not found")
    return {"code": code, "description": result}

@app.get("/api/ncm/{code}/hierarchy")
async def get_ncm_hierarchy(code: str):
    return ncm_service.get_hierarchy(code)

# --- Frontend Serving Logic ---

# 1. Determine paths
# If running frozen (PyInstaller), static files are in sys._MEIPASS/dist
# If running normally, static files are in ../dist relative to this file
if getattr(sys, 'frozen', False):
    base_dir = Path(sys._MEIPASS)
    static_dir = base_dir / "dist"
else:
    base_dir = Path(__file__).parent.parent
    static_dir = base_dir / "dist"

# 2. Dynamic env-config.js endpoint
@app.get("/env-config.js")
async def get_env_config():
    """Dynamically generate env-config.js based on server environment variables."""
    
    # 1. Find latest NCM file (similar to env.sh logic)
    ncm_filename = "ncm.json" # Default
    try:
        # Look for Tabela_NCM_Vigente_*.json in the static dir
        ncm_files = glob.glob(str(static_dir / "Tabela_NCM_Vigente_*.json"))
        if ncm_files:
            # Sort by name (which usually includes date) and take the last one (latest)
            ncm_files.sort(reverse=True)
            ncm_filename = os.path.basename(ncm_files[0])
    except Exception as e:
        print(f"Warning: Could not search for NCM files: {e}")

    # 2. Get Supabase config from OS environment
    supabase_url = os.environ.get("VITE_SUPABASE_URL", "")
    supabase_key = os.environ.get("VITE_SUPABASE_ANON_KEY", "")

    js_content = f"""window._env_ = {{
  NCM_FILENAME: "{ncm_filename}",
  VITE_SUPABASE_URL: "{supabase_url}",
  VITE_SUPABASE_ANON_KEY: "{supabase_key}",
}};"""
    
    return Response(content=js_content, media_type="application/javascript")

# 3. Mount Static Files
# Only if dist directory exists
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")

    # 4. Catch-all for SPA (return index.html for 404s on frontend routes)
    # Note: app.mount with html=True handles / correctly, but we need to handle sub-paths
    # that don't match API or static files.
    # However, StaticFiles with html=True handles index.html for directories.
    # For SPA client-side routing (e.g. /dashboard), we might need a fallback exception handler.
    # Or explicitly serve index.html for known SPA routes. 
    # Let's rely on 404 exception handler fallback.
    
    @app.exception_handler(404)
    async def custom_404_handler(request, exc):
        # If the request starts with /api, return real 404 JSON
        if request.url.path.startswith("/api"):
            return Response(content='{"detail": "Not Found"}', status_code=404, media_type="application/json")
        
        # Otherwise, serve index.html for SPA routing
        index_path = static_dir / "index.html"
        if index_path.exists():
             return FileResponse(index_path)
        return Response(content="Frontend not found", status_code=404)
else:
    print(f"WARNING: Static directory {static_dir} does not exist. Frontend will not be served.")


if __name__ == "__main__":
    # Use app object directly to avoid import errors in frozen (PyInstaller) mode
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=not getattr(sys, 'frozen', False))
