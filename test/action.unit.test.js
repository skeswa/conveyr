import Promise from 'core-js/es6/promise';
import {assert} from 'chai';

import {Action, Service} from '../../lib/index';

describe('Action(...)', () => {
    it('exists', () => {
        assert.isFunction(Action);
    });

    it('has adequate validation', () => {
        assert.throw(() => Action(), undefined, undefined, 'create should fail for undefined');
        assert.throw(() => Action(''), undefined, undefined, 'create should fail for empty strings');
        assert.doesNotThrow(() => Action('test-action-1'), 'create shouldn\'t fail for well formatted actionIds');
        assert.throw(() => Action('test-action-1'), undefined, undefined,'create should fail for duplicate actionIds');
    });

    it('returns a trigger function', () => {
        const testAction2 = Action('test-action-2');
        assert.isFunction(testAction2);
        assert.isFunction(testAction2.calls);
        assert.isFunction(testAction2.sends);
    });
});

describe('action.calls(...)', () => {
    it('exists', () => {
        const serviceTestAction0 = Action('service-test-action-0');
        assert.isFunction(serviceTestAction0.calls);
    });

    it('has validation', () => {
        const serviceTestAction1 = Action('service-test-action-1');
        const serviceTestService1 = Service('service-test-service-1').exposes('fetch', () => callback());

        assert.throw(() => serviceTestAction1.calls(), undefined, undefined, 'service() should fail for nonexistent services');
        assert.throw(() => serviceTestAction1.calls({}), undefined, undefined, 'service() should fail for nonexistent services');
        assert.doesNotThrow(() => serviceTestAction1.calls(serviceTestService1.endpoint('fetch')), undefined, undefined, 'service() should succeed for legit services');
    });

    it('takes both serviceIds and services', () => {
        const serviceTestAction2 = Action('service-test-action-2');
        const serviceTestService2 = Service('service-test-service-2');

        assert.doesNotThrow(() => serviceTestAction2.calls('service-test-service-2'), undefined, undefined, 'service() should not fail for real service ids');
        assert.doesNotThrow(() => serviceTestAction2.calls(serviceTestService2), undefined, undefined, 'service() should not fail for real services');
    });
});

describe('action.sends(...)', () => {
    it('exists', () => {
        const payloadTestAction0 = Action('payload-test-action-0');
        assert.isFunction(payloadTestAction0.sends);
    });

    it('has adequate validation', () => {
        const payloadTestAction1 = Action('payload-test-action-1');

        assert.throw(() => payloadTestAction1.sends(1), undefined, undefined, 'payload should fail for regular values');
        assert.throw(() => payloadTestAction1.sends('asd'), undefined, undefined, 'payload should fail for regular values');
        assert.throw(() => payloadTestAction1.sends(true), undefined, undefined, 'payload should fail for regular values');
        assert.throw(() => payloadTestAction1.sends({}), undefined, undefined, 'payload should fail for regular values');
        assert.throw(() => payloadTestAction1.sends([]), undefined, undefined, 'payload should fail for regular values');

        assert.doesNotThrow(() => payloadTestAction1.sends(Array), undefined, undefined, 'payload should fail for native types');
        assert.doesNotThrow(() => payloadTestAction1.sends(Object), undefined, undefined, 'payload should fail for native types');
        assert.doesNotThrow(() => payloadTestAction1.sends(Function), undefined, undefined, 'payload should fail for native types');
        assert.doesNotThrow(() => payloadTestAction1.sends(String), undefined, undefined, 'payload should fail for native types');
        assert.doesNotThrow(() => payloadTestAction1.sends(Number), undefined, undefined, 'payload should fail for native types');
        assert.doesNotThrow(() => payloadTestAction1.sends(Boolean), undefined, undefined, 'payload should fail for native types');

        assert.doesNotThrow(() => payloadTestAction1.sends({
            type: Boolean
        }), undefined, undefined, 'payload should not fail for valid field maps even if they look like fully qualified types');
        assert.throw(() => payloadTestAction1.sends({
            type: Boolean,
            default: false
        }), undefined, undefined, 'payload should fail for invalid field maps even if they look like fully qualified types');

        assert.doesNotThrow(() => payloadTestAction1.sends({
            thing1: Array,
            thing2: Object,
            thing3: Function,
            thing4: String,
            thing5: Number,
            thing6: Boolean
        }), undefined, undefined, 'payload should work for basic field maps');
        assert.doesNotThrow(() => payloadTestAction1.sends({
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
        assert.throw(() => payloadTestAction1.sends({
            thing8: { type: null, default: [1, 2] }
        }), undefined, undefined, 'payload should fail for field maps with invalid fully qualified types');
        assert.throw(() => payloadTestAction1.sends({
            thing8: { type: Array, default: 6 },
            thing9: { type: Object, default: 'cc' },
        }), undefined, undefined, 'payload should fail for field maps with invalid fully qualified types');
        assert.throw(() => payloadTestAction1.sends({
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
});

describe('action(...)', () => {
    it('fails if no service is specified', () => {
        const noServiceTestAction1 = Action('no-service-test-action-1');
        assert.throw(() => noServiceTestAction1(), undefined, undefined, 'action invocation should fail if no service is specified');
    });

    it('doesn\'t perform payload validation is none is specified', () => {
        const noPayloadTestService1 = Service('no-payload-test-service-1');
        const noPayloadTestAction1 = Action('no-payload-test-action-1').calls(noPayloadTestService1);
        noPayloadTestAction1();
        assert.doesNotThrow(() => noPayloadTestAction1(), undefined, undefined, 'action invocation should not throw if no payload is specified');
    });

    it('returns a valid promise', () => {
        const promiseTestService1 = Service('promise-test-service-1');
        const promiseTestAction1 = Action('promise-test-action-1').calls(promiseTestService1);
        assert(promiseTestAction1() instanceof Promise, 'action invocation should return a promise');
    });
});
