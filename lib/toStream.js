var stream = require( 'stream' );

module.exports = toStream;

function toStream( x ) {
  return x && x.pipe ? x : ( new stream.PassThrough() ).end( x );
}
