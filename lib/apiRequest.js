var url = require( 'url' );
var _ = require( 'lodash' );
var findOperation = require( './findOperation' );

module.exports = apiRequest;

// build request options for a swagger-powered api
// api, operation and parameters are respected and/or inferred
function apiRequest( options ) {

  // infer request from api and operation
  var api = options.api || {};

  var schemes = api.schemes || [ 'http' ];
  var host = api.host || '';
  var protocol = ( schemes.indexOf( 'https' ) >= 0 ?
    'https' : schemes[ 0 ] ) + ':';
  var hostname = host.replace( /:\d+$/, '' );
  var port = hostname.length < host.length ?
    parseInt( api.host.substr( hostname.length + 1 ) ) :
    undefined;

  var operation = findOperation( options );
  if ( !operation ) throw new Error( 'Undefined operation ' + options.operationId );

  var method = operation.method;
  var path = ( api.basePath || '' ) + operation.path;
  var parameters = operation.parameters || [];
  var parameterValues = options.parameters || {};

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
    method: method,
    path: path,
    query: {},
    headers: {}
  } );

  // remove meta
  delete actual.api;
  delete actual.auth;

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

  return actual;

}
