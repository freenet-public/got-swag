var buffer = require( './buffer' );

module.exports = bufferResponse;

// buffer response and emit body, string and json properties if possible
function bufferResponse( res ) {

  if ( res._bufferResponse ) return res;

  res._bufferResponse = true;

  return buffer( res ).on( 'buffer', function ( buffer ) {

    res.emit( 'body', buffer );

    try {
      res.emit( 'string', buffer.toString( 'utf-8' ) );
    } catch ( ex ) {
      // ignore
    }

    try {
      res.emit( 'json', JSON.parse( buffer ) );
    } catch ( ex ) {
      // ignore
    }

  } );

}
