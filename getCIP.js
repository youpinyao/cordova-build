var os = require('os');


var CIP = null;

var network = os.networkInterfaces();

if (os.platform() == 'win32') {
	for (var n in network) {
		var item = network[n];

		for (var i = 0; i < item.length; i++) {
			var json = item[i];
			if (json.family == 'IPv4' && json.address != '127.0.0.1') {
				CIP = json.address;
			}
		}
	}
} else {
  var en = network.en0 || network.en1;
	for (var i = 0; i < en.length; i++) {
		var json = en[i];
		if (json.family == 'IPv4' && json.address != '127.0.0.1') {
			CIP = json.address;
		}
	}
}


module.exports = CIP;
