angular.module('app', ['ngMaterial', 'ngResource'])
	.config(function($mdThemingProvider) {
		// Enable theme watching.
		$mdThemingProvider.alwaysWatchTheme(true);	
		// // dark theme
		// $mdThemingProvider.theme('default')
		// 	.primaryPalette('indigo')
		// 	.dark();

		// light thme
		$mdThemingProvider.theme('default');
	})
	.config(function($logProvider) {
		$logProvider.debugEnabled(true);
	});
