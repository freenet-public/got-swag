var listVars = require( './listVars' );
var cartesian = require( './cartesian' );
var shuffle = require( './shuffle' );

module.exports = monkeyGet;

function monkeyGet( sandbox ) {

  var operation = sandbox.test.operation;
  var parameters = operation.parameters || [];
  var operationVars = listVars( operation[ 'x-vars' ] );
  var globalVars = listVars( sandbox.vars, sandbox.monkeyMemory );

  var getCandidate = cartesian( parameters.map( function ( parameter ) {
    return [ null ]
      .concat( shuffle( operationVars[ parameter.name ] || [] ) )
      .concat( shuffle( globalVars[ parameter.name ] || [] ) );
  } ) );

  return tryGet( getCandidate() || [] );

  function tryGet( candidate ) {

    if ( !candidate ) throw new Error( 'Could not GET' );

    var path = ( ( sandbox.api.basePath || '' ) + sandbox.test.path );
    var query = {};
    var headers = {};

    parameters.forEach( function ( parameter, i ) {
      if ( parameter.in === 'path' ) {
        path = path.replace( '{' + parameter.name + '}', encodeURIComponent( candidate[ i ] ) );
      } else if ( parameter.in === 'query' ) {
        query[ parameter.name ] = candidate[ i ];
      } else if ( parameter.in === 'header' ) {
        headers[ parameter.name ] = candidate[ i ];
      }
    } );

    return sandbox.request( {
      method: 'GET',
      path: path,
      query: query,
      headers: headers
    } ).then( function () {

      var c = {};

      parameters.forEach( function ( parameter, i ) {
        c[ parameter.name ] = candidate[ i ];
      } );

      sandbox.log( {
        parameters: c,
        status: sandbox.res.status,
        response: sandbox.res.json
      } );

      if ( sandbox.res.status >= 400 ) {
        return tryGet( getCandidate() );
      }

    } );
  }

}
