module.exports = monkeyParameter;

function monkeyParameter( options ) {

  var parameter = options.parameter;
  var memory = options.memory;
  var candidates = memory[ parameter.name ] || [];

  console.log( candidates );

  return candidates[ Math.floor( Math.random() * candidates.length ) ];

}
