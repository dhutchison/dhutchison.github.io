---
title: Avoiding passlib Dependency in Ansible When Generating Traefik User Files
summary: Avoid issues with missing Python dependencies like passlib by generating
  Traefik user files in Ansible using templating and password_hash. This lightweight
  alternative works seamlessly in restricted environments like TrueNAS.
tags:
- ansible
- traefik
date: 2025-05-22 22:47
slug: avoiding-passlib-dependency-in-ansible-when-generating-traefik-user-files
---
I use Ansible to manage my server configuration, including copying over version-controlled `docker-compose` files and application configuration. One such configuration is for [Traefik](https://doc.traefik.io/traefik/), where I maintain a user file for HTTP basic authentication. These credentials are sourced from 1Password at deploy time and stored in a format compatible with `htpasswd`.

## The Original Approach

Previously, I used the `ansible.builtin.htpasswd` module like so:

```
{% raw %}
    - name: Create traefik user file
      ansible.builtin.htpasswd:
        path: "{{ traefik_conf_dir }}/usersfile"
        name: "{{ lookup('onepassword', 'Traefik', field='username') }}"
        password: "{{ lookup('onepassword', 'Traefik', field='password') }}"
        owner: "{{ ansible_user }}"
        group: "{{ ansible_user }}"
        mode: 0644
{% endraw %}
```

However, after upgrading to TrueNAS 25.04 “Fangtooth”, this failed with the following error:

```
{% raw %}
TASK [Create traefik user file] ********************************************************************
An exception occurred during task execution. To see the full traceback, use -vvv. The error was: ModuleNotFoundError: No module named 'passlib'
fatal: [truenas]: FAILED! => {"changed": false, "msg": "Failed to import the required Python library (passlib) on truenas's Python /usr/bin/python3.11. Please read the module documentation and install it in the appropriate location. If the required library is installed, but Ansible is using the wrong Python interpreter, please consult the documentation on ansible_python_interpreter"}
{% endraw %}
```

This module requires the `passlib` library, which wasn’t available on the system. I didn’t want to modify the system Python installation just to resolve this, especially on an appliance OS like TrueNAS.

<!--more-->

## A Simpler Alternative

Instead, I switched to using a templated file with `ansible.builtin.template`, which doesn’t rely on `passlib`:

```
{% raw %}
    - name: Create traefik user file
      ansible.builtin.template:
        src: "{{ playbook_dir }}/../../host-configuration/{{ inventory_hostname }}{{ traefik_conf_dir }}/usersfile.j2"
        dest: "{{ traefik_conf_dir }}/usersfile"
        owner: "{{ ansible_user }}"
        group: "{{ ansible_user }}"
        mode: '0644'
      notify: restart traefik
{% endraw %}
```


The template file, `usersfile.j2`, looks like this:

```
{% raw %}
{{ lookup('onepassword', 'Traefik', field='username') }}:{{ lookup('onepassword', 'Traefik', field='password') | ansible.builtin.password_hash(hashtype="bcrypt") }}
{% endraw %}
```

This approach still produces a valid credentials file (using bcrypt instead of the default MD5), which Traefik supports — without requiring any additional dependencies.

## Final Thoughts

If you're hitting issues with the `htpasswd` module due to missing Python libraries (like `passlib`), templating the file with `password_hash` is a great lightweight workaround. It's dependency-free and works well in environments like TrueNAS where installing Python packages isn't ideal.
