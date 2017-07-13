var http = require( 'http' );
var https = require( 'https' );
var url = require( 'url' );
var _ = require( 'lodash' );
var buffer = require( './buffer' );
var toStream = require( './toStream' );

module.exports = request;

// TODO drop lodash dependency, make this standalone?

function request( options ) {

  // if options is a string, use as url
  if ( typeof options === 'string' ) {
    options = _.omitBy( url.parse( options ), _.isNil );
  }

  var root = options.root;
  var method = options.method || 'GET';
  var body = options.body;
  var followRedirects = isFinite( options.followRedirects ) ?
    options.followRedirects : 5;

  // build actual options
  var actual = _.omit( options, [
    'url', 'query', 'followRedirects', 'body', 'root', 'end', 'buffer'
  ] );

  // parse url and assign
  if ( options.url ) {
    Object.assign( actual, _.omitBy( url.parse( options.url ), _.isNil ) );
  }

  // append query to path
  if ( options.query ) {
    actual.path += url.format( { query: _.omitBy( options.query, _.isNil ) } );
  }

  // determine protocol
  var h = ( actual.protocol && actual.protocol.toLowerCase() === 'https:' ) ?
    https :
    http;

  // build request and add listeners
  var req = h.request( actual ).on( 'error', function ( err ) {

    // re-emit if this is a follow-up request
    if ( options.root ) root.emit( 'error', err );

  } ).on( 'response', function ( res ) {

    res.url = url.format( actual );

    var redirect = res.statusCode === 301 ||
      res.statusCode === 302 ||
      res.statusCode === 307 ||
      res.statusCode === 308;
    if ( redirect && res.headers.location && followRedirects > 0 ) {
      return root.emit( 'redirect', res );
    }

    root.emit( 'final-response', res );

    if ( options.buffer !== false ) {
      buffer( res ).on( 'buffer', function ( buf ) {
        res.body = buf;
        root.emit( 'final-body', res );
      } );
    }

  } ).on( 'redirect', function ( res ) {

    // handle relative locations
    // don't use url.resolve, we only want the protocol and host
    var location = url.parse( res.headers.location );
    if ( !location.host ) {
      location.protocol = actual.protocol;
      location.host = actual.host;
    }

    // if we need to resend he body, try to rewind
    var rewind = res.statusCode === 307 || res.statusCode === 308;
    if ( rewind && body && typeof body.rewind === 'function' ) {
      body = body.rewind();
    }

    // build follow-up request, passing root
    var follow = request( Object.assign( {}, options, {
      method: rewind ? method : 'GET',
      url: url.format( location ),
      followRedirects: followRedirects - 1,
      body: rewind ? body : undefined,
      root: root
    } ) );

    root.emit( 'follow', follow );

  } );

  // set created request as root unless root was given
  root = root || req;

  // write body or finish request unless finishing was explicitly disabled
  if ( body ) {
    toStream( body ).pipe( req );
  } else if ( options.end !== false ) {
    req.end();
  }

  return req;

}
