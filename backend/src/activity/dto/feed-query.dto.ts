import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class FeedQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  cursor?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
