var parse5 = require( 'parse5' );
var querystring = require( 'querystring' );
var request = require( './request' );

module.exports = auth;

// authenticates using a swagger security definition
// returns request options (query params, headers, or basic auth)
// if omitted, scopes are inferred
function auth( options ) {

  var api = options.api || {};
  var operation = options.operation || {};
  var id = options.id;
  var securityDefinitions = api.securityDefinitions || {};
  var security = operation.security || api.security || [];
  var definition = securityDefinitions[ id ] || {};
  var scopes = options.scopes || inferScopes( { security: security, id: id } );
  var credentials = options.credentials;

  return new Promise( function ( resolve, reject ) {

    switch ( definition.type ) {

    case 'oauth2':
      return resolve( oauth2( {
        definition: definition,
        credentials: credentials,
        scopes: scopes
      } ) );

    case 'apiKey':
      return resolve( apiKey( {
        definition: definition,
        credentials: credentials,
        scopes: scopes
      } ) );

    case 'basic':
      return resolve( {
        auth: credentials.username + ':' + credentials.password
      } );

    default:
      reject( new Error( 'Invalid definition type ' + definition.type ) );

    }

  } );

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

  return request( {
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
    buffer: true
  } ).then( bearerToken );

}

function password( options ) {

  var definition = options.definition;
  var credentials = options.credentials;
  var scopes = options.scopes;

  return request( {
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
    buffer: true
  } ).then( bearerToken );

}

function implicit( options ) {

  var definition = options.definition;
  var credentials = options.credentials;
  var scopes = options.scopes;

  return request( {
    method: 'GET',
    url: definition.authorizationUrl + querystring.stringify( {
      client_id: credentials.key,
      redirect_uri: credentials.redirect
    } ),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  } ).then(  ).then( function ( res ) {

    var u = url.parse( res.finalUrl );

  } );

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
    return resolve( { query: query } );

  case 'header':
    var headers = {};
    headers[ definition.name ] = credentials.key;
    return { headers: headers };

  default:
    throw new Error( 'Invalid apiKey.in ' + definition.in );

  }

}

//

function tryLogin( options ) {

  var res = options.res;

  // if the last request had a token in its fragment, we're happy, stop right here
  var u = res && url.parse( res.finalUrl );
  if ( u && u.hash ) {
    var h = querystring.parse( u.hash.slice( 1 ) );
    if ( h.token ) return Promise.resolve( h.token );
  }

  // otherwise, we'll have to fill some form
  if ( options.forms.length === 0 ) {
    throw new Error( 'Could not login' );
  }

  var form = options.forms[ 0 ];

  return request( {
    method: 'POST',
    url: options
  } ).then( function ( res ) {
    return parseForms( { res: res } );
  } ).catch( function ( err ) {
    console.log( err.stack );
    return null;
  } ).then( function ( res ) {
    return tryLogin( Object.assign( {}, options, {
      forms: options.forms.slice( 1 )
    } ) );
  } );

}

function parseForms( options ) {

  return new Promise( function ( resolve, reject ) {

    var parser = new parse5.SAXParser();
    var forms = [];
    var form;

    parser.on( 'startTag', function ( tagName, attrs ) {

      switch ( tagName ) {
      case 'form':
        var action = attrs.filter( function ( attr ) {
          return attr.name === 'action';
        } ).map( function ( attr ) {
          return attr.value;
        } )[ 0 ];
        form = { action: action, names: [] };
        forms.push( form );
        break;
      case 'input':
        var name = attrs.filter( function ( attr ) {
          return attr.name === 'name';
        } ).map( function ( attr ) {
          return attr.value;
        } )[ 0 ];
        if ( form ) form.names.push( name );
        break;
      }

    } );

    parser.on( 'finish', function () {
      resolve( Object.assign( {}, options, { forms: forms } ) );
    } );

    parser.on( 'error', reject );

    options.res.pipe( parser );

  } );

}
