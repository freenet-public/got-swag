var _ = require( 'lodash' );

module.exports = modify;

function modify( json ) {

  var modifications = [];
  for ( var property in json ) {
    if ( json.hasOwnProperty( property ) && property.match( /^#/ ) ) {
      modifications.push( {
        path: property,
        value: json[ property ]
      } );
    }
  }

  modifications.sort( function ( a, b ) {
    return a.path.length - b.path.length;
  } ).forEach( function ( modification ) {

    var path = modification.path.trim()
      .replace( /^#\//, '' )
      .replace( /\//g, '.' )
      .replace( /__/g, '/' );
    var value = modification.value;
    var current = path === '' ? json : _.get( json, path );
    var modified;

    if ( value && value.$push ) {
      modified = current || [];
      if ( _.isArray( value.$push ) ) {
        modified.push.apply( modified, value.$push );
      } else {
        modified.push( value.$push );
      }
    } else if ( value && value.$unshift ) {
      modified = current || [];
      if ( _.isArray( value.$unshift ) ) {
        modified.unshift.apply( modified, value.$unshift.reverse() );
      } else {
        modified.unshift( value.$unshift );
      }
    } else if ( value && value.$assign ) {
      modified = _.assign( current || {}, value.$assign );
    } else if ( value && value.$merge ) {
      modified = _.merge( current || {}, value.$merge );
    } else {
      modified = value;
    }

    json = path === '' ? modified : _.set( json, path, modified );

    delete json[ modification.path ];

  } );

  return json;

}
