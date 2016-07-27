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
		tests.dates=[];
		tests.results=[];
		tests.passes=0;
		tests.fails=0;
		tests.screenshotpasses=0;
		tests.screenshotfails=0;
		tests.screenshotnulls=0;
		
		for(x=0;x<d.data.length;x++){
			var res = request('GET','https://api.ghostinspector.com/v1/tests/'+d.data[x]._id+'/results/?apiKey=38300ec7cc2ed88ad805261de8581f47ada94f7b')
				d2=JSON.parse(res.getBody());
				tests.results[x]=[];
				tests.results[x].name=d2.data[0].test.name;
				tests.results[x].details=d.data[x].details;
				tests.dates[x]=d.data[x].dateExecutionFinished;
				tests.results[x].class=d2.data[0].passing;
				if(d2.data[0].passing==true){
					tests.results[x].testResult="Test Passed";
					tests.passes++;
				}
				else{
					for(y=0;y<d2.data[0].steps.length;y++){
						if(d2.data[0].steps[y].passing==false && d2.data[0].video){
							tests.results[x].testResult = "<strong>Step "+(Number(y)+1)+" failed:</strong><a href='"+d2.data[0].video.url+"'>Video recording of test</a><br>"+d2.data[0].steps[y].notes;
							tests.fails++;
						}
						else if(d2.data[0].steps[y].passing==false){
							tests.results[x].testResult = "<strong>Step "+(Number(y)+1)+" failed:</strong><span>No video recording of test available</span><br>"+d2.data[0].steps[y].notes;
							tests.fails++;
						}
					}
				}
				tests.results[x].class2=d2.data[0].screenshotComparePassing;
				if(d2.data[0].screenshotComparePassing==true){
					tests.results[x].screenshotResult="Screenshot Passed";
					tests.screenshotpasses++;
				}
				else if(d2.data[0].screenshotComparePassing==null){
					tests.results[x].class2="null";
					tests.results[x].screenshotResult="Screenshot Disabled";
					tests.screenshotnulls++;
				}
				else{
					tests.results[x].screenshotResult = "Screenshot is "+Math.round(Number(d2.data[0].screenshotCompareDifference)*100)+"% different to baseline<br><a href='"+d2.data[0].screenshot.original.defaultUrl+"'>Screenshot</a> <a href='"+d2.data[0].screenshotCompare.compareOriginal.defaultUrl+"'>Comparison</a>";
					tests.screenshotfails++;
				}

				console.log(tests.results[x].name+" -- "+tests.results[x].testResult+" -- "+tests.results[x].screenshotResult);
				
				if(x==d.data.length-1){
					var template = fs.readFileSync('test.hbs').toString();
					var compiled = Handlebars.compile(template);
					tests.suite = d.data[0].suite.name;
					tests.date = new Date();
					tests.count=tests.passes+tests.fails;
					
					earliest = tests.dates.reduce(function (pre, cur){
						return Date.parse(pre) > Date.parse(cur) ? cur : pre;
					});
					earliest = new Date(earliest);
					tests.earliest=earliest.toJSON().replace(/T/g," ").replace(/:/g,"-").replace(/\.\d{3}Z/g,"");
					tests.date = tests.date.toJSON().replace(/T/g," ").replace(/:/g,"-").replace(/\.\d{3}Z/g,"");
					fs.writeFileSync("Test Report "+tests.date+".html",compiled(tests));
					console.log("Test Report "+tests.date+".html created");
					console.log("END");
				};
			};
		})
}).on('error', (e) => {
	console.error(e);
});