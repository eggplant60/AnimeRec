(function () {
	'use strict';

	angular.module('app')
		.controller('AppCtrl', [
			'$log', 
			'$timeout', 
			'$mdDialog',
			'ApiService', 
			'CommonService', 
			AppCtrl]);

	function AppCtrl($log, $timeout, $dialog, api, common) {
		$log.debug('AppCtrl: start ---------------------');

		var vm = this;
		vm.conf = angular.copy(common.defaultConf);
		vm.searchEngine='https://google.com/search?tbm=isch&q='; // 'https://google.com/search?q=';

		/* 
		 * ビューの列数を早く確定させたいため、先に番組表の枠を作成する
		 */
		vm.programList = common.createEmptyProgramList(vm.conf);
		console.debug(vm.programList);
		
		vm.inProcess = false;
		vm.allShow = true;
		
		/* 
		 * 番組表取得
		 */
		function initReload() {
			$log.debug('reload');
			//vm.inProcess = true;
			common.reload(vm.programList, vm.conf)
			.then((values) => {
				$log.debug('reload: get programList.');
				for (let i=0; i<vm.conf.column.number; i++) {
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
				for (let i=0; i<vm.conf.column.number; i++) {
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
				common.openInfo('更新処理が完了するまでお待ち下さい。');
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
			promise(program, vm.conf).then((val) => {
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
		vm.openDetail = common.openDetail;

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
		 * 設定ボタン
		 */
		vm.onConf = (type) => {
			$log.debug('on conf ' + type);
			switch(type) {
				case 'genre':
					//vm.setConfGenre();
					break;
				case 'rec':
					//vm.setConfRec();
					break;
				case 'time':
					vm.setConfTime();
					break;
				default:
					$log.error('on conf error: undefined type');
			}
			$log.debug('on conf: finish');
		};

		/* 
		 * 設定ダイアログ
		 */
		vm.setConfTime = () => {
			$log.debug('set conf time');
			$dialog.show({
				controller: ConfDialogCtrl,
				templateUrl: 'partials/dialog-time.html',
				parent: angular.element(document.body),
				//targetEvent: ev,
				clickOutsideToClose: true,
				fullscreen: false,
				locals: {
					confTime: vm.conf.time
				}
			})
			.then((val) => {
				$log.debug('set conf time: resolve');
				vm.programList = common.createEmptyProgramList(vm.conf);
				initReload();
				mergeReserve();	
			})
			.then((err) => {
				$log.debug('set conf time: reject');
			});
		};
	}

	/* 
	 * 設定画面のデータを管理するコントローラ
	 */
	function ConfDialogCtrl($scope, $mdDialog, confTime) {
		$scope.confTime = confTime;
		// Promise の reject
		$scope.cancel = () => {
			$mdDialog.cancel('ConfDialogCtrl: cancel');
		};
		// Promise の resolve
		$scope.ok = () => {
			$mdDialog.hide('ConfDialogCtrl: hide');
		};
	}	

})();
