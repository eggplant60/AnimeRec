angular.module('app', ['ngMaterial', 'ngResource'])
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('altTheme')
    .primaryPalette('blue')
    .accentPalette('orange');
  })
.config(function($logProvider) {
  $logProvider.debugEnabled(true);
  });
