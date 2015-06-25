export function InvalidParameterTypeError(parameterName, correctType) {
    return new Error(
        `The type of the provided "${parameterName}" parameter is invalid. ` +
        `The "${parameterName}"" parameter must be a(n) ${correctType}.`
    );
}

export function EmptyParameterError(parameterName) {
    return new Error(
        `The provided "${parameterName}" parameter is empty. ` +
        `The "${parameterName}"" parameter must not be empty.`
    );
}

export function IllegalIdError(id) {
    return new Error(
        `The provided id "${id}" contains the ':' character. ` +
        `Ids cannot contain the ':' character.`
    );
}

export function IdAlreadyExistsError(id) {
    return new Error(
        `The provided id "${id}" has already been declared. ` +
        `All ids of the same type must be unique.`
    );
}

export function InvalidServiceRefError() {
    return new Error(
        `The provided service reference was invalid. ` +
        `Please double-check that the service reference for this action exists.`
    );
}

export function InvalidActionRefsError() {
    return new Error(
        `The provided action references were invalid. ` +
        `Please double-check that the action references for this service exist.`
    );
}

export function InvalidStoreRefsError() {
    return new Error(
        `The provided store references were invalid. ` +
        `Please double-check that the store references for this service exist.`
    );
}

export function MissingCallbackError() {
    return new Error(
        `No callback was provided as an argument to the handler. ` +
        `Callbacks are required for Service handler functions.`
    );
}

export function NotEnoughFieldsInFieldMapError() {
    return new Error(
        `The provided field map did not have at least one field.  ` +
        `Field maps should have at least one valid field-type pair.`
    );
}

export function InvalidFieldMapTypeError(fieldName) {
    return new Error(
        `Field "${fieldName}" of provided field map is of an invalid type. ` +
        `The type of a field map field must either be a native javascript type or a fully qualified type object.`
    );
}

export function InvalidFieldMapDefaultError(fieldName) {
    return new Error(
        `Field "${fieldName}" of provided field map specifies an invalid default for its declared type. ` +
        `The default value of a field must match the type of that field.`
    );
}

export function ActionPayloadValidationError(fieldName, correctType) {
    return new Error(
        `Field "${fieldName}" did not match the type specified in its payload definition. ` +
        `In order to match, this field must be of type ${correctType}.`
    );
}

export function ActionInvocationWithoutServiceError(actionId) {
    return new Error(
        `Could not invoke Action with id "${actionId}" because it is not bound to a Service. ` +
        `Actions must be bound to Services in order to function as intended.`
    );
}