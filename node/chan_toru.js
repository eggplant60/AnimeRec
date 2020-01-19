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
        function (val) { // なんらかのレスポンスがあった
            var data = val.data;
            var response = val.response;
            response.readable = true; // レスポンスを読み取るために必要
            var strVal = data.toString('utf8');

            // CHAN-TORUからのステータスコードをそのまま返す
            //debugger;
            try { // memo: 一覧取得はJSON, 予約はxmlで返ってくる
                return res.status(response.statusCode).json(JSON.parse(strVal));
                //return res.status(response.statusCode).send(strVal);
            } catch (e) {
                return res.status(response.statusCode).send(strVal);
            }
        })
    .catch(    
        function (error) { // レスポンスがなにもなかった
            console.error(error);
            return res.status(500).json({
                errorCode: 'E001',
                errorMsg:  'Error in connection to API server.'
            });
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
        return value;
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
    var defaultDate = new Date();
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
    //console.log(query);
    var param = {timestamp4p: Date.now()}; // 現在時刻で固定
    console.log(param);
    var form = {};

    var defaultDate = date2Jst(new Date());
    try {
        form = {
            op       : checkReqParamCand(['add', 'remove', 'modify'], query.op),
            sid      : checkReqParamNumber('1024', query.sid), // チャンネルID
            eid      : checkReqParamNumber('14965', query.eid), // 番組ID
            category : checkReqParamCand(['1', '2'], query.category),
            //date     : '2020-01-19T23:15:00+09:00', //checkReqParamDateFuck2(defaultDate, query.data), // 必須
            duration : checkReqParamNumber('2700', query.duration), // 必須
            //double   : 'on',
            //title    : '%E3%82%B0%E3%83%83%E3%83%89%E3%83%BB%E3%83%95%E3%82%A1%E3%82%A4%E3%83%88%EF%BC%883%EF%BC%89%E3%80%8C%E7%96%91%E6%83%91%E3%81%AE%E3%83%AA%E3%82%B9%E3%83%88%E3%80%8D', // 任意
            priority : '1',
            //quality     : checkReqParamNumber('230', query.quality),
            //condition   : checkReqParamCand(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'], query.condition),
            destination : checkReqParamCand(['HDD'], query.destination)
        };
    } catch (e) {
        return res.status(400).send('Bad Request: ' + e + '<br>' + JSON.stringify(query));
    }
    console.log(form);

    var args = {
        headers: require(HEADER_PATH),
        //form: form,
        data: form,
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
    sendApiCom('POST', url.resv, args, ...arguments);
});


/* listen()メソッドを実行して3001番ポートで待ち受け*/
var server = app.listen(SERVER_PORT, function () {
    var addr = this.address();
    console.log('Node.js is listening to localhost:' + addr.port);
});


