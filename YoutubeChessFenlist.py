# -*- coding: utf-8 -*-
"""
Created on Fri Jul  1 12:50:38 2024

@author: Audrey Wang
"""

from pytube import YouTube
import cv2
from PIL import Image
from tensorflow_chessbot import ChessboardPredictor
import chessboard_finder
from helper_functions import shortenFEN

def YouTubeDownload(video_url, destination_folder):
    # Create a YouTube object
    yt = YouTube(video_url)
    video = yt.streams.filter(progressive=True, file_extension='mp4').first()
    video.download(output_path=destination_folder)
    return None

def find_chessboard(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
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

    fenlist = []
    currentfen = ''
    
    # Open the video file
    video = cv2.VideoCapture(video_path)

    # Check if the video opened successfully
    if not video.isOpened():
        print("Error opening video file")
        return
    
    # Initialize predictor, takes a while, but only needed once
    predictor = ChessboardPredictor()
                
    # Initialize frame count
    count = 0

    # Read frames until the video ends
    while True:
        # Read a frame
        success, frame = video.read()

        # If frame is read correctly, save it
        if success:
            chessboard, gray_chess = find_chessboard(frame)
            image = Image.fromarray(gray_chess)
            tiles, corners = chessboard_finder.findGrayscaleTilesInImage(image)
            if corners is not None:
                fen, tile_certainties = predictor.getPrediction(tiles)
                short_fen = shortenFEN(fen)
                fen = short_fen + ' w - - 0 1'
                if fen != currentfen:
                    fenlist.append(fen)
                    currentfen = fen
                    count += 1
                    print(count)
        else:
            # Break the loop if we've reached the end of the video
            break
    
    predictor.close()
        
    # Release the video capture object
    video.release()

    return(fenlist, count)

def main(video_path):
    fenlist, count = extract_fen(video_path)
    
    # Open a file in write mode
    with open(destination_folder + FileName + " fenlist.txt", "w") as file:
        # Write each item of the list to the file, one per line
        for fen in fenlist:
            file.write(f"{fen}\n")
    
if __name__ == '__main__':
    main(video_path)
    
    