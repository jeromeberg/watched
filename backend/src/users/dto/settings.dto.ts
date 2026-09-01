import { Visibility } from '@prisma/client';
import { IsEnum } from 'class-validator';

/** Validate the visibility applied to a user's library and collections. */
export class UpdateSettingsDto {
  @IsEnum(Visibility)
  visibility: Visibility;
}
