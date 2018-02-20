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

  return tryGet( getCandidate() || [], 0 );

  function tryGet( candidate, number ) {

    if ( !candidate || number >= sandbox.monkeyLimit ) {
      throw new Error( 'Could not GET (tried ' + number + ' candidates)' );
    }

    var path = ( ( sandbox.api.basePath || '' ) + sandbox.test.path );
    var query = {};
    var headers = {};

    parameters.forEach( function ( parameter, i ) {
      if ( parameter.in === 'path' ) {
        path = path.replace( '{' + parameter.name + '}', encodeURIComponent( candidate[ i ] ) );
      } else if ( parameter.in === 'query' && candidate[ i ] !== null ) {
        query[ parameter.name ] = candidate[ i ];
      } else if ( parameter.in === 'header' && candidate[ i ] !== null ) {
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

      var next = getCandidate();

      if ( !next || sandbox.res.statusCode >= 500 ||  sandbox.res.statusCode < 400 ) {
        sandbox.log( {
          MONKEY_LAST: {
            parameters: c,
            statusCode: sandbox.res.statusCode
          }
        } );
      }

      if ( sandbox.res.statusCode >= 500 ) {
        throw new Error( 'Status ' + sandbox.res.statusCode + ' detected' );
      }

      if ( sandbox.res.statusCode >= 400 ) {
        return tryGet( next, number + 1 );
      }
    } );

  }

}
