var assert = require( 'assert' );
var jsonschema = require( 'jsonschema' );

module.exports = validate;

function validate( options ) {

  var data = options.data;
  var res = options.res;
  var operation = options.operation;
  var schema = options.schema;

  if ( data === undefined ) {
    if ( !res ) throw new Error( 'Cannot infer data without response' );
    data = res.json;
  }

  if ( schema === undefined ) {

    if ( !res ) throw new Error( 'Cannot infer schema without response' );
    if ( !operation ) throw new Error( 'Cannot infer schema without operation' );
    if ( !operation.responses ) throw new Error( 'Cannot infer schema without response definitions' );

    var response = operation.responses[ res.statusCode ] || operation.responses[ 'default' ];
    if ( !response ) throw new Error( 'Unexpected response status ' + res.statusCode );

    schema = response.schema;
    if ( !schema ) return assert.equal( res.body, '', 'Body should be empty' );

  }

  if ( !data || typeof data !== 'object' ) throw new Error( 'Invalid data' );
  if ( !schema || typeof schema !== 'object' ) throw new Error( 'Invalid schema' );

  result = jsonschema.validate( data, schema );

  if ( !result.valid ) throw new Error( result.errors );

}
