"use strict"
// Background access
let BACKGROUNDPAGE = browser.extension.getBackgroundPage();

// Start of application
startApplication();

function startApplication() {
    // Setup event listeners
    document.getElementById("refresh_button").addEventListener("click", refreshData, false);
    document.getElementById("follows_button").addEventListener("click", loadFollowsPage, false);
    document.getElementById("settings_button").addEventListener("click", loadSettingsPage, false);
    browser.runtime.onMessage.addListener(closePopup);
}

function refreshData() {
    console.log("Forcing update");
    BACKGROUNDPAGE.forceRefresh();
}

function loadFollowsPage() {
    document.getElementById("content_iframe").src = "pages/live_streams.html";
}

function loadSettingsPage() {
    document.getElementById("content_iframe").src = "pages/settings.html";
}

function closePopup(message) {
    if(message.subject === "background.close_popup") {
        window.close();
    }
}

window.addEventListener('unload', function(event) {
    // browser.runtime.sendMessage caused an error - this is a workaround
    BACKGROUNDPAGE.messageReceived({"title": "frontend_popup_closed"});
}, false);

window.addEventListener('load', function(event) {
    browser.runtime.sendMessage({"title": "frontend_popup_opened"});
}, false);


updateFollows();
browser.runtime.onMessage.addListener(beckendUpdateListener);

function updateFollows() {
    let session = BACKGROUNDPAGE.getCurrentSession();
    document.getElementById("active_stream_count").textContent = session.live.length;
    document.getElementById("followed_stream_count").textContent = session.follows.length;
}

function beckendUpdateListener(request, sender, sendResponse) {
    if (request.subject === "update_live_follows_count" || request.subject === "update_stream_list") {
        console.log("Received live stream count and follow count update");
        updateFollows();
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
}