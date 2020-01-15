var Client = require('node-rest-client-promise').Client;
var Express = require('express');
//var op = require('./op_programs.js').channels;

var CHANTORU_ENDPOINT = 'https://tv.so-net.ne.jp/chan-toru';
var HEADER_PATH = './headers.json';
var SERVER_PORT = 3001;
var OWN_ENDPOINT = {
    tvsearch: '/api/tvsearch/',
    resv: '/api/resv/'
};
var TIMEOUT = 5000; // 5 sec

var client = new Client();
var app = Express();
var url  = {
    tvsearch : CHANTORU_ENDPOINT + '/tvsearch',
    resv : CHANTORU_ENDPOINT + '/resv',
};


var getChannels = function (json) {
    
    channels = {};
    json.header.index.forEach( function(element) {
        var split = element.split(':');
        channels[split[0]] = split[1];
    });
    return channels;
};


app.get(OWN_ENDPOINT.tvsearch, function(req, res){
    console.log('access.');

    var date = new Date();
    var args = {
        headers: require(HEADER_PATH),
        parameters: {
            op: 'bytime',   // bytime/current
            span: '3',      // 不明
            category: '1',  // 1: 地上デシタル、2: BS
            start: date.getTime() // 当日5:00～明日5:00まで、終わっている分は除く
        },
        // 以下効いていない？
        requestConfig: {
            timeout: TIMEOUT
        },
        responseConfig: {
            timeout: TIMEOUT
        }
    };

    client.getPromise(url.tvsearch, args).then(
        function (val) {
            var json = JSON.parse(val.data.toString('utf8'));
            //console.log(val.response);
            //debugger;
            res.json(json);
            
            //console.log(val.data);
        }
    ).catch(
        function (error) {
            //console.error(error);
            res.send('<h3>Error.</h3>');
        }
    );
});




/* listen()メソッドを実行して3000番ポートで待ち受け*/
var server = app.listen(SERVER_PORT, function () {
    console.log("Node.js is listening to PORT:" + server.address().port);
});


