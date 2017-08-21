const updateInterval = 30 * 1000;

var followers = document.getElementById("follows");
var live_count = document.getElementById("live_count");

var backendPage = browser.extension.getBackgroundPage();

function run() {
    if(backendPage.needToUpdateFrontEnd) {
        followers.innerHTML = "True";
        live_count.innerHTML = backendPage.getLiveStreamCount();
        backendPage.needToUpdateFrontEnd = false;
    }
    else {
        followers.innerHTML = "False";
    }
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