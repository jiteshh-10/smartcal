from dotenv import load_dotenv
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from apps.calculator.route import router as calculator_router

# Load environment variables from the .env file
load_dotenv()

# Read environment variables
SERVER_URL = os.getenv("SERVER_URL", "127.0.0.1")
PORT = int(os.getenv("PORT", 8000))
ENV = os.getenv("ENV", "development")

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health():
    return {'message': 'Server is running'}


app.include_router(calculator_router, prefix='/calculator', tags=['calculator'])

if __name__ == '__main__':
    uvicorn.run(app, host=SERVER_URL, port=PORT)  # Removed the 'env' argument
