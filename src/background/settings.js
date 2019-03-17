
let settingsAPI = {
    settingKeys: 
        ["twitchStreamsUserName", "twitchStreamsSortingField",
        "twitchStreamsSortingDirection", "twitchStreamsNotificationsEnabled",
        "twitchStreamsThumbnailsEnabled"],

    // Foreground
    username_cached: "",
    sorting_field: "Viewers",
    sorting_direction: "desc",
    notifications_enabled: true,
    thumbnails_enabled: true,
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
            return data;
        })
        .then((data) => {
            settingsAPI.notifications_enabled_handler(data);
            return data;
        })
        .then((data) => {
            settingsAPI.thumbnails_enabled_handler(data);
        });
    },
    fetchBrowserData: function() {
        let browserStorage = browser.storage.sync.get();
        return browserStorage.then((data) => {
            console.log("Settings loaded");
            return data;
        },(err) => {
            console.log(`Failed to load browser settings: ${err}`);
        });
    },
    setBrowserData: function(settingsSnapshot) {
        const userNameChanged = (settingsSnapshot.username !== session.username);
        const thumbnailsEnabledChanged = (settingsSnapshot.thumbnailsEnabled !== this.thumbnails_enabled);
        browser.storage.sync.set({ "twitchStreamsUserName": settingsSnapshot.username });
        browser.storage.sync.set({ "twitchStreamsSortingField": settingsSnapshot.sortingField });
        browser.storage.sync.set({ "twitchStreamsSortingDirection": settingsSnapshot.sortingDirection });
        browser.storage.sync.set({ "twitchStreamsNotificationsEnabled": settingsSnapshot.notificationsEnabled });
        browser.storage.sync.set({ "twitchStreamsThumbnailsEnabled": settingsSnapshot.thumbnailsEnabled });
        console.log("Succesfully set browser data");
        this.username_cached = settingsSnapshot.username;
        this.sorting_field = settingsSnapshot.sortingField;
        this.sorting_direction = settingsSnapshot.sortingDirection;
        this.notifications_enabled = settingsSnapshot.notificationsEnabled;
        this.thumbnails_enabled = settingsSnapshot.thumbnailsEnabled;
        session.username = settingsSnapshot.username;
        if(userNameChanged || thumbnailsEnabledChanged) {
            session.followsCount = 0;
            session.follows = [];
            session.live = [];
            compiledStreams.emptyList();
            twitchAPI.liveStream.updateBadge();
            application.fastUpdate();
        }
    },
    // Settings processors
    username_handler: function(data) {
        if (data.twitchStreamsUserName != null) {
                this.username_cached = data.twitchStreamsUserName;
                session.username = data.twitchStreamsUserName;
                console.log(`Cached username: ${data.twitchStreamsUserName}`);
        }
        else {
            console.log("Username not found in browser data");
        }
    },
    refresh_rate_handler: function(data) {
        if (data.twitchStreamsRefreshRate != null) {
                this.refresh_rate = data.twitchStreamsRefreshRate;
                console.log(`Refresh rate set to: ${data.twitchStreamsRefreshRate}ms`);
        }
        else {
            console.log(`Using default refresh rate: ${this.refresh_rate}ms`);
        }
    },
    sorting_field_handler: function(data) {
        if (data.twitchStreamsSortingField != null) {
            this.sorting_field = data.twitchStreamsSortingField;
            console.log(`Loaded sorting field ${data.twitchStreamsSortingField}`);
        }
        else {
            console.log(`Sorting field not found. Using default: ${this.sorting_field}`);
        }
    },
    sorting_direction_handler: function(data) {
        if (data.twitchStreamsSortingDirection != null) {
            this.sorting_direction = data.twitchStreamsSortingDirection;
            console.log(`Loaded sorting direction ${data.twitchStreamsSortingDirection}`);
        }
        else {
            console.log(`Sorting direction not found. Using default: ${this.sorting_field}`);
        }
    },
    notifications_enabled_handler: function(data) {
        if(data.twitchStreamsNotificationsEnabled != null) {
            this.notifications_enabled = data.twitchStreamsNotificationsEnabled;
            console.log(`Loaded notifications config ${data.twitchStreamsNotificationsEnabled}`);
        }
        else {
            console.log(`Notification config not found. Using default: ${this.notifications_enabled}`);
        }
    },
    thumbnails_enabled_handler: function(data) {
        if(data.twitchStreamsThumbnailsEnabled != null) {
            this.thumbnails_enabled = data.twitchStreamsThumbnailsEnabled;
            console.log(`Loaded notifications config ${data.twitchStreamsThumbnailsEnabled}`);
        }
        else {
            console.log(`Notification config not found. Using default: ${this.thumbnails_enabled}`);
        }
    }
}