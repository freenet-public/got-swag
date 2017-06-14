var parser = require( 'json-schema-ref-parser' );
var gotSwag = require( '../' );

describe( 'The auth function', function () {

  var api;
  var auth;
  var credentials = {
    petstore_auth: {
      username: 'me',
      password: 'secret',
      key: 'special-key',
      secret: 'none',
      redirect: 'http://localhost:8000'
    },
    api_key: {
      key: 'special-key'
    }
  };

  before( function () {
    return parser.dereference( 'http://petstore.swagger.io/v2/swagger.json' )
      .then( function ( api_ ) {
        api = api_;
      } );
  } );

  this.timeout( 10000 );

  it( 'authenticate via the OAuth 2.0 implicit flow', function ( done ) {

    gotSwag.auth( {
      api: api,
      id: 'petstore_auth',
      credentials: credentials.petstore_auth
    } ).on( 'auth', function ( auth_ ) {
      auth = auth_;
      console.log( auth );
      done();
    } ).on( 'error', done );

  } );

} );
