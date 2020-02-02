(function () {
	'use strict';

	angular.module('app')
			.service('ApiService', ['$log', '$resource', ApiService]);

	function ApiService($log, $resource) {

		const _baseUrl = 'http://127.0.0.1:3001/api';
		this.paramDefaults = {
			tvsearch : {},
			schedule : {},
			resv     : {},
			resv2    : {}
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

		this.reserve2 = $resource(_baseUrl + '/resv2', {},
			{
				get: {method: 'GET'},

			}
		);

	}
})();
