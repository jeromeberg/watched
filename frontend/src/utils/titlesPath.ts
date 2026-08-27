import { MediaType, MEDIA, TitleType, mediaTypeOf } from '../types';

type PathTitle = { type: TitleType };

export type BasePath = string | ((title: PathTitle) => string);

export function pathFor(
  title: PathTitle,
  type: MediaType | undefined,
  basePath: BasePath | undefined,
): string {
  if (typeof basePath === 'function') return basePath(title);
  if (basePath) return basePath;
  return `/${MEDIA[type ?? mediaTypeOf(title.type)].path}`;
}
