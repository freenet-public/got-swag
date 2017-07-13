var parser = require( 'json-schema-ref-parser' );
var gotSwag = require( '../' );
var withApp = require( './withApp' );
var petstore = require( './petstore' );
var oauth2 = require( './oauth2' );

describe( 'The monkeyRequest function', function () {

  this.timeout( 10000 );

  withApp( petstore, 8000 );
  withApp( oauth2, 8001 );

  var api;
  var auth;
  var memory = {
    customer: [
      {
        username: 'basil',
        password: 'smash',
        client_id: 'siegmeyer',
        client_secret: 'catarina',
        redirect_uri: 'http://localhost:8000'
      },
    ],
    api_key: [
      {
        key: 'special-key'
      }
    ]
  };

  before( function () {
    return parser.dereference( 'http://localhost:8000/api-docs' )
      .then( function ( api_ ) {
        api = gotSwag.annotateApi( api_ );
        api.host = 'localhost:8000';
        gotSwag.scanApiVars( api, memory );
      } );
  } );

  before( function ( done ) {
    gotSwag.monkeyAuth( {
      api: api,
      operationId: 'getPetsId',
      memory: memory
    } ).on( 'auth', function ( auth_ ) {
      auth = auth_;
      done();
    } ).on( 'error', done );
  } );

  it( 'should run a randomized GET request', function ( done ) {

    var options = gotSwag.monkeyRequest( {
      api: api,
      operationId: 'getPetsId',
      memory: memory,
      auth: auth
    } );

    gotSwag.request( options ).on( 'final-response', function ( res ) {
      done();
    } ).on( 'error', done );

  } );

} );
