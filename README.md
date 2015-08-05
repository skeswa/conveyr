# Conveyr

[![NPM Badge](http://img.shields.io/npm/v/conveyr.svg)](https://www.npmjs.com/package/conveyr)
![Travis Badge](https://travis-ci.org/skeswa/conveyr.svg?branch=develop)
![Dependencies Badge](https://david-dm.org/skeswa/conveyr.svg)
![Usability Badge](https://img.shields.io/badge/ready%20for%20use%3F-not%20a%20chance-red.svg)  

Conveyr uses the best parts of Facebook's [Flux](https://facebook.github.io/flux/) architecture to make building modern web applications with [React](https://facebook.github.io/react/) simple.  

Conveyr provides tools that create a **unidirectional data flow**. This means that all changes in your application state follow a _predictable_ lifecycle. Ultimately, the advantage of this architecture is its ability to make even the most complicated web applications easy to follow. For more on the unidirectional data flow pattern, watch [this video](https://youtu.be/nYkdrAPrdcw?list=PLb0IAmt7-GS188xDYE-u1ShQmFFGbrk0v).

## Installation
```
npm i --save conveyr
```
Conveyr is primarily intended for [Browserify-based](http://browserify.org/) web applications, so, you should use the [node package manager](https://www.npmjs.com/) to install it. In future, a distribution of the library will be made available for more canonical web application structures using the [Bower](http://bower.io/) package manager.

## Overview

![Diagram](https://raw.github.com/skeswa/conveyr/develop/docs/diagram.jpg)  

**[Actions](https://github.com/skeswa/conveyr/blob/develop/README.md#actions) are events that describe behavior.**  
For example, consider an event that follows a user clicking a button that closes a window. An ordinary event emitted after this event could be called `close-button-clicked`. However, if instead we used an Action, it might be called `close-window`. Observe how actions describe behavior while typical events do not.  

**[Services](https://github.com/skeswa/conveyr/blob/develop/README.md#services) change your application state.**  
Services are responsible for permuting application state, often with aid of external resources like REST APIs & Websocket Connections. Accordingly, Services are the only parts of your web application that can directly mutate Stores. So, in many ways, Services can be viewed as the centerpoint of Conveyr web applications.

**[Stores](https://github.com/skeswa/conveyr/blob/develop/README.md#stores) encapsulate _all_ of your application's state.**  
From session information to the results of a search, Stores pass state along to views, and they alone determine what views can render.  

## Actions
### Creating Actions
Actions are created with the `Action()` function. The `Action()` function takes Action Id string as its only argument. Action Ids represents Actions, and, appropriately, should be unique. The `Action()` function returns an **Action**. The `calls()` function of an Action specifies the Service Endpoint that will be called when the Action is invoked. The `accepts()` function of an Action specifies the structure of the data that should be passed to the Action when it is invoked.
```javascript
import {Action} from 'conveyr';
import {SomeService} from './my-services';

export const SomeAction = Action('some-action')
    // A service enpoint is passed to this function
    .calls(SomeService.tickle)
    .calls(SomeOtherService.woop, args => args.thing1)
    // The accepts() function can either take a flat object map, or just a type.
    // (e.g. .accepts(Number) or .accepts({ type: Number, default: 3 }))
    .accepts({
        thing1: Array,
        thing2: Number,
        // Below is an example of a fully-qualified type.
        // Fields of fully-qualified types are considered *optional* if 
        // they have defaults. Otherwise, all fields default to being required
        thing3: { type: String, default: 'woop' }
    })
    // Builds the action
    .create();
```
### Using Actions
Actions are simply functions and should be treated as such. Actions can be invoked with up to _one argument_. This argument is called the **payload** of the Action, and its format is specified by the `accepts()` function (example above). If the payload format is specified, then Conveyr will perform validation on Action invocations to make sure the payload is correct.
```javascript
import {SomeAction} from './my-actions';

// Actions can be invoked just like functions.
// This would throw an error if either `thing1` or `thing2` was not provided
// since the "thing3" field has a default.
SomeAction({ thing1: [1, 2, 3], thing2: 4 });
```
Actions also return a [Promise](http://www.html5rocks.com/en/tutorials/es6/promises) so that you can react according to whether Action invocation was successful or not. Also, keep in mind that Action promises *do not return anything* in the successful case of the promise. This means that the `then()` function of the promise will always be passed zero arguments.
```javascript
import {SomeOtherAction} from './my-actions';

SomeOtherAction('some payload')
    .then(() => console.log('Aw yiss.'))
    .catch(err => console.error('Eeek! It did not work:', err));
```

## Services
### Creating Services
Services are the only parts of the application that can make changes to Stores. The `exposes()` function attaches behavior logic to the Service by creating **Endpoints**. Endpoints are different operations that can be performed within the purview of the Service. Endpoints are comprised of an endpoint id and a handler function.
```javascript
import {Service} from 'conveyr';

import {SomeStore} from './my-stores';

export const SomeService = Service('some-service')
    // An defines an endpoint with its handler
    .exposes('tickle', context => {
        let {action, payload, update, succeed, fail} = context;
        // Anatomy of Context:
        // - context.action:    The action that invoked this service
        // - context.payload:   The data passed in by the action
        // - context.update:    The updater function allows for Store Fields to be updated
        // - context.succeed:   Signals that this Endpoint call succeeded
        // - context.fail:      Signals that this Endpoint call failed
        tickleTheBackend((response) => {
            if (response.successful) {
                // The "context" variable enables mutation of the store's fields
                update(SomeStore.field('some-field'), currentUsers => currentUsers.concat(res.body));
                // Signals that this service has finished executing
                succeed();
            } else {
                fail(response.problem);
            }
        });
    })
    // Builds the service
    .create();
```

## Stores
### Creating Stores
Stores maintain all application state in Store Fields. Store Fields are typed, and
named sub-properties of Stores. The `defines()` function allows the creation of fields
on stores.
```javascript
import {Store} from 'conveyr';

export const SomeStore = Store('some-store')
    // defines() a field
    .defines('foo')
    .defines('hello')
    // Fields can also specify defaults
    .defines('foo-bar', { a: 1, b: 2, c: 3 })
    // Builds the store
    .create();
```
### Using Stores
Stores are mostly read-only, and the only way to access their data is via its Store Fields. Store Fields can be selected with the `field()` function. The `field()` function takes only the Field's name as an argument:
```javascript
import {SomeStore} from './my-stores';

// Selects the "foo" field
SomeStore.foo;
// Also selects the "foo" field
SomeStore('foo');
// Selects the "foo-bar" field
SomeStore['foo-bar'];
// Also selects the "foo-bar" field
SomeStore('foo-bar');
```
Once selected, Store Fields have three principal functions: `value()`, `update()` and `revision()`. The `value()` function simply returns the current value of the field:
```javascript
// Prints the value of the "some-other-field" field
console.log(SomeStore.foo.value());
```
Lastly, the `revision()` function returns the number of times, starting at 0, that the Store Field has been changed.
```javascript
// Prints how many times the "another-field" field has changed
console.log(SomeStore('foo-bar').revision());
```
### Subscribing to Store Fields
To be notified when a Store Field changes, use either the `updates()` or `notifies()` functions. Passing a React Component as an argument to `notifies()` will cause Store updates to invoke `forceUpdate()` on that Component. Passing a function instead of a React Component will simply invoke the function when the field changes instead. Passing a React Component and a state variable name as arguments to `updates()` will cause Store updates to invoke `setState()` with updates for the indicated state variable. 
```javascript
// Below we subscribe to a single field
SomeStore.foo.notifies(this);
// This is how you subscribe to many fields at once
SomeOtherStore('some-field', 'some-other-field').notify(this);
// Below we bing this field to the "foo" state variable
SomeOtherStore('one-more-field').updates(this, 'foo');
```
### Why No React Mixin?
A quote from the introductory post of React 0.13:
> Unfortunately, we will not launch any mixin support for ES6 classes in React. That would defeat the purpose of only using idiomatic JavaScript concepts.<br><br>
There is no standard and universal way to define mixins in JavaScript. In fact, several features to support mixins were dropped from ES6 today. There are a lot of libraries with different semantics. We think that there should be one way of defining mixins that you can use for any JavaScript class. React just making another doesn’t help that effort.

The jury's out on this one: Mixins just don't seem likely to be part of React in future. This is why Conveyr simply offers a binding function - and that's it. If the React team comes up with a better way to accomplish view binding, rest assured that Conveyr implement it.

For a more robust consideration of the above quote, check out [this article](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750).

## Todos
* [x] Actions
    * [x] Rewrite documentation
    * [x] Add `service()`
    * [x] Add `payload()`
    * [x] Write a generic argument validator
    * [x] Add the payload feature
    * [x] Rewrite tests
    * [ ] API specification in docs
* [x] Replace event emitter with direct invocation
* [ ] Services
    * [x] Rewrite documentation
    * [x] Remove `actions()`
    * [x] Rewrite tests
    * [ ] Write service-action integration test
    * [ ] API specification in docs
* [ ] Stores
    * [x] Touch up documentation
    * [x] Write validators
    * [x] Finish mutators
    * [x] Write tests
    * [ ] Write service-store integration test
    * [ ] API specification in Wiki
* [ ] Views
    * [x] Rewrite not to use mixins
    * [x] Touch up the documentation
* [x] Emitters
    * [x] Write documentation
* [ ] Log
    * [ ] `level()`, `Log.VERBOSE`, `Log.DEBUG`, `Log.PRODUCTION`
    * [ ] `endpoint(msgs)`
    * [ ] Docs in README
    * [ ] API specification in docs
* [ ] Tests
    * [ ] Action-Service integration test
    * [ ] Service-Store integration test
    * [ ] Full Usecase integration test
* [ ] Docs
    * [ ] Write full API spec for Action
    * [ ] Write full API spec for Service
    * [ ] Write full API spec for Store
    * [ ] Write full API spec for Config
* [ ] Distribution
    * [ ] Browserified & Minified distributions
    * [ ] In-browser tests
    * [ ] Bower package
