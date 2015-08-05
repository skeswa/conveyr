/********************************** IMPORTS **********************************/

import Symbol from 'core-js/es6/symbol';

import {InvalidId} from '../errors';
import {ActionRegistry} from '../registries';
import ActionPayloadFormat from './action-payload-format';
import ActionCallTarget from './action-call-target';
import ActionTrigger from './action-trigger';
import Action from './action';

/***************************** ERROR DEFINITIONS *****************************/

class CallTargetCollision extends Error {
    constructor() {
        super();
        this.name = 'CallTargetCollision';
        this.message = (
            `A call target matching the referenced Service Endpoint already exists.`
        );
    }
}

class NotEnoughCallTargets extends Error {
    constructor() {
        super();
        this.name = 'NotEnoughCallTargets';
        this.message = (
            `Actions must have at least one call target. Use the Action#calls(...) function`  +
            `to specify a call target.`
        );
    }
}

/***************************** CLASS DEFINITIONS *****************************/

/**
 * Syntactic sugar that wraps Action#invoke(). The Action itself is bound
 * to the trigger via the "this" ref.
 *
 * @param {Anything} payload The data attached to this Action invocation
 * @return {Promise} Promise that allows the caller to track the completion of the Action invocation
 */
function ActionTrigger(payload) {
    return this.invoke(payload);
}

// ActionBuilder symbols
const SYM_PAYLOAD_FMT   = Symbol('payloadFormat');
const SYM_CALL_TARGETS  = Symbol('callTargets');
const SYM_ACTION_ID     = Symbol('actionId');

/**
 * TODO (Sandile): write documentation
 */
class ActionBuilder {
    constructor(actionId) {
        // Validate the action id
        if (!isString(actionId) ||
            isEmpty(actionId)) {
            throw new InvalidId();
        }
        // Define fields
        this[SYM_PAYLOAD_FMT]   = null;
        this[SYM_CALL_TARGETS]  = [];
        this[SYM_ACTION_ID]     = actionId;
    }

    /**
     * Sets the payload format of the Action. After calling this function
     * with a valid payload format, all Action invocations will have their payloads
     * validated before performing any other operation. Payload formats are optional,
     * and if excluded, there will be no adverse penalties.
     *
     * @param  {Native Javascript Type or Field Validator Map} payloadFormat the intended format of the Action payload
     * @return {ActionBuilder}  returns this instance of the ActionBuilder
     */
    accepts(payloadFormat) {
        const fmt = new ActionPayloadFormat(payloadFormat);
        this[SYM_PAYLOAD_FMT] = fmt;
        // Facilitate chaining
        return this;
    }

    /**
     * Introduces a new consequence of this Action getting invoked. The specified
     * Service Endpoint is called when the Action is invoked, and it is passed the
     * Action payload. If a mapping function is specified, it is applied to the
     * payload before being passed to the Service Endpoint.
     *
     * @param  {Service Endpoint} serviceEndpoint Service Endpoint is called when the Action is invoked
     * @param  {Function} mappingFunction Function optionally applied to the payload before being passed to the Service Endpoint
     * @return {ActionBuilder}  returns this instance of the ActionBuilder
     */
    calls(serviceEndpoint, mappingFunction) {
        // Ensure we arent already calling this endpoint
        for (let callTarget of callTargets) {
            if (callTarget.endpoint() === serviceEndpoint) {
                throw new CallTargetCollision();
            }
        }
        // Create the new call target
        const newCallTarget = new ActionCallTarget(serviceEndpoint, mappingFunction);
        // Add it to the list
        this[SYM_CALL_TARGETS].push(newCallTarget);
        // Facilitate chaining
        return this;
    }

    /**
     * Assembles and returns a new Action based on the call targets and
     * payload formatter specified on this Action Builder.
     *
     * @return {ActionTrigger} The function that invokes the action's call targets
     */
    build() {
        // Ensure we have enough call targets
        if (this[SYM_CALL_TARGETS].length < 1) {
            throw new NotEnoughCallTargets();
        }
        // Create the action
        const action = new Action(
            this[SYM_ACTION_ID],
            this[SYM_CALL_TARGETS],
            this[SYM_ACTION_ID]
        );
        // Create the trigger that wraps the Action
        const trigger = ActionTrigger.bind(action);
        // Register the Action by registering its trigger as a proxy
        ActionRegistry.register(this[SYM_ACTION_ID], trigger);
        // Return the trigger
        return trigger;
    }
}

/********************************** EXPORTS **********************************/

export default ActionBuilder;