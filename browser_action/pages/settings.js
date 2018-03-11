"use strict"
// Background access
var BACKGROUNDPAGE = browser.extension.getBackgroundPage();

getUsername();

function getUsername() {
    document.getElementById("user_name").value = BACKGROUNDPAGE.getUsername();
}

function setUsername() {
    BACKGROUNDPAGE.setUsername(document.getElementById("user_name").value);
}