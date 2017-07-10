var EventEmitter = require( 'events' );
var _ = require( 'lodash' );
var auth = require( './auth' );
var monkeyParameter = require( './monkeyParameter' );
var findOperation = require( './findOperation' );
var shuffle = require( './shuffle' );

module.exports = monkeyAuth;

function monkeyAuth( options ) {

  var bus = new EventEmitter();

  var memory = options.memory;
  var api = options.api || {};
  var operation = findOperation( options );
  var security = operation && operation.security || api.security;

  var candidates = [];

  if ( security ) security.forEach( function ( item ) {
    var id = _.keys( item )[ 0 ];
    ( memory[ id ] || [] ).forEach( function ( credentials ) {
      if ( credentials.username || credentials.client_id ) candidates.push( {
        api: api,
        operation: operation,
        id: id,
        credentials: credentials
      } );
    } );
  } );

  shuffle( candidates );

  var stop = false;
  var index = 0;

  setTimeout( tryAuth, 1 );

  function tryAuth() {

    if ( !security ) return bus.emit( 'auth', {
      headers: {
        'X-Security': 'None'
      }
    } );

    if ( index >= candidates.length ) {
      return bus.emit( 'error', new Error( 'Could not authenticate' ) );
    }

    auth( candidates[ index++ ] ).on( 'auth', function ( data ) {
      bus.emit( 'auth', data );
      stop = true;
    } ).on( 'error', function ( err ) {
      bus.emit( 'auth-error', err );
      if ( !stop ) return tryAuth();
    } );

  }

  return bus;

}
