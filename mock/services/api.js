(function () {
	'use strict';

	angular.module('app')
			.service('ApiService', ['$log', '$resource', 'express', ApiService]);

	function ApiService($log, $resource, express) {

		const _baseUrl = 'http://' + express.address + ':' + express.port;

		this.programs = $resource(_baseUrl + '/api/programs', {},
			{
				get: {method: 'GET', isArray: true},
			}
		);

		this.reservations = $resource(_baseUrl + '/api/reservations', {},
			{
				list  : {method: 'POST', params: {op: 'list'}, isArray: true},
				add   : {method: 'POST', params: {op: 'add'}},
				remove: {method: 'POST', params: {op: 'remove'}},
			}
		);

		this.login = _baseUrl + '/login';
	}
})();
