const restClient = require('node-rest-client-promise').Client;
const dbClient = require('pg').Client;
const Express = require('express');
//const bodyParser = require('body-parser');
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
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
// @todo: リソース名見直す
const expressEndpoint = {
	eid      : '/api/programs/eid/',   // post
	search   : '/api/programs/list/',  // get
	resv     : '/api/reservations/',   // post, 一覧取得, 予約, 削除, 更新
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

/* --------------------- CHAN-TORU -------------------------------- */

/* 
 * 1. event_id取得API
 * @description
 *   CHAN-TORUのlist APIを叩き、番組詳細画面から event_id を取得
 * @note
 *   バッチ処理もしくは自分自身で使用。基本的にはクライアント側から直接実行しない
 * @method
 *   post
 * @body
 * {
 *   "area": '23',
 *   "sid" : '1024',
 *   "pid" : '101024202002020315',
 * }
 */
app.post(expressEndpoint.eid, (req, res) => {
	console.log('API01: Access to ' + expressEndpoint.eid);

	// CHAN-TORUに投げるクエリリクエストを生成
	//var query = req.query;
	var body = req.body;
	console.log(body);
	var postParam = {};

	try {
		postParam = {
			type : 'bytime',
			cat  : '1', 
			area : checkReqParamNumber(body.area),
			sid  : checkReqParamNumber(body.sid),
			pid  : checkReqParamNumber(body.pid),
			//start: checkReqParamNumber(body.start), // 任意
			//end  : checkReqParamNumber(body.end), // 任意
			//timestamp4p:
		};
	} catch (e) {
		console.log('API01: Invalid paramters.' + e);
		return res.status(400).json({
			errorCode : 'E010',
			errorMsg  : 'Invalid paramters. ' + e,
			parameters: query
		});
	}
	console.log(postParam);
	
	var args = JSON.parse(JSON.stringify(defaultArgs));
	args.parameters = postParam;

	// CHAN-TORU へのリクエスト実行
	clientMethods.post(orgUrl.detail, args)
	.then((val) => {
		console.log('API01: then');
		var data = val.data;
		var decoded = data.toString('utf8');

		val.response.readable = true;
		var statusCode = val.response.statusCode;

		if (statusCode === 200) { // 200で返ってきたらこちらも200で返す
			// 番組が放送済みでもそうでなくてもHTMLが返ってくる
			try {
				var eid = decoded.match(/eid=([0-9]+)&/)[1];
				return res.status(200).json({eid: eid});
			} catch (e) {
				return res.status(203).json();
			}
		} else {                  // 200以外で返ってきたらそのまま返す
			console.error(decoded);
			return res.status(statusCode).send(decoded);
		}
	})
	.catch((error) => { // thenで例外発生時
		console.error('API01: catch');
		console.error(error);
		return res.status(500).json({
			errorCode: 'E011',
			errorMsg:  'System error.'
		});
	});
});

/* 
 * 2. 番組予約操作 API
 * @description
 *   CHAN-TORUのlist APIを叩き、nasneの予約一覧取得・追加・削除・更新
 * @note
 *   実態は各関数参照
 * @method
 *   post
 * @body
 * 
 * 予約一覧(list)
 * {
 * 	 "op" : "list",
 * }
 * 
 * 予約追加(add)
 * {
 * 	 "op" : "add",
 *   "sid": "1040",
 *   "eid": "6879",
 *   "category": "1",
 *   "date":  "2020-02-07T02:34:00+09:00",
 * 	 "duration": "4500"
 * }
 * /'remove'/'modify'
 */
app.post(expressEndpoint.resv, (req, res) => {
	console.log('API02: Access to ' + expressEndpoint.resv);
	var body = req.body;
	console.log(body);

	switch (body.op) {
	case 'list':
		return listReservations(req, res);
	case 'add':
		return addReservation(req, res);
	case 'update':
		//return
	case 'delete':
		//
	default:
		return res.status(400).json({
			errorCode: 'E020',
			errorMsg:  'Invalid body. '
		});
	}
});


/* 
 * 2-a. 予約一覧取得 関数
 * @description
 *   CHAN-TORUのlist APIを叩き、nasneの予約一覧を取得
 * @params
 *   なし
 */
//app.post(expressEndpoint.schedule, function(req, res){
function listReservations(req, res) {
	console.log('listReservations()');

	// CHAN-TORUに投げるクエリリクエストを生成
	//var body = req.body;

	postParam = {
		command: 'schedule',
		resp:    'json',
		index:   0,
		num:     0,        // 0はおそらく全取得
		type:    'manual', // 'all' との違いは不明
	};

	var args = JSON.parse(JSON.stringify(defaultArgs));
	args.parameters = postParam;

	// CHAN-TORU へのリクエスト実行
	clientMethods.post(orgUrl.list, args)
	.then((val) => {
		console.log('listReservations(): then');
		var data = val.data;
		
		val.response.readable = true;
		var statusCode = val.response.statusCode;

		if (statusCode === 200) { // 200で返ってきたらこちらも200で返す
			return res.status(200).json(data.list);
		} else {                  // 200以外で返ってきたら500で返す
			// HTMLで返ってくる
			var decoded = data.toString('utf8');
			console.error(decoded);
			return res.status(500).send(decoded);
		}
	})
	.catch((error) => { // thenで例外発生時
		console.error('listReservations(): catch');
		console.error(error);
		return res.status(500).json({
			errorCode: 'E021',
			errorMsg:  'System error.'
		});
	});
}

/* 
 * 2-b. 番組予約関数
 * @description
 *   CHAN-TORUのlist APIを叩き、nasneに番組予約
 * @note
 *   番組表には eid が存在しないので、先にAPI/DB経由で eid を取得する必要あり
 * @param
 */
//app.get(expressEndpoint.resv, function(req, res){
function addReservation(req, res) {
	console.log('addReservation()');
	
	// CHAN-TORUに投げるクエリリクエストを生成
	var body = req.body;
	var postParam = {timestamp4p: Date.now()}; // 現在時刻で固定
	console.log(postParam);
	var postData = {};

	var defaultDate = date2Jst(new Date());
	try {
		postData = {
			op       : 'add',
			sid      : checkReqParamNumber('0', body.sid), // チャンネルID
			eid      : checkReqParamNumber('0', body.eid), // 番組ID
			category : checkReqParamCand(['1', '2'], body.category),
			date     : checkReqParamDateFuck2(defaultDate, body.date), // 必須
			duration : checkReqParamNumber('1200', body.duration), // 必須
			// 以下任意
			//double   : 'on',
			//title    : '%E3%82%B0%E3%83%83%E3%83%89%E3%83%BB%E3%83%95%E3%82%A1%E3%82%A4%E3%83%88%EF%BC%883%EF%BC%89%E3%80%8C%E7%96%91%E6%83%91%E3%81%AE%E3%83%AA%E3%82%B9%E3%83%88%E3%80%8D', // 任意
			//priority : '1',
			//quality     : checkReqParamNumber('230', body.quality),
			//condition   : checkReqParamCand(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'], body.condition),
			//destination : checkReqParamCand(['HDD'], body.destination)
		};
	} catch (e) {
		console.log('addReservation(): Invalid body. ' + JSON.stringify(e));
		return res.status(400).json({
			errorCode: 'E022',
			errorMsg:  'Invalid body.',
			body: body
		});
	}
	console.log(postData);

	var args = JSON.parse(JSON.stringify(defaultArgs));
	args.parameters = postParam;
	args.data = postData;
	
	// CHAN-TORU へのリクエスト実行
	clientMethods.post(orgUrl.resv, args)
	.then((val) => {
		console.log('addReservation(): then');
		var data = val.data;
		
		val.response.readable = true;
		var statusCode = val.response.statusCode;

		if (statusCode === 200) { // 200で返ってきたらこちらも200で返す
			/*
			[成功時]	
			  "responseCode": "830",
			  "responseMsg": "日テレ:0x1ADF:日テレポシュレ",
			  "isListCapability": "true",
			  "dateTime": "2020-02-07T02:34:00+09:00",
			  "dateTime1970": "1581010440000",
			  "sid": "1040",
			  "duration": "1200000"
			[失敗時]
			  "responseCode": "803",
			  "responseMsg": "録画できない放送局を指定したか、既に終了した番組のため、予約に失敗しました",
			  "isListCapability": "true",
			  "dateTime": "2020-02-07T02:34:00+09:00",
			  "dateTime1970": "1581010440000",
			  "sid": "104",
			  "duration": "1200000"
			*/
			return res.status(200).json(data.Result.$);
		} else {                  // 200以外で返ってきたら500で返す
			// HTMLで返ってくるかもしれないので念の為
			var decoded = data.toString('utf8');
			console.error(decoded);
			return res.status(500).send(decoded);
		}
	})
	.catch((error) => { // thenで例外発生時
		console.error('addReservation(): catch');
		console.error(error);
		return res.status(500).json({
			errorCode: 'E023',
			errorMsg:  'System error.'
		});
	});
}


/* 
 * 4. 番組予約API 2
 * @description
 *   番組表の pid から予約指定できるAPI
 * @param
 *   以下が 番組予約API との差分
 *   - eid
 *   + pid
 */
// app.post(expressEndpoint.resv2, function(req, res){
// 	console.log('access: program reservation query2.');

// 	var postParam = req.query;
// 	console.debug(postParam);

// 	// パラメータチェック
// 	if (!postParam.sid || !postParam.pid || !postParam.area) {
// 		return res.status(400).json({
// 			errorCode: 'E040',
// 			errorMsg:  'Error: Invalid parameters. "sid", "pid", and "area"' 
// 		});
// 	}

// 	var args = JSON.parse(JSON.stringify(defaultArgs));
// 	args.parameters = {
// 		area:postParam.area,
// 		sid: postParam.sid,
// 		pid: postParam.pid,	
// 	};

// 	// eid の取得をしてから番組予約APIを叩く
// 	clientMethods.get(localhost + expressEndpoint.eventId, args)
// 	.then(function(val) {
// 		console.debug('then 2');
// 		var data = val.data;
// 		var decoded = data.toString('utf8');
// 		//console.debug(decoded);
// 		postParam.eid = decoded; // evnetId追加
// 		var args = JSON.parse(JSON.stringify(defaultArgs));
// 		args.parameters = postParam;

// 		// @todo
// 		//   例外処理
// 		sendApiCom('get', localhost + expressEndpoint.resv, args, function (resData) {
// 			var decoded = resData.toString('utf8');
// 			return decoded;
// 		}, req, res);
// 	})
// 	.catch(function(error) {
// 		console.debug('catch 2');
// 		console.error(error);  // 'No eventId' etc.
// 		return res.status(500).json({
// 			errorCode: 'E041',
// 			errorMsg:  'Error:  Reseration query 2 failed.'
// 		});
// 	});

// });

/* 
 * 5. 予約フラグ更新API
 * @description
 *   PostgreSQLのprogramsテーブルのis_reservedを更新
 * @param
 * @todo
 */
// app.post(expressEndpoint.updtresv, function(req, res){
// 	console.log('access: reservation update query.');

// 	// @todo 予約一覧API終了後に移す
// 	let db = new dbClient(dbConf); 
// 	db.connect();

// 	// 予約一覧APIにアクセス
// 	clientMethods.get(localhost + expressEndpoint.schedule, {})
// 	.then((val) => {
// 		var data = val.data;
// 		var reservations = JSON.parse(data.toString('utf8'));
// 		//console.debug(reservations);

// 		var eventIds = reservations.map(element => {
// 			return parseInt(element.eventId, 16).toString();
// 		});
// 		var sql = 'UPDATE programs SET is_reserved = false WHERE start_date >= CURRENT_TIMESTAMP;';
// 		sql += "UPDATE programs SET is_reserved = true WHERE event_id IN ('" +
// 				eventIds.join("','") + "');";
// 		console.debug(sql);
// 		return db.query(sql); // Promise
// 	})
// 	.then(resSql => {
// 		console.debug(resSql);
// 		return res.status(200).send();
// 	})
// 	.catch(e => {
// 		console.error(e.stack);
// 		return res.status(500).json({
// 			errorCode: 'E050',
// 			errorMsg:  'Error: Update of is_reserved failed.'
// 		});
// 	})
// 	.finally(() => {db.end();});
// });

/* 
 * 6. 番組表取得API
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
app.get(expressEndpoint.search, function(req, res){
	console.log('API06: access to '+ expressEndpoint.programs);

	let db = new dbClient(dbConf); 
	db.connect();

	// CHAN-TORUに投げるクエリリクエストを生成
	let query = req.query;  // デコード済み
	let sql;

	if (!query.from || !query.to) {
		console.log('API06: Invalid parameters');
		return res.status(400).json({
			errorCode: 'E060',
			errorMsg:  'Error: Invalid paramters. Set "from" and "to" value.'
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
	.then(resSql => {
		return res.status(200).json(resSql.rows);
	})
	.catch(e => {
		console.error(e.stack);
		return res.status(500).json({
			errorCode: 'E061',
			errorMsg:  'Error: System error.'
		});
	})
	.finally(() => {db.end();});

});



var server = app.listen(serverPort, function () {
	var addr = this.address();
	console.log('Node.js is listening to localhost:' + addr.port);
});


