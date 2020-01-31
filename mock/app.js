angular.module('app', ['ngMaterial', 'ngResource'])
	.config(function($mdThemingProvider) {
		$mdThemingProvider.theme('default')
			.primaryPalette('blue-grey')
			.dark();
	})
	.config(function($logProvider) {
		$logProvider.debugEnabled(true);
	});
