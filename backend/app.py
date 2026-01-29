from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

@app.get("/api/ncm/{code}")
async def get_ncm_details(code: str):
    result = ncm_service.get_description(code)
    if not result:
        raise HTTPException(status_code=404, detail="NCM not found")
    return {"code": code, "description": result}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
