angular.module('app', ['ngMaterial', 'ngResource', 'ngStorage'])
	.config(function($mdThemingProvider) {
		$mdThemingProvider.alwaysWatchTheme(true); // Enable theme watching.
		$mdThemingProvider.theme('light');       // light thme
		$mdThemingProvider.theme('dark').dark(); // dark theme
	})

	.config(function($logProvider) {
		$logProvider.debugEnabled(true);
	});
	

