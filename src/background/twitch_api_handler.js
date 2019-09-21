"use strict"

let twitchAPI = {
    getAsync: (url) => {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.setRequestHeader("Client-ID", API_CLIENT_ID);
            xhr.setRequestHeader("Accept", "application/vnd.twitchtv.v5+json");
            xhr.onload = resolve;
            xhr.onerror = reject;
            xhr.send();
        });
    },
    getSync: (url) => {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.setRequestHeader("Client-ID", API_CLIENT_ID);
        xhr.setRequestHeader("Accept", "application/vnd.twitchtv.v5+json");
        xhr.send();
        if(xhr.status === 200)
            return xhr.responseText;
        else
            return "";
    },
    id: {
        createUrl: (username) => {
            return `https://api.twitch.tv/kraken/users?login=${username}`;
        },
        parse: (response) => {
            return JSON.parse(response);
        }
    },
    follows: {
        createUrl: (requestDetails) => {
            return `https://api.twitch.tv/kraken/users/${requestDetails.userID}/follows/channels?direction=DESC&limit=25&offset=${requestDetails.offset}&sortby=created_at&user=${requestDetails.username}`;
        },
        parse: (response) => {
            return JSON.parse(response);
        },
    },
    liveStream: {
        createUrl: (channelID) => {
            return `https://api.twitch.tv/kraken/streams/${channelID}`;
        },
        processResult: function (follows) {
            if(!follows) {
                console.log("livestream:processResult follows is undefined");
                return;
            }
            follows.forEach(stream => {
                var channelIndex = session.follows.findIndex(channel => {
                    return channel.channel.url == stream.channel.url;
                });
                if(channelIndex == -1)
                    session.follows.push(stream);
                var channelUrl = twitchAPI.liveStream.createUrl(stream.channel._id);
                twitchAPI.getAsync(channelUrl)
                    .then(result => twitchAPI.liveStream.loaded(result, channelUrl), twitchAPI.liveStream.notLoaded);
            });
        },
        loaded: (result, channelUrl) => {
            var parsedResult = JSON.parse(result.explicitOriginalTarget.response);
            // set url for comparison to fill in ._links.self that's missing in the v5 response
            parsedResult._url = channelUrl;
            if(parsedResult.hasOwnProperty(status) && parsedResult.status != 200) {
                console.log("Error while loading stream: " + parsedResult.error + " ,status: " + parsedResult.status);
                return;
            }
            let channelIndex = session.live.findIndex(channel => {
                return channel._url == parsedResult._url;
            });
            if(channelIndex !== -1) { // On the list
                if (parsedResult.stream === null) { // Offline - need to remove from list
                    twitchAPI.liveStream.handleStreamRemoval(channelIndex);
                }
                else
                { // Update channel to new version
                    twitchAPI.liveStream.handleStreamUpdate(channelIndex, parsedResult)
                }
            }
            else { // Not on the list
                if (parsedResult.stream !== null) { // Stream live and not on the list - add to list
                    twitchAPI.liveStream.handleNewStream(parsedResult);
                }
            }
            return parsedResult;
        },
        handleStreamRemoval: function(liveStreamIndex) {
            let channelToRemove = session.live[liveStreamIndex];
            // Remove channel from compiled streams list
            let removalResult = compiledStreams.handleStreamRemove(channelToRemove);
            if(removalResult.success) {
                // Remove offline channel from backend session object
                session.live.splice(liveStreamIndex, 1);
                // Update extension icon live stream count
                twitchAPI.liveStream.updateBadge();
                // If extension popup is currenty openend send a message to update UI
                if(popup_state_handler.popup_opened){
                    browser.runtime.sendMessage({ "subject": "remove_streams_from_view", "data": removalResult.removedStream });
                    browser.runtime.sendMessage({ "subject": "update_live_follows_count" });
                } 
            }
        },
        handleStreamUpdate: function(liveStreamIndex, updatedChannel) {
            // Update compiled streams list
            console.time('Updating stream: ' + updatedChannel.stream.channel.name + ', latency');
            let updateResult = compiledStreams.handleStreamUpdate(updatedChannel);
            //console.log("Updating: " + updateResult.compiledStream.channelName);
            if(updateResult.success == true) {
                let channelToUpdate = session.live[liveStreamIndex];
                // Update backend session stream object
                channelToUpdate.stream = updatedChannel.stream;
                // If extension popup is currently opened send a message to update UI
                if(popup_state_handler.popup_opened) browser.runtime.sendMessage({ "subject": "update_stream_on_the_view", "data": updateResult });
            }
            console.timeEnd('Updating stream: ' + updatedChannel.stream.channel.name + ', latency');
        },
        handleNewStream: function(newLiveStream) {
            // Compile new stream on the list
            console.time('Inserting stream: ' + newLiveStream.stream.channel.name + ', latency');
            let insertResult = compiledStreams.handleStreamInsert(newLiveStream);
            //console.log("Inserting: " + insertResult.compiledStream.channelName);
            if(insertResult.success == true) {
                // Insert new stream to the backend session object
                session.live.push(newLiveStream);
                // Insert channel name into notification engine queue
                var notif = {
                    img: newLiveStream.stream.channel.logo,
                    channelName: insertResult.compiledStream.channelName,
                    channelUptime: newLiveStream.stream.created_at
                };
                notificationEngine.toNotify.push(notif);
                // Update extension icon live stream count
                twitchAPI.liveStream.updateBadge();
                // If extension popup is currently opened send a message to update UI
                if(popup_state_handler.popup_opened) {
                    browser.runtime.sendMessage({ "subject": "insert_stream_into_view", "data": insertResult });
                    browser.runtime.sendMessage({ "subject": "update_live_follows_count" });
                } 
            }
            console.timeEnd('Inserting stream: ' + newLiveStream.stream.channel.name + ', latency');
        },
        notLoaded: (error) => {
            //var parsedError = JSON.parse(error);
            console.log(error);
            return error;
        },
        updateBadge: () => {
            browser.browserAction.setBadgeText({text: (session.live.length).toString()});
        }
    }
}
