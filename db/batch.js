const {Pool, Client} = require('pg');
const dbConf = require('../conf/db.json');

console.log(dbConf);

const client = new Client(dbConf); 

client.connect();

client.query('SELECT NOW()', (err, res) => {
	console.log(err, res);
	client.end();
});


console.log('Complete.');