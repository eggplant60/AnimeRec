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

		this.programs = $resource(_baseUrl + '/programs/', {},
			{
				get: {method: 'GET', isArray: true}
			}
		);

		this.reservations = $resource(_baseUrl + '/reservations', {},
			{
				post: {method: 'POST'}
			}
		);
	}
})();
