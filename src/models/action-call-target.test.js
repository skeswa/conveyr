import {expect, assert} from 'chai';
import Promise from 'core-js/es6/promise';

import ActionCallTarget from './action-call-target';
import ServiceEndpoint from './service-endpoint';

describe('new ActionCallTarget()', () => {
    it('should perform argument validation', () => {
        const fakeEndpoint = new ServiceEndpoint();

        expect(() => new ActionCallTarget()).to.throw();
        expect(() => new ActionCallTarget('ads', null)).to.throw();
        expect(() => new ActionCallTarget(fakeEndpoint, 8723)).to.throw();
        expect(() => new ActionCallTarget(fakeEndpoint)).to.not.throw();
        expect(() => new ActionCallTarget(fakeEndpoint, x => x)).to.not.throw();
    });
});

describe('ActionCallTarget#call()', () => {
    it('should return a promise', () => {
        const fakeEndpoint = new ServiceEndpoint();
        const callTarget = new ActionCallTarget(fakeEndpoint);

        expect(callTarget.call()).to.be.an.instanceof(Promise);
    });

    it('should handle successful invocations', (done) => {
        const fakeEndpoint = new ServiceEndpoint();
        const callTarget = new ActionCallTarget(fakeEndpoint);
        callTarget.call().then(done).catch(() => {
            assert.fail();
        });
    });
});