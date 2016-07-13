var http = require('http');
var https = require('https');
var fs = require('fs');
var Handlebars = require('handlebars');


https.get('https://api.ghostinspector.com/v1/suites/562f9ad8175db89e368f0233/tests/?apiKey=38300ec7cc2ed88ad805261de8581f47ada94f7b', (res) => {
	buffer = [];
	buffer[0] = '';
	res.on('data', (d) => {
		buffer[0] += d.toString();
	})
	res.on('end', () => {
		d=JSON.parse(buffer[0]);
		var tests={};
		tests.results=[];
		
		
		for(x=0;x<1;x++){
			https.get('https://api.ghostinspector.com/v1/tests/'+d.data[x]._id+'/results/?apiKey=38300ec7cc2ed88ad805261de8581f47ada94f7b', (res2) => {
				buffer[x] = '';
				res2.on('data', (d2) => {
					buffer[x] += d2.toString();
				})
				res2.on('end', () => {
					d2=JSON.parse(buffer[x]);
					console.log("Returned Test Result");
					tests.results[x]=[];
					tests.results[x].name='"'+d2.data[0].test.name+'"';
					tests.results[x].passing=d2.data[0].passing;
					tests.results[x].screenshotComparePassing=d2.data[0].screenshotComparePassing;
					
					if(x==0){
						var template = fs.readFileSync('test.hbs').toString();
						var compiled = Handlebars.compile(template);
						//write to file
						var date = new Date();
						var date = date.toJSON().replace(/T/g," ").replace(/:/g,"-").replace(/\.\d{3}Z/g,"");
						console.log(tests)
						fs.writeFileSync("Test Report "+date+".html",compiled(tests));
						////show on http://127.0.0.1:8081
						//http.createServer(function (request, response) {
						//	response.end(compiled(d));
						//}).listen(8081);
					}
				
				});
			});
		}
	});
}).on('error', (e) => {
	console.error(e);
});