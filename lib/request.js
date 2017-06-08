var http = require( 'http' );
var https = require( 'https' );
var _ = require( 'lodash' );
var url = require( 'url' );
var buffer = require( './buffer' );
var toStream = require( './toStream' );

module.exports = request;

function request( options ) {

  // build actual options
  var actual = _.omit( options, [ 'url', 'query', 'maxRedirects', 'body' ] );

  // parse url and assign
  if ( options.url ) _.assign( actual, _.omitBy( url.parse( options.url ), _.isNil ) );

  // append query to path
  if ( options.query ) {
    actual.path += url.format( { query: _.omitBy( options.query, _.isNil ) } );
  }

  var h = ( actual.protocol && actual.protocol.toLowerCase() === 'https:' ) ?
    https :
    http;

  return new Promise( function ( resolve, reject ) {

    toStream( options.body ).pipe( h.request( actual )
      .on( 'error', reject )
      .on( 'response', function ( res ) {
        if ( options.maxRedirects > 0 &&
          ( res.statusCode === 301 || res.statusCode === 302 ) ) {
          return resolve( request( {
            url: res.headers.location,
            maxRedirects: options.maxRedirects - 1,
            headers: options.headers,
            auth: options.auth,
            body: options.body
          } ) );
        }
        resolve( options.buffer ? buffer( res ) : res );
      } ) );

  } ).then( function ( res ) {
    res.body = res.buffer;
    return res;
  } );

}
