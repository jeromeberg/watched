import { useState } from 'react';
import { api } from '../api/client';
import { Season, Episode } from '../types';
import { Text } from './Text';

interface ShowSeasonsProps {
  seasons: Season[];
  onSeasonsChange: (updater: (prev: Season[]) => Season[]) => void;
  isOtherUser: boolean;
}

export function ShowSeasons({ seasons, onSeasonsChange, isOtherUser }: ShowSeasonsProps) {
  const [openSeasons, setOpenSeasons] = useState<Set<number>>(new Set());

  async function toggleEpisode(season: Season, ep: Episode) {
    const nowWatched = !ep.watched;
    onSeasonsChange((prev) =>
      prev.map((s) =>
        s.id !== season.id
          ? s
          : {
              ...s,
              episodes: s.episodes.map((e) => (e.id === ep.id ? { ...e, watched: nowWatched } : e)),
            },
      ),
    );
    try {
      if (nowWatched) {
        await api.post(`/episodes/${ep.id}/watched`, {});
      } else {
        await api.delete(`/episodes/${ep.id}/watched`);
      }
    } catch {
      onSeasonsChange((prev) =>
        prev.map((s) =>
          s.id !== season.id
            ? s
            : {
                ...s,
                episodes: s.episodes.map((e) => (e.id === ep.id ? { ...e, watched: ep.watched } : e)),
              },
        ),
      );
    }
  }

  async function markSeasonAll(season: Season, watched: boolean) {
    const toToggle = season.episodes.filter((e) => e.watched !== watched);
    onSeasonsChange((prev) =>
      prev.map((s) =>
        s.id !== season.id ? s : { ...s, episodes: s.episodes.map((e) => ({ ...e, watched })) },
      ),
    );
    try {
      await Promise.all(
        toToggle.map((ep) =>
          watched ? api.post(`/episodes/${ep.id}/watched`, {}) : api.delete(`/episodes/${ep.id}/watched`),
        ),
      );
    } catch {
      const revertedIds = new Set(toToggle.map((ep) => ep.id));
      onSeasonsChange((prev) =>
        prev.map((s) =>
          s.id !== season.id
            ? s
            : {
                ...s,
                episodes: s.episodes.map((e) => (revertedIds.has(e.id) ? { ...e, watched: !watched } : e)),
              },
        ),
      );
    }
  }

  function toggleSeasonOpen(seasonId: number) {
    setOpenSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(seasonId)) {
        next.delete(seasonId);
      } else {
        next.add(seasonId);
      }
      return next;
    });
  }

  if (seasons.length === 0) {
    return <Text color="subtle">No episode data.</Text>;
  }

  return (
    <>
      {seasons.map((season) => {
        const sw = season.episodes.filter((e) => e.watched).length;
        const st = season.episodes.length;
        const allWatched = sw === st && st > 0;
        const isOpen = openSeasons.has(season.id);
        const seasonLabel =
          season.name && season.name !== `Season ${season.seasonNumber}`
            ? season.name
            : season.seasonNumber === 0
              ? 'Specials'
              : `Season ${season.seasonNumber}`;

        return (
          <div key={season.id} className="space-y-2">
            {/* Season header */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => toggleSeasonOpen(season.id)}
                className="flex items-center gap-2 text-left group"
              >
                <Text
                  as="span"
                  color="muted"
                  className="transition-transform duration-200"
                  style={{ display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'none' }}
                >
                  ▶
                </Text>
                <span className="text-sm">{seasonLabel}</span>
                <Text as="span" size="xs" color="subtle">
                  {sw}/{st}
                </Text>
              </button>

              {!isOtherUser && (
                <Text
                  as="button"
                  variant="link"
                  size="xs"
                  onClick={() => markSeasonAll(season, !allWatched)}
                  className="shrink-0"
                >
                  {allWatched ? 'Unmark all' : 'Mark all'}
                </Text>
              )}
            </div>

            {/* Episodes */}
            {isOpen && (
              <div className="space-y-0.5">
                {season.episodes.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => !isOtherUser && toggleEpisode(season, ep)}
                    disabled={isOtherUser}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left group ${
                      isOtherUser ? 'cursor-default' : 'hover:bg-gray-800'
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        ep.watched
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-600 group-hover:border-gray-400'
                      }`}
                    >
                      {ep.watched && (
                        <Text as="span" size="xs" color="white" className="leading-none">
                          ✓
                        </Text>
                      )}
                    </div>

                    <Text as="span" size="xs" color="subtle" className="w-8 shrink-0 font-mono">
                      E{String(ep.episodeNumber).padStart(2, '0')}
                    </Text>

                    <Text as="span" color={ep.watched ? 'muted' : 'white'} className="flex-1 truncate">
                      {ep.title}
                    </Text>

                    {ep.airDate && (
                      <Text as="span" size="xs" color="faint" className="shrink-0 hidden sm:block">
                        {ep.airDate.slice(0, 7)}
                      </Text>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
