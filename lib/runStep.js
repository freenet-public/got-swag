var vm = require( 'vm' );

module.exports = runStep;

function runStep( code, sandbox ) {

  return new Promise( function ( resolve ) {

    var script = new vm.Script( code, {} );
    sandbox.output = [];
    resolve( script.runInContext( sandbox ) );

  } ).then( function () {

    return { ok: true };

  } ).catch( function ( err ) {

    return { ok: false, error: err.message };

  } ).then( function ( result ) {

    result.code = code;
    result.output = sandbox.output;

    if ( sandbox.trace ) {
      result.output.push( JSON.parse( JSON.stringify( {
        vars: sandbox.vars,
        req: sandbox.req,
        res: sandbox.res
      } ) ) );
    }

    return result;

  } );

}
