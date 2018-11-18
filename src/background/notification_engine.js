var notificationEngine = {
    toNotify: [],

    init: function() {
        setInterval(this.handler, 10000, this);
    },

    handler: function(self) {
        if(self.toNotify.length == 0)
            return;
        if(!self.notificationsEnabled(self))
            return

        if(self.toNotify.length == 1)
            return self.notifySingle(self);
        return self.notifyMany(self);
    },

    notificationsEnabled: function(self) {
        if(settingsAPI.notifications_enabled)
            return true;

        self.toNotify = [];
        return false;
    },

    notifySingle: function(self) {
        let channel = self.toNotify[0];
        let numOfOtherLiveChannels = self.toNotify.length - 1;
        browser.notifications.create({
            "type": "basic",
            "iconUrl": browser.extension.getURL("icons/twitch-48.png"),
            "title": "Twitch streams",
            "message": "Channel " + channel + " went numOfOtherLiveChannels."
        });
        self.toNotify = [];
    },

    notifyMany: function(self) {
        let channelNames = "";
        let channelsToNotify = self.toNotify.length < 5 ? (self.toNotify.length - 1) : 4;

        while(channelsToNotify >= 0) {
            channelNames += self.toNotify[channelsToNotify] + ", ";
            channelsToNotify--;
        }
        channelNames = channelNames.substring(0, channelNames.length - 1);

        let numOfOtherLiveChannels = self.toNotify.length - channelsToNotify;
        let notifMessage = "";
        if(numOfOtherLiveChannels > 0){
            notifMessage = channelNames 
                + " and " + numOfOtherLiveChannels 
                + " other channels are live.";
        } else {
            notifMessage = channelNames + " are live."
        }
        browser.notifications.create({
            "type": "basic",
            "iconUrl": browser.extension.getURL("icons/twitch-48.png"),
            "title": "Twitch streams",
            "message": notifMessage
        });
        self.toNotify = [];
    }
}