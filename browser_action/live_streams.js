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

function beckendUpdateListener(request) {
    if(request.subject === "remove_streams_from_view") {
        let removedStream = request.data;
        let streamToRemove = document.getElementById(removedStream.uuid);
        if(streamToRemove != null) {
            streamToRemove.parentNode.removeChild(streamToRemove);
        }
    }
    if(request.subject === "update_stream_on_the_view") {
        let updatedStream = request.data;
        
        
        let container = document.getElementById("live_stream_container");
        console.log("Container: " + container.childNodes[0].childNodes.length);
        let insertionIndex = getInsertionIndex(updatedStream, container.childNodes[0]);
        console.log("Update index: " + insertionIndex);
        
        const parser = new DOMParser();
        const parsed = parser.parseFromString(updatedStream.compiledStream.streamFrame, `text/html`);
        const tag = parsed.getElementsByTagName(`body`)[0];
        let channelImageList = tag.getElementsByClassName("channel_image");
        let channelImage = channelImageList[0];
        channelImage.onload = (function() {
            let frameId = tag.childNodes[0].id;
            return () => {
                changeOpacityFadeIn(frameId);
            }
        })();
        if(insertionIndex !== Infinity) {
            let insertionNode = container.childNodes[0].childNodes.item(insertionIndex);
            insertionNode.parentNode.insertBefore(tag, insertionNode);
        } else {
            container.childNodes[0].appendChild(tag);
        }
        
        let streamToUpdate = document.getElementById(updatedStream.oldStreamUuid);
        streamToUpdate.parentNode.removeChild(streamToUpdate);
    }
    if(request.subject === "insert_stream_into_view") {
        let insertedStream = request.data;
        let container = document.getElementById("live_stream_container").childNodes[0];
        const parser = new DOMParser();
        const parsed = parser.parseFromString(insertedStream.compiledStream.streamFrame, `text/html`);
        const tag = parsed.getElementsByTagName(`body`)[0];
        let channelImageList = tag.getElementsByClassName("channel_image");
        let channelImage = channelImageList[0];
        channelImage.onload = (function() {
            let frameId = tag.childNodes[0].id;
            return () => {
                changeOpacityFadeIn(frameId);
            }
        })();
        if(insertionIndex !== Infinity) {
            console.log(insertionIndex);
            let insertionNode = container.childNodes.item(insertionIndex);
            insertionNode.parentNode.insertBefore(tag, insertionNode);
        } else {
            container.appendChild(tag);
        }
    }
}

function getInsertionIndex(insertedStream, container) {
    if(insertedStream.sortingField === "Viewers" && insertedStream.sortingDirection === "desc") {
        if(insertedStream.viewersSortingInsertionIndex == Infinity) return 0;
        if(insertedStream.viewersSortingInsertionIndex == 0) return Infinity;
        return container.childNodes.length - insertedStream.viewersSortingInsertionIndex + 1;
    }
    if(insertedStream.sortingField === "Viewers" && insertedStream.sortingDirection === "asc") {
        if(container.childNodes.length == insertedStream.viewersSortingInsertionIndex) return Infinity;
        return insertedStream.viewersSortingInsertionIndex + 1;
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

        let channelImageList = link.getElementsByClassName("channel_image");
        let channelImage = channelImageList[0];
        channelImage.onload = (function() {
            let frameId = link.id;
            return () => {
                changeOpacityFadeIn(frameId);
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

function changeOpacityFadeIn(frameId) {
    let streamFrame = document.getElementById(frameId);
    let channelImageList = streamFrame.getElementsByClassName("channel_image");
    let channelImage = channelImageList[0];
    channelImage.style.opacity='1';
}