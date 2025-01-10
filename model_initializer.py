from transformers import SeamlessM4Tv2Model, AutoProcessor
import torch  # Import PyTorch for device management

def initialize_model():
    """
    Initializes the SeamlessM4T model and processor.

    Returns:
        model: The SeamlessM4Tv2Model loaded and moved to the appropriate device.
        processor: The AutoProcessor used for pre- and post-processing data.
        device: The device on which the model is loaded (CPU or CUDA).
    """
    # Load the processor for handling input and output data
    processor = AutoProcessor.from_pretrained("facebook/seamless-m4t-v2-large", use_fast=False)

    # Load the SeamlessM4T model for translation tasks
    model = SeamlessM4Tv2Model.from_pretrained("facebook/seamless-m4t-v2-large")

    # Determine the device to use: GPU if available, otherwise CPU
    device = "cuda:0" if torch.cuda.is_available() else "cpu"

    # Move the model to the selected device
    model = model.to(device)

    # Return the initialized model, processor, and device
    return model, processor, device
