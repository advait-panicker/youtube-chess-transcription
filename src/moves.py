from utils import timestampit
import chess

class CaptionedMove:
    def __init__(self, timestamp: float, move: str, prev: str, next: str):
        self.timestamp = timestamp
        self.move = move
        self.prev = prev
        self.next = next
        self.captions = []
    def __hash__(self):
        return hash(self.move)
    def add_caption(self, caption: str):
        self.captions.append(caption)
    def get_caption(self):
        return ' '.join(self.captions)
    def to_dict(self):
        return {
            'timestamp': self.timestamp,
            'move': self.move,
            'prev': self.prev,
            'next': self.next,
            'caption': self.get_caption()
        }
    def __str__(self):
        return f"{self.timestamp},{self.move},{self.prev},{self.next},{self.get_caption().replace(',', '')}"

class FENNode:
    def __init__(self, fen: str):
        self.fen = fen
        self.board = chess.Board(fen + ' w - - 0 1')
        self.possible_moves = {}
        self.moves = {}
        self.get_possible_moves()

    def insert_next(self, move: CaptionedMove, next_node: 'FENNode'):
        self.moves[move] = next_node

    def get_possible_moves(self) -> dict[str, str]:
        self.board.set_castling_fen('KQkq')
        self.possible_moves = {}
        for _ in range(2):
            for move in self.board.legal_moves:
                move_san = self.board.san(move)
                self.board.push(move)
                self.possible_moves[move_san] = self.board.fen().split(' ')[0]
                self.board.pop()
            self.board.turn = not self.board.turn
        return self.possible_moves
    
    def to_dict(self):
        seen = set()
        def helper(node, prev_move=None):
            if prev_move in seen:
                return None
            seen.add(prev_move)
            return {
                'fen': node.fen,
                'timestamp': prev_move.timestamp if prev_move is not None else -1,
                'captions': prev_move.get_caption() if prev_move is not None else '',
                'moves': {move.move: helper(next_node, move) for move, next_node in node.moves.items()}
            }
        return helper(self)
    
    def size(self):
        seen = set()
        def helper(node, prev_move=None):
            if prev_move in seen:
                return 0
            seen.add(prev_move)
            return 1 + sum([helper(next_node, move) for move, next_node in node.moves.items()])
        return helper(self)

@timestampit
def get_nodes(predictions: list[tuple[str, int]]) -> list[FENNode]:
    nodes = {}
    for fen, timestamp in predictions:
        if fen not in nodes:
            nodes[fen] = FENNode(fen)
        nodes[fen].timestamps.append(timestamp)
    return list(nodes.values())

@timestampit
def get_moves(predictions : list[str]) -> tuple[list[CaptionedMove], list[FENNode]]:
    fen_to_prev_node = {}
    seen = {}
    moves = []
    for fen, timestamp in predictions:
        if fen not in seen:
            seen[fen] = FENNode(fen)
        node = seen[fen]
        for move_san, next_fen in node.possible_moves.items():
            fen_to_prev_node[next_fen] = (node, move_san)
        if fen not in fen_to_prev_node:
            continue
        prev_node, move_san = fen_to_prev_node[fen]
        captioned_move = CaptionedMove(timestamp, move_san, prev_node.fen, node.fen)
        prev_node.insert_next(captioned_move, node)
        moves.append(captioned_move)
    return moves

@timestampit
def caption_moves(moves: list[CaptionedMove], transcript: list[dict]):
    move_idx = 0
    cap_idx = 0
    while move_idx < len(moves):
        while cap_idx < len(transcript) and transcript[cap_idx]['start'] < moves[move_idx].timestamp:
            moves[move_idx].add_caption(transcript[cap_idx]['text'])
            cap_idx += 1
        move_idx += 1

@timestampit
def get_captioned_moves(predictions, transcript):
    moves = get_moves(predictions)
    caption_moves(moves, transcript)
    return moves