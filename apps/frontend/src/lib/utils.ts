import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getLogger } from './logger';
import type {
  IServerSuccessResponse,
  IServerErrorResponse,
} from '@/lib/interfaces';

export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs));
};

export const constructUrl = (pathname: string): string => {
  const logger = getLogger();
  const baseUrl =
    process.env.API_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:5005/api/v1/'
      : undefined);

  if (!baseUrl) {
    const errorMessage = 'API_URL environment variable not defined';
    logger.error(errorMessage, { envVar: 'API_URL' });
    throw new Error(errorMessage);
  }

  if (!baseUrl) {
    const errorMessage = 'API_URL environment variable not defined';
    logger.error(errorMessage, { envVar: 'API_URL' });
    throw new Error(errorMessage);
  }

  try {
    return new URL(pathname, baseUrl).href;
  } catch (err) {
    const errorMessage = `Invalid URL: ${baseUrl}${pathname}`;
    logger.error(errorMessage, err);
    throw new Error(errorMessage);
  }
};

export const handleFetch = async <T>(
  url: string,
  options?: RequestInit
): Promise<IServerSuccessResponse<T>> => {
  const logger = getLogger();
  const method = options?.method ?? 'GET';
  logger.info(`Initiating fetch request. URL: ${url}; Method: ${method}`);

  try {
    const response = await fetch(url, options);
    const responseStatus = response.status;

    if (!response.ok) {
      let errorData: IServerErrorResponse | null = null;
      let errorMessage =
        `Fetch failed for URL ${url} with method ${method}. ` +
        `Responded with status ${responseStatus}. `;

      let logContext: Record<string, unknown> = {
        url,
        method,
        status: responseStatus,
      };

      try {
        errorData = await response.json();
        logContext = {
          ...logContext,
          apiError: errorData,
        };

        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseErr) {
        logger.warn(
          `Failed to parse JSON error response body from API. Status: ${responseStatus}.`,
          { ...logContext, parseError: parseErr }
        );
        throw new Error(
          `Request failed with status ${responseStatus}, ` +
            `and error response body was not valid JSON.`
        );
      }

      logger.error(
        `Error response received from API: ${errorMessage}`,
        logContext
      );
      throw new Error(errorMessage);
    }

    try {
      const data: IServerSuccessResponse<T> = await response.json();
      logger.debug(
        `Successfully fetched and parsed API response. ` +
          `URL: ${url}; Method: ${method}; Status: ${responseStatus}`
      );

      return data;
    } catch (parseErr) {
      const errorMessage =
        `Successfully fetched but failed to parse success response: ` +
        `URL: ${url}; Method: ${method}; Status: ${responseStatus}`;

      logger.error(errorMessage, parseErr);

      throw new Error(
        'API returned successful status, but response body was not valid JSON.'
      );
    }
  } catch (err) {
    logger.error(`Error during fetch operation for ${method} ${url}`, {
      error: err,
    });

    if (err instanceof Error) {
      throw err;
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
};

export const containsSemicolonSpace = (input: string): boolean => {
  return input.includes('; ');
};

export const splitBySemicolonSpace = (text: string): string[] =>
  text.split('; ').map((s) => s.trim());
