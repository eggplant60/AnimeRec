var jsonData = require('./json/20200115_2311_span3.json');

//debugger;


var getChannels = function (jsonData) {
    channels = {};
    jsonData.header.index.forEach( function(element) {
        var split = element.split(':');
        channels[split[0]] = split[1];
    });
    return channels;
};

var getChannelPrograms = function (jsonData, channelId) {
    return jsonData.list.filter(element => element.serviceId == channelId);
};



var channels = getChannels(jsonData);
console.log(channels);
var channelId = Object.keys(channels)[3];
//console.log(typeof(channelId));
var programs = getChannelPrograms(jsonData, channelId);
//console.log(programs);

programs.forEach( function(element) {
    console.log(element.descriptionStr);
});
