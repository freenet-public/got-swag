var parser = require( 'json-schema-ref-parser' );
var $ = require( '../' );

describe( 'The monkeyRequest function', function () {

  this.timeout( 10000 );

  var api;
  var auth;
  var memory = {
    petstore_auth: [
      {
        username: 'me',
        password: 'secret',
        key: 'special-key',
        secret: 'none',
        redirect: 'http://localhost:8000'
      }
    ],
    api_key: [
      {
        key: 'special-key'
      }
    ]
  };

  before( function () {
    return parser.dereference( 'http://petstore.swagger.io/v2/swagger.json' )
      .then( function ( api_ ) {
        api = $.annotateApi( api_ );
        $.scanApiVars( api, memory );
      } );
  } );

  before( function ( done ) {
    $.monkeyAuth( {
      api: api,
      operationId: 'findPetsByStatus',
      memory: memory
    } ).on( 'auth', function ( auth_ ) {
      console.log( auth_ );
      auth = auth_;
      done();
    } ).on( 'error', done );
  } );

  it( 'should run a randomized GET request', function ( done ) {

    var options = $.monkeyRequest( {
      api: api,
      operationId: 'findPetsByStatus',
      memory: memory,
      auth: auth
    } );

    console.log( options );

    $.request( options ).on( 'final-response', function ( res ) {
      console.log( res.statusCode );
      done();
    } ).on( 'error', done );

  } );

} );
