module.exports = on;

function on( emitter, event ) {

  return new Promise( function ( resolve, reject ) {

    emitter.on( event, function ( result ) {
      resolve( arguments.length > 1 ?
        Array.prototype.slice.call( arguments, 0 ) : result );
    } );

    emitter.on( 'error', reject );

  } );

}
