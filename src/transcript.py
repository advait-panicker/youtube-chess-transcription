from pytubefix import extract
from youtube_transcript_api import YouTubeTranscriptApi
from utils import timestampit

@timestampit
def get_transcript(url: str) -> str:
    video_id = extract.video_id(url)
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    return transcript