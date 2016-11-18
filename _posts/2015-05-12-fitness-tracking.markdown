---
title: Fitness Tracking
image: /images/charts/cycle.png
description: I made some graphs from Google Sheet data.
date: 2015-05-12 22:39
slug: fitness-tracking
---
I have been quiet for a little while, in part due to needing a rest in my free time away from code. Now I have some personal projects on the go, and one is about ready to see the light of day.

Since just after Christmas I have been trying to get a bit fitter, and I am trying to achieve this by cycling on an exercise bike. I am getting the hang of playing Xbox games while on the bike (currently a mixture of [Watch_Dogs][watch_dogs] and [Saints Row IV][saints_row]) so I can combine a lazy activity with an active one!

Of course I’ve been keeping track of my cycling sessions, since the new year at least, so I wanted to build something to visualise this data.

<!--more-->

## Data source

I record in a Google spreadsheet:
- Date
- Distance (in KM)
- Duration
- Calories burned[^1] 

A little bit of searching lead me to [this post][1], which shows how to get a JSON feed for a Google Spreadsheet.

In the Google sheets web interface you need to publish the sheet using `File -> Publish to the Web`.

![Step 1 of the publish][chart1]

This will allow you to customise the details of what is published, and give you a URL such as:

    https://docs.google.com/spreadsheets/d/YOUR-KEY-HERE/pubhtml?gid=0&single=true

If you take the part in the place I have replaced with `YOUR-KEY-HERE` and paste it into this URL, you will get a JSON representation of the Google Sheet data.

    https://spreadsheets.google.com/feeds/list/PUT-KEY-HERE/od6/public/values?alt=json

In order to not (potentially) hammer this resource, I am taking a daily snapshot of this JSON feed with a service running on [OpenShift][openshift]. This is configured as a cron job running daily. Setup of this task is in the [OpenShift documentation][openshift-cron].

In my OpenShift project directory I need to add the `cron` cartridge and configure the task.

    
    mm:php david$ rhc cartridge add cron -a php
    Using cron-1.4 (Cron 1.4) for ‘cron’
    Adding cron-1.4 to application ‘php’ … done
    
    cron-1.4 (Cron 1.4)
    —————————
      Gears: Located with php-5.4, mysql-5.5
    
    To schedule your scripts to run on a periodic basis, add the scripts to 
    your application’s .openshift/cron/{minutely,hourly,daily,weekly,monthly}/
    directories (and commit and redeploy your application).
    
    Example: A script .openshift/cron/hourly/crony added to your application
             will be executed once every hour.
             Similarly, a script .openshift/cron/weekly/chronograph added
             to your application will be executed once every week.
    mm:php david$ mkdir -p .openshift/cron/daily
    mm:php david$ echo ‘curl https://spreadsheets.google.com/feeds/list/PUT-KEY-HERE/od6/public/values?alt=json -o $OPENSHIFT_REPO_DIR/workout.json’ > .openshift/cron/daily/downloadJson.sh


This will cause my OpenShift gear to download this as a file once per day (given that I at most exercise daily, this is frequent enough to get fairly up to date data).

The format of this JSON export, while looking like an XML to JSON conversion, was workable. I implemented the complete functionality with this unmodified version, but it was large. My 6 column, 64 row spreadsheet resulted in 53kb of JSON output. This seems unreasonably large for the source data, and overkill for what the client graphing implementation requires.

The solution to this was to rewrite the JSON file with the pieces of data required. The field names in this rewrite were kept similar to those used by the original feed so I could maintain compatibility for both formats in my JavaScript code without duplication.

This was achieved by adding an additional step to my cron task:

    python $OPENSHIFT_REPO_DIR/py/manipulateJSON.py $OPENSHIFT_REPO_DIR/py/workout.json $OPENSHIFT_REPO_DIR/workout_shrunk.json

{% highlight python linenos %}
/* manipulateJSON.py */
import json
import sys
from pprint import pprint

def write_file(file_details, dest_file):

	with open(dest_file, ‘w’) as output_file:
		json.dump(file_details, output_file)

def main():

    source_file = sys.argv[1]
    dest_file = sys.argv[2]

    with open(source_file) as data_file:    
        data = json.load(data_file)
    
    newData = list()
    for singleEntry in data[‘feed’][‘entry’]:
        newEntry = dict()
        newEntry[‘date’] = singleEntry[‘gsx$date’][‘$t’]
        newEntry[‘distancekm’] = singleEntry[‘gsx$distancekm’][‘$t’]
        newEntry[‘time’] = singleEntry[‘gsx$time’][‘$t’]
        newEntry[‘kcal’] = singleEntry[‘gsx$kcal’][‘$t’]
        pprint(newEntry)
        
        newData.append(newEntry)

    write_file(newData, dest_file)

if __name__ == "__main__”:
    main()
{% endhighlight %}

## Graphing

I had a quick look at libraries which were available, and [Chart.js][chartjs] looked to be the simplest approach.

From the documentation, creating a chart (once the data is in the correct format) can be as simple as these two lines of JavaScript:

    var ctx = document.getElementById("myChart”).getContext("2d”);
    var myNewChart = new Chart(ctx).PolarArea(data);

Of course I had to write a lot more to achieve the feature set I was after. I won’t go into intricate details of this code - it is available on [GitHub][gh-chart] and is very specific to my use case. Basically I had wanted to implement different views of the data, so aggregates for year/month were available and the unit of distance could be changed. I record my distances in KM as that is what my bike computer displays, but I think in Miles. Also, I wanted to be able to drill down onto one of these aggregate areas; for example to view how many Miles I cycled this month.

This feature was possible by adding an `onclick` function to the canvas which the graph is displayed on. This event can be used to get the points on the Graph which were clicked. I use the label from this click point to do some, rather hacky, filtering of the data for the next most granular view of the data. The library unfortunately does not allow you to specify the format for the labels, so the code requires to convert between month names and numbers before performing any comparisons.

## Last minute issues

During the whole development process of this feature I had been graphing based on a JSON file which was deployed with my development version of the site. As a final test I had switched this to use the JSON file from my OpenShift gear - and this failed. I am relatively new to modern JavaScript and I had stumbled across [Cross-origin resource sharing (CORS)][cors]. Thankfully this was [easy to fix][cors-fix].

I just needed to add this to the `.htaccess` file in the location my JSON file was located.

    <IfModule mod_headers.c>
        SetEnvIf Origin "http(s)?://(www.|dev.)(devwithimagination.com)$” AccessControlAllowOrigin=$0$1
        Header add Access-Control-Allow-Origin %{AccessControlAllowOrigin}e env=AccessControlAllowOrigin
    </IfModule>

This is a bit more complicated than possibly is required, but I wanted the resource to be available to both my production and development site.

## Result

My [cycling stats][cstats] page is now live!

The source for this site is, as always, available on [GitHub][gh] if you are interested.

Chartjs looks very powerful, and I have only just scratched the surface. I’ll revisit this library when I next have a data-driven project to implement.

[^1]: I know this figure is not going to be accurate in any way. I’m not a scientist, but I would expect that for the bike to make even a semi-accurate estimation that it would have to take in to account the resistance setting which is being used.

[1]: https://coderwall.com/p/duapqq/use-a-google-spreadsheet-as-your-json-backend "coderwall.com : establishing geek cred since 1305712800 "
[openshift]: https://www.openshift.com/ "OpenShift by Red Hat "
[openshift-cron]: https://access.redhat.com/documentation/en-US/OpenShift/2.0/html/User_Guide/sect-OpenShift-User_Guide-Scheduling_Timed_Jobs_with_Cron.html "6.5. Scheduling Timed Jobs with Cron "
[chartjs]: http://www.chartjs.org/ "Chart.js | Open source HTML5 Charts for your website "
[json-loading]: http://codepen.io/KryptoniteDove/blog/load-json-file-locally-using-pure-javascript "Load JSON file locally using pure Javascript by Rich on CodePen "
[watch_dogs]: http://www.amazon.co.uk/gp/product/B0089AGFGG/ref=as_li_tl?ie=UTF8&camp=1634&creative=19450&creativeASIN=B0089AGFGG&linkCode=as2&tag=devwithimag-21&linkId=Q6QTFKCPV7FAQHDJ "Watch Dogs - Microsoft Xbox 360"
[saints_row]: http://www.amazon.co.uk/gp/product/B00CLDQH10/ref=as_li_tl?ie=UTF8&camp=1634&creative=19450&creativeASIN=B00CLDQH10&linkCode=as2&tag=devwithimag-21&linkId=XJDZT26U64RXU3XT "Saints Row IV (Xbox 360)"
[cors]: http://en.wikipedia.org/wiki/Cross-origin_resource_sharing "Cross-origin resource sharing - Wikipedia, the free encyclopedia "
[cors-fix]: http://www.webdevdoor.com/jquery/cross-domain-browser-json-ajax/ "Enable cross-domain, cross-browser AJAX/JSON calls using jQuery"
[cstats]: /cycle/ "Cycling Stats"
[gh]: https://github.com/dhutchison/dhutchison.github.io "dhutchison/dhutchison.github.io"
[gh-chart]: https://github.com/dhutchison/dhutchison.github.io/tree/master/assets/js/DWIChart.js
[chart1]: /images/charts/publishweb1.png "Step 1 of the publish dialog"
[chart2]: /images/charts/publishweb2.png "Step 2 of the publish dialog"
