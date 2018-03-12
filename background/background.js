"use strict"
const API_CLIENT_ID = "27rv0a65hae3sjvuf8k978phqhwy8v";

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
        this.setBadgeDefaultValues();
        settingsAPI.loadSettings().then((res) => {
            logger.debug("Settings loaded");
            application.update();
        });
    },
    setBadgeDefaultValues: function() {
        browser.browserAction.setBadgeText({text: "0"});
        browser.browserAction.setBadgeBackgroundColor({color: "#6441A4"});
    },
    update: function() {
        let refreshRate = settingsAPI.refresh_rate;
        application.fastUpdate();
        setTimeout(application.update, refreshRate);
    },
    fastUpdate: function() {
        // Get inital followers asynchronously
        let requestUrl = twitchAPI.follows.createUrl({ username: settingsAPI.username_cached, offset: 0 });
        twitchAPI.getAsync(requestUrl).then((response) => {
            let parsedResponse = twitchAPI.follows.parse(response.explicitOriginalTarget.response);
            console.log(parsedResponse);
            twitchAPI.liveStream.processResult(parsedResponse.follows);
            let requestDetails = {
                getNext: (parsedResponse.follows.length > 0),
                username: settingsAPI.username_cached,
                offset: parsedResponse.follows.length,
                total: parsedResponse._total
            }
            // Process if more follows present process them
            while(requestDetails.offset < requestDetails.total) {
                let requestUrl = twitchAPI.follows.createUrl(requestDetails)
                requestDetails.offset += parsedResponse.follows.length;
                twitchAPI.getAsync(requestUrl).then((response) => {
                    let parsedResponse = twitchAPI.follows.parse(response.explicitOriginalTarget.response);
                    twitchAPI.liveStream.processResult(parsedResponse.follows);
                });
            }
        });

        // while(requestDetails.getNext) {
        //     let requestUrl = twitchAPI.follows.createUrl(requestDetails);

        //     var response = twitchAPI.getSync(requestUrl);
        //     var parsedResponse = twitchAPI.follows.parse(response);
        //     twitchAPI.follows.process(parsedResponse);

        //     if(parsedResponse.follows.length == 0)
        //         requestDetails.getNext = false;
        //     else
        //         requestDetails.offset += 25;
        // }
        // logger.debug("Finished loading follows!");
        // twitchAPI.liveStream.processAll();
    }
}

let session = {
    username: "",
    followsCount: 0,
    follows: [],
    live: []
}

let settingsAPI = {
    username_cached: "",
    refresh_rate: 60000,

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
                var channelFound = session.follows.find(channel => channel._links.self == stream._links.self)
                if(channelFound === undefined)
                    session.follows.push(stream);
            });
        }
    },
    liveStream: {
        createUrl: (channelName) => {
            return `https://api.twitch.tv/kraken/streams/${channelName}`;
        },
        processResult: function(follows) {
            follows.forEach(stream => {
                var channelUrl = twitchAPI.liveStream.createUrl(stream.channel.name);
                var channel = twitchAPI.getAsync(channelUrl);
                channel.then(twitchAPI.liveStream.loaded,twitchAPI.liveStream.notLoaded);
            });
        },
        // processAll: function() {
        //     session.follows.forEach(stream => {
        //         var channelUrl = twitchAPI.liveStream.createUrl(stream.channel.name);
        //         var channel = twitchAPI.getAsync(channelUrl);
        //         channel.then(twitchAPI.liveStream.loaded,twitchAPI.liveStream.notLoaded);
        //     });
        // },
        loaded: (result) => {
            var parsedResult = JSON.parse(result.explicitOriginalTarget.response);
            if(parsedResult.hasOwnProperty(status) && parsedResult.status != 200) {
                console.log("Error while loading stream: " + parsedResult.error + " ,status: " + parsedResult.status);
                return;
            }
            var channelOnList = session.live.find(channel => channel._links.self == parsedResult._links.self);
            if(channelOnList !== undefined) { // On the list
                if (parsedResult.stream === null) { // Need to remove from list
                    var index = session.live.indexOf(channelOnList);
                    session.live.splice(index, 1);
                    twitchAPI.liveStream.updateBadge();
                }
            }
            else { // Not on the list
                if (parsedResult.stream !== null) { // stream online and not on the list
                    session.live.push(parsedResult);
                    twitchAPI.liveStream.updateBadge();
                }
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

// PUBLIC FUNCTIONS - START

function getCurrentSession() {
    return session;
}

function getLiveStreamCount() {
    return session.live.length;
}

function getFollowsCount() {
    return userFollows.length;
}

function setUsername(username) {
    settingsAPI.setBrowserData(username);
}

function getUsername() {
    return session.username;
}

function getLiveStreams() {
    var liveStreams = "";
    var liveChannels = session.live;
    for(let streamIndex = 0; streamIndex < liveChannels.length; streamIndex++) {
        liveStreams += getLiveStream(liveChannels[streamIndex].stream.channel, liveChannels[streamIndex].stream.viewers, liveChannels[streamIndex].stream.preview.large);
    }
    return liveStreams;
}

function forceRefresh() {
    application.fastUpdate();
}

// PUBLIC FUNCTIONS - END

application.startBackgroundLoop();