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
		//for each test
		for(x=0;x<d.data.length;x++){
			var res = request('GET','https://api.ghostinspector.com/v1/tests/'+d.data[x]._id+'/results/?apiKey=38300ec7cc2ed88ad805261de8581f47ada94f7b')
				d2=JSON.parse(res.getBody());
				tests.results[x]=[];
				tests.results[x].name=d2.data[0].test.name;
				tests.results[x].details=d.data[x].details;
				tests.dates[x]=d.data[x].dateExecutionFinished;
				tests.results[x].class=d2.data[0].passing;
				tests.results[x].steps=[];
				//if test passed then display
				if(d2.data[0].passing==true){
					tests.results[x].testResult="Test Passed";
					tests.passes++;
				}
				//if test failed then which step failed?
				else{
					for(y=0;y<d2.data[0].steps.length;y++){
						if(d2.data[0].steps[y].passing==false){
							tests.results[x].testResult="<strong>Step "+(Number(y)+1)+"/"+d2.data[0].steps.length+" failed:</strong><br>"+d2.data[0].steps[y].notes;
							tests.fails++;
						}
					}
				}
				//if test has video then display
				if(d2.data[0].video){
					tests.results[x].video="<figure><video controls src="+d2.data[0].video.url+"></video><figcaption>Video recording of test</figcaption></figure>";
				}
				//for each step
				for(y=0;y<d2.data[0].steps.length;y++){
					tests.results[x].steps[y]=[];
					tests.results[x].steps[y].notes="<strong class='step "+d2.data[0].steps[y].passing+"'>Step "+(y+1)+":</strong>"+d2.data[0].steps[y].notes;
					if(d2.data[0].steps[y].error!=undefined){
						tests.results[x].steps[y].notes=
						"<strong class='step "+d2.data[0].steps[y].passing+"'>Step "+(y+1)+":<span class=error>"+d2.data[0].steps[y].error+"</span></strong>"+d2.data[0].steps[y].notes
						;
					}
					if(d2.data[0].steps[y].target!=""){
						tests.results[x].steps[y].notes+="<span class=target>"+d2.data[0].steps[y].target+"</span>";
					}
				}
				tests.results[x].class2=d2.data[0].screenshotComparePassing;
				if(d2.data[0].screenshotComparePassing==true){
					tests.results[x].screenshotResult="Screenshot Passed";
					tests.results[x].screenshots="<figure><figcaption>Screenshot</figcaption><a href="+d2.data[0].screenshot.original.defaultUrl+"><img src="+d2.data[0].screenshot.original.defaultUrl+"></a></figure>";
					tests.screenshotpasses++;
				}
				else if(d2.data[0].screenshotComparePassing==null){
					tests.results[x].class2="null";
					tests.results[x].screenshotResult="Screenshot Disabled";
					tests.screenshotnulls++;
				}
				else{
					tests.results[x].screenshotResult = "Screenshot is "+Math.round(Number(d2.data[0].screenshotCompareDifference)*100)+"% different from last";
					tests.results[x].screenshots="<figure><figcaption>Screenshot</figcaption><a href="+d2.data[0].screenshot.original.defaultUrl+"><img src="+d2.data[0].screenshot.original.defaultUrl+"></a></figure><figure><figcaption>Comparison to last</figcaption><a href="+d2.data[0].screenshotCompare.compareOriginal.defaultUrl+"><img src="+d2.data[0].screenshotCompare.compareOriginal.defaultUrl+"></a></figure>";
					tests.screenshotfails++;
				}
				
				tests.results[x].timeline=[];
				tests.results[x].history=[];
				for(r=0;r<d2.data.length;r++){
					tests.results[x].timeline.push(d2.data[r].executionTime);
					tests.results[x].history[r]=[];
					if(d2.data[r].passing==false || d2.data[r].screenshotComparePassing==false){
						tests.results[x].history[r].result=false;
					}
					else{
						tests.results[x].history[r].result=true;
					}
				}
				tests.results[x].svgmax=Math.max.apply(null,tests.results[x].timeline);
				tests.results[x].svgc=[];
				for(t=0;t<tests.results[x].timeline.length;t++){
					tests.results[x].svgc[t]=[];
					tests.results[x].svgc[t].c=100-(100*tests.results[x].timeline[t]/tests.results[x].svgmax);
				}
				
				console.log(x+1+"/"+d.data.length+" "+tests.results[x].name);
				
				if(x==d.data.length-1){
					var template = fs.readFileSync('test.hbs').toString();
					var compiled = Handlebars.compile(template);
					tests.suite = d.data[0].suite.name;
					tests.date = new Date();
					
					tests.totalpasses=0;
					tests.totalfails=0;
					for(test=0;test<d.data.length;test++){
						if(d.data[test].passing==false || d.data[test].screenshotComparePassing==false){
							tests.totalfails++;
						}
					}
					tests.totalpasses=d.data.length-tests.totalfails;
					//pie charts
					tp = tests.totalpasses/d.data.length;
					tf = tests.totalfails/d.data.length;
					
					x1=50+50*Math.sin(2*Math.PI*tp);
					y1=50-50*Math.cos(2*Math.PI*tp);
					if(tp>0.5){z1=1}
					else{z1=0}

					x2=50+50*Math.sin(2*Math.PI*(tp+tf));
					y2=50-50*Math.cos(2*Math.PI*(tp+tf));
					if(tf>0.5){z2=1}
					else{z2=0}

					tests.pietp="M 50 0 A 50 50 0 "+z1+" 1 "+x1+" "+y1+" L 50 50 Z";
					tests.pietf="M "+x1+" "+y1+" A 50 50 0 "+z2+" 1 "+x2+" "+y2+" L 50 50 Z";
					
					//test last ran
					earliest = tests.dates.reduce(function (pre, cur){
						return Date.parse(pre) > Date.parse(cur) ? cur : pre;
					});
					earliest = new Date(earliest);
					tests.earliest=earliest.toJSON().replace(/T/g," ").replace(/:/g,"-").replace(/\.\d{3}Z/g,"");
					//timestamp for report
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