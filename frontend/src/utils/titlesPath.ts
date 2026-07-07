import { MediaType, MEDIA, mediaTypeOf } from '../types';

export type BasePath = string | ((title: { type?: string }) => string);

export function pathFor(
  title: { type?: string },
  type: MediaType | undefined,
  basePath: BasePath | undefined,
): string {
  if (typeof basePath === 'function') return basePath(title);
  if (basePath) return basePath;
  return `/${MEDIA[type ?? mediaTypeOf(title.type ?? 'MOVIE')].path}`;
}
