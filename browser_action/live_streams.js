"use strict"
// Background access
let BACKGROUNDPAGE = browser.extension.getBackgroundPage();


updateLiveStreams();
browser.runtime.onMessage.addListener(beckendUpdateListener);

function updateLiveStreams() {
    const letLiveStreamList = BACKGROUNDPAGE.getLiveStreams();
    const container = getContainer();
    container.innerHTML = ``;
    for (var streamIndex = 0; streamIndex < letLiveStreamList.length; streamIndex++) {
        const element = letLiveStreamList[streamIndex];
        const parsingResults = parseStreamFrame(element.streamFrame);
        container.appendChild(parsingResults[0]);
    }
    updateEventListeners();
}

function beckendUpdateListener(request) {
    if(request.subject === "remove_streams_from_view") {
        handleStreamRemoval(request.data);
    }
    if(request.subject === "update_stream_on_the_view") {
        handleStreamUpdate(request.data);
    }
    if(request.subject === "insert_stream_into_view") {
        handleStreamInsert(request.data);
    }
}

function handleStreamRemoval(removedStream) {
    console.log("Removal fired for:");
    console.log(removedStream);
    removeStream(removedStream.uuid);
}

function handleStreamUpdate(updatedStream) {
    let container = getContainer();
    let insertionIndex = getInsertionIndex(updatedStream, container);
    const streamLinkFrame = parseStreamFrame(updatedStream.compiledStream.streamFrame)[0];
    addImageFadeInEffect(streamLinkFrame);

    

    if(insertionIndex !== Infinity) {
        //console.log("Updating - insertion index: " + insertionIndex);
        //console.log("Streams on view: " + container.childNodes.length);
        let insertionNode = container.childNodes.item(insertionIndex);
        insertionNode.parentNode.insertBefore(streamLinkFrame, insertionNode);
    } else {
        container.appendChild(streamLinkFrame);
    }

    let streamToUpdate = document.getElementById(updatedStream.oldStreamUuid);
    streamToUpdate.parentNode.removeChild(streamToUpdate);
}

function handleStreamInsert(insertedStream) {
    let container = getContainer();
    const streamLinkFrame = parseStreamFrame(insertedStream.compiledStream.streamFrame)[0];
    let insertionIndex = getInsertionIndex(insertedStream, container);
    addImageFadeInEffect(streamLinkFrame);
    if(insertionIndex !== Infinity) {
        //console.log("Inserting - insertion index: " + insertionIndex);
        //console.log("Streams on view: " + container.childNodes.length);
        let insertionNode = container.childNodes.item(insertionIndex);
        insertionNode.parentNode.insertBefore(streamLinkFrame, insertionNode);
    } else {
        container.appendChild(streamLinkFrame);
    }
}

function parseStreamFrame(streamFrame) {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(streamFrame, `text/html`);
    return parsed.getElementsByTagName("a");
}

function addImageFadeInEffect(tag) {
    let channelImageList = tag.getElementsByClassName("channel_image");
    let channelImage = channelImageList[0];
    channelImage.onload = (function() {
        let frameId = tag.id;
        return () => {
            changeOpacityFadeIn(frameId);
        }
    })();
}

function getContainer() {
    return document.getElementById("live_stream_container");
}

function removeStream(uuid) {
    let streamToRemove = document.getElementById(uuid);
    if(streamToRemove != null) {
        streamToRemove.parentNode.removeChild(streamToRemove);
    }
}

function getInsertionIndex(insertedStream, container) {
    if(insertedStream.sortingField === "Viewers" && insertedStream.sortingDirection === "desc") {
        if(insertedStream.viewersSortingInsertionIndex == Infinity) {
            console.log("Infinity rule fired");
            return 0;
        }
        if(insertedStream.viewersSortingInsertionIndex == 0) {
            console.log("Last index rule fired");
            return Infinity;
        }
        return container.childNodes.length - insertedStream.viewersSortingInsertionIndex;
    }
    if(insertedStream.sortingField === "Viewers" && insertedStream.sortingDirection === "asc") {
        if(container.childNodes.length == insertedStream.viewersSortingInsertionIndex) return Infinity;
        return insertedStream.viewersSortingInsertionIndex;
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