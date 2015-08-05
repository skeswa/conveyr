/********************************** IMPORTS **********************************/

import Symbol from 'core-js/es6/symbol';
import Promise from 'core-js/es6/promise';

import ServiceEndpoint from './service-endpoint';
import {isFunction} from '../type';

/***************************** ERROR DEFINITIONS *****************************/

class InvalidEndpointArgument extends Error {
    constructor() {
        super();
        this.name = 'InvalidEndpointArgument';
        this.message = (
            `The endpoint argument was not a valid Service Endpoint.`
        );
    }
}

class InvalidMappingFunctionArgument extends Error {
    constructor() {
        super();
        this.name = 'InvalidMappingFunctionArgument';
        this.message = (
            `The mapping function argument was not a valid Function.`
        );
    }
}

/***************************** CLASS DEFINITIONS *****************************/

// ActionCallTarget symbols
const SYM_ENDPOINT      = Symbol('endpointId');
const SYM_MAPPING_FN    = Symbol('mappingFunction');

/**
 * Carries out the function calls that result from an Action being triggered.
 */
class ActionCallTarget {
    constructor(endpoint, mappingFunction) {
        // Store the endpoint
        if (ServiceEndpoint.validate(endpoint)) {
            this[SYM_ENDPOINT] = endpoint;
        } else {
            throw InvalidEndpointArgument();
        }
        // Store the mapping function if defined
        if (isFunction(mappingFunction)) {
            this[SYM_MAPPING_FN] = mappingFunction;
        } else if (mappingFunction === undefined || mappingFunction === null) {
            this[SYM_MAPPING_FN] = undefined;
        } else {
            throw InvalidMappingFunctionArgument();
        }
    }

    /**
     * TODO (Sandile): write documentation
     *
     * @param  {[type]} actionId [description]
     * @param  {[type]} action   [description]
     * @param  {[type]} payload  [description]
     * @param  {[type]} resolve  [description]
     * @param  {[type]} reject   [description]
     * @return {[type]}          [description]
     */
    __invokeServiceEndpointHandler(actionId, action, payload, resolve, reject) {
        try {
            this[SYM_ENDPOINT].invoke(actionId, action, payload, resolve, reject);
        } catch(err) {
            reject(err);
        }
    }

    /**
     * @return {ServiceEndpoint} The Service Endpoint that this call target references
     */
    endpoint() {
        return this[SYM_ENDPOINT];
    }

    /**
     * Calls the Service Endpoint and passes the payload as the argument.
     * If a mapping function was passed to the call target, it will be
     * applied on the payload before being sent to the Service Endpoint.
     *
     * @param  {Native Jacascript Type or Object} payload   the data to send to the Service Endpoint
     * @return {Promise}                                    the promise representing the Service Endpoint invocation
     */
    call(actionId, action, payload) {
        const mappingFunction = this[SYM_MAPPING_FN];
        // Map the payload
        let transformedPayload;
        if (mappingFunction) {
            transformedPayload = mappingFunction(payload);
        } else {
            transformedPayload = payload;
        }
        // Create the promise that calls the Service Endpoint
        return new Promise(this.__invokeServiceEndpointHandler.bind(this, actionId, action, transformedPayload));
    }
}

/********************************** EXPORTS **********************************/

export default ActionCallTarget;