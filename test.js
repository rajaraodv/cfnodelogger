var $scope = {urlAndLogsHash: {}};
var txt = '1_2_3_4';
var txt2 = '1_2_3_4_5';
var txt3 = '1_2_3_4_5_6';
var txt4 = '1_2_3_4_5_6';
var txt5 = '1_2_3_4_5_6_7';
var url = 'http://bla';

function processLogData(data, url) {
    var data = data.split('_');

    var obj = $scope.urlAndLogsHash[url];
    if(!obj) {
        $scope.urlAndLogsHash[url] = {previousLength: data.length, lastLineTxt: data[data.length -1]};
    } else if(obj && obj.lastLineTxt == data[obj.previousLength -1] && data.length == obj.previousLength) {
        data = [];
    } else if(obj && obj.lastLineTxt == data[obj.previousLength -1] && data.length != obj.previousLength) {
        $scope.urlAndLogsHash[url] = {previousLength: data.length, lastLineTxt: data[data.length -1]};
        data = data.splice(obj.previousLength);
    }
    return data;
}

processLogData(txt, url);
processLogData(txt2, url);
processLogData(txt3, url);
processLogData(txt4, url);
processLogData(txt5, url);

