var assert = require( 'assert' );
var parser = require( 'json-schema-ref-parser' );
var gotSwag = require( '../' );
var withApp = require( './withApp' );
var petstore = require( './petstore' );
var oauth2 = require( './oauth2' );

describe( 'The auth function', function () {

  this.timeout( 5000 );

  withApp( petstore, 8000 );
  withApp( oauth2, 8001 );

  var api;
  var credentials = {
    customer: {
      username: 'basil',
      password: 'smash',
      client_id: 'siegmeyer',
      client_secret: 'catarina',
      redirect_uri: 'http://localhost:8000'
    },
    app: {
      client_id: 'siegmeyer',
      client_secret: 'catarina'
    },
    api_key: {
      client_id: 'special-key'
    }
  };

  before( function () {
    return parser.dereference( 'http://localhost:8000/api-docs' )
      .then( function ( api_ ) {
        api = api_;
      } );
  } );

  this.timeout( 10000 );

  it( 'should retrieve a token via the OAuth 2.0 password flow', function ( done ) {

    gotSwag.auth( {
      api: api,
      id: 'customer',
      credentials: credentials.customer
    } ).on( 'auth', function ( auth ) {
      assert.ok( auth.headers.Authorization.match( /Bearer\s+/ ) );
      done();
    } ).on( 'error', done );

  } );

  it( 'should retrieve a token via the OAuth 2.0 client credentials flow', function ( done ) {

    gotSwag.auth( {
      api: api,
      id: 'app',
      credentials: credentials.app
    } ).on( 'auth', function ( auth ) {
      assert.ok( auth.headers.Authorization.match( /Bearer\s+/ ) );
      done();
    } ).on( 'error', done );

  } );

  it.skip( 'should retrieve a token via the OAuth 2.0 implicit flow', function ( done ) {

    gotSwag.auth( {
      api: api,
      id: 'web',
      credentials: credentials.customer
    } ).on( 'auth', function ( auth ) {
      assert.ok( auth.headers.Authorization.match( /Bearer\s+/ ) );
      done();
    } ).on( 'error', done );

  } );

} );
