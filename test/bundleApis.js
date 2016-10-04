var assert = require( 'assert' );
var withApp = require( './withApp' );
var petstore = require( './petstore' );
var bundleApis = require( '../lib/bundleApis' );

describe( 'The bundleApis function', function () {

  withApp( petstore, 8003 );

  it( 'should bundle APIs', function ( done ) {
    bundleApis( [ 'http://localhost:8003/api-docs', 'test/vars.yaml' ] ).then( function ( api ) {
      assert.ok( api[ 'x-vars' ].auth.myApp );
      assert.equal( api.host, 'localhost:8003' );
    } ).then( done, done );
  } );

} );
