var assert = require( 'assert' );
var parser = require( 'json-schema-ref-parser' );
var gotSwag = require( '../' );
var withApp = require( './withApp' );
var petstore = require( './petstore' );
var oauth2 = require( './oauth2' );

describe( 'The monkeyAuth function', function () {

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

  var memory = gotSwag.scanVars( credentials );

  before( function () {
    return parser.dereference( 'http://localhost:8000/api-docs' )
      .then( function ( api_ ) {
        api = gotSwag.annotateApi( api_ );
        assert.ok( gotSwag.findOperation( {
          api: api,
          operationId: 'getPetsId'
        } ) );
      } );
  } );

  this.timeout( 10000 );

  it( 'should authenticated randomly', function ( done ) {

    gotSwag.monkeyAuth( {
      api: api,
      operationId: 'getPetsId',
      memory: memory
    } ).on( 'auth', function ( auth ) {
      assert.ok(
        auth.auth ||
        auth.headers.Authorization && auth.headers.Authorization.match( /Bearer\s+/ ) ||
        auth.headers[ 'X-Api-Key' ]
      );
      done();
    } ).on( 'auth-error', function ( err ) {
      console.log( err.stack );
    } ).on( 'error', done );

  } );

} );
