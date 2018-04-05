"use strict"
// Background access
var BACKGROUNDPAGE = browser.extension.getBackgroundPage();
var sortingFields = ["Viewers", "Channel name", "Game"];

getSettings();
//getSortOptions();
document.getElementById("save_button_link").addEventListener("click", saveSettings, false);

function getSettings() {
    let settings = BACKGROUNDPAGE.getSettings();
    // Set username
    document.getElementById("user_name").value = settings.username;
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
}

function saveSettings() {
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
		sortingField: selectedSortingField,
		sortingDirection: sortingDirection
	};
    BACKGROUNDPAGE.saveSettings(settingsSnapshot);
}