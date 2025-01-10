from model_initializer import initialize_model  # Import model initialization function

# Initialize the model, processor, and device
model, processor, device = initialize_model()

# Function for Text-to-Text translation
def process_t2t(request):
    """
    Processes a Text-to-Text (T2T) translation request.
    
    Args:
        request: TextRequest containing inputText, srcLang, and tgtLang.
        
    Returns:
        A dictionary with the translated text.
    """
    # Preprocess input text using the processor
    text_inputs = processor(
        text=f"{request.inputText}", 
        src_lang=request.srcLang, 
        return_tensors="pt"
    ).to(device)
    
    # Generate translated tokens
    output_tokens = model.generate(
        **text_inputs, 
        tgt_lang=request.tgtLang, 
        generate_speech=False
    )
    
    # Decode the tokens into text
    translated_text = processor.decode(output_tokens[0].tolist()[0], skip_special_tokens=True)
    
    return {"processedText": translated_text}

# Function for Text-to-Speech translation
def process_t2s(request):
    """
    Processes a Text-to-Speech (T2S) translation request.
    
    Args:
        request: TextRequest containing inputText, srcLang, and tgtLang.
        
    Returns:
        A dictionary with the generated audio data and its sample rate.
    """
    # Preprocess input text using the processor
    text_inputs = processor(
        text=f"{request.inputText}", 
        src_lang=request.srcLang, 
        return_tensors="pt"
    ).to(device)
    
    # Generate audio from text
    audio_array = model.generate(
        **text_inputs, 
        tgt_lang=request.tgtLang
    )[0].cpu().numpy().squeeze()
    
    # Get the sample rate from the model configuration
    sample_rate = model.config.sampling_rate
    
    return {"audioData": audio_array.tolist(), "sample_rate": sample_rate}

# Function for Speech-to-Text translation
def process_s2t(request):
    """
    Processes a Speech-to-Text (S2T) translation request.
    
    Args:
        request: AudioRequest containing audioSample, sampleRate, srcLang, and tgtLang.
        
    Returns:
        A dictionary with the translated text.
    """
    # Preprocess input audio using the processor
    audio_inputs = processor(
        audios=request.audioSample, 
        sampling_rate=request.sampleRate, 
        return_tensors="pt"
    ).to(device)
    
    # Generate translated tokens from audio
    output_tokens = model.generate(
        **audio_inputs, 
        tgt_lang=request.tgtLang, 
        generate_speech=False
    )
    
    # Decode the tokens into text
    translated_text = processor.decode(output_tokens[0].tolist()[0], skip_special_tokens=True)
    
    return {"processedText": translated_text}

# Function for Speech-to-Speech translation
def process_s2s(request):
    """
    Processes a Speech-to-Speech (S2S) translation request.
    
    Args:
        request: AudioRequest containing audioSample, sampleRate, srcLang, and tgtLang.
        
    Returns:
        A dictionary with the generated audio data and its sample rate.
    """
    # Preprocess input audio using the processor
    audio_inputs = processor(
        audios=request.audioSample, 
        sampling_rate=request.sampleRate, 
        return_tensors="pt"
    ).to(device)
    
    # Generate translated audio from audio input
    audio_array = model.generate(
        **audio_inputs, 
        tgt_lang=request.tgtLang
    )[0].cpu().numpy().squeeze()
    
    # Get the sample rate from the model configuration
    sample_rate = model.config.sampling_rate
    
    return {"audioData": audio_array.tolist(), "sample_rate": sample_rate}
