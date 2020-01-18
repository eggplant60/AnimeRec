var Client = require('node-rest-client-promise').Client;
var Express = require('express');
//var op = require('./op_programs.js').channels;

var CHANTORU_ENDPOINT = 'https://tv.so-net.ne.jp/chan-toru';
//var CHANTORU_ENDPOINT = 'http://localhost:3002'; // テスト用
var HEADER_PATH = './headers.json';
var SERVER_PORT = 3001;
var OWN_ENDPOINT = {
    tvsearch: '/api/tvsearch/',
    resv: '/api/resv/'
};
var TIMEOUT = 10000; // 10 sec

var client = new Client();
var clientMethods = {
    GET  : client.getPromise,
    POST : client.postPromise,   
}
var app = Express();
var url  = {
    tvsearch : CHANTORU_ENDPOINT + '/tvsearch',
    resv : CHANTORU_ENDPOINT + '/resv',
};


// API実行の共通部
var sendApiCom = function (_method, _url, _args, ...restArgs) {
    var req = restArgs[0];
    var res = restArgs[1];
    clientMethods[_method](_url, _args).then(
        function (val) {
            var json = JSON.parse(val.data.toString('utf8'));
            return res.json(json);
        }
    ).catch(
        function (error) {
            console.error(error);
            return res.status(500).send('<h3>Error in connection to API server.</h3>');
        }
    );
};


// 番組表取得API
app.get(OWN_ENDPOINT.tvsearch, function(req, res){
    console.log('access: program list query.');

    // CHAN-TORUに投げるクエリリクエストを生成
    var query = req.query;
    var param = {};
    param.op = ['bytime', 'current'].includes(query.op) ? query.op : 'bytime'; // bytime/current
    param.span = '26'; // 不明
    param.category = ['1', '2'].includes(query.category) ? query.category : '1'; // 1: 地上デシタル、2: BS
    if (!query.start) {
        param.start = Date.now(); // UNIX時間。当日5:00～明日5:00まで、終わっている分は除く
    } else {
        var tmp = Number(query.start);
        if (!isNaN(tmp)) {
            param.start = tmp;
        } else {
            return res.status(400).send('<h3>Bad Request: start = ' + query.start + '</h3>');
        }
    }

    var args = {
        headers: require(HEADER_PATH),
        parameters: param,
        // 以下効いていない？
        requestConfig: {
            timeout: TIMEOUT
        },
        responseConfig: {
            timeout: TIMEOUT
        }
    };

    // CHAN-TORU へのリクエスト実行
    sendApiCom('GET', url.tvsearch, args, ...arguments);
});


// 番組予約API
app.get(OWN_ENDPOINT.resv, function(req, res){
    console.log('access: program reservation query.');

    // CHAN-TORUに投げるクエリリクエストを生成
    var query = req.query;
    var param = {timestapm4p: aaa};
    if (!query.start) {
        param.start = Date.now(); // UNIX時間。当日5:00～明日5:00まで、終わっている分は除く
    } else {
        var tmp = Number(query.start);
        if (!isNaN(tmp)) {
            param.start = tmp;
        } else {
            return res.status(400).send('<h3>Bad Request: start = ' + query.start + '</h3>');
        }
    }


    var form = {};
    form.op = ['add'].includes(query.op) ? query.op : 'add'; // add,
    form.sid = '1056';
    form.eid = '20389';
    form.category = ['1', '2'].includes(query.category) ? query.category : '1'; // 1: 地上デシタル、2: BS
    form.date = query.date;
    form.duration = '7500';
    //form.double = 'on';
    form.title = '';
    form.priority = '1';
    form.quality = '230';
    form.condition = 'w1';
    form.destination = 'HDD';


    var args = {
        headers: require(HEADER_PATH),
        form: form,
        parameters: param,
        // 以下効いていない？
        requestConfig: {
            timeout: TIMEOUT
        },
        responseConfig: {
            timeout: TIMEOUT
        }
    };

    // CHAN-TORU へのリクエスト実行
    sendApiCom('POST', url.resv, args, req, res);
});


/* listen()メソッドを実行して3001番ポートで待ち受け*/
var server = app.listen(SERVER_PORT, function () {
    var addr = this.address();
    console.log('Node.js is listening to localhost:' + addr.port);
});


