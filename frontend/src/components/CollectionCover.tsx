export function CollectionCover({ coverPosters }: { coverPosters: string[] }) {
  return (
    <div className="grid grid-cols-2 aspect-square">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-700 overflow-hidden">
          {coverPosters[i] ? (
            <img src={coverPosters[i]} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : null}
        </div>
      ))}
    </div>
  );
}
