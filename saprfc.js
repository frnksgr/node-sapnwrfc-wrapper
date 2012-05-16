// Wrapp sapnwrfc module in order to make the API
// a bit more node like.
// It basically adds a fifo queue to the rfc.Invoke calls.

var sapnwrfc = require("sapnwrfc");
var aq = require("async-queue");

module.exports = rfc;

// patch async-queue

aq.prototype.urgent = function(job) {
    this.jobs.unshift(job);
    this.run();
}


function rfc(system) {
    // setting some defaults
    system = system || {};
    system.ashost = system.ashost || "localhost";
    system.sysnr = system.sysnr || "00";
    system.client = system.client || "100";
    system.lang = system.lang || "EN";
    system.user = system.user || "anzeiger";
    system.passwd = system.passwd || "display";
    return new RFC(system);
};


function RFC(system) {
    this.system = system;
    this.con = new sapnwrfc.Connection()
    this._jobQueue = new aq();
    this._isOpen = false;
};


RFC.prototype.open = function(cb) {
    var self = this
    this.con.Open(this.system, function(err) {
	self._isOpen = !err;
	cb(err);
    });
};


RFC.prototype.isOpen = function() {
    return this._isOpen;
};


RFC.prototype.lookup = function(fname) {
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


RFC.prototype.close = function(force) {
    if (!this._isOpen) return;
    if (!!force) {
	this._jobQueue.urgent(function(err, job) {
	    // NOTE: an already invoked RFC call
	    // hangs if we close the connection.
	    this.con.Close();
	    this._isOpen = false;
	    if (err) {
		job.fail(err);
	    } else {
		job.success();
	    }
	});
    } else {
	var self = this;	
	self._jobQueue.run(function(err, job) {
	    if (err) {
		job.fail(err);
	    } 
	    if (self._isOpen) {
		self.con.Close();
		self._isOpen = false;
	    }
	    job.success();
	});
    }
};


RFC.prototype.ping = function(cb) {
    var ping = this.lookup("RFC_PING");
    ping(cb);
};

