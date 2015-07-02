export const isArray = (x) => {
    if (!x) {
        return false;
    } else {
        return (x.constructor === Array);
    }
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

export const isNativeType = (x) => {
    return (
        x === Array     ||
        x === Object    ||
        x === Function  ||
        x === String    ||
        x === Number    ||
        x === Boolean
    );
};

export const isNumber = (x) => {
    return !isNaN(parseFloat(x)) && isFinite(x);
};

export const isBoolean = (x) => {
    return x === true || x === false;
};

export const isObject = x => (x !== null && typeof x === 'object');

export const emptyValueOfType = (x) => {
    switch(x) {
    case Array:
        return [];
    case Object:
        return {};
    case Function:
        return (() => {});
    case String:
        return '';
    case Number:
        return 0;
    case Boolean:
        return false;
    default:
        throw new Error(`Empty value of type "${x}" could not be resolved`);
    }
};

export const nameOfType = (x) => {
    switch(x) {
    case Array:
        return 'Array';
    case Object:
        return 'Object';
    case Function:
        return 'Function';
    case String:
        return 'String';
    case Number:
        return 'Number';
    case Boolean:
        return 'Boolean';
    default:
        throw new Error(`Name of type "${x}" could not be resolved`);
    }
};

export const isOfType = (x, type) => {
    // Otherwise, use a strict checker
    let checker;
    switch(type) {
    case Array:
        checker = isArray;
        break;
    case Object:
        checker = isObject;
        break;
    case Function:
        checker = isFunction;
        break;
    case String:
        checker = isString;
        break;
    case Number:
        checker = isNumber;
        break;
    case Boolean:
        checker = isBoolean;
        break;
    default:
        if (isFunction(type)) {
            checker = value => value instanceof type;
            break;
        } else {
            throw new Error(`Type "${type}" could not be resolved`);
        }
    }
    return checker(x);
};