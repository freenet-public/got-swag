var _ = require( 'lodash' );

module.exports = annotateApi;

function annotateApi( api ) {

  // add missing operation IDs
  _.forOwn( api.paths, function ( operations, path ) {
    _.forOwn( operations, function ( operation, method ) {
      operation.operationId = operation.operationId ||
        ( method + path.replace( /[{}:]/, '' ).replace( /\/./, function ( m ) {
          return m.slice( 1 ).toUpperCase();
        } ) );
    } );
  } );

  return api;

}
