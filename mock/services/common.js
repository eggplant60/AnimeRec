(function () {
	'use strict';

	angular.module('app')
			.service('CommonService', ['$log', '$filter', CommonService]);

	function CommonService($log, $filter) {

		this.roundDate = (date) => {
			return new Date($filter('date')(date, 'yyyy-MM-dd 05:00:00'));
		};
		
		this.plus1day = (date) => {
			let ret = angular.copy(date);
			ret.setDate(date.getDate() + 1);
			return ret;
		};

		this.date2str = (date) => {
			return $filter('date')(date, 'yyyy-MM-ddTHH:mm:ss')
		};

	}
})();
