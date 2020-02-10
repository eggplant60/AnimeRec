angular.module('app')
.directive('content', function() {
    return {
        restrict: 'E',
        templateUrl: './partials/content.html'
    };
})

.directive('sidebar', function() {
    return {
        restrict: 'E',
        templateUrl: './partials/sidebar.html'
    };
});
