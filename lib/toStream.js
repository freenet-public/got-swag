var stream = require( 'stream' );

module.exports = toStream;

function toStream( x ) {
  if ( x && x.pipe ) return x;
  var pass = new stream.PassThrough();
  pass.end( x );
  return pass;
}
