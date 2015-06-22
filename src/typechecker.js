export const isArray = (x) => {
    if (!x) return false;
    else return (x.constructor === Array);
};

export const isFunction = (x) => {
    if (!x) return false;
    else return (typeof x === 'function');
};

export const isString = (x) => {
    return ((typeof x == 'string') || (x instanceof String));
};

export const isEmpty = (x) => {
    return (!x || 0 === x.length);
};