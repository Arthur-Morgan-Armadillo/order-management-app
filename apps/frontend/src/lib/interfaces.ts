export interface IOrder {
  id: string;
  createdAt: string;
  quantity: number;
  totalPrice: string;
  userId: string;
  productId: string;
}

export interface IOrderWithRelations extends IOrder {
  user?: IUser;
  product?: IProduct;
}

export interface IOrderWithRelationsSanitized
  extends Omit<IOrder, 'userId' | 'productId'> {
  user?: Omit<IUser, 'email'>;
  product?: Omit<IProduct, 'stock'>;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  balance: string;
}

export interface IUserWithRelations extends IUser {
  orders: IOrderWithRelations[];
}

export interface IProduct {
  id: string;
  name: string;
  price: string;
  stock: number;
}

export interface IProductWithRelations extends IProduct {
  orders?: IOrderWithRelations[];
}

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

enum EStatus {
  Success = 'success',
  Error = 'error',
}

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
