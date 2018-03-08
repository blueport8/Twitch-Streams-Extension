// Background access
let BACKGROUNDPAGE = browser.extension.getBackgroundPage();

// Constants
const DEBUG = false;
const UPDATERATE =  5000; // 5s

// Start of application
startApplication();

function startApplication() {
    runUpdate();
    startUpdateLoop();
}

function startUpdateLoop() {
    if(DEBUG) {
        console.log("[Debug][Follows] Starting update loop...");
    }
    setInterval(runUpdate, UPDATERATE);
}

function runUpdate() {
    if(DEBUG) {
        console.log("[Debug][Follows] Performing update...");
    }
    updateFrontend();
}

function updateRequired() {
    return BACKGROUNDPAGE.getUpdateState();
}

function updateFrontend() {
    let session = BACKGROUNDPAGE.getCurrentSession();
    document.getElementById("active_stream_count").innerHTML = session.live.length;
    document.getElementById("followed_stream_count").innerHTML = session.follows.length;
    //activeStreamCount_Element.innerHTML = BACKGROUNDPAGE.getLiveStreamCount();
    //followerCount_Element.innerHTML = BACKGROUNDPAGE.getFollowsCount();
    //liveStreams_Element.innerHTML = BACKGROUNDPAGE.getLiveStreams();
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
}

console.log("frontend updataing");
//runUpdate();
