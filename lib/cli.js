var minimist = require( 'minimist' );
var assert = require( 'assert' );
var fs = require( 'fs' );
var p = require( './promisify' );
var pack = require( '../package.json' );
var _ = require( 'lodash' );
var monkeyTest = require( './monkeyTest' );

module.exports = cli;

function cli( argv ) {
  return new Promise( function ( resolve ) {
    var args = _.mapKeys( minimist( argv ), function ( value, key ) {
      return key.replace( /-([a-z])/g, function ( m ) {
        return m[ 1 ].toUpperCase();
      } );
    } );

    if ( args.V || args.v || args.version ) return resolve( version() );
    if ( args._.length === 0 ) return resolve( usage() );

    resolve( test( args ) );
  } );
}

function version() {
  console.log( pack.version );
  return pack.version;
}

function usage() {
  return p( fs.readFile )( __dirname + '/../README.md' ).then( function ( buffer ) {
    return buffer.toString( 'utf-8' ).match( /```([\s\S]*?)```/ )[ 1 ].trim();
  } ).then( function ( usage ) {
    console.log();
    console.log( usage );
    return usage;
  } );
}

function test( args ) {

  var monkey = monkeyTest( {
    apis: args._
  } );

  monkey.on( 'api', function ( api ) {
    console.log( 'INFO', 'Testing API ' + api.info.title );
  } );

  monkey.on( 'error', function ( err ) {
    console.log( 'ERROR', err.stack );
  } );

  monkey.on( 'parse-error', function ( err ) {
    console.log( 'PARSE ERROR', err.stack );
  } );

  monkey.on( 'response-error', function ( err ) {
    console.log( 'REQUEST', err.req.options );
    console.log( 'RESPONSE ERROR', err.message,
      err.res.statusCode, err.res.body.toString( 'utf-8' ) );
    console.log( 'MEMORY', err.memory );
  } );

  monkey.on( 'request-error', function ( err ) {
    console.log( 'REQUEST', err.req.options );
    console.log( 'REQUEST ERROR', err.stack );
  } );

  monkey.on( 'auth-error', function ( err ) {
    console.log( 'WARNING', err.message );
  } );

  monkey.on( 'request-response', function ( event ) {
    console.log( 'REQUEST', event.req.options );
    console.log( 'RESPONSE', event.res.json );
    console.log( 'MEMORY', event.memory );
  } );

  monkey.on( 'finish', function ( report ) {
    console.log( 'REPORT', report );
  } );

}
