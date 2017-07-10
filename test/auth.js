var assert = require( 'assert' );
var parser = require( 'json-schema-ref-parser' );
var gotSwag = require( '../' );

describe( 'The auth function', function () {

  var api;
  var credentials = {
    petstore_auth: {
      username: 'me',
      password: 'secret',
      client_id: 'special-key',
      client_secret: 'none',
      redirect_uri: 'http://localhost:8000'
    },
    api_key: {
      client_id: 'special-key'
    }
  };

  before( function () {
    return parser.dereference( 'http://petstore.swagger.io/v2/swagger.json' )
      .then( function ( api_ ) {
        api = api_;
      } );
  } );

  this.timeout( 10000 );

  it.skip( 'should retrieve a token via the OAuth 2.0 implicit flow', function ( done ) {

    gotSwag.auth( {
      api: api,
      id: 'petstore_auth',
      credentials: credentials.petstore_auth
    } ).on( 'auth', function ( auth ) {
      assert.ok( auth.headers.Authorization.match( /Bearer\s+/ ) );
      done();
    } ).on( 'error', done );

  } );

} );
