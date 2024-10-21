from transformers import SeamlessM4Tv2Model, AutoProcessor
import torch  # اضافه کردن این خط

def initialize_model():
    processor = AutoProcessor.from_pretrained("facebook/seamless-m4t-v2-large", use_fast=False)
    model = SeamlessM4Tv2Model.from_pretrained("facebook/seamless-m4t-v2-large")

    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    model = model.to(device)

    return model, processor, device
