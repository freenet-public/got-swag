var _ = require( 'lodash' );
var listVars = require( './listVars' );

module.exports = exampleVars;

function exampleVars( api, vars ) {

  vars = vars || {};

  // parse definition examples
  _.forOwn( api.definitions, function ( definition, name ) {
    parseDefinition( definition, name, vars );
  } );

  // parse response examples
  _.forOwn( api.paths, function ( operations, path ) {
    _.forOwn( operations, function ( operation, method ) {
      _.forOwn( operation.responses, function ( response, statusCode ) {
        if ( statusCode >= 400 ) return;
        _.forOwn( response.examples, function ( example, contentType ) {
          parseAndListVars( example, vars );
        } );
      } );
    } );
  } );

  return vars;

}

function parseDefinition( definition, name, vars ) {
  if ( definition.properties ) {
    parseAndListVars( definition.example, vars );
    _.forOwn( definition.properties, function ( property, name ) {
      parseDefinition( property, name, vars );
    } );
  } else if ( definition.type === 'array' ) {
    parseAndListVars( definition.example, vars );
    parseDefinition( definition.items, name, vars );
  } else if ( definition.example ) {
    var t = {};
    t[ name ] = definition.example;
    listVars( t, vars );
  }
}

function parseAndListVars( example, vars ) {
  try {
    listVars( typeof example === 'string' ? JSON.parse( example ) : example, vars );
  } catch ( ex ) {
    // ignore
  }
}
