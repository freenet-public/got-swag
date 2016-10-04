var _ = require( 'lodash' );

module.exports = monkeyAuth;

function monkeyAuth( sandbox ) {

  var operation = sandbox.test.operation;
  var security = operation && operation.security || sandbox.api.security;

  if ( !security ) return sandbox.log( 'No security' );

  var candidates = [];

  security.forEach( function ( item ) {
    _.forOwn( sandbox.vars.auth, function ( credentials ) {
      candidates.push( {
        name: _.keys( item )[ 0 ],
        credentials: credentials
      } );
    } );
  } );

  return tryAuth( 0 );

  function tryAuth( index ) {

    if ( index >= candidates.length ) throw new Error( 'Could not authenticate' );

    var candidate = candidates[ index ];

    return sandbox.auth( candidate.name, candidate.credentials ).catch( function ( err ) {
      sandbox.log( err.message );
      return tryAuth( index + 1 );
    } );

  }

}
