module.exports = once;

function once( emitter, event ) {

  return new Promise( function ( resolve, reject ) {

    emitter.once( event, function ( result ) {
      resolve( arguments.length > 1 ?
        Array.prototype.slice.call( arguments, 0 ) : result );
    } );

    emitter.once( 'error', reject );

  } );

}
