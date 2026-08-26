import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Validate a title returned by the current TMDB search flow. */
export class AddTitleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tmdbId: number;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  posterUrl?: string | null;

  @Transform(({ value }: { value: unknown }) =>
    value === null || value === undefined ? value : Number(value),
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9999)
  releaseYear?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  director?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;
}
