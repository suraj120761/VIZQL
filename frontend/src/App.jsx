import React, { useState, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Bar, Pie, Doughnut, Line, PolarArea, Radar, Scatter, Bubble,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { FaChartBar, FaDatabase, FaTable, FaCommentDots } from "react-icons/fa";
import Navbar from "./Navbar";
import "./App.css";
import image from "./assets/image.png";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Tooltip,
  Legend
);

function App() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState([]);
  const [explanation, setExplanation] = useState("");
  const [sql, setSql] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visualType, setVisualType] = useState("bar");

  const pdfRef = useRef();

  const handleAsk = async () => {
    setLoading(true);
    setError("");
    setResult([]);
    setExplanation("");
    setSql("");

    try {
      const response = await axios.post("http://localhost:8000/api/ask/", { question });
      setResult(response.data.result);
      setExplanation(response.data.explanation);
      setSql(response.data.sql);
    } catch (err) {
      setError("❌ " + (err.response?.data?.error || "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const input = pdfRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("dashboard.pdf");
    });
  };

  const getLabelKey = () => {
    const keys = Object.keys(result[0] || {});
    return keys.find((key) => typeof result[0][key] === "string") || keys[0];
  };

  const getValueKey = () => {
    const keys = Object.keys(result[0] || {});
    return keys.find((key) => typeof result[0][key] === "number") || keys[1];
  };

  const isChartable = () => {
    if (!result || result.length === 0) return false;
    const keys = Object.keys(result[0]);
    return (
      keys.length >= 2 &&
      keys.some((k) => typeof result[0][k] === "number") &&
      keys.some((k) => typeof result[0][k] === "string")
    );
  };

  const chartData = () => {
    const labelKey = getLabelKey();
    const valueKey = getValueKey();
    const labels = result.map((row) => row[labelKey]);
    const values = result.map((row) => row[valueKey]);

    return {
      labels,
      datasets: [
        {
          label: valueKey,
          data: values,
          backgroundColor: [
            "#0d6efd", "#6610f2", "#a77dee", "#20c997",
            "#0dcaf0", "#6c757d", "#f43f5e", "#6366f1"
          ],
        },
      ],
    };
  };

  const chartStyles = {
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
    minHeight: "350px"
  };

  const renderChart = () => {
    const data = chartData();
    const keys = Object.keys(result[0] || {});
    const commonProps = {
      key: visualType,
      data,
      options: { responsive: true, maintainAspectRatio: false },
    };

    switch (visualType) {
      case "bar": return <div style={chartStyles}><Bar {...commonProps} /></div>;
      case "hbar": return <div style={chartStyles}><Bar {...commonProps} options={{ ...commonProps.options, indexAxis: "y" }} /></div>;
      case "pie": return <div style={chartStyles}><Pie {...commonProps} /></div>;
      case "doughnut": return <div style={chartStyles}><Doughnut {...commonProps} /></div>;
      case "line": return <div style={chartStyles}><Line {...commonProps} /></div>;
      case "polar": return <div style={chartStyles}><PolarArea {...commonProps} /></div>;
      case "radar": return <div style={chartStyles}><Radar {...commonProps} /></div>;
      case "scatter":
        if (keys.length >= 2) {
          return (
            <div style={chartStyles}>
              <Scatter
                key="scatter"
                data={{
                  datasets: [{
                    label: keys[1],
                    data: result.map(row => ({ x: row[keys[0]], y: row[keys[1]] })),
                    backgroundColor: "#2563eb"
                  }]
                }}
              />
            </div>
          );
        }
        return <p style={{ color: "gray" }}>Scatter chart needs 2 numeric fields.</p>;
      case "bubble":
        if (keys.length >= 3) {
          return (
            <div style={chartStyles}>
              <Bubble
                key="bubble"
                data={{
                  datasets: [{
                    label: keys[2],
                    data: result.map(row => ({
                      x: row[keys[0]], y: row[keys[1]],
                      r: Math.max(5, Math.min(20, Number(row[keys[2]]))) || 10
                    })),
                    backgroundColor: "#10b981"
                  }]
                }}
              />
            </div>
          );
        }
        return <p style={{ color: "gray" }}>Bubble chart needs 3 numeric fields.</p>;
      default:
        return <div style={chartStyles}><Bar {...commonProps} /></div>;
    }
  };

  return (
    <div className="container" style={{ paddingTop: "4rem", paddingBottom: "2rem" }}>
      <Navbar />

      <div style={{ display: "flex", justifyContent: "center" }}>
        <h1 style={{
          display: "flex", alignItems: "center", gap: "12px",
          fontSize: "1.8rem", fontWeight: "700", color: "#0f265c", marginBottom: "1.5rem"
        }}>
          <img src={image} alt="Logo" style={{
            width: "40px", height: "40px", objectFit: "cover",
            borderRadius: "50%", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)", backgroundColor: "#fff"
          }} />
          NL to SQL Chart Dashboard
        </h1>
      </div>

      <textarea
        style={{ width: "100%", padding: "0.6rem", border: "1px solid #ccc", borderRadius: "6px" }}
        placeholder="Ask a question like 'How many employees in each department?'"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
      />

      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <button
          onClick={handleAsk}
          disabled={loading || !question}
          style={{
            padding: "0.6rem 1.2rem", backgroundColor: "#2563eb",
            color: "#fff", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer"
          }}
        >
          {loading ? "Asking..." : "Ask"}
        </button>

        {result.length > 0 && (
          <button
            onClick={downloadPDF}
            style={{
              padding: "0.6rem 1.2rem", backgroundColor: "#16a34a",
              color: "#fff", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer"
            }}
          >
            📄 Download PDF
          </button>
        )}
      </div>

      {error && <div style={{ color: "red", marginTop: "1rem", fontWeight: "bold" }}>{error}</div>}

      <div ref={pdfRef}>
        {sql && (
          <div style={{ marginTop: "1.5rem", backgroundColor: "#f9f9f9", padding: "1rem", borderRadius: "6px" }}>
            <h3><FaDatabase /> SQL Query</h3>
            <pre>{sql}</pre>
          </div>
        )}

        {sql && (
          <div style={{ marginTop: "1rem" }}>
            <label style={{ marginRight: "0.5rem" }}><FaChartBar /> Chart Type:</label>
            <select
              value={visualType}
              onChange={(e) => setVisualType(e.target.value)}
              style={{ padding: "0.4rem", borderRadius: "4px" }}
            >
              <option value="bar">Bar</option>
              <option value="hbar">Horizontal Bar</option>
              <option value="pie">Pie</option>
              <option value="doughnut">Doughnut</option>
              <option value="line">Line</option>
              <option value="polar">Polar</option>
              <option value="radar">Radar</option>
              <option value="scatter">Scatter</option>
              <option value="bubble">Bubble</option>
            </select>
          </div>
        )}

        {isChartable() && (
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <h3><FaChartBar /> Chart Output</h3>
            {renderChart()}
          </div>
        )}

        {!isChartable() && result.length > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <h3><FaTable /> Raw Output</h3>
            <pre style={{ backgroundColor: "#f4f4f4", padding: "1rem", borderRadius: "6px", overflowX: "auto" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {explanation && (
          <div style={{ marginTop: "1.5rem", backgroundColor: "#f9f9f9", padding: "1rem", borderRadius: "6px" }}>
            <h3><FaCommentDots /> Explanation</h3>
            <p>{explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
