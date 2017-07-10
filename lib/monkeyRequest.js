var apiRequest = require( './apiRequest' );
var findOperation = require( './findOperation' );
var monkeyParameter = require( './monkeyParameter' );

module.exports = monkeyRequest;

function monkeyRequest( options ) {

  var api = options.api;
  var operation = findOperation( options );
  var parameters = operation.parameters || [];
  var parameterValues = {};

  parameters.forEach( function ( parameter ) {
    parameterValues[ parameter.name ] = monkeyParameter( {
      memory: options.memory,
      parameter: parameter
    } );
  } );

  return apiRequest( Object.assign( {}, options, {
    parameters: parameterValues
  } ) );

}
