var apiRequest = require( './apiRequest' );
var monkeyParameter = require( './monkeyParameter' );

module.exports = monkeyRequest;

function monkeyRequest( options ) {

  var api = options.api;
  var operations = api.paths[ options.path ];
  var operation = options.operation ||
    operations && operations[ options.method || 'get' ] || {};
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
