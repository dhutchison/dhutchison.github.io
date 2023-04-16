---
title: Using Actionable Notifications in Home Assistant
link: https://smarthomepursuits.com/yes-no-actionable-notification-home-assistant-android/
summary: Using actionable notifications in Home Assistant to save energy, catching
  lights left on when kids leave for school.
category:
- iot
tags:
- HomeAssistant
date: 2023-04-16 23:01
slug: using-actionable-notifications-in-home-assistant
---
I’ve seen a bunch of videos on YouTube lately that included actionable notifications in automations, but it’s not something I’d ever used before.

The [Home Assistant companion documentation][actionable-notification-docs] shows plenty of examples of how to include the actions in the notifications,  but not much on how to actually respond to the action events. I came across [this post][post] that I found was a good starting point for my automation.

My initial use case for this was for a notification in the morning when the kids should be out to school, to prompt me to turn out any lights that they have inevitably left on.

My current automation for this is as follows. This checks if any of three lights are still on at 8am on a weekday, and if so sends a notification to my phone with the option to turn them off.

~~~ yaml
{% raw %}
alias: Notify - Kids lights left on
description: ""
trigger:
  - platform: time
    at: "08:00:00"
condition:
  - condition: and
    conditions:
      - condition: time
        weekday:
          - mon
          - tue
          - wed
          - thu
          - fri
        alias: Is it a weekday?
      - condition: or
        conditions:
          - condition: state
            entity_id: light.childone_room_cloud_light
            state: "on"
          - condition: state
            entity_id: light.childone_room_bulb
            state: "on"
          - condition: state
            entity_id: light.childtwo_bedroom_main_bulb
            state: "on"
        alias: Are any of the boys lights on?
action:
  - alias: Set up variables for the actions
    variables:
      action_no: "{{ 'NO_' ~ context.id }}"
      action_turnoff: "{{ 'TURNOFF_' ~ context.id }}"
  - alias: Notify Mobile
    service: notify.mobile_app_twelve
    data:
      message: Boys lights are still on. Turn off?
      data:
        actions:
          - action: "{{ action_turnoff }}"
            title: Turn off lights
          - action: "{{ action_no }}"
            title: Leave On
  - alias: Wait for a response
    wait_for_trigger:
      - platform: event
        event_type: mobile_app_notification_action
        event_data:
          action: "{{ action_no }}"
      - platform: event
        event_type: mobile_app_notification_action
        event_data:
          action: "{{ action_turnoff }}"
  - alias: Perform the action
    choose:
      - conditions: "{{ wait.trigger.event.data.action == action_no }}"
        sequence: []
      - conditions: "{{ wait.trigger.event.data.action == action_turnoff }}"
        sequence:
          - service: light.turn_off
            data: {}
            target:
              entity_id:
                - light.childone_room_bulb
                - light.childtwo_bedroom_main_bulb
                - light.childone_room_cloud_light
mode: single
{% endraw %}
~~~

[actionable-notification-docs]: https://companion.home-assistant.io/docs/notifications/actionable-notifications/ "Actionable Notifications | Home Assistant Companion Docs"
[post]: https://smarthomepursuits.com/yes-no-actionable-notification-home-assistant-android/ "Yes/No Actionable Notification for Home Assistant on Android - Smart Home Pursuits"
