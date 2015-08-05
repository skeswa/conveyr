export class InvalidId extends Error {
    constructor() {
        super();
        this.name = 'InvalidId';
        this.message = (
            `Ids for all Conveyr entities must be non-empty Strings.`
        );
    }
}

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

export function InvalidServiceEndpointRefError() {
    return new Error(
        `The provided service endpoint reference was invalid. ` +
        `Please double-check that the service endpoint reference for this action exists.`
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

export function InvalidFieldTypeError(fieldName) {
    return new Error(
        `Field "${fieldName}" is of an invalid type. ` +
        `The type of a field must either be a native javascript type or a fully qualified type object. ` +
        `Fully qualified field types require a valid type property.`
    );
}

export function InvalidFieldMapDefaultError(fieldName) {
    return new Error(
        `Field "${fieldName}" of provided field map specifies an invalid default for its declared type. ` +
        `The default value of a field must match the type of that field.`
    );
}

export function InvalidFieldDefaultError(fieldName) {
    return new Error(
        `Field "${fieldName}" specifies an invalid default value for its field type.`
    );
}

export function ActionPayloadValidationError(fieldName, correctType) {
    return new Error(
        `Field "${fieldName}" did not match the type specified in its payload definition. ` +
        `In order to match, this field must be of type ${correctType}.`
    );
}

export function ActionInvocationWithoutServiceEndpointError(actionId) {
    return new Error(
        `Could not invoke Action with id "${actionId}" because it is not bound to a Service Endpoint. ` +
        `Actions must be bound to Service Endpoints in order to function.`
    );
}

export function StoreWriteAccessDeniedError(storeId, fieldName) {
    return new Error(
        `Could not update the "${fieldName}" field of Store with id "${storeId}" due to a lack of permission. ` +
        `Only Services that specify the Store with id "${storeId}" in the "updates()" function can use the "update()" function` +
        `on one of its fields. Also, make sure you are passing in the context variable as the *first* argument of the update function.`
    );
}

export function InvalidMutatorResultError(storeId, fieldName, correctType, incorrectValue) {
    return new Error(
        `The resulting value of the provided mutator function incorrect. ` +
        `The "${fieldName}" field of Store with id "${storeId}" is of type "${type}". ` +
        `The resulting value of the mutator function was ${incorrectValue}.`
    );
}

export function InvalidStoreFieldSubscriberError() {
    return new Error(
        `Valid Store Field subscribers must have an isMounted(), setState() and forceUpdate() function.`
    );
}

export function NoSuchFieldError(fieldName, storeId) {
    return new Error(
        `"${fieldName}" is not the name any Field belonging to the Store with the id "${storeId}".`
    );
}

export function NoSuchServiceEndpointError(endpointId, serviceId) {
    return new Error(
        `"${endpointId}" is not the id any Endpoint belonging to the Service with the id "${serviceId}".`
    );
}