deleteBtn.addEventListener("click", function () {
    console.log(gui.focused);
    if (gui.focused) {
        gui.deleteSubtree(gui.focused);
    }
});

insertBtn.addEventListener("click", function () {
    console.log('SOMETHING', gui.focused);
    if (gui.focused) {
        gui.addChild(gui.focused, "");
    }
});