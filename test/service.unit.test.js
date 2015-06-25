import {assert} from 'chai';

import {Action, Service, Store} from '../../lib';
import {isService} from '../../lib/service';
import {isStoreMutatorContext} from '../../lib/store';

describe('Service(...)', () => {
    it('exists', () => {
        assert.isFunction(Service);
    });

    it('has adequate validation', () => {
        assert.throw(() => Service(), undefined, undefined, 'create should fail for undefined');
        assert.throw(() => Service(''), undefined, undefined, 'create should fail for empty strings');
        assert.doesNotThrow(() => Service('test-service-1'), 'create shouldn\'t fail for well formatted serviceIds');
        assert.throw(() => Service('test-service-1'), undefined, undefined,'create should fail for duplicate serviceIds');
    });

    it('returns a service', () => {
        const testService2 = Service('test-service-2');
        assert(isService(testService2), 'Service must be a registered service');
    });
});

describe('Service.updates(...)', () => {
    it('has validation', () => {
        const testServiceStore1 = Store('test-service-store-1');
        const testService6 = Service('test-service-6');

        assert.throw(() => testService6.updates('9g8wuh45l', 'iugyer', 'test-service-store-1'), undefined, undefined, 'stores() should fail for nonexistent stores');
    });

    it('takes both storeIds and stores', () => {
        const testServiceStore2 = Store('test-service-store-2');
        const testServiceStore3 = Store('test-service-store-3');
        const testService7 = Service('test-service-7');

        testService7.updates(testServiceStore2, 'test-service-store-3');
        assert(testService7.__stores.indexOf(testServiceStore2) !== -1, 'store ids array should contain store 2');
        assert(testService7.__stores.indexOf(testServiceStore3) !== -1, 'store ids array should contain store 3');
    });

    it('registers mutators with stores', () => {
        const testServiceStore4 = Store('test-service-store-4');
        const testServiceStore5 = Store('test-service-store-5');
        const testService8 = Service('test-service-8').invokes(done => done());

        testService8.updates(testServiceStore4, testServiceStore5);
        assert(testServiceStore4.__mutatorContexts.indexOf(testService8.__mutatorContext.mutatorContextId) !== -1, 'store 4 should have registered the services mutator');
        assert(testServiceStore5.__mutatorContexts.indexOf(testService8.__mutatorContext.mutatorContextId) !== -1, 'store 5 should have registered the services mutator');
    });

    it('should update internal array appropriately', () => {
        const testServiceStore6 = Store('test-service-store-6');
        const testServiceStore7 = Store('test-service-store-7');
        const testServiceStore8 = Store('test-service-store-8');
        const testServiceStore9 = Store('test-service-store-9');
        const testService9 = Service('test-service-9');

        testService9.updates(testServiceStore6, testServiceStore7);
        assert(testService9.__stores.indexOf(testServiceStore6) !== -1, 'store ids array should contain store 6');
        assert(testService9.__stores.indexOf(testServiceStore7) !== -1, 'store ids array should contain store 7');

        testService9.updates(testServiceStore8, testServiceStore9);
        assert(testService9.__stores.indexOf(testServiceStore6) === -1, 'store ids array should not contain store 6');
        assert(testService9.__stores.indexOf(testServiceStore7) === -1, 'store ids array should not contain store 7');
        assert(testService9.__stores.indexOf(testServiceStore8) !== -1, 'store ids array should contain store 8');
        assert(testService9.__stores.indexOf(testServiceStore9) !== -1, 'store ids array should contain store 9');
    });
});

describe('Service.invokes(...)', () => {
    it('has validation', () => {
        const notAHandler = 5;

        assert.throw(() => Service('test-service-10').invokes(notAHandler), undefined, undefined, 'handler() should fail for a handler that isn\'t a function');
    });

    it('set new handler internally', () => {
        const testHandler = (callback) => { callback() };
        const testService11 = Service('test-service-11').invokes(testHandler);

        assert(testService11.__handler === testHandler, 'store should have the updated handler field');
    });
});

describe('Service handler logic', () => {
    it('receives correct arguments', (finishTest) => {
        let testServiceAction9;
        const testService13 = Service('test-service-13')
            .invokes(function(callback, actionId, action, context, data, payload, done, finish) {
                assert.isUndefined(callback, 'The callback should be usurped by one of its duplicates');
                assert.equal(actionId, 'test-service-action-9', 'Second arg should be the actionId');
                assert.equal(action, testServiceAction9, 'Third arg should be the action');
                assert(isStoreMutatorContext(context), 'The context parameter should be the mutator context');
                assert.isUndefined(data, 'The data arg should be usurped by one of its duplicates');
                assert.equal(payload, 'test', 'payload should be the payload');
                assert.isUndefined(done, 'The done should be usurped by one of its duplicates');
                assert.isFunction(finish, 'Last arg should be the callback');

                finish();
                finishTest();
            });
        testServiceAction9 = Action('test-service-action-9').calls(testService13);

        testServiceAction9('test');
    });
});
