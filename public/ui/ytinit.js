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
}

function onPlayerReady(event) {
    event.target.playVideo(); // this doesn't work lmao
}

// https://stackoverflow.com/questions/65511523/how-to-listen-to-time-change-events-with-the-youtube-iframe-player-api
var lastTimeUpdate = 0;
window.addEventListener("message", function (event) {
    // Check that the event was sent from the YouTube IFrame.
    if (gui.treeNodes.length == 0) {
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
                gui.setFocusIndex(gui.binarySearch(time), false, false);
            }
        }
    }
});