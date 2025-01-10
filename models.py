from pydantic import BaseModel

# Model for handling text-based translation requests
class TextRequest(BaseModel):
    inputText: str  # The text to be translated
    srcLang: str  # Source language code (e.g., "eng" for English)
    tgtLang: str  # Target language code (e.g., "deu" for German)

# Model for handling audio-based translation requests
class AudioRequest(BaseModel):
    audioSample: list  # The audio data as a list of floats
    sampleRate: int  # Sampling rate of the audio data (e.g., 16000 Hz)
    srcLang: str  # Source language code
    tgtLang: str  # Target language code
