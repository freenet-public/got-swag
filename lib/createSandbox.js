var vm = require( 'vm' );
var assert = require( 'assert' );
var assert2 = require( './assert2' );

var sandboxRequest = require( './sandboxRequest' );
var auth = require ( './auth' );
var validate = require( './validate' );
var monkeyAuth = require( './monkeyAuth' );
var monkeyGet = require( './monkeyGet' );
var exampleVars = require( './exampleVars' );

module.exports = createSandbox;

function createSandbox( api, options ) {

  options = options || {};

  var sandbox = {

    // globals
    api: api,
    trace: options.trace,
    vars: api[ 'x-vars' ] || {},
    monkeyMemory: exampleVars( api ),

    // current test data
    test: null,
    data: null,
    req: {},
    res: {},
    authOptions: {},
    output: [],

    // assertions and utility functions
    deepEqual: assert.deepEqual,
    deepStrictEqual: assert.deepStrictEqual,
    equal: assert.equal,
    notDeepEqual: assert.notDeepEqual,
    notDeepStrictEqual: assert.notDeepStrictEqual,
    notEqual: assert.notEqual,
    ok: assert.ok,
    strictEqual: assert.strictEqual,
    match: assert2.match,

    parse: JSON.parse,
    stringify: JSON.stringify,

    // request functions
    request: function ( options ) {
      return sandboxRequest( sandbox, options );
    },

    get: function ( url, headers ) {
      return sandbox.request( {
        method: 'GET',
        url: url,
        headers: headers
      } );
    },

    post: function ( url, data, headers ) {
      return sandbox.request( {
        method: 'POST',
        url: url,
        headers: headers,
        data: data
      } );
    },

    put: function ( url, data, headers ) {
      return sandbox.request( {
        method: 'PUT',
        url: url,
        headers: headers,
        data: data
      } );
    },

    delete: function ( url, headers ) {
      return sandbox.request( {
        method: 'DELETE',
        url: url,
        headers: headers
      } );
    },

    options: function ( url, headers ) {
      return sandbox.request( {
        method: 'OPTIONS',
        url: url,
        headers: headers
      } );
    },

    head: function ( url, headers ) {
      return sandbox.request( {
        method: 'HEAD',
        url: url,
        headers: headers
      } );
    },

    auth: function ( id, credentials, scopes ) {
      return auth( sandbox.api, sandbox.test.operation, id, credentials, scopes )
        .then( function ( options ) {
          sandbox.authOptions = options;
        } );
    },

    log: function ( value ) {
      sandbox.output.push( value );
    },

    validate: function ( data, schema ) {
      return validate( sandbox.test.operation, sandbox.res, data, schema );
    },

    monkeyAuth: function () {
      return monkeyAuth( sandbox );
    },

    monkeyGet: function () {
      return monkeyGet( sandbox );
    }

  };

  return vm.createContext( sandbox );

}
