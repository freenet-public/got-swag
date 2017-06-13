var EventEmitter = require( 'events' );
var url = require( 'url' );
var querystring = require( 'querystring' );
var parse5 = require( 'parse5' );
var request = require( './request' );

module.exports = auth;

// authenticates using a swagger security definition
// returns request options (query params, headers, or basic auth)
// if omitted, scopes are inferred
function auth( options ) {

  var bus = new EventEmitter();

  var api = options.api || {};
  var operation = options.operation || {};
  var id = options.id;
  var securityDefinitions = api.securityDefinitions || {};
  var security = operation.security || api.security || [];
  var definition = securityDefinitions[ id ] || {};
  var scopes = options.scopes || inferScopes( { security: security, id: id } );
  var credentials = options.credentials;

  setTimeout( function () {

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
      throw new Error( 'Invalid definition type ' + definition.type );

    }

  }, 1 );

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

  var definition = options.definition;
  var credentials = options.credentials;

  if ( !credentials.key || credentials.key.length === 0 ) {
    throw new Error( 'API key is required' );
  }

  switch ( definition.in ) {

  case 'query':
    var query = {};
    query[ definition.name ] = credentials.key;
    return options.bus.emit( 'auth', { query: query } );

  case 'header':
    var headers = {};
    headers[ definition.name ] = credentials.key;
    return options.bus.emit( 'auth', { headers: headers } );

  default:
    throw new Error( 'Invalid apiKey.in ' + definition.in );

  }

}

function basic( options ) {

  var credentials = options.credentials;
  return options.bus.emit( 'auth', {
    auth: credentials.username + ':' + credentials.password
  } );

}

function oauth2( options ) {

  var definition = options.definition;

  switch ( definition.flow ) {

  case 'application':
    return application( options );

  case 'password':
    return password( options );

  case 'implicit':
    return implicit( options );

  default:
    throw new Error( 'OAuth 2.0 ' + definition.flow + ' flow is not supported' );

  }

}

function application( options ) {

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

  return watchRequest( { req: req, bus: options.bus } );

}

function password( options ) {

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

  return watchRequest( { req: req, bus: options.bus } );

}

function implicit( options ) {

  var definition = options.definition;
  var credentials = options.credentials;
  var scopes = options.scopes;

  var req = request( {
    method: 'GET',
    url: definition.authorizationUrl + '?' + querystring.stringify( {
      client_id: credentials.key,
      redirect_uri: credentials.redirect
    } ),
    maxRedirects: options.maxRedirects || 5
  } );

  watchRequest( { req: req, bus: options.bus } );
  tryLogin( { req: req, bus: options.bus, credentials: credentials } );

  return options.bus;

}

//

function tryLogin( options ) {

  options.req.on( 'response', function ( res ) {

    var index = 0;

    return parseForms( { res: res } ).on( 'forms', nextForm );

    function nextForm( forms ) {

      if ( index >= forms.length ) {
        options.bus.emit( 'error', new Error( 'Could not login' ) );
      }

      var form = forms[ index++ ];

      tryLoginForm( { bus: options.bus, res: res, forms: forms } );

    }

  } );

}

function tryLoginForm( options ) {

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

  return watchRequest( { req: req, bus: options.bus } );

}

function watchRequest( options ) {

  // on a redirect, emit token or code if present in the location fragment
  options.req.on( 'redirect', function ( res ) {

    var u = res && url.parse( res.location );

    if ( u && u.hash ) {
      var h = querystring.parse( u.hash.slice( 1 ) );
      if ( h.token ) options.bus.emit( 'token', h.token );
      if ( h.code ) options.bus.emit( 'code', h.code );
    }

  } );

  // on a response, emit access token if present in the json response
  options.req.on( 'response', function ( res ) {

    bufferResponse( res ).on( 'json', function ( json ) {
      if ( json.access_token ) options.bus.emit( 'token', json.access_token );
      //if ( json.refresh_token ) req.emit( 'refreshToken', json.refresh_token );
    } );

  } );

}

//

function createFormParser( options ) {

  var parser = new parse5.SAXParser();
  var forms = [];
  var form;

  parser.on( 'startTag', function ( tagName, attrs ) {

    switch ( tagName ) {

    case 'form':
      var action = getAttr( attrs, 'action' );
      form = { action: action, data: {} };
      forms.push( form );
      break;

    case 'input':
      var name = getAttr( attrs, 'name' );
      var value = getAttr( attrs, 'value' );
      if ( form ) form.data[ name ] = value;
      break;

    }

  } );

  parser.on( 'finish', function () {
    parser.emit( 'forms', forms );
  } );

  return parser;

}

function getAttr( attrs, attrName ) {
  return attrs.filter( function ( attr ) {
    return attr.name === attrName;
  } ).map( function ( attr ) {
    return attr.value;
  } )[ 0 ];
}

//

function bearerToken( token ) {

  return {
    headers: {
      Authorization: 'Bearer ' + token
    }
  };

}
