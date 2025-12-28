let domain;

const currentContent = document.querySelector('#current-content');
const allContent = document.querySelector('#all-content');

const currentContentMessage = document.querySelector(
	'#current-content-message'
);
const allContentMessage = document.querySelector('#all-content-message');

let currentKeybinds = [];
let allKeybinds = {};

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
	domain = new URL(tabs[0]?.url).hostname;

	chrome.storage.sync.get({ siteBinds: {} }, (res) => {
		allKeybinds = res.siteBinds;

		if (res.siteBinds[domain]) currentKeybinds = res.siteBinds[domain];

		createCurrentContent(currentKeybinds);

		setUpTabs();
	});
});

let allContentLoaded = false;
function setUpTabs() {
	const tabCurrent = document.querySelector('#tab-current');
	const tabAll = document.querySelector('#tab-all');

	tabCurrent.addEventListener('click', function () {
		tabAll.dataset.active = 'false';
		allContent.style.display = 'none';

		this.dataset.active = 'true';
		currentContent.style.display = 'block';
	});
	tabAll.addEventListener('click', function () {
		if (!allContentLoaded) {
			createAllContent(allKeybinds);
			allContentLoaded = true;
		}

		tabCurrent.dataset.active = 'false';
		currentContent.style.display = 'none';

		this.dataset.active = 'true';
		allContent.style.display = 'block';
	});
}

function createCurrentContent(keybinds) {
	if (keybinds.length == 0) {
		currentContentMessage.style.display = 'block';
		currentContentMessage.textContent = 'No keybinds found for this site';
	} else {
		currentContentMessage.style.display = 'none';
	}

	createKeybindList(keybinds);
}

function createAllContent(allKeybinds) {
	const sites = Object.keys(allKeybinds);

	sites.map((site) => {
		const siteBinds = allKeybinds[site];

		if (siteBinds.length == 0) return;

		const keybindSiteContainer = document.createElement('div');
		keybindSiteContainer.id = `keybind-site-${site}`;
		keybindSiteContainer.className = 'keybind-site';
		allContent.append(keybindSiteContainer);

		const keybindSiteTitle = document.createElement('h2');
		keybindSiteTitle.className = 'keybind-site-title';
		keybindSiteTitle.textContent = site;
		keybindSiteContainer.append(keybindSiteTitle);

		createKeybindList(siteBinds, keybindSiteContainer);
	});

	if (allKeybinds.length == 0)
		allContentMessage.textContent = 'No keybinds found';
}

function createKeybindList(keybinds, parent = currentContent) {
	for (let i = 0; i < keybinds.length; i++) {
		const keybindDetails = keybinds[i];

		const keybindContent = document.createElement('div');
		keybindContent.id = `keybind-content-${i}`;
		keybindContent.className = 'keybind-content';
		parent.append(keybindContent);

		const keybindCombination = document.createElement('p');
		keybindCombination.className = 'keybind-combination';
		const keyBindTextContent = keybindDetails.keybind.join(' + ');
		keybindCombination.textContent = keyBindTextContent;
		keybindContent.appendChild(keybindCombination);

		const keybindSelector = document.createElement('p');
		keybindSelector.className = 'keybind-selector';
		keybindSelector.textContent = keybindDetails.selector;
		keybindContent.appendChild(keybindSelector);

		const deleteButton = document.createElement('button');
		deleteButton.className = 'keybind-delete-button';
		deleteButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
            <path
                d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM231 231C240.4 221.6 255.6 221.6 264.9 231L319.9 286L374.9 231C384.3 221.6 399.5 221.6 408.8 231C418.1 240.4 418.2 255.6 408.8 264.9L353.8 319.9L408.8 374.9C418.2 384.3 418.2 399.5 408.8 408.8C399.4 418.1 384.2 418.2 374.9 408.8L319.9 353.8L264.9 408.8C255.5 418.2 240.3 418.2 231 408.8C221.7 399.4 221.6 384.2 231 374.9L286 319.9L231 264.9C221.6 255.5 221.6 240.3 231 231z"
            />
        </svg>
        `;
		keybindContent.appendChild(deleteButton);

		deleteButton.addEventListener('click', () => {
			deleteKeybind(
				domain,
				keyBindTextContent,
				keybindDetails.selector,
				`keybind-content-${i}`
			);
		});
	}
}

async function deleteKeybind(domain, keybinds, selector, htmlID) {
	const res = await chrome.storage.sync.get({ siteBinds: {} });
	const allBinds = res.siteBinds;
	if (allBinds[domain]) {
		const domainBinds = allBinds[domain];

		for (let i = 0; i < domainBinds.length; i++) {
			const bind = domainBinds[i];
			if (
				bind['keybind'].join(' + ') == keybinds &&
				bind['selector'] == selector
			) {
				domainBinds.splice(i, 1);
			}
		}

		allBinds[domain] = domainBinds;

		if (domainBinds.length == 0) {
			currentContentMessage.style.display = 'block';
			currentContentMessage.textContent = 'No keybinds found for this site';
		}

		await chrome.storage.sync.set({ siteBinds: allBinds });

		const keybindContainer = document.getElementById(htmlID);
		keybindContainer.remove();
	} else {
		console.log(`Error: domain '${domain}' not found`);
	}
}

const addButton = document.querySelector('#add-button');
addButton.addEventListener('click', () => {
	if (typeof browser == 'undefined') {
		// Chrome
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			chrome.tabs.sendMessage(tabs[0].id, { action: 'addKeybind' }, () => {
				window.close();
			});
		});
	} else {
		// Firefox
	}
});
