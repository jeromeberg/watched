import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

/** Validate the selected TMDB identifier. */
export class AddTitleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tmdbId: number;
}
