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

fenDisplay.addEventListener("input", function () {
    if (gui.focused == null) {
        return;
    }
    const err = isValidFEN(fenDisplay.value);
    if (err != "") {
        errorDisplay.innerText = err;
        fenDisplay.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
        return;
    }
    errorDisplay.innerText = "";
    fenDisplay.style.backgroundColor = "white";
    gui.focused.fen = fenDisplay.value;
});