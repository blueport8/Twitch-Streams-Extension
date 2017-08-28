var backendPage = browser.extension.getBackgroundPage();
var refresh_button = document.getElementById("refresh_button").addEventListener("click", refreshData, false);
var loadFollowsPageVar = document.getElementById("follows_button").addEventListener("click", loadFollowsPage, false);
var loadSettingsPageVar = document.getElementById("settings_button").addEventListener("click", loadSettingsPage, false);

function refreshData() {
    console.log("updating live streams");
    if(!backendPage.updateInProgress()) {
        backendPage.run();
    }
}

function loadFollowsPage() {
    console.log("opening live streams page");
    document.getElementById("content_iframe").src = "pages/live_streams.html";
}

function loadSettingsPage() {
    console.log("opening settings page");
    document.getElementById("content_iframe").src = "pages/settings.html";
}