export default function CategoryBadge({ category }) {
  if (!category) return <span className="text-slate-500 text-sm">Sem categoria</span>;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${category.color}20`,
        color: category.color,
      }}
    >
      {category.name}
    </span>
  );
}