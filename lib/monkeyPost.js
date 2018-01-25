var listVars = require( './listVars' );
var cartesian = require( './cartesian' );
var shuffle = require( './shuffle' );
var bodyGenerator = require('./generateBody');

module.exports = monkeyPost;

function monkeyPost (sandbox){
    console.log("testing post endpoint...");
    var operation = sandbox.test.operation;
    var parameters = operation.parameters || [];
    var operationVars = listVars( operation[ 'x-vars' ] );
    var globalVars = listVars( sandbox.vars, sandbox.monkeyMemory );

    var getCandidate = cartesian( parameters.map( function ( parameter ) {
        if(parameter.in === 'body') {
            var temp = [
                null,
                {},
                bodyGenerator.deleteRandomPropertiesFromObject(bodyGenerator.generateRandomObjectFromSchema(parameter.schema), .0, true),
                bodyGenerator.deleteRandomPropertiesFromObject(bodyGenerator.generateRandomObjectFromSchema(parameter.schema), .5, true),
                bodyGenerator.deleteRandomPropertiesFromObject(bodyGenerator.generateRandomObjectFromSchema(parameter.schema), .5, false),
                bodyGenerator.generateRandomObjectFromSchema(parameter.schema)];
            return temp;
        }
        else {
            return [null]
                .concat(shuffle(operationVars[parameter.name] || []))
                .concat(shuffle(globalVars[parameter.name] || []));
        }
    } ) );

    return tryPost( getCandidate() || [], 0 );

    function tryPost( candidate, number ) {

        if ( !candidate || number >= sandbox.monkeyLimit ) {
            // throw new Error( 'Could not POST(tried ' + number + ' candidates)' );
            sandbox.log("done testing rest endpoint. no server error detected!");
            return Promise.resolve(candidate);
        }

        var data = false;
        var path = ( ( sandbox.api.basePath || '' ) + sandbox.test.path );
        var query = {};
        var headers = {
            'Content-Type': 'application/json' //TODO: make this more content type aware (swagger c
        };

        parameters.forEach( function ( parameter, i ) {
            if ( parameter.in === 'path' ) {
                path = path.replace( '{' + parameter.name + '}', encodeURIComponent( candidate[ i ] ) );
            } else if ( parameter.in === 'query' && candidate[ i ] !== null ) {
                query[ parameter.name ] = candidate[ i ];
            } else if ( parameter.in === 'header' && candidate[ i ] !== null ) {
                headers[ parameter.name ] = candidate[ i ];
            }
            else if (parameter.in === 'body'){
                data = JSON.stringify(candidate[ i ]);
            }
        } );

        return sandbox.request( {
            method: 'POST',
            path: path,
            query: query,
            headers: headers,
            data: data
        } ).then( function () {
            var c = {};

            parameters.forEach( function ( parameter, i ) {
                c[ parameter.name ] = candidate[ i ];
            } );

            var next = getCandidate();

            if ( !next || sandbox.res.statusCode >= 500 ||  sandbox.res.statusCode < 400 ) {
                sandbox.log( {
                    MONKEY_LAST: {
                        parameters: c,
                        statusCode: sandbox.res.statusCode
                    }
                } );
            }

            if ( sandbox.res.statusCode >= 500 ) {
                throw new Error( 'Status ' + sandbox.res.statusCode + ' detected' );
            }

            if ( sandbox.res.statusCode >= 400 ) {
                return tryPost( next, number + 1 );
            }
        } );

    }
}