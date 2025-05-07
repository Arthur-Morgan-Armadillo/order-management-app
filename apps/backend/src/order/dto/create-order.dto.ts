import {
  IsDefined,
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsNumberString,
} from 'class-validator';

export class CreateOrderDto {
  @IsDefined({ message: 'User ID is required' })
  @IsString({
    message: 'User ID must be a valid string',
  })
  @IsNotEmpty({
    message: 'User ID must not be empty',
  })
  @IsUUID(4, {
    message: 'User ID must be a valid UUID',
  })
  readonly userId!: string;

  @IsDefined({ message: 'Product ID is required' })
  @IsString({
    message: 'Product ID must be a valid string',
  })
  @IsNotEmpty({
    message: 'Product ID must not be empty',
  })
  @IsUUID(4, {
    message: 'Product ID must be a valid UUID',
  })
  readonly productId!: string;

  @IsDefined({ message: 'Quantity is required' })
  @IsNumber(
    {
      allowInfinity: false,
      allowNaN: false,
    },
    {
      message: 'Quantity must be a valid number',
    },
  )
  @Min(1, {
    message: 'Quantity must be at least 1',
  })
  readonly quantity!: number;

  @IsDefined({ message: 'Total price is required' })
  @IsNotEmpty({ message: 'Total price must not be empty' })
  @IsNumberString({}, { message: 'Total price must be a valid number string' })
  readonly totalPrice!: string;
}
