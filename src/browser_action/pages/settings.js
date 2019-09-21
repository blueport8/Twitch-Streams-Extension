"use strict"
// Background access
var BACKGROUNDPAGE = browser.extension.getBackgroundPage();
var sortingFields = ["Viewers", "Channel name", "Game"];
var settingsSaveEnabled = true;

getSettings();
//getSortOptions();
document.getElementById("save_button_link").addEventListener("click", saveSettings, false);
document.getElementById("user_name").addEventListener("keyup", checkUsername, false);

function checkUsername() {
	// get the userID to the provided username
	clearTimeout(this.checkUsernameTimeout);
	const username = document.getElementById("user_name").value;
	settingsSaveEnabled = false;
	document.getElementById("save_button_link").classList.add("disabled");
	this.requestID = this.requestID || 0;
	this.checkUsernameTimeout = setTimeout(() => {
		this.requestID += 1;
		const requestID = this.requestID;
		BACKGROUNDPAGE.getUserID(username).then((id) => {
			if (requestID != this.requestID) {
				// this wasn't the most recent request, e.g. when the previous request was unusually slow
				return;
			}
			document.getElementById("user_id").textContent = id;
			settingsSaveEnabled = true;
			document.getElementById("save_button_link").classList.remove("disabled");
		}).catch((error) => {
			if (requestID != this.requestID) {
				// this wasn't the most recent request, e.g. when the previous request was unusually slow
				return;
			}
			document.getElementById("user_id").textContent = "";
			settingsSaveEnabled = true;
			document.getElementById("save_button_link").classList.remove("disabled");
		});
	}, 250);
}

function getSettings() {
    let settings = BACKGROUNDPAGE.getSettings();
    // Set username
	document.getElementById("user_name").value = settings.username;
	// set userID
	document.getElementById("user_id").textContent = settings.userID;
    // Set sorting field
    let options = document.getElementById("sort_options").options;
    let selectedOption = document.createElement("option");
    selectedOption.text = settings.sortingField;
    options.add(selectedOption);
    sortingFields.splice(sortingFields.indexOf(settings.sortingField), 1);
    for (var i = 0; i < sortingFields.length; i++) {
    	let addedOption = document.createElement("option");
    	addedOption.text = sortingFields[i];
    	options.add(addedOption);
    }
    // Set serting direction
    let sortingDirectionDesc = document.getElementById("sort_direction_desc");
	let sortingDirectionAsc = document.getElementById("sort_direction_asc");
	if (settings.sortingDirection === "desc") {
		sortingDirectionDesc.checked = true;
		sortingDirectionAsc.checked = false;
	}
	else {
		sortingDirectionDesc.checked = false;
		sortingDirectionAsc.checked = true;
	}
	// Notifications enabled
	let notificationsEnabledDomElement = document.getElementById("checkbox-show-notif");
	notificationsEnabledDomElement.checked = settings.notificationsEnabled;
	// Thumbnails enabled
	let thumbnailsEnabledDomElement = document.getElementById("checkbox-show-thumbnails");
	thumbnailsEnabledDomElement.checked = settings.thumbnailsEnabled;
}

function saveSettings() {
	if (!settingsSaveEnabled) {
		return;
	}
	// Sorting field
	let selectedSortingFieldIndex = document.getElementById("sort_options").selectedIndex;
	let selectedSortingField = document.getElementById("sort_options").options[selectedSortingFieldIndex].value;
	// Sorting direction
	let sortingDirectionDesc = document.getElementById("sort_direction_desc");
	let sortingDirectionAsc = document.getElementById("sort_direction_asc");
	let sortingDirection;
	if (sort_direction_desc.checked) sortingDirection = "desc";
	if (sort_direction_asc.checked) sortingDirection = "asc";
	//Create settings object
	let settingsSnapshot = {
		username: document.getElementById("user_name").value,
		userID: document.getElementById("user_id").textContent,
		sortingField: selectedSortingField,
		sortingDirection: sortingDirection,
		notificationsEnabled: document.getElementById("checkbox-show-notif").checked,
		thumbnailsEnabled: document.getElementById("checkbox-show-thumbnails").checked
	};
    BACKGROUNDPAGE.saveSettings(settingsSnapshot);
}
