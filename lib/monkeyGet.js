var listVars = require( './listVars' );
var cartesian = require( './cartesian' );
var shuffle = require( './shuffle' );

module.exports = monkeyGet;

function monkeyGet( options ) {

  var operation = options.test.operation;
  var parameters = operation.parameters || [];
  var operationVars = listVars( operation[ 'x-vars' ] );
  var globalVars = listVars( options.vars, options.monkeyMemory );

  var getCandidate = cartesian( parameters.map( function ( parameter ) {
    return [ null ]
      .concat( shuffle( operationVars[ parameter.name ] || [] ) )
      .concat( shuffle( globalVars[ parameter.name ] || [] ) );
  } ) );

  return tryGet( getCandidate() || [], 0 );

  function tryGet( candidate, number ) {

    if ( !candidate || number >= options.monkeyLimit ) {
      throw new Error( 'Could not GET (tried ' + number + ' candidates)' );
    }

    var path = ( ( options.api.basePath || '' ) + options.test.path );
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

    return options.request( {
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

      if ( !next || options.res.statusCode >= 500 ||  options.res.statusCode < 400 ) {
        options.log( {
          MONKEY_LAST: {
            parameters: c,
            statusCode: options.res.statusCode
          }
        } );
      }

      if ( options.res.statusCode >= 500 ) {
        throw new Error( 'Status ' + options.res.statusCode + ' detected' );
      }

      if ( options.res.statusCode >= 400 ) {
        return tryGet( next, number + 1 );
      }

    } );

  }

}
