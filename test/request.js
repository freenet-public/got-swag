var assert = require( 'assert' );
var request = require( '../lib/request' );
var buffer = require( '../lib/buffer' );
var withApp = require( './withApp' );
var petstore = require( './petstore' );

describe( 'The request function', function () {

  withApp( petstore, 8002 );

  it( 'should POST data', function ( done ) {
    request( {
      method: 'POST',
      url: 'http://localhost:8002/v1/pets',
      data: '{"id":1,"name":"lol"}',
      headers: {
        'Content-Type': 'application/json'
      }
    } ).then( buffer ).then( function ( res ) {
      var json = JSON.parse( res.buffer );
      assert.equal( json.code, 73 );
    } ).then( done, done );
  } );

  it( 'should GET', function ( done ) {
    request( {
      method: 'GET',
      url: 'http://localhost:8002/v1/pets/{petId}'
    } ).then( buffer ).then( function ( res ) {
      var json = JSON.parse( res.buffer );
      assert.equal( res.statusCode, 404 );
      assert.equal( json.code, 71 );
    } ).then( done, done );
  } );

} );
