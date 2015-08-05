/********************************** IMPORTS **********************************/

import Map from 'core-js/es6/map';
import Symbol from 'core-js/es6/symbol';

import ServiceEndpoint from './service-endpoint';
import {ServiceRegistry} from '../registries';
import StoreMutator from './store-mutator';
import {InvalidId} from '../errors';
import Service from './service';
import Store from './store';

/***************************** ERROR DEFINITIONS *****************************/

class InvalidStoreArgument extends Error {
    constructor(arg) {
        super();
        this.name = 'InvalidStoreArgument';
        this.message = (
            `One of the arguments (${arg}) is not a valid Store.`
        );
    }
}

class EndpointCollision extends Error {
    constructor(endpointId) {
        super();
        this.name = 'EndpointCollision';
        this.message = (
            `Service Endpoint with id "${endpointId}" already exists.`
        );
    }
}

class NotEnoughEndpoints extends Error {
    constructor() {
        super();
        this.name = 'NotEnoughEndpoints';
        this.message = (
            `Services must have at least one Service Endpoint. ` +
            `Use the Service#exposes(...) function to specify a new Service Endpoint.`
        );
    }
}

/***************************** CLASS DEFINITIONS *****************************/

// ServiceBuilder symbols
const SYM_STORES        = Symbol('stores');
const SYM_ENDPOINTS     = Symbol('endpoints');
const SYM_SERVICE_ID    = Symbol('serviceId');
const SYM_STORE_MUTATOR = Symbol('storeMutator');

/**
 * TODO (Sandile): documentation
 */
class ServiceBuilder {
    constructor(serviceId) {
        // Validate the service id
        if (!isString(serviceId) ||
            isEmpty(serviceId)) {
            throw new InvalidId();
        }
        // Define fields
        this[SYM_STORES]        = [];
        this[SYM_ENDPOINTS]     = [];
        this[SYM_SERVICE_ID]    = serviceId;
        this[SYM_STORE_MUTATOR] = new StoreMutator();
    }

    /**
     * TODO (Sandile): documentation
     * @param  {...[type]} stores [description]
     * @return {[type]}           [description]
     */
    updates(...stores) {
        // Perform validation
        for (let store of stores) {
            if (!Store.validate(store)) {
                throw new InvalidStoreArgument(store);
            }
        }
        // Save the stores array
        this[SYM_STORES] = stores;
        // Facilitate chaining
        return this;
    }

    /**
     * TODO (Sandile): documentation
     * @param  {[type]} endpointId      [description]
     * @param  {[type]} handlerFunction [description]
     * @return {[type]}                 [description]
     */
    exposes(endpointId, handlerFunction) {
        const endpoints = this[SYM_ENDPOINTS];
        // Perform validation
        for (let endpoint of endpoints) {
            if (endpoint.id() === endpointId) {
                throw new EndpointCollision(endpointId);
            }
        }
        // Create the endpoint
        const newEndpoint = new ServiceEndpoint(
            endpointId,
            this[SYM_SERVICE_ID],
            this[SYM_STORE_MUTATOR],
            handlerFunction
        );
        // Store the endpoint internally
        endpoints.push(newEndpoint);
        // Facilitate chaining
        return this;
    }

    /**
     * TODO (Sandile): documentation
     * @return {[type]} [description]
     */
    build() {
        const stores        = this[SYM_STORES];
        const endpoints     = this[SYM_ENDPOINTS];
        const serviceId     = this[SYM_SERVICE_ID];
        const mutator       = this[SYM_STORE_MUTATOR];
        const endpointMap   = new Map();
        // Perform validation
        if (endpoints.length < 1) {
            throw new NotEnoughEndpoints();
        }
        // Register the mutator with every store
        stores.forEach(store => registerMutator(mutator));
        // Turn the endpoints array into a map
        endpoints.forEach(endpoint => endpointMap.set(endpoint.id(), endpoint));
        // Create the new Service
        const newService = new Service(
            serviceId,
            mutator,
            endpointMap
        );
        // Register the new Service
        ServiceRegistry.register(serviceId, newService);
        // Return the Service
        return newService;
    }
}

/********************************** EXPORTS **********************************/

export default ServiceBuilder;