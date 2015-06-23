// Include the babel polyfill
require('babel/polyfill');

import {createAction}   from './action';
import {createService}  from './service';
import {createStore}    from './store';

export const Action = {
    create: createAction
};

export const Service = {
    create: createService
};

export const Store = {
    create: createStore
};