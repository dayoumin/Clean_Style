import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: "3rem",
          fontWeight: 700,
          color: "var(--color-primary)",
          marginBottom: "0.25rem",
          lineHeight: 1,
        }}
      >
        404
      </p>
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "var(--color-text)",
          marginBottom: "0.5rem",
        }}
      >
        페이지를 찾을 수 없어요
      </h2>
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--color-text)",
          opacity: 0.6,
          marginBottom: "1.5rem",
        }}
      >
        요청하신 페이지가 존재하지 않거나 이동되었어요.
      </p>
      <Link
        href="/"
        style={{
          padding: "0.625rem 1.25rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "var(--color-primary)",
          color: "#fff",
          fontSize: "0.875rem",
          textDecoration: "none",
          cursor: "pointer",
        }}
      >
        처음으로
      </Link>
    </div>
  );
}
