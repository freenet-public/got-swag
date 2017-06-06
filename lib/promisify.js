module.exports = promisify;

// create promise variant of callback-based function
function promisify( fn ) {

  return function () {

    var context = this;
    var args = Array.prototype.slice.call( arguments, 0 );

    return new Promise( function ( resolve, reject ) {

      args.push( function ( err ) {

        if ( err ) return reject( err );
        var results = Array.prototype.slice.call( arguments, 1 );
        resolve( results.length > 1 ? results : results[ 0 ] );

      } );

      fn.apply( context, args );

    } );

  };

}
