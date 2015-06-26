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

![Diagram](https://raw.github.com/skeswa/conveyr/master/docs/diagram.jpg)  

**Actions are events that describe behavior.**  
For example, consider an event that follows a user clicking a button that closes a window. An ordinary event emitted after this event could be called `close-button-clicked`. However, if instead we used an Action, it might be called `close-window`. Observe how actions describe behavior while typical events do not.  

**Services change your application state.**  
Actions are responsible for triggering Services. Services are responsible with permuting application stateREST APIs & Websocket Connections are good examples of resources that a Service would interact with.  interact interact with external resources, and changes in application state that result from these interactions are propagated to Stores.  

**Stores manage _all_ of your application's state.**  
From session information to the results of a search, Stores pass state along to views, and they alone determine what views can render.  

**Views present application data to the user.**  
Its as simple as that. By binding to Stores, Views can re-render themselves whenever application state changes. The simplicity of this paradigm makes application-wide UI changes a cinch. Furthermore, Views often create Actions based on user interactions.  

**Emitters turn external events into Actions.**   
Every application has important interactions that occur without the user causing them. For instance, consider the case where a web application must react to the window resizing: the application needs to bind a behavior to that event to resize and redaw itself. Emitters are how Conveyr-based applications adapt to external events like these.

## Actions
### Creating Actions
Actions are created with the `Action()` function. The `Action()` function takes Action Id string as its only argument. Action Ids represents Actions, and, appropriately, should be unique. The `Action()` function returns an **Action**. The `calls()` function of an Action specifies the Service that will be called when the Action is invoked. The `sends()` function of an Action specifies the structure of the data that should be passed to the Action when it is invoked.
```javascript
import {Action} from 'conveyr';
import {SomeService} from './my-services';

export const SomeAction = Action('some-action')
    // Either a service id or an actual service is passed to this function
    .calls(SomeService /* or 'some-service-id' instead */)
    // The payload function can either take a flat object map, or just a type.
    // (e.g. .sends(Number) or .sends({ type: Number, default: 3 }))
    .sends({
        thing1: Array,
        thing2: Number,
        // Below is an example of a fully-qualified type.
        // Fields of fully-qualified types are considered *optional* if 
        // they have defaults. Otherwise, all fields default to being required
        thing3: { type: String, default: 'woop' }
    });
```
### Using Actions
Actions are simply functions and should be treated as such. Actions can be invoked with up to _one argument_. This argument is called the **payload** of the Action, and its format is specified by the `payload()` function (example above). If the payload format is specified, then Conveyr will perform validation on Action invocations to make sure the payload is correct.
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

SomeOtherAction('some argument')
    .then(() => console.log('Aw yiss.'))
    .catch(err => console.error('Eeek! It did not work:', err));
```

## Stores
### Creating Stores
Stores maintain all application state in Store Fields. Store Fields are typed, and
named sub-properties of Stores. The `defines()` function allows the creation of fields
on stores.
```javascript
import {Store} from 'conveyr';

export const SomeStore = Store('some-store')
    // defines() accepts a simple name-type pair
    .defines('some-field',      Number)
    // Types should be either native javascript types...
    .defines('another-field',   Array)
    // ...or fully-qualified types as shown below
    .defines('some-other-field', {
        type: Object,
        default: { a: 1, b: 2, c: 3 }
    });
```
### Using Stores
Stores are mostly read-only, and the only way to access their data is via its Store Fields. Store Fields can be selected with the `field()` function. The `field()` function takes only the Field's name as an argument:
```javascript
import {SomeStore} from './my-stores';

// Selects the "some-other-field" field
SomeStore.field('some-other-field');
```
Once selected, Store Fields have three principal functions: `value()`, `update()` and `revision()`. The `value()` function simply returns the current value of the field:
```javascript
// Prints the value of the "some-other-field" field
console.log(SomeStore.field('some-other-field').value());
```
The `update()` function transforms the value of the field. This is the only function that can change the state of a Store Field. The `update()` function needs a context variable to work - this can only be obtained within a Service handler function (discussed below).
```javascript
// Changes the value of the "some-field" field
// Takes the "context" variable (obtained within a Service) as the first parameter
// The second parameter is the mutator function - it simply takes the current value
// of the field and returns a different version.
SomeStore.field('some-field').value(context, currentValue => currentValue + 1);
```
Lastly, the `revision()` function returns the number of times, starting at 0, that the Store Field has been changed.
```javascript
// Prints how many times the "another-field" field has changed
console.log(SomeStore.field('another-field').revision()); // Prints 0
// This will update the value of another-field
SomeStore.field('another-field').value(context, currentValue => currentValue.concat('lol'));
// Will print an update revision count
console.log(SomeStore.field('another-field').revision()); // Prints 1
```

## Services
### Creating Services
Services are the only parts of the application that can make changes to Stores. As such, when creating a Service, the `updates()` functions allows you to specify which Stores the Service can update. The `updates()` function takes Stores and/or Store Ids as arguments. The `invokes()` function attaches behavior logic, in the form of a handler function, to the Service.
```javascript
import {Service} from 'conveyr';

import {SomeStore} from './my-stores';

export const SomeService = Service('some-service')
    // The `mutates()` function takes the list of stores or store ids
    .updates(SomeStore, 'some-other-store')
    // The handler is the function that performs all of the Service's logic
    .invokes(
        function(
            context, /* Token used for Store manipulation */
            actionId, /* The id of the action that invoked this service */
            action, /* The action that invoked this service */
            payload, /* The data passed in by the action */
            callback /* The callback to signal when the handler is finished */
        ) {
            tickleTheBackend((response) => {
                if (response.successful) {
                    // The "context" variable enables mutation of the store's fields
                    SomeStore.field('some-field').update(context, (currentUsers) => {
                        return currentUsers.concat(res.body);
                    });
                    // Signals that this service has finished executing
                    callback();
                } else {
                    callback(response.problem);
                }
            });
        });
```
The handler function passed to `invokes()` is **dependency injected**. This means that you can pick and choose what arguments to include in your handler function definition - **as long as you have a callback**. So all of the following examples would all be valid handler functions:
```javascript
// You can choose as few arguments as you want
.invokes((callback) => { ... });
// Why not add a few more? The arguments can be ordered any way you like.
.invokes((callback, payload, context) => { ... });
// If you repeat arguments, only the last one in the sequence has a value
.invokes((actionId, callback, payload, payload, payload) => { ... });
```

## Views
### Why No Mixin?
Reasons.
TODO (Sandile): brief explanation + link to react blog
### Inegrating with Stores
TODO (Sandile): basic examples of binding/unbinding + a basic "rendering with stores" example

## Emitters
Emitters have specifically been excluded from the Conveyor library because they are so simple to implement. All an Emitter truly needs to do is fire Actions when certain events occur. Take for example an Emitter that handles window resize events:
```javascript
import {SomeWindowResizeAction} from './my-actions';

if (window.attachEvent) {
    window.attachEvent('onresize', SomeWindowResizeAction);
} else if (window.addEventListener) {
    window.addEventListener('resize', SomeWindowResizeAction, true);
} else {
    // The browser does not support Javascript event binding
    alert('Uh, dude, we\'re going to get you a better browser');
    // Save this peculiar user from him/herself
    window.location.href = 'https://www.mozilla.org/en-US/firefox/new/';
}
```
As you can see above, nobody _really_ needs any help adding Emitters to their application. However, people need help with their browser choices ;-D.

## Todos
* [x] Actions
    * [x] Rewrite documentation
    * [x] Add `service()`
    * [x] Add `payload()`
    * [x] Write a generic argument validator
    * [x] Add the payload feature
    * [x] Rewrite tests
* [x] Replace event emitter with direct invocation
* [ ] Services
    * [x] Rewrite documentation
    * [x] Remove `actions()`
    * [x] Rewrite tests
    * [ ] Write service-action integration test
* [ ] Stores
    * [x] Touch up documentation
    * [ ] Write validators
    * [ ] Finish mutators
    * [ ] Write tests
    * [ ] Write service-store integration test
* [ ] Views
    * [ ] Rewrite not to use mixins
    * [ ] Touch up the documentation
    * [ ] Write tests
    * [ ] Write full-use-case integration test
* [x] Emitters
    * [x] Write documentation
* [ ] Configuration
    * [ ] Add documentation for `.configure({ ... })`
    * [ ] Add logging endpoints everywhere
    * [ ] Add log levels
* [ ] Browserified & Minified distributions
* [ ] In-browser tests
* [ ] Bower package
