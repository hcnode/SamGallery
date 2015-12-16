var express = require('express');
var path = require('path');
var fs = require('fs');
var serveIndex = require('serve-index');
var tar = require('tar-fs');
var _ = require('lodash');
var lwip = require('lwip');
var config = require('config');

var app = express();

// obtain config from /config/default.json
var homePath = config.get("homePath"); // home path
var thumbSize = config.get("thumbSize");// thumb size


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// bower dependence router
app.use('/bower_components', express.static(__dirname + '/bower_components'));

// dir compress router
app.get(/(\/.+)?\/+_tar/, function (req, res, next) {
	var baseUrl = req.originalUrl;
	var dir = homePath + getPath(baseUrl, "_tar");
	var baseUrl2 = baseUrl.substring(0, baseUrl.lastIndexOf("/"));
	var tarName = "tar";
	if(baseUrl2){
		tarName = baseUrl2.substr(baseUrl2.lastIndexOf("/") + 1, baseUrl2.length - 1);
	}
	res.set("Content-Disposition", 'attachment;filename="'+ tarName +'.tar"');
	tar.pack(dir).pipe(res);
});

// thumb image generater router
app.get(/(\/.+)?\/_thumb/, function (req, res, next) {
	var baseUrl = req.originalUrl;
	var file = getPath(baseUrl, "_thumb");
	var fullFile = homePath + file;
	var thumbName = fullFile.replace(/\//gi, "_");
	if(fs.existsSync(fullFile)) {
		var thumbFile = __dirname + "/thumb/" + thumbName;
		if(!fs.existsSync(__dirname + "/thumb/")){
			fs.mkdirSync(__dirname + "/thumb/");
		}
		if(fs.existsSync(thumbFile)){
			res.sendFile(thumbFile);
		}else {
			lwip.open(fullFile, function (err, image) {
				var max = Math.max(image.width(), image.height());
				if(max < thumbSize){
					res.sendFile(fullFile);
				}else {
					var ratio = 1;
					if(image.width() > image.height()){
						ratio = thumbSize / image.width();
					}else{
						ratio = thumbSize / image.height();
					}
					image.scale(ratio, function (err, image) {
						image.writeFile(thumbFile, function (err) {
							res.sendFile(thumbFile);
						});
					});
				}
			})
		}
	}
});

// gallery page router
app.get(/(\/.+)?\/_gallery/, function (req, res, next) {
	var baseUrl = req.originalUrl;
	var path = getPath(baseUrl, "_gallery");
	var fullPath = homePath + path;
	if(fs.existsSync(fullPath)){
		var images = [];
		console.log(baseUrl);
		console.log(fullPath);
		fs.readdir(fullPath, function (err, files) {
			_.forEach(files, function (file) {
				if(file.indexOf(".") != 0) {
					var stat = fs.statSync(fullPath + '/' + file);
					if (!stat.isDirectory()) {
						if (/\.(PNG)|(JPG)$/ig.test(file)) {
							images.push(file);
						}
					}
				}
			});
			res.render(__dirname + "/views/gallery.ejs", {files : images, path : path});
		});
	}else{
		next();
	}
});

// image router
app.get(/(\/.+)?\/_image/, function (req, res, next) {
	var baseUrl = req.originalUrl;
	var file = getPath(baseUrl, "_image");
	var fullFile = homePath + file;
	if(fs.existsSync(fullFile)) {
		res.sendFile(fullFile);
	}else{
		next();
	}
});

function getPath(baseUrl, action) {
	baseUrl = decodeURIComponent(baseUrl);
	var path = baseUrl.substring(0, baseUrl.length - action.length - 1);
	//console.log(baseUrl);
	return path.replace(/\/\//gi, "\/");
}

if(fs.existsSync(homePath)) {
	app.use('/', serveIndex(homePath, {'icons': true, view: "details"}));
	app.use('/', express.static(homePath));
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function (err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


module.exports = app;
