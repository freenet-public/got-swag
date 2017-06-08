var EventEmitter = require( 'events' );
var _ = require( 'lodash' );
var parser = require( 'json-schema-ref-parser' );
var shuffle = require( './shuffle' );
var scanVars = require( './scanVars' );
var scanApiVars = require( './scanApiVars' );
var apiRequest = require( './apiRequest' );

module.exports = monkeyTest;

function monkeyTest( options ) {

  var monkey = new EventEmitter();
  var memory = options.memory || {};
  var requests = [];
  var endpoints = [];
  var index = 0;
  var stop = false;

  monkey.on( 'parsed', function ( api ) {

    if ( stop ) return;

    scanVars( api[ 'x-vars' ], memory );
    scanApiVars( api, memory );

    _.forOwn( api.paths, function ( operations, path ) {
      _.forOwn( operations, function ( operation, method ) {

        scanVars( operation[ 'x-vars' ], memory );
        endpoints.push( {
          api: api,
          method: method,
          path: path,
          operation: operation
        } );

      } );
    } );

    shuffle( endpoints );

  } );

  monkey.on( 'allParsed', function () {
    monkey.emit( 'round' );
  } );

  monkey.on( 'next', function () {
    var endpoint = endpoints[ index++ ];
    monkeyRequest( Object.assign( {}, endpoint, {

    } ) );
  } );

  monkey.on( 'response', function ( req, res ) {
    if ( stop ) return;
    scanVars( res.json, memory );
  } );

  // parse given apis
  Promise.all( options.apis.map( function ( api ) {
    return parser.dereference( api ).then( function ( api_ ) {
      if ( stop ) return;
      monkey.emit( 'parsed', api_ );
    } ).catch( function ( err ) {
      if ( stop ) return;
      err.api = api;
      monkey.emit( 'parseError', err );
      return null;
    } );
  } ) ).then( function ( apis ) {
    monkey.emit( 'allParsed', apis.filter( function ( api ) {
      return !!api;
    } ) );
  } );

  // interface
  monkey.stop = function () {
    stop = true;
  };

  return monkey;

}
