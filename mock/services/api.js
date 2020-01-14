(function () {
  'use strict';

  angular.module('app')
      .service('ApiService', ['$log', '$resource', ApiService]);

  function ApiService($log, $resource) {

    var date = new Date(); // 現在時刻

    $log.debug(date.getTime());
    $log.debug(date.toJSON());

    var _baseUrl = 'https://tv.so-net.ne.jp/chan-toru';
    var _url  = {
      tvsearch : _baseUrl + '/tvsearch',
      resv : _baseUrl + '/resv',
    }
    var _paramDefaults = {
      tvsearch : {
        op: 'bytime',
        span: '26',
        category: '1',
        start: date.getTime()
      },
      resv : {
        op: 'add', 
        sid: 0, 
        eid: 0, 
        category: 1, 
        date: date.toJSON(),
        duration: 0,
        title: '',
        quality: 230,
        condition: 'w1',
        destination: 'HDD'
      }
    }

    var tvsearch = $resource(
      _url.tvsearch, 
      _paramDefaults.tvsearch,
      {
        bytime: {method: 'POST'}
      }
    );
    
    return {
      'tvsearch': tvsearch,
    };

  }
})();
