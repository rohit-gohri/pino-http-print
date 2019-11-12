const chalk = require('chalk')
const parse = require('ndjson').parse
const through = require('through2').obj
const prettyFactory = require('pino-pretty')

/**
 * @typedef {Object} HttpPrintOptions
 * @property {boolean} [all] support all log messages, not just HTTP logs
 * @property {boolean} [colorize] colorize logs, default is automatically set by chalk.supportsColor
 */

/** @type {HttpPrintOptions} */
const defaultOptions = {
  colorize: chalk.supportsColor,
  all: false 
}

const ctx = new chalk.Instance({ enabled: true, level: 3 })
const colored = {
  default: ctx.white,
  60: ctx.bgRed,
  50: ctx.red,
  40: ctx.yellow,
  30: ctx.green,
  20: ctx.blue,
  10: ctx.grey,
  url: ctx.cyan
};

function format(o, colorize) {
  var time = new Date(o.time).toISOString().split('T')[1].split('.')[0]

  if (!colorize) {
    return time + ' ' + o.req.method + ' http://' + o.req.headers.host +
      o.req.url + ' ' + o.res.statusCode + '\n'
  }

  const levelColor = colored[o.level] || colored.default;
  return colored.default(time) + ' ' + colored.url(o.req.method) + ' http://' + o.req.headers.host +
    o.req.url + ' ' + levelColor(o.res.statusCode) + '\n'
}

/**
 * @param {HttpPrintOptions} [options]
 * @param {Object} [prettyOptions] options to forward to `pino-pretty` when `all` option is set
 */
module.exports = function httpPrintFactory (options, prettyOptions) {
  const opts = Object.assign({}, defaultOptions, options)
  const prettyPrinter = prettyFactory(prettyOptions)

  /**
   * @param {any} [stream] A writeable stream, if not passed then process.stdout is used
   */
  return function (stream) {
    var printer = parse()
    var transform = through(function (o, _, cb) {
      if (!o.req || !o.res) {
        if (opts.all === true) {
          // Pass non-http log message through to pino-pretty
          cb(null, prettyPrinter(o))
        } else {
          cb(null, null)
        }
      } else {
        var log = format(o, opts.colorize);

        cb(null, log)
      }
    })
    printer.pipe(transform).pipe(stream || process.stdout)

    return printer
  }
}
