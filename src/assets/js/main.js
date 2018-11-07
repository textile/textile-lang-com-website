(function ()
{
    'use strict';

    // If JavaScript enabled, add a class to `<html>` tag.

    document.documentElement.className = 'js';

    // Load objects as variables.

    var code = document.querySelectorAll('pre code'),
        fields = document.querySelectorAll('textarea');

    // Syntax highlighting, via 'Prism'.
    // Applies syntax highlighting to `code` HTML elements.
    // More info - http://prismjs.com.

    if (code.length) {
        var elems = document.querySelectorAll('.language-txp');

        [].forEach.call(elems, function(el) {
            el.classList.add('language-html');
            el.classList.remove('language-txp');
        });

        Prism.highlightAll();
    }

    // Auto-growing textareas, via 'Autosize'.
    // Allows dynamic resizing of textarea height, so that it grows as based
    // on visitor input. More info - https://github.com/jackmoore/autosize.

    if (fields.length) {
        autosize(fields);
    }

})();
