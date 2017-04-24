# Changelog

## v1.1.5

- Fix #12, `validate` now works without operation context
- Use `res.statusCode` consistently
  - `res.status` still works
- Fix #9, `host` is rewritten to `hostname` consistently
- Fix #14, parse and use Mocha command-line options, e.g. `reporter`, `slow`, ...
- Fix `log`, logged data should not show up in report

## v1.1.4

- Add `x-monkey-ignore`

## v1.1.3

- Fix recursive example var parsing

## v1.1.2

- Fix passing `"null"` (string) parameters
