var charsToEncode = /[\u007f-\uffff]/g;

module.exports = headerSafe;

function headerSafe(v) {
  return JSON.stringify(v).replace(charsToEncode,
    function(c) {
      return '\\u'+('000'+c.charCodeAt(0).toString(16)).slice(-4);
    }
  );
}