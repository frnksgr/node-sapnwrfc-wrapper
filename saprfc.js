// Wrapp sapnwrfc module in order to make the API
// a bit more node like.
// It basically adds a fifo queue to the rfc.Invoke calls.

var sapnwrfc = require("sapnwrfc");
var async = require("async");

var util = require("util");

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
    return new Connection(options);
};


function Connection(options) {
    this.options = options;
    this.con = new sapnwrfc.Connection()
    this._isOpen = false;
    this._queue = async.queue(function(task, cb) {
	task(cb);	
    }, 1);
};


Connection.prototype.open = function(cb) {
    var self = this;
    this.con.Open(this.options, function(err) {
	self._isOpen = !err;
	if (!!cb) return cb(err);
    });
};


Connection.prototype.isOpen = function() {
    return this._isOpen;
};


Connection.prototype.lookup = function(fname) {
    var self = this;
    try {
	var asyncRfc = this.con.Lookup(fname);
	return function(parameter, cb) {
	    // make parameter optional
	    if (typeof cb === 'undefined') {
		cb = parameter;
		parameter = {};
	    }
	    // on call add task to queue
	    self._queue.push(function(done) {
		return asyncRfc.Invoke(parameter, function(err, data) {
		    cb(err, data);
		    done();
		});
	    });
	}
    } catch (err) {
	throw err;
    }  
};


Connection.prototype.close = function(cb) {
    if (!this._isOpen) return;
    var self = this;
    self._queue.push(function(done) {
	if (self._isOpen) {
	    self.con.Close();
	    self._isOpen = false;
	}
	if (cb) cb();
	done();
    });
};

Connection.prototype.ping = function(cb) {
    var ping = this.lookup("RFC_PING");
    ping(cb);
};

