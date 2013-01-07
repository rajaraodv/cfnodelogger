function LogsCtrl($scope, $rootScope) {
    $rootScope.$watch('currentApp', function () {
        initLogger();
    }, true);

    function initLogger() {

        /**
         * Stores url and last-log w/ line number to compare w/ new log data
         * If the new log-data has same number of lines & same last line, then there is no update
         * If the new log data has more lines, then we'll only process the newer ones.
         * @type {Object} Stores log-url as Key and log display-related data as value.
         */
        $scope.urlAndLogsHash = {};

        /**
         * set newDivsCount to 0. This is used to count # of divs created in the DOM.
         * And when all DIVs are created, we will trigger getLogsFromServer (see $scope.$watch('newDivsCount')
         */
        $rootScope.newDivsCount = 0;

        //Create place holders for logs
        createLogDivs();
    }

    //Wait for all log-divs to be ready
    $scope.$watch('newDivsCount', function () {
        if ($rootScope.newDivsCount == $rootScope.totalDivsCount) {
            getLogsFromServer();
        }
    });

    //Create Divs for logs
    function createLogDivs() {
        if (!$rootScope.currentApp) {
            return;
        }

        var len = $rootScope.currentApp.runningInstances;
        var name = $rootScope.currentApp.name;
        var logs = [];
        var logNames = ['stdout', 'stderr', 'staging'];
        for (var i = 0; i < len; i++) {
            for (var j = 0; j < logNames.length; j++) {
                logs.push({divId: name + '_' + logNames[j] + '_' + i,
                    fName: logNames[j] + '.log', instance: i,
                    appName: name,
                    url: 'https://api.cloudfoundry.com/apps/' + name + '/instances/' + i + '/files/logs/' + logNames[j] + '.log'
                });
            }
        }
        //This triggers ng-repeat in html
        $scope.logs = logs;

        //Keep track of total divs that should be created (before we can call getLogs)
        $rootScope.totalDivsCount = logs.length;
    }

    //Clear logs displayed in the logs-div
    $scope.clear = function (log) {
        log.logsCleared = true;
        $("#" + log.divId).empty();

    };

    // Show all logs again by deleting urlAndLogsHash.
    // So when the logs come in next-time, it will show everything.
    $scope.showAll = function (log) {
        log.logsCleared = false;
        delete $scope.urlAndLogsHash[log.url];
    }

    //Pause more logs from being added
    $scope.pause = function (log) {
        log.paused = true;
    }

    //Resume showing logs
    $scope.resume = function (log) {
        log.paused = false;
        getLog(log);//restart
    }

    //Start getting logs for each kind of log & for each server-instance.
    function getLogsFromServer() {
        if (!$scope.logs) return;

        var logs = $scope.logs;
        var len = logs.length;
        for (var i = 0; i < len; i++) {
            getLog(logs[i]);
        }
    }

    /**
     * Do the main grunt work of getting the logs, parsing & processing logs.
     * @param log Log object
     */
    function getLog(log) {
        if (log.paused) {
            return;
        }
        var url = log.url;
        var logDivId = log.divId;
        var fName = log.fName;

        var req = $.ajax({
            url: '/logs',
            type: 'get',
            data: {
                url: url
            },
            dataType: 'text'
        });

        /**
         * When log data comes in, process it, color it, create divs and insert it to logs div
         */
        req.done(function (data) {
            if (log.paused) {
                return;
            }
            var logDiv = $("#" + logDivId);
            var currentLines = logDiv.children().length;
            var data = processLogData(data, url);

            var len = data.length;
            for (var i = 0; i < len; i++) {
                var line = data[i];
                var lineNumber = $rootScope.showLineNumbers ? (currentLines + i + 1) + '. ' : '';
                data[i] = /^(at|\*)/.test($.trim(line)) ? "<div style='background:#FCFBA2;'>" + lineNumber + line + '</div>' : '<div>' + lineNumber + line + '</div>';
            }
            data = data.join('');

            logDiv.append(data);

            //scroll to the bottom of the logs
            logDiv[0].scrollTop = logDiv[0].scrollHeight;

            //Get logs every 5 seconds
            setTimeout(function () {
                getLog(log);
            }, 5000);
        });

        /**
         * If result failed, display it w/in the respective logs container so it can be easily seen by the user.
         */
        req.fail(function (req) {

            var data = '<div class="alert alert-block">' +
                '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                '<h4>Error! (' + req.status + " " + req.statusText + ')</h4>' +
                "Cloud not get <strong>" + fName + "</strong> logs.\n Please try refreshing browser and/or re-login " +
                '</div>';

            $("#" + logDivId).append(data);
        });
    }


    /**
     * Stores url and last-log w/ line number to compare w/ new log data
     * If the new log-data has same number of lines & same last line, then there is no update
     * If the new log data has more lines, then we'll only process the newer ones.
     */
    function processLogData(data, url) {
        var data = data.trim().split('\n');

        var obj = $scope.urlAndLogsHash[url];
        if (!obj) {
            $scope.urlAndLogsHash[url] = {previousLength: data.length, lastLineTxt: data[data.length - 1]};
        } else if (obj && obj.lastLineTxt == data[obj.previousLength - 1] && data.length == obj.previousLength) {
            data = [];
        } else if (obj && obj.lastLineTxt == data[obj.previousLength - 1] && data.length != obj.previousLength) {
            $scope.urlAndLogsHash[url] = {previousLength: data.length, lastLineTxt: data[data.length - 1]};
            data = data.splice(obj.previousLength);
        }
        return data;
    }
}

LogsCtrl.$inject = ['$scope', '$rootScope'];


