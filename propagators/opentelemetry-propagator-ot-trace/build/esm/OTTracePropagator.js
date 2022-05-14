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
import { trace, propagation, isSpanContextValid, isValidSpanId, isValidTraceId, TraceFlags, } from '@opentelemetry/api';
/** OT header keys */
export var OT_TRACE_ID_HEADER = 'ot-tracer-traceid';
export var OT_SPAN_ID_HEADER = 'ot-tracer-spanid';
export var OT_SAMPLED_HEADER = 'ot-tracer-sampled';
export var OT_BAGGAGE_PREFIX = 'ot-baggage-';
var FIELDS = [OT_TRACE_ID_HEADER, OT_SPAN_ID_HEADER, OT_SAMPLED_HEADER];
var PADDING = '0'.repeat(16);
function readHeader(carrier, getter, key) {
    var _a;
    var header = getter.get(carrier, key);
    if (Array.isArray(header))
        _a = header, header = _a[0];
    return header || '';
}
var VALID_HEADER_NAME_CHARS = /^[\^_`a-zA-Z\-0-9!#$%&'*+.|~]+$/;
function isValidHeaderName(name) {
    return VALID_HEADER_NAME_CHARS.test(name);
}
var INVALID_HEADER_VALUE_CHARS = /[^\t\x20-\x7e\x80-\xff]/;
function isValidHeaderValue(value) {
    return !INVALID_HEADER_VALUE_CHARS.test(value);
}
/**
 * Propagator for the ot-trace HTTP format from OpenTracing.
 */
var OTTracePropagator = /** @class */ (function () {
    function OTTracePropagator() {
    }
    OTTracePropagator.prototype.inject = function (context, carrier, setter) {
        var _a;
        var spanContext = (_a = trace.getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
        if (!spanContext || !isSpanContextValid(spanContext))
            return;
        setter.set(carrier, OT_TRACE_ID_HEADER, spanContext.traceId);
        setter.set(carrier, OT_SPAN_ID_HEADER, spanContext.spanId);
        setter.set(carrier, OT_SAMPLED_HEADER, spanContext.traceFlags === TraceFlags.SAMPLED ? 'true' : 'false');
        var baggage = propagation.getBaggage(context);
        if (!baggage)
            return;
        baggage.getAllEntries().forEach(function (_a) {
            var k = _a[0], v = _a[1];
            if (!isValidHeaderName(k) || !isValidHeaderValue(v.value))
                return;
            setter.set(carrier, "" + OT_BAGGAGE_PREFIX + k, v.value);
        });
    };
    OTTracePropagator.prototype.extract = function (context, carrier, getter) {
        var traceId = readHeader(carrier, getter, OT_TRACE_ID_HEADER);
        if (traceId.length == 16)
            traceId = "" + PADDING + traceId;
        var spanId = readHeader(carrier, getter, OT_SPAN_ID_HEADER);
        var sampled = readHeader(carrier, getter, OT_SAMPLED_HEADER);
        var traceFlags = sampled === 'true' ? TraceFlags.SAMPLED : TraceFlags.NONE;
        if (isValidTraceId(traceId) && isValidSpanId(spanId)) {
            context = trace.setSpan(context, trace.wrapSpanContext({
                traceId: traceId,
                spanId: spanId,
                isRemote: true,
                traceFlags: traceFlags,
            }));
            var baggage_1 = propagation.getBaggage(context) || propagation.createBaggage();
            getter.keys(carrier).forEach(function (k) {
                if (!k.startsWith(OT_BAGGAGE_PREFIX))
                    return;
                var value = readHeader(carrier, getter, k);
                baggage_1 = baggage_1.setEntry(k.substr(OT_BAGGAGE_PREFIX.length), {
                    value: value,
                });
            });
            if (baggage_1.getAllEntries().length > 0) {
                context = propagation.setBaggage(context, baggage_1);
            }
        }
        return context;
    };
    /**
     * Note: fields does not include baggage headers as they are dependent on
     * carrier instance. Attempting to reuse a carrier by clearing fields could
     * result in a memory leak.
     */
    OTTracePropagator.prototype.fields = function () {
        return FIELDS.slice();
    };
    return OTTracePropagator;
}());
export { OTTracePropagator };
//# sourceMappingURL=OTTracePropagator.js.map