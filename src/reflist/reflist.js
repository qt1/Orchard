var glob = require("glob"),
    path = require("path-posix"),
    merge = require("merge-stream"),
    gulpif = require("gulp-if"),
    gulp = require("gulp"),
    newer = require("gulp-newer"),
    plumber = require("gulp-plumber"),
    sourcemaps = require("gulp-sourcemaps"),
    less = require("gulp-less"),
    autoprefixer = require("gulp-autoprefixer"),
    minify = require("gulp-minify-css"),
    typescript = require("gulp-typescript"),
    uglify = require("gulp-uglify"),
    rename = require("gulp-rename"),
    concat = require("gulp-concat"),
    header = require("gulp-header"),
    fs = require("fs"),
    xml2js = require("xml2js");

var references = [];

// scan all project files and make a disctionary of references


var projs = [];
for (var depth = 0, d = ""; depth < 6; depth++ , d = d + "*/")
    projs = projs.concat(glob.sync("../" + d + "*csproj"));

console.log(projs.length + " Projects found");

// collect 
for (var p of projs) {
    var xml = fs.readFileSync(p);
    xml2js.parseString(xml, processProj);
}

function processProj(err, result) {
    if(err!=null)
       return;
    var refs = findAllByName(result,"Reference");
    console.log(refs);
}

function findAllByName(obj, name) {
    var res = [];
    return findAllByNameRecursive([], obj, name, res);
}

function findAllByNameRecursive(path, obj, name, res) {
    if (obj != null && typeof(obj)=="object") {
        for (var i in obj) {
            path.push(i);
            if (i === name)
                res.push({ path: path.slice(0), obj: obj }); // slice(0) will copy the array
            else {}
                findAllByNameRecursive(path, obj[i], name, res);
            path.pop();     
        }
    }
    return res;
}


