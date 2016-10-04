var runStep = require( './runStep' );

module.exports = runTest;

function runTest( test, sandbox ) {

  sandbox.test = test;
  sandbox.data = test.data;

  return runSteps( test.steps, sandbox, 0, [] ).then( function ( results ) {
    return {
      method: test.method || null,
      path: test.path || null,
      description: test.description || null,
      data: test.data || null,
      results: results,
      ok: results.filter( function ( result ) {
        return !result.ok;
      } ).length === 0
    };
  } );

}

function runSteps( steps, sandbox, i, results ) {

  if ( steps.length <= i ) return new Promise( function ( resolve ) {
    resolve( results );
  } );

  return runStep( steps[ i ], sandbox ).then( function ( result ) {
    results.push( result );
    return runSteps( steps, sandbox, i + 1, results );
  } );

}
