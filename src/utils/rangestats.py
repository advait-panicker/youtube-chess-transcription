import numpy as np

class RangeStats:
    def __init__(self):
        self.values = []
        self.min = float('inf')
        self.max = float('-inf')
        self.sum = 0
        self.count = 0
    def add(self, x):
        if x is None:
            return
        self.min = min(self.min, x)
        self.max = max(self.max, x)
        self.sum += x
        self.count += 1
        self.values.append(x)
    def print(self, name):
        std_dev = np.std(self.values)
        print(f"{name}: count={self.count}, min={self.min}, max={self.max}, mean={self.sum/self.count}, std_dev={std_dev}")