var assert = require( 'assert' );
var jsonschema = require( 'jsonschema' );

module.exports = validate;

function validate( operation, res, data, schema ) {

  var responses = operation && operation.responses;
  var response = responses[ res.status ] || responses[ 'default' ];

  if ( !response ) {
    throw new Error( 'Unexpected response status ' + res.status );
  }

  if ( data === undefined ) data = res.json;
  if ( schema === undefined ) {
    schema = response.schema;
    if ( !schema ) return assert.equal( res.body, '', 'Body should be empty' );
  }

  result = jsonschema.validate( data, schema );

  if ( !result.valid ) {
    throw new Error( result.errors );
  }

}
