var express = require( 'express' );
var middleware = require( 'swagger-express-middleware' );
var parser = require( 'json-schema-ref-parser' );

module.exports = function () {

  var app = express();

  middleware( 'test/petstore.yaml', app, function ( err, middleware ) {

    if ( err ) return app.emit( 'error', err );

    // swagger-express-middleware cant deal with recursive models
    // export api docs manually
    app.get( '/api-docs', function ( req, res, next ) {
      parser.bundle( 'test/petstore.yaml' ).then( function ( api ) {
        res.json( api );
      } ).catch( next );
    } );

    app.use(
      middleware.metadata(),
      middleware.CORS(),
      middleware.files(),
      middleware.parseRequest(),
      middleware.validateRequest()
    );

    var pets = [
      { id: 1, name: "kathi" },
      { id: 2, name: "george" },
      { id: 3, name: "bolle" }
    ];

    function petById( id ) {
      return pets.filter( function ( p ) {
        return p.id === parseInt( id );
      } )[ 0 ];
    }

    function auth( req, res, next ) {
      if ( req.headers[ 'x-api-key' ] !== '1337' &&
          req.headers.authorization !== 'Bearer cheez' &&
          req.headers.authorization !== 'Bearer dragons' ) {
        return res.status( 401 ).json( {
          code: 79,
          message: 'Get outta here',
          headers: req.headers
        } );
      }

      next();
    }

    app.get( '/v1/pets', auth, function ( req, res, next ) {
      res.json( pets );
    } );

    app.post( '/v1/pets', function ( req, res, next ) {
      if ( petById( req.body.id ) ) return res.status( 400 ).json( {
        code: 73,
        message: 'I know dat buddy tho'
      } );
      pets.push( req.body );
      res.status( 201 ).end();
    } );

    app.get( '/v1/pets/:id', function ( req, res, next ) {
      /*if ( req.params.id === 'gimme5' ) return res.status( 500 ).json( {
        code: 500000,
        message: 'My bad'
      } );*/
      var pet = petById( req.params.id );
      if ( !pet ) return res.status( 404 ).json( {
        code: 71,
        message: 'Sorry'
      } );
      res.json( pet );
    } );

    app.get( '/v1/recursive', function ( req, res, next ) {
      res.json( { id: 4, children: [ { id: 5 }, { id: 6 } ] } );
    } );

    app.use( function ( err, req, res, next ) {
      console.log( err.stack );
      res.status( err.status || 500 ).json( { code: 3, message: err.message } );
    } );

    app.emit( 'ready', app );

  } );

  return app;

};
