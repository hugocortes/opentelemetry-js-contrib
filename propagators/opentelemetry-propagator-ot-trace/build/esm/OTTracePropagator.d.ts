import { Context, TextMapGetter, TextMapPropagator, TextMapSetter } from '@opentelemetry/api';
/** OT header keys */
export declare const OT_TRACE_ID_HEADER = "ot-tracer-traceid";
export declare const OT_SPAN_ID_HEADER = "ot-tracer-spanid";
export declare const OT_SAMPLED_HEADER = "ot-tracer-sampled";
export declare const OT_BAGGAGE_PREFIX = "ot-baggage-";
/**
 * Propagator for the ot-trace HTTP format from OpenTracing.
 */
export declare class OTTracePropagator implements TextMapPropagator {
    inject(context: Context, carrier: unknown, setter: TextMapSetter): void;
    extract(context: Context, carrier: unknown, getter: TextMapGetter): Context;
    /**
     * Note: fields does not include baggage headers as they are dependent on
     * carrier instance. Attempting to reuse a carrier by clearing fields could
     * result in a memory leak.
     */
    fields(): string[];
}
//# sourceMappingURL=OTTracePropagator.d.ts.map