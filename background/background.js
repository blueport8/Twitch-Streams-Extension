"use strict"
// var username = "";
var streamUrl = "https://api.twitch.tv/kraken/streams/";

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
            setTimeout(application.update, settingsAPI.refresh_rate);
        });
    },
    onFirstRun: function() {
        browser.browserAction.setBadgeText({text: "0"});
        browser.browserAction.setBadgeBackgroundColor({color: "#6441A4"});
    },
    update: function() {
        var requestDetails = {
            getNext: true,
            username: settingsAPI.username_cached,
            offset: 0
        }
        while(requestDetails.getNext) {
            var requestUrl = twitchAPI.follows.createUrl(requestDetails);
            var response = twitchAPI.getSync(requestUrl);
            var parsedResponse = twitchAPI.follows.parse(response);
            twitchAPI.follows.process(parsedResponse);

            if(parsedResponse.follows.length == 0)
                requestDetails.getNext = false;
            else
                requestDetails.offset += 25;
        }
        logger.debug("Finished loading follows!");
        twitchAPI.liveStream.processAll();
    }
}

let session = {
    username: "",
    followsCount: 0,
    follows: [],
    live: [],
    lastUpdateLive: []
}

function getCurrentSession() {
    return session;
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
    getAsync: (url) => {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.setRequestHeader("Client-ID", API_CLIENT_ID);
            xhr.onload = resolve;
            xhr.onerror = reject;
            xhr.send();
        });
    },
    getSync: (url) => {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.setRequestHeader("Client-ID", API_CLIENT_ID);
        xhr.send();
        if(xhr.status === 200)
            return xhr.responseText;
        else
            return "";
    },
    follows: {
        createUrl: (requestDetails) => {
            return `https://api.twitch.tv/kraken/users/${requestDetails.username}/follows/channels?direction=DESC&limit=25&offset=${requestDetails.offset}&sortby=created_at&user=${requestDetails.username}`;
        },
        parse: (response) => {
            var parsedResponse = JSON.parse(response);
            return parsedResponse
        },
        process: (parsedResponse) => {
            session.username = settingsAPI.username_cached;
            session.followsCount = parsedResponse._total;
            parsedResponse.follows.forEach((stream) => {
                session.follows.push(stream);
            });
        }
    },
    liveStream: {
        createUrl: (channelName) => {
            return `https://api.twitch.tv/kraken/streams/${channelName}`;
        },
        processAll: function() {
            session.follows.forEach(stream => {
                var channelUrl = twitchAPI.liveStream.createUrl(stream.channel.name);
                var channel = twitchAPI.getAsync(channelUrl);
                channel.then(twitchAPI.liveStream.loaded,twitchAPI.liveStream.notLoaded);
            });
        },
        loaded: (result) => {
            var parsedResult = JSON.parse(result.explicitOriginalTarget.response);
            var channelFound = session.live.find(channel => channel._links.self == parsedResult._links.self)
            if(parsedResult.stream != null && (channelFound === undefined)) { // Live
                session.live.push(parsedResult);
                twitchAPI.liveStream.updateBadge();
            }
            else { // Offline
                session.live = session.live.filter(channel => channel._links.self !== parsedResult._links.self)
            }
            return parsedResult;
        },
        notLoaded: (error) => {
            var parsedError = JSON.parse(error);
            logger.debug(JSON.stringify(parsedError, null, 4));
            return parsedError;
        },
        updateBadge: () => {
            browser.browserAction.setBadgeText({text: (session.live.length).toString()});
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
    return session.live.length;
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