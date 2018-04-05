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
            application.fastUpdate();
            passiveUpdateEngine.start();
        });
    },
    setBadgeDefaultValues: function() {
        browser.browserAction.setBadgeText({text: "0"});
        browser.browserAction.setBadgeBackgroundColor({color: "#6441A4"});
    },
    passiveUpdate: function() {
        setTimeout(passiveUpdateEngine.start, 180000);
    },
    fastUpdate: function() {
        // Get inital followers asynchronously
        let requestUrl = twitchAPI.follows.createUrl({ username: settingsAPI.username_cached, offset: 0 });
        twitchAPI.getAsync(requestUrl).then((response) => {
            let parsedResponse = twitchAPI.follows.parse(response.explicitOriginalTarget.response);
            //console.log(parsedResponse);
            twitchAPI.liveStream.processResult(parsedResponse.follows);
            let requestDetails = {
                getNext: (parsedResponse.follows.length > 0),
                username: settingsAPI.username_cached,
                offset: parsedResponse.follows.length,
                total: parsedResponse._total
            }
            // Process remaining follows
            while(requestDetails.offset < requestDetails.total) {
                let requestUrl = twitchAPI.follows.createUrl(requestDetails)
                requestDetails.offset += parsedResponse.follows.length;
                twitchAPI.getAsync(requestUrl).then((response) => {
                    let parsedResponse = twitchAPI.follows.parse(response.explicitOriginalTarget.response);
                    twitchAPI.liveStream.processResult(parsedResponse.follows);
                });
            }
            notificationEngine.start();
        });
    }
}

let session = {
    username: "",
    followsCount: 0,
    follows: [],
    live: []
}

let settingsAPI = {
    // Foreground
    username_cached: "",
    sorting_field: "Viewers",
    sorting_direction: "desc",
    // Background
    refresh_rate: 60000,

    loadSettings: function() {
        return this.fetchBrowserData()
        .then((data) => {
            settingsAPI.username_handler(data);
            return data;
        })
        .then((data) => {
            settingsAPI.refresh_rate_handler(data);
            return data;
        })
        .then((data) => {
            settingsAPI.sorting_field_handler(data);
            return data;
        })
        .then((data) => {
            settingsAPI.sorting_direction_handler(data);
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
    setBrowserData: function(settingsSnapshot) {
        browser.storage.sync.set({ "twitchStreamsUserName": settingsSnapshot.username });
        browser.storage.sync.set({ "twitchStreamsSortingField": settingsSnapshot.sortingField });
        browser.storage.sync.set({ "twitchStreamsSortingDirection": settingsSnapshot.sortingDirection });
        logger.debug("Succesfully set browser data");
        this.username_cached = settingsSnapshot.username;
        this.sorting_field = settingsSnapshot.sortingField;
        this.sorting_direction = settingsSnapshot.sortingDirection;
        session.username = settingsSnapshot.username;
        session.followsCount = 0;
        session.follows = [];
        session.live = [];
        twitchAPI.liveStream.updateBadge();
        application.fastUpdate();
    },
    // Settings processors
    username_handler: function(data) {
        if (data.twitchStreamsUserName != null) {
                this.username_cached = data.twitchStreamsUserName;
                session.username = data.twitchStreamsUserName;
                logger.debug(`Cached username: ${data.twitchStreamsUserName}`);
        }
        else {
            logger.debug("Username not found in browser data");
        }
    },
    refresh_rate_handler: function(data) {
        if (data.twitchStreamsRefreshRate != null) {
                this.refresh_rate = data.twitchStreamsRefreshRate;
                logger.debug(`Refresh rate set to: ${data.twitchStreamsRefreshRate}ms`);
        }
        else {
            logger.debug(`Using default refresh rate: ${this.refresh_rate}ms`);
        }
    },
    sorting_field_handler: function(data) {
        if (data.twitchStreamsSortingField != null) {
            this.sorting_field = data.twitchStreamsSortingField;
            logger.debug(`Loaded sorting field ${data.twitchStreamsSortingField}`);
        }
        else {
            logger.debug(`Sorting field not found. Using default: ${this.sorting_field}`);
        }
    },
    sorting_direction_handler: function(data) {
        if (data.twitchStreamsSortingDirection != null) {
            this.sorting_direction = data.twitchStreamsSortingDirection;
            logger.debug(`Loaded sorting direction ${data.twitchStreamsSortingDirection}`);
        }
        else {
            logger.debug(`Sorting direction not found. Using default: ${this.sorting_field}`);
        }
    }
}

let passiveUpdateEngine = {
    slowUpdateQueue: {
        followsUrls: [], // quequed urls
        follows: [] // queued follows
    },
    followsProcessed: [], // follows already processed in this slow update run
    start: () => {
        setInterval(passiveUpdateEngine.every2secounds, 2000);
        setInterval(passiveUpdateEngine.every60secounds, 60000);
    },
    every2secounds: () => {
        if(passiveUpdateEngine.slowUpdateQueue.follows.length > 0) {
            var followedChannel = passiveUpdateEngine.slowUpdateQueue.follows[0];
            passiveUpdateEngine.slowUpdateQueue.follows.splice(0, 1);
            passiveUpdateEngine.followsProcessed.push(followedChannel);
            var channelUrl = twitchAPI.liveStream.createUrl(followedChannel.channel.name);
            twitchAPI.getAsync(channelUrl)
                .then(twitchAPI.liveStream.loaded,twitchAPI.liveStream.notLoaded);
        }
    },
    every60secounds: () => {
        if(passiveUpdateEngine.slowUpdateQueue.followsUrls.length == 0) {
            let requestData = { username: settingsAPI.username_cached, offset: 0 }
            // Check if any data was processed in last run if so, update session follows count
            if(passiveUpdateEngine.followsProcessed.length > 0) {
                session.follows = passiveUpdateEngine.followsProcessed;
                passiveUpdateEngine.followsProcessed = [];
            }
            // Generate new downlaod links
            while(requestData.offset < session.follows.length) {
                let url = twitchAPI.follows.createUrl(requestData);
                requestData.offset += 25;
                passiveUpdateEngine.slowUpdateQueue.followsUrls.push(url);
            }
        }
        var followsUrl = passiveUpdateEngine.slowUpdateQueue.followsUrls[0];
        passiveUpdateEngine.slowUpdateQueue.followsUrls.splice(0, 1);
        twitchAPI.getAsync(followsUrl).then((response) => {
            let parsedResponse = twitchAPI.follows.parse(response.explicitOriginalTarget.response);
            parsedResponse.follows.forEach((channel) => {
                passiveUpdateEngine.slowUpdateQueue.follows.push(channel);
            });
        });
    }
}

let notificationEngine = {
    toNotify: [],
    start: () => {
        setInterval(notificationEngine.handler, 10000);
    },
    handler: () => {
        if (notificationEngine.toNotify.length > 1) {
            let channel = notificationEngine.toNotify[0];
            let live = notificationEngine.toNotify.length - 1;
            browser.notifications.create({
                "type": "basic",
                "iconUrl": browser.extension.getURL("icons/twitch-48.png"),
                "title": "Twitch streams",
                "message": channel + " and " + live + " other channels are live."
            });
            notificationEngine.toNotify = [];
        }
        else if (notificationEngine.toNotify.length == 1) {
            let channel = notificationEngine.toNotify[0];
            let live = notificationEngine.toNotify.length - 1;
            browser.notifications.create({
                "type": "basic",
                "iconUrl": browser.extension.getURL("icons/twitch-48.png"),
                "title": "Twitch streams",
                "message": "Channel " + channel + " is live."
            });
            notificationEngine.toNotify = [];
        }
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
                let channelFound = session.follows.find(channel => channel._links.self == stream._links.self)
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
                var channelIndex = session.follows.findIndex(channel => channel._links.self == stream._links.self)
                if(channelIndex == -1)
                    session.follows.push(stream);
                var channelUrl = twitchAPI.liveStream.createUrl(stream.channel.name);
                twitchAPI.getAsync(channelUrl)
                .then(twitchAPI.liveStream.loaded,twitchAPI.liveStream.notLoaded);
            });
        },
        loaded: (result) => {
            var parsedResult = JSON.parse(result.explicitOriginalTarget.response);
            if(parsedResult.hasOwnProperty(status) && parsedResult.status != 200) {
                console.log("Error while loading stream: " + parsedResult.error + " ,status: " + parsedResult.status);
                return;
            }
            let channelIndex = session.live.findIndex(channel => channel._links.self == parsedResult._links.self);
            if(channelIndex !== -1) { // On the list
                if (parsedResult.stream === null) { // Offline - need to remove from list
                    session.live.splice(channelIndex, 1);
                    twitchAPI.liveStream.updateBadge();
                }
                else
                { // Update channel to new version
                    session.live[channelIndex].stream = parsedResult.stream;
                }
            }
            else { // Not on the list
                if (parsedResult.stream !== null) { // Stream live and not on the list - add to list
                    session.live.push(parsedResult);
                    notificationEngine.toNotify.push(parsedResult.stream.channel.name);
                    twitchAPI.liveStream.updateBadge();
                }
            }
            return parsedResult;
        },
        notLoaded: (error) => {
            //var parsedError = JSON.parse(error);
            logger.debug(error);
            return error;
        },
        updateBadge: () => {
            browser.browserAction.setBadgeText({text: (session.live.length).toString()});
        }
    }
    
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

function saveSettings(settingsSnapshot) {
    settingsAPI.setBrowserData(settingsSnapshot);
}

function getSettings() {
    return {
        username: settingsAPI.username_cached,
        sortingField: settingsAPI.sorting_field,
        sortingDirection: settingsAPI.sorting_direction
    }
}

function getUsername() {
    return session.username;
}

function getLiveStreams() {
    var liveStreams = "";
    var liveChannels = session.live;
    // sort live streams before displaying
    // liveChannels.sort((streamA, streamB) => {
    //     if (streamA.stream.viewers < streamB.stream.viewers) return 1;
    //     if (streamA.stream.viewers > streamB.stream.viewers) return -1;
    //     return 0;
    // });
    sortLiveChannels();
    for(let streamIndex = 0; streamIndex < liveChannels.length; streamIndex++) {
        liveStreams += getLiveStream(liveChannels[streamIndex].stream.channel, liveChannels[streamIndex].stream.viewers, liveChannels[streamIndex].stream.preview.medium);
    }
    return liveStreams;
}

function forceRefresh() {
    application.fastUpdate();
}

// PUBLIC FUNCTIONS - END

function sortLiveChannels() {
    let liveChannels = session.live;
    let sortingDirection = settingsAPI.sorting_direction;
    let sortingField = settingsAPI.sorting_field;

    if (sortingField === "Viewers" && sortingDirection === "desc") {
        liveChannels.sort((streamA, streamB) => {
        if (streamA.stream.viewers < streamB.stream.viewers) return 1;
        if (streamA.stream.viewers > streamB.stream.viewers) return -1;
        return 0;
        });
    }
    if (sortingField === "Viewers" && sortingDirection === "asc") {
        liveChannels.sort((streamA, streamB) => {
        if (streamA.stream.viewers > streamB.stream.viewers) return 1;
        if (streamA.stream.viewers < streamB.stream.viewers) return -1;
        return 0;
        });
    }
    if (sortingField === "Channel name" && sortingDirection === "desc") {
        name
        liveChannels.sort((streamA, streamB) => {
        if (streamA.stream.channel.name < streamB.stream.channel.name) return 1;
        if (streamA.stream.channel.name > streamB.stream.channel.name) return -1;
        return 0;
        });
    }
    if (sortingField === "Channel name" && sortingDirection === "asc") {
        name
        liveChannels.sort((streamA, streamB) => {
        if (streamA.stream.channel.name > streamB.stream.channel.name) return 1;
        if (streamA.stream.channel.name < streamB.stream.channel.name) return -1;
        return 0;
        });
    }
    if (sortingField === "Game" && sortingDirection === "desc") {
        name
        liveChannels.sort((streamA, streamB) => {
        if (streamA.stream.game < streamB.stream.game) return 1;
        if (streamA.stream.game > streamB.stream.game) return -1;
        return 0;
        });
    }
    if (sortingField === "Game" && sortingDirection === "asc") {
        name
        liveChannels.sort((streamA, streamB) => {
        if (streamA.stream.game > streamB.stream.game) return 1;
        if (streamA.stream.game < streamB.stream.game) return -1;
        return 0;
        });
    }
}

application.startBackgroundLoop();