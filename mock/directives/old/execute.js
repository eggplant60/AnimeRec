angular.module('app')
.directive('executeArea', executeArea);

function executeArea() {
    return {
        restrict: 'E',
        templateUrl: 'directives/execute.html'
    };
}