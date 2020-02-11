const restClient = require('node-rest-client-promise').Client;
const dbClient = require('pg').Client;
const Express = require('express');
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
const chanToruUrl = 'https://tv.so-net.ne.jp/chan-toru';
const restEndpoint  = {
	tvsearch : chanToruUrl + '/tvsearch',
	list   : chanToruUrl + '/list',
	resv   : chanToruUrl + '/resv',
};
const timeout = 10000; // 10 sec
const rest = new restClient();
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
const expressEndpoint = {
	search   : '/api/programs/',       // get = 一覧取得
	resv     : '/api/reservations/',   // post = [一覧取得, 予約, 削除, 更新]
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
 * 2. 番組予約操作 API
 * @description
 *   CHAN-TORUのlist APIを叩き、nasneの予約一覧取得/追加/更新/削除
 * @note
 *   実態は各関数参照
 * @method
 *   post
 * @param
 *   op: 'list'/'add'/'remove'/'update'
 * @body
 * 
 * 予約一覧(list)
 * {}
 * 
 * 予約追加(add)
 * {
 *   "sid": "1040",
 *   "eid": "6879",
 *   "category": "1",
 *   "date":  "2020-02-07T02:34:00+09:00",
 * 	 "duration": "4500"
 *   "condition": "week",
 *   "quality"  : "normal",
 *   "destination" : "external"
 * }
 * 
 * 予約削除(remove)
 * {
 *   "item_id" : "...",
 *   "drv_id"  : "..."
 * }
 * 
 * 予約更新(modify)
 */
app.post(expressEndpoint.resv, (req, res) => {
	console.log('API02: Access to ' + expressEndpoint.resv);
	var param = req.query;
	var body = req.body;
	console.log(param);
	console.log(body);

	switch (param.op) {
	case 'list':
		return listReservations(req, res);
	case 'add':
		return addReservation(req, res);
	case 'remove':
		return removeReservation(req, res);
	default:
		console.log('API02: Invalid body. op = ' + param.op);
		return res.status(400).json({
			errorCode: 'E020',
			errorMsg:  'Invalid body. op = ' + param.op
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
function listReservations(req, res) {
	console.log('listReservations()');

	postParam = {
		command: 'schedule',
		resp:    'json',
		index:   0,
		num:     0,        // 0はおそらく全取得
		type:    'manual', // 'all' との違いは不明
	};

	var args = JSON.parse(JSON.stringify(defaultArgs));
	args.parameters = postParam;

	// CHAN-TORU へのリクエスト
	rest.postPromise(restEndpoint.list, args)
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
function addReservation(req, res) {
	console.log('addReservation()');
	
	// CHAN-TORUに投げるクエリリクエストを生成
	var body = req.body;
	var postParam = {timestamp4p: Date.now()}; // 現在時刻で固定
	console.log(postParam);

	var defaultDate = date2Jst(new Date());
	var postData = {};
	try {
		postData = {
			op       : 'add',
			sid      : checkReqParamNumber('0', body.sid), // チャンネルID
			eid      : checkReqParamNumber('0', body.eid), // 番組ID
			category : checkReqParamCand(['1', '2'], body.category),
			date     : checkReqParamDateFuck2(defaultDate, body.date), // 必須
			duration : checkReqParamNumber('1200', body.duration), // 必須
			// 以下, 設定不要なパラメータ
			//double   : 'on',
			//title    : '%E3%82%B0%E3%83%83%E3%83%89%E3%83%BB%E3%83%95%E3%82%A1%E3%82%A4%E3%83%88%EF%BC%883%EF%BC%89%E3%80%8C%E7%96%91%E6%83%91%E3%81%AE%E3%83%AA%E3%82%B9%E3%83%88%E3%80%8D', // 任意
			//priority : '1',
		};
		var condition = checkReqParamCand(['week', 'once', 'day'], body.condition); // 毎週がデフォルト		
		var quality = checkReqParamCand(['normal', 'high'], body.quality); // 表示画質がデフォルト
		var destination = checkReqParamCand(['external', 'internal'], body.destination); // 録画先は外部HDDがデフォルト
		switch (condition) {
			case 'week':
				postData.condition = 'w' + 
					((new Date(body.date).getDay() + 6) % 7 + 1).toString(); // なぜ0オリジンにしないのか理解に苦しむ
				break;
			case 'once':
				break;
			case 'day':
				postData.condition = 'd';
				break;
			default:
				throw 'invalid value condition = ' + condition;
		}
		switch (quality) {
			case 'normal':
				postData.quality = '230';
				break;
			case 'high':
				break;
			default:
				throw 'invalid value quality = ' + quality;
		}
		switch (destination) {
			case 'external':
				postData.destination = 'HDD';
				break;
			case 'internal':
				break;
			default:
				throw 'invalid value destination = ' + destination;
		}
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
	rest.postPromise(restEndpoint.resv, args)
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
 * 2-c. 予約削除 関数
 * @description
 *   CHAN-TORUのlist APIを叩き、nasneの予約削除
 * @note
 *   
 * @param
 */
function removeReservation(req, res) {
	console.log('removeReservation()');
	
	// CHAN-TORUに投げるクエリリクエストを生成
	var body = req.body;
	var postParam = {}; // 現在時刻で固定

	try {
		postParam = {
			timestamp4p: Date.now(),
			op       : 'remove',
			resp     : 'xml',  // 'json'はないらしい
			type     : 'manual',
			item     : checkReqParamNumber('0', body.item_id),
			dvrId    : body.dvr_id,
		};
	} catch (e) {
		console.log('removeReservation(): Invalid body. ' + JSON.stringify(e));
		return res.status(400).json({
			errorCode: 'E024',
			errorMsg:  'Invalid body.',
			body: postParam,
		});
	}
	console.log(postParam);

	var args = JSON.parse(JSON.stringify(defaultArgs));
	args.parameters = postParam;
	
	// CHAN-TORU へのリクエスト実行
	rest.postPromise(restEndpoint.resv, args)
	.then((val) => {
		console.log('removeReservation(): then');
		var data = val.data;
		
		val.response.readable = true;
		var statusCode = val.response.statusCode;

		if (statusCode === 200) { // 200で返ってきたらこちらも200で返す
			/*
			[成功時]
				<?xml version="1.0" encoding="utf-8" ?>
				<Result responseCode="0" responseMsg="削除しました"/>
			*/
			console.log('removeReservation(): success.');
			return res.status(200).json();
		} else {                  // 200以外で返ってきたら500で返す
			/*
			[失敗時]
				"responseCode": "803",
				"responseMsg": "録画できない放送局を指定したか、既に終了した番組のため、予約に失敗しました",
				"isListCapability": "true",
				"dateTime": "2020-02-07T02:34:00+09:00",
				"dateTime1970": "1581010440000",
				"sid": "104",
				"duration": "1200000"
			*/
			console.log('removeReservation(): failed.');
			return res.status(500).json();
		}
	})
	.catch((error) => { // thenで例外発生時
		console.error('removeReservation(): catch');
		console.error(error);
		return res.status(500).json({
			errorCode: 'E025',
			errorMsg:  'System error.'
		});
	});
}
	
/* 
 * 6. 番組表取得API
 * @description
 *   PostgreSQLのprogramsテーブルを取得
 * @param
 *   from:    '2020-01-02T05:00:00'  start_dateがちょうどを含む
 *   to:      '2020-01-09T05:00:00'  start_dateがちょうどを含まない
 *   genreId: '107100'
 *   exclusive: 'true'
 * @todo
 * 	 パラメータのチェック
 *   DBクライアントのオブジェクトの再利用
 */
app.get(expressEndpoint.search, function(req, res){
	console.log('API06: access to '+ expressEndpoint.search);

	let db = new dbClient(dbConf); 
	db.connect();

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
		if (query.exclusive === 'true') {
			sql = {
				text:  'SELECT * FROM programs WHERE start_date >= $1 AND start_date < $2 AND genre_ids = $3 ' + 
						'ORDER BY start_date, service_id;',
				values:[query.from, query.to, query.genreId]
			};	
		} else {
			sql = {
				text:  'SELECT * FROM programs WHERE start_date >= $1 AND start_date < $2 AND genre_ids LIKE $3 ' + 
						'ORDER BY start_date, service_id;',
				values:[query.from, query.to, '%' + query.genreId + '%']
			};
		}
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

/* 
 * CHAN-TORUの認証確認用の関数
 */
function isAuthenticated() {
	console.log('checkAuthenticated()');
	
	var args = JSON.parse(JSON.stringify(defaultArgs));
	args.parameters = {op: 'current', resp: 'json', category: '1'};
	return new Promise((resolve, reject) => {
		rest.postPromise(restEndpoint.tvsearch, args)
		.then((val) => {
			JSON.parse(val.data.toString('utf8')); // jsonでパースできたら認証OKと判断
			resolve();
		})
		.catch((err) => {
			reject();
		});
	});
}


isAuthenticated()
.then((val) => {
	var server = app.listen(serverPort, () => {
		//var addr = this.address();
		console.log('Node.js is listening to localhost:' + serverPort);
	});
})
.catch((err) => {
	console.error('Error: Authentication failed. Please check ' + headerPath);
});
