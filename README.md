# Wrapper for sapnwrfc module

## Description

This module just wraps the [sapnwrfc]
(https://github.com/jdorner/node-sapnwrfc) module.
It basically adds serialization to *function.Invoke*

## Example

```js

var rfc = require("sapnwrfcw");
var con rfc({
  ashost: '192.168.0.10',
  sysid: 'NPL',
  sysnr: '42',
  user: 'DEVELOPER',
  passwd: 'password',
  client: '001',
  lang: 'E'});

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
    // second call (queued)
    systemInfo({}, cb);
    // (queued)
    con.close();
});


```
