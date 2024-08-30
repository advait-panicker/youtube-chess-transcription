from utils import timestampit, ProgressTracker
import cv2
import numpy as np
from PIL import Image
from pytubefix import YouTube

@timestampit
def get_video_capture_by_path(path: str):
    video = cv2.VideoCapture(path,
        apiPreference=cv2.CAP_ANY, # or CAP_FFMPEG
        params=[
            cv2.CAP_PROP_HW_ACCELERATION, cv2.VIDEO_ACCELERATION_ANY,
        ]
    )
    video.set(cv2.CAP_PROP_BUFFERSIZE, 3)
    # Check if the video opened successfully
    if not video:
        print("Error opening video file")
        return None
    return video

@timestampit
def get_video_capture_by_url(url: str):
    yt = YouTube(url)
    stream = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').last()
    video = cv2.VideoCapture(stream.url)
    if not video:
        print("Error opening video file")
        return None
    return video

def get_frame_rate(video):
    return video.get(cv2.CAP_PROP_FPS)

def convert_grayscale(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    img = Image.fromarray(gray)
    img.convert('L')
    return np.asarray(img.convert("L"), dtype=np.float32)

@timestampit
def read_frames(video, skip=1, offset=0) -> list:
    frames = []
    success, frame = video.read()
    frame_count = 0
    video.set(cv2.CAP_PROP_POS_FRAMES, offset)
    while success:
        success, frame = video.read()
        frame_count += 1
        if not success:
            break
        print(f"Reading frames: {frame_count}", end='\r')
        if frame_count % skip == 0:
            frames.append(convert_grayscale(frame))
    video.release()
    return frames

# extends from ProgressTracker
class FrameIterator(ProgressTracker):
    def __init__(self, video, skip=1):
        super().__init__(video.get(cv2.CAP_PROP_FRAME_COUNT))
        self.video = video
        self.skip = skip
        self.frame_count = 0
        self.frame_rate = get_frame_rate(video)

    def __iter__(self):
        return self

    def __next__(self): # return skip-th frame
        for _ in range(self.skip):
            success, frame = self.video.read()
            if not success:
                raise StopIteration
        self.frame_count += self.skip
        self.current_item += self.skip
        return convert_grayscale(frame), self.frame_count