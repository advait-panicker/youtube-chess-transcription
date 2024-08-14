from .rangestats import RangeStats
import numpy as np

class DiffManager:
    def __init__(self, f):
        self.f = f
        self.dup = RangeStats()
        self.non_dup = RangeStats()
    def add(self, fen1, fen2, frame1, frame2):
        if fen1 == fen2:
            self.dup.add(self.f(frame1, frame2))
        else:
            self.non_dup.add(self.f(frame1, frame2))
    def print(self):
        self.dup.print(f"{self.f.__name__} || Duplicated frames")
        self.non_dup.print(f"{self.f.__name__} || Non-Duplicated frames")

def mean_squared_error(img1, img2):
    if img1 is None or img2 is None:
        return
    return np.mean((img1 - img2) ** 2)

def norm_based_difference(image1, image2):
    if image1 is None or image2 is None:
        return
    return np.linalg.norm(image1 - image2)

def peak_signal_to_noise_ratio(image1, image2):
    if image1 is None or image2 is None:
        return 0
    mse = np.mean((image1 - image2) ** 2)
    if mse == 0:
        return float('inf')
    max_pixel = 1.0  # Assuming image pixel values are in the range [0, 1]
    psnr = 20 * np.log10(max_pixel / np.sqrt(mse))
    return psnr