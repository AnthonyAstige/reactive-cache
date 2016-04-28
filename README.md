## Reactive Cache

A client side Meteor package for caching that reacts to changing data with O(1) retreival time.

### Use cases

* ***Calculations*** - Running complex calculations on Mongo collection data and wanting to minimize re-calculations while keeping accurate
* **Slow Minimongo** - Running slow queries on MiniMongo (ie; based on timestamps) and wanting to minimize them while still keeping accurate results.



### Example Usage

```
var Widgets = new Collection('widgets');
var widgetsSummaryCache = new ReactiveCache();
var options = {
	conditions:     function() { return { owner: Meteor.userId() }; },
	invalidateOn:   [ 'changed', 'removed' ],
	prefix:         function(doc) { return doc._id; }
};
widgetsSummaryCache.observe(Widgets, options);

function complexSummaryCalculations(widgets) {
	// Some code that's cpu intensive and takes a long time to return
}

function getWidgetsSummary() {
	var summary = widgetsSummaryCache.get(id);
	if (summary) {
		return summary
	}

	// Run calculations
	var summary = complexSummaryCalculations(Widgets.find({}));
	
	widgetsSummaryCache.set(id, summary);
}

// Contrived example of running getWidgetsSummary n times
// This snippit runs in aproximately O(1) time instead of O(n) so long as no updates
var n = 100;
for(var ii = 0; ii < n; ii++) {
	console.log(getWidgetsSummary());
}

```

### API

#### ReactiveCahce.observe(collection, options)

#### ReactiveCahce.set(id, value)

#### ReactiveCahce.get(id)

#### ReactiveCache.resetAll


### In the wild

* http://www.trackmyfoods.com - For reused complex calculations of 'meta nutrients'
