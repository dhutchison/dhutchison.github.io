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

## Image optimization

The devcontainer includes the same kinds of PNG optimization utilities used by
ImageOptim. Run the lossless optimizers with:

```sh
scripts/optimize_png.sh path/to/image.png
```

For large web images where a small colour reduction is acceptable, also try
`pngquant`:

```sh
scripts/optimize_png.sh --lossy path/to/image.png
```

Both modes overwrite an image only when they produce a smaller file. The
lossless mode tries OptiPNG, PNGCrush, and AdvPNG independently and keeps the
smallest result. Lossy mode also tries `pngquant` at 70-90 quality.
