module.exports = shuffle;

function shuffle( a ) {

  var j, x, i;

  for ( i = a.length; i > 0; --i ) {
    j = Math.floor( Math.random() * i );
    x = a[ i - 1 ];
    a[ i - 1 ] = a[ j ];
    a[ j ] = x;
  }

  return a;

}
