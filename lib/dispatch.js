var minimist = require( 'minimist' );
var assert = require( 'assert' );
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

function test( args ) {

  var options = {
    monkey: args.m || args.monkey,
    trace: args.T || args.trace,
    monkeyLimit: args.l || args.monkeyLimit,
    exitCode: args.exitCode,
    timeout: args.t || args.timeout,
    retries: args.retries
  };



}
