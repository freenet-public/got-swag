var EventEmitter = require( 'events' );
var url = require( 'url' );
var querystring = require( 'querystring' );
var request = require( './request' );
var createFormParser = require( './createFormParser' );

module.exports = auth;

// authenticates using a swagger security definition
// returns request options (query params, headers, or basic auth)
// if omitted, scopes are inferred
function auth( options ) {

  var bus = new EventEmitter();

  var api = options.api || {};
  var operations = api.paths[ options.path ];
  var operation = options.operation ||
    operations && operations[ options.method || 'get' ] || {};
  var id = options.id;
  var securityDefinitions = api.securityDefinitions || {};
  var security = operation.security || api.security || [];
  var definition = securityDefinitions[ id ] || {};
  var scopes = options.scopes || inferScopes( { security: security, id: id } );
  var credentials = options.credentials;

  function branch() {

    switch ( definition.type ) {

    case 'oauth2':
      return oauth2( {
        bus: bus,
        definition: definition,
        credentials: credentials,
        scopes: scopes
      } );

    case 'apiKey':
      return apiKey( {
        bus: bus,
        definition: definition,
        credentials: credentials,
        scopes: scopes
      } );

    case 'basic':
      return basic( {
        bus: bus,
        credentials: credentials
      } );

    default:
      bus.emit( 'error', new Error( 'Invalid definition type ' + definition.type ) );

    }

  }

  setTimeout( branch, 1 );

  return bus;

}

function inferScopes( options ) {

  return options.security.map( function ( item ) {
    return item[ options.id ];
  } ).filter( function ( item ) {
    return item;
  } ).sort( function ( a, b ) {
    return b.length - a.length;
  } )[ 0 ];

}

//

function apiKey( options ) {

  var bus = options.bus;
  var definition = options.definition;
  var credentials = options.credentials;

  if ( !credentials.key || credentials.key.length === 0 ) {
    bus.emit( 'error', new Error( 'API key is required' ) );
  }

  switch ( definition.in ) {

  case 'query':
    var query = {};
    query[ definition.name ] = credentials.key;
    return bus.emit( 'auth', { query: query } );

  case 'header':
    var headers = {};
    headers[ definition.name ] = credentials.key;
    return bus.emit( 'auth', { headers: headers } );

  default:
    bus.emit( 'error', new Error( 'Invalid apiKey.in ' + definition.in ) );

  }

}

function basic( options ) {

  var bus = options.bus;
  var credentials = options.credentials;

  return options.bus.emit( 'auth', {
    auth: credentials.username + ':' + credentials.password
  } );

}

function oauth2( options ) {

  var bus = options.bus;
  var definition = options.definition;

  switch ( definition.flow ) {

  case 'application':
    return application( options );

  case 'password':
    return password( options );

  case 'implicit':
    console.log( options );
    return implicit( options );

  default:
    bus.emit( 'error', new Error(
      'OAuth 2.0 ' + definition.flow + ' flow is not supported'
    ) );

  }

}

function application( options ) {

  var bus = options.bus;
  var definition = options.definition;
  var credentials = options.credentials;
  var scopes = options.scopes;

  var req = request( {
    method: 'POST',
    url: definition.tokenUrl,
    body: querystring.stringify( {
      grant_type: 'client_credentials',
      client_id: credentials.key,
      client_secret: credentials.secret,
      scope: scopes ? scopes.join( ' ' ) : undefined
    } ),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    maxRedirects: options.maxRedirects || 5
  } );

  return watchRequest( { req: req, bus: bus } );

}

function password( options ) {

  var bus = options.bus;
  var definition = options.definition;
  var credentials = options.credentials;
  var scopes = options.scopes;

  var req = request( {
    method: 'POST',
    url: definition.tokenUrl,
    body: querystring.stringify( {
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
    maxRedirects: options.maxRedirects || 5
  } );

  return watchRequest( { req: req, bus: bus } );

}

function implicit( options ) {

  var bus = options.bus;
  var definition = options.definition;
  var credentials = options.credentials;
  var scopes = options.scopes;

  var req = request( {
    method: 'GET',
    url: definition.authorizationUrl + '?' + querystring.stringify( {
      client_id: credentials.key,
      redirect_uri: credentials.redirect
    } )
  } );

  watchRequest( { req: req, bus: bus } );
  //tryLogin( { req: req, bus: bus, credentials: credentials } );

  return bus;

}

//

function tryLogin( options ) {

  var bus = options.bus;
  var req = options.req;

  req.on( 'response', function ( res ) {

    var index = 0;
    var parser = createFormParser();

    return res.pipe( parser ).on( 'forms', nextForm );

    function nextForm( forms ) {

      if ( index >= forms.length ) {
        bus.emit( 'error', new Error( 'Could not login' ) );
      }

      var bus = options.bus;
      var form = options.form;

      var req = request( {
        method: 'POST',
        url: url.resolve( res.finalUrl, form.action ),
        body: querystring.stringify( Object.assign( {}, form.data, {
          username: credentials.username,
          password: credentials.password
        } ) ),
        maxRedirects: options.maxRedirects || 5,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      } );

      return watchRequest( { req: req, bus: bus } );

    }

  } );

  return bus;

}

// watch a request for tokens and codes on redirect or JSON response
function watchRequest( options ) {

  var bus = options.bus;
  var req = options.req;

  // on a redirect, emit token or code if present in the location fragment
  req.on( 'redirect', function ( res ) {

    console.log( res.location );

    var u = res && url.parse( res.location );

    if ( u && u.hash ) {
      var h = querystring.parse( u.hash.slice( 1 ) );
      if ( h.token ) bus.emit( 'token', h.token );
      if ( h.code ) bus.emit( 'code', h.code );
    }

  } );

  // on a response, emit access token if present in the json response
  req.on( 'response', function ( res ) {

    console.log( res.statusCode );

    bufferResponse( res ).on( 'json', function ( json ) {
      if ( json.access_token ) bus.emit( 'token', json.access_token );
      //if ( json.refresh_token ) req.emit( 'refreshToken', json.refresh_token );
    } );

  } );

  req.on( 'error', function ( err ) {
    bus.emit( 'error', err );
  } );

  return bus;

}

//

function bearerToken( token ) {

  return {
    headers: {
      Authorization: 'Bearer ' + token
    }
  };

}
