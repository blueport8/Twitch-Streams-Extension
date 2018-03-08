// Background access
let BACKGROUNDPAGE = browser.extension.getBackgroundPage();

// Constants
const DEBUG = true;

// Start of application
startApplication();

function startApplication() {
    // Setup event listeners
    if(DEBUG) {
        console.log("[Debug][Popup] Seting up listeners...");
    }
    document.getElementById("refresh_button").addEventListener("click", refreshData, false);
    document.getElementById("follows_button").addEventListener("click", loadFollowsPage, false);
    document.getElementById("settings_button").addEventListener("click", loadSettingsPage, false);
    if(DEBUG) {
        console.log("[Debug][Popup] Listeners set.");
    }
}

function refreshData() {
    if(DEBUG) {
        console.log("[Debug][Popup] Refresh button clicked.");
    }
    if(!BACKGROUNDPAGE.getUpdateState()) {
        if(DEBUG) {
            console.log("[Debug][Popup] Updating live streams.");
        }
        BACKGROUNDPAGE.run();
    }
    else if(DEBUG) {
        console.log("[Debug][Popup] Update already in progress");
    }
}

function loadFollowsPage() {
    if(DEBUG) {
        console.log("[Debug][Popup] Loading follows page.");
    }
    document.getElementById("content_iframe").src = "pages/live_streams.html";
}

function loadSettingsPage() {
    if(DEBUG) {
        console.log("[Debug][Popup] Loading settings page.");
    }
    document.getElementById("content_iframe").src = "pages/settings.html";
}
