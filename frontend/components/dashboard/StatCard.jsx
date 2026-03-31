export default function StatCard({ label, value, sub, accent, loading }) {
  if (loading)
    return (
      <div className="card" style={{ padding: "24px" }}>
        <div
          className="skeleton"
          style={{ width: "60%", height: "12px", marginBottom: "16px" }}
        />
        <div
          className="skeleton"
          style={{ width: "40%", height: "32px", marginBottom: "8px" }}
        />
        <div className="skeleton" style={{ width: "50%", height: "10px" }} />
      </div>
    );
  return (
    <div className="card animate-fadeUp" style={{ padding: "24px" }}>
      <p
        style={{
          fontSize: "11px",
          fontWeight: "500",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "10px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "36px",
          fontWeight: "700",
          color: accent || "var(--text-primary)",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginTop: "8px",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}