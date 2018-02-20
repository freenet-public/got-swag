var request = require( './request' );
var url = require( 'url' );
var _ = require( 'lodash' );

module.exports = sandboxRequest;

function sandboxRequest( sandbox, options ) {

  // build actual options
  var actual = _.assign( {}, options );

  // infer defaults from api
  var protocol = ( sandbox.api.schemes.indexOf( 'https' ) >= 0 ?
    'https' : sandbox.api.schemes[ 0 ] ) + ':';
  var hostname = sandbox.api.host.replace( /:\d+$/, '' );
  var port = hostname.length < sandbox.api.host.length ?
    parseInt( sandbox.api.host.substr( hostname.length + 1 ) ) :
    undefined;
  var path = ( sandbox.api.basePath || '' ) + sandbox.test.path;

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
  actual.rejectUnauthorized = false, //TODO: make this via configuration? what impact does this have?
        actual.headers = _.assign( {
    Accept: 'application/json'
  }, sandbox.authOptions.headers, actual.headers );
  actual.query = _.assign( {}, sandbox.authOptions.query, actual.query );
  actual.auth = actual.auth || sandbox.authOptions.auth;

  // automatic json content
  if ( actual.data && typeof actual.data !== 'string' ) {
    actual.data = JSON.stringify( actual.data );
    actual.headers[ 'Content-Type' ] = 'application/json';
  }

  // always buffer
  actual.buffer = true;

  // store in sandbox for debugging
  sandbox.req = actual;

  if ( sandbox.trace ) sandbox.log( { REQUEST: sandbox.req } );

  return request( actual ).then( function ( res ) {
    sandbox.res = {
      status: parseInt( res.statusCode ), // TODO deprecate
      statusCode: parseInt( res.statusCode ),
      headers: res.headers,
      body: res.buffer.toString()
    };

    try {
      sandbox.res.json = JSON.parse( sandbox.res.body );
    } catch ( ex ) {
      // ignore
    }

    if ( sandbox.trace ) sandbox.log( { RESPONSE: sandbox.res } );

  } ).catch( function ( err ) {
    if ( sandbox.trace ) sandbox.log( { ERROR: err.message } );
    throw err;
  } );

}
