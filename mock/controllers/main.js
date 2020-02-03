(function () {
	'use strict';

	angular.module('app')
		.controller('AppCtrl', [
			'$scope', 
			'$log', 
			'$timeout', 
			'$filter', 
			'$mdDialog',
			'ApiService', 
			'CommonService', 
			AppCtrl]);

	function AppCtrl($scope, $log, $timeout, $filter, $mdDialog, api, common) {
		$log.debug('AppCtrl: start ---------------------');

		const genreId = '107100';
		const nColumns = 7;

		var vm = this;
		vm.searchEngine='https://google.com/search?q=';

		/* 
		 * ビューの列数を早く確定させたいため、先に番組表の枠を作成する
		 */
		vm.programList = common.createEmptyProgramList(nColumns);
		
		/* 
		 * DBの予約情報を更新依頼
		 */		
		common.mock()
		/* 
		 * その後、番組表取得
		 */
		.then((value) => {
			$log.debug(value);
			let promises = [];
			vm.programList.forEach(element => {
				let thisDate = element.columnDate;
				let params = {
					from    : common.date2str(thisDate),
					to      : common.date2str(common.plus1day(thisDate)),
					genreId : genreId
				};
				promises.push(api.tvsearch.get(params).$promise);
			});
			return Promise.all(promises);
		})
		.then((values) => {
			$log.debug('Complete programList.');
			for (let i=0; i<nColumns; i++) {
				$timeout(() => {
					vm.programList[i].rowPrograms = values[i]; // 一度に更新しようとすると表示されない？
				});
			}
		});

		/* 
		* 予約一覧取得
		*/
		//vm.schedule = [];
		// api.schedule.get(api.default).$promise.then(
		// 	(data) => {
		// 		$log.debug(data);
		// 		//vm.schedule = data;
		// 		console.debug(vm.programList);
		// 		common.updateIsReserved(vm.programList, data);
		// 	}
		// );

		/*
		* 予約ボタン
		*/
		vm.onReserveButton = function(program) {
			$log.debug('on reserve');
			let param = {
				area: program.area,
				sid:  program.service_id,
				pid:  program.program_id,
				date: program.start_date,
				duration: program.duration,
			};
			if (program.event_id) { // event_id をバッチで取得済みの場合
				// @todo
				param.eid = program.event_id;
				api.reserve.get(param).$promise.then(
					(data) => {
						$log.debug(data);
						program.is_reserved = true;
					},
					(err) => {
						$log.error(err);
					}
				);
			} else {		
				api.reserve2.get(param).$promise.then(
					(data) => {
						$log.debug(data);
						program.is_reserved = true;
					},
					(err) => {
						$log.error(err);
					}
				);
			}
		};

		/* 
		* デバッグ用ダイアログ
		*/
		vm.openDebugDialog = function(program) {
			$log.debug('dialog');
			//$log.debug(program);
			$mdDialog.show({
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
					$mdDialog.hide();
				};
				$scope.cancel = function() {
					$mdDialog.cancel();
				};
				$scope.answer = function(answer) {
					$mdDialog.hide(answer);
				};
			}	
		};
	}
})();
