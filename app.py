from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from model_initializer import initialize_model
from pydantic import BaseModel
import torch

# Initialize the model
model, processor, device = initialize_model()

# Create FastAPI app
app = FastAPI()

# Allow CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Mount static directory for serving HTML files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve the index.html file on the root URL
@app.get("/")
async def read_index():
    return FileResponse('static/index.html')

# Create request body models for FastAPI
class TextRequest(BaseModel):
    inputText: str
    srcLang: str
    tgtLang: str

class AudioRequest(BaseModel):
    audioSample: list
    sampleRate: int
    srcLang: str
    tgtLang: str

@app.post("/t2t")
async def t2t_translate(request: TextRequest):
    input_text = request.inputText
    src_lang = request.srcLang
    tgt_lang = request.tgtLang
    print(f"t2t input_text: {input_text}, srcLang: {src_lang}, tgtLang: {tgt_lang}")
    
    # Process input
    text_inputs = processor(text=f"{input_text}", src_lang=src_lang, return_tensors="pt").to(device)
    
    # Generate translation
    output_tokens = model.generate(**text_inputs, tgt_lang=tgt_lang, generate_speech=False)
    translated_text_from_text = processor.decode(output_tokens[0].tolist()[0], skip_special_tokens=True)
    
    return {"processedText": translated_text_from_text}

@app.post("/t2s")
async def t2s_translate(request: TextRequest):
    input_text = request.inputText
    src_lang = request.srcLang
    tgt_lang = request.tgtLang
    print(f"t2s input_text: {input_text}, srcLang: {src_lang}, tgtLang: {tgt_lang}")
    
    # Process input
    text_inputs = processor(text=f"{input_text}", src_lang=src_lang, return_tensors="pt").to(device)
    
    # Generate translation audio
    audio_array_from_text = model.generate(**text_inputs, tgt_lang=tgt_lang)[0].cpu().numpy().squeeze()
    sample_rate = model.config.sampling_rate
    print(f"sample_rate: {sample_rate}")
    
    return {"audioData": audio_array_from_text.tolist(), "sample_rate": sample_rate}

@app.post("/s2t")
async def s2t_translate(request: AudioRequest):
    audio_sample = request.audioSample
    sample_rate = request.sampleRate
    src_lang = request.srcLang
    tgt_lang = request.tgtLang
    print(f"s2t sample_rate: {sample_rate}, srcLang: {src_lang}, tgtLang: {tgt_lang}")
    
    audio_inputs = processor(audios=audio_sample, sampling_rate=sample_rate, return_tensors="pt").to(device)
    output_tokens = model.generate(**audio_inputs, tgt_lang=tgt_lang, generate_speech=False)
    translated_text_from_audio = processor.decode(output_tokens[0].tolist()[0], skip_special_tokens=True)
    
    return {"processedText": translated_text_from_audio}

@app.post("/s2s")
async def s2s_translate(request: AudioRequest):
    audio_sample = request.audioSample
    sample_rate = request.sampleRate
    src_lang = request.srcLang
    tgt_lang = request.tgtLang
    print(f"s2s sample_rate: {sample_rate}, srcLang: {src_lang}, tgtLang: {tgt_lang}")
    
    audio_inputs = processor(audios=audio_sample, sampling_rate=sample_rate, return_tensors="pt").to(device)
    audio_array_from_audio = model.generate(**audio_inputs, tgt_lang=tgt_lang)[0].cpu().numpy().squeeze()
    sample_rate = model.config.sampling_rate
    print(f"sample_rate: {sample_rate}")
    
    return {"audioData": audio_array_from_audio.tolist(), "sample_rate": sample_rate}

# Run FastAPI on port 10006
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10006)
