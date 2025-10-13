import { useState } from "react";

export const DetailedData = ({
  dataToGet,
}: {
  dataToGet: Record<string, any>;
}) => {
  const [showData, setShowData] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h2>Ready</h2>

      <button
        style={{
          margin: "0.5rem",
          borderRadius: "5px",
        }}
        onClick={() => setShowData(!showData)}
      >
        {showData ? "Hide data" : "Show data"}
      </button>

      {/* Detailed data */}
      {showData && (
        <div
          style={{
            color: "black",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            backgroundColor: "#f0f0f0",
            textAlign: "left",
            padding: "1rem",
            marginTop: "1rem",
            maxWidth: "60%",
            fontFamily: "monospace",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        >
          {"{"}
          <div style={{ marginLeft: "1rem" }}>
          {Object.entries(dataToGet).map(([key, value]) => (
            <div key={key} style={{ marginBottom: "0rem" }}>
              {`"${key}": ${
                typeof value === "object"
                  ? JSON.stringify(
                      value,
                      (k, v) => (typeof v === "bigint" ? v.toString() : v),
                      2
                    )
                  : value
              } `}
            </div>
          ))}
          </div>
          {"}"}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ marginTop: "1rem" }}>
        <button
          style={{
            padding: "0.5rem",
            margin: "0.5rem",
            borderRadius: "5px",
          }}
          onClick={() =>
            navigator.clipboard.writeText(
              JSON.stringify(
                dataToGet,
                (key, value) =>
                  typeof value === "bigint" ? value.toString() : value,
                2
              )
            )
          }
        >
          Copy for JSON
        </button>
      </div>
    </div>
  );
};
