// Read in text file on pressing submit button with id "submit"
let FENLines = [];
const fenIdxDisplay = document.getElementById("fenIdx");
let currentFENLineIdx = 0;

const fenDisplay = document.getElementById("currFenStr");
const errorDisplay = document.getElementById("strErrMsg");

function updateDisplay(str) {
    const err = isValidFEN(str);
    if (err != "") {
        errorDisplay.innerText = err;
        fenDisplay.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
        return;
    }
    errorDisplay.innerText = "";
    fenDisplay.style.backgroundColor = "white";
    fenDisplay.value = str;
    FENLines[currentFENLineIdx] = str;
    displayBoard(str);
}

// event listener for number input change
document.getElementById("fenIdxInput").addEventListener("change", function() {
    FENLineIdx = parseInt(this.value);
    if (isNaN(FENLineIdx) || FENLineIdx <= 0 || FENLineIdx > FENLines.length) {
        return;
    }
    currentFENLineIdx = FENLineIdx;
    fenIdxDisplay.innerText = currentFENLineIdx;
    updateDisplay(FENLines[currentFENLineIdx]);
});

document.getElementById("submit").addEventListener("click", function() {
    var file = document.getElementById("fileInput").files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        var text = reader.result;
        FENLines = text.split("\n");
        currentFENLineIdx = 0;
        fenIdxDisplay.innerText = "1";
        document.getElementById("fenIdxMax").innerText = FENLines.length;
        updateDisplay(FENLines[currentFENLineIdx]);
    }
    reader.readAsText(file);
});

const TILESIZE = 60;

const pieceImageNames = ['wp', 'wr', 'wn', 'wb', 'wq', 'wk', 'bp', 'br', 'bn', 'bb', 'bq', 'bk'];

let pieceImages = {};

function setup() {
    createCanvas(TILESIZE*8,TILESIZE*8);
    for (let i = 0; i < pieceImageNames.length; i++) {
        let piece = pieceImageNames[i];
        pieceImages[piece] = loadImage(`assets/${piece}.png`);
    }
    textSize(40);
}

function isValidFEN(fen) {
    let parts = fen.split(/\s/g);
    let board = parts[0];
    let rows = board.split("/");
    if (rows.length != 8) {
        return `Too many rows: ${rows.length}`;
    }
    let validPieces = ['p', 'r', 'n', 'b', 'q', 'k', 'P', 'R', 'N', 'B', 'Q', 'K'];
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let count = 0;
        for (let j = 0; j < row.length; j++) {
            let c = row[j];
            if (c >= '1' && c <= '8') {
                count += parseInt(c);
            } else {
                if (!validPieces.includes(c)) {
                    return `Invalid piece ${c} at row ${i+1} col ${j+1}`;
                }
                count++;
            }
        }
        if (count != 8) {
            return `Invalid row length at row ${i+1}`;
        }
    }
    return "";
}
// rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1

function displayBoard(fen) {
    let x = 0;
    let y = 0;
    noStroke();
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if ((i+j)%2 == 0) {
                fill(255, 229, 207);
            } else {
                fill(158, 73, 2);
            }
            rect(x, y, TILESIZE, TILESIZE);
            x += TILESIZE;
        }
        x = 0;
        y += TILESIZE;
    }

    x = 0;
    y = 0;

    let rows = fen.split(/\s/g)[0].split("/");

    for (let j = 0; j < rows.length; j++) {
        let row = rows[j];
        for (let k = 0; k < row.length; k++) {
            let c = row[k];
            // if c is a digit
            if (c >= '0' && c <= '9') {
                x += parseInt(c) * TILESIZE;
                continue;
            }
            let pieceName = `${c == c.toUpperCase() ? 'w' : 'b'}${c.toLowerCase()}`;
            // console.log(pieceName);
            image(pieceImages[pieceName], x, y, TILESIZE, TILESIZE);
            x += TILESIZE;
        }
        x = 0;
        y += TILESIZE;
    }
}

document.addEventListener('keydown', function(event) {
    // right arrow key
    if (document.activeElement.tagName == "INPUT") {
        return;
    }
    if (event.keyCode == 39) {
        currentFENLineIdx++;
    } else if (event.keyCode == 37) {
        currentFENLineIdx--;
    } else {
        return;
    }
    currentFENLineIdx = Math.min(FENLines.length-1, Math.max(0, currentFENLineIdx));
    fenIdxDisplay.innerText = currentFENLineIdx + 1;
    fenDisplay.value = FENLines[currentFENLineIdx];
    updateDisplay(FENLines[currentFENLineIdx]);
});

fenDisplay.addEventListener("input", function() {
    updateDisplay(fenDisplay.value);
});