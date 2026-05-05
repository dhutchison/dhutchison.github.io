# dhutchison.github.io

Source for [devwithimagination.com](https://www.devwithimagination.com), built
with Jekyll and the Chirpy theme.

## Local development

Install the Ruby dependencies:

```sh
bundle install
```

Run the site locally:

```sh
bundle exec jekyll serve --livereload
```

Build the site:

```sh
bundle exec jekyll build
```

## Posts

Drafts can be published with:

```sh
python3 scripts/publish_draft.py
```

Front matter for posts and drafts can be checked with:

```sh
find _posts _drafts -type f \( -name '*.markdown' -o -name '*.md' \) -print0 2>/dev/null | xargs -0 python3 scripts/validate_front_matter.py
```
