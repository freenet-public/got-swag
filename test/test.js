var assert = require( 'assert' );
var test = require( '../lib/test' );
var withApp = require( './withApp' );
var petstore = require( './petstore' );
var oauth2 = require( './oauth2' );

describe( 'The test function', function () {

  withApp( petstore, 8000 );
  withApp( oauth2, 8001 );

  it( 'should test an API and return a JSON report', function ( done ) {
    test( [ 'http://localhost:8000/api-docs', 'test/vars.yaml' ] ).then( function ( report ) {
      assert.ok( report.ok );
    } ).then( done, done );
  } );

  it( 'should test a combined API and return a JSON report', function ( done ) {
    test( [ 'test/petstore2.yaml', 'test/vars.yaml' ], { trace: true } ).then( function ( report ) {
      assert.ok( report.ok );
      assert.equal( report.tests[ 0 ].results[ 0 ].output[ 0 ].vars.george.age, '6y' );
    } ).then( done, done );
  } );

} );
