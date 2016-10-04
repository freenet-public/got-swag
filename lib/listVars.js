var _ = require( 'lodash' );
var assert = require( 'assert' );

module.exports = listVars;

function listVars( object, vars ) {

  vars = vars || {};

  if ( Array.isArray( object ) ) {

    // descend
    object.forEach( function ( item ) {
      listVars( item, vars );
    } );

  } else if ( typeof object === 'object' && object ) {

    _.forOwn( object, function ( value, name ) {

      var list = vars[ name ] = vars[ name ] || [];

      // push if not exists
      try {
        list.forEach( function ( item) {
          assert.notDeepEqual( value, item );
        } );
        list.push( value );
      } catch ( ex ) {
        // exists
      }

      // descend
      listVars( value, vars );

    } );

  }

  return vars;

}
