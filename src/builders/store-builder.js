/********************************** IMPORTS **********************************/

import Map from 'core-js/es6/map';
import Symbol from 'core-js/es6/symbol';

import ServiceEndpoint from './service-endpoint';
import {StoreRegistry} from '../registries';
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
class StoreBuilder {
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
     *
     * @param  {[type]} fieldId   [description]
     * @param  {[type]} fieldType [description]
     * @return {[type]}           [description]
     */
    defines(fieldId, fieldType) {
        // TODO (Sandile): do this after finishing the store field model
    }

    /**
     * TODO (Sandile): documentation
     * @return {[type]} [description]
     */
    build() {
        // TODO (Sandile): finish this after creating the store and store field models
    }
}

/********************************** EXPORTS **********************************/

export default StoreBuilder;