/********************************** IMPORTS **********************************/

import Symbol from 'core-js/es6/symbol';
import Promise from 'core-js/es6/promise';

/***************************** ERROR DEFINITIONS *****************************/

/***************************** CLASS DEFINITIONS *****************************/

// Action symbols
const SYM_PAYLOAD_FMT   = Symbol('payloadFormat');
const SYM_CALL_TARGETS  = Symbol('callTargets');
const SYM_ACTION_ID     = Symbol('actionId');

/**
 * TODO (Sandile): write documentation
 */
export default class Action {
    constructor(actionId, callTargets, payloadFormat) {
        this[SYM_PAYLOAD_FMT]   = payloadFormat;
        this[SYM_CALL_TARGETS]  = callTargets;
        this[SYM_ACTION_ID]     = actionId;
    }

    /**
     * Invokes the Action by invoking its call targets.
     *
     * @param  {Anything} payload The data attached to this Action invocation
     * @return {Promise} Promise that allows the caller to track the completion of the Action invocation
     */
    invoke(payload) {
        // Sanitize the payload
        let sanitizedPayload;
        if (this[SYM_PAYLOAD_FMT]) {
            sanitizedPayload = this[SYM_PAYLOAD_FMT].sanitize(payload);
        } else {
            sanitizedPayload = payload;
        }
        // Systematically invoke call targets
        const promises = this[SYM_CALL_TARGETS].map(callTarget => callTarget.call(
            this,
            this[SYM_ACTION_ID],
            sanitizedPayload
        ));
        // Return a consolidated promise if there is more than one call target
        if (promises.length === 1) {
            // Return a single promise if there's only one
            return promises[0];
        } else {
            return Promise.all(promises);
        }
    }
}

/********************************** EXPORTS **********************************/

export default Action;