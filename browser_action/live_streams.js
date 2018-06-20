"use strict"
// Background access
let BACKGROUNDPAGE = browser.extension.getBackgroundPage();

 updateLiveStreams();
browser.runtime.onMessage.addListener(beckendUpdateListener);

function updateLiveStreams() {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(BACKGROUNDPAGE.getLiveStreams(), `text/html`);
    const tag = parsed.getElementsByTagName(`body`)[0];
    document.getElementById("live_stream_container").innerHTML = ``;
    document.getElementById("live_stream_container").appendChild(tag);
    updateEventListeners();
}

function beckendUpdateListener(request, sender, sendResponse) {
    if (request.subject === "update_stream_list") {
        console.log("Received stream update message");
        updateLiveStreams();
    }
}

function updateEventListeners() {
    let links = document.getElementsByClassName("stream_link");
    for(let linkIndex = 0; linkIndex < links.length; linkIndex++) {
        let link = links[linkIndex];
        let channel_name_list = link.getElementsByClassName("upper_channel_name");
        let channel_name = channel_name_list[0];

        link.onclick = (function() {
            let local_channel_name = channel_name.innerHTML;
            return () => {
                openStream(local_channel_name);
            }
        })();
    }

    let images = document.getElementsByClassName("channel_image");
    for(let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        let image = images[imageIndex];
        image.onload = (function() {
            let imageId = image.id;
            return () => {
                changeOpacityFadeIn(imageId);
            }
        })();
    }
}

function openStream(channel_name) {
    browser.tabs.create({
        url:"https://twitch.tv/" + channel_name,
        active: true
    });
    browser.runtime.sendMessage({"subject": "background.close_popup"});
}

function changeOpacityFadeIn(id) {
    let image = document.getElementById(id);
    image.style.opacity='1';
}