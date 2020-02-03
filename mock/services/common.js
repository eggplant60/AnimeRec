//'use strict';

const summaryMaxLen = 70;

angular.module('app')
	.service('CommonService', ['$log', '$filter', function($log, $filter) {

		this.roundDate = (date) => {
			return new Date($filter('date')(date, 'yyyy-MM-dd 05:00:00'));
		};
		
		this.plus1day = (date) => {
			let ret = angular.copy(date);
			ret.setDate(date.getDate() + 1);
			return ret;
		};

		this.date2str = (date) => {
			return $filter('date')(date, 'yyyy-MM-ddTHH:mm:ss');
		};

		this.createEmptyProgramList = (nColumns) => {
			let now = new Date();
			let baseDate = this.roundDate(now);
			let dateColumns = [baseDate];
			for (let i=0; i < nColumns-1; i++) {
				dateColumns.push(this.plus1day(dateColumns[i]));
			}
			return dateColumns.map((element) => {
				return {
					columnDate: element, 
					rowPrograms: []
				};
			});
		};

		// var hex2dec = (hex) => parseInt(hex, 16).toString();
		// this.updateIsReserved = (programs, schedule) => {
		// 	schedule.forEach(element => {
				
		// 		for (let i=0; i<programs.length; i++) {					
		// 			if (programs[i].columnDate <= element.startDateObj && 
		// 				element.startDateObj < this.plus1day(programs[i].columnDate)) {
		// 				console.debug('aaa----');
		// 				console.debug(programs[i].columnDate, new Date(element.startDateObj));

		// 			}
		// 		}
		// 		//hex2dec(element.eventId)
		// 	});
		// };

	}])

	.filter('extractDate', () => value => value.split('[')[0].trim())
	.filter('programTitle', () => {
		return (value) => {
			let tmp = value.replace(/　/g, ' ').replace(/＃/g, '#');
			if (/^アニメ.+$/.test(tmp)) {
				return tmp.split('#')[0].split('[')[0];
			} else {
				return tmp.split('「')[0].split('#')[0].split('[')[0];
			}
		};
	})
	.filter('episodeTitle', () => {
		return (value) => {
			console.log(value);
			let jp = value.match(/「(.+)」/);
			console.log('ret: ' + jp);
			let sharp = value.match(/(#[0-9]+)/);
			console.log('ret: ' + sharp);
			//console.log('ret: null' );
			return '';
		};
	})
	.filter('summaryShort', () => {
		return (value) => {
			if (value.length >= summaryMaxLen) {
				return value.substr(0, summaryMaxLen) + '...';
			} else {
				return value;
			}
		};
	});



	





