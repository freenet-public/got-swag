var assert = require( 'assert' );
var cartesian = require( '../lib/cartesian' );

describe( 'The cartesian function', function () {

  it( 'should compute the cartesian product', function () {
    var cp = cartesian( [ [ 3, 2, 1 ], [ 'x' ], [ 'foo', 'bar' ] ] );
    assert.deepEqual( [ cp(), cp(), cp(), cp(), cp(), cp(), cp() ], [
      [ 3, 'x', 'foo' ],
      [ 2, 'x', 'foo' ],
      [ 1, 'x', 'foo' ],
      [ 3, 'x', 'bar' ],
      [ 2, 'x', 'bar' ],
      [ 1, 'x', 'bar' ],
      null
    ] );
  } );

} );
