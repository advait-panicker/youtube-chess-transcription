import cv2
import numpy as np
import argparse

def detect_chessboard(image, debug=False):
    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    if debug:
        cv2.imshow('Grayscale Image', gray)
        cv2.waitKey(0)

    # Use GaussianBlur to reduce noise and improve edge detection
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    if debug:
        cv2.imshow('Blurred Image', blurred)
        cv2.waitKey(0)

    # Detect edges using Canny
    edges = cv2.Canny(blurred, 50, 150)
    
    if debug:
        cv2.imshow('Edges', edges)
        cv2.waitKey(0)

    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    if debug:
        contour_image = image.copy()
        cv2.drawContours(contour_image, contours, -1, (0, 255, 0), 2)
        cv2.imshow('Contours', contour_image)
        cv2.waitKey(0)

    # Iterate through contours and find the bounding box of the largest one
    max_area = 0
    best_bbox = None
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = w * h
        if area > max_area:
            max_area = area
            best_bbox = (x, y, x + w, y + h)

    return best_bbox

def extract_chessboard(image, chessboard_coords):
    # Check if chessboard_coords is valid
    if chessboard_coords is None:
        print("Chessboard not detected")
        return None

    # Chessboard coordinates (top-left x, top-left y, bottom-right x, bottom-right y)
    x1, y1, x2, y2 = chessboard_coords

    # Crop the chessboard from the image
    chessboard = image[y1:y2, x1:x2]

    return chessboard

def main(image_path, debug=True):
    image = cv2.imread(image_path)
    
    if image is None:
        print("Error: Unable to load image")
        return
    
    chessboard_coords = detect_chessboard(image, debug)
    
    if chessboard_coords is not None:
        chessboard_image = extract_chessboard(image, chessboard_coords)
        if chessboard_image is not None:
            cv2.imshow('Chessboard', chessboard_image)
            cv2.waitKey(0)
            cv2.destroyAllWindows()
            cv2.imwrite('chessboard.jpg', chessboard_image)
        else:
            print("Failed to extract chessboard")
    else:
        print("Chessboard not detected")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract chessboard from image")
    parser.add_argument("image_path", help="Path to the input image")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    args = parser.parse_args()

    main(image_path=args.image_path, debug=args.debug)
