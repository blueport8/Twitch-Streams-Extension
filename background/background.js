"use strict"
// var username = "";
var streamUrl = "https://api.twitch.tv/kraken/streams/";
// var userFollows = [];
var liveUserFollows = [];
var needToUpdateFrontEnd = false;

var followsUpdateInProgress = false;
var liveStreamsUpdateInProgress = false;
var lastUpdateDate = "never";
var liveStreamsChecked = 0;
var liveStreamsUpdateRequired = false;
var debugInformationUpdateRequired = false;

const API_CLIENT_ID = "27rv0a65hae3sjvuf8k978phqhwy8v";
const UPDATERATE = 60 * 1000; // 1min

var logger = {
    debugEnabled: true,
    warningEnabled: true,
    errorEnabled: true,

    debug: function(message) {
        if (this.debugEnabled) {
            console.log("[TwitchStreams] " + message);
        }
    },
    warn: function(message) {
        if (this.warningEnabled) {
            console.warn("[TwitchStreams] " + message);
        }
    },
    error: function(message) {
        if (this.errorEnabled) {
            console.error("[TwitchStreams] " + message);
        }
    }
}

let user = {
    name: "",
    userFollows: [],
    updateRate: 1000 * 60 * 5, // 5min

    passiveUpdate: () => {
        setInterval(updateData,this.updateRate);
    },
    updateData: () => {
        
    },
    getUserUrl: () => {
        return `https://api.twitch.tv/kraken/users/${this.name}/follows/channels`;
    }
}

let settingsAPI = {
    username_cached: "",
    refresh_rate: 120000,

    loadSettings: function() {
        this.fetchBrowserData()
        .then((data) => {
            if (data.twitchStreamsUserName != null) {
                this.username_cached = data.twitchStreamsUserName;
                logger.debug("Cached username: " + data.twitchStreamsUserName);
            }
            else {
                logger.debug("Username not found in browser data");
            }
            return data;
        })
        .then((data) => {
            if (data.twitchStreamsRefreshRate != null) {
                this.refresh_rate = data.twitchStreamsRefreshRate;
                logger.debug("Refresh rate set to: " + data.twitchStreamsRefreshRate + "ms");
            }
            else {
                logger.debug("Using default refresh rate: " + this.refresh_rate + "ms");
            }
        });
    },
    fetchBrowserData: function() {
        let browserStorage = browser.storage.sync.get();
        return browserStorage.then((data) => {
            logger.debug("Settings loaded");
            return data;
        },(err) => {
            logger.error("Failed to load browser settings: " + err);
        });
    },
    setBrowserData: function(username) {
        browser.storage.sync.set({ "twitchStreamsUserName": username })
        .then(() => {
            logger.debug("Succesfully set browser data");
        }, () => {
            logger.error("Failed to save browser data");
        });
    }
}

let application = {
    startBackground: () => {
        settingsAPI.fetchBrowserData().then(doBackgroundStuff);
    },
    doBackgroundStuff: () => {

    },
    onFirstRun: () => {
        browser.browserAction.setBadgeText({text: "0"});
        browser.browserAction.setBadgeBackgroundColor({color: "#6441A4"});
    },
    onError: (error) => {
        console.log(error);
    }
}

// let loadSettings = () => {
//     settingsAPI.getUsername();
// }

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

// function onGotSettings(item) {
//     console.log(item);
//     if(item.twitch_streams_username != null) {
//         username = item.twitch_streams_username;
//     }
//     startBackground();
// }

// function onError(error) {
//     console.log(error);
// }

// function onFirstRun() {
//     browser.browserAction.setBadgeText({text: "0"});
//     browser.browserAction.setBadgeBackgroundColor({color: "#6441A4"})
// }

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

settingsAPI.loadSettings();
