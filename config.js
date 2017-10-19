var CIP = require('./getCIP.js');

var UPORT = '12345';
var SPORT = '54321';

var SIP = '192.168.3.11'
// var SIP = '10.1.199.128'

module.exports = {
	UIP: CIP + ':' + UPORT,
	UPORT: UPORT,
	SIP: SIP + ':' + SPORT,
	SPORT: SPORT

};
