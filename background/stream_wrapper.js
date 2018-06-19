function getLiveStream(streamerData, viewers, previewImageUrl, uptime, thumbnailsEnabled){
    return `
        <a href="#" class="stream_link">
            ${buildStreamFrame(streamerData, viewers, previewImageUrl, uptime, thumbnailsEnabled)}
        </a>
    `;
}

function buildStreamFrame(streamerData, viewers, previewImageUrl, uptime, thumbnailsEnabled) {
    viewers_with_saces = viewers.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    let baseStreamFrame = `
        <div class="upper_framme">
            <div class="upper_channel_name">${streamerData.name}</div><div class="upper_channel_viewers">(${viewers_with_saces})</div><div class="upper_channel_uptime">Live: ${uptime}</div>
        </div>
        <div class="stream_header_separator"></div>
        <div class="stream_frame">
            <div class="live_stream_information_frame">
                ${buildStreamInformationFrame(streamerData, viewers, uptime)}
            </div>`;
    if(thumbnailsEnabled){
        baseStreamFrame += `<div class="live_stream_image">
                                ${buildStreamImageFrame(previewImageUrl)}
                            </div>`;
    }
    baseStreamFrame += "</div>";
    return baseStreamFrame;
}

function buildStreamInformationFrame(streamerData, viewers, uptime) {
    return `
        <div class="channel_game">${streamerData.game}</div>
        <div class="channel_title">${streamerData.status}</div>
    `
}

function buildStreamImageFrame(imageUrl) {
    return `
        <img src="${imageUrl}" class="channel_image" id="${uuidv4()}"></img>
    `
}

// Helper function
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }