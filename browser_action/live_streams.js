"use strict"
// Background access
let BACKGROUNDPAGE = browser.extension.getBackgroundPage();

// Constants
const DEBUG = false;
const LONG_UPDATERATE =  10000; // 10s
const SHORT_UPDATERATE =  1000; // 1s

// Start of application
shortUpdateRateHandler();
longUpdateRateHandler();
setInterval(shortUpdateRateHandler, SHORT_UPDATERATE);
setInterval(longUpdateRateHandler, LONG_UPDATERATE);

function shortUpdateRateHandler() {
    console.log("Short update handler fired");
    updateFollows();
}

function longUpdateRateHandler() {
    console.log("Long update handler fired");
    updateLiveStreams();
}

function updateFollows() {
    let session = BACKGROUNDPAGE.getCurrentSession();
    document.getElementById("active_stream_count").textContent = session.live.length;
    document.getElementById("followed_stream_count").textContent = session.follows.length;
}

function updateLiveStreams() {
    const parser = new DOMParser()
    const parsed = parser.parseFromString(BACKGROUNDPAGE.getLiveStreams(), `text/html`)
    const tag = parsed.getElementsByTagName(`body`)[0]
    document.getElementById("live_stream_container").innerHTML = ``
    document.getElementById("live_stream_container").appendChild(tag)
    updateEventListeners();
}

function updateEventListeners() {
    let links = document.getElementsByClassName("stream_link");
    for(let linkIndex = 0; linkIndex < links.length; linkIndex++) {
        let link = links[linkIndex];
        let channel_name_list = link.getElementsByClassName("channel_name");
        let channel_name = channel_name_list[0];

        link.onclick = (function() {
            let local_channel_name = channel_name.innerHTML;
            return () => {
                openStream(local_channel_name);
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