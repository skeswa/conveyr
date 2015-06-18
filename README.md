# flrx
Flrx is an interpretation of Facebook's [Flux](https://facebook.github.io/flux/) architecture that leverages reactive programming, through [RxJS](https://github.com/Reactive-Extensions/RxJS), to make writing modern web applications with [React](https://facebook.github.io/react/) simple.

## Design
In accordance with the flux architecture, flrx follows a **unidirectional data flow**. This means that all activity in the application follows a predictable pattern that is easy to follow.  

![Diagram](https://raw.github.com/skeswa/flrx/master/docs/diagram.jpg)  

### Anatomy
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
