#!/usr/bin/env bash

set -euo pipefail

usage() {
    cat <<'EOF'
Usage: scripts/optimize_png.sh [--lossy] PNG_FILE [PNG_FILE ...]

Runs several PNG compressors and replaces each file only when a smaller valid
candidate is produced.

By default all pixel values are preserved. --lossy also tries pngquant with a
quality range of 70-90, which is useful for large web images but may alter
colours slightly.
EOF
}

lossy=false
files=()

while (($# > 0)); do
    case "$1" in
        --lossy)
            lossy=true
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        --)
            shift
            files+=("$@")
            break
            ;;
        -*)
            printf 'Unknown option: %s\n\n' "$1" >&2
            usage >&2
            exit 2
            ;;
        *)
            files+=("$1")
            ;;
    esac
    shift
done

if ((${#files[@]} == 0)); then
    usage >&2
    exit 2
fi

required_tools=(advpng optipng pngcrush)
if "$lossy"; then
    required_tools+=(pngquant)
fi

missing_tools=()
for tool in "${required_tools[@]}"; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        missing_tools+=("$tool")
    fi
done

if ((${#missing_tools[@]} > 0)); then
    printf 'Missing PNG optimization tools: %s\n' "${missing_tools[*]}" >&2
    printf 'Rebuild the devcontainer to install them.\n' >&2
    exit 1
fi

format_bytes() {
    numfmt --to=iec-i --suffix=B "$1"
}

for file in "${files[@]}"; do
    if [[ ! -f "$file" || "${file,,}" != *.png ]]; then
        printf 'Not a PNG file: %s\n' "$file" >&2
        exit 1
    fi

    temp_dir=$(mktemp -d)
    trap 'rm -rf "$temp_dir"' EXIT

    original_size=$(stat -c '%s' "$file")
    candidates=()
    candidate_paths=()
    candidate_pids=()

    optipng_candidate="$temp_dir/optipng.png"
    optipng -quiet -o2 -strip all -out "$optipng_candidate" "$file" &
    candidate_paths+=("$optipng_candidate")
    candidate_pids+=("$!")

    pngcrush_candidate="$temp_dir/pngcrush.png"
    pngcrush -q -reduce "$file" "$pngcrush_candidate" >/dev/null 2>&1 &
    candidate_paths+=("$pngcrush_candidate")
    candidate_pids+=("$!")

    advpng_candidate="$temp_dir/advpng.png"
    cp "$file" "$advpng_candidate"
    advpng -z -3 -q "$advpng_candidate" &
    candidate_paths+=("$advpng_candidate")
    candidate_pids+=("$!")

    if "$lossy"; then
        pngquant_candidate="$temp_dir/pngquant.png"
        pngquant --force --skip-if-larger --strip --quality=70-90 --speed=1 \
            --output "$pngquant_candidate" -- "$file" &
        candidate_paths+=("$pngquant_candidate")
        candidate_pids+=("$!")
    fi

    for index in "${!candidate_pids[@]}"; do
        if wait "${candidate_pids[$index]}"; then
            candidates+=("${candidate_paths[$index]}")
        fi
    done

    best_file="$file"
    best_size=$original_size
    for candidate in "${candidates[@]}"; do
        candidate_size=$(stat -c '%s' "$candidate")
        if ((candidate_size < best_size)); then
            best_file="$candidate"
            best_size=$candidate_size
        fi
    done

    if [[ "$best_file" == "$file" ]]; then
        printf '%s: already optimal (%s)\n' "$file" "$(format_bytes "$original_size")"
    else
        cp "$best_file" "$file"
        saving=$((original_size - best_size))
        percentage=$(awk -v saving="$saving" -v original="$original_size" \
            'BEGIN { printf "%.1f", saving * 100 / original }')
        printf '%s: %s -> %s (saved %s, %s%%)\n' \
            "$file" \
            "$(format_bytes "$original_size")" \
            "$(format_bytes "$best_size")" \
            "$(format_bytes "$saving")" \
            "$percentage"
    fi

    rm -rf "$temp_dir"
    trap - EXIT
done
