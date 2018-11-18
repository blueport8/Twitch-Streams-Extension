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
        let notif = self.toNotify[0];
        let otherLiveChannels = self.toNotify.length - 1;
        browser.notifications.create({
            "type": "basic",
            "iconUrl": browser.extension.getURL(notif.img),
            "title": "Twitch streams",
            "message": "Channel " + notif.channelName + " went live."
        });
        self.toNotify = [];
    },

    notifyMany: function(self) {
        let channelNames = "";
        let channelsToNotify = self.toNotify.length < 5 ? (self.toNotify.length - 1) : 4;

        while(channelsToNotify >= 0) {
            channelNames += self.toNotify[channelsToNotify].channelName + ", ";
            channelsToNotify--;
        }
        channelNames = channelNames.substring(0, channelNames.length - 1);

        let otherLiveChannels = self.toNotify.length - channelsToNotify;
        let notifMessage = "";
        if(otherLiveChannels > 0){
            notifMessage =  
                channelNames + " and " + 
                otherLiveChannels + " other channels are live.";
        } else {
            notifMessage = channelNames + " are live."
        }
        browser.notifications.create({
            "type": "basic",
            "iconUrl": browser.extension.getURL("icons/twitch-notif-48.jpg"),
            "title": "Twitch streams",
            "message": notifMessage
        });
        self.toNotify = [];
    }
}