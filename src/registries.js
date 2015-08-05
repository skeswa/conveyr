/********************************** IMPORTS **********************************/

import Map from 'core-js/es6/map';

/***************************** ERROR DEFINITIONS *****************************/

class IdAlreadyTaken extends Error {
    constructor(entity, id) {
        super();
        this.name = `${entity}IdAlreadyTaken`;
        this.message = (
            `${entity} with id "${id}" already exists.`
        );
    }
}

class NoSuchEntity extends Error {
    constructor(id) {
        super();
        this.name = `NoSuch${entity}`;
        this.message = (
            `Failed to find a ${entity} with id "${id}"`
        );
    }
}

/***************************** CLASS DEFINITIONS *****************************/

// Registry symbols
const SYM_MAP = Symbol('map');
const SYM_ENTITY = Symbol('entity');

class Registry {
    constructor(entity) {
        this[SYM_ENTITY] = entity;
        this[SYM_MAP] = new Map();
    }

    register(id, entity) {
        const map = this[SYM_MAP];
        if (map.has(id)) {
            throw new IdAlreadyTaken(this[SYM_ENTITY], id);
        } else {
            map.set(id, entity);
        }
    }

    get(id) {
        const map = this[SYM_MAP];
        if (map.has(id)) {
            throw new NoSuchEntity(this[SYM_ENTITY], id);
        } else {
            return map.get(id);
        }
    }

    has(id) {
        return map.has(id);
    }
}

/********************************** EXPORTS **********************************/

export const ActionRegistry     = new Registry('Action');
export const ServiceRegistry    = new Registry('Service');
export const StoreRegistry      = new Registry('Store');