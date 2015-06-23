require('babel/polyfill');

import {assert} from 'chai';

import {Action} from '../../lib/index';
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
