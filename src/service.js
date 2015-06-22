'use strict';

/****************************** MODULE IMPORTS *******************************/

import {emit, subscribe, unsubscribe, LISTENER_NAMESPACE_SEPARATOR} from './eventbus';
import {isString, isEmpty, isFunction} from './typechecker';
import {
    InvalidParameterTypeError,
    EmptyParameterError,
    IllegalIdError,
    IdAlreadyExistsError
} from './errors';

import {isActionId, getAction, ActionResult, ACTION_EXPIRATION_EVENT} from './action';
import {isStoreId, generateMutatorContext, isStore} from './store';

/***************************** MODULE CONSTANTS ******************************/

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
        this.__mutatorContext   = generateMutatorContext();
    }

    /**************************** PRIVATE METHODS ****************************/

    // Unsubscribes the handler function from all actions lited in this.__actionIds
    __unsubscribeHandlerFromActions() {
        if (this.__handler &&
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
            payload &&
            payload.actionId &&
            payload.instanceId) {
            // The mutator context
            const context = this.__mutatorContext;
            // Get the payload fields
            const {actionId, instanceId, data} = payload;
            // Compose the expiration event
            const expirationEvent = [actionId, ACTION_EXPIRATION_EVENT];
            // Build the callback
            const done = (err) => {
                if (err !== null && err !== undefined) {
                    // A problem happened
                    emit(expirationEvent, new ActionResult(payload, err));
                } else {
                    emit(expirationEvent, new ActionResult(payload));
                }
            };
            // Invoke the handler
            this.__handler(context, actionId, data, done);
        }
    }

    /**************************** PUBLIC METHODS *****************************/

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
        // Apply new action ids to this service
        this.__actionIds = actionIds;
        // Resubscribe to incoming actions
        this.__subscribeHandlerToActions();
        // Return this service for chaining
        return this;
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
        // Apply new store ids to this service
        this.__stores = stores;
        // Become a mutator of the new stores
        this.__registerAsMutator();
        // Return this service for chaining
        return this;
    }

    handler(handler) {
        // TODO (Sandile): add handler binding here
        throw new Error('Not implemented yet');
    }
}

/****************************** MODULE EXPORTS *******************************/


export function createService(serviceId) {
    // Validation
    if (!isString(serviceId)) throw InvalidParameterTypeError('serviceId', 'String');
    if (isEmpty(serviceId)) throw EmptyParameterError('serviceId');
    if (serviceId.indexOf(LISTENER_NAMESPACE_SEPARATOR) !== -1) throw IllegalIdError('serviceId');
    if (serviceMap.has(serviceId)) throw IdAlreadyExistsError(serviceId);
    // Create new action trigger
    const trigger = ActionTrigger.bind(undefined, actionId);
    // Register the actionId and trigger
    actionTriggerMap.set(actionId, trigger);
    // Return the trigger
    return trigger;
}