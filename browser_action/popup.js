function loadFollowsPage() {
    console.log("opening live streams page");
    document.getElementById("content_iframe").src = "pages/live_streams.html";
}

function loadSettingsPage() {
    console.log("opening settings page");
    document.getElementById("content_iframe").src = "pages/settings.html";
}