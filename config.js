var CIP = require('./getCIP.js');

var UPORT = '12345';
var SPORT = '54321';

var SIP = '192.168.1.86'

module.exports = {
	UIP: CIP + ':' + UPORT,
	UPORT: UPORT,
	SIP: SIP + ':' + SPORT,
	SPORT: SPORT

};