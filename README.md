# Got Swag?

A tool to test Swagger-powered APIs automatically through monkey testing.
Includes command-line, web-based and programmatic interfaces.
Install via `npm install got-swag -g`.


## Usage

```
got-swag <url> ...
  Test a Swagger URL or file (YAML). Additional files are merged.

got-swag serve [<port>]
  Start a web service

Options:
  -S
  -V, --version       Show version
```


## Monkey Testing

The most basic usage of `got-swag` is monkey testing:
Each endpoint of a service is validated using minimal variable
input, if any, and the definitions from the services' Swagger file.
Endpoints are requested in a round-robin fashion,
with random authentication/variable combinations.
Request/response pairs are recorded and response data is fed back into more
requests until finish criteria are met.

```sh
$ got-swag http://petstore.swagger.io/v2/swagger.json
```

See [examples/petstore-vars.yaml](examples/petstore-vars.yaml) for an example of input variables.
