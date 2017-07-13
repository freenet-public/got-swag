var parser = require( 'json-schema-ref-parser' );
var gotSwag = require( '../' );

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
        api = gotSwag.annotateApi( api_ );
        gotSwag.scanApiVars( api, memory );
      } );
  } );

  it.skip( '(auth)', function ( done ) {
    gotSwag.monkeyAuth( {
      api: api,
      operationId: 'findPetsByStatus',
      memory: memory
    } ).on( 'auth', function ( auth_ ) {
      console.log( auth_ );
      auth = auth_;
      done();
    } ).on( 'auth-error', function ( err ) {
      console.log( err.stack );
    } ).on( 'error', done );
  } );

  it( 'should run a randomized GET request', function ( done ) {

    var options = gotSwag.monkeyRequest( {
      api: api,
      operationId: 'findPetsByStatus',
      memory: memory,
      auth: auth
    } );

    console.log( options );

    gotSwag.request( options ).on( 'final-response', function ( res ) {
      done();
    } ).on( 'error', done );

  } );

} );
