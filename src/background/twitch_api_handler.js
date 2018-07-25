"use strict"

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
            browser.runtime.sendMessage({ "subject": "update_live_follows_count" });
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
            console.log("Removing: ");
            console.log(removalResult.removedStream);
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
            let updateResult = compiledStreams.handleStreamUpdate(updatedChannel);
            console.log("Updating: " + updateResult.compiledStream.channelName);
            if(updateResult.success == true) {
                let channelToUpdate = session.live[liveStreamIndex];
                // Update backend session stream object
                channelToUpdate.stream = updatedChannel.stream;
                // If extension popup is currently opened send a message to update UI
                if(popup_state_handler.popup_opened) browser.runtime.sendMessage({ "subject": "update_stream_on_the_view", "data": updateResult });
            }
        },
        handleNewStream: function(newLiveStream) {
            // Compile new stream on the list
            console.log("Insert");
            let insertResult = compiledStreams.handleStreamInsert(newLiveStream);
            console.log("Inserting: " + insertResult.compiledStream.channelName);
            if(insertResult.success == true) {
                // Insert new stream to the backend session object
                session.live.push(newLiveStream);
                // Insert channel name into notification engine queue
                notificationEngine.toNotify.push(insertResult.compiledStream.channelName);
                // Update extension icon live stream count
                twitchAPI.liveStream.updateBadge();
                // If extension popup is currently opened send a message to update UI
                if(popup_state_handler.popup_opened) {
                    browser.runtime.sendMessage({ "subject": "insert_stream_into_view", "data": insertResult });
                    browser.runtime.sendMessage({ "subject": "update_live_follows_count" });
                } 
            }
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