var request = require( './request' );
var url = require( 'url' );
var _ = require( 'lodash' );

module.exports = apiRequest;

function apiRequest( options ) {

  // infer defaults from api
  var api = options.api;
  var protocol = ( api.schemes.indexOf( 'https' ) >= 0 ?
    'https' : api.schemes[ 0 ] ) + ':';
  var hostname = api.host.replace( /:\d+$/, '' );
  var port = hostname.length < api.host.length ?
    parseInt( api.host.substr( hostname.length + 1 ) ) :
    undefined;
  var path = ( api.basePath || '' ) + options.path;

  // build actual options
  var actual = _.assign( {}, options );

  // fix host vs. hostname
  if ( actual.host ) {
    actual.hostname = actual.host;
    delete actual.host;
  }

  _.defaults( actual, {
    protocol: protocol,
    hostname: hostname,
    port: port,
    path: path
  } );

  // add auth options
  actual.headers = _.assign( {
    Accept: 'application/json'
  }, options.auth.headers, actual.headers );
  actual.query = _.assign( {}, options.auth.query, actual.query );
  actual.auth = actual.auth || options.auth.auth;

  // automatic json content
  if ( actual.body &&
      typeof actual.body !== 'string' &&
      !Buffer.isBuffer( actual.body ) ) {
    actual.body = JSON.stringify( actual.body );
    actual.headers[ 'Content-Type' ] = 'application/json';
  }

  // always buffer
  actual.buffer = true;

  return request( actual ).then( function ( res ) {

    try {
      res.string = res.body.toString( 'utf-8' );
    } catch ( ex ) {
      // ignore
    }

    try {
      res.json = JSON.parse( res.body );
    } catch ( ex ) {
      // ignore
    }

    return {
      req: actual,
      res: res
    };

  } ).catch( function ( err ) {
    err.req = actual;
    throw err;
  } );

}
