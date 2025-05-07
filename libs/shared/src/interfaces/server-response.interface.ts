export interface IServerSuccessResponse<T> {
  status: "success";
  payload: {
    data: T;
  };
}

export interface IServerErrorResponse {
  status: "error";
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}
