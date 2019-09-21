"use strict"

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
            var channelUrl = twitchAPI.liveStream.createUrl(followedChannel.channel._id);
            twitchAPI.getAsync(channelUrl)
                .then(result => twitchAPI.liveStream.loaded(result, channelUrl), twitchAPI.liveStream.notLoaded)
                .catch((error) => {
                    console.error("every2seconds:getAsync failed:", error)
                });
        }
    },
    every60secounds: () => {
        if(passiveUpdateEngine.slowUpdateQueue.followsUrls.length == 0) {
            let requestData = {
                username: settingsAPI.username_cached,
                userID: settingsAPI.userID_cached,
                offset: 0
            }
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
            if (parsedResponse.hasOwnProperty(status) && parsedResponse.status !== 200) {
                return Promise.reject(parsedResponse);
            }
            parsedResponse.follows.forEach((channel) => {
                passiveUpdateEngine.slowUpdateQueue.follows.push(channel);
            });
        }).catch((error) => {
            console.error("every60seconds:getAsync failed:", error)
        });
    }
}
