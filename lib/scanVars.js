var _ = require( 'lodash' );
var assert = require( 'assert' );

module.exports = scanVars;

// scan a value for variables and values
function scanVars( object, vars ) {

  vars = vars || {};

  if ( Array.isArray( object ) ) {

    // descend
    object.forEach( function ( item ) {
      scanVars( item, vars );
    } );

  } else if ( typeof object === 'object' && object ) {

    _.forOwn( object, function ( value, name ) {

      var list = vars[ name ] = vars[ name ] || [];

      // push if not exists
      try {
        list.forEach( function ( item ) {
          assert.notDeepEqual( value, item );
        } );
        list.push( value );
      } catch ( ex ) {
        // exists
      }

      // descend
      scanVars( value, vars );

    } );

  }

  return vars;

}
