const {Pool, Client} = require('pg');
const format = require('pg-format');
const dbConf = require('../conf/db.json');
const fs = require('fs');
//console.log(dbConf);

// 元データ一覧を得る
const sourceDir = './json/';
let sources = fs.readdirSync(sourceDir);
sources = sources.filter((s) => /^[0-9]+\.json$/.test(s));
sources = sources.map((s) => sourceDir + s);
//console.log(sources);

// DB接続
const client = new Client(dbConf); 
client.connect();

// JSONごとにループ
Promise.all(sources.map(sendQuery))
	//sources.map(execute))
.then( (ret) => {
	
	console.log('success!');
	client.end();
})
.catch( (err) => {
	console.error('failed!');
	console.error(err);
	client.end();
});


function sendQuery(path) {
	console.log(path);
	let sourceData = require(path).list;
	const now = new Date();

	// クエリ生成
	let insertValues = sourceData.map((item) => {
		return [
		item.programId,
		now,
		now,
		item.startDate,
		item.endDate,
		item.duration,
		new Date(item.startDate),
		new Date(item.endDate),
		item.serviceId,
		item.genreIds,
		item.areaId,
		item.category,
		item.descriptionStr,
		item.detailSet,
		item.detailStr,
		item.eventId,
		item.freeCaMode,
		item.linkStr,
		item.originalXml,
		item.summaryStr,
		item.titleStr,
		false,
		];
	});
		
	// @TODO: DO NOTHING => DO UPDATEへの変更
	let query = format(
		'INSERT INTO programs VALUES %L ' +
		'ON CONFLICT ON CONSTRAINT programs_pkey ' + 
		'DO NOTHING;',
		insertValues
	);

	// 番組-ジャンルの対応表生成
	insertValues = [];
	sourceData.forEach( element => {
		let genres = element.genreIds.trim().split(' ');
		genres.forEach( jlement => {
			insertValues.push([
				element.programId, 
				jlement,
				now,
				now,
			]);
		});
	});

	query += format(
		'INSERT INTO program_genres VALUES %L ' +
		'ON CONFLICT ON CONSTRAINT program_genres_pkey ' + 
		'DO NOTHING;',
		insertValues
	);

	// SQL送信
	return new Promise((resolve, reject) => {
		client.query(query, (err, res) => {
			if (!err) {
				//console.log(res);
				resolve(res);
			} else {
				reject(err);
				//console.error(err);
			}
		});	
	});

}
