from video import get_video_capture_by_url, FrameIterator
from predict import get_predictions
from transcript import get_transcript
from moves import get_captioned_moves
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

task_status = {}

def extract_moves_from_url(url, skip=30):
    if url in task_status and task_status[url]["status"] == "completed":
        return task_status[url]["moves"]
    try:
        task_status[url] = {"status": "downloading video"}
        video = get_video_capture_by_url(url)
        task_status[url] = {"status": "getting transcript"}
        transcript = get_transcript(url)
        frame_iter = FrameIterator(video, skip)
        task_status[url] = {"status": "getting predictions", "progress_tracker": frame_iter}
        predictions = get_predictions(frame_iter)
        task_status[url] = {"status": "getting moves"}
        moves = get_captioned_moves(predictions, transcript)
        task_status[url] = {"status": "completed"}
    except Exception as e:
        task_status[url] = {"status": "error", "error": str(e)}
        raise e
    formatted_moves = [move.to_dict() for move in moves]
    task_status[url]["moves"] = formatted_moves
    return formatted_moves

# http://localhost:8000/moves/?url=http%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3DhI3jY1TtOAg
@app.get("/moves/")
def read_moves(url: str):
    try:
        print(url)
        moves = extract_moves_from_url(url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return moves

# get the status of a task
# http://localhost:8000/status/?url=http%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3DhI3jY1TtOAg
@app.get("/status/")
def read_status(url: str):
    if task_status.get(url) is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if task_status[url].get('progress_tracker') is not None:
        task_status[url]['progress'] = task_status[url]['progress_tracker'].get_progress()
        return {"status": task_status[url]["status"], "progress": task_status[url]["progress"]}
    return task_status[url]

@app.get("/")
def read_root():
    return {"Hello": "World"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)