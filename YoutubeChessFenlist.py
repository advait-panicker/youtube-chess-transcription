# -*- coding: utf-8 -*-
"""
Created on Fri Jul  1 12:50:38 2024

@author: Audrey Wang
"""

from pytube import YouTube
import cv2
from PIL import Image
from tensorflow_chessbot import tensorflow_chessbot
from tensorflow_chessbot import chessboard_finder
from tensorflow_chessbot.helper_functions import shortenFEN
import argparse


def download_video(video_url, destination_folder):
    # Create a YouTube object
    yt = YouTube(video_url)
    video = yt.streams.filter(progressive=True, file_extension='mp4').first()
    video.download(output_path=destination_folder)
    return None

def find_chessboard(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    chessboard = image
    gray_chess = gray
    
    # Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Sort contours by area, descending
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    chessboard_contour = None
    for contour in contours:
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
        
        # If contour has 4 vertices, it might be the chessboard
        if len(approx) == 4:
            chessboard_contour = approx
            break
    
    if chessboard_contour is not None:
        # Get bounding rectangle
        x, y, w, h = cv2.boundingRect(chessboard_contour)
        
        # Extract chessboard region
        chessboard = image[y:y+h, x:x+w]
        
        # Convert to grayscale
        gray_chess = cv2.cvtColor(chessboard, cv2.COLOR_BGR2GRAY)
        
    return chessboard, gray_chess

def extract_fen(video_path):

    
    # Open the video file
    video = cv2.VideoCapture(video_path)

    # Check if the video opened successfully
    if not video.isOpened():
        print("Error opening video file")
        return
    
    print("initializing predictor")
    # Initialize predictor, takes a while, but only needed once
    predictor = tensorflow_chessbot.ChessboardPredictor()
    print("predictor initialized")
                
    # Initialize frame count
    count = 0
    fenlist = [""]

    # store the fens of the nearby frames
    look_around_threshold = 4
    look_around_frames = [""] * (look_around_threshold * 2 + 1)

    
    frames_read = 0

    print("Reading frames for fen strings:")
    # Read frames until the video ends
    reached_end = False
    while not reached_end:
        # read every x fens
        for i in range(look_around_threshold * 2 + 1):
                
            # Read a frame
            success, frame = video.read()

            # If frame is read correctly, save it
            if success:
                chessboard, gray_chess = find_chessboard(frame)
                image = Image.fromarray(gray_chess)
                tiles, corners = chessboard_finder.findGrayscaleTilesInImage(image)
                if corners is not None:
                    # we are now reading a frame for a fen
                    fen, tile_certainties = predictor.getPrediction(tiles)
                    short_fen = shortenFEN(fen)
                    fen = short_fen + ' w - - 0 1'
                    look_around_frames[i] = fen
                else:
                    # we have not read a fen yet. go to the next frame
                    i -= 1
            else:
                # Break the loop if we've reached the end of the video
                reached_end = True
                break
        
        if (not reached_end):
            # after reading x frames, let's check if they are equal to each other
            if all(map(lambda s: s == look_around_frames[0], look_around_frames)):
                if (look_around_frames[0] != fenlist[-1]):
                    fenlist.append(look_around_frames[0])
                    count += 1
                    print(look_around_frames[0])
        
    predictor.close()
        
    # Release the video capture object
    video.release()

    return(fenlist, count)

def run_extracter(video_path, output_name):
    fenlist, count = extract_fen(video_path)
    
    destination_folder = "./"
    # Open a file in write mode
    with open(destination_folder + output_name + " fenlist.txt", "w") as file:
        # Write each item of the list to the file, one per line
        for fen in fenlist:
            file.write(f"{fen}\n")
    
def main():
    parser = argparse.ArgumentParser(description="Download and extract YouTube videos.")
    
    subparsers = parser.add_subparsers(dest="command")
    
    # Subparser for download command
    parser_download = subparsers.add_parser("download", help="Download YouTube video")
    parser_download.add_argument("youtube_url", type=str, help="URL of the YouTube video")
    parser_download.add_argument("name", type=str, help="Name to save the downloaded video")
    
    # Subparser for extract command
    parser_extract = subparsers.add_parser("extract", help="Extract fens from video file")
    parser_extract.add_argument("video_path", type=str, help="Path to the video file")
    parser_extract.add_argument("output_name", type=str, help="Name to save the extracted fens")
    
    args = parser.parse_args()
    
    if args.command == "download":
        download_video(args.youtube_url, args.name)
    elif args.command == "extract":
        run_extracter(args.video_path, args.output_name)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
