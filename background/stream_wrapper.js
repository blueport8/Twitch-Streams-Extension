function getLiveStream(streamerData, viewers, previewImageUrl, uptime){
    return `
        <a href="#" class="stream_link">
            ${buildStreamFrame(streamerData, viewers, previewImageUrl, uptime)}
        </a>
    `;
}

function buildStreamFrame(streamerData, viewers, previewImageUrl, uptime) {
    viewers_with_saces = viewers.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `
        <div class="upper_framme">
            <div class="upper_channel_name">${streamerData.name}</div><div class="upper_channel_viewers">(${viewers_with_saces})</div><div class="upper_channel_uptime">Live: ${uptime}</div>
        </div>
        <div class="stream_header_separator"></div>
        <div class="stream_frame">
            <div class="live_stream_information_frame">
                ${buildStreamInformationFrame(streamerData, viewers, uptime)}
            </div>
            <div class="live_stream_image">
                ${buildStreamImageFrame(previewImageUrl)}
            </div>
        </div>
    `;
}

function buildStreamInformationFrame(streamerData, viewers, uptime) {
    return `
        <div class="channel_game">${streamerData.game}</div>
        <div class="channel_title">${streamerData.status}</div>
    `
}

function buildStreamImageFrame(imageUrl) {
    return `
        <img src="${imageUrl}" class="channel_image"></img>
    `
}