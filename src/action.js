'use strict';

/****************************** MODULE IMPORTS *******************************/

import {emit, subscribe, unsubscribe, LISTENER_NAMESPACE_SEPARATOR} from './eventbus';
import {isString, isEmpty} from './typechecker';
import {
    InvalidParameterTypeError,
    EmptyParameterError,
    IllegalIdError,
    IdAlreadyExistsError
} from './errors';


/***************************** MODULE CONSTANTS ******************************/

export const ACTION_COMPLETION_EVENT = 'completed';

/******************************* MODULE STATE ********************************/

const   actionTriggerMap        = new Map();
let     nextActionInstanceId    = 1;

/********************************** HELPERS **********************************/

function onActionComplete(resolve, reject, result) {
    if (result.wasSuccessful) {
        resolve();
    } else {
        reject(result.error);
    }
}

/***************************** TYPE DECLARATIONS *****************************/

class ActionPayload {
    constructor(actionId, data) {
        this.instanceId = nextActionInstanceId++;
        this.data = data;
        this.actionId = actionId;
    }
}

export class ActionResult {
    constructor(actionPayload, error) {
        this.instanceId = actionPayload.instanceId;
        this.error = error;
        this.wasSuccessful = (error === undefined || error === null);
    }
}

function ActionTrigger(actionId, data) {
    // Generate the payload
    const actionPayload = new ActionPayload(actionId, data);
    // Build thr completion event
    const completionEvent = [actionId, ACTION_COMPLETION_EVENT];
    // Generate a promise to return
    const promise = new Promise((resolve, reject) => {
        // Create new completion handler
        const onComplete = (result) => {
            // Filter for this instance id
            if (result.instanceId === actionPayload.instanceId) {
                // Unsubscribe from further events
                unsubscribe(completionEvent, onComplete);
                // Finish the promise
                if (result.wasSuccessful) {
                    resolve();
                } else {
                    reject(result.error);
                }
            }
        };
        // Subscribe the completion handler to completion events
        subscribe(completionEvent, onComplete);
    });
    // Trigger the action
    emit(actionId, actionPayload);
    // Return the promise to the caller
    return promise;
}

/****************************** MODULE EXPORTS *******************************/

export function createAction(actionId) {
    // Validation
    if (!isString(actionId)) throw InvalidParameterTypeError('actionId', 'String');
    if (isEmpty(actionId)) throw EmptyParameterError('actionId');
    if (actionId.indexOf(LISTENER_NAMESPACE_SEPARATOR) !== -1) throw IllegalIdError('actionId');
    if (actionTriggerMap.has(actionId)) throw IdAlreadyExistsError(actionId);
    // Create new action trigger
    const trigger = ActionTrigger.bind(undefined, actionId);
    // Add meta data to the trigger
    trigger.__actionId = actionId;
    // Register the actionId and trigger
    actionTriggerMap.set(actionId, trigger);
    // Return the trigger
    return trigger;
}

export function isActionId(actionId) {
    return actionTriggerMap.has(actionId);
}

export function getAction(actionId) {
    return actionTriggerMap.get(actionId);
}