angular.module('app', ['ngMaterial', 'ngResource'])
	.config(function($mdThemingProvider) {
		$mdThemingProvider.alwaysWatchTheme(true); // Enable theme watching.
		$mdThemingProvider.theme('default'); // light thme
		// // dark theme
		// $mdThemingProvider.theme('default')
		// 	.primaryPalette('indigo')
		// 	.dark();
	})
	.config(function($logProvider) {
		$logProvider.debugEnabled(true);
	});
