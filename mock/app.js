angular.module('app', ['ngMaterial', 'ngResource'])
	.config(function($mdThemingProvider) {
		//$mdThemingProvider.generateThemesOnDemand(true);
		$mdThemingProvider.alwaysWatchTheme(true); // Enable theme watching.
		$mdThemingProvider.theme('light');       // light thme
		$mdThemingProvider.theme('dark').dark(); // dark theme
			
		//$mdThemingProvider.setDefaultTheme('dark');
	})
	.config(function($logProvider) {
		$logProvider.debugEnabled(true);
	});
