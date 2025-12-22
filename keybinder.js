function addElement(
	tag,
	parent = document.body,
	id = null,
	className = null,
	content = null
) {
	const element = document.createElement(tag);
	if (id) element.id = id;
	if (className) element.className = className;
	if (content) element.textContent = content;

	parent.appendChild(element);

	return element;
}

function getClickableElement(event) {
	const paths = event?.composedPath() || [event.target.element];
	for (i = 0; i < paths.length; i++) {
		const current = paths[i];

		if (
			current.tagName === 'BUTTON' ||
			(current.tagName === 'A' && current.hasAttribute('href')) ||
			current.tagName === 'INPUT' ||
			current.tagName === 'SELECT' ||
			current.tagName === 'TEXTAREA'
		) {
			return current;
		}
	}

	return null;
}

// Returns CSS selector
function getSelector(element) {
	if (element.id) return `#${element.id}`;
	if (element.ariaLabel) return `aria-label=[${element.ariaLabel}]`;
	if (element.name) return `name=[${element.name}]`;

	return null;
}

function createRecordPopup() {
	// Check existing popup
	const prevCon = document.querySelector('#keybinder-record-container');
	if (prevCon) prevCon.remove();

	// const con = document.createElement('div');
	// con.id = 'keybinder-record-container';

	const wrapper = addElement('div', document.body, 'keybinder-record-wrapper');

	const container = addElement('div', wrapper, 'keybinder-record-container');

	// Record keybind

	const keybindContainer = addElement('div', container, 'record-container');
	addElement('h2', keybindContainer, null, 'record-heading', 'Record Keybind');
	const keybindText = addElement(
		'p',
		keybindContainer,
		'keybind-text',
		'record-text',
		'No keybind saved'
	);
	const keybindRecordButton = addElement(
		'button',
		keybindContainer,
		'record-keybind-button',
		'record-button',
		'Record'
	);
	keybindRecordButton.dataset.recording = 'false';

	var keybindCombination = [];

	const recordKeybindCombination = (e) => {
		e.preventDefault();
		e.stopPropagation();

		keybindCombination = [];

		if (e.key == 'Escape') {
			document.removeEventListener('keydown', recordKeybindCombination);
			keybindRecordButton.textContent = 'Record';
			keybindRecordButton.dataset.recording = 'false';

			return;
		}

		if (e.ctrlKey) keybindCombination.push('Ctrl');
		if (e.shiftKey) keybindCombination.push('Shift');
		if (e.altKey) keybindCombination.push('Alt');
		// if (e.metaKey) combination.push('Super');

		const modifiers = ['Control', 'Shift', 'Alt', 'Super'];
		if (!modifiers.includes(e.key)) {
			keybindCombination.push(e.key.toUpperCase());
		}

		// Show combination recording in UI
		keybindText.textContent = keybindCombination.join(' + ');
	};

	keybindRecordButton.addEventListener('click', function () {
		const recording = this.dataset.recording;

		if (recording == 'false') {
			document.addEventListener('keydown', recordKeybindCombination);
			this.textContent = 'Save Keybind';
			this.dataset.recording = 'true';
		} else {
			document.removeEventListener('keydown', recordKeybindCombination);
			this.textContent = 'Record';
			this.dataset.recording = 'false';
		}
	});

	// Action
	var actionSelector;

	const actionContainer = addElement('div', container, 'action-container');
	addElement('h2', actionContainer, null, 'record-heading', 'Record Action');
	const actionText = addElement(
		'p',
		actionContainer,
		'action-text',
		'record-text',
		'No selection'
	);
	const actionButton = addElement(
		'button',
		actionContainer,
		'record-action-button',
		'record-button',
		'Select Element'
	);
	actionButton.dataset.recording = 'false';

	const recordAction = (e) => {
		e.preventDefault();
		e.stopPropagation();

		// const element = e.composedPath ? e.composedPath() : e.target.element;
		const element = getClickableElement(e);

		if (!element) {
			console.log('ELEMENT IS NOT CLICKABLE');
			// actionText.textContent = 'Element is not clickable';
			createSnackbar('Element is not clickable', 'error');
			return;
		}

		actionSelector = getSelector(element);

		if (actionSelector) {
			actionText.textContent = 'Selector: ' + actionSelector;
		} else {
			console.log('ERROR NO SELECTORS FOUND');
			// actionText.textContent = 'Element cannot be selected';
			createSnackbar('Element cannot be selected', 'error');
		}
	};

	actionButton.addEventListener('click', function (e) {
		e.stopPropagation();

		const recording = this.dataset.recording;

		if (recording == 'false') {
			document.addEventListener('click', recordAction);
			this.textContent = 'Save Selection';
			this.dataset.recording = 'true';
		} else {
			document.removeEventListener('click', recordAction);
			this.textContent = 'Select Element';
			this.dataset.recording = 'false';
		}
	});

	// Save and Cancel
	const saveContainer = addElement('div', wrapper, 'save-container');
	const saveButton = addElement(
		'button',
		saveContainer,
		'save-button',
		'final-button',
		'Save'
	);
	saveButton.addEventListener('click', async () => {
		const domain = window.location.hostname;

		const getBinds = await chrome.storage.sync.get({ siteBinds: {} });
		const siteBinds = getBinds.siteBinds;

		if (!siteBinds[domain]) {
			siteBinds[domain] = [];
		}

		if (keybindCombination.length == 0) {
			createSnackbar('Keybind not set', 'error');
			return;
		}
		if (!actionSelector) {
			createSnackbar('Element not selected', 'error');
			return;
		}
		siteBinds[domain].push({
			keybind: keybindCombination,
			selector: actionSelector,
		});

		await chrome.storage.sync.set({ siteBinds: siteBinds });

		// Cleanup
		document.removeEventListener('click', recordAction);
		document.removeEventListener('keydown', recordKeybindCombination);

		wrapper.remove();
	});

	const cancelButton = addElement(
		'button',
		saveContainer,
		'cancel-button',
		'final-button',
		'Cancel'
	);
	cancelButton.addEventListener('click', () => {
		document.removeEventListener('click', recordAction);
		document.removeEventListener('keydown', recordKeybindCombination);

		wrapper.remove();
	});

	// Drag and Move
	const drag = addElement(
		'p',
		wrapper,
		'keybinder-drag',
		null,
		'Hold here to move'
	);

	drag.addEventListener('pointerdown', (e) => {
		e.preventDefault();
		drag.setPointerCapture(e.pointerId);
	});

	drag.addEventListener('pointermove', (e) => {
		const wrapperStyles = window.getComputedStyle(wrapper);
		const wrapperWidth = parseFloat(wrapperStyles.width);
		const wrapperHeight = parseFloat(wrapperStyles.height);

		// if (
		// 	parseFloat(wrapperStyles.left) < 10 ||
		// 	parseFloat(wrapperStyles.top) < 10 ||
		// 	parseFloat(wrapperStyles.right) < 10 ||
		// 	parseFloat(wrapperStyles.bottom) < 10
		// )
		// 	return;

		// console.log(
		// 	wrapperStyles.left,
		// 	wrapperStyles.top,
		// 	wrapperStyles.right,
		// 	wrapperStyles.bottom
		// );

		if (drag.hasPointerCapture(e.pointerId)) {
			e.preventDefault();

			let x = e.clientX - wrapperWidth / 2;
			let y = e.clientY - wrapperHeight + 10;

			wrapper.style.left = x + 'px';
			wrapper.style.top = y + 'px';
		}
	});

	// Styles
	const styles = addElement(
		'style',
		container,
		null,
		null,
		`#keybinder-record-wrapper {
            position: fixed;
            top: 100px;
            right: 15px;
            max-width: 400px;
            box-shadow: 1px 1px 4px #000;
            background: #424242;
            color: #ffffff;
            border-radius: 6px;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px 0 4px;
        }

        #keybinder-record-container {
            height: 160px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: start;
        }

        #keybinder-drag {
            color: #bdbdbd;
            margin-top: 4px;
            font-size: 12px;
            cursor: grab;
        }

        .record-text {
            font-size: 16px;
            color: #ffffff;
            text-align: center
        }

        .record-button {
            font-size: 14px;
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 4px;
            background: #056e64;
            outline: none;

            &[data-recording='true'] {
                color: #00695C;
                background: #EEEEEE
            }
        }

        #record-container, #action-container {
            width: 200px;
            padding: 0 16px;
            display: flex;
            flex-direction: column;
            height: 100%;
            justify-content: space-between;
        }

        #record-container {
            border-right: 1px solid #bdbdbd;
        }

        .record-heading {
            font-size: 14px;
            // margin-bottom: 20px;
        }
        
        #save-container {
            display: flex;
            gap: 12px;
            width: 100%;
            justify-content: start;
            align-items: center;
            margin-top: 16px;
            padding: 0 16px;
        }

        .final-button {
            font-size: 12px;
            color: #ffffff;
            font-weight: bold;
            padding: 6px 8px;
            border-radius: 6px;
            outline: none;
            width: 80px;
        }
        #save-button {
            background: #43A047;
        }
        #cancel-button {
            background: #C62828;
        }
        `
	);
}

function createSnackbar(text, type = null) {
	const prevSnackbar = document.querySelector('#keybinder-snackbar-container');
	if (prevSnackbar) prevSnackbar.remove();

	const snackbarContainer = addElement(
		'div',
		document.body,
		'keybinder-snackbar-container',
		type ? ` ${type}` : null
	);

	const messageHead = addElement(
		'h3',
		snackbarContainer,
		null,
		null,
		'Keybinder Extension:'
	);
	const messageText = addElement('p', snackbarContainer, null, null, text);

	// Styles
	const styles = addElement(
		'style',
		snackbarContainer,
		null,
		null,
		`#keybinder-snackbar-container {
            position: fixed;
            bottom: 40px;
            left: 40px;
            padding: 12px;
            width: 320px;
            box-shadow: 1px 1px 4px #000000;
            border-radius: 4px;
            color: #fff;
            background: #424242;
            
            &.error {
                background: #C62828;
            }

            &.success {
                background: #388E3C;
            }

            p {
                font-size: 14px;
            }
                
            h3 {
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 8px;
            }
        }`
	);

	const closeSnackbarTimer = setTimeout(() => {
		snackbarContainer.remove();
	}, 5000);
}

if (typeof browser == 'undefined') {
	chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
		if (msg.action == 'addKeybind') {
			createRecordPopup();
		}

		// sendResponse({ status: 'success' });
	});
}
