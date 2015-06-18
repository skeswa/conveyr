# flrx
Flrx is an interpretation of Facebook's [Flux](https://facebook.github.io/flux/) architecture that leverages reactive programming, through [RxJS](https://github.com/Reactive-Extensions/RxJS), to make writing modern web applications with [React](https://facebook.github.io/react/) simple.

## Design
In accordance with the flux architecture, flrx follows a **unidirectional data flow**. This means that all activity in the application follows a predictable pattern that is easy to follow.  

![Diagram](https://raw.github.com/skeswa/flrx/master/docs/diagram.jpg)  

- **Actions**  
Actions are events that describe their consequences.  
For example, consider an event that follows a user clicking a button that closes a window. An ordinary event emitted after this event could be called `close-button-clicked`. However, if instead we used an Action, it might be called `close-window`. Observe how actions describe intent while typical events do not.
- **Services**  
Services connect your application to external resources.  
REST APIs & Websocket Connections are good examples of resources that a Service would interact with. Actions drive how Services interact interact with external resources, and changes in application state that result from these interactions are propagated to Stores.
- **Stores**  
Stores manage **all** of your application's state.  
From session information to the results of a search, Stores pass state along to views, and they alone determine what views can render.
- **Views**  
Fundametally, views render data.  
Its as simple as that. Thereafter, views can have other responsibility - such as, emitting actions when the user interacts with the application via the browser. There are many ways to render data, but flrx is built to use React Components as its views.  

## Usage
### Creating Actions
```javascript
// Flrx exports an "Actions" object
let {Actions} from 'flrx';
// Actions are simply functions that are created with the "create" method of the Actions object
export const CreateUserAction = Actions.id(/* The action id string */ 'create-user').create();
// You can create as many actions as you want!
export const DeleteUserAction = Actions.id('delete-user').create();
// However, action ids must be unique - so the following would throw an error
Actions.id('create-user').create(); // Uh-oh
```
### Invoking Actions
```javascript
import React from 'react';
// Now we're import the actions from the previous example
import {CreateUserAction, DeleteUserAction} from './our-user-actions';

// Here's a sample react component that creates and deletes users with actions 
export default React.createClass({
    onCreateClicked() {
        // Actions can be invoked just like functions.
        // However, Actions take *up to one argument*, so use it wisely
        CreateUserAction({ name: 'John Smith', email: 'js@thing.com', age: 20 }); 
    },
    
    onDeleteClicked() {
        // Actions, when invoked, also return a Promise object so that
        // you can tell whether your action was successful or not.
        // Keep in mind that actions will never return a result, so the
        // `then()` callback will always have no parameters
        DeleteUserAction('js@thing.com')
            .then(() => {
                console.log('Woot!');
            })
            .catch(err => console.error('Eek! Could not delete the user:', err));
    },
    
    render() {
        return (
            <div>
                <button onClick={this.onCreateClicked}>Create User</button>
                <button onClick={this.onDeleteClicked}>Delete User</button>
            </div>
        );
    }
});
```
### Creating Stores
```javascript
import {Stores} from 'flrx';

export default Stores.id('users')
    .fields({
        someNumberField:    Number,
        someStringField:    { type: String, default: 'stuff' },
        someArrayField:     Array,
        someBooleanField:   { type: Boolean, default: false },
        someObjectField:    Object
    })
    .create();
```
### Creating Services
```javascript
import Agent from 'superagent';
import {Services, Endpoints} from 'flrx';

import {CreateUserAction, DeleteUserAction} from './our-user-actions';
import UserStore from './our-user-store';

export default Services.id('users')
    .endpoints([
        // Here lies the array of endpoints for this service.
        Endpoints.id(/* The service endpoint id */ 'create-new-user')
            // Actions are the triggers that cause endpoints to be invoked. 
            // This `actions(...)` function takes the list of actions, action ids,
            // or regular expressions that can match ids as parameters
            .actions(CreateUserAction, 'create-user', /create(.+)user/ig)
            // Services are the only parts of the application that can make changes
            // to Stores. This `stores(...)` function takes the list of stores or store ids
            // that this endpoint can affect
            .stores(UserStore, 'some-other-store')
            // The handler is the function that performs all of the endpoint's logic
            .handler((
                action,     // A reference to the action that invoked this endpoint
                payload,    // The data passed in by the action
                stores,     // An object representing all the stores we declared for this endpoint.
                            // Stores injected into this map are special _mutable_ versions of 
                            // thmeselves.
                promise     // The promise is how the endpoint reports that its finished
            ) => {
                // The keys of the `stores` map are the store ids of each respective store
                let {users: UserStore, 'some-other-store': SomeOtherStore} = stores;
                // Submit our request
                Agent.post('/users')
                    .send(payload)
                    .end((err, res) => {
                        if (err) {
                            promise.reject(err);
                        } else if (!res.ok) {
                            promise.reject('Something went wrong :(');
                        } else {
                            // Add our new user to the store using the `update(...)` function
                            UserStore.field('users').update((currentUsers) => {
                                return currentUsers.concat(res.body);
                            });
                            // Resolve the promise since we're done here
                            promise.resolve();
                        }
                    });
            })
            .create(),
        // Now that you've seen one, we can be a little more brief
        Endpoints.id('delete-existing-user')
            .actions(DeleteUserAction)
            .stores(UserStore)
            .handler(someHandlerFunction)
            .create()
    ]);
```
### Creating Views
```javascript
import React from 'react';

import UserStore from './our-user-store';

export default React.createClass({
    getInitialState() {
        return {
            someValue: 1,
            someOtherValue: 2,
            storeBoundValue: UserStore.field('someField').bind(this)
        };
    },
    
    render() {
        return (
            <div>Store-bound value is {this.state.storeBoundValue}</div>
        );
    }
});
```
