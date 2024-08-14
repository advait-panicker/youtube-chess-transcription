from tensorflow_chessbot import tensorflow_chessbot
from tensorflow_chessbot.chessboard_finder import findChessboardCorners, getChessTilesGray
from tensorflow_chessbot.helper_functions import shortenFEN
from utils import timestampit, peak_signal_to_noise_ratio
from video import FrameIterator
from filter import filter_for_steady_fen

@timestampit
def get_corners(frame_iter):
    predictor = tensorflow_chessbot.ChessboardPredictor()
    corners = None
    for frame, i in frame_iter:
        if corners is None:
            corners = findChessboardCorners(frame)
            if corners is not None:
                break
    predictor.close()
    return corners, i

@timestampit
def get_predictions(frame_iter: FrameIterator) -> list[tuple[str, float]]:
    predictor = tensorflow_chessbot.ChessboardPredictor()
    predictions = []
    corners = None
    prev_frame = None
    corners, skipped = get_corners(frame_iter)
    print(f"Found skipped {skipped} frames to find chessboard corners")
    for frame, frame_count in frame_iter:
        print(f"Predicting frame {frame_count}", end='\r')

        if peak_signal_to_noise_ratio(prev_frame, frame) >= 0:
            prev_frame = frame
            skipped += 1
            continue

        tiles = getChessTilesGray(frame, corners)
        fen, certainties = predictor.getPrediction(tiles)
        predictions.append((shortenFEN(fen), frame_count / frame_iter.frame_rate))

        prev_frame = frame

    print()
    print(f"Total frames: {frame_count}")
    print(f"Skipped frames: {skipped}")

    predictor.close()
    return filter_for_steady_fen(predictions)