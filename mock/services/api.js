(function () {
	'use strict';

	angular.module('app')
			.service('ApiService', ['$log', '$resource', ApiService]);

	function ApiService($log, $resource) {

		var date = new Date(); // 現在時刻

		//$log.debug(date.getTime());
		//$log.debug(date.toJSON());

		var _baseUrl = 'http://127.0.0.1:3001/api';
		var _url  = {
			tvsearch : _baseUrl + '/tvsearch',
			resv : _baseUrl + '/resv',
		};
		var _paramDefaults = {
			tvsearch : {
				//op: 'bytime',
				//span: '23',
				//category: '1',
				//start: date.toJSON()
			},
			resv : {
				op: 'add', 
				sid: 0, 
				eid: 0, 
				category: 1, 
				date: date.toJSON(),
				duration: 0,
				title: '',
				quality: 230,
				condition: 'w1',
				destination: 'HDD'
			}
		};

		this.chantoru = $resource(
			_url.tvsearch, 
			_paramDefaults.tvsearch,
			{
				tvsearch: {method: 'GET'},
				resv    : {method: 'GET'}
			}
		);
	}
})();
