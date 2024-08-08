let fov = 1;
let cameraX = 0;
let cameraY = 0;

const pieceImageNames = ['wp', 'wr', 'wn', 'wb', 'wq', 'wk', 'bp', 'br', 'bn', 'bb', 'bq', 'bk'];

let pieceImages = {};

function scaled_point(x, y) {
    // map to camera and scale width to fov
    x = map(x, cameraX - fov, cameraX + fov, 0, width);
    y = map(y, cameraY - fov, cameraY + fov, 0, height);
    return [x, y];
}

function unscale_point(x, y) {
    x = map(x, 0, width, cameraX - fov, cameraX + fov);
    y = map(y, 0, height, cameraY - fov, cameraY + fov);
    return [x, y];
}

function bent_line(x1, y1, x2, y2) {
    line(x1, y1, x2, y1);
    line(x2, y1, x2, y2);
}

class BoardNode {
    constructor(json) {
        if (json) {
            this.fromJSON(json);
            this.initWidths();
            this.reposition();
        } else {
            this.x = 0;
            this.y = 0;
            this.width = 1;
            this.children = [];
        }
        this.focused = false;
    }
    display(w) {
        let [sx, sy] = scaled_point(this.x, this.y);
        strokeWeight(w/20);
        this.children.forEach(child => {
            let [ex, ey] = scaled_point(child.x, child.y);
            stroke(255);
            bent_line(sx, sy, ex, ey);
            child.display(w);
        });
        if (this.focused) {
            strokeWeight(w/10);
            stroke(255);
            noFill();
            rect(sx - w / 2, sy - w / 2, w, w);
        }
        drawBoard(this.fen, sx, sy, w);
    }
    initWidths() {
        this.children.forEach(child => child.initWidths());
        if (this.children.length == 0) {
            this.width = 1;
            return;
        }
        if (this.children.length == 1) {
            this.width = this.children[0].width;
            return;
        }
        this.width = this.children.reduce((acc, child) => acc + child.width, 1);
    }
    reposition() {
        let x = this.x - this.width / 2;
        this.children.forEach(child => {
            x += child.width / 2;
            child.x = x;
            x += child.width / 2;
            child.reposition();
        });
    }
    fromJSON(json, y=0) {
        this.fen = json.fen;
        this.x = 0;
        this.y = y;
        this.width = 1;
        this.children = json.next.map(child => {
            let node = new BoardNode();
            node.fromJSON(child, y + 1);
            return node;
        });
    }
    preOrderTraversal() {
        let result = [];
        result.push(this);
        this.children.forEach(child => result.push(...child.preOrderTraversal()));
        return result;
    }
}

let tree;
let treeNodes = [];

const defaultFENString = {
    "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1",
    "time": 0,
    "next": []
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    for (let i = 0; i < pieceImageNames.length; i++) {
        let piece = pieceImageNames[i];
        pieceImages[piece] = loadImage(`assets/${piece}.png`);
    }
    textSize(40);
    tree = new BoardNode(testJSONFENTree);
    treeNodes = tree.preOrderTraversal();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function drawBoard(fen, x, y, w) {
    let TILESIZE = w / 8;
    noStroke();
    x -= w / 2;
    y -= w / 2;
    const xOrg = x;
    const yOrg = y;
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
        x = xOrg;
        y += TILESIZE;
    }

    x = xOrg;
    y = yOrg;

    let rows = fen.split(/\s/g)[0].split("/");

    for (let j = 0; j < rows.length; j++) {
        let row = rows[j];
        for (let k = 0; k < row.length; k++) {
            let c = row[k];
            if (c >= '0' && c <= '9') {
                x += parseInt(c) * TILESIZE;
                continue;
            }
            let pieceName = `${c == c.toUpperCase() ? 'w' : 'b'}${c.toLowerCase()}`;
            image(pieceImages[pieceName], x, y, TILESIZE, TILESIZE);
            x += TILESIZE;
        }
        x = xOrg;
        y += TILESIZE;
    }
}

let targetX = 0;
let targetY = 0;
let targetFov = 1;
let startTime = 0;
let lerpTime = 0.2;
let lastFocused = null;

const focusedBoardSize = 450;

function draw() {
    background(17);
    let elapsedTime = (millis() - startTime) / 1000; // Convert milliseconds to seconds
    let startX = cameraX;
    let startY = cameraY;
    if (elapsedTime < lerpTime) {
        let t = elapsedTime / lerpTime; // Normalized time [0, 1]
        t = 3 * t * t - 2 * t * t * t;
        cameraX = lerp(startX, targetX, t);
        cameraY = lerp(startY, targetY, t);
        fov = lerp(fov, targetFov, t);
    }
    tree.display(200/fov);
    if (lastFocused) {
        drawBoard(lastFocused.fen, focusedBoardSize / 2, height - focusedBoardSize / 2, focusedBoardSize);
    }
}

function mouseWheel(event) {
    if (event.delta > 0) {
        fov *= 1.1;
    } else {
        fov /= 1.1;
    }
    targetFov = fov;
}

function mouseDragged() {
    cameraX -= (mouseX - pmouseX) * fov / width;
    cameraY -= (mouseY - pmouseY) * fov / height;
    if (lastFocused) {
        lastFocused.focused = false;
        lastFocused = null;
    }
}

function focus(node) {
    targetX = node.x;
    targetY = node.y;
    if (lastFocused == node || lastFocused == null) {
        targetFov = 1;
    }
    if (lastFocused) {
        lastFocused.focused = false;
    }
    node.focused = true;
    lastFocused = node;
    startTime = millis();
}

function distanceSquared(x1, y1, x2, y2) {
    return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}

let mouseDragStart = [0, 0];

function mousePressed() {
    mouseDragStart = [mouseX, mouseY];
}

function mouseReleased() {
    if (distanceSquared(mouseX, mouseY, ...mouseDragStart) > 10) {
        return;
    }
    let [x, y] = unscale_point(mouseX, mouseY);
    let {d, node} = treeNodes.reduce((acc, node) => {
        let d = distanceSquared(x, y, node.x, node.y);
        return d < acc.d ? {d, node} : acc;
    }, {d: Infinity, node: null});
    if (node && d < 0.5) {
        console.log(d);
        focus(node);
    }
}