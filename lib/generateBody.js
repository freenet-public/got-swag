var chance = new require('chance')();
var _ = require('lodash');

module.exports = (function() {

    function generateRandomValue(propertyDefinition) {
        switch (propertyDefinition.type) {
            case 'array':
                //TODO: add support for arrays of simple values (int, string, etc..)
                if (propertyDefinition.items && propertyDefinition.items.properties) {
                    var result = [];
                    _.times(chance.integer({min: 0, max: 20}), function () {
                        result.push(generateRandomObjectFromSchema(propertyDefinition.items));
                    });
                    return result;
                }
                return null;
            case 'string':
                if (propertyDefinition.format) {
                    switch (propertyDefinition.format) {
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
                if (propertyDefinition.properties) {
                    return generateRandomObjectFromSchema(propertyDefinition);
                }
                return null;
        }
    }

    function generateRandomObjectFromSchema(schemaDefinition) {
        var result = {};
        if (schemaDefinition.properties) {
            _.forOwn(schemaDefinition.properties, function (value, key) {
                result[key] = generateRandomValue(value);
            });
        }
        return result;
    }

    function deleteRandomPropertiesFromObject(input, survivalRate, nullify) {
        nullify = !!nullify;
        if (_.isObject(input)) {
            _.forOwn(input, function (value, key) {
                if (_.random(0, 1, true) > survivalRate) {
                    if (nullify) {
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
        return input;
    }

    return {
        generateRandomObjectFromSchema: generateRandomObjectFromSchema,
        deleteRandomPropertiesFromObject: deleteRandomPropertiesFromObject
    };
})();

