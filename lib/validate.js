var assert = require( 'assert' );
var jsonschema = require( 'jsonschema' );

module.exports = validate;

function validate( data, schema, res, operation, sandbox ) {

  if ( data === undefined ) {
    if ( !res ) throw new Error( 'Cannot infer data without response' );
    data = res.json;
  }

  if ( schema === undefined ) {

    if ( !res ) throw new Error( 'Cannot infer schema without response' );
    if ( !operation ) throw new Error( 'Cannot infer schema without operation' );
    if ( !operation.responses ) throw new Error( 'Cannot infer schema without response definitions' );

    var response = operation.responses[ res.statusCode ] || operation.responses[ 'default' ];
    if ( !response ) {
      throw new Error( 'Unexpected response status ' + res.statusCode );
    }

    schema = response.schema;
    if ( !schema ) return assert.equal( res.body, '', 'Body should be empty' );

  }

  if ( !data || typeof data !== 'object' ) throw new Error( 'Invalid data' );
  if ( !schema || typeof schema !== 'object' ) throw new Error( 'Invalid schema' );

  result = jsonschema.validate( data, schema );

  if ( !result.valid ) throw new Error( result.errors );

  //store response and matching schema for later usage.
  // var schemaId = JSON.stringify(schema); // JSON.stringify as id function looks odd.
  // if(!sandbox.monkeyMemory[schemaId]) {
  //     sandbox.monkeyMemory[schemaId] = [];
  // }
  // sandbox.monkeyMemory[schemaId].push(data);
}
