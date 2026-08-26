import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** Validate editable profile fields. */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string | null;

  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value) ? value.map((item) => Number(item)) : value,
  )
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsInt({ each: true })
  @Min(1, { each: true })
  topPicks?: number[];
}
