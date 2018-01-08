function tokenize(code) {
    var code = code.split(/\\./).join(''),
        regex = /\bfunction\b|\(|\)|\{|\}|\/\*|\*\/|\/\/|"|'|\n|\s+/mg,
        tokens = [],
        pos = 0;

    for(var matches; matches = regex.exec(code); pos = regex.lastIndex) {
        var match = matches[0],
            matchStart = regex.lastIndex - match.length;

        if(pos < matchStart)
            tokens.push(code.substring(pos, matchStart));

        tokens.push(match);
    }

    if(pos < code.length)
        tokens.push(code.substring(pos));

    return tokens;
}

var separators = {
    '/*' : '*/',
    '//' : '\n',
    '"' : '"',
    '\'' : '\''
};



function findFuncBody(str, funcName, offset) {
    offset || (offset = 0);
    var reg = new RegExp('\\b'+ funcName + '\\s*=\\s*function[\\s]*\\([^\\)]*\\)[^\\{]*\\{');
    var needleMatch = str.match(reg);
    var result = '';
    if(!needleMatch){
      return result || 'function (){}';
    }
    var needle = needleMatch[0];
    var startIndex = needleMatch.index;
    var cutlen = 10000;
    var stream = '';
    // cut characters, array too big, too slow
    if(cutlen){
        stream = str.slice(startIndex, startIndex + cutlen);
    } else {
        stream = str.slice(startIndex);
    }
    var tokens = tokenize(stream),
        level = 0, closed = false, closedIteratee = 0;
    for(var i = 0; i < tokens.length; ++i) {
        var token = tokens[i];
        switch(token) {
            case '{':
            ++level;
            closed = false;
            break;
            case '}':
            --level;
            closed = true;
            break;
            case '/*':
            case '//':
            case '"':
            case '\'':
            var sep = separators[token];
            while(++i < tokens.length && tokens[i] !== sep);
            break;
        }
        if(level == 0 && closed){
            closedIteratee = i;
            break;
        }
    }
    result = tokens.slice(0, closedIteratee + 1 + offset).join('');
    tokens.length = 0; // destroy
    return result;
}



module.exports = {
  findFuncBody: findFuncBody
}
