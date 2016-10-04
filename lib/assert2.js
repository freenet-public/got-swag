module.exports = {

  match: function ( string, pattern ) {
    if ( !string.match( pattern ) ) {
      throw new Error( '"' + string + '"" does not match ' + pattern );
    }
  }

};
