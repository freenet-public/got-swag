var querystring = require( 'querystring' );
var request = require( './request' );

module.exports = auth;

// authenticates using a swagger security definition
// returns request options (query params, headers, or basic auth)
// if omitted, scopes are inferred
function auth( api, operation, id, credentials, scopes ) {

  var security = operation && operation.security || api.security || [];
  var definition = api.securityDefinitions[ id ];
  scopes = scopes || inferScopes( security, id );

  return new Promise( function ( resolve, reject ) {

    switch ( definition.type ) {

    case 'oauth2':
      return resolve( oauth2( definition, credentials, scopes ) );

    case 'apiKey':
      return resolve( apiKey( definition, credentials ) );

    case 'basic':
      return resolve( {
        auth: credentials.username + ':' + credentials.password
      } );

    default:
      reject( new Error( 'Invalid definition type ' + definition.type ) );

    }

  } );

}

function inferScopes( security, id ) {

  return security.map( function ( item ) {
    return item[ id ];
  } ).filter( function ( item ) {
    return item;
  } ).sort( function ( a, b ) {
    return b.length - a.length;
  } )[ 0 ];

}

function oauth2( definition, credentials, scopes ) {

  switch ( definition.flow ) {

  case 'application':
    return application( definition, credentials, scopes );

  case 'password':
    return password( definition, credentials, scopes );

  default:
    throw new Error( 'The OAuth2 ' + definition.flow + ' flow is not supported' );

  }

}

function application( definition, credentials, scopes ) {

  return request( {
    method: 'POST',
    url: definition.tokenUrl,
    data: querystring.stringify( {
      grant_type: 'client_credentials',
      client_id: credentials.key,
      client_secret: credentials.secret,
      scope: scopes ? scopes.join( ' ' ) : undefined
    } ),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    buffer: true
  } ).then( bearerToken );

}

function password( definition, credentials, scopes ) {

  return request( {
    method: 'POST',
    url: definition.tokenUrl,
    data: querystring.stringify( {
      grant_type: 'password',
      client_id: credentials.key,
      client_secret: credentials.secret,
      username: credentials.username,
      password: credentials.password,
      scope: scopes ? scopes.join( ' ' ) : undefined
    } ),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    buffer: true
  } ).then( bearerToken );

}

function bearerToken( res ) {

  if ( res.statusCode >= 400 ) {
    throw new Error( res.statusCode + ': ' + res.buffer );
  }

  return {
    headers: {
      Authorization: 'Bearer ' + JSON.parse( res.buffer ).access_token
    }
  };

}

function apiKey( definition, credentials ) {

  if ( !credentials.key || credentials.key.length === 0 ) {
    throw new Error( 'API key is required' );
  }

  switch ( definition.in ) {

  case 'query':
    var query = {};
    query[ definition.name ] = credentials.key;
    return resolve( { query: query } );

  case 'header':
    var headers = {};
    headers[ definition.name ] = credentials.key;
    return { headers: headers };

  default:
    throw new Error( 'Invalid apiKey.in ' + definition.in );

  }

}
