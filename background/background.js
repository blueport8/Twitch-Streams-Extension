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

// ### Logger ###
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

// ### Main object ###
let application = {
    startBackgroundLoop: function() {
        this.onFirstRun();
        var settingsPrepared = settingsAPI.loadSettings();
        settingsPrepared.then(function(res) {
            logger.debug("Prepared");
            application.update();
        });
    },
    onFirstRun: function() {
        browser.browserAction.setBadgeText({text: "0"});
        browser.browserAction.setBadgeBackgroundColor({color: "#6441A4"});
    },
    update: function() {
        var requestUrl = twitchAPI.follows.createUrl(settingsAPI.username_cached);
        var follows = twitchAPI.get(requestUrl);
        follows.then(twitchAPI.follows.loaded, twitchAPI.follows.notLoaded)
        .then(twitchAPI.follows.parseData, null) // Follows loaded
        .then(twitchAPI.follows.getNext, null) // Check if returned data contains more followed channels
        .then(twitchAPI.liveStream.checkAll, null)
        .then(this.showStats);
    },
    showStats: function(res) {
        logger.debug("Session: " + JSON.stringify(session, null, 4));
    }
}

let session = {
    username: "",
    followsCount: 0,
    follows: [],
    live: [],
    lastUpdateLive: []
}

let settingsAPI = {
    username_cached: "",
    refresh_rate: 120000,

    loadSettings: function() {
        return this.fetchBrowserData()
        .then((data) => {
            if (data.twitchStreamsUserName != null) {
                this.username_cached = data.twitchStreamsUserName;
                logger.debug(`Cached username: ${data.twitchStreamsUserName}`);
            }
            else {
                logger.debug("Username not found in browser data");
            }
            return data;
        })
        .then((data) => {
            if (data.twitchStreamsRefreshRate != null) {
                this.refresh_rate = data.twitchStreamsRefreshRate;
                logger.debug(`Refresh rate set to: ${data.twitchStreamsRefreshRate}ms`);
            }
            else {
                logger.debug(`Using default refresh rate: ${this.refresh_rate}ms`);
            }
        });
    },
    fetchBrowserData: function() {
        let browserStorage = browser.storage.sync.get();
        return browserStorage.then((data) => {
            logger.debug("Settings loaded");
            return data;
        },(err) => {
            logger.error(`Failed to load browser settings: ${err}`);
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

let twitchAPI = {
    get: (url) => {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.setRequestHeader("Client-ID", API_CLIENT_ID);
            xhr.onload = resolve;
            xhr.onerror = reject;
            xhr.send();
        });
    },
    follows: {
        createUrl: (username) => {
            return `https://api.twitch.tv/kraken/users/${username}/follows/channels`;
        },
        loaded: (result) => {
            var parsedResult = JSON.parse(result.explicitOriginalTarget.response);
            return parsedResult;
        },
        notLoaded: (error) => {
            var parsedError = JSON.parse(error);
            logger.debug(JSON.stringify(parsedError, null, 4));
            return parsedError;
        },
        parseData: (result) => {
            session.username = settingsAPI.username_cached;
            session.followsCount = result._total;
            result.follows.forEach((stream) => {
                session.follows.push(stream);
            });
            return result;
        },
        getNext: (result) => {
            let nextFollows = null;
            if (result._links.next != null && result.follows.length > 0) {
                nextFollows = twitchAPI.get(result._links.next);
                nextFollows.then(twitchAPI.follows.loaded, twitchAPI.follows.notLoaded)
                .then(twitchAPI.follows.parseData)
                .then(twitchAPI.follows.getNext);
            }
            return nextFollows;
        }
    },
    liveStream: {
        createUrl: (channelName) => {
            return `https://api.twitch.tv/kraken/streams/${channelName}`;
        },
        checkAll: function() {
            session.follows.forEach(stream => {
                var channelUrl = twitchAPI.liveStream.createUrl(stream.channel.name);
                var channel = twitchAPI.get(channelUrl);
                channel.then(twitchAPI.liveStream.loaded,twitchAPI.liveStream.notLoaded);
            });
        },
        loaded: (result) => {
            var parsedResult = JSON.parse(result.explicitOriginalTarget.response);
            if(parsedResult.stream != null) {
                session.live.push(parsedResult);
            }
            return parsedResult;
        },
        notLoaded: (error) => {
            var parsedError = JSON.parse(error);
            logger.debug(JSON.stringify(parsedError, null, 4));
            return parsedError;
        }
    }
    
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

//settingsAPI.loadSettings();
application.startBackgroundLoop();