angular.module('app')
.directive('wgLayout', wgLayout);

function wgLayout() {
    return {
        restrict: 'E',
        template: '<div> aaa </div>'
    };
}