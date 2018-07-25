"use strict"

let compiledStreams = {
    uptimeHelper: {
        calculateUptime: function(uptimeRaw) {
            let channelWentLive = new Date(uptimeRaw);
            let uptime = this.timeSince(channelWentLive);
            let uptimeString = "";
            if(uptime.days > 0) {
                uptimeString += uptime.days + "d "
            }
            var hours = (new String(uptime.hours));
            var minutes = (new String(uptime.minutes)).padStart(2, "0");
            var seconds = (new String(uptime.seconds)).padStart(2, "0");
            uptimeString += `${hours}h${minutes}m`;
            return uptimeString;
        },
        timeSince: function(when) { // this ignores months
            var obj = {};
            obj._milliseconds = (new Date()).valueOf() - when.valueOf();
            obj.milliseconds = obj._milliseconds % 1000;
            obj._seconds = (obj._milliseconds - obj.milliseconds) / 1000;
            obj.seconds = obj._seconds % 60;
            obj._minutes = (obj._seconds - obj.seconds) / 60;
            obj.minutes = obj._minutes % 60;
            obj._hours = (obj._minutes - obj.minutes) / 60;
            obj.hours = obj._hours % 24;
            obj._days = (obj._hours - obj.hours) / 24;
            obj.days = obj._days % 365;
            obj.years = (obj._days - obj.days) / 365;
            return obj;
        }
    },

    streams: [],
    streamsSortedByViewers: [],
    streamsSortedByGame: [],
    streamsSortedByChannelName: [],
    emptyList: function() {
        console.log("Emptying compiled stream list");
        this.streams = [];
        this.streamsSortedByViewers = [];
        this.streamsSortedByGame = [];
        this.streamsSortedByChannelName = [];
    },
    handleStreamInsert: function(streamData) {
        const sortingDirection = settingsAPI.sorting_direction;
        const sortingField = settingsAPI.sorting_field;
        let compiledStream = compiledStreams.compileStream(streamData);
        compiledStreams.streams.push(compiledStream);
        let viewersSortingInsertionIndex = this.insertWithSortingByViewers(compiledStream);
        let channelNameSortingInsertionIndex = this.insertWithSortingByChannelName(compiledStream);
        let gameNameSortingInsertionIndex = this.insertWithSortingByGame(compiledStream);
        //sortCompiledChannels();
        return {
            success: true,
            compiledStream,
            sortingField,
            sortingDirection,
            viewersSortingInsertionIndex,
            channelNameSortingInsertionIndex,
            gameNameSortingInsertionIndex
        };
    },
    handleStreamUpdate: function(streamData) {
        const sortingDirection = settingsAPI.sorting_direction;
        const sortingField = settingsAPI.sorting_field;
        let compiledStream = compiledStreams.compileStream(streamData);
        let channelIndex = compiledStreams.streams.findIndex(stream => stream.channelName == compiledStream.channelName);
        if(channelIndex != null && channelIndex >= 0) {
            let oldStreamUuid = compiledStreams.streams[channelIndex].uuid;
            compiledStreams.streams[channelIndex] = compiledStream;
            let viewersSortingInsertionIndex = this.updateWithSortingByViewers(compiledStream, oldStreamUuid);
            let channelNameSortingInsertionIndex = this.updateWithSortingByChannelName(compiledStream, oldStreamUuid);
            let gameNameSortingInsertionIndex = this.updateWithSortingByGameName(compiledStream, oldStreamUuid);
            //sortCompiledChannels();
            return {
                success: true,
                oldStreamUuid,
                compiledStream,
                sortingField,
                sortingDirection,
                viewersSortingInsertionIndex,
                channelNameSortingInsertionIndex,
                gameNameSortingInsertionIndex
            };
        }
        return {
            success: false
        };
    },
    handleStreamRemove: function(streamData) {
        let channelIndex = compiledStreams.streams.findIndex(stream => stream.channelName == streamData.stream.channel.name);
        let sortByViewersChannelIndex = this.streamsSortedByViewers.findIndex(stream => stream.channelName == streamData.stream.channel.name);
        this.streamsSortedByViewers.splice(sortByViewersChannelIndex, 1);
        if(channelIndex != null && channelIndex >= 0) {
            console.log("Removing stream:");
            console.log(compiledStreams.streams[channelIndex]);
            return {
                success: true,
                removedStream: compiledStreams.streams.splice(channelIndex, 1)
            };
        }
        console.log("Filed to remove stream. Stream data:");
        console.log(streamData);
        return {
            success: false
        };
    },
    compileStream: function(streamData) {
        let compilationParameters = {
            data: {
                channelName: streamData.stream.channel.name,
                channelTitle: streamData.stream.channel.status,
                game: streamData.stream.channel.game,
                viewers: streamData.stream.viewers,
                previewImageUrl: streamData.stream.preview.medium,
                channelUptime: this.uptimeHelper.calculateUptime(streamData.stream.created_at)
            },
            settings: {
                thumbnailsEnabled: settingsAPI.thumbnails_enabled
            }
        };
        return compileLiveStreamData(compilationParameters);
    },
    insertWithSortingByViewers: function(compiledStream) {
        if(this.streamsSortedByViewers.length == 0) {
            this.streamsSortedByViewers.push(compiledStream);
            return 0;
        }
        // Sort ascending. New streams tend to not have many viewers, so less loop cycles needed.
        for (let streamOnSortedListIndex = 0; streamOnSortedListIndex < this.streamsSortedByViewers.length; streamOnSortedListIndex++) {
            const element = this.streamsSortedByViewers[streamOnSortedListIndex];
            if(compiledStream.sorting.viewers < element.sorting.viewers) {
                this.streamsSortedByViewers.splice(streamOnSortedListIndex, 0, compiledStream);
                return streamOnSortedListIndex;
            }
        }
        this.streamsSortedByViewers.push(compiledStream);
        return Infinity;
    },
    insertWithSortingByChannelName: function(compiledStream) {
        if(this.streamsSortedByChannelName.length == 0) {
            this.streamsSortedByChannelName.push(compiledStream);
            return 0;
        }

        for (let streamOnSortedListIndex = 0; streamOnSortedListIndex < this.streamsSortedByChannelName.length; streamOnSortedListIndex++) {
            const element = this.streamsSortedByChannelName[streamOnSortedListIndex];
            if(compiledStream.sorting.channelName < element.sorting.channelName) {
                this.streamsSortedByChannelName.splice(streamOnSortedListIndex, 0, compiledStream);
                return streamOnSortedListIndex;
            }
        }

        this.streamsSortedByChannelName.push(compiledStream);
        return Infinity;
    },
    insertWithSortingByGame: function(compiledStream) {
        if(this.streamsSortedByGame.length == 0) {
            this.streamsSortedByGame.push(compiledStream);
            return 0;
        }

        for (let streamOnSortedListIndex = 0; streamOnSortedListIndex < this.streamsSortedByGame.length; streamOnSortedListIndex++) {
            const element = this.streamsSortedByGame[streamOnSortedListIndex];
            if(compiledStream.sorting.gameName < element.sorting.gameName) {
                this.streamsSortedByGame.splice(streamOnSortedListIndex, 0, compiledStream);
                return streamOnSortedListIndex;
            }
        }

        this.streamsSortedByGame.push(compiledStream);
        return Infinity;
    },
    updateWithSortingByViewers: function(compiledStream, oldStreamUuid) {
        if(this.streamsSortedByViewers.length == 0) {
            console.log("Trying to update stream but streamsSortedByViewers array is empty");
            return null;
        }

        // First remove existing item
        let streamOnSortedListIndex = 0;
        for (; streamOnSortedListIndex < this.streamsSortedByViewers.length; streamOnSortedListIndex++) {
            const element = this.streamsSortedByViewers[streamOnSortedListIndex];
            if(oldStreamUuid === element.uuid) {
                this.streamsSortedByViewers.splice(streamOnSortedListIndex, 1);
                break;
            }
        }
        return this.insertWithSortingByViewers(compiledStream)
    },
    updateWithSortingByChannelName: function(compiledStream, oldStreamUuid) {
        if(this.streamsSortedByChannelName.length == 0) {
            console.log("Trying to update stream but streamsSortedByChannelName array is empty");
            return null;
        }

        // First remove existing item
        let streamOnSortedListIndex = 0;
        for (; streamOnSortedListIndex < this.streamsSortedByChannelName.length; streamOnSortedListIndex++) {
            const element = this.streamsSortedByChannelName[streamOnSortedListIndex];
            if(oldStreamUuid === element.uuid) {
                this.streamsSortedByChannelName.splice(streamOnSortedListIndex, 1);
                break;
            }
        }
        return this.insertWithSortingByChannelName(compiledStream)
    },
    updateWithSortingByGameName: function(compiledStream, oldStreamUuid) {
        if(this.streamsSortedByGame.length == 0) {
            console.log("Trying to update stream but streamsSortedByGame array is empty");
            return null;
        }

        // First remove existing item
        let streamOnSortedListIndex = 0;
        for (; streamOnSortedListIndex < this.streamsSortedByGame.length; streamOnSortedListIndex++) {
            const element = this.streamsSortedByGame[streamOnSortedListIndex];
            if(oldStreamUuid === element.uuid) {
                this.streamsSortedByGame.splice(streamOnSortedListIndex, 1);
                break;
            }
        }
        return this.insertWithSortingByGame(compiledStream);
    }
}