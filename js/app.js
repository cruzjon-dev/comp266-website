/*
Description: This script serves as the main script of the FlashStash website and houses all of its functionalities.
Author: Jonathan Cruz
*/
(function() {
	/*-------------------------
	- Function definitions
	-------------------------*/

	// Generates an ID based on the current time (milliseconds) and a random number
	function generateID() {
		const randomNumber = Math.floor(Math.random() * 1000); // A random number between 0 to 1000
		return Date.now() + "-" + randomNumber;
	}

	/*-------------------------
	- Class definitions
	-------------------------*/

	// Represents a set of flashcards
	class FlashcardSet {
		constructor(name) {
			const today = new Date().toISOString();

			this.id = generateID();
			this.name = name;
			this.flashcards = [];
			this.dateCreated = today;
			this.dateModified = today;
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

		// The constructor method. Instantiates the object's attributes.
		constructor() {
			this.flashcardSets = []; // Array of FlashcardSets
			this.isSetView = true; // Boolean flag that indicates if the "My Flashcards" page should display FlashcardSets or Flashcards
			this.viewedSetId = null; // The ID of the displayed FlashcardSet
		}

		// Fetches data from the local storage, parses it and stores it into the `flashcardSets` attribute.
		loadData() {
			const data = localStorage.getItem(this.#storageKey);
			const parsedData = JSON.parse(data);

			if(parsedData) {
				this.flashcardSets = parsedData;
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
		}

		// Renders the appropriate view within #flashcard-section (currently only switches to the "individual set" view for displaying flashcards in a set)
		#renderView() {
			const section = document.getElementById('flashcards-section');
			const viewTemplate = document.getElementById('flashcards-view-template');
			const viewTemplateContents = document.importNode(viewTemplate.content, true);
			const flashcardSet = app.flashcardSets.find((item) => item.id == app.viewedSetId); // Retrieve flashcard set whose ID matches app.viewedSetId

			// If a matching flashcard set is found
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

			// Empty out list of flashcard sets before rendering data
			itemsList.replaceChildren();

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
					editButton.setAttribute('aria-label', 'Edit "' + flashcardSet.name + '"');
					deleteButton.dataset.id = flashcardSet.id;
					deleteButton.setAttribute('aria-label', 'Delete "' + flashcardSet.name + '"');
					viewButton.dataset.id = flashcardSet.id;

					// Append the template contents to the list of sets
					itemsList.appendChild(templateContents);
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
					const editButton = templateContents.querySelector('.edit-flashcard');
					const deleteButton = templateContents.querySelector('.delete-flashcard');

					templateContents.querySelector('dt').textContent = flashcard.question;
					templateContents.querySelector('dd').textContent = flashcard.answer;
					editButton.dataset.id = flashcard.id;
					editButton.setAttribute('aria-label', 'Edit "' + flashcard.question + '"');
					deleteButton.dataset.id = flashcard.id;
					deleteButton.setAttribute('aria-label', 'Delete "' + flashcard.question + '"');

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

		addFlashcardSet(flashcardSet) {
			if(!(flashcardSet instanceof FlashcardSet)) {
				throw new Error('Flashcard Set could not be added. Invalid instance provided.');
			}

			this.flashcardSets.push(flashcardSet);
			this.saveData();
			this.render();
		}

		replaceFlashcardSet(id, newFlashcardSet) {
			const oldFlashcardSet = this.flashcardSets.find((item) => item.id == id);

			if(!oldFlashcardSet) {
				throw new Error('Flashcard Set could not be found.');
			}

			if(!(newFlashcardSet instanceof FlashcardSet)) {
				throw new Error('Flashcard Set could not be updated. Invalid instance provided.');
			}

			this.flashcardSets = this.flashcardSets.map((item) => item.id == id ? newFlashcardSet : item);
			this.saveData();
			this.render();
		}

		removeFlashcardSet(id) {
			const flashcardSet = this.flashcardSets.find((item) => item.id == id);

			if(!flashcardSet) {
				throw new Error('Flashcard Set could not be found.');
			}

			this.flashcardSets = this.flashcardSets.filter((item) => item.id != id);
			this.saveData();
			this.render();
		}
	}

	/*-------------------------
	- Start of program
	-------------------------*/

	const app = new App();
	app.loadData();
	app.render();

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
	});

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
			form.submit();
			form.reset();
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
			form.submit();
			form.reset();
		}

		// Submit event handler for "#delete-set-form" form
		if(id == 'delete-set-form') {
			event.preventDefault();

			const form = event.target;
			const formData = Object.fromEntries(new FormData(form)); // Convert submitted form data into an object
			const setId = formData?.set_id;

			app.removeFlashcardSet(setId);
			form.submit();
			form.reset();
		}
	});
})();