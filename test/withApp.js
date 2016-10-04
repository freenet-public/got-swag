module.exports = withApp;

function withApp( createApp, port ) {

  var server;

  before( function ( done ) {
    createApp().on( 'ready', function ( app ) {
      server = app.listen( port ).on( 'listening', done );
    } ).on( 'error', done );
  } );

  after( function ( done ) {
    setTimeout( function () {
      if ( server ) server.close();
      done();
    }, 300 );
  } );

}
