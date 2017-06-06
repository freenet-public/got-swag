var _ = require( 'lodash' );
var scanVars = require( './scanVars' );

module.exports = scanExampleVars;

function scanExampleVars( api, vars ) {

  vars = vars || {};

  // parse definition examples
  _.forOwn( api.definitions, function ( definition, name ) {
    parseDefinition( definition, name, vars, 0 );
  } );

  // parse response examples
  _.forOwn( api.paths, function ( operations, path ) {
    _.forOwn( operations, function ( operation, method ) {
      _.forOwn( operation.responses, function ( response, statusCode ) {
        if ( statusCode >= 400 ) return;
        _.forOwn( response.examples, function ( example, contentType ) {
          parseAndScanVars( example, vars );
        } );
      } );
    } );
  } );

  return vars;

}

function parseDefinition( definition, name, vars, level ) {
  if ( level > 5 ) return;
  if ( definition.properties ) {
    parseAndScanVars( definition.example, vars );
    _.forOwn( definition.properties, function ( property, name ) {
      parseDefinition( property, name, vars, level + 1 );
    } );
  } else if ( definition.type === 'array' ) {
    parseAndScanVars( definition.example, vars );
    parseDefinition( definition.items, name, vars, level + 1 );
  } else if ( definition.example ) {
    var t = {};
    t[ name ] = definition.example;
    scanVars( t, vars );
  }
}

function parseAndScanVars( example, vars ) {
  try {
    scanVars( typeof example === 'string' ? JSON.parse( example ) : example, vars );
  } catch ( ex ) {
    // ignore
  }
}
