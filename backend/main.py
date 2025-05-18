
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
from fastapi.responses import StreamingResponse
import os
from dotenv import load_dotenv
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SymptomInput(BaseModel):
    text: str
@app.post("/analyze")
async def analyze_symptoms(input: SymptomInput):
    def stream():
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # or "gpt-4" if available
            messages=[
                {"role": "user", "content": f"User symptoms: {input.text}. What might be the problem?"}
            ],
            stream=True,
        )
        for chunk in response:
            content = chunk['choices'][0].get('delta', {}).get('content')
            if content:
                yield content

    return StreamingResponse(stream(), media_type="text/plain")