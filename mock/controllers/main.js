angular.module('app')
	.controller('AppCtrl', ['$scope', '$log', '$timeout', 'ApiService', AppCtrl])
	.filter('extractDate', extractDate);
	//.filter('extractChannel', extractDate);

function AppCtrl($scope, $log, $timeout, api) {
	$log.debug('AppCtrl: start ---------------------');

	var vm = this;
	vm.programs = [];
	vm.dowList = ['Mon', 'Tue', 'Wed', 'Thu'];
	api.chantoru.tvsearch().$promise.then(
		(data) => {
			//$log.debug(data);
			vm.programs = data.list;
		},
		(httpError) => {
			$log.error(httpError);
		}
	);
	
}

// function extractDate () {
// 	return function(text) {
// 		var rec = /(.+)\[.+\]/.exec(text);
// 		if (!rec) {
// 			return rec[0];
// 		} else {
// 			return '';
// 		}
// 	};
// }

function extractDate () {
	return function(value) {
		return value.split('[')[0].trim();
	};
}