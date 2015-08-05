/********************************** IMPORTS **********************************/

import Symbol from 'core-js/es6/symbol';

/***************************** ERROR DEFINITIONS *****************************/

/********************************* CONSTANTS *********************************/

const ES5_FUNCTION_ARG_REGEX    = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
const ALL_SPACE_REGEX           = / /g;
const HANDLER_RESPONSE_TIMEOUT  = 5000; // I hope 5 seconds is reasonable

/***************************** HELPER FUNCTIONS ******************************/

/**
 * Uses reflection to find out what arguments the handler function needs,
 * and in what order it needs them.
 *
 * @param  {Function} handler The handler function for the Service Endpoint
 * @return {Index Map}        The map of indices for handler arguments
 */
function resolveHandlerIndices(handler) {
    // Indices for the handler arguments
    const indices = {
        mutator:    -1,
        action:     -1,
        actionId:   -1,
        payload:    -1,
        callback:   -1,
        total:      0
    };
    // Isolates arguments from function string
    const args = handler
        .toString()
        .match(ES5_FUNCTION_ARG_REGEX)[1]
        .replace(ALL_SPACE_REGEX, '')
        .split(',');
    // Manage a count of how many indices there are
    let totalIndices = 0;
    // Figure out the index of each parameter
    args.forEach((arg, i) => {
        switch(arg.toLowerCase())  {
        case 'mutator':
        case 'storemutator':
            indices.mutator = i;
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
            indices.callback = i;
            totalIndices++;
            break;
        }
    });
    // Record the argument total
    indices.total = args.length;
    // Return the index map
    return indices;
}

/***************************** CLASS DEFINITIONS *****************************/

// ServiceEndpoint symbols
const SYM_HANDLER               = Symbol('handler');
const SYM_SERVICE_ID            = Symbol('serviceId');
const SYM_ENDPOINT_ID           = Symbol('endpointId');
const SYM_STORE_MUTATOR         = Symbol('storeMutator');
const SYM_HANDLER_ARG_INDICES   = Symbol('handlerIndices');

/**
 * TODO (Sandile): write documentation
 */
class ServiceEndpoint {
    constructor(endpointId, serviceId, storeMutator, handler) {
        this[SYM_SERVICE_ID]            = serviceId;
        this[SYM_HANDLER]               = handler;
        this[SYM_ENDPOINT_ID]           = endpointId;
        this[SYM_STORE_MUTATOR]         = storeMutator;
        this[SYM_HANDLER_ARG_INDICES]   = resolveHandlerIndices(handler);
    }

    /**
     * TODO (Sandile): write documentation
     * @return {[type]} [description]
     */
    id() {
        return this[SYM_ENDPOINT_ID];
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
    invoke(actionId, action, payload, resolve, reject) {
        const indices       = this[SYM_HANDLER_ARG_INDICES];
        const handler       = this[SYM_HANDLER];
        const args          = new Array(indices.total);
        let handlerIsAsync  = true;

        // Inject arguments into the array
        if (indices.mutator !== -1) {
            args[indices.mutator] = this[SYM_STORE_MUTATOR];
        }
        if (indices.action !== -1) {
            args[indices.action] = action;
        }
        if (indices.actionId !== -1) {
            args[indices.actionId] = actionId;
        }
        if (indices.payload !== -1) {
            args[indices.payload] = payload;
        }
        if (indices.callback !== -1) {
            // Start the callback timeout timer
            const timeoutTimerRef = setTimeout(() => {
                reject(
                    `The handler of the Service with id "${this.__serviceId}" took too long to finish. ` +
                    `The current Service handler timeout is ${HANDLER_RESPONSE_TIMEOUT} milliseconds.`
                );
            }, HANDLER_RESPONSE_TIMEOUT);
            // Build the callback
            args[indices.callback] = (err) => {
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
        } else {
            handlerIsAsync = false;
        }
        // Zè args are now ready, fire up the handler function
        try {
            handler.apply(this, args);
            // Terminate here if synchronous
            if (!handlerIsAsync) {
                return resolve();
            }
        } catch(err) {
            return reject(err);
        }
    }

    /**
     * TODO (Sandile): write documentation
     *
     * @param  {[type]} thing [description]
     * @return {[type]}       [description]
     */
    static validate(thing) {
        return thing instanceof ServiceEndpoint;
    }
}

/********************************** EXPORTS **********************************/

export default ServiceEndpoint;