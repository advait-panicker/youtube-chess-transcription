import os
import argparse
import yt_dlp
import cv2

def get_direct_video_url(youtube_url):
    ydl_opts = {
        'format': 'best'
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(youtube_url, download=False)
        video_url = info_dict['url']
    return video_url

def stream_frames_from_url(video_url):
    cap = cv2.VideoCapture(video_url)
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Process the frame (for example, display it)
        cv2.imshow('Frame', frame)

        # Press Q on keyboard to exit
        if cv2.waitKey(25) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

def download_video(youtube_url, download_folder):
    os.makedirs(download_folder, exist_ok=True)
    ydl_opts = {
        'format': 'best',
        'outtmpl': os.path.join(download_folder, '%(title)s.%(ext)s')
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])

def main():
    parser = argparse.ArgumentParser(description='Stream or download YouTube video.')
    parser.add_argument('url', type=str, help='YouTube video URL')
    parser.add_argument('--download', action='store_true', help='Download the video instead of streaming')
    args = parser.parse_args()

    if args.download:
        download_folder = 'Downloaded Videos'
        download_video(args.url, download_folder)
        print(f"Video downloaded to {download_folder}")
    else:
        direct_video_url = get_direct_video_url(args.url)
        stream_frames_from_url(direct_video_url)

if __name__ == "__main__":
    main()
