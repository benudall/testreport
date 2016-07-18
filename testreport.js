var https = require('https');
var request = require('sync-request')
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
		
		
		for(x=0;x<d.data.length;x++){
			var res = request('GET','https://api.ghostinspector.com/v1/tests/'+d.data[x]._id+'/results/?apiKey=38300ec7cc2ed88ad805261de8581f47ada94f7b')
				d2=JSON.parse(res.getBody());
				tests.results[x]=[];
				tests.results[x].name=d2.data[0].test.name;
				tests.results[x].class=d2.data[0].passing;
				if(d2.data[0].passing==true){
					tests.results[x].testResult="Test Passed";
				}
				else{
					for(y=0;y<d2.data[0].steps.length;y++){
						if(d2.data[0].steps[y].passing==false){
							tests.results[x].testResult = "Failed on step "+(Number(y)+1)+" : "+d2.data[0].steps[y].notes+"<br><a href='"+d2.data[0].video.url+"'>Video recording of test</a>";
						}
					}
				}
				tests.results[x].class2=d2.data[0].screenshotComparePassing;
				if(d2.data[0].screenshotComparePassing==true){
					tests.results[x].screenshotResult="Screenshot Passed";
				}
				else if(d2.data[0].screenshotComparePassing==null){
					tests.results[x].class2="null";
					tests.results[x].screenshotResult="Screenshot Disabled";
				}
				else{
					tests.results[x].screenshotResult = "Screenshot is "+Number(d2.data[0].screenshotCompareDifference)*100+"% different to the last successful test<br><a href='"+d2.data[0].screenshot.original.defaultUrl+"'>Screenshot</a> <a href='"+d2.data[0].screenshotCompare.compareOriginal.defaultUrl+"'>Comparison</a>";
				}

				
				console.log(tests.results[x].name+" -- "+tests.results[x].testResult+" -- "+tests.results[x].screenshotResult);
				
				if(x==d.data.length-1){
					var template = fs.readFileSync('test.hbs').toString();
					var compiled = Handlebars.compile(template);
					var date = new Date();
					var date = date.toJSON().replace(/T/g," ").replace(/:/g,"-").replace(/\.\d{3}Z/g,"");
					fs.writeFileSync("Test Report "+date+".html",compiled(tests));
				};
			};
		})
}).on('error', (e) => {
	console.error(e);
});