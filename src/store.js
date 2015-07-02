/****************************** MODULE IMPORTS *******************************/

import Map from 'core-js/es6/map';

import {
    isString,
    isEmpty,
    isFunction,
    isType,
    isOfType,
    nameOfType,
    emptyValueOfType,
    isObject
} from './type';
import {
    InvalidParameterTypeError,
    EmptyParameterError,
    IdAlreadyExistsError,
    StoreWriteAccessDeniedError,
    InvalidMutatorResultError,
    InvalidStoreFieldSubscriberError,
    NoSuchFieldError
} from './errors';

/***************************** MODULE CONSTANTS ******************************/

const RANDOM_CHARACTERS         = ['a', 'b', 'c', 'd', 'e', 'h', 'i', 'j', 'k', 'x', 'y', 'z'];
const MUTATOR_CONTEXT_ID_LENGTH = 8;

/******************************* MODULE STATE ********************************/

const   storeMap                = new Map();
let     nextMutatorContextId    = 1000;

/***************************** TYPE DECLARATIONS *****************************/

class StoreMutatorContext {
    constructor() {
        const randomSequence = [(nextMutatorContextId++).toString()];
        let i, r;
        for (i = 0; i < MUTATOR_CONTEXT_ID_LENGTH; i++) {
            r = Math.floor(Math.random() * 1111) % RANDOM_CHARACTERS.length;
            randomSequence.push(RANDOM_CHARACTERS[r]);
        }
        this.mutatorContextId = randomSequence.join('');
    }
}

class StoreField {
    constructor(store, fieldName, nativeType, defaultValue) {
        this.__store            = store;
        this.__name             = fieldName;
        this.__nativeType       = nativeType;
        this.__value            = defaultValue;
        this.__revisionCount    = 0;
        this.__subscriptions    = [];
        // Bind the all private class methods
        this.__notifySubscribers = this.__notifySubscribers.bind(this);
        // Bind the all public class methods
        this.value = this.value.bind(this);
        this.revision = this.revision.bind(this);
        this.update = this.update.bind(this);
        this.notifies = this.notifies.bind(this);
    }

    /**************************** PRIVATE METHODS ****************************/

    __notifySubscribers() {
        let currSubscription;
        for (let i = 0; i < this.__subscriptions.length; i++) {
            currSubscription = this.__subscriptions[i];
            // Only force an update if the subscriber is mounted
            if (currSubscription.subscriber.isMounted()) {
                if (currSubscription.stateVariableName !== undefined) {
                    currSubscription.subscriber.setState({
                        [currSubscription.stateVariableName]: this.__value
                    });
                } else {
                    currSubscription.subscriber.forceUpdate();
                }
            }
        }
    }

    __findSubscriptionBySubscriber(subscriber) {
        for (let i = 0; i < this.__subscriptions.length; i++) {
            if (this.__subscriptions[i].subscriber === subscriber) return this.__subscriptions[i];
        }
        return null;
    }

    /**************************** PUBLIC METHODS *****************************/

    value() {
        return this.__value;
    }

    revision() {
        return this.__revisionCount;
    }

    update(mutatorContext, mutatorFunction) {
        // Exit immediately if the context hasn't been cleared
        if (!this.__store.__isValidMutator(mutatorContext)) {
            throw StoreWriteAccessDeniedError(this.__store.__storeId, this.__name);
        }
        // Make sure the mutator function is legit
        if (!isFunction(mutatorFunction)) {
            throw InvalidParameterTypeError('mutator', 'Function');
        }
        // Apply the mutator to the current value
        const newValue = mutatorFunction(this.__value);
        // Perform validation on the new value
        if (this.__nativeType !== undefined &&
            this.__nativeType !== null &&
            !isOfType(newValue, this.__nativeType)) {
            throw InvalidMutatorResultError(
                this.__store.__storeId,
                this.__name,
                nameOfType(this.__nativeType),
                newValue
            );
        } else {
            // It would appear that an update would be safe right here
            this.__value = newValue;
            this.__revisionCount++;
            this.__notifySubscribers();
        }
    }

    notifies(subscriber) {
        if (!subscriber || !isFunction(subscriber.isMounted) || !isFunction(subscriber.forceUpdate)) {
            throw InvalidStoreFieldSubscriberError();
        } else if (!this.__findSubscriptionBySubscriber(subscriber)) {
            this.__subscriptions.push({
                subscriber: subscriber,
                stateVariableName: undefined
            });
        }
    }

    binds(subscriber, stateVariableName) {
        if (!isString(stateVariableName) || isEmpty(stateVariableName)) {
            throw InvalidParameterTypeError('stateVariableName', 'String');
        } else if (!subscriber || !isFunction(subscriber.isMounted) || !isFunction(subscriber.setState)) {
            throw InvalidStoreFieldSubscriberError();
        } else {
            let subscription = this.__findSubscriptionBySubscriber(subscriber);
            if (subscription === null) {
                this.__subscriptions.push({
                    subscriber: subscriber,
                    stateVariableName: stateVariableName
                });
            } else {
                subscription.stateVariableName = stateVariableName;
            }
        }
    }
}

class StoreFieldList {
    constructor(fields) {
        this.__fields = fields;
    }

    notify(subscriber) {
        let currField;
        // Call notifies() on each field
        for (let i = 0; i < this.__fields.length; i++) {
            currField = this.__fields[i];
            currField.notifies(subscriber);
        }
    }
}

class Store {
    constructor(storeId) {
        this.__storeId = storeId;
        this.__fieldMap = new Map();
        this.__mutatorContexts = [];
        // Bind the all private class methods
        this.__registerMutatorContext   = this.__registerMutatorContext.bind(this);
        this.__unregisterMutatorContext = this.__unregisterMutatorContext.bind(this);
        this.__isValidMutator           = this.__isValidMutator.bind(this);
        // Bind the all public class methods
        this.defines = this.defines.bind(this);
    }

    /**************************** PRIVATE METHODS ****************************/

    __registerMutatorContext(mutatorContext) {
        if (this.__mutatorContexts.indexOf(mutatorContext.mutatorContextId) === -1) {
            this.__mutatorContexts.push(mutatorContext.mutatorContextId);
        }
    }

    __unregisterMutatorContext(mutatorContext) {
        this.__mutatorContexts = this.__mutatorContexts.filter(context => (context.mutatorContextId !== mutatorContext.mutatorContextId));
    }

    __isValidMutator(mutatorContext) {
        if (!(mutatorContext instanceof StoreMutatorContext)) return false;
        return this.__mutatorContexts.indexOf(mutatorContext.mutatorContextId) !== -1;
    }

    /**************************** PUBLIC METHODS *****************************/

    defines(fieldName, fieldType) {
        let nativeType, defaultValue;
        // Basic empty checks
        if (!isString(fieldName)) throw InvalidParameterTypeError('name', 'String');
        if (isEmpty(fieldName)) throw EmptyParameterError('name');
        // Exit immediately if this field has already been defined
        if (this.__fieldMap.has(fieldName)) {
            throw IdAlreadyExistsError(fieldName);
        }
        // Type inspection goes here
        if (fieldType === undefined || fieldType === null) {
            nativeType = undefined;
            defaultValue = undefined;
        } else if (isType(fieldType)) {
            nativeType = fieldType;
            defaultValue = emptyValueOfType(fieldType);
        } else if (isObject(fieldType) && fieldType.hasOwnProperty('type')) {
            // Make sure we have legit type
            if (!isType(fieldType.type)) throw InvalidFieldTypeError(fieldName);
            nativeType = fieldType.type;
            // Make sure we have a valid default
            if (fieldType.hasOwnProperty('default')) {
                if (isOfType(fieldType.default, nativeType)) {
                    defaultValue = fieldType.default;
                } else {
                    throw InvalidFieldDefaultError(fieldName);
                }
            } else {
                defaultValue = emptyValueOfType(nativeType);
            }
        } else {
            throw InvalidParameterTypeError('type', 'Native Javascript Type or Fully Qualified Type');
        }
        // Create the Store Field
        const newField = new StoreField(this, fieldName, nativeType, defaultValue);
        this.__fieldMap.set(fieldName, newField);
        // Return self for chainability
        return this;
    }

    fields(...fieldIds) {
        const fields = fieldIds.map((fieldId) => {
            if (!this.__fieldMap.has(fieldId)) {
                throw NoSuchFieldError(fieldId, this.__storeId);
            } else {
                return this.__fieldMap.get(fieldId);
            }
        });
        // Create a new field list and return that
        return new StoreFieldList(fields);
    }

    field(fieldName) {
        if (!this.__fieldMap.has(fieldName)) {
            throw NoSuchFieldError(fieldName, this.__storeId);
        } else {
            return this.__fieldMap.get(fieldName);
        }
    }
}

/****************************** MODULE EXPORTS *******************************/

export function createStore(storeId) {
    // Validation
    if (!isString(storeId)) throw InvalidParameterTypeError('storeId', 'String');
    if (isEmpty(storeId)) throw EmptyParameterError('storeId');
    if (storeMap.has(storeId)) throw IdAlreadyExistsError(storeId);
    // Create the new store
    const store = new Store(storeId);
    // Register the store
    storeMap.set(storeId, store);
    // Return the new Store
    return store;
}

export function getStore(storeId) {
    return storeMap.get(storeId);
}

export function isStoreId(storeId) {
    return storeMap.has(storeId);
}

export function isStore(store) {
    return store instanceof Store;
}

export function isStoreMutatorContext(context) {
    return context instanceof StoreMutatorContext;
}

export function generateMutatorContext() {
    return new StoreMutatorContext();
}
