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