import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MakeQR Pro — Free QR Code Generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #f5f3ff 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Background grid dots */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, #6366f130 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Logo block */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            boxShadow: "0 20px 60px #6366f140",
          }}
        >
          <span style={{ color: "white", fontSize: 56, fontWeight: 900 }}>Q</span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "#111827",
            letterSpacing: "-2px",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          MakeQR<span style={{ color: "#6366f1" }}>.pro</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#6b7280",
            textAlign: "center",
            maxWidth: 700,
            marginBottom: 40,
            lineHeight: 1.4,
          }}
        >
          Free QR Code Generator — URL, WiFi, Contact, SMS &amp; more
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: 16 }}>
          {["Free · No signup", "PNG + SVG download", "Bulk generator"].map((b) => (
            <div
              key={b}
              style={{
                background: "white",
                border: "2px solid #e5e7eb",
                borderRadius: 50,
                padding: "10px 24px",
                fontSize: 20,
                color: "#374151",
                fontWeight: 600,
                boxShadow: "0 4px 12px #0000000d",
              }}
            >
              {b}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
