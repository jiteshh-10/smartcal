import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Draggable from "react-draggable";

export default function DrawToCalculate() {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("rgb(255, 255, 255)");
  const [reset, setReset] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [result, setResult] = useState();
  const [latexExpression, setLatexExpression] = useState([]);
  const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
  const [dictOfVars, setDictOfVars] = useState({});

  // Ref for LaTeX box
  const latexRef = useRef(null);

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setLatexExpression([]);
      setResult(undefined);
      setDictOfVars({});
      setReset(false);
    }
  }, [reset]);

  useEffect(() => {
    if (latexExpression.length > 0 && window.MathJax) {
      setTimeout(() => {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      }, 0);
    }
  }, [latexExpression]);

  useEffect(() => {
    if (result) {
      renderLatexToCanvas(result.expression, result.answer);
    }
  }, [result]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - canvas.offsetTop;
        ctx.lineCap = "round";
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
      }
    }
  }, [color, lineWidth]);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setHistory([...history, canvas.toDataURL()]);
    }
  };

  const undo = () => {
    if (history.length > 0) {
      const lastState = history.pop();
      setRedoStack([lastState, ...redoStack]);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = history[history.length - 1] || "";
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack.shift();
      setHistory([...history, nextState]);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = nextState || "";
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setHistory([]);
      setRedoStack([]);
    }
  };

  const renderLatexToCanvas = (expression, answer) => {
    const latex = `${expression} = ${answer}`;
    setLatexExpression([...latexExpression, latex]);
  };

  const sendData = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/calculator/calculate`,
          {
            image: canvas.toDataURL("image/png"),
            dict_of_vars: dictOfVars,
          }
        );

        const respData = response.data.data;
        console.log('Response data:', respData); 
        respData.forEach((data) => {
          if (data.assign === true) {
            setDictOfVars({
              ...dictOfVars,
              [data.expr]: data.result,
            });
          }
        });

        const ctx = canvas.getContext("2d");
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        let minX = canvas.width,
          minY = canvas.height,
          maxX = 0,
          maxY = 0;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            if (imageData.data[(y * canvas.width + x) * 4 + 3] > 0) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        setLatexPosition({ x: centerX, y: centerY });

        respData.forEach((data) => {
          setTimeout(() => {
            setResult({
              expression: data.expr,
              answer: data.result,
            });
          }, 200);
        });
      } catch (error) {
        console.error("Error while sending data:", error);
      }
    }
  };

  const startDrawing = (e) => {
    saveHistory();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = isEraser ? "black" : color;
        ctx.lineWidth = lineWidth;
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  const buttonStyle = {
    padding: "8px 12px",
    backgroundColor: "#2e2e2e",
    color: "white",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
    marginLeft: "5px",
    marginRight: "5px",
    transition: "background-color 0.3s",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        margin: "0",
        padding: "0",
      }}
    >
      {/* Navbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 5px 10px 1px",
          backgroundColor: "#222",
          color: "#fff",
          fontSize: "24px",
          position: "absolute",
          width: "100%",
          height: "45px",
          top: "0",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={buttonStyle}
        >
          &#8592;
        </button>
        <span>DrawToCalculate</span>
        <button
          onClick={() => setIsEraser(!isEraser)}
          style={buttonStyle}
        >
          {isEraser ? "Eraser" : "Pen"}
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: "60px",
          left: 0,
          width: "100%",
          height: "87%",
          border: "1px #ddd",
          backgroundColor: "black",
          cursor: "crosshair",
        }}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onMouseMove={draw}
      ></canvas>

        
      

      {/* Controls */}
      <div
        style={{
          display: "flex",
          backgroundColor: '#1e1e1e',
          justifyContent: "space-between",
          position: "absolute",
          width: "100%",
          bottom: "0",
          padding: '7px'
        }}
      >
       <div>
        <button
          onClick={undo}
          style={buttonStyle}
        >
          Undo
        </button>
        <button
          onClick={redo}
          style={buttonStyle}
        >
          Redo
        </button>
        </div>
        
        {/* Color Palette and Size Controls */}
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    {/* Color Palette */}
    {["#FF5733", "#33FF57", "#3357FF", "#FFFF33", "#FF33FF", "#33FFFF", "#FFFFFF"].map((col) => (
      <div
        key={col}
        onClick={() => setColor(col)}
        style={{
          backgroundColor: col,
          width: "25px",
          height: "25px",
          borderRadius: "50%",
          border: "2px solid #333",
          cursor: "pointer",
        }}
      ></div>
    ))}

    {/* Pen and Eraser Size */}
    <div style={{ color: "white", display: "flex", alignItems: "center", gap: "5px" }}>
      <label>Size:</label>
      <select
        value={lineWidth}
        onChange={(e) => setLineWidth(Number(e.target.value))}
        style={{
          backgroundColor: "#2e2e2e",
          color: "white",
          border: "none",
          borderRadius: "5px",
          padding: "5px",
          cursor: "pointer",
        }}
      >
        <option value={2}>2px</option>
        <option value={4}>4px</option>
        <option value={6}>6px</option>
        <option value={8}>8px</option>
        <option value={10}>10px</option>
      </select>
    </div>
  </div>
        <div>
        <button
          onClick={resetCanvas}
          style={buttonStyle}
        >
          Reset
        </button>
        <button
          onClick={sendData}
          style={buttonStyle}
        >
          calculate
        </button>
        </div>
      </div>

      {/* Draggable LaTeX */}
      {latexExpression.map((latex, index) => (
        <Draggable
          key={index}
          bounds="parent"
          defaultPosition={{
            x: latexPosition.x,
            y: latexPosition.y,
          }}
        >
          <div
            ref={latexRef}
            style={{
              display: "flex",
              justifyContent: "center",
              fontSize: "1em",
              backgroundColor: "black",
              padding: "5px 5px",
              border: "1px gray",
              zIndex: 1,
              position: "absolute",
              top: 150,
              left: 50,
            }}
          >
           <span
               dangerouslySetInnerHTML={{ __html: latex }}
              style={{
                 backgroundColor: "black",
                color: "white",
                padding: "5px",
                borderRadius: "3px",
              }}
            ></span>

          </div>
        </Draggable>
      ))}



    </div>
  );
}
