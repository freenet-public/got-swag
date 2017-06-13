module.exports = buffer;

// buffer stream completely and emit event with buffer when done
function buffer( stream ) {

  if ( stream._buffer ) return stream;

  stream._buffer = true;

  var chunks = [];

  return stream.on( 'data', function ( chunk ) {
    chunks.push( chunk );
  } ).on( 'end', function () {
    stream.emit( 'buffer', Buffer.concat( chunks ) );
  } );

}
