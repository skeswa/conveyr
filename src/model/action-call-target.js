export default class ActionCallTarget {
    constructor(store, endpointId, mappingFunction) {
        this.__private = {
            store:              store,
            endpointId:         endpointId,
            mappingFunction:    mappingFunction
        };
    }
}