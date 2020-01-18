var dateformat = require('dateformat');

//var unixTime = Date(); // string
//var unixTime = new Date(); // object
//var unixTime = new Date(2020, 1, 18, 22, 0); // object

var unixTime = Date.now(); // number
console.log(unixTime);
console.log(typeof unixTime);
console.log(Object.keys(unixTime));

console.log();

var strTime = new Date(unixTime).toJSON();
console.log(strTime); // 2020-01-18T13:47:51.934Z
console.log(typeof strTime); // string

console.log();

var again = new Date(strTime).getTime();
console.log(again); // 1579355767723


console.log();
var failed = new Date('aaa');
console.log(failed);
console.log(typeof failed);
console.log(isNaN(failed));

console.log();
var jst = dateformat(new Date(unixTime), 'yyyy-mm-dd"T"HH:MM:ss+09:00');
console.log(jst);