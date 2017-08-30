// var username = "";
var streamUrl = "https://api.twitch.tv/kraken/streams/";
var userFollows = [];
var liveUserFollows = [];
var needToUpdateFrontEnd = false;

var followsUpdateInProgress = false;
var liveStreamsUpdateInProgress = false;
var lastUpdateDate = "never";
var liveStreamsChecked = 0;
var liveStreamsUpdateRequired = false;
var debugInformationUpdateRequired = false;

const API_CLIENT_ID = "27rv0a65hae3sjvuf8k978phqhwy8v";
const UPDATERATE = 3 * 60 * 1000; // 3min
const DEBUG = false;


let user = {
    name: "",
    getUrl: function() {
        return `https://api.twitch.tv/kraken/users/${this.name}/follows/channels`;
    }
}

let settings = {
    twitch_streams_username: "",

    getBrowserData: function() {
        var data = browser.storage.sync.get();
        settings.then(this.onGotSetting, onError);
    },
    setBrowserData: function(name) {
        browser.storage.sync.set({"twitch_streams_username": name});
        setting.then(null, application.onError);
    },
    onGotSetting: function(item) {
        if(item.twitch_streams_username != null) {
            this.twitch_streams_username = item.twitch_streams_username;
        }
    },

    getUserName: function() {
        if(twitch_streams_username == "") {
            this.getBrowserData();
        }
    }
}

let application = {
    startBackground: function() {
        settings.getBrowserData().then(doBackgroundStuff);
    },
    doBackgroundStuff: function() {

    },
    onError: function(error) {
        console.log(error);
    }
}

function loadSettings() {
    getUsername();
}

// function setUsername(name) {
//     username = name;
//     let setting = browser.storage.sync.set({"twitch_streams_username": name});
//     console.log("setting username");
//     setting.then(null, onError);
// }

// function getUsername() {
//     let settings = browser.storage.sync.get();
//     settings.then(onGotSettings, onError);
// }

function onGotSettings(item) {
    console.log(item);
    if(item.twitch_streams_username != null) {
        username = item.twitch_streams_username;
    }
    startBackground();
}

// function onError(error) {
//     console.log(error);
// }

function onFirstRun() {
    browser.browserAction.setBadgeText({text: "0"});
    browser.browserAction.setBadgeBackgroundColor({color: "#6441A4"})
}

function runUpdate() {
    console.log("backend updating");
    updateFollowers();
    var checkFollowsUpdateProgress = setInterval(
        function() {
            if(followsUpdateInProgress == false) {
                clearInterval(checkFollowsUpdateProgress);
                console.log("finished downloading followers");

                updateLiveStreams();
                var checkLiveStreamsUpdateProgress = setInterval(
                    function() {
                        if(liveStreamsUpdateInProgress == false) {
                            clearInterval(checkLiveStreamsUpdateProgress);
                            console.log("finished checking live streams");
                            var update_date = new Date();
                            lastUpdateDate = update_date.getFullYear() + "/" + update_date.getMonth() + "/" + update_date.getDay() + " " + update_date.getHours() + ":" + update_date.getMinutes() + ":" + update_date.getSeconds();
                            updateBadge();
                            needToUpdateFrontEnd = true;
                        }
                    },
                    100
                );
            }
        },
        100
    );
}

function getLiveStreamCount() {
    return liveUserFollows.length;
}

function getFollowsCount() {
    return userFollows.length;
}

function getLastUpdateDate() {
    return lastUpdateDate;
}

function getUpdateState() {
    return (followsUpdateInProgress || liveStreamsUpdateInProgress);
}

function getLiveStreams() {
    var liveStreams = "";
    for(streamIndex = 0; streamIndex < liveUserFollows.length; streamIndex++) {
        liveStreams += getLiveStream(liveUserFollows[streamIndex].channel, liveUserFollows[streamIndex].viewers, liveUserFollows[streamIndex].preview.large);
    }
    return liveStreams;
}

function updateBadge(){
    console.log("badge text updated");
    browser.browserAction.setBadgeText({text: (getLiveStreamCount()).toString()});
}

function updateFollowers() {
    userFollows = [];
    followsUpdateInProgress = true;
    getFollows(user.getUrl(), getFollowsResponseHandler);
}

function updateLiveStreams() {
    liveUserFollows = []
    liveStreamsUpdateInProgress = true;
    liveStreamsChecked = 0;
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
    xmlHttp.setRequestHeader("Client-ID",API_CLIENT_ID);
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
    xmlHttp.setRequestHeader("Client-ID",API_CLIENT_ID);
    xmlHttp.send(null);
}

function checkOnlineStatusResponseHandler(jsonResponse) {
    if(jsonResponse.stream != null) {
        liveUserFollows.push(jsonResponse.stream);
    }
    liveStreamsChecked++;
    if(liveStreamsChecked == userFollows.length) {
        liveStreamsUpdateInProgress = false;
    }
}

function getFollowsResponseHandler(jsonResponse)
{
    if(jsonResponse.follows.length > 0) {
        addFollowsToList(jsonResponse.follows);
        getFollows(jsonResponse._links.next, getFollowsResponseHandler);
    }
    else {
        followsUpdateInProgress = false;
    }
}

function addFollowsToList(follows)
{
    for(followerIndex = 0; followerIndex < follows.length; followerIndex++) {
        userFollows.push(follows[followerIndex]);
    }
}

function startBackground() {
    console.log("backend updating");
    onFirstRun();
    runUpdate();
    var intervalID = setInterval(
        function() {
            runUpdate();
        },
        UPDATERATE
    )
}

loadSettings();
