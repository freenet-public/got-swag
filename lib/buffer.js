module.exports = buffer;

function buffer( stream ) {

  return new Promise( function ( resolve, reject ) {

    stream.buffer = Buffer.concat( [] );

    stream.on( 'data', function ( chunk ) {
      stream.buffer = Buffer.concat( [ stream.buffer, chunk ] );
    } );

    stream.on( 'end', function () {
      resolve( stream );
    } ).on( 'error', reject );

  } );

}
