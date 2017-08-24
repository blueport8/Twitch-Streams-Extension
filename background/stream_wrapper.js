function getLiveStream(streamerData){
    var liveStreamHTML = getLiveStreamLinkBeginning(streamerData.name) + getLiveStreamHeader();
    liveStreamHTML += streamerData.name;
    liveStreamHTML += getLiveStreamEnding() + getLiveStreamLinkEnding();
    return liveStreamHTML;
}

function getLiveStreamLinkBeginning(channelName) {
    return "<a href=\"#\" class=\"stream_link\">";
}

function getLiveStreamLinkEnding() {
    return "</a>";
}

function getLiveStreamHeader() {
    return "<div class=\"channel_name\">";
}

function getLiveStreamEnding() {
    return "</div>";
}