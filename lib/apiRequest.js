var request = require( './request' );
var url = require( 'url' );
var _ = require( 'lodash' );

module.exports = apiRequest;

// run a request against a swagger-powered api
// api, operation and parameters are respected and/or inferred
function apiRequest( options ) {

  // infer request from api and operation
  var api = options.api || {};
  var schemes = api.schemes || [ 'http' ];
  var host = api.host || '';
  var operations = api.paths[ options.path ];
  var operation = operations && operations[ options.method || 'get' ] || {};
  var parameters = operation.parameters || [];
  var parameterValues = options.parameters || {};

  var protocol = ( schemes.indexOf( 'https' ) >= 0 ?
    'https' : schemes[ 0 ] ) + ':';
  var hostname = host.replace( /:\d+$/, '' );
  var port = hostname.length < host.length ?
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

  // set inferred defaults (given options take precedence)
  _.defaults( actual, {
    protocol: protocol,
    hostname: hostname,
    port: port,
    method: 'get',
    path: path,
    query: {},
    headers: {}
  } );

  // remove meta
  delete actual.api;

  // apply swagger parameters, if any
  parameters.forEach( function ( parameter ) {

    var value = parameterValues[ parameter.name ];

    if ( value === undefined || value === null ) return;

    if ( parameter.in === 'path' ) {
      actual.path = actual.path.replace( '{' + parameter.name + '}', encodeURIComponent( value ) );
    } else if ( parameter.in === 'query' ) {
      actual.query[ parameter.name ] = value;
    } else if ( parameter.in === 'header' ) {
      actual.headers[ parameter.name ] = value;
    } else if ( parameter.in === 'body' ) {
      actual.headers[ parameter.name ] = value;
    }

  } );

  // add auth options
  var auth = options.auth || {};
  actual.headers = _.assign( {
    Accept: 'application/json'
  }, auth.headers, actual.headers );
  actual.query = _.assign( {}, auth.query, actual.query );
  actual.auth = actual.auth || auth.auth;

  // automatic json content
  if ( actual.body &&
      typeof actual.body !== 'string' &&
      !Buffer.isBuffer( actual.body ) ) {
    actual.body = JSON.stringify( actual.body );
    actual.headers[ 'Content-Type' ] = actual.headers[ 'Content-Type' ] || 'application/json';
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
