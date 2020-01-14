angular.module('app')
.controller('AppCtrl', ['$scope', '$log', '$timeout', 'ApiService', AppCtrl]);

function AppCtrl($scope, $log, $timeout, ApiService) {
    //var vm = this;
    $log.debug('debug in AppCtrl()');


    ApiService.tvsearch.bytime().$promise.then(
      (ret) => {
        $scope.data = ret;
        $log.debug($scope.data);
      },
      (httpError) => {
        $log.error('httpError');
        $log.error(httpError);
      }
    );
    
    
}