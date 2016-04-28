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
	var widgets = Widget.find({});
	var summary = complexSummaryCalculations(widgets);
	
	widgetsSummaryCache.set(id, summary);
}

// Contrived example of running getWidgetsSummary n times
// This snippit runs in aproximately O(1) time instead of O(n) so long as no updates
var n = 100;
for(var ii = 0; ii < n; ii++) {
	console.log(getWidgetsSummary());
}

```

This will keep a cache of widgets 

### API : High level

#### ReactiveCahce.observe(collection, options)

#### ReactiveCache.resetAll

This is is helpful for changing conditions
ie; When caching based on the logged in use then you need to reset when a user
logs out or logs in (so new observations can be setup and caches invalidated)

### API : Low level

(See the source code)
