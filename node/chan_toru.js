const restClient = require('node-rest-client-promise').Client;
const dbClient = require('pg').Client;
const Express = require('express');
const dateformat = require('dateformat');


// DB関連
const dbConf = require('../conf/db.json');

// REST関連
const CHANTORU_ENDPOINT = 'https://tv.so-net.ne.jp/chan-toru';
const TIMEOUT = 10000; // 10 sec
const rest = new restClient();
var clientMethods = {
	GET  : rest.getPromise,
	POST : rest.postPromise,   
};
const headerPath = '../conf/chan_toru.json';

// EXPRESS関連
const SERVER_PORT = 3001;
const app = Express();
const OWN_ENDPOINT = {
	tvsearch : '/api/tvsearch/',
	resv     : '/api/resv/',
	schedule : '/api/schedule/' ,
};
app.use((req, res, next) => {   // CORS対応
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Headers', 
		'Origin, X-Requested-With, Content-Type, Accept'
	);
	res.header(
		'Access-Control-Allow-Methods', 
		'GET, POST, PUT, DELETE, OPTIONS');
	next();
});
const orgUrl  = {
	tvsearch : CHANTORU_ENDPOINT + '/tvsearch',
	list : CHANTORU_ENDPOINT + '/list',
	resv : CHANTORU_ENDPOINT + '/resv',
};


/* 
 * API実行の共通部
 * @param
 *   _method: ex. "GET"/"POST"
 *   _url:    APIのエンドポイント
 *   _url:    URLパラメータ、ヘッダー、POSTデータなど
 *   _parser: APIによるレスポンスの違いを吸収するための関数
 *   restArgs: EXPRESS
 */
var sendApiCom = function (_method, _url, _args, _parser, ...restArgs) {
	var req = restArgs[0];
	var res = restArgs[1];
	clientMethods[_method](_url, _args)
	.then(	
		function (val) {
			console.debug('then');
			var data = val.data;
			var response = val.response;
			response.readable = true; // レスポンスを読み取るために必要
			
			if (response.statusCode === 200) { // 200で返ってきたらこちらも200で返す
				return res.status(200).send(_parser(data));
			} else {                           // 200以外で返ってきたら400で返す
				var decoded = data.toString('utf8');
				console.error(decoded);
				return res.status(400).send(decoded);
			}	
		})
	.catch(    
		function (error) { // thenで例外発生時
			console.debug('catch');
			console.error(error);
			return res.status(500).json({
				errorCode: 'E001',
				errorMsg:  'Error in connection to API server.'
			});
		});
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


/* 
 * 番組表取得API
 * @description
 *   PostgreSQLのprogramsテーブルを取得
 * @param
 *   from:    '2020-01-02T05:00:00'  start_dateがちょうどを含む
 *   to:      '2020-01-09T05:00:00'  start_dateがちょうどを含まない
 *   genreId: '107100'
 * @todo
 * 	 パラメータのチェック
 *   DBクライアントのオブジェクトの再利用
 */
app.get(OWN_ENDPOINT.tvsearch, function(req, res){
	console.log('access: program list query.');

	let db = new dbClient(dbConf); 
	db.connect();

	// CHAN-TORUに投げるクエリリクエストを生成
	let query = req.query;  // デコード済み
	let sql;

	if (!query.from || !query.to) {
		console.error('Error: set "from" and "to" parameter!');
		return res.status(400).json({
			errorCode: 'E011',
			errorMsg:  'Error: Invalid paramter.'
		});
	}
	if (!query.genreId) {
		sql = {
			text:  'SELECT * FROM programs WHERE start_date >= $1 AND start_date < $2 ' +
				'ORDER BY start_date, service_id;',
			values:[query.from, query.to]
		};
	} else {
		sql = {
			text:  'SELECT * FROM programs WHERE start_date >= $1 AND start_date < $2 AND genre_ids = $3 ' + 
					'ORDER BY start_date, service_id;',
			values:[query.from, query.to, query.genreId]
		};
	}

	console.log('SQL:' + sql.text, sql.values);
	db.query(sql)
	.then(q_res => {
		return res.status(200).json(q_res.rows);
	})
	.catch(e => {
		console.error(e.stack);
		return res.status(500).json({
			errorCode: 'E012',
			errorMsg:  'Error: System error.'
		});
	})
	.finally(() => {db.end();});

});

/* 
 * 番組予約一覧取得API
 * @description
 *   CHAN-TORUのlist APIを叩き、nasneの予約一覧を取得
 * @params
 *   
 */
app.get(OWN_ENDPOINT.schedule, function(req, res){
	console.log('access: reservation list query.');

	// CHAN-TORUに投げるクエリリクエストを生成
	var query = req.query;

	postParam = {
		command: "schedule",
		resp:    "json",
		index:   0,
		num:     0, // 0はおそらく全取得
		type:    "manual",
	};

	var args = {
		headers: require(headerPath),
		//data: {},
		parameters: postParam,
		// 以下効いていない？
		requestConfig: {
			timeout: TIMEOUT
		},
		responseConfig: {
			timeout: TIMEOUT
		}
	};

	// CHAN-TORU へのリクエスト実行
	sendApiCom('POST', orgUrl.list, args, function (resData) {
		//console.log(typeof resData); // object
		var pretty = JSON.stringify(resData.list, null, " "); // インデントありで送信
		return pretty;
	}, ...arguments);
});

/* 
 * 番組予約API
 * @description
 *   CHAN-TORUのlist APIを叩き、nasneに番組予約
 */
app.get(OWN_ENDPOINT.resv, function(req, res){
	console.log('access: program reservation query.');

	// CHAN-TORUに投げるクエリリクエストを生成
	var query = req.query;
	//console.log(query);
	var postParam = {timestamp4p: Date.now()}; // 現在時刻で固定
	console.log(postParam);
	var postData = {};

	var defaultDate = date2Jst(new Date());
	try {
		postData = {
			op       : checkReqParamCand(['add', 'remove', 'modify'], query.op),
			sid      : checkReqParamNumber('1024', query.sid), // チャンネルID
			eid      : checkReqParamNumber('23251', query.eid), // 番組ID
			category : checkReqParamCand(['1', '2'], query.category),
			date     : '2020-01-01T21:50:00+09:00', //checkReqParamDateFuck2(defaultDate, query.data), // 必須
			duration : checkReqParamNumber('1200', query.duration), // 必須
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
	console.log(postData);

	var args = {
		headers: require(headerPath),
		data: postData,
		parameters: postParam,
		// 以下効いていない？
		requestConfig: {
			timeout: TIMEOUT
		},
		responseConfig: {
			timeout: TIMEOUT
		}
	};

	// CHAN-TORU へのリクエスト実行
	sendApiCom('POST', orgUrl.resv, args, function(resData) {
		var pretty = JSON.stringify(resData.Result.$, null, " "); // インデントありで送信
		console.debug(pretty);
		return pretty;
	}, ...arguments);	
});



var server = app.listen(SERVER_PORT, function () {
	var addr = this.address();
	console.log('Node.js is listening to localhost:' + addr.port);
});


