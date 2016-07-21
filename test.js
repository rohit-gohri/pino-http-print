var printer = require('./')
var through = require('through2')
var test = require('tap').test

var log = '{"pid":13961,"hostname":"MacBook-Pro-4","level":30,"time":1469122492244,"msg":"request completed","res":{"statusCode":200,"header":"HTTP/1.1 200 OK\\r\\ncontent-type: application/json; charset=utf-8\\r\\ncache-control: no-cache\\r\\nvary: accept-encoding\\r\\ncontent-encoding: gzip\\r\\ndate: Thu, 21 Jul 2016 17:34:52 GMT\\r\\nconnection: close\\r\\ntransfer-encoding: chunked\\r\\n\\r\\n"},"responseTime":17,"req":{"id":8,"method":"GET","url":"/api/activity/component","headers":{"host":"localhost:20000","connection":"keep-alive","cache-control":"max-age=0","accept":"application/json","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36","referer":"http://localhost:20000/","accept-encoding":"gzip, deflate, sdch","accept-language":"en-US,en;q=0.8,de;q=0.6","cookie":"_ga=GA1.1.204420087.1444842476"},"remoteAddress":"127.0.0.1","remotePort":61543},"v":1}\n'

test('outputs log message for req/res serialized pino log', function (assert) {
  var expected = '17:34:52 GET http://localhost:20000/api/activity/component 200\n'
  var p = printer(through(function (line) {
    assert.is(line.toString(), expected)
    assert.end()
  }))
  p.write(log)
})

test('logs to process.stdout by default', function (assert) {
  var expected = '17:34:52 GET http://localhost:20000/api/activity/component 200\n'
  var p = printer()
  var write = process.stdout.write
  process.stdout.write = function (chunk, enc, cb) {
    process.stdout.write = write
    assert.is(chunk.toString(), expected)
    assert.end()
  }
  p.write(log)
})
