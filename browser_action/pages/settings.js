// Background access
var BACKGROUNDPAGE = browser.extension.getBackgroundPage();

// Constants
const DEBUG = false;
const UPDATERATE = 1000;

// Start of application
start();

function getUsername() {
    document.getElementById("user_name").value = BACKGROUNDPAGE.username;
}

function setUsername() {
    BACKGROUNDPAGE.setUsername(document.getElementById("user_name").value);
}

function checkUpdateState(updateState_Element) {
    if(DEBUG) {
        console.log("[Debug][Settings] Checking update state. UI Element: " + updateState_Element.innerHTML + ", Background: " + BACKGROUNDPAGE.getUpdateState());
    }
    if(updateState_Element.innerHTML != BACKGROUNDPAGE.getUpdateState()) {
        updateState_Element.innerHTML = BACKGROUNDPAGE.getUpdateState();
    }
}

function checkUpdateDate(updateDate_Element) {
    if(DEBUG) {
        console.log("[DEBUG][Settings] Checking update date. UI Element: " + updateDate_Element.innerHTML + ", Background: " + BACKGROUNDPAGE.getLastUpdateDate());
    }
    if(updateDate_Element.innerHTML != BACKGROUNDPAGE.getLastUpdateDate()) {
        updateDate_Element.innerHTML = BACKGROUNDPAGE.getLastUpdateDate();
    }
}

function checkBackendData(updateState_Element, updateDate_Element) {
    checkUpdateState(updateState_Element);
    checkUpdateDate(updateDate_Element);
}

function start() {
    // Used DOM elements
    var debugUpdateState_Element = document.getElementById("update_state");
    var debugUpdateDate_Element = document.getElementById("update_date");

    // Setup event listeners
    document.getElementById("save_button_link").addEventListener("click", setUsername, false);

    getUsername();
    var updateIntervalID = setInterval(
        function() {
            checkBackendData(debugUpdateState_Element, debugUpdateDate_Element);
        }, UPDATERATE
    );
}