// Read in text file on pressing submit button with id "submit"
let FENLines = [];
const fenIdxDisplay = document.getElementById("fenIdx");
const fenLengthDisplay = document.getElementById("fenIdxMax");
let currentFENLineIdx = 0;

const fenDisplay = document.getElementById("currFenStr");
const errorDisplay = document.getElementById("strErrMsg");

const deleteBtn = document.getElementById("delete");
const insertBtn = document.getElementById("insert");

const useTimestampsChkBox = document.getElementById("timestampChk");

var tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        events: {
            'onReady': onPlayerReady,
        }
    });
    iframeWindow = player.getIframe().contentWindow;
}

function onPlayerReady(event) {
    event.target.playVideo(); // this doesn't work lmao
}

function binarySearch(val) {
    let left = 0;
    let right = FENLines.length - 1;
    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        if (FENLines[mid][FENLines[mid].length - 1] == val) {
            return mid;
        }
        if (FENLines[mid][FENLines[mid].length - 1] < val) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return right;
}

// https://stackoverflow.com/questions/65511523/how-to-listen-to-time-change-events-with-the-youtube-iframe-player-api
var iframeWindow;
var lastTimeUpdate = 0;
window.addEventListener("message", function (event) {
    // Check that the event was sent from the YouTube IFrame.
    if (FENLines.length == 0 || useTimestampsChkBox.checked == false) {
        return;
    }
    if (event.source === player.getIframe().contentWindow) {
        var data;
        try {
            data = JSON.parse(event.data);
        } catch (e) {
            console.log(e);
            return;
        }
        // console.log(data);
        // The "infoDelivery" event is used by YT to transmit any
        // kind of information change in the player,
        // such as the current time or a playback quality change.
        if (
            data.event === "infoDelivery" &&
            data.info &&
            data.info.currentTime
        ) {
            // currentTime is emitted very frequently,
            // but we only care about whole second changes.
            var time = data.info.currentTime;
            if (Math.abs(time - lastTimeUpdate) >= 0.1) {
                lastTimeUpdate = time;
                currentFENLineIdx = binarySearch(time);
                fenIdxDisplay.innerText = currentFENLineIdx + 1;
                updateDisplay(FENLines[currentFENLineIdx], updateVideo=false);
            }
        }
    }
});

document.getElementById('setVideoBtn').addEventListener('click', () => {
    if (!document.getElementById('ytURL').value.includes('watch?v=')) {
        alert('Invalid URL');
        return;
    }
    let videoID = document.getElementById('ytURL').value.split('?v=')[1].split('&')[0];
    console.log(videoID);
    player.loadVideoById(videoID);
});

deleteBtn.addEventListener("click", function () {
    if (FENLines.length == 0) {
        return;
    }
    FENLines.splice(currentFENLineIdx, 1);
    if (currentFENLineIdx >= FENLines.length) {
        currentFENLineIdx = FENLines.length - 1;
        fenIdxDisplay.innerText = currentFENLineIdx + 1;
    }
    fenLengthDisplay.innerText = FENLines.length;
    updateDisplay(FENLines[currentFENLineIdx]);
    if (FENLines.length == 0) {
        deleteBtn.disabled = true;
    }
});

insertBtn.addEventListener("click", function () {
    currentFENLineIdx = binarySearch(player.getCurrentTime()) + 1;
    FENLines.splice(currentFENLineIdx, 0, ["", player.getCurrentTime()]);
    fenIdxDisplay.innerText = currentFENLineIdx + 1;
    fenLengthDisplay.innerText = FENLines.length;
    updateDisplay(FENLines[currentFENLineIdx]);
});

function updateDisplay(parts, updateVideo=true) {
    console.log(parts);
    let str = parts[0];
    let time = parts[parts.length - 1];
    const err = isValidFEN(str);
    if (err != "") {
        errorDisplay.innerText = err;
        fenDisplay.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
        return;
    }
    errorDisplay.innerText = "";
    fenDisplay.style.backgroundColor = "white";
    fenDisplay.value = str;
    FENLines[currentFENLineIdx] = parts;
    displayBoard(str);
    if (updateVideo && document.getElementById("timestampChk").checked) {
        player.seekTo(time);
    }
}

// event listener for number input change
document.getElementById("fenIdxInput").addEventListener("change", function () {
    FENLineIdx = parseInt(this.value);
    if (isNaN(FENLineIdx) || FENLineIdx <= 0 || FENLineIdx > FENLines.length) {
        return;
    }
    currentFENLineIdx = FENLineIdx - 1;
    fenIdxDisplay.innerText = FENLineIdx;
    updateDisplay(FENLines[currentFENLineIdx]);
});

document.getElementById("submit").addEventListener("click", function () {
    var file = document.getElementById("fileInput").files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
        var text = reader.result;
        FENLines = text.split("\n").map(line => line.trim().split(/\s/g));
        currentFENLineIdx = 0;
        fenIdxDisplay.innerText = "1";
        fenLengthDisplay.innerText = FENLines.length;
        deleteBtn.disabled = false;
        updateDisplay(FENLines[currentFENLineIdx]);
    }
    reader.readAsText(file);
});

const TILESIZE = 60;

const pieceImageNames = ['wp', 'wr', 'wn', 'wb', 'wq', 'wk', 'bp', 'br', 'bn', 'bb', 'bq', 'bk'];

let pieceImages = {};

function setup() {
    createCanvas(TILESIZE * 8, TILESIZE * 8);
    for (let i = 0; i < pieceImageNames.length; i++) {
        let piece = pieceImageNames[i];
        pieceImages[piece] = loadImage(`assets/${piece}.png`);
    }
    textSize(40);
}

function isValidFEN(fen) {
    if (fen == "") {
        return "";
    }
    let parts = fen.split(/\s/g);
    let board = parts[0];
    let rows = board.split("/");
    if (rows.length != 8) {
        return `Wrong number of rows: ${rows.length}`;
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
                    return `Invalid piece ${c} at row ${i + 1} col ${j + 1}`;
                }
                count++;
            }
        }
        if (count != 8) {
            return `Invalid row length at row ${i + 1}`;
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
            if ((i + j) % 2 == 0) {
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

document.addEventListener('keydown', function (event) {
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
    currentFENLineIdx = Math.min(FENLines.length - 1, Math.max(0, currentFENLineIdx));
    fenIdxDisplay.innerText = currentFENLineIdx + 1;
    fenDisplay.value = FENLines[currentFENLineIdx];
    updateDisplay(FENLines[currentFENLineIdx]);
});

fenDisplay.addEventListener("input", function () {
    FENLines[currentFENLineIdx][0] = fenDisplay.value;
    updateDisplay(FENLines[currentFENLineIdx]);
});