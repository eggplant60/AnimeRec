(function () {
	'use strict';

	angular.module('app')
			.service('ApiService', ['$log', '$resource', ApiService]);

	function ApiService($log, $resource) {

		const _baseUrl = 'http://127.0.0.1:3001/api';

		this.programs = $resource(_baseUrl + '/programs', {},
			{
				get: {method: 'GET', isArray: true},
			}
		);

		this.reservations = $resource(_baseUrl + '/reservations', {},
			{
				list  : {method: 'POST', params: {op: 'list'}, isArray: true},
				add   : {method: 'POST', params: {op: 'add'}},
				remove: {method: 'POST', params: {op: 'remove'}},
			}
		);
	}
})();
