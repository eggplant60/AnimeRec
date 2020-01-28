angular.module('app')
	.controller('AppCtrl', ['$scope', '$log', '$timeout', 'ApiService', 'CommonService', AppCtrl])
	.filter('extractDate', extractDate);
	//.filter('extractChannel', extractDate);

function AppCtrl($scope, $log, $timeout, api, common) {
	$log.debug('AppCtrl: start ---------------------');

	const genreId = '107100';

	var vm = this;
	vm.programs = [];
	vm.dowList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	const params = {
		from    : '2020-01-28T08:45:00',
		to      : '2020-02-04T05:00:00',
		genreId : '107100'
	};

	api.chantoru.tvsearch(params).$promise.then(
		(data) => {
			//$log.debug(data);
			vm.programs = data;
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