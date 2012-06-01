// Wrapp sapnwrfc module in order to make the API
// a bit more node like.
// It basically adds a fifo queue to the rfc.Invoke calls.

var sapnwrfc = require("sapnwrfc");
var aq = require("async-queue");

var events = require("events");
var util = require("util");

module.exports = rfc;

// patch async-queue

aq.prototype.urgent = function(job) {
    this.jobs.unshift(job);
    this.run();
}


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
    events.EventEmitter.call(this);
    this.options = options;
    this.con = new sapnwrfc.Connection()
    this._jobQueue = new aq();
    this._isOpen = false;
};
util.inherits(Connection, events.EventEmitter);


Connection.prototype.open = function(cb) {
    var self = this
    this.con.Open(this.options, function(err) {
	self._isOpen = !err;
	self.emit("open", err);
	if (!!cb) cb(err);
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
	    // on call get queued
	    self._jobQueue.run(function(err, job) {
		if (err) {
		    cb(err);
		    job.fail(err);
		} else {
		    asyncRfc.Invoke(parameter, function(err, result) {
			cb(err, result);
			job.success();
		    });
		}
	    });
	}
    } catch (err) {
	throw err;
    }  
};


Connection.prototype.close = function(force) {
    if (!this._isOpen) return;

    var self = this;
    if (!!force) {
	this._jobQueue.urgent(function(err, job) {
	    // NOTE: an already invoked RFC call
	    // hangs if we close the connection.
	    self.con.Close();
	    self._isOpen = false;
	    if (err) {
		job.fail(err);
	    } else {
		job.success();
	    }
	    self.emit("close", err);
	});
    } else {
	self._jobQueue.run(function(err, job) {
	    if (err) {
		job.fail(err);
	    } 
	    if (self._isOpen) {
		self.con.Close();
		self._isOpen = false;
	    }
	    job.success();
	    self.emmit("close", err);
	});
    }
};


Connection.prototype.ping = function(cb) {
    var ping = this.lookup("RFC_PING");
    ping(cb);
};

