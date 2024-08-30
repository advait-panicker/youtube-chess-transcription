from main import extract_moves_from_url
from video import get_video_capture_by_url, read_frames
import json

if __name__ == '__main__':
    url = 'http://youtube.com/watch?v=hI3jY1TtOAg'
    # video = get_video_capture_by_url(url)
    # read_frames(video, skip=6)
    moves = extract_moves_from_url(url)
    with open('output.json', 'w') as f:
        json.dump(moves, f, indent=4)