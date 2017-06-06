module.exports = queue;

function queue( o ) {

  var concurrency = Math.max( 1, o.concurrency );
  var pending = 0;
  var entries = [];

  function enqueue( fn ) {

    return new Promise( function ( resolve, reject ) {

      entries.push( function () {
        try {
          resolve( fn() );
        } catch ( ex ) {
          reject( ex );
        }
      } );

      dequeue();

    } ).then( function ( value ) {

      --pending;
      dequeue();
      return value;

    }, function ( err ) {

      --pending;
      dequeue();
      throw err;

    } );

  }

  function dequeue() {
    while ( pending < concurrency && entries.length > 0 ) {
      ++pending;
      entries.shift()();
    }
  }

  return enqueue;

}
