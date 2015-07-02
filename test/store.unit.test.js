import {assert} from 'chai';

import {Store} from '../../lib';
import {isStore, generateMutatorContext} from '../../lib/store';
import {isStoreMutatorContext} from '../../lib/store';

describe('Store(...)', () => {
    it('exists', () => {
        assert.isFunction(Store);
    });

    it('has adequate validation', () => {
        assert.throw(() => Store(), undefined, undefined, 'create should fail for undefined');
        assert.throw(() => Store(''), undefined, undefined, 'create should fail for empty strings');
        assert.doesNotThrow(() => Store('unit-test-store-1'), 'create shouldn\'t fail for well formatted storeIds');
        assert.throw(() => Store('unit-test-store-1'), undefined, undefined,'create should fail for duplicate storeIds');
    });

    it('returns a store', () => {
        const testStore2 = Store('unit-test-store-2');
        assert(isStore(testStore2), 'Store must be a registered store');
    });
});

describe('Store.defines(...)', () => {
    it('has validation', () => {
        const testStore3 = Store('unit-test-store-3');

        assert.throw(() => testStore3.defines(), undefined, undefined, 'defines() should fail for invalid type');
        assert.throw(() => testStore3.defines('field1', 'tsdfkf'), undefined, undefined, 'defines() should fail for invalid type');
        assert.doesNotThrow(() => testStore3.defines('lalalala'), undefined, undefined, 'defines() should succeed for unspecified type');
        assert.doesNotThrow(() => testStore3.defines('field2', null), undefined, undefined, 'defines() should succeed for unspecified type');
        assert.throw(() => testStore3.defines(null, 'tsdfkf'), undefined, undefined, 'defines() should fail for invalid field __name');
    });

    it('takes native types', () => {
        const testStore4 = Store('unit-test-store-4');

        assert.doesNotThrow(() => testStore4.defines('field1', Array), undefined, undefined, 'defines() should not fail for native js types');
        assert.doesNotThrow(() => testStore4.defines('field2', Object), undefined, undefined, 'defines() should not fail for native js types');
        assert.doesNotThrow(() => testStore4.defines('field3', Function), undefined, undefined, 'defines() should not fail for native js types');
        assert.doesNotThrow(() => testStore4.defines('field4', String), undefined, undefined, 'defines() should not fail for native js types');
        assert.doesNotThrow(() => testStore4.defines('field5', Number), undefined, undefined, 'defines() should not fail for native js types');
        assert.doesNotThrow(() => testStore4.defines('field6', Boolean), undefined, undefined, 'defines() should not fail for native js types');
    });

    it('takes fully qualified types', () => {
        const testStore5 = Store('unit-test-store-5');

        assert.doesNotThrow(() => testStore5.defines('field1', { type: Array }), undefined, undefined, 'defines() should not fail for fully qualified types');
        assert.doesNotThrow(() => testStore5.defines('field2', { type: Array, default: [2, 3] }), undefined, undefined, 'defines() should not fail for fully qualified types');
        assert.throw(() => testStore5.defines('field3', { type: Array, default: 9 }), undefined, undefined, 'defines() should fail for fully qualified types with invalid defaults');
        assert.throw(() => testStore5.defines('field4', { type: function(){}, default: null }), undefined, undefined, 'defines() should fail for fully qualified types with invalid types');
    });
});

describe('Store.field(...)', () => {
    it('has validation', () => {
        const testStore6 = Store('unit-test-store-6');
        assert.throw(() => testStore6.field('alnals'), undefined, undefined, 'field() should throw for nonexistant fields');
    });

    it('should return a store field', () => {
        const testStore7 = Store('unit-test-store-7').defines('field1');

        assert.isObject(testStore7.field('field1'));
        assert.isFunction(testStore7.field('field1').value);
        assert.isFunction(testStore7.field('field1').revision);
        assert.isFunction(testStore7.field('field1').update);
        assert.isFunction(testStore7.field('field1').notifies);
        assert.isFunction(testStore7.field('field1').binds);
    });

    it('has the right value', () => {
        const mut = generateMutatorContext();
        const testStore8 = Store('unit-test-store-8').defines('field1');
        testStore8.__registerMutatorContext(mut);

        testStore8.field('field1').update(mut, oldValue => 'test');
        assert.equal(testStore8.field('field1').value(), 'test');
    });

    it('has the right revision', () => {
        const mut = generateMutatorContext();
        const testStore9 = Store('unit-test-store-9').defines('field1');
        testStore9.__registerMutatorContext(mut);

        assert.equal(testStore9.field('field1').revision(), 0);
        testStore9.field('field1').update(mut, oldValue => 'test');
        assert.equal(testStore9.field('field1').revision(), 1);
    });

    it('handles subscribers', (done) => {
        let callbackCount = 0;
        const subscriber1 = {
            isMounted: () => true,
            forceUpdate: () => {
                if (++callbackCount == 2) {
                    done();
                }
            }
        };
        const subscriber2 = {
            isMounted: () => true,
            setState: (changes) => {
                assert.deepEqual(changes, { thing: 'test' });
                if (++callbackCount == 2) {
                    done();
                }
            }
        };
        const mut = generateMutatorContext();
        const testStore10 = Store('unit-test-store-10').defines('field1');
        testStore10.__registerMutatorContext(mut);

        testStore10.field('field1').notifies(subscriber1);
        testStore10.field('field1').binds(subscriber2, 'thing');

        testStore10.field('field1').update(mut, oldValue => 'test');
    });
});

describe('Store.fields(...)', () => {
    it('should work', (done) => {
        let callbackCount = 0;
        const subscriber = {
            isMounted: () => true,
            forceUpdate: () => {
                if (++callbackCount === 4) {
                    done();
                }
            }
        };
        const mut = generateMutatorContext();
        const testStore11 = Store('unit-test-store-11')
            .defines('field1', Number)
            .defines('field2', String)
            .defines('field3', Array)
            .defines('field4', Object);
        testStore11.__registerMutatorContext(mut);

        assert.throw(() => testStore11.fields('field1', 'field2', 'field3', 'asldjasdlkjadslaksj'));
        assert.doesNotThrow(() => testStore11.fields('field1', 'field2', 'field3', 'field4').notify(subscriber));

        testStore11.field('field1').update(mut, val => 1);
        testStore11.field('field2').update(mut, val => 'thing');
        testStore11.field('field3').update(mut, val => []);
        testStore11.field('field4').update(mut, val => {});
    });
});
