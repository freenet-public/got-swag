# Got Swag?

A tool to test Swagger-powered APIs automatically through monkey testing.
Also allows for custom tests written directly in Swagger files
or in separate test suites.
Includes command-line and programmatic interfaces.
Install via `npm install got-swag -g`.

## Usage

```
got-swag <url> ... [-m] [-t <ms>] [-T] [-v] [-w]
  Test a Swagger URL or file (YAML). Additional files are merged.

Options:
  -m, --monkey        Run monkey tests on GET endpoints
  -l, --monkey-limit  Maximum number of parameter combinations for each
                      monkey GET, default is 50
  -t, --timeout <ms>  Set a timeout (in milliseconds) for test step execution,
                      default is 2000 ms
  -T, --trace         Trace: Log requests and responses
  -V, --version       Show version
  -w, --watch         Watch the Swagger files and rerun tests on changes
```

Most Mocha options are valid. See https://mochajs.org/#usage for details.


## Monkey Testing

The most basic usage of `got-swag` is monkey testing:
Each GET endpoint of a service is validated using minimal variable
input, if any, and the definitions from the services' Swagger file.
The endpoints are requested with random authentication/variable combinations
until one combination leads to a response status code less than 400.

Just invoke got-swag on a URL with the `-m` switch:

```
got-swag http://petstore.swagger.io/v2/swagger.json -m
```

See [monkeystore.yaml](examples/monkeystore.yaml) for an example of input variables.


## Custom Tests

Additionally, `got-swag` allows to embed custom tests in Swagger files
or separate test suites.
The test steps are written in JS using a small domain-specific language.
Every step is evaluated, even if a previous step failed.

For example, see [petstore.yaml](examples/petstore.yaml) (embedded) and
[yoda.yaml](examples/yoda.yaml) (separate).


## Test Syntax Reference

### [Assertions](https://nodejs.org/api/assert.html)

- `ok( actual )`
- `equal( actual, expected )`
- `notEqual( actual, expected )`
- `deepEqual( actual, expected )`
- `notDeepEqual( actual, expected )`
- `strictEqual( actual, expected )`
- `notStrictEqual( actual, expected )`
- `deepStrictEqual( actual, expected )`
- `notDeepStrictEqual( actual, expected )`
- `match( actualString, expectedPattern )`

### Validation

- `validate( data, schema )`
  - Validate JSON data against a [JSON schema](http://json-schema.org/)
  - If `data` or `schema` are omitted (strictly equal to `undefined`),
    the last response is validated against the current operation's response schema

### Requests

- `request( options )`
  - Requests the current endpoint
  - `options` is optional, see [http](https://nodejs.org/api/http.html)
  - `options.data` sets the request body
- Shortcuts:
  - `get( url, headers )`
  - `post( url, data, headers )`
  - `put( url, data, headers )`
  - `delete( url, headers )`
  - `options( url, headers )`
  - `head( url, headers )`
  - Use `null` for `url` to request the current endpoint
  - `headers` are optional

### Authentication

- `auth( securityDefinitionId, credentials, scopes )`
  - Authenticates against a security definition
  - `scopes` are optional and inferred from the API if possible

### Utility

- `encodeURIComponent( s )` encodes a string for URI transmission
- `log( value )` logs a value
- `monkeyAuth()` tries to authenticate using known method/credentials
- `monkeyGet()` tries to GET using known parameters

### Variables

- `vars`: Variables reusable for all tests
  - You can write to `vars` in test steps, see example
- `req`: Last request data
- `res`: Last response data
  - `res.statusCode`: Integer response status code
  - `res.headers`: Response headers
  - `res.body`: String response body
  - `res.json`: Parsed JSON response, if any
- `api`: Complete Swagger API

### Extension Syntax

You can define extension Swagger files on top of existing Swagger files
using the `'#/path': value` syntax.
For reference, see [extended-petstore.yaml](examples/extended-petstore.yaml).


## Programmatic Usage

```js
var gotSwag = require( 'got-swag' );

// test api and report as JSON
gotSwag.test( 'swag.yaml', 'vars.yaml' ).then( function ( report ) {
  console.log( report );
} );

// describe mocha tests in current suite
describe( 'My test suite', function () {
  gotSwag.describe( 'swag.yaml', 'vars.yaml', { parent: this } );
} );
```


## Notes

- Currently, `got-swag` only supports JSON
- The DSL is sandboxed using [vm](https://nodejs.org/api/vm.html)
- If you see something like
  `.../node_modules/got-swag/lib/validate.js:24 throw new Error( result.errors );`
  in your console, it's a [Node.js Bug](https://github.com/nodejs/node/issues/7397)
