from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from score_ia import calculate_score

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScoreRequest(BaseModel):
    cv_text: str
    job_text: str

@app.post("/score")
def get_score(data: ScoreRequest):
    score = calculate_score(data.cv_text, data.job_text)
    return {"score": score}
