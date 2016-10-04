var bundleApis = require( './bundleApis' );
var parseTests = require( './parseTests' );
var createSandbox = require( './createSandbox' );
var runTest = require( './runTest' );

module.exports = test;

function test( urls, options ) {

  options = options || {};

  return bundleApis( urls ).then( function ( api ) {

    var sandbox = createSandbox( api, options );

    return runTests( parseTests( api, options ), sandbox, 0, [] ).then( function ( results ) {
      return {
        tests: results,
        ok: results.filter( function ( result ) {
          return !result.ok;
        } ).length === 0
      };
    } );

  } );

}

function runTests( tests, sandbox, i, results ) {
  if ( tests.length <= i ) return new Promise( function ( r ) { r( results ); } );
  return runTest( tests[ i ], sandbox ).then( function ( result ) {
    results.push( result );
    return runTests( tests, sandbox, i + 1, results );
  } );
}
