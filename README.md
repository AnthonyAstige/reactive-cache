# Reactive Cache

Client side caching that reacts to changing data with O(1) retreival time

## Use cases

### Calculations

Running complex calculations on Mongo collection data and wanting to minimize re-calculations while keeping accurate

### Slow Minimongo

Running slow queries on MiniMongo (ie; based on timestamps) and wanting to minimize them while still keeping accurate results.



## Example Usage

```
var Widgets = new Collection('widgets');
var widgetsCache = new ReactiveCache();
var options = {
	conditions:     function() { return { owner: Meteor.userId() }; },
	invalidateOn:   [ 'changed', 'removed' ],
	prefix:         function(doc) { return doc._id; }
};
widgetsCache.observe(Widgets, )
```

## API

### ReactiveCahce.observe(collection, options)



### ReactiveCache.resetAll

This is is helpful for changing conditions
ie; When caching based on the logged in use then you need to reset when a user
logs out or logs in (so new observations can be setup and caches invalidated)
