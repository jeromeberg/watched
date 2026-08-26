import { NotFoundException } from '@nestjs/common';
import { TitleType } from '@prisma/client';

export const TITLE_ROUTES = {
  movies: { type: TitleType.MOVIE },
  shows: { type: TitleType.TV },
} as const;

/** Resolve a public library route to its title type. */
export function titleTypeForRoute(route: string): TitleType {
  const config = TITLE_ROUTES[route as keyof typeof TITLE_ROUTES];
  if (!config) throw new NotFoundException('Title library not found');
  return config.type;
}
