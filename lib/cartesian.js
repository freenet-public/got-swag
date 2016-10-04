module.exports = cartesian;

// cartesian product generator
// vectors must not be modified
function cartesian( vectors ) {

  var length = vectors.length;
  var at = vectors.map( function () { return 0; } );
  var done = length === 0;

  return function () {

    if ( done ) return null;

    // build next tuple
    var tuple = vectors.map( function ( vector, i ) {
      return vector[ at[ i ] ];
    } );

    // advance position
    for ( var i = 0; i < length; ++i ) {
      if ( ++at[ i ] < vectors[ i ].length ) break;
      at[ i ] = 0;
      if ( i === length - 1 ) done = true;
    }

    return tuple;

  };

}
