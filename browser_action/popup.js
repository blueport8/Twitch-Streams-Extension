"use strict"
// Background access
let BACKGROUNDPAGE = browser.extension.getBackgroundPage();

// Start of application
startApplication();

function startApplication() {
    // Setup event listeners
    document.getElementById("refresh_button").addEventListener("click", refreshData, false);
    document.getElementById("follows_button").addEventListener("click", loadFollowsPage, false);
    document.getElementById("settings_button").addEventListener("click", loadSettingsPage, false);
}

function refreshData() {
    console.log("Forcing update");
    BACKGROUNDPAGE.forceRefresh();
}

function loadFollowsPage() {
    document.getElementById("content_iframe").src = "pages/live_streams.html";
}

function loadSettingsPage() {
    document.getElementById("content_iframe").src = "pages/settings.html";
}
