module.exports = monkeyRequest;

function monkeyRequest( options ) {

  var operation = options.operation;
  var parameters = operation.parameters || [];

  var path = ( ( options.api.basePath || '' ) + options.path );
  var query = {};
  var headers = {};

  parameters.forEach( function ( parameter, i ) {
    if ( parameter.in === 'path' ) {
      path = path.replace( '{' + parameter.name + '}', encodeURIComponent( candidate[ i ] ) );
    } else if ( parameter.in === 'query' ) {
      query[ parameter.name ] = monkeyParameter( { memory: options.memory, parameter: parameter } );
    } else if ( parameter.in === 'header' ) {
      headers[ parameter.name ] = candidate[ i ];
    } else if ( parameter.in === 'body' ) {
      headers[ parameter.name ] = candidate[ i ];
    }
  } );

  return request( {
    method: options.method || 'get',
    path: path,
    query: query,
    headers: headers
  } ).then( function () {

    var c = {};

    parameters.forEach( function ( parameter, i ) {
      c[ parameter.name ] = candidate[ i ];
    } );

  } );

}
