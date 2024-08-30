fenIdxDisplay.addEventListener("change", function () {
    gui.setFocusIndex(parseInt(fenIdxDisplay.value) - 1);
});

document.addEventListener('keydown', function (event) {
    // right arrow key
    if (document.activeElement.tagName == "INPUT") {
        return;
    }
    if (event.key == 'ArrowRight') {
        gui.focusNext();
    } else if (event.key == 'ArrowLeft') {
        gui.focusPrev();
    } else if (event.key == 'ArrowUp') {
        gui.focusParent();
    } else if (event.key == 'ArrowDown') {
        gui.focusChild();
    }
});