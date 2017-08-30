// Background access
let BACKGROUNDPAGE = browser.extension.getBackgroundPage();

// Constants
const DEBUG = false;
const UPDATERATE =  1000; // 1s

// Start of application
startApplication();

let startApplication = () => {
    // Setup event listeners
    if(DEBUG) {
        console.log("[Debug][Follows] Seting up listeners...");
    }
    let activeStreamCount_Element = document.getElementById("active_stream_count");
    let followerCount_Element = document.getElementById("followed_stream_count");
    let liveStreams_Element = document.getElementById("live_stream_container");
    if(DEBUG) {
        console.log("[Debug][Follows] Listeners set.");
    }

    startUpdateLoop(activeStreamCount_Element, followerCount_Element, liveStreams_Element);
}

let startUpdateLoop(activeStreamCount_Element, followerCount_Element, liveStreams_Element) {
    if(DEBUG) {
        console.log("[Debug][Follows] Starting update loop...");
    }
    setInterval(
        () => {
            if(updateRequired()) {
                runUpdate();
            }
        },
        UPDATERATE
    )
}

let runUpdate = () => {
    if(DEBUG) {
        console.log("[Debug][Follows] Performing update...");
    }

    if(BACKGROUNDPAGE.getUpdateState()) {
        // Wait for backend to update itself
        let updateIntervalID = setInterval(
            () => {
                if(!BACKGROUNDPAGE.getUpdateState()) {
                    clearInterval(updateIntervalID);
                    updateFrontend();
                }
            },
            500
        );
    }
    else {
        updateFrontend();
    }
}

let updateRequired = () => {
    return BACKGROUNDPAGE.getUpdateState();
}

let updateFrontend = () => {
    activeStreamCount_Element.innerHTML = BACKGROUNDPAGE.getLiveStreamCount();
    followerCount_Element.innerHTML = BACKGROUNDPAGE.getFollowsCount();
    liveStreams_Element.innerHTML = BACKGROUNDPAGE.getLiveStreams();
    updateEventListeners();
}

let updateEventListeners = () = {
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

let openStream = (channel_name) => {
    browser.tabs.create({
        url:"https://twitch.tv/" + channel_name,
        active: true
    });
}

console.log("frontend updataing");
runUpdate();
