from fastapi import APIRouter
from models import TextRequest, AudioRequest  # Import request models
from services import process_t2t, process_t2s, process_s2t, process_s2s  # Import processing functions
from fastapi.responses import FileResponse  # Import response class for serving static files

# Create a new APIRouter instance
router = APIRouter()

# Serve the main HTML file for the root URL ("/")
@router.get("/")
async def read_index():
    # Return the 'index.html' file from the 'static' directory
    return FileResponse('static/index.html')

# Endpoint for Text-to-Text translation
@router.post("/t2t")
async def t2t_translate(request: TextRequest):
    # Process the request using the corresponding service function
    return process_t2t(request)

# Endpoint for Text-to-Speech translation
@router.post("/t2s")
async def t2s_translate(request: TextRequest):
    # Process the request using the corresponding service function
    return process_t2s(request)

# Endpoint for Speech-to-Text translation
@router.post("/s2t")
async def s2t_translate(request: AudioRequest):
    # Process the request using the corresponding service function
    return process_s2t(request)

# Endpoint for Speech-to-Speech translation
@router.post("/s2s")
async def s2s_translate(request: AudioRequest):
    # Process the request using the corresponding service function
    return process_s2s(request)
