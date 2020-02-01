angular.module('app')
	.controller('AppCtrl', ['$scope', '$log', '$timeout', '$filter', 'ApiService', 'CommonService', AppCtrl])
	.filter('extractDate', extractDate)
	.filter('programTitle', programTitle)
	.filter('episodeTitle', episodeTitle)
	.filter('summaryShort', summaryShort);

function AppCtrl($scope, $log, $timeout, $filter, api, common) {
	$log.debug('AppCtrl: start ---------------------');

	const genreId = '107100';
	var vm = this;
	vm.searchEngine='https://google.com/search?q=';

	/* 
	 * 番組表取得
	 */
	const now = new Date();
	const nColumns = 7;
	const baseDate = common.roundDate(now);
	let dateColumns = [baseDate];
	for (let i=0; i < nColumns-1; i++) {
		dateColumns.push(common.plus1day(dateColumns[i]));
	}

	vm.programList = dateColumns.map((element) => {
		return {columnDate: element, rowPrograms: []};
	});

	for (let i in vm.programList) {
		let thisDate = vm.programList[i].columnDate;
		let params = {
			from    : common.date2str(thisDate),
			to      : common.date2str(common.plus1day(thisDate)),
			genreId : genreId
		};
		api.tvsearch.get(params).$promise.then(
			(data) => {
				//$log.debug(data);
				vm.programList[i].rowPrograms = data;
			},
			(err) => {
				$log.error(err);
			}
		);
	}
	$log.debug('complete programs');

	/* 
	 * 予約一覧取得
	 */
	vm.schedule = [];
	api.schedule.get(api.default).$promise.then(
		(data) => {
			$log.debug(data);
			vm.schedule = data;
		}
	);

}

function extractDate () {
	return function(value) {
		return value.split('[')[0].trim();
	};
}

function programTitle () {
	return function(value) {
		let tmp = value.replace(/　/g, ' ').replace(/＃/g, '#');
		if (/^アニメ.+$/.test(tmp)) {
			return tmp.split('#')[0].split('[')[0];
		} else {
			return tmp.split('「')[0].split('#')[0].split('[')[0];
		}
	};
}

function episodeTitle () {
	return function(value) {
		console.log(value);
		let jp = value.match(/「(.+)」/);
		console.log('ret: ' + jp);
		let sharp = value.match(/(#[0-9]+)/);
		console.log('ret: ' + sharp);
		//console.log('ret: null' );
		return '';
	};
}

const summaryMaxLen = 70;

function summaryShort () {
	return function(value) {
		if (value.length >= summaryMaxLen) {
			return value.substr(0, summaryMaxLen) + '...';
		} else {
			return value;
		}
	};
}