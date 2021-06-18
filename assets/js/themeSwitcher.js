/**
 * Theme switcher implementation. 
 * 
 * Largely based on:
 * - https://codyhouse.co/blog/post/dark-light-switch-css-javascript
 * - https://codyhouse.co/blog/post/store-theme-color-preferences-with-localstorage
 */

const colourScheme = window.matchMedia('(prefers-color-scheme)').media;
if (colourScheme !== 'not all') {
    console.log('🎉 Dark mode is supported');

    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    console.log('Dark mode is ', (darkModeMediaQuery.matches ? '🌒 on' : '☀️ off'));
}

var themeSwitch = document.getElementById('themeSwitch');
if (themeSwitch) {
    // on page load, if user has already selected a specific theme -> apply it
    initTheme();

    themeSwitch.addEventListener('change', function (event) {
        // update color theme
        resetTheme();
    });

    function initTheme() {
        var lightThemeSelected =
            (localStorage.getItem('themeSwitch') !== null &&
                localStorage.getItem('themeSwitch') === 'light');

        // update checkbox
        themeSwitch.checked = !lightThemeSelected;

        // update body data-theme attribute
        document.body.setAttribute('data-theme', 
            (lightThemeSelected ? 'light': 'dark'));
    }

    function resetTheme() {
        if (themeSwitch.checked) {
            // dark theme has been selected, which is the default
            document.body.setAttribute('data-theme', 'dark');
            // reset theme selection 
            localStorage.removeItem('themeSwitch');
        } else {
            document.body.setAttribute('data-theme', 'light');
            // save theme selection 
            localStorage.setItem('themeSwitch', 'dark');
        }
    }
}