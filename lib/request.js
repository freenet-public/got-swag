var http = require( 'http' );
var https = require( 'https' );
var EventEmitter = require( 'events' );
var url = require( 'url' );
var _ = require( 'lodash' );
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

  var emitter = options.emitter || new EventEmitter();

  var req = h.request( actual ).on( 'error', function ( err ) {
    emitter.emit( 'error', err );
  } ).on( 'response', function ( res ) {

    // handle redirects
    if ( options.maxRedirects > 0 &&
      ( res.statusCode === 301 || res.statusCode === 302 ) ) {

      emitter.emit( 'redirect', res );

      return request( {
        url: res.headers.location,
        maxRedirects: options.maxRedirects - 1,
        headers: options.headers,
        auth: options.auth,
        body: options.body,
        emitter: emitter
      } );

    }

    emitter.emit( 'response', res );

  } );

  if ( options.body ) toStream( options.body ).pipe( req );

  return req;

}
