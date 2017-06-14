module.exports = findOperation;

function findOperation( options ) {

  if ( options.operation ) return options.operation;

  var api = options.api;
  var operationId = options.operationId;

  if ( !api ) return;
  if ( !operationId ) return;

  for ( var path in api.paths ) {
    var operations = api.paths[ path ];
    for ( var method in operations ) {
      var operation = operations[ method ];
      if ( operation.operationId === operationId ) {
        return Object.assign( operation, {
          method: method,
          path: path
        } );
      }
    }
  }

}
