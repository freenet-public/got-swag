var http = require( 'http' );
var https = require( 'https' );
var EventEmitter = require( 'events' );
var url = require( 'url' );
var _ = require( 'lodash' );
var buffer = require( './buffer' );
var toStream = require( './toStream' );

module.exports = request;

// TODO make body input stream a caching passthrough for 307s
// otherwise we're stuck with "body" option which is potentially not rewindable

function request( options ) {

  // build actual options
  var actual = _.omit( options, [
    'url', 'query', 'maxRedirects', 'body', 'original', 'end'
  ] );

  // parse url and assign
  if ( options.url ) _.assign( actual, _.omitBy( url.parse( options.url ), _.isNil ) );

  // append query to path
  if ( options.query ) {
    actual.path += url.format( { query: _.omitBy( options.query, _.isNil ) } );
  }

  var maxRedirects = isFinite( options.maxRedirects ) ? options.maxRedirects : 5;

  var h = ( actual.protocol && actual.protocol.toLowerCase() === 'https:' ) ?
    https :
    http;

  var req = h.request( actual ).on( 'error', function ( err ) {

    if ( options.original ) options.original.emit( 'error', err );

  } ).on( 'response', function ( res ) {

    var original = options.original || req;

    if ( res.headers.location && maxRedirects > 0 ) {
      original.emit( 'redirect', res );
    } else {
      res.finalUrl = url.format( actual );
      original.emit( 'final-response', res );
    }

  } ).on( 'redirect', function ( res ) {

    var original = options.original || req;

    var redirected = request( {
      method: res.statusCode === 307 ? options.method || 'GET' : 'GET',
      url: res.headers.location,
      maxRedirects: maxRedirects - 1,
      headers: options.headers,
      auth: options.auth,
      body: res.statusCode === 307 ? options.body : null,
      original: original
    } );

    original.emit( 'redirected-request', redirected );

  } );

  if ( options.body ) {
    toStream( options.body ).pipe( req );
  } else if ( options.end !== false ) {
    req.end();
  }

  return req;

}
