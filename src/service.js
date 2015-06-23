'use strict';

/****************************** MODULE IMPORTS *******************************/

import Map from 'core-js/es6/map';

import {emit, subscribe, unsubscribe, LISTENER_NAMESPACE_SEPARATOR} from './eventbus';
import {isString, isEmpty, isFunction} from './typechecker';
import {
    InvalidParameterTypeError,
    EmptyParameterError,
    IllegalIdError,
    IdAlreadyExistsError,
    InvalidActionRefsError,
    InvalidStoreRefsError,
    MissingCallbackError
} from './errors';

import {isActionId, getAction, ActionResult, ACTION_COMPLETION_EVENT} from './action';
import {isStoreId, getStore, generateMutatorContext, isStore} from './store';

/***************************** MODULE CONSTANTS ******************************/

const ES5_FUNCTION_ARG_REGEX    = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
const ALL_SPACE_REGEX          = / /g;

/******************************* MODULE STATE ********************************/

const   serviceMap              = new Map();
let     nextActionInstanceId    = 1;

/********************************** HELPERS **********************************/

/***************************** TYPE DECLARATIONS *****************************/

class Service {
    constructor(serviceId) {
        this.__id               = serviceId;
        this.__stores           = undefined;
        this.__actionIds        = undefined;
        this.__handler          = undefined;
        this.__handlerIndices   = undefined;
        this.__mutatorContext   = generateMutatorContext();
        // Bind the all susceptible functions
        this.__handlerWrapper = this.__handlerWrapper.bind(this);
    }

    /**************************** PRIVATE METHODS ****************************/

    // Unsubscribes the handler function from all actions lited in this.__actionIds
    __unsubscribeHandlerFromActions() {
        if (this.__handler &&
            this.__handlerIndices &&
            this.__actionIds &&
            this.__actionIds.length > 0) {
            // Unsubscribe from all the actions
            let i, currActionId;
            for (i = 0; i < this.__actionIds.length; i++) {
                currActionId = this.__actionIds[i];
                unsubscribe(currActionId, this.__handlerWrapper);
            }
        }
    }

    // Subscribes the handler function to all actions listed in this.__actionIds
    __subscribeHandlerToActions() {
        if (this.__handler &&
            this.__handlerIndices &&
            this.__actionIds &&
            this.__actionIds.length > 0) {
            // Subscribe to all the actions
            let i, currActionId;
            for (i = 0; i < this.__actionIds.length; i++) {
                currActionId = this.__actionIds[i];
                subscribe(currActionId, this.__handlerWrapper);
            }
        }
    }

    // Unregisters this service a mutator of the stores listed in this.__storeIds
    __unregisterAsMutator() {
        if (this.__handler &&
            this.__handlerIndices &&
            this.__stores &&
            this.__stores.length > 0) {
            // Unregister from all the stores
            let i, currStore;
            for (i = 0; i < this.__stores.length; i++) {
                currStore = this.__stores[i];
                currStore.unregisterMutatorContext(this.__mutatorContext);
            }
        }
    }

    // Registers this service a mutator of the stores listed in this.__storeIds
    __registerAsMutator() {
        if (this.__handler &&
            this.__handlerIndices &&
            this.__stores &&
            this.__stores.length > 0) {
            // Register with all the stores
            let i, currStore;
            for (i = 0; i < this.__stores.length; i++) {
                currStore = this.__stores[i];
                currStore.registerMutatorContext(this.__mutatorContext);
            }
        }
    }

    // Handles injection for
    __handlerWrapper(payload) {
        if (this.__handler &&
            this.__handlerIndices &&
            payload &&
            payload.actionId &&
            payload.instanceId) {
            const args = this.__compileHandlerArguments(payload);
            this.__handler.apply(this, args);
        }
    }

    __resolveHandlerArguments(handler) {
        let indices = {
            context:    -1,
            actionId:   -1,
            payload:    -1,
            done:       -1,
            total:      0
        };

        const args = handler.toString().match(ES5_FUNCTION_ARG_REGEX)[1].replace(ALL_SPACE_REGEX, '').split(',');
        // Figure out the index of each parameter
        args.forEach((arg, i) => {
            switch(arg.toLowerCase())  {
            case 'context':
            case 'mutator':
            case 'mutatorContext':
                indices.context = i;
                break;
            case 'action':
            case 'actionid':
                indices.actionId = i;
                break;
            case 'payload':
            case 'data':
                indices.payload = i;
                break;
            case 'done':
            case 'callback':
            case 'finish':
                indices.done = i;
                break;
            }
        });
        // Record the argument total
        indices.total = args.length;

        return indices;
    }

    __compileHandlerArguments(payload) {
        const args = new Array(this.__handlerIndices.total);
        if (this.__handlerIndices.context !== -1) {
            args[this.__handlerIndices.context] = this.__mutatorContext;
        }
        if (this.__handlerIndices.actionId !== -1) {
            args[this.__handlerIndices.actionId] = payload.actionId;
        }
        if (this.__handlerIndices.payload !== -1) {
            args[this.__handlerIndices.payload] = payload.data;
        }
        // Compose the completion event
        const completionEvent = [payload.actionId, ACTION_COMPLETION_EVENT];
        // Build the callback
        const done = (err) => {
            if (err !== null && err !== undefined) {
                // A problem happened
                emit(completionEvent, new ActionResult(payload, err));
            } else {
                emit(completionEvent, new ActionResult(payload));
            }
        };
        args[this.__handlerIndices.done] = done;

        return args;
    }

    /**************************** PUBLIC METHODS *****************************/

    action(actionRef) {
        this.actions(actionRef);
    }

    actions(...actionRefs) {
        // Unsubscribe before changing action ids
        this.__unsubscribeHandlerFromActions();
        // Compile the list of action ids
        const actionIds = actionRefs.filter((actionRef) => {
            // Filter out the action ids that aren't legit
            if (isString(actionRef)) {
                return isActionId(actionRef);
            } else if (isFunction(actionRef) && isString(actionRef.__actionId)) {
                return isActionId(actionRef.__actionId);
            } else {
                return false;
            }
        }).map((actionRef) => {
            // Action objects -> action ids
            if (isString(actionRef)) return actionRef;
            else return actionRef.__actionId;
        });
        // Scream and shout if even _one_ of the refs was invalid
        if (actionIds.length < actionRefs.length) {
            throw InvalidActionRefsError();
        }
        // Apply new action ids to this service
        this.__actionIds = actionIds;
        // Resubscribe to incoming actions
        this.__subscribeHandlerToActions();
        // Return this service for chaining
        return this;
    }

    store(storeRef) {
        this.actions(storeRef);
    }

    stores(...storeRefs) {
        // Clear mutator status for all stores
        this.__unregisterAsMutator();
        // Compile the list of stores
        const stores = storeRefs.filter((storeRef) => {
            // Filter out the store ids that aren't legit
            if (isString(storeRef)) {
                return isStoreId(storeRef);
            } else if (isStore(storeRef) && isStoreId(storeRef.__storeId)) {
                return isStoreId(storeRef.__storeId);
            } else {
                return false;
            }
        }).map((storeRef) => {
            // Store refs -> store ids
            if (isString(storeRef)) return getStore(storeRef);
            else return storeRef;
        });
        // Scream and shout if even _one_ of the refs was invalid
        if (stores.length < storeRefs.length) {
            throw InvalidStoreRefsError();
        }
        // Apply new store ids to this service
        this.__stores = stores;
        // Become a mutator of the new stores
        this.__registerAsMutator();
        // Return this service for chaining
        return this;
    }

    handler(handler) {
        if (!isFunction(handler)) throw InvalidParameterTypeError('handler', 'function');
        // Re-calculate indices
        const indices = this.__resolveHandlerArguments(handler);
        // Done is required
        if (indices.done === -1) throw MissingCallbackError();
        // Unsubscribe before changing action ids
        this.__unsubscribeHandlerFromActions();
        // Sets the new handler & indices
        this.__handlerIndices = indices;
        this.__handler = handler;
        // Resubscribe to incoming actions
        this.__subscribeHandlerToActions();
        // Return this service for chaining
        return this;
    }
}

/****************************** MODULE EXPORTS *******************************/

export function createService(serviceId) {
    // Validation
    if (!isString(serviceId)) throw InvalidParameterTypeError('serviceId', 'String');
    if (isEmpty(serviceId)) throw EmptyParameterError('serviceId');
    if (serviceId.indexOf(LISTENER_NAMESPACE_SEPARATOR) !== -1) throw IllegalIdError('serviceId');
    if (serviceMap.has(serviceId)) throw IdAlreadyExistsError(serviceId);
    // Create new service
    const service = new Service(serviceId);
    // Register the actionId and trigger
    serviceMap.set(serviceId, service);
    // Return the trigger
    return service;
}

export function isServiceId(serviceId) {
    return serviceMap.has(serviceId);
}

export function isService(service) {
    return service instanceof Service;
}
