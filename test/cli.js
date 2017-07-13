var gotSwag = require ( '../' );
var assert = require( 'assert' );
var withApp = require( './withApp' );
var petstore = require( './petstore' );
var oauth2 = require( './oauth2' );

describe( 'The got-swag cli', function () {

  this.timeout( 5000 );

  withApp( petstore, 8000 );
  withApp( oauth2, 8001 );

  it( 'should show its usage', function () {

    return gotSwag.cli( [] ).then( function ( output ) {
      assert.ok( output.match( /got-swag/ ) );
    } );

  } );

  it( 'should show its version', function () {

    return gotSwag.cli( [ '-V' ] ).then( function ( output ) {
      assert.ok( output.match( /\d\.\d\.\d/ ) );
    } );

  } );

  it( 'should report a missing file', function () {

    return gotSwag.cli( [ 'evil.yaml', '--no-exit-code' ] ).catch( function ( err ) {
      assert.ok( err.message.match( /ENOENT/ ) );
    } );

  } );

  it( 'should report an unknown URL', function () {

    return gotSwag.cli( [ 'http://wow.wow.invalidz/api-docs', '--no-exit-code' ] ).catch( function ( err ) {
      assert.ok( err.message.match( /ENOTFOUND/ ), err.message );
    } );

  } );

  it( 'should report a second missing file', function () {

    return gotSwag.cli( [ 'test/petstore.yaml', 'evil.yaml', '--no-exit-code' ] ).catch( function ( err ) {
      assert.ok( err.message.match( /ENOENT/ ), err.message );
    } );

  } );

  it( 'should run the petstore tests', function () {

    return gotSwag.cli( [ 'http://127.0.0.1:8000/api-docs', 'test/vars.yaml', '--no-exit-code', '-t', 1000 ] );

  } );

} );
