
let notificationEngine = {
    toNotify: [],
    start: () => {
        setInterval(notificationEngine.handler, 10000);
    },
    handler: () => {
        if(!settingsAPI.notifications_enabled) {
            notificationEngine.toNotify = [];
            return;
        }
        if (notificationEngine.toNotify.length > 1) {
            let live_to_show = "";
            let names_to_add = 5;
            if (notificationEngine.toNotify.length < 5) {
                names_to_add = notificationEngine.toNotify.length
            }
            for (var i = names_to_add - 1; i >= 0; i--) {
                live_to_show += notificationEngine.toNotify[i] + ", ";
            }
            live_to_show = live_to_show.substring(0, live_to_show.length - 1);

            let channel = notificationEngine.toNotify[0];
            let live = notificationEngine.toNotify.length - names_to_add;
            let message = "";
            if(live > 0){
                message = live_to_show + " and " + live + " other channels are live.";
            } else {
                message = live_to_show + " are live."
            }
            browser.notifications.create({
                "type": "basic",
                "iconUrl": browser.extension.getURL("icons/twitch-48.png"),
                "title": "Twitch streams",
                "message": message
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