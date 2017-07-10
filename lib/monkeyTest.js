var EventEmitter = require( 'events' );
var _ = require( 'lodash' );
var parser = require( 'json-schema-ref-parser' );
var shuffle = require( './shuffle' );
var scanVars = require( './scanVars' );
var scanApiVars = require( './scanApiVars' );
var request = require( './request' );
var monkeyRequest = require( './monkeyRequest' );
var annotateApi = require( './annotateApi' );
var buffer = require( './buffer' );

module.exports = monkeyTest;

function monkeyTest( options ) {

  var monkey = new EventEmitter();
  var apis = options.apis || [];
  var memory = options.memory || {};
  var requests = [];
  var endpoints = [];
  var index = 0;
  var max = options.max || 10;
  var stop = false;

  monkey.on( 'api', function ( api ) {

    if ( stop ) return;

    scanVars( api[ 'x-vars' ], memory );
    scanApiVars( api, memory );

    _.forOwn( api.paths, function ( operations, path ) {
      _.forOwn( operations, function ( operation, method ) {

        scanVars( operation[ 'x-vars' ], memory );

        endpoints.push( {
          api: api,
          operationId: operation.operationId,
          memory: memory
        } );

      } );
    } );

    shuffle( endpoints );

  } );

  monkey.on( 'all-apis', function () {
    if ( stop ) return;
    monkey.emit( 'next' );
  } );

  monkey.on( 'next', function () {
    var endpoint = endpoints[ index % endpoints.length ];
    ++index;

    if ( index >= max ) {
      stop = true;
      monkey.emit( 'finish' );
      return;
    }

    var options = monkeyRequest( endpoint );
    monkey.emit( 'request', options );
    var req = request( options ).on( 'final-response', function ( res ) {
      buffer( res ).on( 'buffer', function ( string ) {

        try {
          res.emit( 'string', buffer.toString( 'utf-8' ) );
        } catch ( ex ) {
          // ignore
        }

        try {
          res.emit( 'json', JSON.parse( buffer ) );
        } catch ( ex ) {
          // ignore
        }

        monkey.emit( 'request-response', req, res );
      } );
    } ).on( 'error', function ( err ) {
      if ( stop ) return;
      err.req = req;
      monkey.emit( 'request-error', err );
    } );
  } );

  monkey.on( 'request-response', function ( req, res ) {
    if ( stop ) return;
    scanVars( res.json, memory );
    monkey.emit( 'next' );
  } );

  monkey.on( 'request-error', function ( err ) {
    monkey.emit( 'next' );
  } );

  // parse given apis
  Promise.all( options.apis.map( function ( api ) {
    return parser.dereference( api ).then( function ( api_ ) {
      if ( stop ) return;
      monkey.emit( 'api', annotateApi( api_ ) );
      return api_;
    } ).catch( function ( err ) {
      if ( stop ) return;
      err.api = api;
      monkey.emit( 'parse-error', err );
      return null;
    } );
  } ) ).then( function ( apis ) {
    monkey.emit( 'all-apis', apis.filter( function ( api ) {
      return !!api;
    } ) );
  } ).catch( function ( err ) {
    stop = true;
    monkey.emit( 'error', err );
  } );

  // interface
  monkey.stop = function () {
    stop = true;
  };

  return monkey;

}
