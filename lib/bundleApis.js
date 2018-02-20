var _ = require( 'lodash' );
var parser = require( 'json-schema-ref-parser' );
var modify = require( './modify' );
var url = require( 'url' );

module.exports = bundleApis;

function bundleApis( apis ) {

  var mainUrl = apis[ 0 ];
  var mainUrlParsed = typeof mainUrl === 'string' ? url.parse( mainUrl ) : {};

  return Promise.all( apis.map( function ( api ) {
    return parser.dereference( api );
  } ) ).then( function ( list ) {

    // deep merge apis using lodash merge and modify()
    var api = list.reduce( function ( api, other ) {
      return modify( _.merge( api, other ) );
    }, {} );

    // infer schemes and host from main url
    api[ 'x-main-url' ] = mainUrl;
    api.host = api.host || mainUrlParsed.host || 'localhost';
    api.schemes = api.schemes ||
      ( mainUrlParsed.protocol ? [ mainUrlParsed.protocol.replace( ':', '' ) ] : [ 'http' ] );
    console.log('target host :"'+api.host+'"');
    return api;

  } );

}
