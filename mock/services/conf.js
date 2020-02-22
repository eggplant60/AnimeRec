(function () {
	'use strict';

	angular.module('app')
		.service('ConfService', ['$log', '$localStorage', ConfService]);

	function ConfService($log, $localStorage) {
		this.default = {
			rec: {
				condition: 'week',      // 'week'/'day'/'once'
				quality  : 'normal',    // 'normal'/'high'
				destination: 'external' // 'external'/'internal'	
			},
			genre: {
				mainId : '107100', // String
				exclusive : false, // boolean
			},
			time: {
				from: 19,		// 5 <= from <= 29
				to  : 29,		// 5 <= to   <= 29
			},
			display: {
				columns: 7,      // 1 <= columns <= 8
				theme:   'light' // 'light'/'dark'
			}
		};

		var isValid = (conf) => {
			if (!conf) {
				return false;
			}
			return isValidRec(conf.rec)	&& isValidGenre(conf.genre) && 
				isValidTime(conf.time) && isValidDisplay(conf.display);
		};

		var isValidRec = (confRec) => {
			if (!confRec) {
				return false;
			}
			return ['week', 'day', 'once'].includes(confRec.condition) &&
				['normal', 'high'].includes(confRec.quality) &&
				['external', 'internal'].includes(confRec.destination);
		};

		var isValidGenre = (confGenre) => {
			if (!confGenre) {
				return false;
			}
			return typeof(confGenre.mainId) === 'string' && 
				typeof(confGenre.exclusive) === 'boolean';
		};

		var isValidTime = (confTime) => {
			if (!confTime) {
				return false;
			}
			let from = confTime.from;
			let to = confTime.to;
			return 5 <= from && from <= 29 && 5 <= to && to <= 29;
		};

		var isValidDisplay = (confDisplay) => {
			if (!confDisplay) {
				return false;
			}
			return 1 <= confDisplay.columns && confDisplay.columns <= 8 && 
				['light', 'dark'].includes(confDisplay.theme);
		};

		this.set = (conf) => {
			if (isValid(conf)) {
				$log.debug('conf.set(): Valid value. Save the value');
				$localStorage.conf = conf;
			} else {
				$log.debug('conf.set(): Invalid value. Save the default');
				$localStorage.conf = this.default;
			}
		};

		this.get = () => {
			let value = $localStorage.conf;
			if (!value) {
				$log.debug('conf.get(): No conf in localStorage. return default');
				return angular.copy(this.default);
			}
			if (!isValid(value)) {
				$log.debug('conf.get(): Invalid value in localStrage. return default');
				return angular.copy(this.default);	
			}
			$log.debug('conf.get(): Valid value in localStorage. return');
			return $localStorage.conf;
		};

	}
})();
