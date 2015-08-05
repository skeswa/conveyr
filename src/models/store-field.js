/********************************** IMPORTS **********************************/

import Symbol from 'core-js/es6/symbol';

import {isFunction} from '../type';

/***************************** ERROR DEFINITIONS *****************************/

class InvalidMutatorContext extends Error {
    constructor(storeId) {
        super();
        this.name = 'InvalidMutatorContext';
        this.message = (
            `The provided Store Mutator Context has not been permitted to mutate the ` +
            `the Store with id "${storeId}".`
        );
    }
}

class InvalidMutatorFunction extends Error {
    constructor(storeId) {
        super();
        this.name = 'InvalidMutatorFunction';
        this.message = (
            `The provided Store Mutator Function was not a valid function. ` +
            `Store Mutator Functions are functions that take the current Store Field value ` +
            `and return an updated value.`
        );
    }
}

/***************************** HELPER FUNCTIONS ******************************/

function notifySubscribers(newValue) {
    const field = this;
}

/***************************** CLASS DEFINITIONS *****************************/

const SubscriberType = {
    LISTENER:               1,
    FORCE_UPDATE_TARGET:    2,
    SET_STATE_TARGET:       3
};

// ActionPayloadFormat symbols
const SYM_VALUE = Symbol('value');
const SYM_NOTIFIER = Symbol('notifier');
const SYM_STORE_ID = Symbol('storeId');
const SYM_FIELD_ID = Symbol('fieldId');
const SYM_REVISION = Symbol('revision');
const SYM_SUBSCRIBERS = Symbol('subscribers');
const SYM_FIELD_VALIDATORS = Symbol('fieldValidators');
const SYM_MUTATOR_VALIDATOR = Symbol('mutatorValidator');

/**
 * TODO (Sandile): documentation
 */
class StoreField {
    constructor(storeId, fieldId, defaultValue, mutatorValidator) {
        this[SYM_VALUE] = defaultValue;
        this[SYM_STORE_ID] = storeId;
        this[SYM_FIELD_ID] = fieldId;
        this[SYM_REVISION] = 0;
        this[SYM_SUBSCRIBERS] = {};
        this[SYM_FIELD_VALIDATORS] = PayloadFieldValidator.toList(format);
        this[SYM_MUTATOR_VALIDATOR] = mutatorValidator;
        this[SYM_NOTIFIER] = notifySubscribers.bind(this);
    }

    /**
     * TODO (Sandile): documentation
     *
     * @param  {[type]} mutatorContext  [description]
     * @param  {[type]} mutatorFunction [description]
     * @return {[type]}          [description]
     */
    update(mutatorContext, mutatorFunction) {
        const hasPermission = this[SYM_MUTATOR_VALIDATOR];
        if (hasPermission(mutatorContext)) {
            if (isFunction(mutatorFunction)) {
                // Get the new value from the mutator function
                const newValue = mutatorFunction(this[SYM_VALUE]);
                this[SYM_VALUE] = newValue;
                // Update the revision after the value changes
                this[SYM_REVISION]++;
                // Notify the subscribes
                const notifier = this[SYM_NOTIFIER];
                notifier(newValue);
            } else {
                throw new InvalidMutatorFunction();
            }
        } else {
            throw new InvalidMutatorContext(this[SYM_STORE_ID]);
        }
    }

    /**
     * TODO (Sandile): documentation
     *
     * @return {[type]} [description]
     */
    revision() {
        return this[SYM_REVISION];
    }

    /**
     * TODO (Sandile): documentation
     *
     * @param  {[type]} target [description]
     * @return {[type]}            [description]
     */
    notifies(target) {
        let newSubscriber;
        if (isFunction(target)) {

        } else if (target && isFunction(target.forceUpdate)) {

        } else {
            // WASHERE
        }

        let currSubscriber;
        for (let i = 0; i < this[SYM_SUBSCRIBERS].length; i++) {
            currSubscriber = this[SYM_SUBSCRIBERS][i];
            if (subscriber.target === target) {
                this[SYM_SUBSCRIBERS][i] = newSubscriber;
                return;
            }
        }
        // The subscriber for this target did not exist yet
        this[SYM_SUBSCRIBERS].push(newSubscriber);
    }

    /**
     * TODO (Sandile): documentation
     *
     * @param  {[type]} subscriber [description]
     * @return {[type]}            [description]
     */
    binds(subscriber) {

    }
}

/********************************** EXPORTS **********************************/

export default ActionPayloadFormat;