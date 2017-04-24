var gotSwag = require ( '../' );
var withApp = require( './withApp' );
var petstore = require( './petstore' );
var oauth2 = require( './oauth2' );

describe( 'The describe function should work', function () {

  this.timeout( 5000 );

  withApp( petstore, 8000 );
  withApp( oauth2, 8001 );

  gotSwag.describe( [ 'http://localhost:8000/api-docs', 'test/vars.yaml' ], {
    parent: this,
    timeout: 1000
  } );

} );
