module.exports = monkeyParameter;

function monkeyParameter( options ) {

  var parameter = options.parameter;
  var memory = options.memory;
  var candidates = memory[ parameter.name ] || [];

  // TODO handle body type, generate random JSON bodys according to schema

  return candidates[ Math.floor( Math.random() * candidates.length ) ];

}
