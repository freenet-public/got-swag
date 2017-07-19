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

  var report = {
    requestCount: 0,
    errorCount: 0,
    requestErrorCount: 0,
    responseErrorCount: 0,
    successCount: 0,
    clientErrorCount: 0,
    serverErrorCount: 0
  };

  monkey.on( 'api', function ( api ) {

    if ( stop ) return;

    scanVars( api[ 'x-vars' ], memory );
    scanApiVars( api, memory );

    _.forOwn( api.paths, function ( operations, path ) {
      _.forOwn( operations, function ( operation, method ) {

        if ( operation[ 'x-monkey-ignore' ] ) return;

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
      console.log( "HERE" );
      stop = true;
      return monkey.emit( 'finish', report );
    }

    var options = monkeyRequest( endpoint );
    monkey.emit( 'request', options );

    ++report.requestCount;

    var req = request( options ).on( 'final-body', function ( res ) {
      req.options = options;
      try {
        if ( res.statusCode !== 204 ) res.json = JSON.parse( res.body );
      } catch ( ex ) {
        ex.req = req;
        ex.res = res;
        ex.memory = memory;
        return monkey.emit( 'response-error', ex );
      }
      monkey.emit( 'request-response', {
        req: req,
        res: res,
        memory: memory
      } );
    } ).on( 'error', function ( err ) {
      if ( stop ) return;
      err.req = req;
      monkey.emit( 'request-error', err );
    } );
  } );

  monkey.on( 'request-response', function ( event ) {
    if ( stop ) return;
    var statusCode = event.res.statusCode;
    if ( statusCode >= 200 && statusCode < 300 ) ++report.successCount;
    if ( statusCode >= 400 && statusCode < 500 ) ++report.clientErrorCount;
    if ( statusCode >= 500 ) ++report.serverErrorCount;

    scanVars( event.res.json || {}, memory );
    monkey.emit( 'next' );
  } );

  monkey.on( 'request-error', function ( err ) {
    ++report.requestErrorCount;
    monkey.emit( 'next' );
  } );

  monkey.on( 'response-error', function ( err ) {
    ++report.responseErrorCount;
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
