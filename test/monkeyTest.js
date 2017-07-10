var gotSwag = require ( '../' );
var withApp = require( './withApp' );
var petstore = require( './petstore' );
var oauth2 = require( './oauth2' );

describe( 'The monkey option should run monkey tests', function () {

  this.timeout( 5000 );

  withApp( petstore, 8000 );
  withApp( oauth2, 8001 );

  it( 'should run monkey tests on all endpoints', function ( done ) {
    gotSwag.monkeyTest( {
      apis: [ 'http://localhost:8000/api-docs', 'test/vars.yaml' ]
    } ).on( 'api', function ( api ) {
      api.host = 'localhost:8000';
    } ).on( 'all-apis', function ( apis ) {
      //console.log( apis );
    } ).on( 'request', function ( req ) {
      console.log( req );
    } ).on( 'request-response', function ( req, res ) {
      console.log( 'REQUEST-RESPONSE', res.json );
    } ).on( 'parse-error', function ( err ) {
      //console.log( err.stack );
    } ).on( 'auth-error', function ( err ) {

    } ).on( 'request-error', function ( err ) {
      console.log( err.stack );
    } ).on( 'finish', done ).on( 'error', done );
  } );

} );
