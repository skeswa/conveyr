/********************************** IMPORTS **********************************/

import Symbol from 'core-js/es6/symbol';

import {
    isObject,
    isFunction,
    isNativeType,
    isOfType,
    nameOfType,
    emptyValueOfType
} from '../type';

/***************************** ERROR DEFINITIONS *****************************/

class InvalidFormat extends Error {
    constructor() {
        super();
        this.name = 'InvalidFormat';
        this.message = (
            `The format must be either a native javascript type, a constructor function, ` +
            `or a map of field validators.`
        );
    }
}

class InvalidFieldValidatorType extends Error {
    constructor(fieldName) {
        super();
        this.name = 'InvalidFieldValidatorType';
        if (fieldName) {
            this.message = (
                `The field validator called "${fieldName}" has an invalid type. ` +
                `The type must be either a Native Javascript Type or a Class Contructor.`
            );
        } else {
            this.message = (
                `The provided field validator has an invalid type. ` +
                `The type must be either a Native Javascript Type or a Class Contructor.`
            );
        }
    }
}

class InvalidFieldValidatorDefault extends Error {
    constructor(fieldName) {
        super();
        this.name = 'InvalidFieldValidatorDefault';
        if (fieldName) {
            this.message = (
                `The field validator called "${fieldName}" has an invalid default. ` +
                `Defaults must match the types that they're paired with.`
            );
        } else {
            this.message = (
                `The provided field validator has an invalid default. ` +
                `Defaults must match the types that they're paired with.`
            );
        }
    }
}

class NoFieldValidatorsDefined extends Error {
    constructor() {
        super();
        this.name = 'NoFieldValidatorsDefined';
        this.message = (
            `The provided payload format did not define any field validators. ` +
            `Field validator maps must define at least one field validator.`
        );
    }
}

/***************************** CLASS DEFINITIONS *****************************/

// Describes the result of FieldValidator.analyze()
export const ValidatorAnalysisResult = {
    VALID:                      1,
    INVALID:                    2,
    VALID_REQUIRES_INJECTION:   3
};

// FieldValidator symbols
const SYM_TYPE      = Symbol('type');
const SYM_DEFAULT   = Symbol('default');
const SYM_NAME      = Symbol('name');
const SYM_OPTIONAL  = Symbol('optional');

/**
 * Performs validator on a single field of a Store Field or an Action Payload.
 */
export class FieldValidator {
    constructor(type, defaultValue, name, optional) {
        this[SYM_TYPE]      = type;
        this[SYM_DEFAULT]   = defaultValue;
        this[SYM_NAME]      = name;
        this[SYM_OPTIONAL]  = optional;
    }

    /**
     * Deduces whether the payload matches this validator or not. Thereafter,
     * this function determines whether the payload requires default value
     * injection.
     *
     * @param  {Object or Constructor or Native Javascript Type}    payload The payload to an Action Trigger
     * @return {ValidatorAnalysisResult} returns a ValidatorAnalysisResult
     */
    analyze(payload) {
        // TODO (Sandile): update for root-level full-qualified-types

        const name = this[SYM_NAME];
        // Evaluate differently for "root" fields
        if (name === undefined) {
            const type = this[SYM_TYPE];
            const value = payload;
            // This means that this field is the root
            if (value !== null &&
                value !== undefined &&
                isOfType(value, type)) {
                return ValidatorAnalysisResult.VALID;
            } else {
                return ValidatorAnalysisResult.INVALID;
            }
        } else {
            // This means that the payload must be an object with a field
            // matching this.name
            if (isObject(payload)) {
                const type = this[SYM_TYPE];
                // If a field matching this.name is defined, check if its the right type
                if (payload.hasOwnProperty(name)) {
                    if (isOfType(payload[name], type)) {
                        return ValidatorAnalysisResult.VALID;
                    } else {
                        return ValidatorAnalysisResult.INVALID;
                    }
                } else {
                    const optional = this[SYM_OPTIONAL];
                    // If this field is optional, but hasn't been defined, define it
                    if (optional) {
                        // Field is optional and was not defined - so it needs the field
                        // to be injected
                        return ValidatorAnalysisResult.VALID_REQUIRES_INJECTION;
                    } else {
                        // Otherwise, we have a problem
                        return ValidatorAnalysisResult.INVALID;
                    }
                }
            } else {
                return ValidatorAnalysisResult.INVALID;
            }
        }
    }

    /**
     * Injects the default value of the field that this validator represents
     * into the provided payload.
     *
     * @param  {Object} payload     The action payload being validated
     * @return {null}               returns nothing
     */
    inject(payload) {
        const defaultValue = this[SYM_DEFAULT];
        payload[this[SYM_NAME]] = defaultValue;
    }

    /**
     * @return {String} returns the name of the field this validator validates
     */
    name() {
        return this[SYM_NAME];
    }

    /**
     * @return {String} returns the the type of the field this validator validates
     */
    type() {
        return this[SYM_TYPE];
    }

    /**
     * Creates a new FieldValidator from a native js type
     * @param  {Native Type} nativeType the type of the field
     * @param  {String}      name       the name of the field
     * @param  {Boolean}     optional   true if this field is optional
     * @return {FieldValidator}  returns a new FieldValidator wrapping the constructor
     */
    static fromNativeType(nativeType, name, optional) {
        const defaultValue = emptyValueOfType(nativeType);
        // return the new validator
        return new FieldValidator(nativeType, defaultValue, name, optional);
    }

    /**
     * Creates a new FieldValidator from a constructor.
     *
     * @param  {Function} constructor   the type of the field
     * @param  {String}   name          the name of the field
     * @param  {Boolean}  optional      true if this field is optional
     * @return {FieldValidator}  returns a new FieldValidator wrapping the constructor
     */
    static fromContructor(constructor, name, optional) {
        // There is no inferrable custom type default
        const defaultValue = undefined;
        // return the new validator
        return new FieldValidator(constructor, defaultValue, name, optional);
    }

    /**
     * Creates a new FieldValidator from a fully-qualified-type object.
     *
     * @param  {Object} obj  The fully-qualified-type object
     * @param  {String} name The name of the field
     * @return {FieldValidator} Returns a new FieldValidator wrapping the fully-qualified-type object
     */
    static fromFullyQualifiedTypeObject(obj, name) {
        // The type prop. of this f.q.t.
        const type = obj.type;
        // Figure out what kind the type is
        if (isNativeType(type) || isFunction(type)) {
            let defaultValue;
            // Check if a default has been specified
            if (obj.hasOwnProperty('default')) {
                if (obj.default === null ||
                    obj.default === undefined ||
                    isOfType(obj.default, type)) {
                    defaultValue = obj.default;
                } else {
                    throw new InvalidFieldValidatorDefault(name);
                }
                // Return the new field validator
                return new FieldValidator(type, defaultValue, name, true);
            } else {
                return new FieldValidator(type, undefined, name, false);
            }
        } else {
            throw new InvalidFieldValidatorType(name);
        }
    }

    /**
     * @return {Boolean} Returns true if obj is a fully-qualified-type
     */
    static isFullyQualifiedTypeObject(obj) {
        return obj.hasOwnProperty('type');
    }

    /**
     * Turns a payload format into a list of field validators.
     *
     * @param  {Object or Native Type} format The format of the payload
     * @return {String}        Returns null when the format is valid,
     *                         otherwise it returns an error string
     */
    static toList(format) {
        const list = [];
        // If the format isn't specified, simply return
        if (format === undefined ||
            format === null) {
            return list;
        } else if (isNativeType(format)) {
            // Name is undefined since this validator refers to the root payload
            const name = undefined;
            // Add the new validator to the list
            list.push(FieldValidator.fromNativeType(format, name, false));
        } else if (isFunction(format)) {
            // Name is undefined since this validator refers to the root payload
            const name = undefined;
            // Add the new validator to the list
            list.push(FieldValidator.fromContructor(format, name, false));
        } else if (isObject(format)) {
            // This type is a "fully qualified type", so we need to make sure that it
            // at least has a "type" prop
            if (FieldValidator.isFullyQualifiedTypeObject(currValidatorType)) {
                // Add the new validator to the list
                list.push(FieldValidator.fromFullyQualifiedTypeObject(currValidatorType, undefined));
            } else {
                // This means that the format is actually a field validator map
                const validatorMap = format;
                // So, we need to loop through every field validator in the field validator map
                let currValidatorName, currValidatorType;
                // Map currValidatorName to each property of validatorMap
                for (currValidatorName in validatorMap) {
                    // Only consider explicitly defined properties
                    if (validatorMap.hasOwnProperty(currValidatorName)) {
                        // Set the validator type
                        currValidatorType = validatorMap[currValidatorName];
                        // Figure out what kind of value currValidatorType is
                        if (isNativeType(currValidatorType)) {
                            // Add the new validator to the list
                            list.push(FieldValidator.fromNativeType(currValidatorType, currValidatorName, false));
                        } else if (isFunction(currValidatorType)) {
                            // Add the new validator to the list
                            list.push(FieldValidator.fromContructor(currValidatorType, currValidatorName, false));
                        } else if (isObject(currValidatorType)) {
                            // This type is a "fully qualified type", so we need to make sure that it
                            // at least has a "type" prop
                            if (FieldValidator.isFullyQualifiedTypeObject(currValidatorType)) {
                                // Add the new validator to the list
                                list.push(FieldValidator.fromFullyQualifiedTypeObject(currValidatorType, currValidatorName));
                            } else {
                                throw new InvalidFieldValidatorType(currValidatorName);
                            }
                        } else {
                            throw new InvalidFieldValidatorType(currValidatorName);
                        }
                    }
                }
            }
            // Scream and shout if there weren't any field validators
            if (list.length < 1) {
                throw new NoFieldValidatorsDefined();
            }
        } else {
            throw new InvalidPayloadFormat();
        }
        // Return the compiled list
        return list;
    }
}