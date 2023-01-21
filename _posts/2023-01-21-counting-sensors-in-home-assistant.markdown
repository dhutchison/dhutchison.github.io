---
title: Counting Sensors in Home Assistant
summary: How to create counts of sensors on a Home Assistant dashboard
category:
- iot
tags:
- HomeAssistant
date: 2023-01-21 00:30
slug: counting-sensors-in-home-assistant
---
I have been building up my Home Assistant dashboard for a while, mostly using [Mushroom Cards][mushroom-cards]. My main dashboard started off largely inspired by [this Everything Smart Home][youtube-video] tutorial and has continued to evolve as I have thought of new ways to make it more useful. 

At the very top of my dashboard I have a few informational chips:

![Dashboard Chips][img-dashboard-chips]

From left to right is the built-in weather chip, followed by a count of the lights currently on and then a count of devices that have updates available to them. 

These latter two chips use custom sensors created using the [template integration][template-integration] and took a bit of fiddling to get working right, so I thought it was at least worth sharing *my* configuration. Yours will likely be a bit different depending on exactly what combination of devices & integrations you use. This integration is not currently configurable through the user interface so requires updates to the Home Assistant `configuration.yaml` file (or whereever you have your cusom sensors defined). 

<!--more-->

## Lights

My sensor configuration is:

```
{% raw %}
template:
  - sensor:
      - name: 'Lights On'
        state: "{{ states.light | rejectattr('entity_id', 'in',  ['light.main_bedroom', 'light.child_bedroom_group', 'light.living_room', 'light.hall'])  | selectattr('state', 'eq', 'on') | list | count }}"
{% endraw %}
```

Creating these sensors was the first time I had really worked with Jinja2 templating, but if you have used any kind of templating configuration language before the conceps are pretty similar. 

Breaking this one down our state definition has 5 main parts, separated with pipe (`|`) characters:

1. `states.light` - start with all the state information for the `light` type of entities
2. `rejectattr('entity_id', 'in' <list of items>` - filter out any items with an `entity_id` in the following list. I use this to avoid double counting some lights as both the light and the light group are included in `states.light`. This might be a quirk from the groups coming through from Zigbee2MQTT, but does not appear to be a way to exclude the light groups automatically by filtering an attribure, so I am needing to do manually by name.
3. `selectattr('state', 'eq', 'on')` filter the list of items to only those which have a `state` attribute with a value of `on`. This is how we restrict to only lights which are currently turned on
4. `list` - converts the results into a list
5. `count` - counts the items in the source list and returns the number


In my dashboard I have the chip using this sensor configured to navigate to a view showing all the lights in the house and their state (on or off). From this one view all the lights in the hour can be controlled. 

## Updates

In a very similar fashion to the light count sensor, I have a count for all the [Update entities][update-entity] that are reporting that an update is available for a device or service. With the integrations I currently have enabled this includes Zigbee device firmare updates, OS updates for my Unifi devices, and software updates for PiHole. 

My sensor configuration is:

```
{% raw %}
template:
  - sensor:
      - name: 'Updates Available'
        state: "{{ states.update | rejectattr('entity_id', 'in',  ['update.pi_hole_homepi_core_update_available', 'update.pi_hole_homepi_ftl_update_available', 'update.pi_hole_homepi_web_update_available']) | selectattr('state', 'eq', 'on') | list | count }}"
{% endraw %}
```

This follows the same 5 definition parts as the light count, with the key difference this uses `states.update` to get the state information for the `update` entity type. Again I am filtering out some items, this time as I know one of my Pi-hole instances is out of date and cannot be updated until I do a major OS upgrade. 

In my dashboard I wanted this to behave a bit different from the light setup - to switch to a view just showing the devices with updates. There is an Updates view in the Home Assistant configuration, but this only shows updates that can be installed through Home Assistant itself. I use some other integrations, such as the Unifi one, that will show in Home Assistant when I have device OS updates available, but the installation of these cannot be triggered by Home Assistant. 

### Update View

![Update dynamic entities cards][img-update-view]

As far as I could find there is no native features in Home Assistant to allow using templating to define cards to display, but I did find the [auto-entities][auto-entities] custom card that can be installed via HACS. This custom card basically allows creating templates for creating other cards based on entities matching certain criteria.

To create mushroom [update cards][mushroom-update-card] using the same criteria as the template sensor, the dashboard component needed to be configured with the YAML code editor. The card can be configured by the UI, but it would not allow configuration of the `excludes` that I have. My layout was also helped by [this issue][auto-entities-vertical-layout] which showed an example of having the templated cards appear in a vertical-stack. 

My view configuration to achieve this is:

```
{% raw %}
type: vertical-stack
cards:
  - type: custom:mushroom-template-card
    primary: Updates Available
    secondary: '{{ states(''sensor.updates_available'') }}'
    entity: sensor.updates_available
    icon: mdi:cellphone-arrow-down
    icon_color: |-
      {% if ((states('sensor.updates_available') | int) > 0) %}
        amber
      {% else %}
        gray
      {% endif %}
  - type: custom:gap-card
  - type: custom:auto-entities
    card:
      type: vertical-stack
    card_param: cards
    filter:
      include:
        - entity_id: update.*
          state: 'on'
          options:
            type: custom:mushroom-update-card
            show_buttons_control: true
            entities:
              - this.entity_id
      exclude:
        - entity_id: update.pi_hole_homepi_core_update_available
        - entity_id: update.pi_hole_homepi_ftl_update_available
        - entity_id: update.pi_hole_homepi_web_update_available
{% endraw %}
```


## Complete Chip Configuration

The final configuration for the chips card containing my three chips is:

```
{% raw %}
type: custom:mushroom-chips-card
chips:
  - type: weather
    entity: weather.home
    show_conditions: true
    show_temperature: true
  - type: template
    content: '{{ states(''sensor.lights_on'') }}'
    icon: mdi:lightbulb-group
    icon_color: |-
      {% if ((states('sensor.lights_on') | int) > 0) %}
        amber
      {% else %}
        gray
      {% endif %}
    tap_action:
      action: navigate
      navigation_path: lights
  - type: template
    icon: mdi:cellphone-arrow-down
    icon_color: |-
      {% if ((states('sensor.updates_available') | int) > 0) %}
        amber
      {% else %}
        gray
      {% endif %}
    content: '{{ states(''sensor.updates_available'') }}'
    tap_action:
      action: navigate
      navigation_path: lab
alignment: center
{% endraw %}
```

This was all configured through the UI, but for sharing it is easier to show the YAML. 

[img-dashboard-chips]: /images/homeassistant-counting-sensors/dashboard-header-chips.png "Dashboard Chips"
[img-update-view]: /images/homeassistant-counting-sensors/update-view.png "Update dynamic entities cards"

[mushroom-cards]: https://github.com/piitaya/lovelace-mushroom "🍄 Mushroom"
[youtube-video]: https://youtu.be/gouMnPxYHDc "Creating a Beautiful Home Assistant Mobile Dashboard Easily! - Everything Smart Home - YouTube"

[template-integration]: https://www.home-assistant.io/integrations/template/ "Template - Home Assistant"
[update-entity]: https://www.home-assistant.io/integrations/update/ "Update - Home Assistant"

[auto-entities]: https://github.com/thomasloven/lovelace-auto-entities "thomasloven/lovelace-auto-entities - Automatically populate the entities-list of lovelace cards"
[auto-entities-vertical-layout]: https://github.com/thomasloven/lovelace-auto-entities/issues/310 "Mushroom entity cards with auto-entities · Issue #310 · thomasloven/lovelace-auto-entities"
[mushroom-update-card]: https://github.com/piitaya/lovelace-mushroom/blob/main/docs/cards/update.md "lovelace-mushroom/update.md at main · piitaya/lovelace-mushroom · GitHub"
