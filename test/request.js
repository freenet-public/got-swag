var assert = require( 'assert' );
var request = require( '../lib/request' );
var bufferResponse = require( '../lib/bufferResponse' );

describe( 'The request function', function () {

  it( 'should GET', function ( done ) {

    request( {
      method: 'GET',
      url: 'http://petstore.swagger.io/v2/pet/findByStatus?status=pending',
      headers: {
        accept: 'application/json'
      }
    } ).on( 'response', function ( res ) {

      bufferResponse( res ).on( 'json', function ( data ) {
        assert.ok( data.length > 0 );
        done();
      } ).on( 'error', done );

    } ).on( 'error', done );

  } );

  it( 'should follow redirects', function ( done ) {

    var redirects = 0;

    request( {
      url: 'http://google.com'
    } ).on( 'redirect', function ( res ) {

      assert.ok( res.statusCode >= 300 );
      assert.ok( res.statusCode < 400 );
      ++redirects;

    } ).on( 'final-response', function ( res ) {

      assert.ok( redirects > 0 );
      assert.ok( res.statusCode >= 200 );
      assert.ok( res.statusCode < 300 );

      bufferResponse( res ).on( 'string', function ( html ) {
        assert.ok( html.match( /<!doctype html>/i ) );
        done();
      } ).on( 'error', done );

    } ).on( 'error', done );

  } );

} );
