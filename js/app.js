/*
Description: This script serves as the main script of the FlashStash website and houses its flashcard management functionalities.
Author: Jonathan Cruz
*/
(function() {
	/*-------------------------
	- Function definitions
	-------------------------*/

	// Generates an ID based on the current time (milliseconds) and a random number
	function generateID() {
		const randomNumber = Math.floor(Math.random() * 1000); // A random number between 0 to 1000 (reduces chance of generating a duplicate ID)
		return Date.now() + "-" + randomNumber;
	}

	// Applies filters by triggering the "input" event on filter input elements
	function applyFilters() {
		const filterInputs = document.querySelectorAll('.filter-input');

		// If there are filter inputs on the page
		if(filterInputs.length) {
			const inputEvent = new Event('input', {
				bubbles: true // Must be set to true since the "input" event is handled and delegated by the document body
			});

			filterInputs.forEach((el) => el.dispatchEvent(inputEvent)); // Dispatch the event on every element
		}
	}

	// Announces the new status of the program for accessibility devices (e.g. screen readers)
	function updateAccessibilityStatus(message) {
		const status = document.getElementById('accessibility-status');

		if(status) {
			const paragraph = document.createElement('p');
			paragraph.textContent = message;
			status.replaceChildren(paragraph);
		}
	}

	// Toggles the "flipped" CSS class of a given DOM node
	function flipFlashcard(flashcardElement) {
		// Check if the element is nested under a '.flashcard" element
		if(flashcardElement && flashcardElement instanceof Node) {
			const flashcardClasses = [...flashcardElement.classList]; // Convert the class list into an array by spreading its content into an array
			const question = flashcardElement.querySelector('.flashcard-question');
			const answer = flashcardElement.querySelector('.flashcard-answer');

			// If the back side of the flashcard is currently shown, flag answer as hidden before flipping the card
			if(flashcardClasses.includes('flipped')) {
				question.setAttribute('aria-hidden', false);
				answer.setAttribute('aria-hidden', true);
			// Otherwise, flag answer as displayed before flipping the card
			} else {
				question.setAttribute('aria-hidden', true);
				answer.setAttribute('aria-hidden', false);
			}

			flashcardElement.classList.toggle('flipped'); // Toggle the flashcard's "flipped" CSS class
			updateAccessibilityStatus('Card flipped.');
		}
	}


	/*-------------------------
	- Class definitions
	-------------------------*/

	// Represents a set of flashcards
	class FlashcardSet {
		// The constructor method. Initializes the object's attributes.
		constructor(name) {
			const today = new Date().toISOString();

			this.id = generateID();
			this.name = name;
			this.flashcards = [];
			this.dateCreated = today;
			this.dateModified = today;
		}

		// Appends a Flashcard object to the `flashcards` array/attribute.
		addFlashcard(flashcard) {
			// Check if the passed value is an instance of the Flashcard class. If it is not, throw an error.
			if(!(flashcard instanceof Flashcard)) {
				throw new Error('Flashcard could not be added. Invalid instance provided.');
			}

			this.flashcards.push(flashcard); // Append the flashcard
		}

		// Replaces an existing Flashcard object in the `flashcards` array/attribute with another Flashcard object
		replaceFlashcard(id, newFlashcard) {
			const oldFlashcard = this.flashcards.find((item) => item.id == id); // Get the flashcard whose ID matches the provided ID

			// Check if there is a matching flashcard. If there is none, throw an error.
			if(!oldFlashcard) {
				throw new Error('Flashcard could not be found.');
			}

			// Check if the new flashcard provided is an instance of the Flashcard class. If it is not, throw an error.
			if(!(newFlashcard instanceof Flashcard)) {
				throw new Error('Flashcard could not be updated. Invalid instance provided.');
			}

			this.flashcards = this.flashcards.map((item) => item.id == id ? newFlashcard : item); // Iterate through all items. Replace the matched item with the new instance. Retain the other items.
		}

		// Removes an existing Flashcard object from the `flashcards` array/attribute
		removeFlashcard(id) {
			const flashcard = this.flashcards.find((item) => item.id == id); // Get the flashcard whose ID matches the provided ID

			// Check if there is a matching flashcard. If there is not, throw an error.
			if(!flashcard) {
				throw new Error('Flashcard could not be found.');
			}

			this.flashcards = this.flashcards.filter((item) => item.id != id); // Filter out the matched item from the array
		}
	}

	// Represents a flashcard
	class Flashcard {
		constructor(question, answer, tags) {
			const today = new Date().toISOString();

			this.id = generateID();
			this.question = question;
			this.answer = answer;
			this.tags = tags;
			this.dateCreated = today;
			this.dateModified = today;
		}
	}

	// Represents the application page containing sets/flashcards ("My Flashcards" page)
	class App {
		#storageKey = 'flashcardSets'; // The local storage key where the flashcard sets data is stored

		// The constructor method. Initializes the object's attributes.
		constructor() {
			this.flashcardSets = []; // Array of FlashcardSets
			this.isSetView = true; // Boolean flag that indicates if the "My Flashcards" page should display FlashcardSets or Flashcards
			this.viewedSetId = null; // The ID of the displayed FlashcardSet
		}

		// Fetches data from the local storage, parses it and stores it into the `flashcardSets` attribute. If the data is malformed, the data will not be loaded.
		loadData() {
			const data = localStorage.getItem(this.#storageKey);
			const parsedData = JSON.parse(data);
			const tempSets = [];
			let isValid = true;

			// Check if the parsed data is an array. If it is not, exit out of the method.
			if(!Array.isArray(parsedData)) {
				return;
			}

			// Iterate through the parsed data and attempt to create instances of FlashcardSet and Flashcard from the data.
			setLoop: for(const item of parsedData) { // Label the loop as "setLoop"
				const flashcardSet = new FlashcardSet();
				const setAttributes = Object.keys(flashcardSet); // Construct an array of expected attributes from the keys of the FlashcardSet object
				const tempCards = [];

				// Check if the array item is an object and if its `flashcards` property is an array. If neither of the conditions is true, flag data as invalid and break out of the loop.
				if(typeof(item) != 'object' || !Array.isArray(item?.flashcards)) {
					isValid = false;
					break;
				}

				// Iterate through array of expected flashcard set attributes
				for(const key of setAttributes) {
					// Check if the attribute is a property of the object. If it is not, break out of the "setLoop" loop and flag data as invalid.
					if(!(key in item)) {
						isValid = false;
						break setLoop;
					}

					flashcardSet[key] = item[key]; // Copy the attribute
				}

				// Iterate through array items of `flashcards` property
				for(const card of flashcardSet.flashcards) {
					const flashcard = new Flashcard();
					const cardAttributes = Object.keys(flashcard); // Construct an array of expected attributes from the keys of the Flashcard object

					// Check if the item is an object. If it is not, flag data as invalid and break out of the "setLoop" loop.
					if(typeof(item) != 'object') {
						isValid = false;
						break setLoop;
					}

					// Iterate through array of expected flashcard attributes
					for(const key of cardAttributes) {
						// Check if the attribute is a property of the object. If it is not, break out of the loop and flag data as invalid.
						if(!(key in card)) {
							isValid = false;
							break setLoop;
						}

						flashcard[key] = card[key]; // Copy the attribute
					}

					tempCards.push(flashcard); // Append the Flashcard object to the temporary array of flashcards
				}

				flashcardSet.flashcards = [...tempCards]; // Overwrite `flashcards` property with the array of Flashcard objects by spreading the contents of the tempCards array
				tempSets.push(flashcardSet); // Append the FlashcardSet object to the temporary array of sets
			}

			// If the data is valid, store the contents of tempSets array which is comprised of the created instances of FlashcardSet and Flashcard objects as the value of the `flashcardSets` attribute
			if(isValid) {
				this.flashcardSets = [...tempSets];
			}
		}

		// Saves the value of the `flashcardSets` attribute as a JSON string into the local storage
		saveData() {
			const data = JSON.stringify(this.flashcardSets);
			localStorage.setItem(this.#storageKey, data);
		}

		// Renders the sets/flashcards to the page
		render() {
			// If it is the "set" view, render the flashcard sets
			if(this.isSetView) {
				this.#renderSets();

			// Otherwise, toggle the view and render flashcards within a set
			} else {
				this.#renderView();
				this.#renderFlashcards();
			}

			applyFilters(); // Apply any existing filter after items are rendered
		}

		// Renders the appropriate view within #flashcard-section (currently only switches to the "individual set" view for displaying flashcards in a set)
		#renderView() {
			const section = document.getElementById('flashcards-section');
			const viewTemplate = document.getElementById('flashcards-view-template');
			const viewTemplateContents = document.importNode(viewTemplate.content, true);
			const flashcardSet = app.flashcardSets.find((item) => item.id == app.viewedSetId); // Retrieve flashcard set whose ID matches app.viewedSetId

			// If a matching flashcard set is found, render the "individual set" view (display flashcards in the set)
			if(flashcardSet) {
				const h1 = viewTemplateContents.getElementById('flashcard-set-name');
				h1.textContent = flashcardSet.name;
				section.replaceChildren(viewTemplateContents);
			}
		}

		// Renders the sets to the page
		#renderSets() {
			const itemsList = document.getElementById('flashcard-sets');
			const emptyMessage = document.getElementById('no-flashcard-sets');

			itemsList.replaceChildren(); // Empty out list of flashcard sets before rendering data

			// If there are flashcard sets to display
			if(this.flashcardSets?.length && this.flashcardSets.length > 0) {
				const template = document.getElementById('flashcard-set-template');

				// Iterate through each flashcard set, fill in the template with the set's data and append it to the ul element
				for(const flashcardSet of this.flashcardSets) {
					const templateContents = document.importNode(template.content, true);
					const h2 = templateContents.querySelector('h2');
					const editButton = templateContents.querySelector('.edit-set');
					const deleteButton = templateContents.querySelector('.delete-set');
					const viewButton = templateContents.querySelector('.view-set-button');

					// Fill in the template's elements with the set's data
					h2.textContent = flashcardSet.name;
					editButton.dataset.id = flashcardSet.id;
					editButton.setAttribute('aria-label', 'Edit Set: "' + flashcardSet.name + '"');
					deleteButton.dataset.id = flashcardSet.id;
					deleteButton.setAttribute('aria-label', 'Delete Set: "' + flashcardSet.name + '"');
					viewButton.setAttribute('aria-label', 'View Set: ' + flashcardSet.name);
					viewButton.dataset.id = flashcardSet.id;

					itemsList.appendChild(templateContents); // Append the template contents to the list of sets
				}

				// Display the list and hide the empty message
				itemsList.classList.remove('hidden');
				emptyMessage.classList.add('hidden');
			// If there are no flashcard sets to display
			} else {
				// Display the empty message and hide the list of sets
				itemsList.classList.add('hidden');
				emptyMessage.classList.remove('hidden');
			}
		}

		// Renders the flashcards within a set to the page
		#renderFlashcards() {
			const itemsList = document.getElementById('flashcards');
			const emptyMessage = document.getElementById('no-flashcards');
			const flashcardSet = this.flashcardSets.find((item) => item.id === this.viewedSetId); // Get the flashcard set whose id matches this.viewedSetId

			// Empty out list of flashcards before rendering data
			itemsList.replaceChildren();

			// If there are flashcards to display
			if(flashcardSet?.flashcards && flashcardSet.flashcards.length > 0) {
				const template = document.getElementById('flashcard-template');

				// Iterate through each flashcard in the set, fill in the template with the flashcard's data and render the flashcard
				for(const flashcard of flashcardSet.flashcards) {
					const templateContents = document.importNode(template.content, true);
					const contentsContainer = templateContents.querySelector('.flashcard-contents');
					const question = templateContents.querySelector('.flashcard-question');
					const answer = templateContents.querySelector('.flashcard-answer .overflow-container'); // Set text inside overflow container which displays a scrollbar if the content is too long
					const tags = templateContents.querySelector('.flashcard-tags');
					const editButton = templateContents.querySelector('.edit-flashcard');
					const deleteButton = templateContents.querySelector('.delete-flashcard');

					contentsContainer.setAttribute('aria-label', 'Flip Flashcard:' + flashcard.question);
					question.textContent = flashcard.question;
					answer.textContent = flashcard.answer;
					tags.textContent = flashcard.tags;
					editButton.dataset.id = flashcard.id;
					editButton.setAttribute('aria-label', 'Edit Flashcard: "' + flashcard.question + '"');
					deleteButton.dataset.id = flashcard.id;
					deleteButton.setAttribute('aria-label', 'Delete Flashcard: "' + flashcard.question + '"');

					itemsList.appendChild(templateContents);
				}

				itemsList.classList.remove('hidden');
				emptyMessage.classList.add('hidden');

			// If there are no flashcards to display
			} else {
				itemsList.classList.add('hidden');
				emptyMessage.classList.remove('hidden');
			}
		}

		// Appends a FlashcardSet object to the `flashcardSets` array/attribute
		addFlashcardSet(flashcardSet) {
			// Check if the passed value is an instance of the FlashcardSet class. If it is not, throw an error.
			if(!(flashcardSet instanceof FlashcardSet)) {
				throw new Error('Flashcard Set could not be added. Invalid instance provided.');
			}

			this.flashcardSets.push(flashcardSet); // Append the set
		}

		// Replaces an existing FlashcardSet object in the `flashcardSets` array/attribute with another instance
		replaceFlashcardSet(id, newFlashcardSet) {
			const oldFlashcardSet = this.flashcardSets.find((item) => item.id == id); // Retrieve the set whose ID matches the provided ID

			// Check if there is a matching set. If there is none, throw an error.
			if(!oldFlashcardSet) {
				throw new Error('Flashcard Set could not be found.');
			}

			// Check if the new set provided is an instance of the FlashcardSet class. If it is not, throw an error.
			if(!(newFlashcardSet instanceof FlashcardSet)) {
				throw new Error('Flashcard Set could not be updated. Invalid instance provided.');
			}

			this.flashcardSets = this.flashcardSets.map((item) => item.id == id ? newFlashcardSet : item); // Iterate through the items. Replace the matching set with the new set. Retain the other items.
		}

		// Removes an existing FlashcardSet object from the `flashcardSets` array/attribute
		removeFlashcardSet(id) {
			const flashcardSet = this.flashcardSets.find((item) => item.id == id); // Retrieve the set whose ID matches the provided ID

			// Check if there is matching set. If there is none, throw an error.
			if(!flashcardSet) {
				throw new Error('Flashcard Set could not be found.');
			}

			this.flashcardSets = this.flashcardSets.filter((item) => item.id != id); // Filter out the matching set
		}
	}

	/*-------------------------
	- Start of program
	-------------------------*/

	const app = new App();
	app.loadData();
	app.render();

	// Capture "click" event in the document.body for event delegation
	document.body.addEventListener('click', (event) => {
		const eventTargetClasses = [...event.target.classList]; // Convert class list into an array by spreading its contents into an array

		// Click event handler for ".dialog-open-button" elements
		if(eventTargetClasses.includes('dialog-open-button')) {
			const button = event.target;
			const dialog = button.dataset?.dialog ? document.querySelector(button.dataset.dialog) : null;

			// Check if the dialog element exists and if it is actually a dialog element. If so, open the dialog element.
			if(dialog && dialog.tagName == 'DIALOG') {
				dialog.showModal();
			}
		}

		// Click event handler for ".dialog-close-button" elements
		if(eventTargetClasses.includes('dialog-close-button')) {
			const button = event.target;
			const dialog = button.closest('dialog');

			// Check if the dialog element exists. If so, close the dialog element.
			if(dialog) {
				dialog.close();
			}
		}

		// Click event handler for ".edit-set" elements
		if(eventTargetClasses.includes('edit-set')) {
			const button = event.target;
			const { id } = button.dataset;
			const form = document.getElementById('edit-set-form');
			const flashcardSet = app.flashcardSets.find((item) => item.id == id);

			// Check if the ID is not a falsy value (empty), the form and flashcard set exist. If so, pre-fill the form fields with the flashcard set's data.
			if(id && form && flashcardSet) {
				const nameInput = form.querySelector('input[name="name"]');
				const idInput = form.querySelector('input[name="set_id"]');

				nameInput.value = flashcardSet.name;
				idInput.value = id;
			}
		}

		// Click event handler for ".delete-set" elements
		if(eventTargetClasses.includes('delete-set')) {
			const button = event.target;
			const { id } = button.dataset;
			const form = document.getElementById('delete-set-form');
			const input = form ? form.querySelector('input[name="set_id"]') : null;

			// Check if the ID is not a falsy value (empty), the form and input exist. If so, set the ID as the input's value.
			if(id && form && input) {
				input.value = id;
			}
		}

		// Click event handler for ".view-set-button" elements
		if(eventTargetClasses.includes('view-set-button')) {
			const button = event.target;
			const { id } = button.dataset;
			const flashcardSet = app.flashcardSets.find((item) => item.id == id);

			// Check if the ID is not a falsy value and there is a matching flashcard set
			if(id && flashcardSet) {
				// Set the app to "Individual Set" view and render the view
				app.viewedSetId = id;
				app.isSetView = false;
				app.render();
			}
		}

		// Click event handler for ".edit-flashcard" elements
		if(eventTargetClasses.includes('edit-flashcard')) {
			const button = event.target;
			const { id } = button.dataset;
			const form = document.getElementById('edit-card-form');
			const flashcardSet = app.flashcardSets.find((item) => item.id == app.viewedSetId); // Retrieve the flashcard set whose ID matches the viewed set's ID
			const flashcard = flashcardSet?.flashcards ? flashcardSet?.flashcards.find((item) => item.id == id) : null; // Retrieve the flashcard in the set whose ID matches the button's data-id attribute

			// Check if the ID is not a falsy value (empty), the form and flashcard exist. If so, pre-fill the form fields with the flashcard's data.
			if(id && form && flashcard) {
				const questionInput = form.querySelector('input[name="question"]');
				const answerTextarea = form.querySelector('textarea[name="answer"]');
				const tagsInput = form.querySelector('input[name="tags"]');
				const idInput = form.querySelector('input[name="flashcard_id"]');

				questionInput.value = flashcard.question;
				answerTextarea.value = flashcard.answer;
				tagsInput.value = flashcard.tags;
				idInput.value = id;
			}
		}

		// Click event handler for ".delete-flashcard" elements
		if(eventTargetClasses.includes('delete-flashcard')) {
			const button = event.target;
			const { id } = button.dataset;
			const form = document.getElementById('delete-card-form');
			const input = form ? form.querySelector('input[name="flashcard_id"]') : null;

			// Check if the ID is not a falsy value (empty), the form and input exist. If so, set the ID as the input's value.
			if(id && form && input) {
				input.value = id;
			}
		}

		// Click event handler for ".flashcard-contents" elements and any elements under ".flashcard-contents"
		const flashcardContents = event.target.closest('.flashcard-contents');
		if(eventTargetClasses.includes('flashcard-contents') || flashcardContents) {
			const flashcard = event.target.closest('.flashcard');
			flipFlashcard(flashcard);
		}
	});

	// Capture "submit" event in the document.body for event delegation
	document.body.addEventListener('submit', (event) => {
		const { id } = event.target;

		// Submit event handler for "#add-set-form" form
		if(id == 'add-set-form') {
			event.preventDefault();

			const form = event.target;
			const formData = Object.fromEntries(new FormData(form)); // Convert submitted form data into an object
			const { name } = formData;
			const newFlashcardSet = new FlashcardSet(name);

			app.addFlashcardSet(newFlashcardSet);
			app.saveData();
			app.render();
			form.submit();
			form.reset();

			// Announce successful completion to accessibility devices
			setTimeout(() => {
				updateAccessibilityStatus('Set successfully created.');
			}, 200); // The delay is necessary as screen readers will announce the change of focus when the form is submitted which closes its parent dialog element
		}

		// Submit event handler for "#edit-set-form" form
		if(id == 'edit-set-form') {
			event.preventDefault();

			const form = event.target;
			const formData = Object.fromEntries(new FormData(form)); // Convert submitted form data into an object
			const setId = formData?.set_id;
			const { name } = formData;
			const oldFlashcardSet = app.flashcardSets.find((item) => item.id == setId);
			const newFlashcardSet = new FlashcardSet(name);

			// Retain the id and dateCreated fields of the old flashcard set
			newFlashcardSet.id = oldFlashcardSet.id;
			newFlashcardSet.dateCreated = oldFlashcardSet.dateCreated;

			app.replaceFlashcardSet(setId, newFlashcardSet);
			app.saveData();
			app.render();
			form.submit();
			form.reset();

			// Announce successful completion to accessibility devices
			setTimeout(() => {
				updateAccessibilityStatus('Set successfully updated.');
			}, 200); // The delay is necessary as screen readers will announce the change of focus when the form is submitted which closes its parent dialog element
		}

		// Submit event handler for "#delete-set-form" form
		if(id == 'delete-set-form') {
			event.preventDefault();

			const form = event.target;
			const formData = Object.fromEntries(new FormData(form)); // Convert submitted form data into an object
			const setId = formData?.set_id;

			app.removeFlashcardSet(setId);
			app.saveData();
			app.render();
			form.submit();
			form.reset();

			// Announce successful completion to accessibility devices
			setTimeout(() => {
				updateAccessibilityStatus('Set successfully deleted.');
			}, 200); // The delay is necessary as screen readers will announce the change of focus when the form is submitted which closes its parent dialog element
		}

		// Submit event handler for "#add-card-form" form
		if(id == 'add-card-form') {
			event.preventDefault();

			const form = event.target;
			const formData = Object.fromEntries(new FormData(form)); // Convert submitted form data into an object
			const { question, answer, tags } = formData;
			const flashcardSet = app.flashcardSets.find((item) => item.id == app.viewedSetId); // Retrieve the set whose ID matches the ID of the viewed set
			const newFlashcard = new Flashcard(question, answer, tags);

			// Check if a matching set was found before proceeding
			if(flashcardSet) {
				flashcardSet.addFlashcard(newFlashcard);
				app.saveData();
				app.render();
				form.submit();
				form.reset();

				// Announce successful completion to accessibility devices
				setTimeout(() => {
					updateAccessibilityStatus('Flashcard successfully added.');
				}, 200); // The delay is necessary as screen readers will announce the change of focus when the form is submitted which closes its parent dialog element
			}
		}

		// Submit event handler for "#edit-card-form" form
		if(id == 'edit-card-form') {
			event.preventDefault();

			const form = event.target;
			const formData = Object.fromEntries(new FormData(form)); // Convert submitted form data into an object
			const flashcardId = formData?.flashcard_id;
			const { question, answer, tags } = formData;
			const flashcardSet = app.flashcardSets.find((item) => item.id == app.viewedSetId); // Retrieve the set whose ID matches the ID of the viewed set
			const oldFlashcard = flashcardSet?.flashcards ? flashcardSet.flashcards.find((item) => item.id == flashcardId) : null; // Retrieve the flashcard in the set whose ID matches the value of the ID input
			const newFlashcard = new Flashcard(question, answer, tags);

			// Retain the id and dateCreated fields of the old flashcard
			newFlashcard.id = oldFlashcard.id;
			newFlashcard.dateCreated = oldFlashcard.dateCreated;

			// Check if a matching set was found before proceeding
			if(flashcardSet) {
				flashcardSet.replaceFlashcard(flashcardId, newFlashcard);
				app.saveData();
				app.render();
				form.submit();
				form.reset();

				// Announce successful completion to accessibility devices
				setTimeout(() => {
					updateAccessibilityStatus('Flashcard successfully updated.');
				}, 200); // The delay is necessary as screen readers will announce the change of focus when the form is submitted which closes its parent dialog element
			}
		}

		// Submit event handler for "#delete-card-form" form
		if(id == 'delete-card-form') {
			event.preventDefault();

			const form = event.target;
			const formData = Object.fromEntries(new FormData(form)); // Convert submitted form data into an object
			const flashcardSet = app.flashcardSets.find((item) => item.id == app.viewedSetId); // Retrieve the set whose ID matches the ID of the viewed set
			const flashcardId = formData?.flashcard_id;

			// Check if a matching set was found before proceeding
			if(flashcardSet) {
				flashcardSet.removeFlashcard(flashcardId);
				app.saveData();
				app.render();
				form.submit();
				form.reset();

				// Announce successful completion to accessibility devices
				setTimeout(() => {
					updateAccessibilityStatus('Flashcard successfully deleted.');
				}, 200); // The delay is necessary as screen readers will announce the change of focus when the form is submitted which closes its parent dialog element
			}
		}
	});

	// Capture "transitionstart" event in the document.body for event delegation
	document.body.addEventListener('transitionstart', (event) => {
		const eventTargetClasses = [...event.target.classList]; // Convert class list into an array by spreading its contents into an array

		// Transition start event handler for ".flashcard" elements
		if(eventTargetClasses.includes('flashcard-contents')) {
			const flashcard = event.target.closest('.flashcard');

			// Check if the ".flashcard-contents" is nested under a ".flashcard" element
			if(flashcard) {
				flashcard.classList.add('transitioning');
			}
		}
	});

	// Capture "transitionend" event in the document.body for event delegation
	document.body.addEventListener('transitionend', (event) => {
		const eventTargetClasses = [...event.target.classList]; // Convert class list into an array by spreading its contents into an array

		// Transition end event handler for ".flashcard" elements
		if(eventTargetClasses.includes('flashcard-contents')) {
			const flashcard = event.target.closest('.flashcard');

			// Check if the ".flashcard-contents" is nested under a ".flashcard" element
			if(flashcard) {
				flashcard.classList.remove('transitioning');
			}
		}
	});

	// Capture "keyup" event in the document.body for event delegation
	document.body.addEventListener('keyup', (event) => {
		const eventTargetClasses = [...event.target.classList]; // Convert class list into an array by spreading its contents into an array

		// Key up event handler for ".flashcard-contents" elements (limited to the space and enter keys)
		if(eventTargetClasses.includes('flashcard-contents') && (event.key === " " || event.key === "Enter")) {
			const flashcard = event.target.closest('.flashcard');
			flipFlashcard(flashcard);
		}
	});
})();