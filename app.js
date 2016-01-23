'use strict';

/*
 * modules
 * */

var http = require('http');
var https = require('https');
var fs = require('fs');
var os = require('os');
var url = require('url');
var assert = require('assert');
var mongodb = require('mongodb');
var open = require('open');

/*
 * variables
 * */

var server = http.createServer();
var port = process.env.PORT || 8001;

var MongoClient = mongodb.MongoClient;
var dbname = 'validation_log';
var dburl = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/' + dbname;

//TODO: confirm.start
var mimeTypes = {
	"txt":  "text/plain",
	"html": "text/html",
	"css":  "text/css",
	"jpeg": "image/jpeg",
	"jpg":  "image/jpeg",
	"png":  "image/png",
	"js":   "application/javascript",
	"json": "application/json",
	"xml":  "application/xml",
	"svg":  "image/svg+xml"
};

var dirSpacesBeforeDate = 51;
var dirSpacesBeforeSize = 9;
var dirMonths = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(',');
//TODO: confirm.end

var osPlatform = os.platform();
var isLinux = osPlatform === 'linux';
var isMacintosh = osPlatform === 'darwin';
var isWindows = osPlatform === 'win32';
var browser = isLinux ? 'google-chrome' : (
	isMacintosh ? 'google chrome' : (
	isWindows ? 'chrome' : null)
);

/*
 * execution
 * */

//set handler
server.on('request', requestHandler);

//listen to server
server.listen(port, callbackAfterServerListening);

/*
* functions
* */

function callbackAfterServerListening() {

	var serverAddress = server.address();
	var ipAddress = serverAddress.address;
	var host = ipAddress ===  '::' ? 'localhost' : ipAddress;
	var port = serverAddress.port;

	console.log("Server is runnnig at http://%s:%s", host, port);

	if(browser) {
		open('http://' + host + ':' + port, browser);
	}
}


/*
 * functions - web server
 * */

function requestHandler(req, res){

	var parsedURL = url.parse(req.url);
	var path = parsedURL.pathname;
	var requestMethod = req.method;

	switch(requestMethod) {
		case 'POST':
			serveData(req, res, path);
			break;
		case 'GET':
			serveFiles(req, res, path);
			break;
		default:
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end(requestMethod + ' request');
			break;
	}
}

function serveData(req, res, path) {

	var store = '';

	req.on('data', function(chunk) {

		store += chunk;

	});

	req.on('end', function() {

		res.setHeader("Content-Type", "application/json");
		res.setHeader("Access-Control-Allow-Origin", "*");

		switch(path) {
			case '/saveJSON':
				saveJSON(store);
				break;
			case '/send2db':
				MongoClient.connect(dburl, dbHandler(store));
				break;
			default:
				break;
		}

		res.end(store);
	});
}

function serveFiles(req, res, path) {

	path = ('./' + path).replace('//', '/');

	if(req.headers.host === 'style-validator.herokuapp.com') {
		return sendNotFound(req, res, path);
	}

	fs.stat(path, function(err, stats){

		if(err){

			return sendNotFound(req, res, path);

		} else {

			//Directory
			if(stats.isDirectory()) {

				//if last char is not '/', then redirect with '/'
				if(path.charAt(path.length-1) !== '/') {
					return sendRedirect(req, res, path + '/');
				}

				fs.stat(path + 'index.html', function(err2, stats2) {
					if(err2) {
						return sendDirectory(req, res, path);
					}
					return sendFile(req, res, path + '/index.html');
				});

			//Not directory
			} else {

				return sendFile(req, res, path);

			}

		}
	});
}

function escapeHtml(value) {
	return value.toString().
		replace('<', '&lt;').
		replace('>', '&gt;').
		replace('"', '&quot;');
}

function zeroFill(value) {
	return ((value < 10) ? '0' : '') + value;
}

function convertSize(value) {
	if(value > 1000000000) return ((value*0.000000001) | 0) + 'G';
	if(value > 1000000) return ((value*0.000001) | 0) + 'M';
	if(value > 10000) return ((value*0.001) | 0) + 'K';
	return '' + value;
}

function sendFile(req, res, path) {
	var extension = path.split('.').pop();
	var contentType = mimeTypes[extension] || 'text/plain';

	res.writeHead(200, {'Content-Type': contentType});
	var fileStream = fs.createReadStream(path);
	fileStream.pipe(res);
}

function sendRedirect(req, res, path) {
	res.writeHead(301, {
		'Content-Type': 'text/html',
		'Location': path
	});
	res.end();
}

function sendServerError(req, res, error) {
	console.log('500 Internal Server Error: ' + error);

	res.writeHead(500, {'Content-Type': 'text/html'});
	res.writeo('<!DOCTYPE html>\n');
	res.write('<html><head>\n');
	res.write('<title>500 Internal Server Error</title>\n');
	res.write('</head><body>\n');
	res.write('<h1>500 Internal Server Error</h1>\n');
	res.write('<pre>' + escapeHtml(error) + '</pre>\n');
	res.write('</body></html>\n');
	res.end();
}

function sendForbidden(req, res, path) {
	console.log('403 Forbidden: ' + path);

	res.writeHead(403, {'Content-Type': 'text/html'});
	res.write('<!DOCTYPE html>\n');
	res.write('<html><head>\n');
	res.write('<title>403 Forbidden</title>\n');
	res.write('</head><body>\n');
	res.write('<h1>403 Forbidden</h1>\n');
	res.write('<p>You don\'t have permission to access' + escapeHtml(path) + ' on this server.</p>\n');
	res.write('</body></html>\n');
	res.end();
}

function sendNotFound(req, res, path) {
	console.log('404 Not Found: ' + path);

	res.writeHead(404, {'Content-Type': 'text/html'});
	res.write('<!DOCTYPE html>\n');
	res.write('<html><head>\n');
	res.write('<title>404 Not Found</title>\n');
	res.write('</head><body>\n');
	res.write('<h1>404 Not Found</h1>\n');
	res.write('<p>The requested URL ' + escapeHtml(path) + ' was not found on this server.\n');
	res.write('</body></html>\n');
	res.end();
}

function sendDirectory(req, res, path) {
	fs.readdir(path, function(err, files) {
		if(err) return sendServerError(req, res, err);

		if(files.length === 0)
			return sendDirectoryIndex(req, res, path, []);

		var remaining = files.length;
		files.forEach(function(filename, idx) {
			fs.stat(path + '/' + filename, function(err, stats) {
				if(err) return sendServerError(req, res, err);

				files[idx] = {
					name: files[idx],
					date: stats.mtime,
					size: '-'
				};

				if(stats.isDirectory()) files[idx].name += '/';
				else files[idx].size = stats.size;

				if(--remaining === 0)
					return sendDirectoryIndex(req, res, path, files);

			});
		});
	});
}

function sendDirectoryIndex(req, res, path, files) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write('<!DOCTYPE html>\n');
	res.write('<html><head>\n');
	res.write('<title>Index of ' + escapeHtml(path) + '</title>\n');
	res.write('</head><body>\n');
	res.write('<h1>Index of ' + escapeHtml(path) + '</h1>\n');
	res.write('<hr><pre>\n');

	res.write('<a href="../">../</a>\n');


	files.forEach(function(file, idx) {
		var name = escapeHtml(file.name),
			displayName = name.substr(0, dirSpacesBeforeDate-1),
			spBeforeDate = dirSpacesBeforeDate - displayName.length;

		res.write('<a href="' + name + '">' + displayName + '</a>');
		while(--spBeforeDate) res.write(' ');

		var day = zeroFill(file.date.getDate()),
			month = dirMonths[file.date.getMonth()],
			hours = zeroFill(file.date.getHours()),
			min = zeroFill(file.date.getMinutes());

		var date = day + '-' + month + '-' + file.date.getFullYear() +
			' ' + hours + ':' + min;
		res.write(date);

		var size = convertSize(file.size),
			spBeforeSize = dirSpacesBeforeSize - size.length;

		while(spBeforeSize--) res.write(' ');
		res.write(size + '\n');
	});

	res.write('</pre><hr></body></html>\n');
	res.end();
}

/*
 * functions - database
 * */

function dbHandler(store) {
	return function(err, db) {

		assert.equal(null, err, 'Unable to connect to the MongoDB server.');
		console.log("Connected correctly to MongoDB");

		var collection = db.collection('testData');
		var json = JSON.parse(store);
		collection.insert(json, {}, function() {
			console.log('Inserted data completely to Database');
			db.close();
		});
	}
}

/*
 * functions - file
 * */

function saveJSON(store) {
	fs.writeFile("./extension/data/rules.json", store);
	console.log('JSON file written successfully!');
}
