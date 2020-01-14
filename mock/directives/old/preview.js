angular.module('app')
.directive('previewArea', previewArea);

function previewArea() {
    return {
        restrict: 'E',
        templateUrl: 'directives/preview.html'
    };
}
