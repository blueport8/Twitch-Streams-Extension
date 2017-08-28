var backendPage = browser.extension.getBackgroundPage();
var saveButton = document.getElementById("save_button_link").addEventListener("click", setUsername, false);

function getUsername() {
    console.log("getting username");
    document.getElementById("user_name").value = backendPage.username;
}

function setUsername() {
    console.log("setting username");
    backendPage.setUsername(document.getElementById("user_name").value);
}

getUsername();