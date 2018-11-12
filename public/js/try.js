var TryTextileObserver = Class.create({
    initialize: function(observable, resultElement, htmlResultElement) {
        this.observable = $(observable);
        this.resultElement = $(resultElement);
        this.htmlResultElement = $(htmlResultElement);
        this.initObserver();
    },
    initObserver: function() {
        new Form.Element.Observer(
            this.observable,
            0.2,  // 200 milliseconds
            this.parseTextile.bind(this)
        );
    },
    parseTextile: function(event) {
        var rcObserver = this;
        var request_url = rcObserver.observable.form.action;

        if (request_url.blank()) {
            request_url = '/';
        }

        new Ajax.Request(request_url, {
            parameters: {
                text: rcObserver.observable.value
            },
            onSuccess: function(response) {
                rcObserver.resultElement.update(response.responseText);
                rcObserver.htmlResultElement.update(response.responseText.escapeHTML());
            }
        });
    }
});
