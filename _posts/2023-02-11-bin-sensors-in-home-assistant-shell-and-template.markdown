---
title: Bin Sensors in Home Assistant - Shell & Template
summary: Adding custom sensors for bin collections
category:
- iot
tags:
- HomeAssistant
date: 2023-02-11 23:44
slug: bin-sensors-in-home-assistant-shell-and-template
---
As part of my Home Assistant dashboard I want to include useful information which is not directly related to smart devices in my home.

With the uptick in recycling in recent years, we now have 4 different bins that need to go out on the street on different weeks for collection. On the off-chance I'm one of the first in the street to be putting one or more of them out, I wanted a quick way to work out which should be going out.

The bins go out on a fixed day of the week, with a routine like this:

|---
| Bin Type | Schedule
|:-:|:-:
| Black/Green - Non Recyclable Waste | Thursday (Fortnightly)
| Burgundy - Food and garden | Thursday (Fortnightly)
| Blue (paper and card) | Thursday (4 Weekly)
| Light Grey - Glass, cans and plastics | Thursday (4 Weekly)

My first version of this dashboard element looks like this:

![Dashboard Card][img-dashboard-element]

This shows:

1. The bin(s) that are due to go out next
2. The day & date of the next collection
3. The number of days until the next collection

This requires some custom sensors to hold the next collection date and type, and there are (at least) two approaches that can be taken to achieve this:

1. Using the [shell command integration][ha-shell-command] and a pair of python scripts
2. Using a couple of [template sensors][ha-template]

<!--more-->

While these example templates are specific to my use case, they should be easily adaptable.

## Python Sensors

My original implementation was based on this [Home Assistant community post][python-ha-post] that uses a pair of Python scripts to produce the sensor values.

I won't go into much detail of what these do as the original post covers it, but my modified versions and configuration are shown below.

`waste_collection_type.py` calculates the type(s) of bin - this only populates a single sensor containing one or more bin values.

```python
{% raw %}
import datetime

today = datetime.date.today()
if today.weekday() > 3:
  # If this Thursday has passed, we only care about next week.
  today = today + datetime.timedelta((0 - today.weekday()) % 7)

# Get the ISO week number (1-52~53)
week_number = today.isocalendar()[1]

# Bin cycle goes:
# - Landfill
# - Recycling & Garden Waste
# - Landfill
# - Paper & Garden Waste

if (week_number % 2) == 0:
  # Even weeks are for Landfill waste
  collection_type = 'Landfill'
elif (week_number % 4) == 3:
  collection_type = 'Paper & Garden Waste'
else:
  collection_type = 'Recycling & Garden Waste'

print(collection_type)
{% endraw %}
```

`waste_collection_date.py` calculates the next bin day.

```python
{% raw %}
import datetime
import json

today = datetime.date.today()
# Normal collection day is Thursday, day 3 of a zero-indexed week.
if today.weekday() > 3:
  # If this Thursday has passed, we only care about next week.
  today = today + datetime.timedelta((0 - today.weekday()) % 7)

this_week = dates = [today + datetime.timedelta(days=i) for i in range(0 - today.weekday(), 7 - today.weekday())]

# Set the collection date to next Thursday.    
next_collection = today + datetime.timedelta((3 - today.weekday()) % 7) 

print(next_collection)
{% endraw %}
```

I have these in a scripts directory in my home assistant config directory, and the `configuration.yaml` turns these into sensors with this configuration:

```yaml
{% raw %}
sensor:
  - platform: command_line
    name: Next Bin Collection
    command: "python3 /config/scripts/waste_collection_date.py"
  - platform: command_line
    name: Bin Collection Type
    command: "python3 /config/scripts/waste_collection_type.py"
{% endraw %}
```

## Template Sensors

While looking back at what the Python scripts were doing, I figured this could probably also be achieved using Template sensors.

For the next collection date, the template would be something like this:

```yaml
{% raw %}
template:
  - sensor:
      - name: 'Next Bin Date'
        state: >-
          {% if now().weekday() > 3 %}
            {{ now().date() - timedelta(days=(now().weekday())) + timedelta(days=10) }}
          {%- else -%}
            {{ now().date() - timedelta(days=(now().weekday())) + timedelta(days=3) }}
          {%- endif -%}
{% endraw %}
```

The name for the next bin(s) would be:

```yaml
{% raw %}
template:
  - sensor:
      - name: 'Next Bin Types Template'
        state: >-
          {% if now().weekday() > 3 %}
            {% set week_number = (now().date() - timedelta(days=(now().weekday()))).isocalendar()[1] %}
          {%- else -%}
            {% set week_number = (now().date() - timedelta(days=(now().weekday())) + timedelta(7)).isocalendar()[1] %}
          {%- endif -%}
          
          {% if (week_number % 2) == 0 %}
            Landfill
          {%- elif (week_number % 4) == 3 -%}
            Paper & Garden Waste
          {%- else -%}
            Recycling & Garden Waste
          {%- endif -%}
{% endraw %}
```

## The Dashboard Card

The dashboard card is made using the [Mushroom Template card][mushroom-template-card]. While this can all be configured through the UI, the YAML code is easier to share.

```yaml
{% raw %}
type: custom:mushroom-template-card
primary: '{{ states(''sensor.bin_collection_type'') }}'
secondary: >-
  {{ states('sensor.next_bin_collection') | as_timestamp() |
  timestamp_custom('%a %d/%m/%Y') }}


  {{ (((states('sensor.next_bin_collection') | as_timestamp()) -
  as_timestamp(now()))  / 86400) | round()}} Days
entity: sensor.bin_collection_type
icon: mdi:trash-can-outline
multiline_secondary: true
{% endraw %}
```

This sets the primary information to be the type of bin, and the secondary information to contain the next collection date and number of days until that date using some templating. This is configured to use the python versions of the sensors just now, but could easily be changed to use the template based versions.

[mushroom-template-card]: https://github.com/piitaya/lovelace-mushroom/blob/main/docs/cards/template.md "lovelace-mushroom/template.md at main - piitaya/lovelace-mushroom"

[img-dashboard-element]: /images/homeassistant-bin-sensors-shell-template/dashboard-element.png "Dashboard Card"

[ha-shell-command]: https://www.home-assistant.io/integrations/shell_command/ "Shell Command - Home Assistant"
[ha-template]: https://www.home-assistant.io/integrations/template/ "Template - Home Assistant"
[python-ha-post]: https://community.home-assistant.io/t/bin-waste-collection/55451/57 "Bin / Waste Collection - Share your Projects! - Home Assistant Community"
