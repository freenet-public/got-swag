var express = require( 'express' );
var middleware = require( 'swagger-express-middleware' );

module.exports = function () {

  var app = express();

  middleware( 'test/oauth2.yaml', app, function ( err, middleware ) {

    if ( err ) return app.emit( 'error', err );

    app.use(
      middleware.metadata(),
      middleware.CORS(),
      middleware.files(),
      middleware.parseRequest(),
      middleware.validateRequest()
    );

    app.post( '/v1/oauth2/token', function ( req, res, next ) {
      if ( req.body.grant_type === 'client_credentials' &&
        req.body.client_id === 'siegmeyer' &&
        req.body.client_secret === 'catarina' ) {
        res.status( 200 ).json( {
          access_token: 'dragons',
          token_type: 'Bearer',
          expires_in: 60
        } );
      } else if ( req.body.grant_type === 'password' &&
        req.body.client_id === 'siegmeyer' &&
        req.body.client_secret === 'catarina' &&
        req.body.username === 'basil' &&
        req.body.password === 'smash' ) {
        res.status( 200 ).json( {
          access_token: 'cheez',
          token_type: 'Bearer',
          expires_in: 60
        } );
      } else {
        res.status( 400 ).json( {
          error: 'invalid_request',
          error_description: 'Git gud'
        } );
      }
    } );

    app.use( function ( err, req, res, next ) {
      res.status( err.status || 500 ).json( { error: err.message } );
    } );

    app.emit( 'ready', app );

  } );

  return app;

};
