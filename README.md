# delta ![status](https://travis-ci.org/skeswa/delta.svg?branch=develop)
By using the best parts of Facebook's [Flux](https://facebook.github.io/flux/) architecture, delta makes building modern web applications with [React](https://facebook.github.io/react/) simple.

## Design
In accordance with the Flux architecture, delta follows a **unidirectional data flow**. This means that all activity in the application follows a predictable pattern that is easy to follow.  

![Diagram](https://raw.github.com/skeswa/delta/master/docs/diagram.jpg)  

- **Actions**  
Actions are events that describe their consequences.  
For example, consider an event that follows a user clicking a button that closes a window. An ordinary event emitted after this event could be called `close-button-clicked`. However, if instead we used an Action, it might be called `close-window`. Observe how actions describe intent while typical events do not.
- **Services**  
Services change your application state.  
Actions are responsible for triggering Services. Services are responsible with permuting application stateREST APIs & Websocket Connections are good examples of resources that a Service would interact with.  interact interact with external resources, and changes in application state that result from these interactions are propagated to Stores.
- **Stores**  
Stores manage **all** of your application's state.  
From session information to the results of a search, Stores pass state along to views, and they alone determine what views can render.
- **Views**  
Fundametally, views render data.  
Its as simple as that. Thereafter, views can have other responsibility - such as, emitting actions when the user interacts with the application via the browser. Delta is built to use React Components as its views.  

## Todos
- [x] Actions
- [x] Services
- [ ] Service dependency injection
- [ ] Stores
- [ ] Views
- [ ] Logging

## Usage
### Creating Actions
```javascript
import {Action} from 'delta';

// Actions are simply functions that are created with the "create" method of the Actions object
let CreateUserAction = Action.create(/* The action id string */ 'create-user');

// You can create as many actions as you want!
let DeleteUserAction = Action.create('delete-user');

// However, action ids must be unique - so the following would throw an error
Action.create('create-user'); // Uh-oh
```
### Invoking Actions
```javascript
// Actions can be invoked just like functions.
// However, Actions take *up to one argument*, so use it wisely
CreateUserAction({ name: 'John Smith', email: 'js@thing.com', age: 20 });

// Actions, when invoked, also return a Promise object so that
// you can tell whether your action was successful or not.
// Keep in mind that actions will never return a result, so the
// `then()` callback will always have no parameters
DeleteUserAction('js@thing.com')
    .then(() => {
        console.log('Woot!');
    })
    .catch(err => console.error('Eeek! Could not delete the user:', err));
```

### Creating Stores
```javascript
import {Store} from 'delta';

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
import {Service} from 'delta';

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
import {Emitter} from 'delta';

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
import {View} from 'delta';

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
