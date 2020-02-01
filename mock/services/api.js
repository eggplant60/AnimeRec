(function () {
	'use strict';

	angular.module('app')
			.service('ApiService', ['$log', '$resource', ApiService]);

	function ApiService($log, $resource) {

		const _baseUrl = 'http://127.0.0.1:3001/api';
		this.paramDefaults = {
			tvsearch : {},
			schedule : {},
			resv : {
				op: 'add', 
				sid: 0, 
				eid: 0, 
				category: 1, 
				//date: date.toJSON(),
				duration: 0,
				title: '',
				quality: 230,
				condition: 'w1',
				destination: 'HDD'
			}
		};

		this.tvsearch = $resource(_baseUrl + '/tvsearch', {},
			{
				get: {method: 'GET', isArray: true}
			}
		);

		this.schedule = $resource(_baseUrl + '/schedule', {},
			{
				get: {method: 'GET', isArray: true},

			}
		);

		this.reserve = $resource(_baseUrl + '/resv', {},
			{
				get: {method: 'GET'},

			}
		);
	}
})();
