'use strict';
/*global Meteor, ReactiveVar, ReactiveCache, _, EJSON*/

// TODO: Optomize this so not getting & setting entire cache?
// TODO: * Or does JavaScript/ReactiveVar pass referentially quick enough anyways?
// TODO: Add option for caching by reference
// TODO: * More performant for large values
// TODO: * Default to deep cloning as less error prone
// TODO: ** Still helps A LOT for complex calculations w/small values
// TODO: Keep cache sorted to make individual invalidations quicker?
// TODO: * Without sorting insert has O(1) and removal has an O(n)
// TODO: * With sorting insert would be O(log n) and removal would have O(log n)
// TODO: * Periodic / idle sorting could get us close to best of both
if (Meteor.isClient) {
	ReactiveCache.__reactiveCaches = [];

	/**
	 * Resets all observations & invalidates all cache for all ReactiveCache instances
	 * * Useful when logging in or logging out
	 *
	 * Clears all cache
	 */
	ReactiveCache.resetAll = function() {
		_.each(ReactiveCache.__reactiveCaches, function(reactiveCache) {
			reactiveCache.__reset();
		});
	};

	ReactiveCache.prototype.__construct = function() {
		this.__cache = new ReactiveVar({});
		this.__observations = [];
		this.__observationRequests = [];
		//this.misses = 0;
		//this.hits = 0;
		ReactiveCache.__reactiveCaches.push(this);
	};

	/**
	 * Observe a MongoCollection cursor for additions/changes/removals
	 * When something altered invalidate the cache appropriately
	 *
	 * Params:
	 *	collection: The collection to observe
	 *
	 *	options: [Optional] [Array]
	 *		conditions: [Optional] [Function] That generates collection.find(conditions)
	 *
	 *		invalidateOn: [Optional] [Array] strings for what actions to invalidate on
	 *			Accepted Values: added, changed, removed
	 *			If undefined clears for all actions
	 *
	 *		prefixer: [Optional] [Function] returns a prefix for keys to remove from doc
	 *			So that invalidation only occurs for specific documents
	 *			If undefined always clears entire cache
	 */
	// TODO: Add validation (data types all, invalidateOn is of 3 possible strings, ...)
	ReactiveCache.prototype.observe = function(collection, options) {
		// Setup
		if (undefined === options) {
			options = {};
		}
		var request = {
			collection:		collection,
			conditions:		options.conditions,
			invalidateOn:	options.invalidateOn,
			prefix:			options.prefix
		};
		if (undefined === options.conditions) {
			request.conditions = function() { return { }; };
		}
		if (undefined === options.invalidateOn) {
			request.invalidateOn = [ 'added', 'changed', 'removed' ];
		}
		if (undefined === options.prefix) {
			request.prefix = false;
		}

		// Observe & store handle (in case we later have to stop it)
		this.__observations.push(this.__fulfillObservationRequest(request));

		// Store observation request (in case we later have to restart it)
		this.__observationRequests.push(request);
	};

	/**
	 * Set a value in the cache
	 *
	 * Params:
	 *	key: Where to set in the cache
	 *	value: What to put in the cache
	 */
	ReactiveCache.prototype.set = function(key, value) {
		var reactive = this.__cache.get();
		reactive[key] = EJSON.clone(value);
		this.__cache.set(reactive);
	};

	/**
	 * Get a value from the cache
	 *
	 * Params:
	 *	key: Where to retreive the cache from
	 *
	 * Returns:
	 *	Cached value at key if found
	 *	undefined object if key couldn't be found
	 */
	// TODO: Add a second parameter to pass a lambda for calculation to?
	ReactiveCache.prototype.get = function(key) {
		// Get
		var reactive = this.__cache.get(key);

		// Check
		if (undefined === reactive[key]) {
			//this.misses++;
			return undefined;
		}
		//this.hits++;
		//console.log(this.hits + '/' + (this.hits + this.misses));

		return EJSON.clone(reactive[key]);
	};

	ReactiveCache.prototype.__fulfillObservationRequest = function(request) {
		var actualizedConditions = request.conditions();
		var cursor = request.collection.find(actualizedConditions, { fields: { } });
		var observeObj = {};
		var that = this;
		_.each(request.invalidateOn, function(observeAction) {
			observeObj[observeAction] = function(doc) {
				var key;
				if (request.prefix) {
					key = request.prefix(doc);
				}
				that.__invalidate(key);
			};
		});
		return cursor.observe(observeObj);
	};

	/**
	 * Invalidate cache
	 *
	 * Params:
	 *	prefix: All keys starting with prefix to invalidate (otherwise invalidates all)
	 *	        (Also works for single key)
	 */
	ReactiveCache.prototype.__invalidate = function(prefix) {
		/// Clear all
		if (undefined === prefix) {
			this.__cache.set({});
			return;
		}

		/// Clear for keys that start with prefix
		var values = this.__cache.get();
		_.each(values, function(value, index) {
			if (0 === index.indexOf(prefix)) {
				delete values[index];
			}
		});
		this.__cache.set(values);
	};

	/**
	 * Resets all observations and invalidates all cache for this ReactiveCache instance
	 */
	ReactiveCache.prototype.__reset = function() {
		/// Reset observations
		// Stop observations
		_.each(this.__observations, function(observation) {
			observation.stop();
		});
		// Start observations
		var that = this;
		_.each(this.__observationRequests, function(request) {
			that.__fulfillObservationRequest(request);
		});

		/// Clear cache
		this.__invalidate();
	};
}
