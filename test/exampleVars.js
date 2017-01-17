var assert = require( 'assert' );
var parser = require( 'json-schema-ref-parser' );
var exampleVars = require( '../lib/exampleVars' );

describe( 'The exampleVars function', function () {

  it( 'should parse variables found in API examples', function () {
    return parser.parse( 'test/petstore.yaml' )
      .then( function ( api ) {
        assert.deepEqual( exampleVars( api ), {
          id: [ 4, 666, 27, 5 ],
          name: [ 'Lissy', 'Beast', 'Bolero', 'George', 'Katie' ],
          tag: [ 'Big' ] }
        );
      } );
  } );

} );
