// Shared utility types and helper functions

// Utility types for better type manipulation
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type NonNullable<T> = T extends null | undefined ? never : T;

export type ValueOf<T> = T[keyof T];

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type Immutable<T> = {
  readonly [P in keyof T]: T[P] extends object ? Immutable<T[P]> : T[P];
};

// Array utility types
export type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;

export type NonEmptyArray<T> = [T, ...T[]];

export type Tuple<T extends ReadonlyArray<any>> = T extends readonly [...infer U] ? U : never;

export type Head<T extends readonly any[]> = T extends readonly [any, ...any[]] ? T[0] : never;

export type Tail<T extends readonly any[]> = T extends readonly [any, ...infer U] ? U : [];

// String utility types
export type Capitalize<T extends string> = T extends `${infer F}${infer R}` 
  ? `${Uppercase<F>}${R}` 
  : T;

export type Uncapitalize<T extends string> = T extends `${infer F}${infer R}` 
  ? `${Lowercase<F>}${R}` 
  : T;

export type CamelCase<T extends string> = T extends `${infer P1}_${infer P2}${infer P3}`
  ? `${P1}${Capitalize<CamelCase<`${P2}${P3}`>>}`
  : T;

export type KebabCase<T extends string> = T extends `${infer R1}${infer R2}`
  ? R2 extends Uncapitalize<R2>
    ? `${Uncapitalize<R1>}${KebabCase<R2>}`
    : `${Uncapitalize<R1>}-${KebabCase<Uncapitalize<R2>>}`
  : T;

// Function utility types
export type AsyncFunction<T extends any[] = any[], R = any> = (...args: T) => Promise<R>;

export type SyncFunction<T extends any[] = any[], R = any> = (...args: T) => R;

export type AnyFunction = (...args: any[]) => any;

export type ReturnTypeAsync<T extends AsyncFunction> = T extends AsyncFunction<any[], infer R> ? R : never;

export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

// Event utility types
export type EventHandler<T = any> = (event: T) => void;

export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

export type EventMap = Record<string, any>;

export type EventCallback<T extends EventMap, K extends keyof T> = (data: T[K]) => void;

// API utility types
export type ApiEndpoint = `/${string}`;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export type ApiHeaders = Record<string, string>;

export type QueryParams = Record<string, string | number | boolean | undefined>;

export type RequestBody = Record<string, any> | FormData | string | null;

// Validation utility types
export type ValidationResult<T = any> = {
  isValid: boolean;
  errors: string[];
  data?: T;
};

export type Validator<T> = (value: T) => ValidationResult<T>;

export type ValidatorRule<T> = {
  rule: Validator<T>;
  message: string;
};

// State management utility types
export type StateSlice<T> = {
  [K in keyof T]: T[K];
} & {
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
};

export type StoreAction<T extends any[] = [], R = void> = (...args: T) => R;

export type AsyncStoreAction<T extends any[] = [], R = any> = (...args: T) => Promise<R>;

export type StoreSelector<TState, TReturn> = (state: TState) => TReturn;

// Form utility types
export type FormField<T = any> = {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
};

export type FormState<T extends Record<string, any>> = {
  [K in keyof T]: FormField<T[K]>;
};

export type FormErrors<T extends Record<string, any>> = {
  [K in keyof T]?: string;
};

export type FormValues<T extends Record<string, FormField<any>>> = {
  [K in keyof T]: T[K] extends FormField<infer V> ? V : never;
};

// Date utility types
export type DateInput = Date | string | number;

export type DateFormat = 'ISO' | 'short' | 'medium' | 'long' | 'time' | 'datetime';

export type TimeUnit = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

// Storage utility types
export type StorageValue = string | number | boolean | object | null;

export type StorageKey = string;

export type StorageOperation = 'get' | 'set' | 'remove' | 'clear';

// Theme utility types
export type ThemeMode = 'light' | 'dark' | 'auto';

export type ColorValue = string;

export type SpacingValue = number | string;

export type BreakpointValue = number;

export type ResponsiveValue<T> = T | { [key: string]: T };

// Error utility types
export type ErrorType = 'validation' | 'network' | 'auth' | 'server' | 'client' | 'unknown';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorContext = {
  action?: string;
  component?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
};

export type ErrorInfo = {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  context?: ErrorContext;
  stack?: string;
};

// Analytics utility types
export type AnalyticsEventName = string;

export type AnalyticsEventProperties = Record<string, any>;

export type AnalyticsUserId = string;

export type AnalyticsTraits = Record<string, any>;

// Permission utility types
export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'restricted';

export type PermissionType = 'camera' | 'microphone' | 'location' | 'notifications' | 'contacts' | 'photos';

// Device utility types
export type DevicePlatform = 'ios' | 'android' | 'web' | 'desktop';

export type DeviceOrientation = 'portrait' | 'landscape';

export type DeviceSize = 'small' | 'medium' | 'large' | 'xlarge';

// Network utility types
export type NetworkConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

// Feature flag utility types
export type FeatureFlagValue = boolean | string | number | object;

export type FeatureFlagVariant = 'control' | 'treatment' | string;

export type FeatureFlagContext = {
  userId?: string;
  userSegment?: string;
  platform?: string;
  version?: string;
  metadata?: Record<string, any>;
};

// Cache utility types
export type CacheKey = string;

export type CacheTTL = number; // seconds

export type CacheValue<T = any> = {
  data: T;
  timestamp: number;
  ttl: number;
};

export type CacheStrategy = 'memory' | 'storage' | 'hybrid';

// Pagination utility types
export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  offset?: number;
};

// Search utility types
export type SearchQuery = string;

export type SearchFilters = Record<string, any>;

export type SearchSort = {
  field: string;
  direction: 'asc' | 'desc';
};

export type SearchOptions = {
  query?: SearchQuery;
  filters?: SearchFilters;
  sort?: SearchSort;
  pagination?: PaginationParams;
};

// Performance utility types
export type PerformanceMetric = {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
};

export type PerformanceEntry = {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
};

// Security utility types
export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';

export type EncryptionAlgorithm = 'AES-256' | 'RSA-2048' | 'ChaCha20';

export type HashAlgorithm = 'SHA-256' | 'SHA-512' | 'bcrypt' | 'scrypt';

// Internationalization utility types
export type LocaleCode = string; // e.g., 'en-US', 'es-ES'

export type TranslationKey = string;

export type TranslationValues = Record<string, string | number>;

export type TranslatedString = string;

// File utility types
export type FileExtension = string;

export type MimeType = string;

export type FileSize = number; // bytes

export type FileMetadata = {
  name: string;
  size: FileSize;
  type: MimeType;
  lastModified: number;
  path?: string;
};

// URL utility types
export type URLPath = string;

export type URLQuery = Record<string, string | string[]>;

export type URLFragment = string;

export type ParsedURL = {
  protocol: string;
  hostname: string;
  port?: string;
  pathname: URLPath;
  query: URLQuery;
  fragment?: URLFragment;
};

// Environment utility types
export type Environment = 'development' | 'staging' | 'production' | 'test';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type ConfigValue = string | number | boolean | object;

export type EnvironmentConfig = Record<string, ConfigValue>;

// Type guards and predicates
export type TypeGuard<T> = (value: any) => value is T;

export type TypePredicate<T> = (value: T) => boolean;

// Conditional types
export type If<C extends boolean, T, F> = C extends true ? T : F;

export type IsEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2)
  ? true
  : false;

export type IsNever<T> = [T] extends [never] ? true : false;

export type IsAny<T> = 0 extends (1 & T) ? true : false;

export type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false;

// Union utility types
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

export type UnionToTuple<T> = UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? [R] : never;

export type LastOf<T> = UnionToIntersection<T extends any ? () => T : never> extends () => (infer R) ? R : never;

// Brand types for better type safety
export type Brand<T, B> = T & { readonly __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type DecisionId = Brand<string, 'DecisionId'>;
export type MoodId = Brand<string, 'MoodId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type TokenId = Brand<string, 'TokenId'>;
export type ImageId = Brand<string, 'ImageId'>;

// Opaque types for better encapsulation
export type Opaque<T, K> = T & { readonly __opaque__: K };

export type Email = Opaque<string, 'Email'>;
export type Password = Opaque<string, 'Password'>;
export type JWT = Opaque<string, 'JWT'>;
export type URL = Opaque<string, 'URL'>;
export type Base64 = Opaque<string, 'Base64'>;

// JSON utility types
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

// Promise utility types
export type PromiseValue<T> = T extends Promise<infer V> ? V : T;

export type AllPromiseValues<T extends readonly unknown[]> = {
  [K in keyof T]: PromiseValue<T[K]>;
};

// Tagged union utility types
export type TaggedUnion<T extends Record<string, any>, K extends keyof T> = {
  [P in T[K]]: T extends Record<K, P> ? T : never;
}[T[K]];

// Fluent API utility types
export type FluentAPI<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (...args: Parameters<T[K]>) => FluentAPI<T> & { result: ReturnType<T[K]> }
    : T[K];
};