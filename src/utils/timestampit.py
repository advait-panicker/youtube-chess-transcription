import time

def timestampit(f):
    def wrap(*args, **kwargs):
        start = time.time()
        out = f(*args, **kwargs)
        print(f"{f.__name__} : {time.time() - start}")
        return out
    return wrap