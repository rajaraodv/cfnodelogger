var cfnlModule = angular.module('project', ['ngResource']);

cfnlModule.factory('LoginService', ['$resource', function ($resource) {
    var LoginService = $resource('/me');
    return LoginService;
}]);

cfnlModule.directive('divscounter', ['$rootScope', function ($rootScope) {
    return function (scope, elm, attr) {
        $rootScope.newDivsCount++;
    };
}]);

function HeaderCtrl($scope, LoginService, $rootScope, $location) {
    //Note: setting value to rootScope makes it available for EVERY controller (via $rootscope)
    $rootScope.cfAccount = LoginService.get();

    //User's apps..
    $scope.apps = [];

    //Show Line numbers for logs
    $rootScope.showLineNumbers = true;

    $scope.showingLogsFor = 'Show logs for:';

    //Watch for cdAccount. It is set by LoginService
    $scope.$watch('cfAccount', function () {
        var acc = $scope.cfAccount.account;
        if (acc && acc.user) {
            $rootScope.loggedIn = true;
            $scope.loginText = 'Logged in as ' + acc.user.email;
            $scope.apps = acc.apps;
        } else {
            $rootScope.loggedIn = false;
            $scope.loginText = '';
            $scope.apps = [];
        }
    }, true);


    //Logout from the app (and also from CF)
    $scope.logout = function (alsoFromCF) {
        $rootScope.cfAccount = {};
        var req = $.ajax({
            url: '/logout',
            type: 'get',
            dataType: 'html'
        });

        //If true, also logout from CF.com
        if(alsoFromCF) {
            req.done(function () {
                window.location.assign('https://login.cloudfoundry.com/logout.do');
            });
        }
    };

    //Toggle Show Line number ON/OFF
    $scope.toggleLN = function () {
        $rootScope.showLineNumbers = !$rootScope.showLineNumbers;
    };

    //When user chooses an app, set it to currentApp on rootScope.
    //This will trigger otherLogsCtrl to start getting logs.
    $scope.showLogsApp = function (app) {
        //set it in root-scope so we can trigger LogsCtrl's watch
        $rootScope.currentApp = app;

        //Update 'Showing logs for:' list name
        $scope.showingLogsFor = 'Showing logs for: ' + app.name;
    };
}

HeaderCtrl.$inject = ['$scope', 'LoginService', '$rootScope', '$location'];
