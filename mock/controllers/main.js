(function () {
	'use strict';

	angular.module('app')
		.controller('AppCtrl', [
			'$log', 
			'$timeout', 
			'ApiService', 
			'CommonService', 
			AppCtrl]);

	function AppCtrl($log, $timeout, api, common) {
		$log.debug('AppCtrl: start ---------------------');

		const genreId = '107100';
		const nColumns = 7;

		var vm = this;
		vm.searchEngine='https://google.com/search?tbm=isch&q='; // 'https://google.com/search?q=';

		/* 
		 * ビューの列数を早く確定させたいため、先に番組表の枠を作成する
		 */
		vm.programList = common.createEmptyProgramList(nColumns);
		vm.reservations = [];
		vm.inProcess = false;
		vm.allShow = true;
		
		/* 
		 * 番組表取得
		 */
		function initReload() {
			$log.debug('reload');
			//vm.inProcess = true;
			common.reload(vm.programList, genreId)
			.then((values) => {
				$log.debug('reload: get programList.');
				for (let i=0; i<nColumns; i++) {
					$timeout(() => {
						vm.programList[i].rowPrograms = values[i]; // 一度に更新しようとすると表示されない？
					}, i*100); // 左から順に処理
				}
				//vm.inProcess = false;
			})
			.catch((err) => {
				$log.error('reload: Error, can not get programList!');
			});	
		}

		initReload();

		/* 
		* 予約一覧取得を並行して動かす
		*/
		function mergeReserve() {
			$log.debug('merge');
			vm.inProcess = true;
			api.reservations.list().$promise
			.then((data) => {
				$log.debug('merge: get reservations.');
				$log.debug(data);
				for (let i=0; i<nColumns; i++) {
					$timeout(() => {
						let row = vm.programList[i].rowPrograms;
						row = common.merge(row, data);
					}, i*100); // 左から順に処理
				}
				vm.inProcess = false;
			})
			.catch((err) => {
				$log.error('merge: can not get reservations!');
			});	
		}

		mergeReserve();

		/*
		* 予約ボタン
		*/
		vm.onReserveButton = function(program) {
			if (vm.inProcess) {
				$log.debug('on reserve: return due to another process');
				return;
			}
			$log.debug('on reserve');
			let promise;
			if (!program.item_id) {
				promise = common.addReserve;
			} else {
				promise = common.removeReserve;
			}
			promise(program).then((val) => {
				$log.debug('on reserve: success');
				program = val;
				mergeReserve();
			}).catch((err) => {
				$log.error('on reserve: failed');
				$log.error(err);
			});
		};

		/* 
		* デバッグ用ダイアログ
		*/
		vm.openDialog = common.openDialog;

		/* 
		 * フィルターボタン
		 */
		vm.onFilter = () => {
			$log.debug('on filter');
			vm.allShow = !vm.allShow;
		};

		vm.recFilter = (program) => {
			return vm.allShow || program.item_id;
		};

		/* 
		 * リフレッシュボタン
		 */
		vm.onRefresh = () => {
			$log.debug('on reflesh');
			initReload();
			mergeReserve();
		};

		/* 
		 * 録画設定ボタン
		 */
		vm.onSettings = () => {
			console.debug('on settings');
		};		
	}
})();
