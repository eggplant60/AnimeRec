const restClient = require('node-rest-client-promise').Client;
const dbClient = require('pg').Client;
const Express = require('express');
//const htmlParser = require('node-html-parser');
const {
	checkReqParamCand,
	checkReqParamNumber,
	checkReqParamDateFuck,
	checkReqParamDateFuck2,
	date2Jst,
} = require('./parameter.js');

// DB関連
const dbConf = require('../conf/db.json');

// REST関連
const chanToruEndpoint = 'https://tv.so-net.ne.jp/chan-toru';
const orgUrl  = {
	tvsearch : chanToruEndpoint + '/tvsearch',
	list   : chanToruEndpoint + '/list',
	resv   : chanToruEndpoint + '/resv',
	detail : chanToruEndpoint + '/detail',
};
const timeout = 10000; // 10 sec
const rest = new restClient();
var clientMethods = {
	get  : rest.getPromise,
	post : rest.postPromise,   
};
const headerPath = '../conf/chan_toru.json';
const defaultArgs = {
	headers: require(headerPath),
	requestConfig: {
		timeout: timeout
	},
	responseConfig: {
		timeout: timeout
	}
};


// EXPRESS関連
const serverPort = 3001;
const localhost = 'http://localhost:' + serverPort;
const app = Express();
// @todo: リソース名見直す
const ownEndpoint = {
	tvsearch : '/api/tvsearch/',
	resv     : '/api/resv/',
	resv2    : '/api/resv2/',
	schedule : '/api/schedule/' ,
	eventId  : '/api/eventId/',
	updtresv : '/api/updtresv/'
};
app.use((req, res, next) => {   // CORS対応
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Headers', 
		'Origin, X-Requested-With, Content-Type, Accept'
	);
	res.header(
		'Access-Control-Allow-Methods', 
		'GET, POST, PUT, DELETE, OPTIONS'
	);
	next();
});


/* 
 * API実行の共通部
 * @param
 *   _method: ex. 'GET'/'POST'
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


/* 
 * 予約フラグ更新API
 * @description
 *   PostgreSQLのprogramsテーブルのis_reservedを更新
 * @param
 * @todo
 */
app.get(ownEndpoint.updtresv, function(req, res){
	console.log('access: reservation update query.');

	// @todo 予約一覧API終了後に移す
	let db = new dbClient(dbConf); 
	db.connect();

	// 予約一覧APIにアクセス
	clientMethods.get(localhost + ownEndpoint.schedule, {})
	.then((val) => {
		var data = val.data;
		var reservations = JSON.parse(data.toString('utf8'));
		//console.debug(reservations);

		var eventIds = reservations.map(element => {
			return parseInt(element.eventId, 16).toString();
		});
		var sql = 'UPDATE programs SET is_reserved = false WHERE start_date >= CURRENT_TIMESTAMP;';
		sql += "UPDATE programs SET is_reserved = true WHERE event_id IN ('" +
				eventIds.join("','") + "');";
		console.debug(sql);
		return db.query(sql);
	})
	.then(resSql => {
		console.debug(resSql);
		return res.status(200).send();
	})
	.catch(e => {
		console.error(e.stack);
		return res.status(500).json({
			errorCode: 'E022',
			errorMsg:  'Error: Update failed.'
		});
	})
	.finally(() => {db.end();});
});

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
app.get(ownEndpoint.tvsearch, function(req, res){
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
 * event_id取得API
 * @description
 *   CHAN-TORUのlist APIを叩き、番組詳細画面から event_id を取得
 * @params
 *   area: ex '23'
 *   sid:  ex '1024'
 *   pid:  ex '101024202002020315'
 */
app.get(ownEndpoint.eventId, function(req, res){
	console.log('access: event_id query.');

	// CHAN-TORUに投げるクエリリクエストを生成
	var query = req.query;
	var postParam = {};

	try {
		postParam = {
			type : 'bytime',
			cat  : '1', 
			area : checkReqParamNumber(query.area),
			sid  : checkReqParamNumber(query.sid),
			pid  : checkReqParamNumber(query.pid),
			//start: checkReqParamNumber(query.start), // 任意
			//end  : checkReqParamNumber(query.end), // 任意
			//timestamp4p:
		};
	} catch (e) {
		return res.status(400).send('Bad Request: ' + e + '<br>' + JSON.stringify(query));
	}
	console.debug(postParam);

	var args = JSON.parse(JSON.stringify(defaultArgs));
	args.parameters = postParam;

	// CHAN-TORU へのリクエスト実行
	sendApiCom('post', orgUrl.detail, args, function (resData) {
		var decoded = resData.toString('utf8');
		var eid = decoded.match(/eid=([0-9]+)&/)[1];
		return eid;
	}, ...arguments);
});

/* 
 * 番組予約一覧取得API
 * @description
 *   CHAN-TORUのlist APIを叩き、nasneの予約一覧を取得
 * @params
 *   
 */
app.get(ownEndpoint.schedule, function(req, res){
	console.log('access: reservation list query.');

	// CHAN-TORUに投げるクエリリクエストを生成
	var query = req.query;

	postParam = {
		command: 'schedule',
		resp:    'json',
		index:   0,
		num:     0, // 0はおそらく全取得
		type:    'manual', // 'all' との違いは不明
	};

	var args = JSON.parse(JSON.stringify(defaultArgs));
	args.parameters = postParam;

	// CHAN-TORU へのリクエスト実行
	sendApiCom('post', orgUrl.list, args, function (resData) {
		//console.log(typeof resData); // object
		var pretty = JSON.stringify(resData.list, null, ' '); // インデントありで送信
		return pretty;
	}, ...arguments);
});

/* 
 * 番組予約API
 * @description
 *   CHAN-TORUのlist APIを叩き、nasneに番組予約
 * @note
 *   番組表には eid が存在しないので、先にAPI/DB経由で eid を取得する必要あり
 * @param
 *   op: 'add'/'remove'/'modify'
 *   sid: ex '1024'
 *   eid: ex  
 *   category:
 *   date:     ex '2020-02-04T02:45:00+09:00'
 * 	 duration: ex '600' [sec]
 */
app.get(ownEndpoint.resv, function(req, res){
	console.log('access: program reservation query.');
	
	// CHAN-TORUに投げるクエリリクエストを生成
	var query = req.query;
	var postParam = {timestamp4p: Date.now()}; // 現在時刻で固定
	console.log(postParam);
	var postData = {};

	var defaultDate = date2Jst(new Date());
	try {
		postData = {
			op       : checkReqParamCand(['add', 'remove', 'modify'], query.op),
			sid      : checkReqParamNumber('0', query.sid), // チャンネルID
			eid      : checkReqParamNumber('0', query.eid), // 番組ID
			category : checkReqParamCand(['1', '2'], query.category),
			date     : checkReqParamDateFuck2(defaultDate, query.date), // 必須
			duration : checkReqParamNumber('1200', query.duration), // 必須
			// 以下任意
			//double   : 'on',
			//title    : '%E3%82%B0%E3%83%83%E3%83%89%E3%83%BB%E3%83%95%E3%82%A1%E3%82%A4%E3%83%88%EF%BC%883%EF%BC%89%E3%80%8C%E7%96%91%E6%83%91%E3%81%AE%E3%83%AA%E3%82%B9%E3%83%88%E3%80%8D', // 任意
			//priority : '1',
			//quality     : checkReqParamNumber('230', query.quality),
			//condition   : checkReqParamCand(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'], query.condition),
			//destination : checkReqParamCand(['HDD'], query.destination)
		};
	} catch (e) {
		return res.status(400).send('Bad Request: ' + e + '<br>' + JSON.stringify(query));
	}
	console.log(postData);

	var args = JSON.parse(JSON.stringify(defaultArgs));
	args.parameters = postParam;
	args.data = postData;
	
	// CHAN-TORU へのリクエスト実行
	sendApiCom('post', orgUrl.resv, args, function(resData) {
		var pretty = JSON.stringify(resData.Result.$, null, ' '); // インデントありで送信
		return pretty;
	}, ...arguments);	
});


/* 
 * 番組予約API 2
 * @description
 *   番組表の pid から予約指定できるAPI
 * @param
 *   以下が 番組予約API との差分
 *   - eid
 *   + pid
 */
app.get(ownEndpoint.resv2, function(req, res){
	console.log('access: program reservation query2.');

	var postParam = req.query;
	console.debug(postParam);

	// パラメータチェック
	if (!postParam.sid || !postParam.pid || !postParam.area) {
		return res.status(400).json({
			errorCode: 'E002',
			errorMsg:  'Error: Invalid parameters. "sid", "pid", and "area"' 
		});
	}

	var args = JSON.parse(JSON.stringify(defaultArgs));
	args.parameters = {
		area:postParam.area,
		sid: postParam.sid,
		pid: postParam.pid,	
	};

	// eid の取得をしてから番組予約APIを叩く
	clientMethods.get(localhost + ownEndpoint.eventId, args)
	.then(function(val) {
		console.debug('then 2');
		var data = val.data;
		var decoded = data.toString('utf8');
		//console.debug(decoded);
		postParam.eid = decoded; // evnetId追加
		var args = JSON.parse(JSON.stringify(defaultArgs));
		args.parameters = postParam;

		// @todo
		//   例外処理
		sendApiCom('get', localhost + ownEndpoint.resv, args, function (resData) {
			var decoded = resData.toString('utf8');
			return decoded;
		}, req, res);
	})
	.catch(function(error) {
		console.debug('catch 2');
		console.error(error);  // 'No eventId' etc.
		return res.status(500).json({
			errorCode: 'E004',
			errorMsg:  'Error in Reseration Query 2.'
		});
	});

});


var server = app.listen(serverPort, function () {
	var addr = this.address();
	console.log('Node.js is listening to localhost:' + addr.port);
});


