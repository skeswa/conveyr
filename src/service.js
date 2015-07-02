/****************************** MODULE IMPORTS *******************************/

import Map from 'core-js/es6/map';
import Promise from 'core-js/es6/promise';

import {isString, isEmpty, isFunction} from './type';
import {
    InvalidParameterTypeError,
    EmptyParameterError,
    IdAlreadyExistsError,
    InvalidStoreRefsError,
    MissingCallbackError,
    NoSuchServiceEndpointError
} from './errors';

import {isStoreId, getStore, generateMutatorContext, isStore} from './store';

/***************************** MODULE CONSTANTS ******************************/

const ES5_FUNCTION_ARG_REGEX    = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
const ALL_SPACE_REGEX           = / /g;
const HANDLER_RESPONSE_TIMEOUT  = 5000; // I hope 5 seconds is reasonable

/******************************* MODULE STATE ********************************/

const   serviceMap              = new Map();

/***************************** TYPE DECLARATIONS *****************************/

class ServiceEndpoint {
    constructor(indices, handler) {
        this.__indices = indices;
        this.__handler = handler;
    }
}

class Service {
    constructor(serviceId) {
        this.__serviceId        = serviceId;
        this.__stores           = undefined;
        this.__mutatorContext   = generateMutatorContext();
        this.__endpointMap      = new Map();
        // Bind the all private class methods
        this.__unregisterAsMutator      = this.__unregisterAsMutator.bind(this);
        this.__registerAsMutator        = this.__registerAsMutator.bind(this);
        this.__invokeHandler            = this.__invokeHandler.bind(this);
        this.__compileHandlerArguments  = this.__compileHandlerArguments.bind(this);
        this.__resolveHandlerArguments  = this.__resolveHandlerArguments.bind(this);
        // Bind the all public class methods
        this.updates    = this.updates.bind(this);
        this.exposes    = this.exposes.bind(this);
        this.endpoint   = this.endpoint.bind(this);
    }

    /**************************** PRIVATE METHODS ****************************/

    // Unregisters this service a mutator of the stores listed in this.__storeIds
    __unregisterAsMutator() {
        if (this.__stores &&
            this.__stores.length > 0) {
            // Unregister from all the stores
            let i, currStore;
            for (i = 0; i < this.__stores.length; i++) {
                currStore = this.__stores[i];
                currStore.__unregisterMutatorContext(this.__mutatorContext);
            }
        }
    }

    // Registers this service a mutator of the stores listed in this.__storeIds
    __registerAsMutator() {
        if (this.__stores &&
            this.__stores.length > 0) {
            // Register with all the stores
            let i, currStore;
            for (i = 0; i < this.__stores.length; i++) {
                currStore = this.__stores[i];
                currStore.__registerMutatorContext(this.__mutatorContext);
            }
        }
    }

    // Called by action triggers to invoke handler function
    __invokeHandler(endpointId, trigger, actionId, payload) {
        if (this.__endpointMap.has(endpointId)) {
            const {indices, handler} = this.__endpointMap.get(endpointId);
            // Create a promise that should be resolved by the handler
            return new Promise((resolve, reject) => {
                try {
                    handler.apply(this, this.__compileHandlerArguments(indices, trigger, actionId, payload, resolve, reject));
                } catch(err) {
                    return reject(err);
                }
                // If there is no callback, execute synchronously
                if (indices.done === -1) {
                    return resolve();
                }
            });
        } else {
            // Return a promise that immediately exists due to a non-existent endpoint
            return Promise.reject(`Service with id "${this.__serviceId}" has no endpoint with id "${endpointId}".`);
        }
    }

    // Puts args together for handler function
    __compileHandlerArguments(indices, trigger, actionId, payload, resolve, reject) {
        const args = new Array(indices.total);
        if (indices.context !== -1) {
            args[indices.context] = this.__mutatorContext;
        }
        if (indices.action !== -1) {
            args[indices.action] = trigger;
        }
        if (indices.actionId !== -1) {
            args[indices.actionId] = actionId;
        }
        if (indices.payload !== -1) {
            args[indices.payload] = payload;
        }
        if (indices.done !== -1) {
            // Start the callback timeout timer
            const timeoutTimerRef = setTimeout(() => {
                reject(
                    `The handler of the Service with id "${this.__serviceId}" took too long to finish. ` +
                    `The current Service handler timeout is ${HANDLER_RESPONSE_TIMEOUT} milliseconds.`
                );
            }, HANDLER_RESPONSE_TIMEOUT);
            // Build the callback
            args[indices.done] = (err) => {
                // Clear the timeout timer
                clearTimeout(timeoutTimerRef);
                // Promise resolution logic
                if (err !== null && err !== undefined) {
                    // A problem happened
                    resolve();
                } else {
                    reject(err);
                }
            };
        }
        // Zè args are now ready
        return args;
    }

    __resolveHandlerArguments(handler) {
        let indices = {
            context:    -1,
            action:     -1,
            actionId:   -1,
            payload:    -1,
            done:       -1,
            total:      0
        };

        const args = handler.toString().match(ES5_FUNCTION_ARG_REGEX)[1].replace(ALL_SPACE_REGEX, '').split(',');
        let totalIndices = 0;
        // Figure out the index of each parameter
        args.forEach((arg, i) => {
            switch(arg.toLowerCase())  {
            case 'context':
            case 'mutator':
            case 'mutatorContext':
                indices.context = i;
                totalIndices++;
                break;
            case 'action':
                indices.action = i;;
                totalIndices++;
                break;
            case 'actionid':
                indices.actionId = i;;
                totalIndices++;
                break;
            case 'payload':
            case 'data':
                indices.payload = i;
                totalIndices++;
                break;
            case 'done':
            case 'callback':
            case 'finish':
                indices.done = i;
                totalIndices++;
                break;
            }
        });
        // Record the argument total
        indices.total = args.length;

        return indices;
    }

    /**************************** PUBLIC METHODS *****************************/

    updates(...storeRefs) {
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

    exposes(endpointId, handler) {
        // Basic empty checks
        if (!isString(endpointId)) throw InvalidParameterTypeError('endpointId', 'String');
        if (isEmpty(endpointId)) throw EmptyParameterError('endpointId');
        // Exit immediately if this field has already been defined
        if (this.__endpointMap.has(endpointId)) {
            throw IdAlreadyExistsError(endpointId);
        }
        if (!isFunction(handler)) throw InvalidParameterTypeError('handler', 'function');
        // Re-calculate indices
        const indices = this.__resolveHandlerArguments(handler);
        // Create the endpoint
        this.__endpointMap.set(endpointId, new ServiceEndpoint(indices, handler));
        // Return this service for chaining
        return this;
    }

    endpoint(endpointId) {
        if (!this.__endpointMap.has(endpointId)) {
            throw NoSuchServiceEndpointError(endpointId, this.__serviceId);
        } else {
            // Return a service endpoint
            return {
                __service:      this,
                __endpointId:   endpointId
            };
        }
    }
}

/****************************** MODULE EXPORTS *******************************/

export function createService(serviceId) {
    // Validation
    if (!isString(serviceId)) throw InvalidParameterTypeError('serviceId', 'String');
    if (isEmpty(serviceId)) throw EmptyParameterError('serviceId');
    if (serviceMap.has(serviceId)) throw IdAlreadyExistsError(serviceId);
    // Create new service
    const service = new Service(serviceId);
    // Register the serviceId and trigger
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

export function getService(serviceId) {
    return serviceMap.get(serviceId);
}

export function isEndpointId(endpointId) {
    return serviceMap.has(serviceId);
}
