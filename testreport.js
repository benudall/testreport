var http = require('http');
var https = require('https');
var fs = require('fs');
var Handlebars = require('handlebars');


https.get('https://api.ghostinspector.com/v1/suites/562f9ad8175db89e368f0233/?apiKey=38300ec7cc2ed88ad805261de8581f47ada94f7b', (res) => {
	res.on('data', (d) => {
		d=JSON.parse(d);
		var template = fs.readFileSync('test.hbs').toString();
		var compiled = Handlebars.compile(template);
		http.createServer(function (request, response) {
			response.end(compiled(d));
		}).listen(8081);
  });

}).on('error', (e) => {
  console.error(e);
});




