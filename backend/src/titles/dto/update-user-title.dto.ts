import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { WatchStatus } from '@prisma/client';

/** Validate editable fields for one title in a user's library. */
export class UpdateUserTitleDto {
  @Transform(({ value }: { value: unknown }) =>
    value === null || value === undefined ? value : Number(value),
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number | null;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsOptional()
  @IsEnum(WatchStatus)
  status?: WatchStatus | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
