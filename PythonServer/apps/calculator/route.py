from fastapi import APIRouter
import base64
from io import BytesIO
from apps.calculator.utils import analyze_image
from schema import ImageData
from PIL import Image

router = APIRouter()

@router.post('/calculate')  # Add the correct route path here
async def run(data: ImageData):
    # Decode base64 image data
    image_data = base64.b64decode(data.image.split(',')[1])
    image_bytes = BytesIO(image_data)
    
    # Open the image
    image = Image.open(image_bytes)
    
    # Analyze the image and get responses
    responses = analyze_image(image, dict_of_vars=data.dict_of_vars)
    
    # Prepare the response data
    data_response = []
    for response in responses:
        data_response.append(response)
    
    # Debugging: Log the response data
    print('Response in routes: ', data_response)
    
    return {
        "message": "Image Processed",
        "type": "success",
        "data": data_response
    }
