"use strict";
/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@opentelemetry/api");
const assert = require("assert");
const OTTracePropagator_1 = require("../src/OTTracePropagator");
describe('OTTracePropagator', () => {
    const propagator = new OTTracePropagator_1.OTTracePropagator();
    let carrier;
    beforeEach(() => {
        carrier = {};
    });
    describe('.inject()', () => {
        it('injects context with sampled trace flags', () => {
            const spanContext = {
                traceId: '80f198ee56343ba864fe8b2a57d3eff7',
                spanId: 'e457b5a2e4d86bd1',
                traceFlags: api_1.TraceFlags.SAMPLED,
            };
            propagator.inject(api_1.trace.setSpan(api_1.ROOT_CONTEXT, api_1.trace.wrapSpanContext(spanContext)), carrier, api_1.defaultTextMapSetter);
            assert.strictEqual(carrier[OTTracePropagator_1.OT_TRACE_ID_HEADER], spanContext.traceId);
            assert.strictEqual(carrier[OTTracePropagator_1.OT_SPAN_ID_HEADER], 'e457b5a2e4d86bd1');
            assert.strictEqual(carrier[OTTracePropagator_1.OT_SAMPLED_HEADER], 'true');
        });
        it('injects context with unspecified trace flags', () => {
            const spanContext = {
                traceId: '80f198ee56343ba864fe8b2a57d3eff7',
                spanId: 'e457b5a2e4d86bd1',
                traceFlags: api_1.TraceFlags.NONE,
            };
            propagator.inject(api_1.trace.setSpan(api_1.ROOT_CONTEXT, api_1.trace.wrapSpanContext(spanContext)), carrier, api_1.defaultTextMapSetter);
            assert.strictEqual(carrier[OTTracePropagator_1.OT_TRACE_ID_HEADER], spanContext.traceId);
            assert.strictEqual(carrier[OTTracePropagator_1.OT_SPAN_ID_HEADER], 'e457b5a2e4d86bd1');
            assert.strictEqual(carrier[OTTracePropagator_1.OT_SAMPLED_HEADER], 'false');
        });
        it('no-ops if traceid invalid', () => {
            const spanContext = {
                traceId: api_1.INVALID_TRACEID,
                spanId: 'e457b5a2e4d86bd1',
                traceFlags: api_1.TraceFlags.SAMPLED,
            };
            propagator.inject(api_1.trace.setSpan(api_1.ROOT_CONTEXT, api_1.trace.wrapSpanContext(spanContext)), carrier, api_1.defaultTextMapSetter);
            assert.strictEqual(carrier[OTTracePropagator_1.OT_TRACE_ID_HEADER], undefined);
            assert.strictEqual(carrier[OTTracePropagator_1.OT_SPAN_ID_HEADER], undefined);
            assert.strictEqual(carrier[OTTracePropagator_1.OT_SAMPLED_HEADER], undefined);
        });
        it('no-ops if spanid invalid', () => {
            const spanContext = {
                traceId: '80f198ee56343ba864fe8b2a57d3eff7',
                spanId: api_1.INVALID_SPANID,
                traceFlags: api_1.TraceFlags.SAMPLED,
            };
            propagator.inject(api_1.trace.setSpan(api_1.ROOT_CONTEXT, api_1.trace.wrapSpanContext(spanContext)), carrier, api_1.defaultTextMapSetter);
            assert.strictEqual(carrier[OTTracePropagator_1.OT_TRACE_ID_HEADER], undefined);
            assert.strictEqual(carrier[OTTracePropagator_1.OT_SPAN_ID_HEADER], undefined);
            assert.strictEqual(carrier[OTTracePropagator_1.OT_SAMPLED_HEADER], undefined);
        });
        it('injects baggage', () => {
            const spanContext = {
                traceId: '80f198ee56343ba864fe8b2a57d3eff7',
                spanId: 'e457b5a2e4d86bd1',
                traceFlags: api_1.TraceFlags.SAMPLED,
            };
            let context = api_1.trace.setSpan(api_1.ROOT_CONTEXT, api_1.trace.wrapSpanContext(spanContext));
            const baggage = api_1.propagation.createBaggage({
                foo: { value: 'bar' },
                bar: { value: 'baz' },
            });
            context = api_1.propagation.setBaggage(context, baggage);
            propagator.inject(context, carrier, api_1.defaultTextMapSetter);
            assert.strictEqual(carrier[`${OTTracePropagator_1.OT_BAGGAGE_PREFIX}foo`], 'bar');
            assert.strictEqual(carrier[`${OTTracePropagator_1.OT_BAGGAGE_PREFIX}bar`], 'baz');
        });
        it('omits baggage items with invalid keys', () => {
            const spanContext = {
                traceId: '80f198ee56343ba864fe8b2a57d3eff7',
                spanId: 'e457b5a2e4d86bd1',
                traceFlags: api_1.TraceFlags.SAMPLED,
            };
            let context = api_1.trace.setSpan(api_1.ROOT_CONTEXT, api_1.trace.wrapSpanContext(spanContext));
            const baggage = api_1.propagation.createBaggage({
                fθθ: { value: 'bar' },
                bar: { value: 'baz' },
            });
            context = api_1.propagation.setBaggage(context, baggage);
            propagator.inject(context, carrier, api_1.defaultTextMapSetter);
            assert.ok(!(`${OTTracePropagator_1.OT_BAGGAGE_PREFIX}fθθ` in carrier));
            assert.strictEqual(carrier[`${OTTracePropagator_1.OT_BAGGAGE_PREFIX}bar`], 'baz');
        });
        it('omits baggage items with invalid values', () => {
            const spanContext = {
                traceId: '80f198ee56343ba864fe8b2a57d3eff7',
                spanId: 'e457b5a2e4d86bd1',
                traceFlags: api_1.TraceFlags.SAMPLED,
            };
            let context = api_1.trace.setSpan(api_1.ROOT_CONTEXT, api_1.trace.wrapSpanContext(spanContext));
            const baggage = api_1.propagation.createBaggage({
                foo: { value: 'bαr' },
                bar: { value: 'baz' },
            });
            context = api_1.propagation.setBaggage(context, baggage);
            propagator.inject(context, carrier, api_1.defaultTextMapSetter);
            assert.ok(!(`${OTTracePropagator_1.OT_BAGGAGE_PREFIX}foo` in carrier));
            assert.strictEqual(carrier[`${OTTracePropagator_1.OT_BAGGAGE_PREFIX}bar`], 'baz');
        });
    });
    describe('.extract', () => {
        it('extracts context with traceid, spanid, sampled true', () => {
            var _a;
            carrier = {
                [OTTracePropagator_1.OT_TRACE_ID_HEADER]: '80f198ee56343ba864fe8b2a57d3eff7',
                [OTTracePropagator_1.OT_SPAN_ID_HEADER]: 'e457b5a2e4d86bd1',
                [OTTracePropagator_1.OT_SAMPLED_HEADER]: 'true',
            };
            const context = propagator.extract(api_1.ROOT_CONTEXT, carrier, api_1.defaultTextMapGetter);
            const extractedSpanContext = (_a = api_1.trace.getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
            assert.deepStrictEqual(extractedSpanContext, {
                spanId: 'e457b5a2e4d86bd1',
                traceId: '80f198ee56343ba864fe8b2a57d3eff7',
                isRemote: true,
                traceFlags: api_1.TraceFlags.SAMPLED,
            });
        });
        it('extracts context with traceid, spanid, sampled false', () => {
            var _a;
            carrier = {
                [OTTracePropagator_1.OT_TRACE_ID_HEADER]: '80f198ee56343ba864fe8b2a57d3eff7',
                [OTTracePropagator_1.OT_SPAN_ID_HEADER]: 'e457b5a2e4d86bd1',
                [OTTracePropagator_1.OT_SAMPLED_HEADER]: 'false',
            };
            const context = propagator.extract(api_1.ROOT_CONTEXT, carrier, api_1.defaultTextMapGetter);
            const extractedSpanContext = (_a = api_1.trace.getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
            assert.deepStrictEqual(extractedSpanContext, {
                spanId: 'e457b5a2e4d86bd1',
                traceId: '80f198ee56343ba864fe8b2a57d3eff7',
                isRemote: true,
                traceFlags: api_1.TraceFlags.NONE,
            });
        });
        it('converts 8-byte traceid', () => {
            var _a;
            carrier = {
                [OTTracePropagator_1.OT_TRACE_ID_HEADER]: '4aaba1a52cf8ee09',
                [OTTracePropagator_1.OT_SPAN_ID_HEADER]: 'e457b5a2e4d86bd1',
                [OTTracePropagator_1.OT_SAMPLED_HEADER]: 'false',
            };
            const context = propagator.extract(api_1.ROOT_CONTEXT, carrier, api_1.defaultTextMapGetter);
            const extractedSpanContext = (_a = api_1.trace.getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
            assert.deepStrictEqual(extractedSpanContext, {
                spanId: 'e457b5a2e4d86bd1',
                traceId: '00000000000000004aaba1a52cf8ee09',
                isRemote: true,
                traceFlags: api_1.TraceFlags.NONE,
            });
        });
        it('handles malformed traceid', () => {
            var _a;
            carrier = {
                [OTTracePropagator_1.OT_TRACE_ID_HEADER]: 'abc123',
                [OTTracePropagator_1.OT_SPAN_ID_HEADER]: 'e457b5a2e4d86bd1',
                [OTTracePropagator_1.OT_SAMPLED_HEADER]: 'false',
            };
            const context = propagator.extract(api_1.ROOT_CONTEXT, carrier, api_1.defaultTextMapGetter);
            const extractedSpanContext = (_a = api_1.trace.getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
            assert.deepStrictEqual(undefined, extractedSpanContext);
        });
        it('handles malformed spanid', () => {
            var _a;
            carrier = {
                [OTTracePropagator_1.OT_TRACE_ID_HEADER]: '0f198ee56343ba864fe8b2a57d3eff7',
                [OTTracePropagator_1.OT_SPAN_ID_HEADER]: 'abc123',
                [OTTracePropagator_1.OT_SAMPLED_HEADER]: 'false',
            };
            const context = propagator.extract(api_1.ROOT_CONTEXT, carrier, api_1.defaultTextMapGetter);
            const extractedSpanContext = (_a = api_1.trace.getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
            assert.deepStrictEqual(undefined, extractedSpanContext);
        });
        it('handles invalid traceid', () => {
            var _a;
            carrier = {
                [OTTracePropagator_1.OT_TRACE_ID_HEADER]: api_1.INVALID_TRACEID,
                [OTTracePropagator_1.OT_SPAN_ID_HEADER]: 'e457b5a2e4d86bd1',
                [OTTracePropagator_1.OT_SAMPLED_HEADER]: 'false',
            };
            const context = propagator.extract(api_1.ROOT_CONTEXT, carrier, api_1.defaultTextMapGetter);
            const extractedSpanContext = (_a = api_1.trace.getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
            assert.deepStrictEqual(undefined, extractedSpanContext);
        });
        it('extracts baggage', () => {
            carrier = {
                [OTTracePropagator_1.OT_TRACE_ID_HEADER]: '80f198ee56343ba864fe8b2a57d3eff7',
                [OTTracePropagator_1.OT_SPAN_ID_HEADER]: 'e457b5a2e4d86bd1',
                [OTTracePropagator_1.OT_SAMPLED_HEADER]: 'false',
                [`${OTTracePropagator_1.OT_BAGGAGE_PREFIX}foo`]: 'bar',
                [`${OTTracePropagator_1.OT_BAGGAGE_PREFIX}bar`]: 'baz',
            };
            const context = propagator.extract(api_1.ROOT_CONTEXT, carrier, api_1.defaultTextMapGetter);
            const baggage = api_1.propagation.getBaggage(context);
            assert.ok(baggage);
            assert.deepStrictEqual(baggage.getAllEntries(), [
                ['foo', { value: 'bar' }],
                ['bar', { value: 'baz' }],
            ]);
        });
    });
});
//# sourceMappingURL=OTTracePropagator.test.js.map