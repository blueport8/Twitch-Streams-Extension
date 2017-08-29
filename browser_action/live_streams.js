const updateInterval = 1000;

var active_stream_count = document.getElementById("active_stream_count");
var follower_count = document.getElementById("followed_stream_count");
var live_streams = document.getElementById("live_stream_container");


var BACKGROUNDPAGE = browser.extension.getBackgroundPage();

function run() {
    if(BACKGROUNDPAGE.getUpdateState()) {
        // Wait for backend to update itself
        var updateIntervalID = setInterval(
            function() {
                if(!BACKGROUNDPAGE.getUpdateState()) {
                    clearInterval(updateIntervalID);
                    updateFrontend();
                }
            },
            1000
        );
    }
    else {
        updateFrontend();
    }
}

function updateFrontend() {
    active_stream_count.innerHTML = BACKGROUNDPAGE.getLiveStreamCount();
    follower_count.innerHTML = BACKGROUNDPAGE.getFollowsCount();
    live_streams.innerHTML = BACKGROUNDPAGE.getLiveStreams();
    updateEventListeners();
}

function updateEventListeners() {
    var links = document.getElementsByClassName("stream_link");
    for(linkIndex = 0; linkIndex < links.length; linkIndex++) {
        var link = links[linkIndex];
        var channel_name_list = link.getElementsByClassName("channel_name");
        var channel_name = channel_name_list[0];

        link.onclick = (function() {
            var local_channel_name = channel_name.innerHTML;
            return function() {
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
run();
var intervalID = setInterval(
    function() {
        console.log("frontend updataing");
        run();
    },
    updateInterval
)