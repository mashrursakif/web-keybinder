const addButton = document.querySelector('#add-btn');
addButton.addEventListener('click', () => {
	if (typeof browser == 'undefined') {
		// Chrome
		console.log('chrome');
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			chrome.tabs.sendMessage(tabs[0].id, { action: 'addKeybind' }, () => {
				window.close();
			});
		});
	} else {
		// Firefox
	}
});
