var _ = require( 'lodash' );

module.exports = parseTests;

function parseTests( api, options ) {

  options = options || {};

  var tests = [];

  ( api[ 'x-tests' ] || [] ).forEach( function ( test ) {
    var i = 0;
    ( test.cases || [ null ] ).forEach( function ( data ) {
      ++i;
      tests.push( _.assign( {}, test, {
        data: data,
        caseDescription: data && ( data.description || i )
      } ) );
    } );
  } );

  _.forEach( api.paths, function ( operations, path ) {
    _.forEach( operations, function ( operation, method ) {
      ( operation[ 'x-tests' ] || [] ).forEach( function ( test ) {

        var i = 0;
        ( test.cases || [ null ] ).forEach( function ( data ) {
          ++i;
          tests.push( _.assign( {}, test, {
            method: method,
            path: path,
            operation: operation,
            data: data,
            caseDescription: data && ( data.description || i )
          } ) );
        } );

      } );

      if ( options.monkey && (method === 'get' || (method === 'post' && operation['x-gotswag-post'] === true)) && !operation[ 'x-monkey-ignore' ] ) {
        tests.push( monkeyTest( operation, path, method ) );
      }

    } );
  } );

  //TODO: store different tests in different arrays.
  //
  tests.sort(function(a, b){
    if(!a.method){
      return -1;
    }
    switch(a.method){
        case 'post':
          return 1;
        case 'get':
          return -1;
        default:
          throw new Error('method '+a.method+' is not supported!');
    }
  });

  return tests;

}

function monkeyTest( operation, path, method ) {
  return {
    description: 'Monkey Test',
    steps: [
      'monkeyAuth()',
      'monkeyTest()',
      'validate()'
    ],
    method: method,
    path: path,
    operation: operation,
    data: null,
    caseDescription: null
  };
}
