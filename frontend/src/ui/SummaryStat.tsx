type SummaryStatProps = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
};


export function SummaryStat({
  label,
  value,
  tone = "neutral",
}: SummaryStatProps) {
  return (
    <div className={`summary-stat summary-stat-${tone}`}>
      <span className="summary-stat-label">{label}</span>
      <strong className="summary-stat-value">{value}</strong>
    </div>
  );
}
