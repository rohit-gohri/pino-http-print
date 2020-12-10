const chalk = require('chalk')
const parse = require('ndjson').parse
const through = require('through2').obj
const prettyFactory = require('pino-pretty')
const { prettifyTime, prettifyObject } = require('pino-pretty/lib/utils')
const prettyMs = require('pretty-ms')

/**
 * @typedef {Object} HttpPrintOptions
 * @property {boolean} [all] support all log messages, not just HTTP logs
 * @property {boolean} [colorize] colorize logs, default is automatically set by chalk.supportsColor
 * @property {boolean|string} [translateTime] (default: false) When `true` the timestamp will be prettified into a string,
 *  When false the epoch time will be printed, other valid options are same as for `pino-pretty`
 * @property {boolean} [relativeUrl] (default: false)
 * @property {boolean} [lax] (default: false) When `true` the JSON parser will silently discard unparseable logs, e.g.
 * from nodemon
 * @property {boolean} [extra] (default: false) When `true` the any other extra fields in the logs will be printed as is
 */

/** @type {HttpPrintOptions} */
const defaultOptions = {
  colorize: chalk.supportsColor,
  translateTime: false,
  relativeUrl: false,
  all: false,
  lax: false,
  extra: false,
}

const ctx = new chalk.Instance({ level: 3 })
const colored = {
  default: ctx.white,
  60: ctx.bgRed,
  50: ctx.red,
  40: ctx.yellow,
  30: ctx.green,
  20: ctx.blue,
  10: ctx.grey,
  method: ctx.cyan
}

/**
 * @param {any} o
 * @param {HttpPrintOptions} opts
 */
function format (o, opts) {
  var time = prettifyTime({ log: o, translateFormat: opts.translateTime })
  var url = (opts.relativeUrl ? '' : ('http://' + o.req.headers.host)) + o.req.url
  var responseTime = prettyMs(o.responseTime)
  var extraFields = opts.extra ? prettifyObject({
    input: o,
    eol: ' ',
    skipKeys: ['req', 'res'],
  }) : '';

  if (!opts.colorize) {
    return time + ' ' + o.req.method + ' ' + url + ' ' + o.res.statusCode + ' ' + responseTime + ' ' + extraFields + '\n'
  }

  const levelColor = colored[o.level] || colored.default
  return time + ' ' + colored.method(o.req.method) + ' ' +
    url + ' ' + levelColor(o.res.statusCode) + ' ' + responseTime + ' ' + extraFields + '\n'
}

/**
 * @param {HttpPrintOptions} [options]
 * @param {Object} [prettyOptions] options to forward to `pino-pretty` when `all` option is set
 */
module.exports = function httpPrintFactory (options, prettyOptions) {
  const opts = Object.assign({}, defaultOptions, options)
  const prettyPrinter = prettyFactory(Object.assign({}, {
    colorize: opts.colorize,
    translateTime: opts.translateTime
  }, prettyOptions))

  /**
   * @param {any} [stream] A writeable stream, if not passed then process.stdout is used
   */
  return function (stream) {
    var printer = parse({ strict: !opts.lax })
    var transform = through(function (o, _, cb) {
      if (!o.req || !o.res) {
        if (opts.all === true) {
          // Pass non-http log message through to pino-pretty
          cb(null, prettyPrinter(o))
        } else {
          cb(null, null)
        }
      } else {
        var log = format(o, opts)

        cb(null, log)
      }
    })
    printer.pipe(transform).pipe(stream || process.stdout)

    return printer
  }
}
