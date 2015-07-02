/****************************** MODULE IMPORTS *******************************/

import Map from 'core-js/es6/map';

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
    IdAlreadyExistsError,
    InvalidServiceEndpointRefError,
    InvalidFieldMapTypeError,
    ActionPayloadValidationError,
    NotEnoughFieldsInFieldMapError,
    InvalidFieldMapDefaultError,
    ActionInvocationWithoutServiceEndpointError
} from './errors';


/***************************** MODULE CONSTANTS ******************************/

export const ACTION_COMPLETION_EVENT = 'completed';

/******************************* MODULE STATE ********************************/

const   actionTriggerMap        = new Map();

/********************************** HELPERS **********************************/

function onActionComplete(resolve, reject, result) {
    if (result.wasSuccessful) {
        resolve();
    } else {
        reject(result.error);
    }
}

// Sets the payload of an action trigger
function actionPayloadSetter(types) {
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
            default:    undefined,
            name:       undefined,
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
                        default:    undefined,
                        name:       field,
                        optional:   false
                    });
                } else if (type.hasOwnProperty('type')) {
                    // If we're here, we're ttreating this like a fully qualified field
                    const payloadField = {
                        type:       type.type,
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
        throw InvalidParameterTypeError('types', 'Native Javascript Type or Field Type Map');
    }
    // Internalize the fields that we've gathered so far
    this.payloadFields = payloadFields;
    // Return the trigger for chainability
    return this.trigger;
}

// Sets the endpoint of an action trigger
function actionServiceEndpointSetter(serviceEndpointRef) {
    console.log(serviceEndpointRef, isObject(serviceEndpointRef), serviceEndpointRef.hasOwnProperty('__service'), isService(serviceEndpointRef.service), serviceEndpointRef.hasOwnProperty('__endpointId'));
    if (isObject(serviceEndpointRef) &&
        isService(serviceEndpointRef.__service) &&
        serviceEndpointRef.hasOwnProperty('__endpointId')) {
        // Sets the internal service endpoint ref
        this.service = serviceEndpointRef.__service;
        this.endpointId = serviceEndpointRef.__endpointId;
    } else {
        throw InvalidServiceEndpointRefError();
    }
    // Return the trigger for chainability
    return this.trigger;
}

/***************************** TYPE DECLARATIONS *****************************/

export class ActionResult {
    constructor(actionPayload, error) {
        this.instanceId = actionPayload.instanceId;
        this.error = error;
        this.wasSuccessful = (error === undefined || error === null);
    }
}

function ActionTrigger(payload) {
    // Exit immediately if we have no service
    if (!isService(this.service) || !isString(this.endpointId)) {
        throw ActionInvocationWithoutServiceEndpointError(this.actionId);
    }
    // Only validate the payload if we have validation rules in place
    if (this.payloadFields) {
        // Exit immediately if payload is null
        if (payload === null || payload === undefined) throw InvalidParameterTypeError('payload', 'Non-null & not Undefined');
        // Use loop to check if each field is valid
        let currPayloadField;
        for (let i = 0; i < this.payloadFields.length; i++) {
            currPayloadField = this.payloadFields[i];
            // Root fields should be dealt with in a different way
            if ((currPayloadField.name === undefined || currPayloadField.name === null) &&
                !isOfType(payload, currPayloadField.type)) {
                throw InvalidParameterTypeError('payload', nameOfType(currPayloadField));
            }
            // Verify that field exists in payload
            if (!payload.hasOwnProperty(currPayloadField.name)) {
                throw ActionPayloadValidationError(currPayloadField.name, nameOfType(currPayloadField));
            }
            // Make sure the type of the value matches
            if (!isOfType(payload[currPayloadField.name], currPayloadField.type)) {
                throw ActionPayloadValidationError(currPayloadField.name, nameOfType(currPayloadField));
            }
        }
    }
    // Invoke the service handler, and return the service handler promise
    return this.service.service.__invokeHandler(this.endpointId, this.trigger, this.actionId, payload);
}

/****************************** MODULE EXPORTS *******************************/

export function createAction(actionId) {
    // Validation
    if (!isString(actionId)) throw InvalidParameterTypeError('actionId', 'String');
    if (isEmpty(actionId)) throw EmptyParameterError('actionId');
    if (actionTriggerMap.has(actionId)) throw IdAlreadyExistsError(actionId);

    // Create a plain state object to represent as "this" within the trigger
    const actionTriggerState = {
        actionId:           actionId,
        service:            undefined,
        endpointId:         undefined,
        payloadFields:      undefined,
        trigger:            undefined
    };
    // Create a new copy of the trigger function
    const trigger = ActionTrigger.bind(actionTriggerState);
    // Update the trigger's internal state to include itself (meta, I know)
    actionTriggerState.trigger = trigger;
    // Now attach the public methods of an action trigger
    trigger.sends = actionPayloadSetter.bind(actionTriggerState);
    trigger.calls = actionServiceEndpointSetter.bind(actionTriggerState);
    // Register the trigger and the action id
    actionTriggerMap.set(actionId, trigger);
    // Now, we need to return the trigger
    return trigger;
}