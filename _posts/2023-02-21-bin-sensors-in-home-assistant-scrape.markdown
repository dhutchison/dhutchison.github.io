---
title: Bin Sensors in Home Assistant - Scrape
summary: Adding custom sensors for bin collections using the Scrape Integration
series: Bin Sensors in Home Assistant
series_part: 2
category:
- iot
tags:
- HomeAssistant
date: 2023-02-21 00:00
slug: bin-sensors-in-home-assistant-scrape
---
Continuing on from [last week's post][prev-post], I'll cover the new (and hopefully improved) version which adds to the [Mushroom Chips][mushroom-chips] I use at the start of my main dashboard. This is a slightly more complicated approach, but should also be kept up to date if the schedule changes as it uses the [Scrape Integration][ha-scrape-integration] to pull the information directly from a website.

![Dashboard Chips][img-dashboard-chips]

My local council has a webpage per street in the area which shows which bin(s) are due to be collected in the current week. The main index page for this is here - [Bin collections and calendar][slc-street-index].

Once you select a region and a street, you are presented with something like this:

![Bin webpage example][img-bin-example]

This shows either one or two bins depending on the schedule for the current week, as well as their names. From this I'll be picking up what the type of bin is as well as the colour for using in the chip. 

For each bin, this is the HTML that we ultimately want to extract values from is:

```html
<li>
  <h4>Food and garden <br/><p>No liquids, oils or plastic bags. <a href="https://www.southlanarkshire.gov.uk/info/200156/bins_and_recycling/1841/bins_-_what_goes_in_them/3">More info</a></p></h4>
  <img src="https://www.southlanarkshire.gov.uk/images/bin-red.png" alt="red bin">
</li>
```

<!--more-->

## Identifying the Selectors

As Home Assistant is using [BeautifulSoup][beautiful-soup] for scraping areas of the page based on the CSS selector it should have been possible to use the "Inspect Element" in the Safari developer tools, and use the "Copy Selector Path" right click option to get the selector path to use. This produced the selector path `#lower_content > div > div > div > ul > li:nth-child(1) > h4`.

However this didn't work in Home Assistant, so I made a quick python script using the BeautifulSoup library myself and it *also* didn't find the content. This is my quick test script:

```python
import requests
from bs4 import BeautifulSoup

response = requests.get("<insert url to street specific page>")

if response.status_code != 200:
  print("Error fetching page")
  exit()

else:
  soup = BeautifulSoup(response.content, 'html.parser')
  all_results = soup.select('#lower_content > div > div > div > ul > li:nth-child(1) > h4')

  print(all_results)
```

Running this just returns an empty array.

```sh
(venv) ➜  PythonBeautifulSoupTest python3 test.py 
[]
```

I didn't look too closely into why this mismatched (it could be a bug in either the library or the Safari developer tools), but from looking at the source HTML we could get away with a much less specific selector - simply targeting where there were list elements. Just focusing on the last few elements of the selector, `li:nth-child(1) > h4`, gets us the result we were looking for:

```sh
(venv) ➜  PythonBeautifulSoupTest python3 test.py
[<h4>Food and garden <br/><p>No liquids, oils or plastic bags. <a href="https://www.southlanarkshire.gov.uk/info/200156/bins_and_recycling/1841/bins_-_what_goes_in_them/3">More info</a></p></h4>]
```

## Scrape Sensors

The configuration of a scrape sensor is relatively simple once you know the configuration settings that you are needing.

For the names of the bins, the configuration values required are:

|---
| Bin Number | Select
|:-:|:-:
| 1 | `li:nth-child(1) > h4`
| 2 | `li:nth-child(2) > h4`

![Bin name sensor configuration][img-scrape-config-bin-name]

For the bin colours, it is a little bit more complicated as we use a *Value Template* to extract the colour name out of the alt text attribute of a selected tag.

|---
| Bin Number | Select | Attribute | Value Template
|:-:|:-:
| 1 | `li:nth-child(1) > img` | alt | `{% raw %}{{ value.split(" ")[0] }}{% endraw %}`
| 2 | `li:nth-child(2) > img` | alt | `{% raw %}{{ value.split(" ")[0] }}{% endraw %}`

![Bin colour sensor configuration][img-scrape-config-bin-colour]

Our end result is sensors reporting values like this:

![History view for bin sensors][img-ha-history]

## Dashboard Chip Configuration

As is a pattern with these posts, this is configurable through the UI but is easier to share as YAML. 

```yaml
{% raw %}
type: custom:mushroom-chips-card
chips:
  - type: template
    icon: mdi:delete
    icon_color: '{{ states(''sensor.bin_1_colour'') }}'
    content: '{{ states(''sensor.bin_1'') }}'
  - type: conditional
    conditions:
      - entity: sensor.bin_2
        state_not: unknown
    chip:
      type: template
      icon: mdi:delete
      icon_color: '{{ states(''sensor.bin_2_colour'') }}'
      content: '{{ states(''sensor.bin_2'') }}'
alignment: center
{% endraw %}
```

This defines a chip card containing two chips. Both of these use a template to define a chip with text for the type of the bin, with the icon colour being set. The second of these chips is wrapped in a conditional chip type so it is only displayed if there is a defined value.

![Dashboard Chips][img-dashboard-chips]

## Taking this Further?

At this point I stopped, for the number of days until the next collection I just use the solution from the last post. I had considered taking this even further and trying to use the information on the page to work out the date of the next collection, but that seemed awfully complicated for little extra value. At worst I need to update that script, and the council doesn't update the day on the page anyway when it changes due to seasonal holidays or other rare events.

[img-dashboard-chips]: /images/homeassistant-bin-sensors-scrape/dashboard-element.png "Dashboard Chips"
[img-bin-example]: /images/homeassistant-bin-sensors-scrape/slc-website-bin-example.png "Bin webpage example"
[img-ha-history]: /images/homeassistant-bin-sensors-scrape/ha-history-data.png "History view in Home Assistant"
[img-scrape-config-bin-name]: /images/homeassistant-bin-sensors-scrape/scrape-bin-name-config.png "Configuration options for scraping the name of a bin"
[img-scrape-config-bin-colour]: /images/homeassistant-bin-sensors-scrape/scrape-bin-colour-config.png "Configuration options for scraping the colour of a bin"

[prev-post]: /2023/02/11/bin-sensors-in-home-assistant-shell-and-template/ "Bin Sensors in Home Assistant - Shell & Template"

[beautiful-soup]: https://www.crummy.com/software/BeautifulSoup/ "Beautiful Soup - We called him Tortoise because he taught us."
[ha-scrape-integration]: https://www.home-assistant.io/integrations/scrape "Scrape - Home Assistant"
[mushroom-chips]: https://github.com/piitaya/lovelace-mushroom/blob/main/docs/cards/chips.md "lovelace-mushroom/chips.md at main - piitaya/lovelace-mushroom"
[slc-street-index]: https://www.southlanarkshire.gov.uk/info/200156/bins_and_recycling/1670/bin_collections "Bin collections and calendar - South Lanarkshire Council"
