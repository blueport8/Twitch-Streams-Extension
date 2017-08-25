function getLiveStream(streamerData, viewers, previewImageUrl){
    return `
        <a href="#" class="stream_link">
            ${buildStreamFrame(streamerData, viewers, previewImageUrl)}
        </a>
    `;
}

function buildStreamFrame(streamerData, viewers, previewImageUrl) {
    return `
        <div class="stream_frame">
            <div class="live_stream_information_frame">
                ${buildStreamInformationFrame(streamerData, viewers)}
            </div>
            <div class="live_stream_image">
                ${buildStreamImageFrame(previewImageUrl)}
            </div>
        </div>
    `;
}

function buildStreamInformationFrame(streamerData, viewers) {
    return `
        <div class="channel_name_viewers_row">
            <div class="channel_name">${streamerData.name}</div>
            <div class="channel_viewers">${viewers}</div>
        </div>
        <div class="channel_game">${streamerData.game}</div>
        <div class="channel_title">${streamerData.status}</div>
    `
}

function buildStreamImageFrame(imageUrl) {
    return `
        <img src="${imageUrl}" class="channel_image"></img>
    `
}