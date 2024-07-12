// Read in text file on pressing submit button with id "submit"
let FENLines = [];
const fenIdxDisplay = document.getElementById("fenIdx");
let currentFENLineIdx = 0;

// event listener for number input change
document.getElementById("fenIdxInput").addEventListener("change", function() {
    FENLineIdx = parseInt(this.value);
    if (isNaN(FENLineIdx) || FENLineIdx < 0 || FENLineIdx >= FENLines.length) {
        return;
    }
    currentFENLineIdx = FENLineIdx;
    fenIdxDisplay.innerText = currentFENLineIdx;
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

// rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1

function draw() {
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

    if (FENLines.length == 0 || currentFENLineIdx >= FENLines.length || currentFENLineIdx < 0) {
        stroke(0);
        fill(255);
        text("Please upload a file", 0, height/2);
        return;
    }

    x = 0;
    y = 0;
    // image(pieceImages['wr'], 0, 0, TILESIZE, TILESIZE);
    // let currentFENLine = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    let currentFENLine = FENLines[currentFENLineIdx];
    let rows = currentFENLine.split(' ')[0].split("/");

    if (rows.length != 8) {
        stroke(0);
        fill(255);
        text("Invalid FEN string", 0, height/2);
        return;
    }

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
            image(pieceImages[pieceName], x, y, TILESIZE, TILESIZE);
            x += TILESIZE;
        }
        x = 0;
        y += TILESIZE;
    }
}

document.addEventListener('keydown', function(event) {
    // right arrow key
    if (event.keyCode == 39) {
        currentFENLineIdx++;
    } else if (event.keyCode == 37) {
        currentFENLineIdx--;
    } else {
        return;
    }
    currentFENLineIdx = Math.min(FENLines.length-1, Math.max(0, currentFENLineIdx));
    fenIdxDisplay.innerText = currentFENLineIdx + 1;
});