var Client = require('node-rest-client-promise').Client;
var Express = require('express');
var dateformat = require('dateformat');
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
};
var app = Express();
var url  = {
    tvsearch : CHANTORU_ENDPOINT + '/tvsearch',
    resv : CHANTORU_ENDPOINT + '/resv',
};


// API実行の共通部
var sendApiCom = function (_method, _url, _args, ...restArgs) {
    var req = restArgs[0];
    var res = restArgs[1];
    clientMethods[_method](_url, _args)
    .then(
        function (val) {
            //var json = JSON.parse(val.data.toString('utf8'));
            //return res.json(json);
            var str = val.data.toString('utf8');
            console.log(str);
        })
    .catch(
        function (error) {
            console.error(error);
            return res.status(500).send('Error in connection to API server.');
        }
    );
};

// リクエストパラメータのチェック(リストにある文字列か？)
var checkReqParamCand = function (candidates, value) { // candidates[0] がデフォルト値
    if (!value) {
        return candidates[0];
    }
    if (candidates.includes(value)) {
        return value;
    } else {
        throw 'Invalid query, type=cand.';
    }
};

// リクエストパラメータのチェック(整数型か？)
var checkReqParamNumber = function (defaultValue, value) {
    if (!value) {
        return defaultValue;
    }
    var casted = Number(value); // 整数にできない文字列ならばNaNになる
    if (!isNaN(casted)) {
        return casted;
    } else {
        throw 'Invalid query, type=number.';
    }
};

// リクエストパラメータのチェック(パース可能であればDate型で返す)
var checkReqParamDate = function (defaultValue, value) {
    if (!value) {
        return defaultValue;
    }
    var casted = new Date(value);
    if (!isNaN(casted.getTime())) {
        return casted;
    } else {
        throw 'Invalid query, type=date';
    }
};

// ISO 8601で返す
//var checkReqParamDateISO8601 = function (defaultValue, value) {
//    return checkReqParamUnixDate(defaultValue, value).toJSON();
//};

// YYYYmmddhhssffで返す
var checkReqParamDateFuck = function (defaultValue, value) {
    return date2YYYYmmddhhss(checkReqParamDate(defaultValue, value));
};

var checkReqParamDateFuck2 = function (defaultValue, value) {
    return date2Jst(checkReqParamDate(defaultValue, value));
};

var date2YYYYmmddhhss = function (date) {
    return dateformat(date, 'yyyymmddHHMMss');
};

var date2Jst = function (date) {
    return dateformat(date, 'yyyy-mm-dd"T"HH:MM:ss+09:00');
};

// 番組表取得API
app.get(OWN_ENDPOINT.tvsearch, function(req, res){
    console.log('access: program list query.');

    // CHAN-TORUに投げるクエリリクエストを生成
    var query = req.query;
    var defaultDate = date2YYYYmmddhhss(new Date());
    console.log(query);
    var param = {};
    try {
        param = {
            op       : checkReqParamCand(['bytime', 'current'], query.op),
            span     : checkReqParamNumber('23', query.span),
            category : checkReqParamCand(['1', '2'], query.category),
            start    : checkReqParamDateFuck(defaultDate, query.start),
        };
    } catch (e) {
        return res.status(400).send('Bad Request: ' + e + '<br>' + JSON.stringify(query));
    }
    console.log(param);

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
    console.log(query);
    var param = {timestamp4p: Date.now()}; // 現在時刻で固定
    var form = {};

    var defaultDate = date2Jst(new Date());
    try {
        form = {
            op       : checkReqParamCand(['add', 'remove', 'modify'], query.op),
            sid      : checkReqParamNumber('0', query.sid), // チャンネルID
            eid      : checkReqParamNumber('0', query.eid), // 番組ID
            category : checkReqParamCand(['1', '2'], query.category),
            date     : checkReqParamDateFuck2(defaultDate, query.data),
            duration : checkReqParamNumber('0', query.duration),
            //form.double = 'on';
            //title = '',
            //priority = '1',
            quality     : checkReqParamNumber(230, query.quality),
            condition   : checkReqParamCand(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'], query.condition),
            destination : checkReqParamCand(['HDD'], query.destination)
        };
    } catch (e) {
        return res.status(400).send('Bad Request: ' + e + '<br>' + JSON.stringify(query));
    }
    console.log(form);

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


