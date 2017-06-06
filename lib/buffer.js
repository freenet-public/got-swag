module.exports = buffer;

// create a promise that buffers a stream completely
// the promise is resolved with the stream having a buffer property
function buffer( stream ) {

  return new Promise( function ( resolve, reject ) {

    var chunks = [];

    stream.on( 'data', function ( chunk ) {
      chunks.push( chunk );
    } ).on( 'end', function () {
      stream.buffer = Buffer.concat( chunks );
      resolve( stream );
    } ).on( 'error', reject );

  } );

}
