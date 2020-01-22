angular.module('app')
	.controller('AppCtrl', ['$scope', '$log', '$timeout', 'ApiService', AppCtrl]);

function AppCtrl($scope, $log, $timeout, api) {
	$log.debug('AppCtrl: start ---------------------');

	var vm = this;
	vm.programs = [];

	api.chantoru.tvsearch().$promise.then(
		(data) => {
			//$log.debug(data);
			vm.programs = data;
		},
		(httpError) => {
			$log.error(httpError);
		}
	);
	
}