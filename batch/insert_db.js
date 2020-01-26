const {Pool, Client} = require('pg');
const format = require('pg-format');
const dbConf = require('../conf/db.json');
//console.log(dbConf);

const sourceData = require('./json/20200127.json').list;

let insertValues = sourceData.map((item) => {
	const now = new Date();
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
	];
});
	
let query = format('INSERT INTO programs VALUES %L', insertValues);

const client = new Client(dbConf); 
client.connect();

client.query(query, (err, res) => {
	if (!err) {
	console.log(res);
	} else {
	console.error(err);
	}
	client.end();
});

console.log('Complete.');

