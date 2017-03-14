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

      if ( options.monkey && method === 'get' && !operation[ 'x-monkey-ignore' ] ) {
        tests.push( monkeyTest( operation, path ) );
      }

    } );
  } );

  return tests;

}

function monkeyTest( operation, path ) {
  return {
    description: 'Monkey Test',
    steps: [
      'monkeyAuth()',
      'monkeyGet()',
      'validate()'
    ],
    method: 'get',
    path: path,
    operation: operation,
    data: null,
    caseDescription: null
  };
}
