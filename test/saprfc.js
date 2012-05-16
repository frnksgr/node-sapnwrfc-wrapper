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
	    rfc().should.have.property("system");
	    var options = rfc().options;
	    system.should.have.property("ashost");
	    system.should.have.property("sysnr");
	    system.should.have.property("client");
	    system.should.have.property("lang");
	    system.should.have.property("user");
	    system.should.have.property("passwd");
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
	    it("should close the connection", function() {
		con.close();
		con.isOpen().should.be.false;
	    });

	    it("should wait for pending calls", function(done) {
		con.open(function(err) {
		    if (err) done(err);
		    var success = 0, failed = 0;
		    for (var count = 3; count > 0; --count) {
			con.ping(function(err, result) {
			    if (err) {
				++failed;
			    }
			    else {
				++success;
			    }
			    if (failed + success === 3) {
				failed.should.equal(0);
				done();
			    }
			});
		    }
		    con.close();		    
		});
	    });

	    it("should stop pending calls if forced", function(done) {
		con.open(function(err) {
		    if (err) done(err);
		    var success = 0, failed = 0;
		    for (var count = 3; count > 0; --count) {
			con.ping(function(err, result) {
			    if (err) {
				++failed;
			    }
			    else {
				++success;
			    }
			    if (failed + success === 3) {
				failed.should.equal(2);
				done();
			    }
			});
		    }
		    con.close(true);		    
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


    describe("sequential calls", function(done) {
	it("should work", function(done) {
	    for (var count = 3; count > 0; --count) {
		con.ping(done)
	    };
	});
    });

});
