import {assert} from 'chai';

import {Action, Service} from '../../lib/index';
import {once, emit} from '../../lib/eventbus';

describe('Action.create(...)', () => {
    it('exists', () => {
        assert.isFunction(Action.create);
    });

    it('has adequate validation', () => {
        assert.throw(() => Action.create(), undefined, undefined, 'create should fail for undefined');
        assert.throw(() => Action.create(''), undefined, undefined, 'create should fail for empty strings');
        assert.throw(() => Action.create('adasd:sa'), undefined, undefined, 'create should fail for actionIds with colons');
        assert.doesNotThrow(() => Action.create('test-action-1'), 'create shouldn\'t fail for well formatted actionIds');
        assert.throw(() => Action.create('test-action-1'), undefined, undefined,'create should fail for duplicate actionIds');
    });

    it('returns a trigger function', () => {
        const testAction2 = Action.create('test-action-2');
        assert.isFunction(testAction2);
        assert.isFunction(testAction2.service);
        assert.isFunction(testAction2.payload);
    });
});

describe('Action.service(...)', () => {
    it('exists', () => {
        const serviceTestAction0 = Action.create('service-test-action-0');
        assert.isFunction(serviceTestAction0.service);
    });

    it('has validation', () => {
        const serviceTestAction1 = Action.create('service-test-action-1');
        const serviceTestService1 = Service.create('service-test-service-1');

        assert.throw(() => serviceTestAction1.service('asd'), undefined, undefined, 'service() should fail for nonexistent services');
        assert.throw(() => serviceTestAction1.service({}), undefined, undefined, 'service() should fail for nonexistent services');
        assert.doesNotThrow(() => serviceTestAction1.service(serviceTestService1), undefined, undefined, 'service() should succeed for legit services');
    });

    it('takes both serviceIds and services', () => {
        const serviceTestAction2 = Action.create('service-test-action-2');
        const serviceTestService2 = Service.create('service-test-service-2');

        assert.doesNotThrow(() => serviceTestAction2.service('service-test-service-2'), undefined, undefined, 'service() should not fail for real service ids');
        assert.doesNotThrow(() => serviceTestAction2.service(serviceTestService2), undefined, undefined, 'service() should not fail for real services');
    });
});

describe('Action.payload(...)', () => {
    it('exists', () => {
        const payloadTestAction0 = Action.create('payload-test-action-0');
        assert.isFunction(payloadTestAction0.payload);
    });

    it('has adequate validation', () => {
        const payloadTestAction1 = Action.create('payload-test-action-1');

        assert.throw(() => payloadTestAction1.payload(1), undefined, undefined, 'payload should fail for regular values');
        assert.throw(() => payloadTestAction1.payload('asd'), undefined, undefined, 'payload should fail for regular values');
        assert.throw(() => payloadTestAction1.payload(true), undefined, undefined, 'payload should fail for regular values');
        assert.throw(() => payloadTestAction1.payload({}), undefined, undefined, 'payload should fail for regular values');
        assert.throw(() => payloadTestAction1.payload([]), undefined, undefined, 'payload should fail for regular values');

        assert.doesNotThrow(() => payloadTestAction1.payload(Array), undefined, undefined, 'payload should fail for native types');
        assert.doesNotThrow(() => payloadTestAction1.payload(Object), undefined, undefined, 'payload should fail for native types');
        assert.doesNotThrow(() => payloadTestAction1.payload(Function), undefined, undefined, 'payload should fail for native types');
        assert.doesNotThrow(() => payloadTestAction1.payload(String), undefined, undefined, 'payload should fail for native types');
        assert.doesNotThrow(() => payloadTestAction1.payload(Number), undefined, undefined, 'payload should fail for native types');
        assert.doesNotThrow(() => payloadTestAction1.payload(Boolean), undefined, undefined, 'payload should fail for native types');

        assert.doesNotThrow(() => payloadTestAction1.payload({
            type: Boolean
        }), undefined, undefined, 'payload should not fail for valid field maps even if they look like fully qualified types');
        assert.throw(() => payloadTestAction1.payload({
            type: Boolean,
            default: false
        }), undefined, undefined, 'payload should fail for invalid field maps even if they look like fully qualified types');

        assert.doesNotThrow(() => payloadTestAction1.payload({
            thing1: Array,
            thing2: Object,
            thing3: Function,
            thing4: String,
            thing5: Number,
            thing6: Boolean
        }), undefined, undefined, 'payload should work for basic field maps');
        assert.doesNotThrow(() => payloadTestAction1.payload({
            thing1: Array,
            thing2: Object,
            thing3: Function,
            thing4: String,
            thing5: Number,
            thing6: Boolean,
            thing7: { type: Array },
            thing8: { type: Array, default: [1, 2] },
            thing9: { type: Object },
            thing10: { type: Object, default: { woops: 'woops' } },
            thing11: { type: Function },
            thing12: { type: Function, default: x => !!x },
            thing13: { type: String },
            thing14: { type: String, default: 'als;dj' },
            thing15: { type: Number },
            thing16: { type: Number, default: 0 },
            thing17: { type: Boolean },
            thing18: { type: Boolean, default: true }
        }), undefined, undefined, 'payload should work for field maps with valid fully qualified types');
        assert.throw(() => payloadTestAction1.payload({
            thing8: { type: null, default: [1, 2] }
        }), undefined, undefined, 'payload should fail for field maps with invalid fully qualified types');
        assert.throw(() => payloadTestAction1.payload({
            thing8: { type: Array, default: 6 },
            thing9: { type: Object, default: 'cc' },
        }), undefined, undefined, 'payload should fail for field maps with invalid fully qualified types');
        assert.throw(() => payloadTestAction1.payload({
            thing1: Array,
            thing2: 0,
            thing3: Function,
            thing4: String,
            thing5: null,
            thing6: undefined,
            thing7: { type: Array },
            thing8: { type: Array, default: [1, 2] },
            thing9: { type: Object },
            thing10: { type: Object, default: { woops: 'woops' } },
            thing11: { type: Function },
            thing12: { type: Function, default: x => !!x },
            thing13: { type: String },
            thing14: { type: String, default: 'als;dj' },
            thing15: { type: Number },
            thing16: { type: Number, default: 0 },
            thing17: { type: Boolean },
            thing18: { type: Boolean, default: 0 }
        }), undefined, undefined, 'payload should fail for field maps with invalid basic types');
    });

    it('evaluates to the correct field map', () => {
        // TODO (Sandile): do this man
    });
});

describe('action(...)', () => {
    it('creates emitter event', (done) => {
        const testAction3 = Action.create('test-action-3');
        // Subscribe to `test-action-3`
        once('test-action-3', function(payload) {
            const {actionId, instanceId, data} = payload;
            assert.equal(actionId, 'test-action-3', 'The payload should carry the action id');
            assert.isNumber(instanceId, 'The payload should carry the instance id');
            assert.equal(data, 1, 'The payload should equal the first parameter to the trigger');
            done();
        });
        // Invoke the action
        testAction3(1, 2);
    });

    it('returns a valid promise', (done) => {
        const testAction4 = Action.create('test-action-4');
        const testAction5 = Action.create('test-action-5');
        // Subscribe to `test-action-4`
        once('test-action-4', (payload) => {
            emit(['test-action-4', 'completed'], {
                instanceId: payload.instanceId,
                error: null,
                wasSuccessful: true
            });
        });
        // Subscribe to `test-action-5`
        once('test-action-5', (payload) => {
            emit(['test-action-5', 'completed'], {
                instanceId: payload.instanceId,
                error: 'This is a problem',
                wasSuccessful: false
            });
        });
        // Create test state
        let callbackCount = 0;
        // Invoke the actions
        testAction4()
            .then((arg) => {
                assert.isUndefined(arg, 'The success case of the promise should always have no arguments');
                if (++callbackCount >= 2) {
                    done();
                }
            })
            .catch(() => {
                assert.fail(null, null, 'This should never fail');
            });
        testAction5()
            .then(() => {
                assert.fail(null, null, 'This should never succeed');
            })
            .catch((err) => {
                assert.equal(err, 'This is a problem', 'The error should be pushed through as-is');
                if (++callbackCount >= 2) {
                    done();
                }
            });
    });
});
