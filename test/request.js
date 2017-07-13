var assert = require( 'assert' );
var request = require( '../lib/request' );
var buffer = require( '../lib/buffer' );

// TODO need more tests

describe( 'The request function', function () {

  it( 'should GET', function ( done ) {

    request( {
      method: 'GET',
      url: 'http://petstore.swagger.io/v2/pet/findByStatus?status=pending',
      headers: {
        accept: 'application/json'
      },
      buffer: true
    } ).on( 'final-body', function ( res ) {
      assert.ok( JSON.parse( res.body ).length > 0 );
      done();
    } ).on( 'error', done );

  } );

  it( 'should follow redirects', function ( done ) {

    var redirects = 0;

    request( 'http://google.com' ).on( 'redirect', function ( res ) {

      assert.ok( res.statusCode >= 300 );
      assert.ok( res.statusCode < 400 );
      ++redirects;

    } ).on( 'final-response', function ( res ) {

      assert.ok( redirects > 0 );
      assert.ok( res.statusCode >= 200 );
      assert.ok( res.statusCode < 300 );

    } ).on( 'final-body', function ( res ) {

      assert.ok( res.body.toString( 'utf-8' ).match( /<!doctype html>/i ) );
      done();

    } ).on( 'error', done );

  } );

} );
