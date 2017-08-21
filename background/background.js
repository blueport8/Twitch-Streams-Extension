var userUrl = "https://api.twitch.tv/kraken/users/nir94/follows/channels";
var streamUrl = "https://api.twitch.tv/kraken/streams/";
var userFollows = [];
var liveUserFollows = [];
var needToUpdateFrontEnd = false;

const client_id = "27rv0a65hae3sjvuf8k978phqhwy8v";
const updateInterval = 2 * 60 * 1000;


function run() {
    userFollows = [];
    updateFollowers();
    sleep(5000).then(() => {
        console.log("finished downloading followers");
        liveUserFollows = []
        updateLiveStreams();
    });
    sleep(4000).then(() => {
        console.log("finished checking live streams");
        needToUpdateFrontEnd = true;
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getLiveStreamCount() {
    return liveUserFollows.length;
}

function updateFollowers() {
    getFollows(userUrl, getFollowsResponseHandler);
}

function updateLiveStreams() {
    for(streamIndex = 0; streamIndex < userFollows.length; streamIndex++) {
        checkOnlineStatus(userFollows[streamIndex].channel.name, checkOnlineStatusResponseHandler);
    }
}

function checkOnlineStatus(channelName, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var JsonParsedResponse = JSON.parse(xmlHttp.responseText);
            callback(JsonParsedResponse);
        } 
    }
    xmlHttp.open("GET", streamUrl + channelName, true); // true for asynchronous 
    xmlHttp.setRequestHeader("Client-ID",client_id);
    xmlHttp.send(null);
}

function getFollows(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var JsonParsedResponse = JSON.parse(xmlHttp.responseText);
            callback(JsonParsedResponse);
        }  
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.setRequestHeader("Client-ID",client_id);
    xmlHttp.send(null);
}

function checkOnlineStatusResponseHandler(jsonResponse) {
    if(jsonResponse.stream != null) {
        liveUserFollows.push(jsonResponse.stream);
    }
}

function getFollowsResponseHandler(jsonResponse)
{
    if(jsonResponse.follows.length > 0) {
        addFollowsToList(jsonResponse.follows);
        getFollows(jsonResponse._links.next, getFollowsResponseHandler);
    }
    //console.log(userFollows);
}

function addFollowsToList(follows)
{
    for(followerIndex = 0; followerIndex < follows.length; followerIndex++) {
        userFollows.push(follows[followerIndex]);
    }
}

console.log("backend updating");
run();
var intervalID = setInterval(
    function() {
        console.log("backend updating");
        run();
    },
    updateInterval
)