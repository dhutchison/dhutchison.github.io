/**
 * Theme switcher implementation. 
 * 
 * Largely based on:
 * - https://codyhouse.co/blog/post/dark-light-switch-css-javascript
 * - https://codyhouse.co/blog/post/store-theme-color-preferences-with-localstorage
 */

var themeSwitch = document.getElementById('themeSwitch');
if (themeSwitch) {
    // on page load, if user has already selected a specific theme -> apply it
    initTheme();

    themeSwitch.addEventListener('change', function (event) {
        // update color theme
        resetTheme();
    });

    function initTheme() {
        var darkThemeSelected =
            (localStorage.getItem('themeSwitch') !== null &&
                localStorage.getItem('themeSwitch') === 'dark');

        // update checkbox
        themeSwitch.checked = darkThemeSelected;

        // update body data-theme attribute
        darkThemeSelected ?
            document.body.setAttribute('data-theme', 'dark') :
            document.body.removeAttribute('data-theme');
    }

    function resetTheme() {
        if (themeSwitch.checked) {
            // dark theme has been selected
            document.body.setAttribute('data-theme', 'dark');
            // save theme selection 
            localStorage.setItem('themeSwitch', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            // reset theme selection 
            localStorage.removeItem('themeSwitch');
        }
    }
}