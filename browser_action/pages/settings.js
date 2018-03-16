"use strict"
// Background access
var BACKGROUNDPAGE = browser.extension.getBackgroundPage();

getUsername();
document.getElementById("save_button_link").addEventListener("click", setUsername, false);

function getUsername() {
    document.getElementById("user_name").value = BACKGROUNDPAGE.getUsername();
}

function setUsername() {
    BACKGROUNDPAGE.setUsername(document.getElementById("user_name").value);
}