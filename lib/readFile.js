var fs = require( 'fs' );

module.exports = readFile;

function readFile( path ) {
  return new Promise( function ( resolve, reject ) {
    fs.readFile( path, function ( err, contents ) {
      if ( err ) return reject( err );
      resolve( contents );
    } );
  } );
}
