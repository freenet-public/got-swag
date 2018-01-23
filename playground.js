
var _ = require('lodash');
var Mocha  = require('mocha');
var modify = require('./lib/modify');
var parser = require( 'json-schema-ref-parser' );
var Combinatorics = require('js-combinatorics');
var bundleApis = require( './lib/bundleApis' );
var chance = new require('chance')();


// var options = {
//     'one': 1,
//     'two': 2,
//     'three': 3
// }
//
// //gegenteil von 'pick'. Es wird eine Kopie eines Objekts erstellt, jedoch werden alle Attribute ausgelassen,
// //die als zweiter Parameter in 'omit' übergeben wurden.
// var actual1 = _.omit(options, 'three');
// var actual2 = _.omit(options, ['one', 'two']);
// var actual3 = _.omit(options, 'one', 'three');
//
//
// var mochaInstance = new Mocha();
// mochaInstance.suite.title = 'Name der TestSuite';
//
// mochaInstance.suite.addTest(new Mocha.Test('Test-Funktion #1', function(next){
//     console.log('test lauf initiiert!');
//     // next(new Error('etwas schlimmes ist passiert!'));
//     next();
// }));
//
//
// mochaInstance.suite.beforeAll(function(){
//     console.log('beforeAll was called!');
// });
//
// mochaInstance.run();
//
//
// // var urls = ['http://petstore.swagger.io/v2/swagger.json'];
// var urls = ['./test/petstore2.yaml'];
// Promise
//     .all(urls.map(function(api){
//         return parser.dereference(api);
//     }))
//     .then(function(apis){
//         modify(apis[0]);
//     });
//
//
// console.log("!DONE!");
//
//
// var api = {
//     responses: []
// };
//
//
// var responses = api['responses'] || [];
// console.log("is it call by reference?", api.responses.length);
// responses.push('tooot tooot!');
// console.log("is it call by reference?", api.responses.length);


// var args = [[0, 1, 2], [0, 10, 20], [0, 100, 200]];
//
// cp = Combinatorics.cartesianProduct(args);
// console.log(cp.toArray());


// var p = new Promise(function(res, rej){
//     res("hello");
// }).then(function(val){
//     var test = val+" world";
// });
//
// p.then(function(val){
//     console.log("ausgabe!", val);
// });



var example = {
    id: 1,
    forename: "Frederik",
    lastname: "Priede",
    address: {
        street: "Lüttenheisch",
        housenumber: 15,
        postal: 24582,
        city: "Bordesholm"
    }
};

// function getCombinations(options, optionIndex, results, current) {
//     var allKeys = Object.keys(options);
//     var optionKey = allKeys[optionIndex];
//
//     var vals = options[optionKey];
//
//     for (var i = 0; i < vals.length; i++) {
//         current[optionKey] = vals[i];
//
//         if (optionIndex + 1 < allKeys.length) {
//             getCombinations(options, optionIndex + 1, results, current);
//         } else {
//             // The easiest way to clone an object.
//             var res = JSON.parse(JSON.stringify(current));
//             results.push(res);
//         }
//     }
//
//     return results;
// }


bundleApis(["file://../md-dev-portal-content/docs/contract-swap-api.yaml"]).then(function(api) {

    var generatedJsonPostBody = generateRandomObjectFromSchema(api.paths['/v1/contracts/move'].post.parameters[0].schema);
    deleteRandomPropertiesFromObject(generatedJsonPostBody, 0.5, true);

    console.log("!done!");
});


function generateRandomValue(propertyDefinition){
    switch(propertyDefinition.type){
        case 'array':
            //TODO: add support for arrays of simple values (int, string, etc..)
            if(propertyDefinition.items && propertyDefinition.items.properties){
                var result = [];
                _.times(chance.integer({min: 0, max: 20}), function(){
                    result.push(generateRandomObjectFromSchema(propertyDefinition.items));
                });
                return result;
            }
            return null;
        case 'string':
            if(propertyDefinition.format){
                switch(propertyDefinition.format){
                    case 'date-time':
                        return chance.date().toISOString();
                    default:
                        return chance.word({length: 5});
                }
            }
            else {
                return chance.word({length: 5});
            }
            break;
        case 'boolean':
            return chance.bool();
        case 'object':
        default:
            if(propertyDefinition.properties){
                return generateRandomObjectFromSchema(propertyDefinition);
            }
            return null;
    }
}

function generateRandomObjectFromSchema(schemaDefinition){
    var result = {};
    if(schemaDefinition.properties) {
        _.forOwn(schemaDefinition.properties, function(value, key) {
            result[key] = generateRandomValue(value);
        });
    }
    return result;
}

function deleteRandomPropertiesFromObject(input, survivalRate, nullify){
    nullify = !!nullify;
    if(_.isObject(input)) {
        _.forOwn(input, function (value, key) {
            if (_.random(0, 1, true) > survivalRate) {
                if(nullify){
                    input[key] = null;
                }
                else {
                    delete input[key];
                }
            }
            else {
                if (_.isArray(input[key])) {
                    input[key].forEach(function (value) {
                        deleteRandomPropertiesFromObject(value, survivalRate, nullify);
                    });
                }
                else if (_.isObject(input[key])) {
                    deleteRandomPropertiesFromObject(value, survivalRate, nullify);
                }
            }
        });
    }
}



//
// function getAllPathes(schema){
//
//     if(!path)
//         path = "";
//     var result = [];
//     var pairs = Object.entries(src);
//
//     var levelProperties = pairs.filter(function(property){
//         return !_.isObject(property[1]) && !_.isArray(property[1]);
//     });
//     var subProperteis = _.difference(pairs, levelProperties);
//
//
//     levelProperties.forEach(function(property){
//         result[path+'.'+property[0]] = property[1];
//     });
//
//     console.log("done!");
// }
//
// var results = getAllPathes(example);
//
// console.log("done!");

