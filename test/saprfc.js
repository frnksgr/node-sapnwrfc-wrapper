var rfc = require("../");
var _ = require("underscore");
var should = require("should");
var system;

debugger;

try {
    system = require("./systems.js").default
} catch (e) {
    // swallow
}

describe("sapnwrfcw", function() {

    var con = rfc(system);

    before(function(done) {
	con.open(done);
    });

    after(function() {
	con.close();
    }); 

    describe("saprfc()", function() {
	it("should set some defaults", function() {
	    rfc().should.have.property("options");
	    var options = rfc().options;
	    options.should.have.property("ashost");
	    options.should.have.property("sysnr");
	    options.should.have.property("client");
	    options.should.have.property("lang");
	    options.should.have.property("user");
	    options.should.have.property("passwd");
	});
    });

    describe("#open()", function() {
	var con;

	it("should fail on wrong data", function(done) {
	    var noSystem = _.clone(system);
	    noSystem.user = "foo";
	    noSystem.passwd = "bar";
	    con = rfc(noSystem);
	    con.open(function(err) {
		should.exist(err);
		done();
	    });
	});

	it("should connect on correct data", function(done) {
	    con = rfc(system);
	    (function(){
		con.open(done);
	    }).should.not.throw();
	});
	
	it("should be open after #open()", function() {
	    con.isOpen().should.be.true;
	});

	describe("#close()", function() {
	    it("should close the connection", function(done) {
		con.close(function() {
		    con.isOpen().should.be.false;
		    done();
		});
	    });

	    it("should wait for pending calls", function(done) {
		con.open(function(err) {
		    if (err) done(err);
		    for (var count = 0, success = 0; count < 3; ++count) {
			con.ping(function(err, result) {
			    if (!err) ++success;
			});
		    }
		    con.close(function() {
			success.should.equal(3);
			done();
		    });		    
		});
	    });

	});
    });

    describe("#lookup()", function() {
	it("should fail on wrong func name", function() {
	    (function() {
		con.lookup("FOO");
	    }).should.throw();
	});

	it("should return wrapped function", function() {
	    con.lookup("RFC_PING").should.be.a("function");
	});

	it("parameters should be optional", function(done) {
	    var ping = con.lookup("RFC_PING");
	    (function() {
		ping(done);
	    }).should.not.throw();
	});
    });

    describe("#ping()", function() {
	it("should not fail", function(done) {
	    con.ping(done);
	});
    });

});
