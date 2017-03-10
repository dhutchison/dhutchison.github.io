  function loadJSON(callback) {   

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");

    xobj.open('GET', '/feed.json', true);
 
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            /* Required use of an anonymous callback as .open will 
               NOT return a value but simply returns undefined in 
               asynchronous mode */
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
 }

function loadData() {
    loadJSON(function(response) {
        /* Parse JSON string into object */
        window.dwi_feed_JSON = JSON.parse(response);

        doSearch();	    
	});
}

function doSearch(searchTerms) {

    var searchTerms = document.getElementById("searchCondition").value.toLowerCase();

	if (window.dwi_feed_JSON === undefined) {
		/* Data has not been loaded yet, load it (this will call this search mathod again) */

		console.log("Loading JSON data");
		loadData();
	} else {
		/* Data is already available. Perform the search */

		var jsonFeed = window.dwi_feed_JSON;

		console.log("Search terms: '%s'", searchTerms);
		
        /* Split into the individual condition parts */
        var searchConditionParts = searchTerms.split(' ');

        console.log('Search condition parts are %O', searchConditionParts);

        /* Array which will hold our results */
        var searchResults = [];

        /* Loop through the posts in the feed, scoring each of them */
        for (var i = 0; i < jsonFeed.length; i++) {

            var checkItem = jsonFeed[i];

            var potentialMatch = {
                "titleMatches": 0,
                "tagMatches": 0,
                "categoryMatches": 0,
                "contentMatches": 0
            };

            /* Use each condition word to compare - probably horrible performance! */
            for (var s = 0; s < searchConditionParts.length; s++) {
                
                var testCondition = searchConditionParts[s];
                if (testCondition.length > 0) {

                    /* For tag and category searches we want to find things that
                     * start with the search term 
                     */
                    var testConditionRegex = new RegExp('^' + testCondition, 'i');

                    /* Check for any tag matches */
                    var tagMatches = checkItem['tags'].filter(
                            function(item){
                                return testConditionRegex.test(item);
                            }).length;
                    if (tagMatches > 0) {
                        potentialMatch['data'] = checkItem;
                        potentialMatch['tagMatches'] += tagMatches;

                    }

                    /* Check for any category matches */
                    var categoryMatches = checkItem['categories'].filter(
                            function(item){
                                return testConditionRegex.test(item);
                            }).length;
                    if (categoryMatches > 0) {
                        potentialMatch['data'] = checkItem;
                        potentialMatch['categoryMatches'] += categoryMatches;
                    }
                        
                    /* We only want the test condition to be matched if it is not prefixed
                    * by an alphabetic character. So searching for 'lock' will not match 
                    * with 'block'. */
                    testConditionRegex = new RegExp('[^A-Za-z]' + testCondition, 'i');
                    
                    /* Check for any matches in the post title */
                    var titleMatches = jsonFeed[i]['title'].split(testConditionRegex).length - 1;
                    if (titleMatches > 0) {
                        potentialMatch['data'] = checkItem;
                        potentialMatch['titleMatches'] += titleMatches;
                    }

                    /* Check for any matches in the post content */
                    var contentMatches = jsonFeed[i]['content'].split(testConditionRegex).length - 1;
                    if (contentMatches > 0) {
                        potentialMatch['data'] = checkItem;
                        potentialMatch['contentMatches'] += contentMatches;
                    }

                }

            }

            if (potentialMatch['data'] !== undefined) {
                /* Matched on some critera */
                searchResults.push(potentialMatch);
            }

        }

        if (searchResults.length > 0) {
            /* If there are any results, we need to display them */

            /* Sort the results */
            searchResults.sort(
                function(a, b) {

                    var compareResult = b['tagMatches'] - a['tagMatches'];

                    if (compareResult === 0) {

                        compareResult = b['categoryMatches'] - a['categoryMatches'];

                        if (compareResult === 0) {

                            compareResult = b['titleMatches'] - a['titleMatches'];

                            if (compareResult === 0) {
                                /* title matches were the same, also consider content matches */
                                compareResult = b['contentMatches'] - a['contentMatches'];
                            }
                        }
                    }

                    return compareResult;
                }
            );

            /* Produce the results HTML */
            var resultsHTML = ''

            for (var i = 0; i < searchResults.length; i++) {

                var r = searchResults[i];

                resultsHTML += 
                    '<article class="post">' + 
		                '<header class="heading">' + 
			                '<h2>' + 
				                '<a href="' + r['data']['link'] + '" class="title">' + r['data']['title'] + '</a>' +
			                '</h2>' + 
			                '<p class="meta">' +
			                '<time datetime="' + r['data']['date'] + '" data-updated="true" title="' + searchResults[i]['date'] + '">' +
                            + r['data']['date'] + '</time>' + 
		                '</header>' + 
                        '<article>' + 
                            '<p>Match Conditions</p>' + 
                            '<ul>' +
                                '<li>Tag Matches: ' + r['tagMatches'] + '</li>' + 
                                '<li>Category Matches: ' + r['categoryMatches'] + '</li>' + 
                                '<li>Title Matches: ' + r['titleMatches'] + '</li>' + 
                                '<li>Content Matches: ' + r['contentMatches'] + '</li>' + 
                            '</ul>' + 
                        '</article>' + 
                        '<footer>';
                if (r['data']['categories'].length > 0) {
                    var categories = r['data']['categories'];
                    resultsHTML +=
                            '<div>' + 
                                '<h4 class="tagListTitle">Posted in: </h4>' + 
		                        '<ul class="groupingList">';
                    for (var c = 0; c < categories.length; c++) {
                        resultsHTML += 
                                    '<li class="category">' +
				                        '<a href="/archives/categories/' + encodeURIComponent(categories[c].toLowerCase()) + '">' + 
				                            categories[c] + 
				                        '</a>' + 
				                    '</li>';
                    }
			
		            resultsHTML += 
                                '</ul>'+
	                        '</div>';
                }

                if (r['data']['tags'].length > 0) {
                    var tags = r['data']['tags'];
                    resultsHTML +=
                            '<div>' + 
                                '<h4 class="tagListTitle">Tagged with: </h4>' + 
		                        '<ul class="groupingList">';
                    for (var c = 0; c < tags.length; c++) {
                        resultsHTML += 
                                    '<li class="tag">' +
				                        '<a href="/archives/tags/' + encodeURIComponent(tags[c].toLowerCase()) + '">' + 
				                            tags[c] + 
				                        '</a>' + 
				                    '</li>';
                    }
			
		            resultsHTML += 
                                '</ul>'+
	                        '</div>';
                }

                resultsHTML +=
		                '</footer>' +
                    '</article>'
            }

            document.getElementById('searchResults').innerHTML = resultsHTML
        } else {
            /* No results to display */
            document.getElementById('searchResults').innerHTML = '<p class="noResults">No Results Found</p>'
        }
    }
}