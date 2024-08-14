from utils import timestampit

@timestampit
def filter_for_steady_fen(predictions: list[tuple[str, int]]) -> list[tuple[str, float]]:
    filtered_predictions = []

    look_around_threshold = 3
    left = 0
    right = 0
    while right < len(predictions):
        while right < len(predictions) and predictions[right][0] == predictions[left][0]:
            right += 1
        if right - left >= look_around_threshold:
            filtered_predictions.append(predictions[right - 1])
        left = right

    return filtered_predictions

@timestampit
def filter_remove_consecutive_duplicates(predictions: list[tuple[str, int]]) -> list[tuple[str, float]]:
    filtered_predictions = [predictions[0]]

    for prediction in predictions[1:]:
        if prediction[0] != filtered_predictions[-1][0]:
            filtered_predictions.append(prediction)
    
    return filtered_predictions