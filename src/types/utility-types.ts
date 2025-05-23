/**
 * Utility types to replace 'any' usage throughout the codebase
 */

// For generic object types
export type GenericObject = Record<string, unknown>;

// For function parameters that can be any type
export type GenericParam = unknown;

// For API responses with unknown structure
export type ApiResponse<T = unknown> = T;

// For event handlers
export type GenericEvent = Event | React.SyntheticEvent;

// For component props that can accept any React node
export type GenericReactNode = React.ReactNode;

// For data that can be stored in state
export type GenericStateData = unknown;

// For callback functions with various signatures
export type GenericCallback = (...args: unknown[]) => unknown;

// For chart data objects
export type ChartDataObject = Record<string, unknown>;

// For database record objects
export type DatabaseRecord = Record<string, unknown>;

// For error objects
export type ErrorObject = Error | unknown;
