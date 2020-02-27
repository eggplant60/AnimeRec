
const dateformat = require('dateformat');

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
	//console.debug(value);
	//console.debug(casted);
	if (!isNaN(casted.getTime())) {
		return casted;
	} else {
		throw 'Invalid query, type=date';
	}
};


var checkReqParamDateJst = function (defaultValue, value) {
	return date2Jst(checkReqParamDate(defaultValue, value));
};

var date2YYYYmmddhhss = function (date) {
	return dateformat(date, 'yyyymmddHHMMss');
};

var date2Jst = function (date) {
	return dateformat(date, 'yyyy-mm-dd"T"HH:MM:ss+09:00');
};

module.exports = {
	checkReqParamCand,
	checkReqParamNumber,
	checkReqParamDateJst,
	date2Jst,
};