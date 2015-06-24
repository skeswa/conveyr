# Conveyr

[![NPM Badge](http://img.shields.io/npm/v/conveyr.svg)](https://www.npmjs.com/package/conveyr)
![Travis Badge](https://travis-ci.org/skeswa/conveyr.svg?branch=develop)
![Dependencies Badge](https://david-dm.org/skeswa/conveyr.svg)
![Usability Badge](https://img.shields.io/badge/ready%20for%20use%3F-not%20a%20chance-red.svg)  

Conveyr uses the best parts of Facebook's [Flux](https://facebook.github.io/flux/) architecture to make building modern web applications with [React](https://facebook.github.io/react/) simple.  

Conveyr provides tools that create a **unidirectional data flow**. This means that all changes in your application state follow a _predictable_ lifecycle. Ultimately, the advantage of this architecture is its ability to make even the most complicated web applications easy to follow. For more on the unidirectional data flow pattern, watch [this video](https://youtu.be/nYkdrAPrdcw?list=PLb0IAmt7-GS188xDYE-u1ShQmFFGbrk0v).

## Install

Conveyr is primarily intended for [Browserify-based](http://browserify.org/) web applications. So, you should install it using [NPM](https://www.npmjs.com/):
```
npm i --save conveyr
```
However, in future, a distribution of the library will be made available for more canonical web application structures using the [Bower](http://bower.io/) package manager.

## Anatomy

![Diagram](https://raw.github.com/skeswa/conveyr/master/docs/diagram.jpg)  

- **Actions are events that describe behavior.**  
For example, consider an event that follows a user clicking a button that closes a window. An ordinary event emitted after this event could be called `close-button-clicked`. However, if instead we used an Action, it might be called `close-window`. Observe how actions describe behavior while typical events do not.
- **Services change your application state.**  
Actions are responsible for triggering Services. Services are responsible with permuting application stateREST APIs & Websocket Connections are good examples of resources that a Service would interact with.  interact interact with external resources, and changes in application state that result from these interactions are propagated to Stores.
- **Stores manage _all_ of your application's state.**  
From session information to the results of a search, Stores pass state along to views, and they alone determine what views can render.
- **Views render data.**  
Its as simple as that. Thereafter, views can have other responsibility - such as, emitting actions when the user interacts with the application via the browser. Conveyr is built to use React Components as its views.  
- **Emitters turn external events into Actions.**   
Every application has import interactions that occur without the user causing them. For example, consider the case where a web application must react to the window resizing: an Emitter is how the application would change its state to adapt to this external event.

## Usage
### Creating Actions
Actions are created with the `Action.create()` function. The `create()` function takes Action Id string as its only argument. The Action Id represents the Action, and, appropriately, it should be unique. The `create()` function returns an **Action**. The `service()` function of an Action specifies the Service that will be called when the Action is invoked. The `payload()` function of an Action specifies the structure of the data that should be passed to the Action when it is invoked.
```javascript
import {Action} from 'conveyr';
import {SomeService} from './my-services';

export const SomeAction = Action.create('some-action')
    // Either a service id or an actual service is passed to this function
    .service(SomeService /* or 'some-service-id' instead */)
    // The payload function can either take a flat object map, or just a type.
    // (e.g. .payload(Number) or .payload({ type: Number, optional: true }))
    .payload({
        thing1: Array,
        thing2: Number,
        // Below is an example of a fully-qualified type.
        // Basic javascript type simply evaluate to { optional: false }
        thing4: { type: String, default: 'woop', optional: true }
    });
```
### Using Actions
Actions are simply functions and should be treated as such. Actions can be invoked with up to _one argument_. This argument is called the **payload** of the Action, and its format is specified by the `payload()` function (example above). If the payload format is specified, then Conveyr will perform validation on Action invocations to make sure the payload is correct.
```javascript
import {SomeAction} from './my-actions';

// Actions can be invoked just like functions.
// This would throw an error if either `thing1` or `thing2` was not provided.
SomeAction({ thing1: [1, 2, 3], thing2: '4' });
```
Actions also return a [Promise](http://www.html5rocks.com/en/tutorials/es6/promises) so that you can react according to whether Action invocation was successful or not. Also, keep in mind that Action promises *do not return anything* in the successful case of the promise. This means that the `then()` function of the promise will always be passed zero arguments.
```javascript
import {SomeOtherAction} from './my-actions';

SomeOtherAction('some argument')
    .then(() => console.log('Aw yiss.'))
    .catch(err => console.error('Eeek! It did not work:', err));
```

### Creating Stores
```javascript
import {Store} from 'conveyr';

let UserStore = Store.create('users')
    .fields({
        someNumberField:    Number,
        someStringField:    { type: String, default: 'stuff' },
        someArrayField:     Array,
        someBooleanField:   { type: Boolean, default: false },
        someObjectField:    Object
    });
```

### Creating Services
```javascript
import Agent from 'superagent';
import {Service} from 'conveyr';

import {CreateUserAction, DeleteUserAction} from './my-actions';
import {UserStore} from './my-stores';

Service.create(/* The service  id */ 'create-new-user')
    // These actions are the triggers that cause this service to be invoked. 
    // The `actions(...)` function takes the list of actions or action ids.
    // (Also, the `action(...)` function can also be used for single actions)
    .actions(CreateUserAction, 'create-user')
    // Service are the only parts of the application that can make changes
    // to Stores. This `stores(...)` function takes the list of stores or store ids
    // that this endpoint has permission to mutate.
    // (Also, the `store(...)` function can also be used for single stores)
    .stores(UserStore, 'some-other-store')
    // The handler is the function that performs all of the endpoint's logic
    .handler(
        function(
            context,    // Reference that gives this service handler the ability
                        // to mutate the stores it declared as related
            actionId,   // The id of the action that invoked this service handler
            payload,    // The data passed in by the action
            done        // The error-first callback that indicates whether the handled
                        // was able to execute successfully
        ) {
            // Submit our request
            Agent.post('/users')
                .send(payload)
                .end((err, res) => {
                    if (err) {
                        done(err);
                    } else if (!res.ok) {
                        // Very standard promise behavior here
                        done('Something went wrong :(');
                    } else {
                        // Add our new user to the store using the `update(...)` function.
                        // The update function takes the provided context parameter and a
                        // mutator function. The store then applies the mutator function
                        // and updates views subscribed to those fields.
                        UserStore.field('users').update(context, (currentUsers) => {
                            return currentUsers.concat(res.body);
                        });
                        // Resolve the promise since we're done here
                        // NOTE: make sure you call this - there *is* a timeout that results in an error
                        done();
                    }
                });
        });
```

### Creating Emitters
```javascript
import {Emitter} from 'conveyr';

Emitter.create('window-resize')
    .action('some-action-id' /* or an action instance */)
    .bind((trigger) => {
        window.addEventListener('resize', trigger, false);
    })
    .unbind((trigger) => {
        window.removeEventListener('resize', trigger, false);
    })
```

### Using Traditional React Components
```javascript
import React from 'react';

import {UserStore} from './my-stores';

export default React.createClass({
    mixins: [
        UserStore.field('someField').mixin(),           // Adds "someField" to the "this.fields" map
        UserStore.field('someOtherField').mixin('meep') // Adds "meep" to the "this.fields" map, but "meep" maps
                                                        // to UserStore.someOtherField's value
    ],
    
    getInitialState() {
        return {
            someValue: 1,
            someOtherValue: 2
        };
    },
    
    render() {
        return (
            <div>Store-bound values are {this.fields.someField} and {this.fields.meep}</div>
        );
    }
});
```

### Using ES6-Style React Components
```javascript
import React from 'react';
import {View} from 'conveyr';

import {UserStore} from './my-stores';

// View is a sub-class of React.Component
export default class SomeComponent extends View {
    constructor() {
        // The initial state of this component
        this.state = {
            someValue: 1,
            someOtherValue: 2
        };
        // The store fields of this component
        this.fields = {
            someField: UserStore.field('someField'),
            meep: UserStore.field('someOtherField').mixin('meep')
        };
    },
    
    getInitialState() {
        return {
            someValue: 1,
            someOtherValue: 2
        };
    },
    
    render() {
        return (
            <div>Store-bound values are {this.fields.someField} and {this.fields.meep}</div>
        );
    }
}
```

## Todos
* [ ] Actions
    * [x] Rewrite documentation
    * [ ] Add `service()`
    * [ ] Add `payload()`
    * [ ] Write a generic argument validator
    * [ ] Add the payload feature
    * [ ] Rewrite tests
* [ ] Services
    * [ ] Rewrite documentation
    * [ ] Remove `actions()`
    * [ ] Rewrite tests
    * [ ] Write new service-action integration test
* [ ] Stores
    * [ ] Touch up documentation
    * [ ] Write validators
    * [ ] Finish mutators
    * [ ] Write tests
* [ ] Views
    * [ ] Rewrite not to use mixins
    * [ ] Touch up the documentation
    * [ ] Write tests
    * [ ] Write full-use-case integration test
* [ ] Emitters
    * [ ] Write documentation
    * [ ] Add `bind()`
    * [ ] Add `action()`
    * [ ] Write tests
* [ ] Logging
    * [ ] Write documentation
    * [ ] Add logging endpoints everywhere
    * [ ] Write the `Log` interface
