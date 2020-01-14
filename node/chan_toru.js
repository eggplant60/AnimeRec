//var Client = require('node-rest-client').Client;
var Client = require('node-rest-client-promise').Client;
var Express = require('express');

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



app.get(OWN_ENDPOINT.tvsearch, function(req, res){
    console.log('access.');

    var date = new Date();
    var args = {
        headers: require(HEADER_PATH),
        parameters: {
            op: 'bytime',
            span: '26',
            category: '1',
            start: date.getTime()
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
            //console.log(val.response);
            res.json(JSON.parse(val.data.toString('utf8')));
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
