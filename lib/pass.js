module.exports = pass;

function pass( events, src, dst ) {
  if ( !Array.isArray( events ) ) events = [ events ];
  src.on( event, function () {
    dst.emit.apply( dst, arguments );
  } );
  return dst;
}
