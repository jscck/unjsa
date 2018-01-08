var fs = require('fs');
var path = require('path');
var helper = require('./lib/helper');


var sourcePath = "";
   // sourcePath = 'cracked/miniui-1505965442741.js';

var template = fs.readFileSync(path.resolve(__dirname, sourcePath || 'source/miniui.js'), 'utf-8').toString();
var rules = [
{
	exec: function(str){
		return new RegExp('\\\[\\b' + str + '\\b\\\]', 'g')
	},
	replace: function(key, str){
		return function(match){
			return '.' + str;
		}
	}
}
// ,{
// 	exec: function(str){
// 		return new RegExp('\\\b' + str + '\\\b'+ '(?!\\\s=\\\s\\\")', 'g');
// 	},
// 	replace: function(key, str){
// 		return '"' + str + '"';
// 	}
// },
,{
	exec: function(str){
		return new RegExp('(\\b)(' + str + ')(\\b\|[^ol1O0])', 'g');
	},
	replace: function(key, str){
		return function(match, $1, $2, $3){
			return $1 + str + $3;
		}
	}
}];

var wordRules = [{
	exec: function(str){
		return new RegExp('\\\[\\b' + str + '\\b\\\]', 'g')
	},
	replace: function(key, str){
		return function(match){
			return '.' + str;
		}
	}
},{
	exec: function(str){
		return new RegExp('(\\b)(' + str + ')(\\b)', 'g');
	},
	replace: function(key, str){
		return function(match, $1, $2, $3){
			return $1 + str + $3;
		}
	}
}]

var crack = function(){
	var pp = require('./dict');
	for(var i in pp.dicts){
		rules.forEach(function(item, j){
			template = template.replace(item.exec(i), item.replace(i, pp.dicts[i]));
		})
	}
	for (var i in pp.words){
		wordRules.forEach(function(item, j){
			template = template.replace(item.exec(i), item.replace(i, pp.words[i]));
		})
	}



	// move function
	var matches = template.match(/\b[ol1O0]{3,}\.(\w+)\s=\s([ol1O0]+([^;]+)?)/g);
	if(matches){
		matches.forEach(function(item){
			var groups = item.split(' ');
			var endIndex = groups.length - 1;
			var funcBody = helper.findFuncBody(template, groups[endIndex], 0);
			// template = template.replace(funcBody, ''); // remove
			groups[endIndex] = funcBody.replace(groups[endIndex] + ' = ', '');
			template = template.replace(item, groups.join(' '));
		})
	}

	// change prototype name
	var protomatches = template.match(/\b[ol1O0]{3,}\s=\smini[\._](\w+)\.prototype;/g);
	if(protomatches){
		protomatches.forEach(function(item){
			var groups = item.split(' ');
			var endIndex = groups.length - 1;
			var miniprotos = groups[endIndex].split(/(\.|_)/); 
			// ["mini", ".", "DataGrid", ".", "prototype"]
			if(miniprotos){
				var newName = miniprotos[2].toLowerCase() + 'Proto';
				template = template.replace(new RegExp(groups[0], 'g'), newName);
			}
		})
	}
	// delete evil code

    // if (olOo0.toString().indexOf("") != -1) return;
    // if (!window["OO0" + "110300"]) return;
    // if (window["OO0" + "110"].charAt(153) != "0") return;
    // if (window["O0" + "lolO"].length != 2127) return;

    var evils = [
    /[\s]*?if\s*\([\w]{3,}\.toString\(\)\.indexOf\([\"\w\\]+\)\s\!=\s-1\)\s*return(;)?[\n]*/g,
    /[\s]*?if\s*\(\!window\[\"[\w\.]+\"\s\+\s\"[\w\.]*\"\]\)\s*return(;)?[\n]*/g,
    /[\s]*?if\s*\(window\[\"[\w\.]+\"\s\+\s\"[\w\.]*\"\]\.charAt\(\w+\)\s\!=\s\"[\w\|\\\!\@\#\$\%\^\&\*]*\"\)\s*return(;)?[\n]*/g,
    /[\s]*?if\s*\(window\[\"[\w\.]+\"\s\+\s\"[\w\.]*\"\]\.length\s\!=\s\d*\)\s*return(;)?[\n]*/g
    ]


    evils.forEach(function(reg){
	    var evilmatches = template.match(reg);
		if(evilmatches){
			evilmatches.forEach(function(item){
				template = template.replace(item, '');
			})
		}
    })

	template = template.replace('listcontrolProto._OnItemMouseOut = _OnItemMouseOut;', '');
	// variable
	template = template.replace(/var(\s*(\w+)\s=\s"\2"[,;]\n)+?(?=mini)/, '');

	template = template.replace(/\*\/([\s\S]*?)(?=mini\s=)/, '*/\n');

    var chainmatches = template.match(/\b\w+\s=\smini[\._](\w+)\.prototype;/g);
	if(chainmatches){
		chainmatches.forEach(function(item){
			var groups = item.split(' ');
			var endIndex = groups.length - 1;
			var miniprotos = groups[endIndex].split(/(\.|_)/); 
			var protoItems = '\\b'+ groups[0] + '\\.[\\w]+(?=\\s*\\=\\s*function)';
			var names =  template.match(new RegExp(protoItems, 'g'));
			var nameFuncs = [];
			names && names.forEach(function(name){
				var $name = name.replace(/\./g, '\\.'); // panelProto\\.setCloseAction
				var pName = name.split('.')[1]; // panelProto.setCloseAction =>  setCloseAction
				var body = helper.findFuncBody(template, $name, 1);
				var prefix = name + ' = ';
				nameFuncs.push({
					pName: pName,
					body: body.replace(prefix, '').slice(0, -1)
				})
				template = template.replace(body, ''); // remove
				// template = template.split(body).join(''); // remove
			});
			var builds = [];
			builds.push('mini.copyTo(')
			builds.push(groups[endIndex].replace(/;$/, ''))
			builds.push(', {\n');
			var reNameFuncs = nameFuncs.reverse()
			var last = reNameFuncs.length - 1;
			// reverse order
			reNameFuncs.forEach(function(b, index){
				builds.push(b.pName)
				builds.push(': ')
				builds.push(b.body)
				if(index != last)
					builds.push(',\n')
			})
			builds.push('});\n')
			template = template.replace(item, builds.join(''));
		})
	}


	fs.writeFileSync('dist/miniui-'+ Date.now() + '.js', template);
}
crack();
