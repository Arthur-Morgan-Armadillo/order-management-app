import type { EStatus } from '../enums';

export interface IServerSuccessResponse<T> {
  status: EStatus.Success;
  payload: {
    data: T;
  };
}

export interface IServerErrorResponse {
  status: EStatus.Error;
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}
