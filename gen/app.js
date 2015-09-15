var shelljs = require("shelljs");
var async = require("async");
var path = require("path");
var fs = require("fs");
var _ = require("lodash");


function read(file, done) {
	fs.readFile(file, "utf8", done);
}


function write(file, data, done) {
	shelljs.mkdir("-p", path.dirname(file));
	fs.writeFile(file, data, "utf8", done);
}


function readAll(map, done) {
	var result = {};
	async.forEachOf(map, function (file, key, done) {
		read(file, function (err, data) {
			if (err) return done(err);
			result[key] = data;
			done();
		});
	}, function (err) {
		done(err, result);
	});
}


var locales = {
	en_US: "English (US)",
	cmn_Hans: "Chinese (Simplified)",
	cs_CZ: "Czech",
	de_DE: "German",
	es_ES: "Spanish (Spain)",
	fr_FR: "French",
	it_IT: "Italian",
	ja_JP: "Japanese",
	ko_KR: "Korean",
	pt_br: "Portuguese (Brazil)",
	ru_RU: "Russian"
};


var flavors = {
	ios: { 
		IOS: true, 
		ANDROID: false 
	},
	android: { 
		IOS: false, 
		ANDROID: true 
	}
}


shelljs.rm("-rf", "../out");


async.waterfall([

	// read base variables
	function (done) {
		var base = {
			PERMISSIONS: 	"../Base/permissions.txt",
			REMOTES_FREE: 	"../Base/remotes_free.txt",
			REMOTES_FULL: 	"../Base/remotes_full.txt"
		};
		readAll(base, done);
	},

	// loop locales
	function (base, done) {
		async.forEachOf(locales, function (dir, locale, done) {

			var files = {
				DESCRIPTION:	path.join("../", dir, "store/description.txt"),
				IAP: 			path.join("../", dir, "store/iap.txt"),
				KEYWORDS: 		path.join("../", dir, "store/keywords.txt")
			};

			// read all files for locale
			readAll(files, function (err, data) {
				if (err) return done(err);
				
				// build scope for template
				var scope = {};
				scope = _.merge(scope, base);
				scope = _.merge(scope, data);
				
				async.forEachOf(flavors, function (flavor, flavorKey, done) {
					
					flavorScope = _.merge(scope, flavor);
					
					// compile template
					var src = scope.DESCRIPTION;
					var compiled = _.template(src);
					var result = compiled(flavorScope);
					
					// clean up extra linebreaks
					result = result.replace(/(\r?\n){2,}/g, "\n\n");
					
					// write output
					var dst = path.join("../out/store/", flavorKey, "description_" + locale + ".txt");
					write(dst, result, done);
					
				}, done);
				
			});

		}, done);
	}

], function (err) {
	if (err) throw err;
	console.log("all done, have a nice day :)")
});
