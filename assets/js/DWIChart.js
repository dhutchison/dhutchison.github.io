var renderedCharts = {};

function loadJSON(callback) {   

    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    
    xobj.open('GET', '/archives/workout_shrunk_archived.json', true); 
	
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            /* Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode */
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
 }

function extractData(jsonData, fieldName, restrictToDateRange) {
	var chartjsData = [];

	/* Work out which type of feed we are using, shrunk or full */
	var json = [];
	var shrunkFile = false;
	var dateFieldName = "date";
	if(jsonData['feed'] === undefined) {
		/* using the shrunk version of the feed */
		json = jsonData;
		shrunkFile = true;
	} else {
		/* Using the original version direct from Google */
		json = jsonData['feed']['entry'];
		/* our shrink process maintains the same field names as in the Google version, just without the "gsx$" prefix. */
		fieldName = "gsx$" + fieldName;
		dateFieldName = "gsx$" + dateField;
	}

	/* Iterate through the JSON data extracting the field values */
	var currentValue;
	var dateValue;
	for (var i = 0, currentValue=''; i < json.length; i++) {
		if(shrunkFile) {
			currentValue = json[i][fieldName];
			dateValue = json[i][dateFieldName];
		} else {
			currentValue = json[i][fieldName]['$t'];
			dateValue = json[i][dateFieldName]['$t'];
		}

		if(currentValue.indexOf(':') > -1) {
			/* Probably working with a time, split the bits and work out the total seconds */
			var parts = currentValue.split(":");
			if(parts.length == 3) {
				var seconds = (parseInt(parts[0], 10) * (60*60)) + (parseInt(parts[1], 10) * 60) + parseInt(parts[2], 10);
				currentValue = seconds;
			}
		} 

		if (includeDate(dateValue, restrictToDateRange)) {
			chartjsData.push(currentValue);  
		}
	}

	return chartjsData;
}

function loadData(dateParts, useKm, charts) {
	loadJSON(function(response) {
	  	/* Parse JSON string into object */
	    window.dwi_actual_JSON = JSON.parse(response);

		renderData(dateParts, useKm, charts);	    
	 });
}

function renderData(dateParts, useKm, charts, restrictToDateRange) {

	if (window.dwi_actual_JSON === undefined) {
		/* Data has not been loaded yet, load it (this will call render again) */

		console.log("Loading JSON data");
		loadData(dateParts, useKm, charts);
	} else {
		/* Data is already available. Render */

		var actual_JSON = window.dwi_actual_JSON;

		console.log("Restriction: " + restrictToDateRange);
		if (restrictToDateRange !== undefined) {
			restrictToDateRange = formatDate(restrictToDateRange, (dateParts-1));
			console.log("Restriction-formatted: " + restrictToDateRange);
		}

		/* load the titles - common to all graphs */
	    var titles = extractData(actual_JSON, 'date', restrictToDateRange);
	    

		drawDistanceGraph(actual_JSON, useKm, titles, charts, dateParts, restrictToDateRange);
	    drawDurationGraph(actual_JSON, useKm, titles, charts, dateParts, restrictToDateRange);
	    drawAverageSpeedGraph(actual_JSON, useKm, titles, charts, dateParts, restrictToDateRange);
	    drawSessionsGraph(actual_JSON, useKm, titles, charts, dateParts);
	}
}

function includeDate(date, restrictToDateRange) {

	var includeDate = false;

	if (restrictToDateRange !== undefined) {

		/* Using this as a workaround due to lack of universal support for endsWith */
		// console.log("Comparing " + date + " to " + restrictToDateRange);

		var index = date.indexOf(restrictToDateRange);
		if (index >= 0) {
			if (date.substr(index) == restrictToDateRange) {
				includeDate = true;
			}
		}
	} else {
		includeDate = true;
	}

	return includeDate;
}

/**
Draw the distance based graph.
*/
function drawDistanceGraph(jsonData, useKm, titles, charts, dateParts, restrictToDateRange) {

	if (charts['distance'] !== undefined) {
		var canvasName = charts['distance'];

    	var values = extractData(jsonData, 'distancekm', restrictToDateRange);

		if (!useKm) {
			values = convertKmValuesToMiles(values);
		}

		/* Configure the options */
		var options = {
			dwi_useAverage: true,
			dwi_useTotal: true
		};

	    /* Create the chart */
	    console.log("Drawing distance graph " + dateParts);
	    drawGraph(canvasName, dateParts, titles, values, useKm, charts, options);
	}
}

/*
Draw the graph of the duration of the session(s)
*/
function drawDurationGraph(jsonData, useKm, titles, charts, dateParts, restrictToDateRange) {

	if (charts['time'] !== undefined) {
		var canvasName = charts['time'];

	    var values = extractData(jsonData, 'time', restrictToDateRange);

	    var options = {
	    	scaleLabel: function (valuePayload) {

	    		var num = valuePayload['value'];

	    		var hours = Math.floor(num / (60*60));
	    		var remainder = num % (60*60);
	    		var minutes = Math.floor(remainder / (60));
	    		
	    		var displayValue = pad(hours) + ":" + pad(minutes);

			    return displayValue;
			},
			tooltipTemplate: function (valuePayload) {

	    		var num = valuePayload['value'];

	    		var hours = Math.floor(num / (60*60));
	    		var remainder = num % (60*60);
	    		var minutes = Math.floor(remainder / (60));
	    		
	    		var displayValue = ((valuePayload['label'] !== undefined) ? valuePayload['label'] + ": " : "") + pad(hours) + ":" + pad(minutes);

			    return displayValue;
			},
		    multiTooltipTemplate: function (valuePayload) {

	    		var num = valuePayload['value'];

	    		var hours = Math.floor(num / (60*60));
	    		var remainder = num % (60*60);
	    		var minutes = Math.floor(remainder / (60));
	    		
	    		var displayValue = pad(hours) + ":" + pad(minutes);

			    return displayValue;
			},
			dwi_useAverage: true,
			dwi_useTotal: true
	    }
	    
	    /* Create the chart */
	    console.log("Drawing time graph");
	    drawGraph(canvasName, dateParts, titles, values, useKm, charts, options);
	}
}

/*
Draw the graph showing the average speed of the session(s).
*/
function drawAverageSpeedGraph(jsonData, useKm, titles, charts, dateParts, restrictToDateRange) {


	if (charts['averageSpeed'] !== undefined) {
		var canvasName = charts['averageSpeed'];

		/* Load the values */
		var distancesKm = extractData(jsonData, 'distancekm', restrictToDateRange);
		var times = extractData(jsonData, 'time', restrictToDateRange);

		var distances = distancesKm;
		if (!useKm) {
			distances = convertKmValuesToMiles(distancesKm);
		}

		var values = [];
		for (var i = 0; i < times.length; i++) {
			var currentDistance = distances[i];
			var currentTimeHours = times[i] / (60 * 60);

			values.push(currentDistance / currentTimeHours);
		}

		/* Configure the options */
		var options = {
			dwi_useAverage: true,
			dwi_useTotal: false
		};

		/* Create the chart */
		console.log("Drawing average speed graph " + dateParts);
		drawGraph(canvasName, dateParts, titles, values, useKm, charts, options);
	}
}

function drawSessionsGraph(jsonData, useKm, titles, charts, dateParts) {

	if (charts['sessions'] !== undefined) {

		var canvasName = charts['sessions'];

		var options = {
			dwi_fixPrecision: false
		};

		/* Values are just '1' for each title (date) supplied */
		var values = [];
		for (var v in titles) {
			values.push(1);
		}

		/* Create the chart */
		console.log("Drawing sessions graph " + dateParts);
		drawGraph(canvasName, dateParts, titles, values, useKm, charts, options);
	}

}

/**
Function to convert an array of values from KM to Miles.
*/
function convertKmValuesToMiles(kms) {

	var miles = [];
	for(var i = 0; i < kms.length; i++) {
		miles.push(kms[i] * 0.621371192);
	}

	return miles;
}

/**
Draw a graph to the screen 

Parameters:
- canvasName - The id of the canvas element in the DOM to draw the graph to
- dateParts - The number of date components being used (3=day, 2=month, 1=year)
- titles - The x axis labels
- values - The y axis values. If the number of date parts is less than 3 these will be aggregated 
- useKm - Boolean showing if Kilometers are being used. If this is false Miles will be used.
- charts - Object holding which chart types are to be displayed.
- options - Configuration options for the chart.

Returns:
Nothing.
*/
function drawGraph(canvasName, dateParts, titles, values, useKm, charts, options) {

	/* Get the context of the canvas element we want to select */
	var canvas = document.getElementById(canvasName);
    var ctx = canvas.getContext("2d");

	/* Setup the configuration */
	options = typeof options !== 'undefined' ? options : {};
	// console.log("Options: " + options);

	/*options['showTooltips'] = false;*/
    options['responsive'] = true;
    options['legendTemplate'] = '<ul class="fa-ul">'
                  +'<% for (var i=0; i<datasets.length; i++) { %>'
                    +'<li>'
                    +'<i class="fa-li fa fa-stop fa-lg fa-fw" style=\"color:<%=datasets[i].pointColor%>\"></i>'
                    +'<% if (datasets[i].label) { %><%= datasets[i].label %><% } %>'
                  +'</li>'
                +'<% } %>'
              +'</ul>';

    if (dateParts == 3) {
	    /* increase the sensitivity of the tool tip display */
	    options['pointHitDetectionRadius'] = 1;
	}

	var fixPrecision = options['dwi_fixPrecision'];
	if (fixPrecision === undefined) {
		fixPrecision = true;
	} else {
		options['dwi_fixPrecision'] = undefined;
	}

    var datasets = [];

    var displayTitles;
    var showBarChart = false;
    if (dateParts < 3) {
    	/* Need to create average / total datasets */

    	/* Load our configuration options */
    	var useAverage = options['dwi_useAverage'];
    	if (useAverage === undefined) {
    		useAverage = false;
    	} else {
    		options['dwi_useAverage'] = undefined;
    	}

    	var useTotal = options['dwi_useTotal'];
    	if (useTotal === undefined) {
    		useTotal = true;
    	} else {
    		options['dwi_useTotal'] = undefined;
    	}

    	/* Get the datasets */
    	var datasetValues = getDatasets(titles, values, dateParts);

    	var totals = [];
    	var averages = [];
    	displayTitles = [];
    	for (var k in datasetValues) {
    		displayTitles.push(formatDate(k, dateParts));
        	if (datasetValues.hasOwnProperty(k)) {
        		if(fixPrecision) {
           			totals.push(datasetValues[k]['total'].toFixed(2));
           			averages.push(datasetValues[k]['average'].toFixed(2));
           		} else {
           			totals.push(datasetValues[k]['total']);
           			averages.push(datasetValues[k]['average']);
           		}
        	}
    	}
    	// console.log(titles);
    	// console.log(displayTitles);
    	// console.log(totals);
    	// console.log(averages);

    	if(totals.length <= 2) {
    		showBarChart = true;
    	}

    	if (useTotal) {
	    	var totalDS = {
	    		label: "Totals",
	    	    fillColor: "rgba(220,220,220,0.2)",	
	    	    strokeColor: "rgba(220,220,220,1)",
	    	    pointColor: "rgba(220,220,220,1)",
	    	    pointStrokeColor: "#fff",
	    	    pointHighlightFill: "#fff",
	    	    pointHighlightStroke: "rgba(220,220,220,1)",
	    	    data: totals
	    	};

	    	datasets.push(totalDS);
    	}

    	if (useAverage) {

    		var averageDS = {
	    		label: "Averages",
	    	    fillColor: "rgba(151,187,205,0.2)",
                strokeColor: "rgba(151,187,205,1)",
                pointColor: "rgba(151,187,205,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(151,187,205,1)",
	    	    data: averages
	    	};

	    	datasets.push(averageDS);
    	}
    } else {
    	/* Just use the supplied values, after rounding to 2 dp */

    	displayTitles = [];
    	for (var tIndex = 0; tIndex < titles.length; tIndex++) {
    		displayTitles.push(formatDate(titles[tIndex], dateParts));
    	}

    	if (fixPrecision) {
	    	var roundedValues = [];
	    	for (var index = 0; index < values.length; index++) {
	    		var num = new Number(values[index]);
	    		roundedValues.push(num.toFixed(2));
	    	}
	    	values = roundedValues;
    	} 

    	var ds = {
    		label: "Sessions",
    	    fillColor: "rgba(220,220,220,0.2)",	
    	    strokeColor: "rgba(220,220,220,1)",
    	    pointColor: "rgba(220,220,220,1)",
    	    pointStrokeColor: "#fff",
    	    pointHighlightFill: "#fff",
    	    pointHighlightStroke: "rgba(220,220,220,1)",
    	    data: values
    	};

    	datasets.push(ds);
    }

    var data = {
    	labels: displayTitles,
    	datasets: datasets
	};
	
    /* Create the chart */
    var existingChart = renderedCharts[canvasName];
    if(existingChart !== undefined) {
    	existingChart.destroy();
    }

    if(showBarChart) {
    	var barChart = new Chart(ctx).Bar(data, options);
    	renderedCharts[canvasName] = barChart;

		var legend = barChart.generateLegend();

    	document.getElementById(canvasName+"Legend").innerHTML = legend;


    	canvas.onclick = function(evt) {
    		console.log("CLICK");
	    	
	    	var activeBars = barChart.getBarsAtEvent(evt);
		    // => activeBars is an array of bars on the canvas that are at the same position as the click event.

	    	handleGraphClick(activeBars, dateParts, useKm, charts);

		};

    } else {
    	var myLineChart = new Chart(ctx).Line(data, options);
    	renderedCharts[canvasName] = myLineChart;

		var legend = myLineChart.generateLegend();

    	document.getElementById(canvasName+"Legend").innerHTML = legend;

	    canvas.onclick = function(evt){
	    	console.log("CLICK");
	    	var activePoints = myLineChart.getPointsAtEvent(evt);
	    	handleGraphClick(activePoints, dateParts, useKm, charts);
		};
    }

}

function handleGraphClick(activeGraphParts, dateParts, useKm, charts) {
	console.log("Active Parts: " + activeGraphParts);
	// => activePoints is an array of points on the canvas that are at the same position as the click event.
	if (activeGraphParts.length > 0 && activeGraphParts[0].label !== undefined && dateParts < 3) {

		var restrictToDateRange = activeGraphParts[0].label;
		console.log("Restricted Date Range: " + restrictToDateRange);

		var newDateParts = (dateParts + 1)
		document.getElementById("data-restriction").innerHTML = restrictToDateRange;

		var nextButton;
		if(newDateParts == 2) {
			nextButton = document.getElementById("gran_month");
		} else if (newDateParts == 3) {
			nextButton = document.getElementById("gran_day");
		}

		nextButton.checked = true;

		renderData(newDateParts, useKm, charts, restrictToDateRange);
	}
}

/**
Function to zero pad numbers so they are always two characters.
*/
function pad(d) {
    return (d < 10) ? '0' + d.toString() : d.toString();
}

function getDatasets(titles, values, dateFieldParts) {

	/* Presuming values and titles will be the same size */
	var datePartKey = '';
	var datasetValues = [];
	for (var i = 0; i < titles.length; i++) {

		datePartKey = getDatePartKey(titles[i], dateFieldParts);

		var thisKeyValues = datasetValues[datePartKey];

		if (thisKeyValues == undefined) {
			thisKeyValues = {
				average: 0,
				total: 0,
				values: []
			};
			datasetValues[datePartKey] = thisKeyValues;
		}
		thisKeyValues['values'].push(values[i]);
		thisKeyValues['total'] += parseInt(values[i]);
	}

	/* Work out what the average values are */
	for (var k in datasetValues) {
		if (datasetValues.hasOwnProperty(k)) {

			var currentValue = datasetValues[k];
           	currentValue['average'] = currentValue['total'] / currentValue['values'].length;
        }
	}

	return datasetValues;
}

function formatDate(str, dateFieldParts) {

	// console.log("Str: " + str);
	// console.log("Date field parts: " + dateFieldParts);
	
	// var monthNames = [  "January", "February", "March", "April", "May", "June",
	// 					"July", "August", "September", "October", "November", "December" ];

	var monthNames = [  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  						"Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];

	var retValue;
  	if(str.indexOf(' ') >= 0) {

  		var dateParts = str.split(' ');
  		var reformedDate = '';
  		for(var index = 0; index < dateParts.length; index++) {
  			
  			if (index > 0) {
  				reformedDate += '-';
  			}

  			var num = parseInt(dateParts[index], 10);
  			if(isNaN(num)) {
  				/* Presuming the month part */
  				reformedDate += pad(monthNames.indexOf(dateParts[index]) + 1);
  			} else {
  				/* Just a number */
  				reformedDate += pad(num);
  			}
  		}

  		retValue = reformedDate;

  	} else {

  		var date = getDatePartKey(str, dateFieldParts);
		// console.log("Date " + date);
		var parts = date.split('/');
		// console.log("parts: " + parts);
		
		if(parts.length == 1) {
			retValue = parts[0];
		} else {
	  		
	  	    if (parts.length == 2) {
	  	    	retValue = monthNames[parseInt(parts[0], 10)-1] + " " + parts[1];
	  	    } else if (parts.length == 3) {
	  	    	retValue = parts[0] + " " + monthNames[parseInt(parts[1], 10)-1] + " " + parts[2];
			}
		}
	}

	return retValue;

}

function getDatePartKey(str, dateFieldParts) {

	var parts = [];
	if (str.indexOf('-') >= 0) {
		parts = str.split('-');
	} else if (str.indexOf('/') >= 0) {
		parts = str.split('/');
	} else {
		parts.push(str);
	}

	// console.log("Parts: " + parts);
	var key = '';

	for (var i = (dateFieldParts-1); i >= 0; i--) {
		if (key.length > 0) {
			key += '/';
		}
		key += parts[(parts.length - 1)-i];
	}

	return key;
}