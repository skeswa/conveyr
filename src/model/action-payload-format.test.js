import {expect} from 'chai';

import ActionPayloadFormat from './action-payload-format';

describe('new ActionPayloadFormat()', () => {
    // Test custom type to use
    class TestType1 {
        constructor() {
            this.testValue = 'test';
        }
    }

    it('should take native types as formats', () => {
        expect(() => new ActionPayloadFormat(Array)).to.not.throw();
        expect(() => new ActionPayloadFormat(Object)).to.not.throw();
        expect(() => new ActionPayloadFormat(Function)).to.not.throw();
        expect(() => new ActionPayloadFormat(String)).to.not.throw();
        expect(() => new ActionPayloadFormat(Number)).to.not.throw();
        expect(() => new ActionPayloadFormat(Boolean)).to.not.throw();
    });

    it('should take custom types as formats', () => {
        expect(() => new ActionPayloadFormat(TestType1)).to.not.throw();
    });

    it('shouldn\'t take arbitrary values as formats', () => {
        expect(() => new ActionPayloadFormat(null)).to.not.throw();
        expect(() => new ActionPayloadFormat(undefined)).to.not.throw();
        expect(() => new ActionPayloadFormat(0)).to.throw(Error);
        expect(() => new ActionPayloadFormat(NaN)).to.throw(Error);
        expect(() => new ActionPayloadFormat('red')).to.throw(Error);
        expect(() => new ActionPayloadFormat(false)).to.throw(Error);
        expect(() => new ActionPayloadFormat([])).to.throw(Error);
    });

    it('should take valid field validator maps as formats', () => {
        expect(() => new ActionPayloadFormat({
            thing1: Array,
            thing2: Object,
            thing3: Function,
            thing4: String,
            thing5: Number,
            thing6: Boolean,
            thing7: TestType1
        })).to.not.throw();

        new ActionPayloadFormat({
            thing1: { type: Array },
            thing2: { type: Array, default: [1, 2] },
            thing3: { type: Object },
            thing4: { type: Object, default: { one: 1, two: 2 } },
            thing5: { type: Function },
            thing6: { type: Function, default: x => (x + 1) },
            thing7: { type: String },
            thing8: { type: String, default: '1 2' },
            thing9: { type: Number },
            thing10: { type: Number, default: 121.2 },
            thing11: { type: Boolean },
            thing12: { type: Boolean, default: true },
            thing13: { type: TestType1 },
            thing14: { type: TestType1, default: new TestType1(1, 2) }
        });

        expect(() => new ActionPayloadFormat({
            thing1: { type: Array },
            thing2: { type: Array, default: [1, 2] },
            thing3: { type: Object },
            thing4: { type: Object, default: { one: 1, two: 2 } },
            thing5: { type: Function },
            thing6: { type: Function, default: x => (x + 1) },
            thing7: { type: String },
            thing8: { type: String, default: '1 2' },
            thing9: { type: Number },
            thing10: { type: Number, default: 121.2 },
            thing11: { type: Boolean },
            thing12: { type: Boolean, default: true },
            thing13: { type: TestType1 },
            thing14: { type: TestType1, default: new TestType1(1, 2) }
        })).to.not.throw();
    });

    it('shouldn\'t take invalid field validator maps as formats', () => {
        expect(() => new ActionPayloadFormat({
            thing1: {
                a: Boolean,
                b: String
            }
        })).to.throw(Error);
        expect(() => new ActionPayloadFormat({
            thing2: null,
        })).to.throw(Error);

        expect(() => new ActionPayloadFormat({
            thing4: 'String'
        })).to.throw(Error);

        expect(() => new ActionPayloadFormat({
            thing6: []
        })).to.throw(Error);

        expect(() => new ActionPayloadFormat({
            thing7: { type: 'foo' }
        })).to.throw(Error);

        expect(() => new ActionPayloadFormat({
            thing7: { type: Number, default: 'sdfg' }
        })).to.throw(Error);

        expect(() => new ActionPayloadFormat({
            thing7: { type: TestType1, default: 101 }
        })).to.throw(Error);
    });
});

describe('ActionPayloadFormat#sanitize()', () => {
    // Test custom type to use
    class TestType1 {
        constructor() {
            this.testValue = 'test';
        }
    }

    it('should sanitize native types correctly', () => {
        let fmt;

        fmt = new ActionPayloadFormat(Array);
        expect(() => fmt.sanitize(null)).to.throw(Error);
        expect(() => fmt.sanitize(9)).to.throw(Error);
        expect(() => fmt.sanitize([1, 2])).to.not.throw();
        fmt = new ActionPayloadFormat(Object);
        expect(() => fmt.sanitize(null)).to.throw(Error);
        expect(() => fmt.sanitize('dfsffs')).to.throw(Error);
        expect(() => fmt.sanitize({ one: 1 })).to.not.throw();
        fmt = new ActionPayloadFormat(Function);
        expect(() => fmt.sanitize(null)).to.throw(Error);
        expect(() => fmt.sanitize({})).to.throw(Error);
        expect(() => fmt.sanitize(x => x)).to.not.throw();
        fmt = new ActionPayloadFormat(String);
        expect(() => fmt.sanitize(null)).to.throw(Error);
        expect(() => fmt.sanitize(x => x)).to.throw(Error);
        expect(() => fmt.sanitize('')).to.not.throw();
        fmt = new ActionPayloadFormat(Number);
        expect(() => fmt.sanitize(null)).to.throw(Error);
        expect(() => fmt.sanitize([1, 2])).to.throw(Error);
        expect(() => fmt.sanitize(17283)).to.not.throw();
        fmt = new ActionPayloadFormat(Boolean);
        expect(() => fmt.sanitize(null)).to.throw(Error);
        expect(() => fmt.sanitize(329)).to.throw(Error);
        expect(() => fmt.sanitize(true)).to.not.throw();
    });

    it('should sanitize custom types correctly', () => {
        let fmt = new ActionPayloadFormat(TestType1);
        expect(() => fmt.sanitize(null)).to.throw(Error);
        expect(() => fmt.sanitize(9)).to.throw(Error);
        expect(() => fmt.sanitize(new TestType1())).to.not.throw();
    });

    it('should sanitize field maps without defaults correctly', () => {
        let fmt = new ActionPayloadFormat({
            thing1: Array,
            thing2: Object,
            thing3: Function,
            thing4: String,
            thing5: Number,
            thing6: Boolean,
            thing7: TestType1
        });

        expect(() => fmt.sanitize(null)).to.throw(Error);
        expect(() => fmt.sanitize(11)).to.throw(Error);
        expect(() => fmt.sanitize({
            thing1: [],
            thing2: {}
        })).to.throw(Error);
        expect(() => fmt.sanitize({
            thing1: [],
            thing2: {},
            thing3: x => x,
            thing4: '',
            thing5: 0,
            thing6: true,
            thing7: null
        })).to.throw(Error);
        expect(() => fmt.sanitize({
            thing1: 'ldsakjh'
        })).to.throw(Error);
        expect(() => fmt.sanitize({
            thing1: null
        })).to.throw(Error);
        expect(() => fmt.sanitize({
            thing1: [1, 2]
        })).to.throw(Error);
        expect(() => fmt.sanitize({
            thing1: [],
            thing2: {},
            thing3: x => x,
            thing4: '',
            thing5: 0,
            thing6: true,
            thing7: null
        })).to.throw(Error);
        expect(() => fmt.sanitize({
            thing1: [1, 2, 3, 4, 5],
            thing2: {
                one:    1,
                two:    2,
                three:  3,
                four:   4,
                five:   5,
                six:    6
            },
            thing3: x => x,
            thing4: 'I like corn. A lot.',
            thing5: 1337,
            thing6: false,
            thing7: new TestType1()
        })).to.not.throw();
    });

    it('should validate field maps with defaults correctly', () => {
        let fmt = new ActionPayloadFormat({
            thing1: { type: Array, default: [1, 2, 3] },
            thing2: { type: Object, default: { hello: 'world' } },
            thing3: Function,
            thing4: { type: String, default: 'lol' },
            thing5: Number,
            thing6: Boolean,
            thing7: { type: String, default: null }
        });

        expect(() => fmt.sanitize(null)).to.throw(Error);
        expect(() => fmt.sanitize(11)).to.throw(Error);
        const fn = x => x;
        let payload = {
            thing3: fn,
            thing5: 34,
            thing6: true
        };
        let resultingPayload;
        expect(() => resultingPayload = fmt.sanitize(payload)).to.not.throw();
        expect(resultingPayload).to.eql({
            thing1: [1, 2, 3],
            thing2: { hello: 'world' },
            thing3: fn,
            thing4: 'lol',
            thing5: 34,
            thing6: true,
            thing7: null
        });
    });
});