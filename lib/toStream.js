var stream = require( 'stream' );

module.exports = toStream;

function toStream( x ) {
  if ( x && x.pipe ) return x;
  var s = new stream.PassThrough();
  s.end( x );
  return s;
}
