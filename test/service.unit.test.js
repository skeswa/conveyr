import {assert} from 'chai';

import {Action, Service, Store} from '../../lib';
import {once, emit, subscribe} from '../../lib/eventbus';
import {isService} from '../../lib/service';
import {isStoreMutatorContext} from '../../lib/store';

describe('Service.create(...)', () => {
    it('exists', () => {
        assert.isFunction(Service.create);
    });

    it('has adequate validation', () => {
        assert.throw(() => Service.create(), undefined, undefined, 'create should fail for undefined');
        assert.throw(() => Service.create(''), undefined, undefined, 'create should fail for empty strings');
        assert.throw(() => Service.create('adasd:sa'), undefined, undefined, 'create should fail for serviceIds with colons');
        assert.doesNotThrow(() => Service.create('test-service-1'), 'create shouldn\'t fail for well formatted serviceIds');
        assert.throw(() => Service.create('test-service-1'), undefined, undefined,'create should fail for duplicate serviceIds');
    });

    it('returns a service', () => {
        const testService2 = Service.create('test-service-2');
        assert(isService(testService2), 'Service must be a registered service');
    });
});

describe('Service.actions(...)', () => {
    it('has validation', () => {
        const testServiceAction1 = Action.create('test-service-action-1');
        const testService3 = Service.create('test-service-3');

        assert.throw(() => testService3.actions('asd', 'asdasda', 'test-service-action-1'), undefined, undefined, 'actions() should fail for nonexistent actions');
    });

    it('takes both actionIds and action triggers', () => {
        const testServiceAction2 = Action.create('test-service-action-2');
        const testServiceAction3 = Action.create('test-service-action-3');
        const testService4 = Service.create('test-service-4');

        testService4.actions(testServiceAction2, 'test-service-action-3');
        assert(testService4.__actionIds.indexOf('test-service-action-2') !== -1, 'action ids array should contain action 2');
        assert(testService4.__actionIds.indexOf('test-service-action-3') !== -1, 'action ids array should contain action 3');
    });

    it('should update internal array appropriately', () => {
        const testServiceAction4 = Action.create('test-service-action-4');
        const testServiceAction5 = Action.create('test-service-action-5');
        const testServiceAction6 = Action.create('test-service-action-6');
        const testServiceAction7 = Action.create('test-service-action-7');
        const testService5 = Service.create('test-service-5');

        testService5.actions(testServiceAction4, testServiceAction5);
        assert(testService5.__actionIds.indexOf('test-service-action-4') !== -1, 'action ids array should contain action 4');
        assert(testService5.__actionIds.indexOf('test-service-action-5') !== -1, 'action ids array should contain action 5');

        testService5.actions(testServiceAction6, testServiceAction7);
        assert(testService5.__actionIds.indexOf('test-service-action-4') === -1, 'action ids array should not contain action 4');
        assert(testService5.__actionIds.indexOf('test-service-action-5') === -1, 'action ids array should not contain action 5');
        assert(testService5.__actionIds.indexOf('test-service-action-6') !== -1, 'action ids array should contain action 6');
        assert(testService5.__actionIds.indexOf('test-service-action-7') !== -1, 'action ids array should contain action 7');
    });
});

describe('Service.stores(...)', () => {
    it('has validation', () => {
        const testServiceStore1 = Store.create('test-service-store-1');
        const testService6 = Service.create('test-service-6');

        assert.throw(() => testService6.stores('9g8wuh45l', 'iugyer', 'test-service-store-1'), undefined, undefined, 'stores() should fail for nonexistent stores');
    });

    it('takes both storeIds and stores', () => {
        const testServiceStore2 = Store.create('test-service-store-2');
        const testServiceStore3 = Store.create('test-service-store-3');
        const testService7 = Service.create('test-service-7');

        testService7.stores(testServiceStore2, 'test-service-store-3');
        assert(testService7.__stores.indexOf(testServiceStore2) !== -1, 'store ids array should contain store 2');
        assert(testService7.__stores.indexOf(testServiceStore3) !== -1, 'store ids array should contain store 3');
    });

    it('registers mutators with stores', () => {
        const testServiceStore4 = Store.create('test-service-store-4');
        const testServiceStore5 = Store.create('test-service-store-5');
        const testService8 = Service.create('test-service-8').handler(done => done());

        testService8.stores(testServiceStore4, testServiceStore5);
        assert(testServiceStore4.__mutatorContexts.indexOf(testService8.__mutatorContext.mutatorContextId) !== -1, 'store 4 should have registered the services mutator');
        assert(testServiceStore5.__mutatorContexts.indexOf(testService8.__mutatorContext.mutatorContextId) !== -1, 'store 5 should have registered the services mutator');
    });

    it('should update internal array appropriately', () => {
        const testServiceStore6 = Store.create('test-service-store-6');
        const testServiceStore7 = Store.create('test-service-store-7');
        const testServiceStore8 = Store.create('test-service-store-8');
        const testServiceStore9 = Store.create('test-service-store-9');
        const testService9 = Service.create('test-service-9');

        testService9.stores(testServiceStore6, testServiceStore7);
        assert(testService9.__stores.indexOf(testServiceStore6) !== -1, 'store ids array should contain store 6');
        assert(testService9.__stores.indexOf(testServiceStore7) !== -1, 'store ids array should contain store 7');

        testService9.stores(testServiceStore8, testServiceStore9);
        assert(testService9.__stores.indexOf(testServiceStore6) === -1, 'store ids array should not contain store 6');
        assert(testService9.__stores.indexOf(testServiceStore7) === -1, 'store ids array should not contain store 7');
        assert(testService9.__stores.indexOf(testServiceStore8) !== -1, 'store ids array should contain store 8');
        assert(testService9.__stores.indexOf(testServiceStore9) !== -1, 'store ids array should contain store 9');
    });
});

describe('Service.handler(...)', () => {
    it('has validation', () => {
        const notAHandler = 5;

        assert.throw(() => Service.create('test-service-10').handler(notAHandler), undefined, undefined, 'handler() should fail for a handler that isn\'t a function');
    });

    it('set new handler internally', () => {
        const testHandler = (callback) => { callback() };
        const testService11 = Service.create('test-service-11').handler(testHandler);

        assert(testService11.__handler === testHandler, 'store should have the updated handler field');
    });
});

describe('Service handler logic', () => {
    it('receives correct arguments', (_done) => {
        const testServiceAction9 = Action.create('test-service-action-9');
        const testService13 = Service.create('test-service-13').actions(testServiceAction9).handler(function(callback, action, context, data, payload, done, finish) {
            assert.isUndefined(callback, 'The callback should be usurped by one of its duplicates');
            assert.equal(action, 'test-service-action-9', 'Second arg should be the actionId');
            assert(isStoreMutatorContext(context), 'The context parameter should be the mutator context');
            assert.isUndefined(data, 'The data arg should be usurped by one of its duplicates');
            assert.equal(payload, 'test', 'Third arg should be the payload');
            assert.isUndefined(done, 'The done should be usurped by one of its duplicates');
            assert.isFunction(finish, 'Last arg should be the callback');
            finish();
            _done();
        });

        testServiceAction9('test');
    });

    it('reacts to action events', (finished) => {
        const testServiceAction8 = Action.create('test-service-action-8');
        const testService12 = Service.create('test-service-12').actions(testServiceAction8).handler((done) => {
            setTimeout(() => done(), 250);
        });
        subscribe(['test-service-action-8', 'completed'], () => finished());
        testServiceAction8();
    });
});
