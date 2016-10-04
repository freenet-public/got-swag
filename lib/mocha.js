var bundleApis = require( './bundleApis' );
var parseTests = require( './parseTests' );
var createSandbox = require( './createSandbox' );
var runStep = require( './runStep' );
var Mocha = require( 'mocha' );

module.exports = mocha;

function mocha( urls, options ) {

  options = options || {};

  return bundleApis( urls ).then( function ( api ) {

    var mocha = new Mocha();
    mocha.suite.title = 'Got Swag?';
    var apiSuite = Mocha.Suite.create( options.parent || mocha.suite, api[ 'x-main-url' ] + ':' );

    var sandbox = createSandbox( api, options );
    var i = 0;

    parseTests( api, options ).forEach( function ( test ) {

      ++i;

      var testSuite = Mocha.Suite.create( apiSuite,
        ( test.path ? ( test.method.toUpperCase() + ' ' + test.path + ' ' ) : '' ) +
        ( test.description || 'Test #' + i ) +
        ( test.caseDescription ? ( ' -- ' + test.caseDescription ) : '' ) +
        ':'
      );

      if ( options.timeout >= 0 ) testSuite.timeout( options.timeout );

      testSuite.beforeAll( function () {
        sandbox.test = test;
        sandbox.data = test.data;
      } );

      test.steps.forEach( function ( step ) {

        var stepTest = new Mocha.Test( step, function ( done ) {

          runStep( step, sandbox ).then( function ( result ) {

            if ( result.output.length > 0 ) {
              try {
                stepTest.title = step + ' -> ' + JSON.stringify( result.output, null, '  ' );
              } catch ( ex ) {
                stepTest.title = step + ' -> ' + ex.message;
              }
            }

            if ( result.ok ) return done();
            return done( new Error( result.error ) );

          } );

        } );

        testSuite.addTest( stepTest );

      } );

    } );

    return mocha;

  } );

}
