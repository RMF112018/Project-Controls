export interface ITelemetryCustomEvent {
  name: string;
  timestamp: string;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
}

export interface ITelemetryMetric {
  name: string;
  value: number;
  timestamp: string;
  properties?: Record<string, string>;
}

export interface ITelemetryAggregated {
  eventName: string;
  count: number;
  dateRange: [string, string];
  breakdown?: Record<string, number>;
}
