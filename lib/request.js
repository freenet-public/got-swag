var http = require( 'http' );
var https = require( 'https' );
var _ = require( 'lodash' );
var url = require( 'url' );
var buffer = require( './buffer' );
var toStream = require( './toStream' );
var fs = require('fs'); 
var FormData = require('form-data'); 
var headerSafe = require('./headerSafe');


module.exports = request;

function request( options ) {

    // build actual options
	var actual = _.omit( options, [ 'url', 'query', 'maxRedirects', 'data', 'http_header_safe' ] );
	var contentType = '';
  //Checking if any header needs to be http header safe
	if(options.headers) {
        if (options.headers['http_header_safe']) {
            options.headers[options.headers['http_header_safe']] =
                headerSafe(options.headers[options.headers['http_header_safe']]);
        }
        if(options.headers['content-type']) {
        	contentType = options.headers['content-type'];
		}
    }
 


  // parse url and assign
  if ( options.url ) _.assign( actual, _.omitBy( url.parse( options.url ), _.isNil ) );

  // append query to path
  if ( options.query ) {
    actual.path += url.format( { query: _.omitBy( options.query, _.isNil ) } );
  }

  var h = ( actual.protocol && actual.protocol.toLowerCase() === 'https:' ) ?
    https :
    http;
	
	return new Promise( function ( resolve, reject ) {
		var req = '';
			
		if ( contentType === 'application/octet-stream') {
			fs.readFile(options.data, function (err, databuffer ) {
				var reqToSent = h.request(actual).on( 'error', reject ).on( 'response', function ( res ) {
					validate_response (options, res, resolve);
        });
				if (options.data) {
					reqToSent.write(databuffer);
				}
				reqToSent.end();
			});		
		}
		else if( contentType === 'multipart/form-data') {
			var form = new FormData(); 
			form.append('file', fs.createReadStream(options.data)); 
			for (const [key, value] of Object.entries(form.getHeaders())) {
				options.headers[key] = value;
			}
      req = form;
		}
		else {
			req = toStream( options.data );
		}
		if(req) {		
			req.pipe( h.request( actual )
         .on( 'error', reject )
			  .on( 'response', function ( res ) {
				  validate_response (options, res, resolve);
        } ) );
		  }	
    });
}

//Validating and returning the response
function validate_response(options, res, resolve)
{
	if ( options.maxRedirects > 0 &&( res.statusCode === 301 || res.statusCode === 302 ) ) 
	{
		return resolve( request( 
		{
			url: res.headers.location,
			maxRedirects: options.maxRedirects - 1,
			headers: options.headers,
			auth: options.auth,
			data: options.data
	    } ) );
	}
	return resolve( options.buffer ? buffer( res ) : res );
}