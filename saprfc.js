// Wrapp sapnwrfc module in order to make the API
// a bit more node like.
// It basically adds a fifo queue to the rfc.Invoke calls.

var sapnwrfc = require("sapnwrfc");
var queue = require ("async-queue");

module.exports = rfc;

function rfc(options) {
    // setting some defaults
    options = options || {};
    options.ashost = options.ashost || "localhost";
    options.sysnr = options.sysnr || "00";
    options.client = options.client || "100";
    options.lang = options.lang || "EN";
    options.user = options.user || "anzeiger";
    options.passwd = options.passwd || "display";
    return new RFC(options);
};


function RFC(options) {
    this.options = options;
    this.con = new sapnwrfc.Connection()
    this._q = new queue();
    this._isOpen = false;
};


RFC.prototype.open = function(cb) {
    var self = this
    this.con.Open(this.options, function(err) {
	self._isOpen = !err;
	cb(err);
    });
};


RFC.prototype.close = function() {
    if (!this._isOpen) return;
    // close connection
    try {
	this.con.Close();
    } catch (e) {/*swallow*/}
    this._q = new queue();
    this._isOpen = false;
};


RFC.prototype.isOpen = function() {
    return this._isOpen;
};


RFC.prototype.lookup = function(fname) {
    var self = this;
    function wrap(f) {
	return function(parameter, cb) {
	    self._q.run(function(err, job) {
		f.Invoke(parameter, function(err, result) {
		    err ? job.fail() : job.success();
		    cb(err, result);
		});
	    });
	}
    }

    try {
	var f = this.con.Lookup(fname)
	return wrap(f);
    } catch (err) {
	throw err;
    }    
};


RFC.prototype.ping = function(cb) {
    var ping = this.lookup("RFC_PING");
    ping({}, cb);
};

