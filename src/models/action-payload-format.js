/********************************** IMPORTS **********************************/

import clone from 'shallow-copy';
import Symbol from 'core-js/es6/symbol';

import {
    isObject,
    isFunction,
    isNativeType,
    isOfType,
    nameOfType,
    emptyValueOfType
} from '../type';
import {FieldValidator, ValidatorAnalysisResult} from './field-validator';

/***************************** ERROR DEFINITIONS *****************************/

class PayloadFieldValidationFailed extends Error {
    constructor(fieldName, correctTypeName) {
        super();
        this.name = 'PayloadFieldValidationFailed';
        this.message = (
            `The payload field called "${fieldName}" could not be validated. ` +
            `Make sure the value of the "${fieldName}" field is of type ${correctTypeName}.`
        );
    }
}

/***************************** CLASS DEFINITIONS *****************************/

// ActionPayloadFormat symbols
const SYM_FIELD_VALIDATORS  = Symbol('fieldValidators');

/**
 * The ActionPayloadFormat is a mechanism to validate Action payloads. It accepts
 * a format representing the structure of the payload.
 */
class ActionPayloadFormat {
    constructor(format) {
        this[SYM_FIELD_VALIDATORS] = FieldValidator.toList(format);
    }

    /**
     * Validates payload and injects defaults into its missing fields.
     * Returns the payload after both processes have finished.
     *
     * @param  {*} payload The data to be sanitized
     * @return {*}         The sanitized payload
     */
    sanitize(payload) {
        // Keep a ref for a payload clone jic
        let payloadClone = undefined;
        // Validate each field validator
        let currFieldValidator;
        for (let i = 0; i < this[SYM_FIELD_VALIDATORS].length; i++) {
            currFieldValidator = this[SYM_FIELD_VALIDATORS][i];
            // If the validate doesn't work, then throw a validation failure
            switch (currFieldValidator.analyze(payload)) {
            case ValidatorAnalysisResult.VALID_REQUIRES_INJECTION:
                // Assert that the payload clone exists
                if (payloadClone === undefined) {
                    payloadClone = clone(payload);
                }
                // Change the payload to provide the missing defaults
                currFieldValidator.inject(payloadClone);
                break;
            case ValidatorAnalysisResult.INVALID:
                throw new PayloadFieldValidationFailed(
                    currFieldValidator.name(),
                    nameOfType(currFieldValidator.type())
                );
            }
        }
        // If the payload clone is defined, return that.
        // Othwerwise, return the payload
        if (payloadClone === undefined) return payload;
        else return payloadClone;
    }
}

/********************************** EXPORTS **********************************/

export default ActionPayloadFormat;