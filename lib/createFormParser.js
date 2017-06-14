var parse5 = require( 'parse5' );

module.exports = createFormParser;

function createFormParser() {

  var parser = new parse5.SAXParser();
  var forms = [];
  var form;

  parser.on( 'startTag', function ( tagName, attrs ) {

    switch ( tagName ) {

    case 'form':
      var action = getAttr( attrs, 'action' );
      form = { action: action, data: {} };
      forms.push( form );
      break;

    case 'input':
      var name = getAttr( attrs, 'name' );
      var value = getAttr( attrs, 'value' );
      if ( form ) form.data[ name ] = value;
      break;

    }

  } );

  parser.on( 'endTag', function ( tagName, attrs ) {

    switch ( tagName ) {

    case 'form':
      parser.emit( 'form', form );
      break;

    }

  } );

  parser.on( 'finish', function () {
    parser.emit( 'forms', forms );
  } );

  return parser;

}

function getAttr( attrs, attrName ) {
  return attrs.filter( function ( attr ) {
    return attr.name === attrName;
  } ).map( function ( attr ) {
    return attr.value;
  } )[ 0 ];
}
