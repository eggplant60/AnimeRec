const Client = require('node-rest-client').Client;
const dateformat = require('dateformat');
const fs = require('fs');

const chantoruEndpoint = 'https://tv.so-net.ne.jp/chan-toru';
const url = chantoruEndpoint + '/tvsearch';
const headerPath = '../conf/chan_toru.json';
const timeout = 10000; // 10 sec
const jsonPath = './json/';

const client = new Client();

var date2YYYYmmddhhss = function (date) {
	return dateformat(date, 'yyyymmddHHMMss');
};

var date2YYYYmmdd = function (date) {
	return dateformat(date, 'yyyymmdd');
};

const now = new Date();
let baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 5, 0, 0);

//console.log(now);
//console.log(baseDate);

// 番組表取得
function getProgramsFromToday(delta) {
	
	let startDate = new Date(baseDate.getTime());
	startDate.setDate(startDate.getDate() + delta);
	let startQuery = date2YYYYmmddhhss(startDate);
	console.log(startQuery + ': start');
	
	let param = {};
	param = {
		op       : 'bytime',
		span     : '24',
		category : '1',
		start    : startQuery,
	};

	let args = {
		headers: require(headerPath),
		parameters: param,
		// 以下効いていない？
		requestConfig: {
			timeout: timeout
		},
		responseConfig: {
			timeout: timeout
		}
	};

	// CHAN-TORU へのリクエスト実行
	return new Promise((resolve, reject) => {	
		client.get(url, args, (data, resopnse) => { // なんらかのレスポンスがあった
			
			//response.readable = true; // レスポンスを読み取るために必要
			let strVal = data.toString('utf8');
			let obj = JSON.parse(strVal);

			if (obj.list.length > 0) {
				let parsed = JSON.stringify(obj, null, 4);
				let fileName = jsonPath + date2YYYYmmdd(startDate) + '.json';
				fs.writeFile(fileName, parsed, (err, data) => {
					if (err) {
						console.err(startQuery + ': ' + err);
					} else {
						console.log(startQuery + ': finish, write');
					} 
				});
			} else {
				console.log(startQuery + ': finish, no data');
			}
			resolve(delta + 1);
		});
	});
}

getProgramsFromToday(1)
	.then(getProgramsFromToday) // 2
	.then(getProgramsFromToday) // 3
	.then(getProgramsFromToday) // 4
	.then(getProgramsFromToday) // 5
	.then(getProgramsFromToday) // 6
	.then(getProgramsFromToday);// 7
