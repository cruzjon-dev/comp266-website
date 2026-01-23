/*
Description: Filters elements using a search keyword provided in a text field.

Reference:
GeeksForGeeks. (2024, August 28). How to Create a Filter List using JavaScript? Retrieved January 6, 2026, from https://www.geeksforgeeks.org/javascript/how-to-create-a-filter-list-using-javascript/

Modifications:
- Updated code to filter elements based on data attributes attached to the input element.
- Attached event listener to document body and utilized event delegation to retain the functionality in the event that the input element is removed and re-added back onto the page.
- The delegated event searches for a class of "filter-input" instead of an ID.
- The data-target attribute is mandatory and is expected to contain a valid CSS selector. This identifies the elements to be filtered.
- The data-target-text attribute is optional. If included, it is also expected to contain a valid CSS selector. This identifies the child elements in the filtered elements. The text of these child elements will need to match the search keyword. If their text matches the keyword, their parent element will be visible/remain visible.
- If the data-target-text attribute is omitted. The inner text of the elements specified will need to match the search keyword. If their text matches the keyword, the element will be visible/remain visible.
- The data-no-results attribute is optional. If included, it is expected to contain a valid CSS selector. This identifies the element(s) that should be shown when the search does not yield any result.
*/

document.body.addEventListener('input', function(event) {
	const eventTargetClasses = [...event.target.classList] // Convert the class list into an array by spreading its content into an array

	if(eventTargetClasses.includes('filter-input')) {
		const input = event.target; // The search/filter input field
		const filterValue = input.value.toLowerCase(); // The search/filter keyword(s)
		const filterTarget = document.querySelectorAll(input.dataset?.target); // The elements to be filtered / elements whose visibility will be toggled
		const filterNoResults = document.querySelectorAll(input.dataset?.noResults); // The element(s) that is displayed when no results are found (e.g. a paragraph containing "No Results found.")
		let matchCount = 0; // Number of matching items found

		// Iterate through all target elements and check if their specified child element(s) contain the search keyword
		filterTarget.forEach(function(targetEl) {
			let isMatch = false;

			// If there are specified child elements to be inspected, match the search keyword with the child elements' text
			if(input.dataset?.targetText !== undefined) {
				const filterTexts = targetEl.querySelectorAll(input.dataset.targetText); // The child elements within the target element whose text should contain the search keyword

				// Convert the filterTexts node list into an array and reduce it to a singular value. This value serves as the boolean flag indicating if one or more of the child elements contain the search keyword.
				isMatch = [...filterTexts].reduce(function(accumulator, current) {
					const text = current.innerText.toLowerCase();
					return accumulator ? accumulator : text.includes(filterValue);
				}, false);
			// Otherwise, match the search keyword with the elements' text
			} else {
				const text = targetEl.innerText.toLowerCase();
				isMatch = text.includes(filterValue);
			}

			// Toggle the visibility of the target elements by removing or adding the class "hidden" from their class list
			if(isMatch) {
				matchCount++;
				targetEl.classList.remove('hidden');
			} else {
				targetEl.classList.add('hidden');
			}
		});

		// Iterate through all elements that should be shown if the searching/filtering did not yield any results
		filterNoResults.forEach(function(el) {
			// If there are no matching items, show the filterNoResults element(s)
			if(matchCount === 0) {
				el.classList.remove('hidden');
			// Otherwise, hide it
			} else {
				el.classList.add('hidden');
			}
		});
	}
});