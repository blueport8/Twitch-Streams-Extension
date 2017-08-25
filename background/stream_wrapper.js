function getLiveStream(streamerData){
    return `
        <a href="#" class="stream_link">
            ${buildStreamFrame(streamerData)}
        </a>
    `;
}

function buildStreamFrame(streamerData) {
    var imageUrl = streamerData.video_banner;
    return `
        <div class="stream_frame">
            <div class="live_stream_information_frame">
                ${buildStreamInformationFrame(streamerData)}
            </div>
            <div class="live_stream_image">
                ${buildStreamImageFrame(imageUrl)}
            </div>
        </div>
    `;
    return frameHtml;
}

function buildStreamInformationFrame(streamerData) {
    return `
        <div class="channel_name">${streamerData.name}</div>
        <div class="channel_game">${streamerData.game}</div>
        <div class="channel_title">${streamerData.status}</div>
    `
}

function buildStreamImageFrame(imageUrl) {
    return `
        <img src="${imageUrl}" class="channel_image"></img>
    `
}