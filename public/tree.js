let fov = 1;
let cameraX = 0;
let cameraY = 0;

let targetX = 0;
let targetY = 0;
let targetFov = 1;
let startTime = 0;
const lerpTime = 0.3;

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
            this.resetDisplay();
        } else {
            this.x = 0;
            this.y = 0;
            this.width = 1;
            this.children = [];
            this.parent = null;
            // this.index = 0;
        }
    }
    display(w) {
        let [sx, sy] = scaled_point(this.x, this.y);
        strokeWeight(w/20);
        stroke(255);
        this.children.forEach(child => {
            let [ex, ey] = scaled_point(child.x, child.y);
            bent_line(sx, sy, ex, ey);
        });
        drawBoard(this.fen, sx, sy, w);
    }
    resetWidths() {
        this.width = 1;
        this.children.forEach(child => child.resetWidths());
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
    resetX() {
        this.x = 0;
        this.children.forEach(child => child.resetX());
    }
    initX() {
        let x = this.x - this.width / 2;
        this.children.forEach(child => {
            x += child.width / 2;
            child.x = x;
            x += child.width / 2;
            child.initX();
        });
    }
    resetDisplay() {
        this.resetX();
        this.initX();
        this.resetWidths();
        this.initWidths();
    }
    fromJSON(json, y=0, parent=null) {
        this.fen = json.fen;
        this.times = json.times;
        this.x = 0;
        this.y = y;
        this.width = 1;
        this.parent = parent;
        this.children = json.next.map(child => {
            let node = new BoardNode();
            node.fromJSON(child, y + 1, this);
            return node;
        });
    }
    toJSON() {
        return {
            fen: this.fen,
            times: this.times,
            next: this.children.map(child => child.toJSON())
        };
    }
    preOrderTraversal() {
        let result = [];
        result.push(this);
        this.children.forEach(child => result.push(...child.preOrderTraversal()));
        return result;
    }
}

class TreeManager {
    constructor(json) {
        if (!json) {
            json = {
                "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1",
                "times": [],
                "next": []
            }
        }
        this.tree = new BoardNode(json);
        this.focused = this.tree;
        this.focusIndex = 0;
        this.update();
    }

    binarySearch(time) {
        let left = 0;
        let right = this.timeMapping.length - 1;
        while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            if (this.timeMapping[mid].time == time) {
                return mid;
            }
            if (this.timeMapping[mid].time < time) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return this.timeMapping[Math.max(right, 0)].index;
    }

    update() {
        this.treeNodes = this.tree.preOrderTraversal();
        this.timeMapping = [{time: 0, index: 0}];
        for (let i = 1; i < this.treeNodes.length; i++) {
            // this.treeNodes[i].index = this.timeMapping.length - 1;
            for (let j = 0; j < this.treeNodes[i].times.length; j++) {
                this.timeMapping.push({time: this.treeNodes[i].times[j], index: i});
            }
        }
        this.timeMapping.sort((a, b) => a.time - b.time);
        this.tree.resetDisplay();
        this.updateFENDisplay();
        this.updateFENLineIdxDisplay();
        this.updateMaxFENLinesDisplay();
    }

    setFocusIndex(index, zoom=true, seek=true) {
        if (index < 0 || index >= this.timeMapping.length) {
            return;
        }
        this.focusIndex = index;
        this.focus(this.treeNodes[this.timeMapping[index].index], zoom, seek);
    }
    
    focusNext() {
        console.log(this.focusIndex)
        this.setFocusIndex(this.focusIndex + 1);
        console.log(this.focusIndex)
    }
    
    focusPrev() {
        this.setFocusIndex(this.focusIndex - 1);
    }
    
    focusParent() {
        if (this.focused.parent) {
            this.focus(this.focused.parent);
        }
    }
    
    focusChild() {
        if (this.focused.children.length > 0) {
            this.focus(this.focused.children[this.focused.children.length-1]);
        }
    }

    updateFENDisplay() {
        fenDisplay.value = this.focused.fen;
    }

    updateFENLineIdxDisplay() {
        fenIdxDisplay.value = 0 + 1;
    }
    
    updateMaxFENLinesDisplay() {
        fenLengthDisplay.innerText = this.treeNodes.length;
    }
    
    display(w) {
        let [sx, sy] = scaled_point(this.focused.x, this.focused.y);
        if (this.focused) {
            noFill();
            strokeWeight(w/15);
            stroke(255);
            // ellipse(sx, sy, 1.5 * w, 1.5 * w);
            // strokeWeight(w/20);
            // stroke(0);
            rect(sx - w / 2, sy - w / 2, w, w);
        }

        function helper(curr) {
            curr.display(w);
            curr.children.forEach(child => helper(child));
        }
        helper(this.tree);

        if (this.focused) {
            stroke(255);
            strokeWeight(2);
            rect(10, height - focusedBoardSize - 10, focusedBoardSize, focusedBoardSize);
            drawBoard(this.focused.fen, focusedBoardSize / 2 + 10, height - focusedBoardSize / 2 - 10, focusedBoardSize);
        }
    }

    focus(node, zoom=true, seek=true) {
        if (this.focused == node) {
            if (!zoom) {
                return;
            }
            targetFov = 1;
        }
        targetX = node.x;
        targetY = node.y;
        this.focused = node;
        // this.focusIndex = node.index;
        startTime = millis();
        this.updateFENDisplay();
        this.updateFENLineIdxDisplay();
        if (seek) {
            player.seekTo(this.focused.times[0]);
        }
    }
    
    // TODO: Add time parameter
    addChild(node, fen) {
        let child = new BoardNode({fen: fen, next: []});
        child.y = node.y + 1;
        child.parent = node;
        node.children.push(child);
        this.update();
        this.focus(child);
        this.updateMaxFENLinesDisplay();
    }
    
    deleteSubtreeRecursive(node) {
        node.children.forEach(child => this.deleteSubtreeRecursive(child));
        node.children = [];
        node.parent.children = node.parent.children.filter(child => child != node);
        delete this;
    }

    deleteSubtree(node) {
        if (node == this.tree) {
            alert('Cannot delete root node');
            return;
        }
        let parent = node.parent;
        this.deleteSubtreeRecursive(node);
        this.update();
        this.focus(parent);
        this.updateMaxFENLinesDisplay();
    }
}

let gui = new TreeManager();

function setup() {
    createCanvas(windowWidth, windowHeight);
    for (let i = 0; i < pieceImageNames.length; i++) {
        let piece = pieceImageNames[i];
        pieceImages[piece] = loadImage(`assets/${piece}.png`);
    }
    textSize(40);
    gui = new TreeManager(testJSONFENTree);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function drawBoard(fen, x, y, w) {
    let TILESIZE = w / 8;
    noStroke();
    x -= w / 2;
    y -= w / 2;
    if (fen == '') {
        fill(17);
        rect(x, y, w, w)
        return;
    }
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
    gui.display(200/fov);
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
    let {d, node} = gui.treeNodes.reduce((acc, node) => {
        let d = distanceSquared(x, y, node.x, node.y);
        return d < acc.d ? {d, node} : acc;
    }, {d: Infinity, node: null});
    if (node && d < 0.5) {
        gui.focus(node);
        gui.updateFENLineIdxDisplay();
        gui.updateFENDisplay();
    }
}

function keyPressed() {
    if (keyCode === ENTER) {
        gui.focus(gui.focused);
    }
}