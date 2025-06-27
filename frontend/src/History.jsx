import React from "react";

function History() {
  const history = JSON.parse(localStorage.getItem("queryHistory")) || [];

  return (
    <div className="container" style={{ paddingTop: "4rem" }}>
      <h2 style={{ fontWeight: "bold", marginBottom: "1rem" }}>📚 Query History</h2>
      {history.length === 0 ? (
        <p>No history available.</p>
      ) : (
        <ul>
          {history.map((entry, index) => (
            <li key={index} style={{ marginBottom: "1rem", borderBottom: "1px solid #ccc", paddingBottom: "0.5rem" }}>
              <p><strong>🕒 {entry.timestamp}</strong></p>
              <p><strong>❓ Question:</strong> {entry.question}</p>
              <p><strong>🧾 SQL:</strong> <code>{entry.sql}</code></p>
              <p><strong>💬 Summary:</strong> {entry.explanation}</p>
              <p><strong>📊 Chart Type:</strong> {entry.visualType}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default History;
