var apps = [
    {
        "name": "ttyapp",
        "staging": {
            "model": "node",
            "stack": "node08"
        },
        "uris": [
            "ttyapp.cloudfoundry.com"
        ],
        "instances": 1,
        "runningInstances": 0,
        "resources": {
            "memory": 64,
            "disk": 2048,
            "fds": 256
        },
        "state": "STARTED",
        "services": [],
        "version": "26232b79da5682493cc369aff5ebf18289039f47-1",
        "env": [],
        "meta": {
            "debug": null,
            "console": null,
            "version": 5,
            "created": 1357516056
        }
    },
    {
        "name": "foobarnode",
        "staging": {
            "model": "node",
            "stack": "node08"
        },
        "uris": [
            "foobarnode.cloudfoundry.com"
        ],
        "instances": 1,
        "runningInstances": 1,
        "resources": {
            "memory": 1024,
            "disk": 2048,
            "fds": 256
        },
        "state": "STARTED",
        "services": [
            "mongodb-foobar"
        ],
        "version": "76766112f4c670c61f8a05e8caecefb2f369f1b6-3",
        "env": [
            "NODE_ENV=production"
        ],
        "meta": {
            "debug": null,
            "console": false,
            "version": 51,
            "created": 1357516056
        }
    },
    {
        "name": "express1",
        "staging": {
            "model": "node",
            "stack": "node08"
        },
        "uris": [
            "express2.cloudfoundry.com"
        ],
        "instances": 1,
        "runningInstances": 1,
        "resources": {
            "memory": 64,
            "disk": 2048,
            "fds": 256
        },
        "state": "STARTED",
        "services": [],
        "version": "a0c44038f45fd3f14ac8d9a1bc3b7425a2ac2e6a-8",
        "env": [],
        "meta": {
            "debug": null,
            "console": null,
            "version": 19,
            "created": 1357516056
        }
    },
    {
        "name": "cfnodelogger",
        "staging": {
            "model": "node",
            "stack": "node08"
        },
        "uris": [
            "cfnodelogger.cloudfoundry.com"
        ],
        "instances": 1,
        "runningInstances": 1,
        "resources": {
            "memory": 64,
            "disk": 2048,
            "fds": 256
        },
        "state": "STARTED",
        "services": [],
        "version": "6d2d94a6e0aca45e877f9d661b2643917cbedf2e-1",
        "env": [],
        "meta": {
            "debug": null,
            "console": null,
            "version": 149,
            "created": 1357516056
        }
    },
    {
        "name": "socketio2",
        "staging": {
            "model": "node",
            "stack": "node08"
        },
        "uris": [
            "socketio2.cloudfoundry.com"
        ],
        "instances": 1,
        "runningInstances": 1,
        "resources": {
            "memory": 64,
            "disk": 2048,
            "fds": 256
        },
        "state": "STARTED",
        "services": [],
        "version": "4a2451d210592270fdfb9946c9720edcf53d8a37-1",
        "env": [],
        "meta": {
            "debug": null,
            "console": null,
            "version": 5,
            "created": 1357516056
        }
    }
];

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
            $scope.loginText = 'Logged in as ' + acc.user;
            $scope.apps = acc.apps;
        } else {
            $rootScope.loggedIn = false;
            $scope.loginText = '';
            $scope.apps = [];
        }
    }, true);


    //Logout from the app
    $scope.logout = function () {
        $rootScope.cfAccount = {};
        window.location = '/logout';
    };

    //Toggle Show Line number ON/OFF
    $scope.toggleLN = function() {
      $rootScope.showLineNumbers =   !$rootScope.showLineNumbers;
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
