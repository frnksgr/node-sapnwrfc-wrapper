var system = require("./test/systems.js").default;
var rfc = require("./");
var con = rfc(system);

con.open(function(err) {
    if (err) {
	console.log(err);
	return;
    }

    var systemInfo = con.lookup("RFC_SYSTEM_INFO");
    function cb(err, result) {
	if (err) {
	    console.log(err);
	    return;
	}
	console.log(result);
    }

    // first call
    systemInfo({}, cb);
    // second call queued
    systemInfo({}, cb);
    // queued
    con.close();
});
