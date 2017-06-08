var _ = require( 'lodash' );
var scanVars = require( './scanVars' );

module.exports = scanApiVars;

// scan a swagger api for variables and values,
// e.g. examples, defaults, enums, ...
function scanApiVars( api, vars ) {

  vars = vars || {};

  // scan definition examples
  _.forOwn( api.definitions, function ( definition, name ) {
    parseDefinition( definition, name, vars, 0 );
  } );

  // scan response examples and parameters
  _.forOwn( api.paths, function ( operations, path ) {
    _.forOwn( operations, function ( operation, method ) {
      ( operation.parameters || [] ).forEach( function ( parameter ) {
        parseDefinition( parameter, parameter.name, vars, 0 );
      } );
      _.forOwn( operation.responses, function ( response, statusCode ) {
        if ( response.schema ) parseDefinition( response.schema, null, vars, 0 );
        _.forOwn( response.examples, function ( example, contentType ) {
          parseAndScanExample( example, vars );
        } );
      } );
    } );
  } );

  return vars;

}

function parseDefinition( definition, name, vars, level ) {
  if ( level > 5 ) return;
  if ( definition.properties ) {
    parseAndScanExample( definition.example, vars );
    _.forOwn( definition.properties, function ( property, name ) {
      parseDefinition( property, name, vars, level + 1 );
    } );
  } else if ( definition.type === 'array' ) {
    parseAndScanExample( definition.example, vars );
    parseDefinition( definition.items, name, vars, level + 1 );
  } else {
    var t;
    if ( definition.example ) {
      t = {};
      t[ name ] = definition.example;
      scanVars( t, vars );
    }
    if ( definition.default ) {
      t = {};
      t[ name ] = definition.default;
      scanVars( t, vars );
    }
    if ( definition.enum ) {
      definition.enum.forEach( function ( value ) {
        var t = {};
        t[ name ] = value;
        scanVars( t, vars );
      } );
    }
  }
}

function parseAndScanExample( example, vars ) {
  try {
    scanVars( typeof example === 'string' ? JSON.parse( example ) : example, vars );
  } catch ( ex ) {
    // ignore
  }
}
