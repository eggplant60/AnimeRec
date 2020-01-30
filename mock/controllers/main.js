angular.module('app')
	.controller('AppCtrl', ['$scope', '$log', '$timeout', '$filter', 'ApiService', 'CommonService', AppCtrl])
	.filter('extractDate', extractDate)
	.filter('programTitle', programTitle)
	.filter('episodeTitle', episodeTitle);

function AppCtrl($scope, $log, $timeout, $filter, api, common) {
	$log.debug('AppCtrl: start ---------------------');

	const genreId = '107100';

	var vm = this;
	vm.searchEngine='https://google.com/search?q=';

	// TLの列を作る
	//vm.dowList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];	
	const now = new Date();
	const baseDate = common.roundDate(now);
	let dateColumns = [baseDate];
	for (let i=0; i < 6; i++) {
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
		//console.log(params);
		api.chantoru.tvsearch(params).$promise.then(
			(data) => {
				//$log.debug(data);
				vm.programList[i].rowPrograms = data;
			},
			(err) => {
				$log.error(err);
			}
		);
	
	}	
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