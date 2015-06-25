'use strict';

/****************************** MODULE IMPORTS *******************************/

import Map from 'core-js/es6/map';
import Promise from 'core-js/es6/promise';

import {emit, subscribe, unsubscribe, LISTENER_NAMESPACE_SEPARATOR} from './eventbus';
import {
    isString,
    isEmpty,
    isType,
    isOfType,
    isObject,
    emptyValueOfType,
    nameOfType
} from './type';
import {isService, isServiceId, getService} from './service';
import {
    InvalidParameterTypeError,
    EmptyParameterError,
    IllegalIdError,
    IdAlreadyExistsError,
    InvalidServiceRefError,
    InvalidFieldMapTypeError,
    ActionPayloadValidationError,
    NotEnoughFieldsInFieldMapError,
    InvalidFieldMapDefaultError
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

class Action {
    constructor(actionId) {
        this.__actionId = actionId;
        this.__service = undefined;
        this.__payloadFields = undefined;
    }

    payload(types) {
        // Keep all fields in a standard format within an array
        let payloadFields = [];
        // Figure out what the user gave
        if (types === undefined ||
            types === null) {
            // No "types" provided - don't perform payload validation
            payloadFields = null;
        } else if (isType(types)) {
            // Take the type from what's passed in and assume default defaults
            const type = types;
            payloadFields.push({
                type:       type,
                default:    emptyValueOfType(type),
                root:       true,
                optional:   false
            });
            // We only have one field - exit here
        } else if (isObject(types)) {
            // This essentially parses the field map
            const fieldMap = types;
            // Iterate through provided fields - resolve them to fully-qualified versions
            let type;
            for (let field in fieldMap) {
                if (fieldMap.hasOwnProperty(field)) {
                    type = fieldMap[field];
                    if (isType(type)) {
                        payloadFields.push({
                            type:       type,
                            typeName:   nameOfType(type),
                            default:    emptyValueOfType(type),
                            name:       undefined,
                            optional:   false
                        });
                    } else if (type.hasOwnProperty('type')) {
                        // If we're here, we're ttreating this like a fully qualified field
                        const payloadField = {
                            type:       type.type,
                            typeName:   nameOfType(type.type),
                            default:    undefined,
                            name:       field,
                            optional:   false
                        };
                        // Devise the default value if unspecified
                        if (type.hasOwnProperty('default')) {
                            if (isOfType(type.default, type.type)) {
                                payloadField.default = type.default;
                                payloadField.optional = true;
                            } else {
                                throw InvalidFieldMapDefaultError(field);
                            }
                        }
                        // Adds a new payload field to the array
                        payloadFields.push(payloadField);
                    } else {
                        throw InvalidFieldMapTypeError(field);
                    }
                }
            }
            // If we have no fields at the end of this, scream and shout
            if (payloadFields.length <= 0) {
                throw NotEnoughFieldsInFieldMapError();
            }
        } else {
            throw InvalidParameterTypeError('types', 'native javascript type or field type map');
        }
        // Internalize the fields that we've gathered so far
        this.__payloadFields = payloadFields;
        return this;
    }

    service(serviceRef) {
        if (isService(serviceRef)) {
            this.__service = serviceRef;
        } else if (isServiceId(serviceRef)) {
            this.__service = getService(serviceRef);
        } else {
            throw InvalidServiceRefError();
        }
        return this;
    }
}

export class ActionResult {
    constructor(actionPayload, error) {
        this.instanceId = actionPayload.instanceId;
        this.error = error;
        this.wasSuccessful = (error === undefined || error === null);
    }
}

function ActionTrigger(payload) {
    // Validate the payload if we have validation rules in place
    if (this.__payloadFields) {
        // Exit immediately if payload is null
        if (payload === null || payload === undefined) throw InvalidParameterTypeError('payload', 'non-null & non-undefined');
        // Use loop to check if each field is valid
        let currPayloadField;
        for (let i = 0; i < this.__payloadFields.length; i++) {
            currPayloadField = this.__payloadFields[i];
            // Check if field is "root"
            if (currPayloadField.root && !isOfType(payload, currPayloadField.type)) {
                throw InvalidParameterTypeError('payload', currPayloadField.typeName);
            }
            // Check if field exists in payload
            if (!payload.hasOwnProperty(currPayloadField.name)) {
                throw ActionPayloadValidationError(currPayloadField.name, currPayloadField.typeName);
            }
            // Make sure the type of the value matches
            if (!isOfType(payload[currPayloadField.name], currPayloadField.type)) {
                throw ActionPayloadValidationError(currPayloadField.name, currPayloadField.typeName);
            }
        }
    }
    // Generate unique identifier for this invocation of the action
    const instanceId = nextActionInstanceId++;
    // Build the completion event
    const completionEvent = [this.__actionId, ACTION_COMPLETION_EVENT];
    // Generate a promise to return
    const promise = new Promise((resolve, reject) => {
        // Create new completion handler
        const onComplete = (result) => {
            // Filter for this instance id
            if (result.instanceId === instanceId) {
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
    emit(this.__actionId, { instanceId: instanceId, data: payload, actionId: this.__actionId });
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
    const action = new Action(actionId);
    const trigger = ActionTrigger.bind(action);
    // Extends the trigger to include action properties
    trigger.service = action.service;
    trigger.payload = action.payload;
    // Register the actionId and trigger
    actionTriggerMap.set(actionId, trigger);
    // Return the trigger
    return trigger;
}