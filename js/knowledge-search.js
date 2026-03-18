/*
Description: This script contains the code that handles the submission of the knowledge search form and sending of the corresponding API requests.
Author: Jonathan Cruz
*/

(function() {
	/*-------------------------
	- Function definitions
	-------------------------*/

	// Takes a string value and returns the string with its first letter capitalized
	function capitalize(value) {
		return value[0].toUpperCase() + value.slice(1); // Take the first character, capitalize it and prepend it to the remaining slice of the string
	}

	// An asynchronous function that takes string indicating the request URL and an object containing the options or settings of the request.
	// Returns the response as an object if the request was successfully sent. Otherwise, it returns false.
	async function sendRequest(url, options) {
		const request = new Request(url, options);
		const response = await fetch(request);

		// If the request failed, throw an error
		if(!response.ok) {
			throw new Error('Request could not be completed.');
		}

		return await response.json();
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

	// Displays a timed (3 seconds) notification message with the provided text
	function showNotification(text, cssClasses) {
		cssClasses = ('notification ' + cssClasses).trim();

		Swal.fire({
			titleText: text,
			toast: true,
			position: 'bottom',
			timer: 3000,
			timerProgressBar: true,
			customClass: {
				container: 'notification-container',
				popup: cssClasses
			},
			showConfirmButton: false,
		});
	}

	/*-------------------------
	- Class definitions
	-------------------------*/

	// A class containing a collection of static search methods
	class KnowledgeSearch {
		static #apis = {
			'dictionary': {
				baseUrl: 'https://www.dictionaryapi.com/api/v3/references/collegiate/json/',
				apiKey: MW_DICTIONARY_API_KEY
			},
			'encyclopedia': {
				baseUrl: 'https://en.wikipedia.org/w/rest.php/v1/',
			}
		} // The APIs searched and their corresponding information

		// Asynchronously searches the dictionary API for the matching words and returns an array containing the results
		static async searchDictionary(keyword) {
			const url = this.#apis.dictionary.baseUrl +  encodeURIComponent(keyword) + '?key=' + this.#apis.dictionary.apiKey;
			const data = await sendRequest(url, {
				method: 'GET'
			});

			return data;
		}

		// Asynchronously searches the encyclopedia API for the matching entries and returns an object containing the results
		static async searchEncyclopedia(keyword) {
			const url = this.#apis.encyclopedia.baseUrl + 'search/page?q=' + encodeURIComponent(keyword) + '&limit=1';
			const data = await sendRequest(url, {
				method: 'GET'
			}); // Search the encyclopedia for the entry that matches the keyword (this returns the metadata of the entry and only contains a short description and excerpt of the entry)

			return data;
		}

		// Asynchronously retrieves the full details of an entry that matches the provided slug/key. Returns an object containing the entry's details.
		static async getEncyclopediaEntry(slug) {
			const url = this.#apis.encyclopedia.baseUrl + 'page/' + slug + '/with_html';
			const data = await sendRequest(url, {
				method: 'GET'
			}); // Get the entry's details with its HTML contents (as opposed to WikiText)

			return data;
		}
	}

	// Represents the application page containing the knowledge search elements
	class App {
		constructor() {
			this.loading = false; // Boolean flag that indicates if the app is currently loading/processing a request
			this.source = ''; // The API to send the request to
			this.searchResults = []; // The array of search results
		}

		// Takes in a string value representing the search keyword performs an asynchronous search based on the selected source. Sets the array of results as the value of the `searchResults` attribute.
		async search(keyword) {
			const resultsList = document.getElementById('knowledge-search-results');
			const noResults = document.getElementById('knowledge-search-no-results');
			const loading = document.getElementById('knowledge-search-loading');

			// Set the instance as loading, display the loading message, and hide the results and no results message
			this.loading = true;
			loading.classList.remove('hidden');
			resultsList.classList.add('hidden');
			noResults.classList.add('hidden');

			try {
				let results;

				// If the source selected is the dictionary, perform a dictionary search
				if(this.source == 'Dictionary') {
					results = await KnowledgeSearch.searchDictionary(keyword);
				// If the source selected is the encyclopedia, perform an encyclopedia search and grab the 1st entry's full details
				} else if (this.source == 'Encyclopedia') {
					const data = await KnowledgeSearch.searchEncyclopedia(keyword);
					let entry;

					// If the the encyclopedia search returned data and the 1st entry contains a description (according to the API, entries that do not exist will have no description), get the 1st entry's full details (contents, etc)
					if(data?.pages && data.pages.length > 0 && data.pages[0].description) {
						entry = await KnowledgeSearch.getEncyclopediaEntry(data.pages[0].key);
					}

					// If the entry's details was found, assign the entry as the only result
					if(entry) {
						results = [entry];
					}
				}

				this.searchResults = results;
			// If an error occurs, update the accessibility status and show an error notification
			} catch {
				const statusMessage = 'An error occured while processing your search request. Please try submitting the form again or use a different keyword.';
				updateAccessibilityStatus(statusMessage);
				showNotification(statusMessage, 'error');
			}

			// Unset the instance as loading and hide the loading message
			this.loading = false;
			loading.classList.add('hidden');
		}

		// Renders the search results to the page based on the current source
		render() {
			if(this.source == 'Dictionary') {
				this.#renderDictionaryResults();
			} else if(this.source == 'Encyclopedia') {
				this.#renderEncyclopediaResult();
			}
		}

		// Renders the dictionary search results. It expects the an array containing the dictionary API's search results.
		#renderDictionaryResults() {
			const template = document.getElementById('dictionary-result-template');
			const resultsList = document.getElementById('knowledge-search-results');
			const noResults = document.getElementById('knowledge-search-no-results');
			let resultsRendered = 0;

			resultsList.replaceChildren(); // Clear the results list before appending results

			// If results were found, render them
			if(this.searchResults && this.searchResults.length > 0) {
				for(const item of this.searchResults) {
					// Check if the result contains an ID (if the search does not find any matches, sometimes the API returns suggestions which do not have an ID)
					if(!item?.meta?.id) {
						continue;
					}

					const templateContents = document.importNode(template.content, true);
					const dl = templateContents.querySelector('dl');
					const title = templateContents.querySelector('.result-title');
					const itemTitle = item.meta.id.split(':')[0]; // The search result's ID contains the term being defined and is sometimes followed by its numeric ID delimited by a colon (occurs when the defined term comes in multiple forms)

					// Fill in the template's elements with the search result's data
					title.textContent = capitalize(itemTitle) + ' (' + item.fl + ')'; // Include the form of the defined term (i.e. whether its a noun, verb, adjective, adverb, etc)

					// Iterate through all definitions and append each of them as a <dd> element
					for(const definition of item.shortdef) {
						const dd = document.createElement('dd');
						dd.classList.add('result-description');

						dd.textContent = capitalize(definition + '.');
						dl.appendChild(dd);
					}

					resultsList.appendChild(templateContents); // Append the template contents to the list of sets
					resultsRendered++;
				}
			}

			// If there were results rendered, display the results list and hide the no results message
			if(resultsRendered > 0) {
				resultsList.classList.remove('hidden');
				noResults.classList.add('hidden');
			// Otherwise, hide the results list and display the no results message
			} else {
				resultsList.classList.add('hidden');
				noResults.classList.remove('hidden');
			}
		}

		// Renders the encyclopedia search result. It expects the an object containing the encyclopedia entry's data.
		#renderEncyclopediaResult() {
			const template = document.getElementById('encyclopedia-result-template');
			const resultsList = document.getElementById('knowledge-search-results');
			const noResults = document.getElementById('knowledge-search-no-results');

			resultsList.replaceChildren(); // Clear the results list before appending the result

			// Check if there are results to render and if the entry's HTML contents exists. If so, display the text contents of the 1st section found in the entry's HTML contents.
			if(this.searchResults.length > 0 && this.searchResults[0]?.html) {
				const entry = this.searchResults[0];
				const domParser = new DOMParser();
				const entryDoc = domParser.parseFromString(entry.html, 'text/html'); // Parse the entry's HTML (the API returns an entire HTML document)
				const paragraphs = entryDoc.querySelectorAll('section:nth-of-type(1) p'); // Retrieve the 1st section's paragraph elements
				const templateContents = document.importNode(template.content, true);
				const title = templateContents.querySelector('.result-title');
				const description = templateContents.querySelector('.result-description');
				const link = templateContents.querySelector('.result-link');
				const url = 'https://en.wikipedia.org/wiki/' + entry.key;

				// Fill in the template's elements with the entry's data
				title.textContent = entry.title;
				link.setAttribute('href', url);

				// Iterate through the paragraphs and extract and append their texts as new paragraphs (we only want the text since the returned HTML may contain unwanted or unsecure elements)
				for(const p of paragraphs) {
					const text = p.textContent.trim();

					// Skip the paragraph if its empty
					if(text == '') {
						continue;
					}

					// Insert the text as a new paragraph in the template
					const newParagraph = document.createElement('p');
					newParagraph.innerText = text;
					description.appendChild(newParagraph);
				}

				resultsList.appendChild(templateContents); // Append the template contents to the list of sets

				// Display the results and hide the no results message
				resultsList.classList.remove('hidden');
				noResults.classList.add('hidden');
			// Otherwise, show the no results message
			} else {
				resultsList.classList.add('hidden');
			}
		}
	}

	/*-------------------------
	- Start of program
	-------------------------*/

	const app = new App();
	const searchForm = document.getElementById('knowledge-search-form');

	// Event handler for the submit event of the #knowledge-search-form
	searchForm.addEventListener('submit', async (event) => {
		event.preventDefault();

		const form = event.target;
		const formData = Object.fromEntries(new FormData(form)); // Convert the form data into an object
		const {search, source} = formData;
		const submitButton = form.querySelector('button[type="submit"]');

		// If the app instance is still loading, or if the keyword or source are not provided, do not proceed.
		if(app.loading || search === '' || source == '') {
			return;
		}

		submitButton.setAttribute('disabled', '');

		// Update the source of the app instance, perform the search and render the results
		app.source = source;
		await app.search(search);
		app.render();

		submitButton.removeAttribute('disabled');
	});
})()