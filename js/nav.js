/*
Description: This script utilizes jQuery to make the mobile navigation of the website functional.
Author: Jonathan Cruz
*/
(function() {
	const $navToggle = $('#navigation-toggle');
	const $navClose = $('#navigation-close');
	const $mobileNav = $('#site-mobile-navigation');
	const hasTransition = $mobileNav.css('transition-duration') !== '0s' && $mobileNav.css('transition-duration') !== '0ms';

	// Click event handler for the #navigation-toggle element
	$navToggle.on('click', (e) => {
		e.preventDefault();

		// Check if the mobile navigation element exists. If it doesn't, exit the function.
		if($mobileNav.length == 0) {
			return;
		}

		// Toggle the mobile navigation open
		$mobileNav.css('visibility', 'visible');
		$mobileNav.addClass('active');
	});

	// Click event handler for the #navigation-close element
	$navClose.on('click', (e) => {
		e.preventDefault();

		// Check if the mobile navigation element exists. If it doesn't, exit the function.
		if($mobileNav.length == 0) {
			return;
		}

		// Close the mobile navigation
		$mobileNav.removeClass('active');

		// Check if there is a transition effect. If it does not, immediately set element as hidden (otherwise, rely on the "transitionend" event handler).
		if(!hasTransition) {
			$mobileNav.css('visibility', 'hidden');
		}
	});

	// Transition end event handler for #site-mobile-navigation element
	$mobileNav.on('transitionend', (e) => {
		// Check if mobile navigation was closed and the event actually occured on the mobile navigation itself (this disregards the event if it bubbled up from a child element)
		if(!$mobileNav.hasClass('active') && e.target == e.currentTarget) {
			$mobileNav.css('visibility', 'hidden');
		}
	});
}())