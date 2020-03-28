//'use strict';

const summaryMaxLen = 70;

angular.module('app')
	.service('CommonService', ['$log', '$filter', '$timeout', '$mdDialog', 'ApiService', function($log, $filter, $timeout, $dialog, api) {

		this.roundDate = (date) => {
			return new Date($filter('date')(date, 'yyyy-MM-dd 00:00:00'));
		};
		
		this.plus1day = (date) => {
			let ret = angular.copy(date);
			ret.setDate(date.getDate() + 1);
			return ret;
		};

		this.plusHours = (date, hours) => {
			let ret = angular.copy(date);
			ret.setHours(date.getHours() + hours);
			return ret;
		};

		this.date2str = (date) => {
			return $filter('date')(date, 'yyyy-MM-ddTHH:mm:ss');
		};

		this.createEmptyProgramList = (conf) => {
			let now = new Date();
			let baseDate = this.roundDate(now);
			let dateColumns = [baseDate];
			for (let i=0; i < conf.display.columns-1; i++) {
				dateColumns.push(this.plus1day(dateColumns[i]));
			}
			return dateColumns.map((element) => {
				return {
					label: element, 
					from : this.plusHours(element, conf.time.from),
					to   : this.plusHours(element, conf.time.to),
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

		this.reload = (programList, conf) => {
			let promises = [];
			programList.forEach(element => {
				let params = {
					from    : this.date2str(element.from),
					to      : this.date2str(element.to),
					genreId : conf.genre.mainId,
					exclusive: conf.genre.exclusive,
				};
				promises.push(api.programs.get(params).$promise);
			});
			return Promise.all(promises);
		};

		this.addReserve = (program, conf) => {
			return new Promise((resolve, reject) => {
				if (!program.event_id) {
					reject('on reserv: can not add reservation due to no event_id.');
				}
				let postData = {
					sid: program.service_id,
					eid: program.event_id,
					date: program.start_date,
					category : '1',
					duration : program.duration,
					condition: conf.rec.condition,
					quality  : conf.rec.quality,
					destination: conf.rec.destination
				};
				api.reservations.add(postData).$promise.then(
					(data) => {
						console.debug(data);
						if (data.responseCode === '0') {
							program.item_id = 'x'; //仮の値
							resolve(program);
						} else if (data.responseCode === '803') {
							this.openInfo('この番組はすでに終了しています。');
							reject('on reserve: this program has finished');
						} else if (data.responseCode === '830') {
							var duplicate = data.responseMsg.split(':');
							$log.debug(duplicate);
							this.openInfo(
								['次の予約と重複しています。 ', duplicate[0], duplicate[2]].join('  ')
							);	
							reject('on reserve: this reservation is maybe duplicated');
						}
					},
					(err) => {
						console.debug(err);
						reject('on reserve: failed' +  err);
					}
				);
			});
		};

		this.removeReserve = (program, conf) => {
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
							//$log.debug(prog.event_id, prog.item_id, prog.dvr_id, prog.start_date, prog.title);
					}
				});
			});
			return progs;
		};

		this.openInfo = (text) => {
			$log.debug('info: open');
			$dialog.show(
				$dialog.alert()
					.parent(angular.element(document.body))
					.clickOutsideToClose(true)
					.title('お知らせ')
					.textContent(text)
					.ariaLabel('Info')
					.ok('OK')
			);
		};

		this.openDetail = (program) => {
			$log.debug('detail: open');
			//$log.debug(program);
			$dialog.show({
				controller: DetailController,
				templateUrl: 'partials/dialog-detail.html',
				parent: angular.element(document.body),
				//targetEvent: ev,
				clickOutsideToClose: true,
				fullscreen: false,
				locals: {
					program: program
				}
			});
		};

		this.showVersion = () => {
			$dialog.show({
				controller: VersionController,
				parent: angular.element(document.body),
				clickOutsideToClose: true,
				fullscreen: false,
				templateUrl: 'partials/dialog-version.html'
			});
		};

		this.showLogin = () => {
			$dialog.show({
				controller: VersionController,
				parent: angular.element(document.body),
				clickOutsideToClose: true,
				fullscreen: false,
				templateUrl: 'partials/dialog-login.html'
			});			
		};

		function VersionController($scope, $mdDialog) {
			$scope.cancel = function() {
				//$log.debug('detail: cancel');
				$mdDialog.cancel();
			};
		}	
	
		function DetailController($scope, $mdDialog, program) {
			$scope.program = program;
			$scope.hide = function() {
				//$log.debug('detail: hide');
				$mdDialog.hide();
			};
			$scope.cancel = function() {
				//$log.debug('detail: cancel');
				$mdDialog.cancel();
			};
			// $scope.answer = function(answer) {
			// 	$log.debug('dialog: answer');
			// 	$mdDialog.hide(answer);
			// };
		}

	}])

	// ------------------------- filter -----------------------------------

	/* 
	 * 例: 	
	 * 03/29(日) 23:00～23:30 [ＴＯＫＹＯＭＸ１]
	 *  ↓
	 * 03/29(日) 23:00～23:30
	 */
	.filter('extractDate', () => value => value.split('[')[0].trim())

	/* 
	 * 1. 全角スペース、全角シャープを半角に
	 * 2. 先頭に"アニメ"もしくは"テレビアニメ"とある場合は, "#"もしくは"["の前までを取り出す
	 *    ※ cf. アニメ「タイトル」
	 * 3. それ以外は"#"もしくは"["もしくは"「"の前まで取り出す
	 * 4. 取り出した結果を返す。ただし長さ0であればもとの文字列を返す
	 */
	.filter('programTitle', () => {
		return (value) => {
			let tmp1 = value.replace(/　/g, ' ').replace(/＃/g, '#');
			let tmp2;
			
			if (/^アニメ.+$/.test(tmp1) || /^テレビアニメ.+$/.test(tmp1)) {
				tmp2 = tmp1.match(/^[^#\[]+/);
			} else {
				tmp2 = tmp1.match(/^[^#\[「]+/);
			}
			if (tmp2 === null) {
				return tmp1;
			} else if (tmp2[0].length === 0) {
				return tmp1;
			} else {
				return tmp2[0];
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
