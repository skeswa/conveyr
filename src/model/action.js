export default class Action {
    constructor(id, callTargets, payloadFormat) {
        this.__private = {
            id:             id,
            callTargets:    callTargets,
            payloadFormat:  payloadFormat
        };
    }
}