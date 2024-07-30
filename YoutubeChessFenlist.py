# -*- coding: utf-8 -*-
"""
Created on Fri Jul  1 12:50:38 2024

@author: Audrey Wang
"""

import yt_dlp
import re
import os
import cv2
from PIL import Image
from tensorflow_chessbot import tensorflow_chessbot
from tensorflow_chessbot import chessboard_finder
from tensorflow_chessbot.helper_functions import shortenFEN
import chess
import argparse


def get_direct_video_url(youtube_url):
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]/best[ext=mp4]/worst[ext=mp4]'
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(youtube_url, download=False)
        
        # Try to find the video URL in the formats
        if 'formats' in info_dict:
            for fmt in info_dict['formats']:
                if fmt.get('url'):
                    return fmt['url']
        
        raise KeyError("No URL found in the provided video information.")


def download_video(youtube_url, download_folder):
    os.makedirs(download_folder, exist_ok=True)
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]/best[ext=mp4]/worst[ext=mp4]',
        'outtmpl': os.path.join(download_folder, '%(title)s.%(ext)s')
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])


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


def get_frame_rate(cap: cv2.VideoCapture):
    if not cap.isOpened():
        print(f"Error: Cannot open video file {cap}")
        return None
    frame_rate = cap.get(cv2.CAP_PROP_FPS)
    return frame_rate


def extract_fen_from_frame(predictor, frame):
    success = False
    fen = ""
    chessboard, gray_chess = find_chessboard(frame)
    image = Image.fromarray(gray_chess)
    tiles, corners = chessboard_finder.findGrayscaleTilesInImage(image)

    if corners is not None:
        # we are now reading a frame for a fen
        success = True
        fen, tile_certainties = predictor.getPrediction(tiles)
        short_fen = shortenFEN(fen)
        fen = short_fen + ' w - - 0 1'

    return success, fen

class BoardNode:
    def __init__(self, fen, time=0):
        self.board = chess.Board(' '.join(fen.split()[:-1]))
        self.fen = fen
        self.prev = None
        self.next = []
        self.time = time
    def insert_next(self, board_node):
        # insert into self.next by time using binary search
        left = 0
        right = len(self.next)-1
        while left < right:
            mid = (left + right) // 2
            if self.next[mid].time < board_node.time:
                left = mid + 1
            else:
                right = mid - 1
        if self.next[left].time < board_node.time:
            self.next.insert(left+1, board_node)
        else:
            self.next.insert(left, board_node)

def get_move(board1 : chess.Board, fen2 : str):
    # print("Starting: ", board1.fen())
    board1.set_castling_fen('KQkq')
    for _ in range(2):
        for move in board1.legal_moves:
            board1.push(move)
            # print(" --- ", board1.fen())
            if board1.fen().split(' ')[0] == fen2.split(' ')[0]:
                board1.pop()
                return move.uci()
            board1.pop()
        board1.turn = not board1.turn
    return ''

def filter_FENs(fens : list[str]):
    boards = [chess.Board(' '.join(fen.split()[:-1])) for fen in fens]
    indices = [0]
    out = [fens[0]]
    for i in range(1, len(fens)):
        print(f"Filtering FENs: {i+1}/{len(fens)}", end='\r')
        for j in range(len(out)-1, -1, -1):
            if get_move(boards[indices[j]], fens[i]) != '':
                out.append(fens[i])
                indices.append(i)
                break
    return out

def get_fen_tree(fens : list[str]) -> BoardNode:
    head = BoardNode(fens[0])
    curr = head
    for fen in fens[1:]:
        while curr is not None:
            next_node = curr
            if get_move(curr.board, fen) != '':
                new_node = BoardNode(fen)
                new_node.prev = curr
                curr.insert_next(new_node)
                next_node = new_node
                break
            curr = next_node
    return head

def get_fen_list(node : BoardNode) -> list[str]:
    out = [node.fen]
    for next_node in node.next:
        out += get_fen_list(next_node)
    return out

def extract_fens_from_video(video):
    
    # Open the video file
    frame_rate = get_frame_rate(video)

    # Check if the video opened successfully
    if not video.isOpened():
        print("Error opening video file")
        return
    
    print("initializing predictor")
    # Initialize predictor, takes a while, but only needed once
    predictor = tensorflow_chessbot.ChessboardPredictor()
    print("predictor initialized")

    # Initialize frame count
    frame_count = 0
    fenlist = [""]
    output_list = [""]

    # store the fens of the nearby frames
    look_around_threshold = 3
    look_around_frames = [""] * (look_around_threshold * 2 + 1)

    print("Reading frames for fen strings:")
    # Read frames until the video ends
    reached_end = False
    while not reached_end:
        # read every x fens
        for i in range(look_around_threshold * 2 + 1):
            # Read a frame
            success, frame = video.read()

            if not success:
                # Break the loop if we've reached the end of the video
                print("reached the end of the video!!")
                reached_end = True
                break

            # otherwise read the frame
            frame_count += 1
            recieved_fen_success, fen_string = extract_fen_from_frame(predictor, frame)
            if (recieved_fen_success):
                look_around_frames[i] = fen_string
            else:
                i -= 1
        
        if (not reached_end):
            # after reading x frames, let's check if they are equal to each other
            if all(map(lambda s: s == look_around_frames[0], look_around_frames)):
                if (look_around_frames[0] != fenlist[-1]):
                    output_string = look_around_frames[0] + " " + str(frame_count / frame_rate)
                    output_list.append(output_string)
                    fenlist.append(look_around_frames[0])
                    print(output_string)

    # release objects
    predictor.close()
    video.release()

    return output_list


def run_extracter(video_capture, output_name):
    fenlist = extract_fens_from_video(video_capture)
    destination_folder = "./"
    # Open a file in write mode
    with open(destination_folder + output_name + " fenlist.txt", "w") as file:
        # Write each item of the list to the file, one per line
        for fen in fenlist:
            file.write(f"{fen}\n")


def is_valid_url(url):
    regex = re.compile(r'^(?:http|ftp)s?://', re.IGNORECASE)
    return re.match(regex, url) is not None
    

def main():
    parser = argparse.ArgumentParser(description="Download and extract YouTube videos.")
    
    subparsers = parser.add_subparsers(dest="command")
    
    # Subparser for download command
    parser_download = subparsers.add_parser("download", help="Download YouTube video")
    parser_download.add_argument("youtube_url", type=str, help="URL of the YouTube video")
    parser_download.add_argument("name", type=str, help="Name to save the downloaded video")
    
    # Subparser for extract command
    parser_extract = subparsers.add_parser("extract", help="Extract fens from video (can either provide URL or File Path)")
    parser_extract.add_argument("video_path", type=str, help="Path to the video (URL or File Path)")
    parser_extract.add_argument("output_name", type=str, help="Name to save the extracted fens")

    parser_extract = subparsers.add_parser("filter", help="Filter frames to include valid FENs")
    parser_extract.add_argument("fenlist", type=str, help="Path to the fenlist file")
    parser_extract.add_argument("output_path", type=str, help="Path to the output file")

    args = parser.parse_args()
    
    if args.command == "download":
        print("Downloading video")
        download_video(args.youtube_url, args.name)
    elif args.command == "extract":
        video = args.video_path
        if (is_valid_url(args.video_path)):
            print(str(args.video_path) + " is a valid URL")
            video = get_direct_video_url(args.video_path)

        video_cap = cv2.VideoCapture(video)        
        run_extracter(video_cap, args.output_name)
    elif args.command == "filter":
        if args.fenlist is None or args.output_path is None:
            parser.print_help()
            return
        if args.fenlist == args.output_path:
            print("Input and output files cannot be the same")
            return
        with open(args.fenlist, "r") as file:
            fens = file.readlines()
            fens = [fen.strip() for fen in fens]
            fen_tree = filter_FENs(fens)
        with open(args.output_path, "w") as file:
            for fen in filtered_fens:
                file.write(f"{fen}\n")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
