var _ = require( 'lodash' );
var auth = require( './auth' );
var monkeyParameter = require( './monkeyParameter' );

module.exports = monkeyAuth;

function monkeyAuth( options ) {

  var emitter = new EventEmitter();

  var api = options.api || {};
  var operations = api.paths[ options.path ];
  var operation = operations && operations[ options.method || 'get' ] || {};
  var security = operation && operation.security || api.security;

  if ( !security ) return Promise.resolve( {
    message: 'No security'
  } );

  var candidates = [];

  security.forEach( function ( item ) {
    var id = _.keys( item )[ 0 ];
    ( options.memory[ id ] || [] ).forEach( function ( credentials ) {
      if ( credentials.username || credentials.key ) candidates.push( {
        api: api,
        operation: operation,
        id: id,
        credentials: credentials
      } );
    } );
  } );

  tryAuth( 0 );

  function tryAuth( index ) {

    if ( index >= candidates.length ) {
      return emitter.emit( 'error', new Error( 'Could not authenticate' ) );
    }

    auth( candidates[ index ] ).on( 'auth', function ( data ) {
      emitter.emit( 'auth', data );
    } ).on( 'error', function ( err ) {
      emitter.emit( 'auth-error', err );
      return tryAuth( index + 1 );
    } );

  }

  return emitter;

}
