'use server';

import { revalidatePath } from 'next/cache';
import { getLogger } from './logger';
import {
  constructUrl,
  handleFetch,
  containsSemicolonSpace,
  splitBySemicolonSpace,
} from './utils';
import type { FetchResult } from './interfaces';
import type {
  IUser,
  IProduct,
  IOrder,
  IOrderWithRelationsSanitized,
} from '@shared/interfaces';

export const fetchAllUsers = async (): Promise<FetchResult<IUser[]>> => {
  const logger = getLogger();
  logger.info('Attempting to fetch all users');

  try {
    const url = constructUrl('users');
    logger.debug(`Constructed URL for fetching users ${url}`);

    const response = await handleFetch<IUser[]>(url, {
      cache: 'no-store',
    });
    logger.info('Successfully fetched users');
    return { success: true, data: response.payload.data };
  } catch (err) {
    logger.error('Failed to fetch users:', err);
    return {
      success: false,
      error: {
        message:
          'Failed to retrieve user list. ' +
          (err instanceof Error ? err.message : 'Unknown error'),
      },
    };
  }
};

export const fetchAllProducts = async (): Promise<FetchResult<IProduct[]>> => {
  const logger = getLogger();
  logger.info('Attempting to fetch all products');

  try {
    const url = constructUrl('products');
    logger.debug(`Constructed URL for fetching products ${url}`);

    const response = await handleFetch<IProduct[]>(url, {
      cache: 'no-store',
    });
    logger.info('Successfully fetched products');
    return { success: true, data: response.payload.data };
  } catch (err) {
    logger.error('Failed to fetch products:', err);
    return {
      success: false,
      error: {
        message:
          'Failed to retrieve product list. ' +
          (err instanceof Error ? err.message : 'Unknown error'),
      },
    };
  }
};

export const fetchAllOrdersByUserId = async (
  userId: string
): Promise<FetchResult<IOrderWithRelationsSanitized[]>> => {
  const logger = getLogger();
  logger.info(`Attempting to fetch orders for user ${userId}`);

  try {
    const url = constructUrl(`orders/${userId}`);
    logger.debug(`Constructed URL for fetching user orders ${url}`);

    const response = await handleFetch<IOrderWithRelationsSanitized[]>(url, {
      cache: 'no-store',
    });
    logger.info(`Successfully fetched orders for user ${userId}`);
    return { success: true, data: response.payload.data };
  } catch (err) {
    logger.error(`Failed to fetch orders for user ${userId}`, err);
    return {
      success: false,
      error: {
        message:
          "Failed to retrieve user's order list. " +
          (err instanceof Error ? err.message : 'Unknown error'),
      },
    };
  }
};

export const createOrder = async (
  order: Omit<IOrder, 'id' | 'createdAt'>
): Promise<FetchResult<IOrder>> => {
  const logger = getLogger();
  logger.info('Attempting to create order', {
    orderPayload: { ...order },
  });

  try {
    const url = constructUrl('orders');
    logger.debug(`Constructed URL for creating order ${url}`);

    const response = await handleFetch<IOrder>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });

    logger.info(`Successfully created order ${response.payload.data.id}`);
    revalidatePath('/');
    return { success: true, data: response.payload.data };
  } catch (err) {
    logger.error('Failed to create order:', {
      err,
      orderPayload: { ...order },
    });

    let errorMessage: string = 'Failed to create order. ';
    const errorDetails: Record<string, unknown> = {};

    if (err instanceof Error) {
      const validationErrors = containsSemicolonSpace(err.message)
        ? splitBySemicolonSpace(err.message)
        : null;

      if (validationErrors) {
        errorMessage = 'Validation failed';
        errorDetails.validationErrors = validationErrors;
      } else {
        errorMessage += err.message;
      }
    } else {
      errorMessage += 'Unknown error';
    }

    return {
      success: false,
      error: {
        message: errorMessage,
        details: errorDetails,
      },
    };
  }
};
