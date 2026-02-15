from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from api import assist_dialogue, save_dialogue

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(assist_dialogue.router, prefix="/generate", tags=["Sentence, Word generate"])