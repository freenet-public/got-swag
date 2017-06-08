var _ = require( 'lodash' );
var auth = require( './auth' );
var monkeyParameter = require( './' );

module.exports = monkeyAuth;

function monkeyAuth( options ) {

  var api = options.api || {};
  var operations = api.paths[ options.path ];
  var operation = operations && operations[ options.method || 'get' ] || {};
  var security = operation && operation.security || api.security;

  if ( !security ) return Promise.resolve( {
    message: 'No security'
  } );

  var candidates = [];

  security.forEach( function ( item ) {
    _.forOwn( options.vars.auth, function ( credentials ) {
      candidates.push( {
        name: _.keys( item )[ 0 ],
        credentials: credentials
      } );
    } );
  } );

  return tryAuth( 0 );

  function tryAuth( index ) {

    if ( index >= candidates.length ) throw new Error( 'Could not authenticate' );

    return auth( candidates[ index ] ).catch( function ( err ) {
      return tryAuth( index + 1 );
    } );

  }

}
