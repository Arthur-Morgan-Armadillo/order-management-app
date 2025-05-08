import {
  ExceptionFilter,
  Catch,
  Logger,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { IServerErrorResponse, EStatus } from '@/common';

type ValidationErrorMessage = { message: string | string[] };

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name, {
    timestamp: true,
  });

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let httpStatus: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage: string = 'Something went wrong';
    let errorName: string = 'InternalServerException';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      errorMessage = exception.message;
      errorName = exception.name;

      if (exception instanceof BadRequestException) {
        const responseBody = exception.getResponse();

        if (
          typeof responseBody === 'object' &&
          responseBody !== null &&
          (responseBody as ValidationErrorMessage).message
        ) {
          const message = (responseBody as ValidationErrorMessage).message;
          if (Array.isArray(message)) {
            errorMessage = message.join('; ');
          } else if (typeof message === 'string') {
            errorMessage = message;
          } else {
            errorMessage = 'Invalid input data';
          }
        }
      }

      if (
        !(
          exception instanceof NotFoundException ||
          exception instanceof BadRequestException ||
          httpStatus === HttpStatus.TOO_MANY_REQUESTS
        )
      ) {
        this.logger.warn(
          `Unexpected HTTP Exception: ${errorName} - ${errorMessage} - ${request.method} ${request.url}`,
        );
        httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Internal server error';
        errorName = 'InternalServerError';
      }
    } else {
      this.logger.error(
        `Non-HTTP Exception: ${exception} - ${request.method} ${request.url}`,
      );
    }

    const responseBody: IServerErrorResponse = {
      status: EStatus.Error,
      statusCode: httpStatus,
      message: errorMessage,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    httpAdapter.reply(response, responseBody, httpStatus);
  }
}
