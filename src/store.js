'use strict';

/****************************** MODULE IMPORTS *******************************/

import Map from 'core-js/es6/map';

import {emit, LISTENER_NAMESPACE_SEPARATOR} from './eventbus';
import {isString, isEmpty} from './typechecker';
import {
    InvalidParameterTypeError,
    EmptyParameterError,
    IllegalIdError,
    IdAlreadyExistsError
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

class Store {
    constructor(storeId) {
        this.__storeId = storeId;
        this.__mutatorContexts = [];
    }

    registerMutatorContext(mutatorContext) {
        if (this.__mutatorContexts.indexOf(mutatorContext.mutatorContextId) === -1) {
            this.__mutatorContexts.push(mutatorContext.mutatorContextId);
        }
    }

    unregisterMutatorContext(mutatorContext) {
        this.__mutatorContexts = this.__mutatorContexts.filter(context => (context.mutatorContextId !== mutatorContext.mutatorContextId));
    }
}

/****************************** MODULE EXPORTS *******************************/

export function createStore(storeId) {
    // Validation
    if (!isString(storeId)) throw InvalidParameterTypeError('storeId', 'String');
    if (isEmpty(storeId)) throw EmptyParameterError('storeId');
    if (storeId.indexOf(LISTENER_NAMESPACE_SEPARATOR) !== -1) throw IllegalIdError('storeId');
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
