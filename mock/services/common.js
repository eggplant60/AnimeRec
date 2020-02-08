//'use strict';

const summaryMaxLen = 70;

angular.module('app')
	.service('CommonService', ['$log', '$filter', '$timeout', '$mdDialog', 'ApiService', function($log, $filter, $timeout, $dialog, api) {

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
		
		this.mock = () => {
			return new Promise((resolve, reject) => {
				$timeout( () => {
					resolve('Mock is complete.');
				}, 1000);
			});
		};

		this.reload = (programList, genreId) => {
			let promises = [];
			programList.forEach(element => {
				let thisDate = element.columnDate;
				let params = {
					from    : this.date2str(thisDate),
					to      : this.date2str(this.plus1day(thisDate)),
					genreId : genreId
				};
				promises.push(api.programs.get(params).$promise);
			});
			return Promise.all(promises);
		};

		this.addReserve = (program) => {
			return new Promise((resolve, reject) => {
				if (!program.event_id) {
					reject('on reserv: can not add reservation due to no event_id.');
				}
				let postData = {
					sid: program.service_id,
					eid: program.event_id,
					date: program.start_date,
					duration: program.duration,
				};
				api.reservations.add(postData).$promise.then(
					(data) => {
						if (data.responseCode === '803') {
							reject('on reserve: this program has finished ');
						} else {
							program.item_id = 'x'; //仮の値
							resolve(program);
						}
					},
					(err) => {
						reject('on reserve: failed' +  err);
					}
				);
			});
		};

		this.removeReserve = (program) => {
			return new Promise((resolve, reject) => {
				if (!(program.item_id && program.dvr_id)) {
					reject('on reserve: can not remove reservation due to no item_id nor drv_id.');
				}
				let postData = {
					item_id : program.item_id,
					dvr_id  : program.dvr_id
				};
				api.reservations.remove(postData).$promise
				.then((val) => {
					//resolve(val);
					delete program.item_id;
					delete program.dvr_id;
					delete program.condition_id;
					delete program.conflict_id;
					resolve(program);
				})
				.catch ((err) => {
					//$log.error(err);
					reject(err);
				});
			});
		};

		var hex2dec = (hex) => parseInt(hex, 16).toString();

		this.merge = (progs, resvs) => {
			var sche = resvs.map((element) => {
				return {
					service_id : hex2dec(element.channelId),
					event_id   : hex2dec(element.eventId),
					item_id    : element.id,
					dvr_id     : element.dvrId,
					condition_id : element.conditionId,
					conflict_id  : element.conflictId,
				};
			});

			progs.forEach((prog) => {
				sche.forEach((resv) => {
					if (prog.service_id === resv.service_id &&
						prog.event_id   === resv.event_id) {
							Object.assign(prog, resv); // 結合
							//continue;
							$log.debug(prog.event_id, prog.item_id, prog.dvr_id, prog.start_date, prog.title);
					}
				});
			});
			return progs;
		};

		this.openDialog = (program) => {
			$log.debug('dialog: open');
			//$log.debug(program);
			$dialog.show({
				controller: DialogController,
				templateUrl: 'partials/dialog.html',
				parent: angular.element(document.body),
				//targetEvent: ev,
				clickOutsideToClose: true,
				fullscreen: false,
				locals: {
					program: program
				}
			});
			function DialogController($scope, $mdDialog, program) {
				$scope.program = program;
				$scope.hide = function() {
					$log.debug('dialog: hide');
					$mdDialog.hide();
				};
				$scope.cancel = function() {
					$log.debug('dialog: cancel');
					$mdDialog.cancel();
				};
				$scope.answer = function(answer) {
					$log.debug('dialog: answer');
					$mdDialog.hide(answer);
				};
			}	
		};
	}])

	// ------------------------- filter -----------------------------------
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
	})
	.filter('recFilter', () => (program) => {
		if (program.item_id) {
			return true;
		} else {
			return false;
		}
	});
