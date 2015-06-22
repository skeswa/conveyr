'use strict';

import {EventEmitter2} from 'eventemitter2';

const MAX_LISTENERS = 0;
export const LISTENER_NAMESPACE_SEPARATOR = ':';

const emitter = new EventEmitter2({
    wildcard:       false,
    delimiter:      LISTENER_NAMESPACE_SEPARATOR,
    newListener:    false,
    maxListeners:   MAX_LISTENERS
});

export function once(topic, listener) {
    emitter.once(topic, listener);
};

export function subscribe(topic, listener) {
    emitter.addListener(topic, listener);
};

export function unsubscribe(topic, listener) {
    emitter.removeListener(topic, listener);
};

export function emit(topic, payload) {
    emitter.emit(topic, payload);
};