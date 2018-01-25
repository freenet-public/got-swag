var minimist = require( 'minimist' );
var mocha = require( './mocha' );
var bundleApis = require( './bundleApis' );
var assert = require( 'assert' );
var readFile = require( './readFile' );
var pack = require( '../package.json' );
var _ = require( 'lodash' );

module.exports = dispatch;

function dispatch( argv ) {
  return new Promise( function ( resolve ) {

    var args = _.mapKeys( minimist( argv ), function ( value, key ) {
      return key.replace( /-([a-z])/g, function ( m ) {
        return m[ 1 ].toUpperCase();
      } );
    } );

    if ( args.V || args.v || args.version ) return resolve( version() );
    if ( args._.length === 0 ) return resolve( usage() );
    if ( args.w || args.watch ) return resolve( watch( args ) );

    resolve( test( args ) );
  } );
}

function version() {
  console.log( pack.version );
  return pack.version;
}

function usage() {
  return readFile( __dirname + '/../README.md' ).then( function ( buffer ) {
    return buffer.toString( 'utf-8' ).match( /```([\s\S]*?)```/ )[ 1 ].trim();
  } ).then( function ( usage ) {
    console.log();
    console.log( usage );
    return usage;
  } );
}

function watch( args, last ) {

  args.w = args.watch = false;

  var current;

  return bundleApis( args._ ).then( function ( api ) {
    current = api;
  } ).catch( function ( err ) {
    current = err.message;
  } ).then( function () {
    assert.deepEqual( current, last );
  } ).catch( function () {
    if ( typeof current === 'string' ) console.log( current );
    return test( args );
  } ).catch( function () {
    // ignore, already handled in parseTests
  } ).then( function () {
    setTimeout( function () {
      watch( args, current );
    }, 1000 );
  } );

}

function test( args ) {

  var options = {
    // got-swag
    monkey: args.m || args.monkey,
    trace: args.T || args.trace,
    monkeyLimit: args.l || args.monkeyLimit,
    exitCode: args.exitCode,

    // mocha
    // https://mochajs.org/#usage
    colors: args.C || args.noColors || false,
    bail: args.b || args.bail || false,
    debug: args.d || args.debug || false,
    grep: args.g || args.grep,
    fgrep: args.f || args.fgrep,
    invert: args.i || args.invert,
    require: args.r || args.require,
    slow: args.s || args.slow,
    timeout: args.t || args.timeout,
    ui: args.u || args.ui,
    reporterOptions: args.O || args.reporterOptions,
    reporter: args.R || args.reporter,
    watch: false,
    retries: args.retries,
    force: args.F || args.force || false
  };

  return mocha( args._, options ).then( function ( m ) {
    return new Promise( function ( resolve ) {
      m.run( function ( failures ) {
        resolve( failures );
        if ( options.exitCode !== false ) process.on( 'exit', function () {
          // exit with non-zero status if there were failures
          process.exit( failures ? 1 : 0 );
        } );
      } );
    } );
  } );

}
