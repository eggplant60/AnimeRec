angular.module('app', ['ngMaterial', 'ngResource'])
	.config(function($mdThemingProvider) {
		$mdThemingProvider.theme('default')
			.primaryPalette('indigo')
			.dark();
	})
	.config(function($logProvider) {
		$logProvider.debugEnabled(true);
	});
