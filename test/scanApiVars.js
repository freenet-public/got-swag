var assert = require( 'assert' );
var parser = require( 'json-schema-ref-parser' );
var scanApiVars = require( '../lib/scanApiVars' );

describe( 'The scanApiVars function', function () {

  it( 'should parse variables found in API examples', function () {
    return parser.dereference( 'test/petstore.yaml' )
      .then( function ( api ) {
        assert.deepEqual( scanApiVars( api ), {
          id: [ 4, 666, 27, 5 ],
          name: [ 'Lissy', 'Beast', 'Bolero', 'George', 'Katie' ],
          tag: [ 'Big' ] }
        );
      } );
  } );

} );
