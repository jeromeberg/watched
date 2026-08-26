import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const COLLECTION_NAME_MAX_LENGTH = 100;
const COLLECTION_DESCRIPTION_MAX_LENGTH = 500;

/** Validate fields used to create a collection. */
export class CreateCollectionDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(COLLECTION_NAME_MAX_LENGTH)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(COLLECTION_DESCRIPTION_MAX_LENGTH)
  description?: string | null;
}

/** Validate fields that may be changed on a collection. */
export class UpdateCollectionDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(COLLECTION_NAME_MAX_LENGTH)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(COLLECTION_DESCRIPTION_MAX_LENGTH)
  description?: string | null;
}

/** Validate one library title selected for a collection. */
export class AddCollectionItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  titleId: number;
}

/** Validate the optional collection filter title id. */
export class CollectionsQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  titleId?: number;
}
