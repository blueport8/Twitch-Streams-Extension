const updateInterval = 30 * 1000;

//var followers = document.getElementById("follows");
var active_stream_count = document.getElementById("active_stream_count");
var debug_data = document.getElementById("debug");

var backendPage = browser.extension.getBackgroundPage();

function run() {
    debug_data.innerHTML = backendPage.updateInProgress();
    if(backendPage.updateInProgress()) {
        // Wait for backend to update itself
        var updateIntervalID = setInterval(
            function() {
                debug_data.innerHTML = backendPage.updateInProgress();
                if(!backendPage.updateInProgress()) {
                    clearInterval(updateIntervalID);
                    updateFollows();
                }
            },
            1000
        );
    }
    else {
        updateFollows();
    }
}

function updateFollows() {
    active_stream_count.innerHTML = backendPage.getLiveStreamCount();
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