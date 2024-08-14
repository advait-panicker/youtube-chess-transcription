class ProgressTracker:
    def __init__(self, total_items):
        self.total_items = total_items
        self.current_item = 0
    def get_progress(self):
        return self.current_item / self.total_items