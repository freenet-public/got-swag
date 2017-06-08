var parser = require( 'json-schema-ref-parser' );
var gotSwag = require( '../' );

describe( 'The monkeyRequest function', function () {

  var api;
  var auth;
  var memory = {
    petstore_auth: [
      {
        username: 'me',
        password: 'secret',
        key: 'special-key',
        secret: 'none'
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
        api = api_;
        gotSwag.scanApiVars( api, memory );
      } );
  } );

  before( function () {
    return gotSwag.monkeyAuth( {
      api: api,
      method: 'get',
      path: '/pet/findByStatus',
      memory: memory
    } ).then( function ( auth_ ) {
      auth = auth_;
      console.log( auth );
    } );
  } );

  it( 'should run a randomized GET request', function () {

    return gotSwag.monkeyRequest( {
      api: api,
      method: 'get',
      path: '/pet/findByStatus',
      memory: memory
    } ).then( function ( pair ) {
      console.log( pair.req, pair.res.json );
    } );

  } );

} );
