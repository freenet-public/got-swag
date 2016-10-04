var mocha = require( './mocha' );

module.exports = describez;

function describez( urls, options ) {

  before( function ( done ) {
    mocha( urls, options ).then( function () {
      done();
    } ).catch( done );
  } );

  it( 'Loading...', function () {} );

}
