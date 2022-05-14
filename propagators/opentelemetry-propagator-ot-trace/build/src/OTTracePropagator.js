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
exports.OTTracePropagator = exports.OT_BAGGAGE_PREFIX = exports.OT_SAMPLED_HEADER = exports.OT_SPAN_ID_HEADER = exports.OT_TRACE_ID_HEADER = void 0;
const api_1 = require("@opentelemetry/api");
/** OT header keys */
exports.OT_TRACE_ID_HEADER = 'ot-tracer-traceid';
exports.OT_SPAN_ID_HEADER = 'ot-tracer-spanid';
exports.OT_SAMPLED_HEADER = 'ot-tracer-sampled';
exports.OT_BAGGAGE_PREFIX = 'ot-baggage-';
const FIELDS = [exports.OT_TRACE_ID_HEADER, exports.OT_SPAN_ID_HEADER, exports.OT_SAMPLED_HEADER];
const PADDING = '0'.repeat(16);
function readHeader(carrier, getter, key) {
    let header = getter.get(carrier, key);
    if (Array.isArray(header))
        [header] = header;
    return header || '';
}
const VALID_HEADER_NAME_CHARS = /^[\^_`a-zA-Z\-0-9!#$%&'*+.|~]+$/;
function isValidHeaderName(name) {
    return VALID_HEADER_NAME_CHARS.test(name);
}
const INVALID_HEADER_VALUE_CHARS = /[^\t\x20-\x7e\x80-\xff]/;
function isValidHeaderValue(value) {
    return !INVALID_HEADER_VALUE_CHARS.test(value);
}
/**
 * Propagator for the ot-trace HTTP format from OpenTracing.
 */
class OTTracePropagator {
    inject(context, carrier, setter) {
        var _a;
        const spanContext = (_a = api_1.trace.getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
        if (!spanContext || !api_1.isSpanContextValid(spanContext))
            return;
        setter.set(carrier, exports.OT_TRACE_ID_HEADER, spanContext.traceId);
        setter.set(carrier, exports.OT_SPAN_ID_HEADER, spanContext.spanId);
        setter.set(carrier, exports.OT_SAMPLED_HEADER, spanContext.traceFlags === api_1.TraceFlags.SAMPLED ? 'true' : 'false');
        const baggage = api_1.propagation.getBaggage(context);
        if (!baggage)
            return;
        baggage.getAllEntries().forEach(([k, v]) => {
            if (!isValidHeaderName(k) || !isValidHeaderValue(v.value))
                return;
            setter.set(carrier, `${exports.OT_BAGGAGE_PREFIX}${k}`, v.value);
        });
    }
    extract(context, carrier, getter) {
        let traceId = readHeader(carrier, getter, exports.OT_TRACE_ID_HEADER);
        if (traceId.length == 16)
            traceId = `${PADDING}${traceId}`;
        const spanId = readHeader(carrier, getter, exports.OT_SPAN_ID_HEADER);
        const sampled = readHeader(carrier, getter, exports.OT_SAMPLED_HEADER);
        const traceFlags = sampled === 'true' ? api_1.TraceFlags.SAMPLED : api_1.TraceFlags.NONE;
        if (api_1.isValidTraceId(traceId) && api_1.isValidSpanId(spanId)) {
            context = api_1.trace.setSpan(context, api_1.trace.wrapSpanContext({
                traceId,
                spanId,
                isRemote: true,
                traceFlags,
            }));
            let baggage = api_1.propagation.getBaggage(context) || api_1.propagation.createBaggage();
            getter.keys(carrier).forEach(k => {
                if (!k.startsWith(exports.OT_BAGGAGE_PREFIX))
                    return;
                const value = readHeader(carrier, getter, k);
                baggage = baggage.setEntry(k.substr(exports.OT_BAGGAGE_PREFIX.length), {
                    value,
                });
            });
            if (baggage.getAllEntries().length > 0) {
                context = api_1.propagation.setBaggage(context, baggage);
            }
        }
        return context;
    }
    /**
     * Note: fields does not include baggage headers as they are dependent on
     * carrier instance. Attempting to reuse a carrier by clearing fields could
     * result in a memory leak.
     */
    fields() {
        return FIELDS.slice();
    }
}
exports.OTTracePropagator = OTTracePropagator;
//# sourceMappingURL=OTTracePropagator.js.map