export interface ISuccessFetchResult<T> {
  success: true;
  data: T;
}

export interface IFailureFetchResult {
  success: false;
  error: {
    message: string;
    details?: {
      validationErrors?: string[];
    };
    metadata?: Record<string, unknown>;
  };
}

export type FetchResult<T> = ISuccessFetchResult<T> | IFailureFetchResult;
