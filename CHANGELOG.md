# Changelog

## v2.0.0-beta

- Complete rewrite
- Drop custom tests
- Improve monkey tests
- Use custom, request-oriented reports
- Add HTML reports

## v1.2.0

- Fix #12, `validate` now works without operation context
- Use `res.statusCode` consistently
  - `res.status` still works
- Fix #9, `host` is rewritten to `hostname` consistently
- Fix #14, parse and use Mocha command-line options, e.g. `reporter`, `slow`, ...
- Fix `log`, logged data should not show up in report
- Tracing now dumps request/response/error triples for each request
- Monkey tests only dump the last request
  - Fix #13
  - More data may be dumped with the `--trace` option
- Monkey tests are now default limited to 50 candidates per endpoint
  - Limit is configurable with `-l <n>` or `--monkey-limit <n>`

## v1.1.4

- Add `x-monkey-ignore`

## v1.1.3

- Fix recursive example var parsing

## v1.1.2

- Fix passing `"null"` (string) parameters
