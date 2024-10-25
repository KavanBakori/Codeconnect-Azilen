import React, { useEffect, useRef, useState } from "react";
import Client from "./Client";
import Editor from "./Editor";
import { initSocket } from "../Socket";
import { ACTIONS } from "../Actions";
import { useNavigate, useLocation, Navigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

// Set the only supported language
const LANGUAGES = ["cpp"];

function EditorPage() {
  const [clients, setClients] = useState([]);
  const [output, setOutput] = useState("");
  const [isCompileWindowOpen, setIsCompileWindowOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const selectedLanguage = "cpp"; // Hardcoded language
  const codeRef = useRef(""); // Initialize with an empty string

  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();

  const socketRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();

      const handleErrors = (err) => {
        console.log("Error", err);
        toast.error("Socket connection failed, Try again later");
        setTimeout(() => navigate("/"), 3000);
      };

      socketRef.current.on("connect_error", handleErrors);
      socketRef.current.on("connect_failed", handleErrors);

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room.`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) => prev.filter((client) => client.socketId !== socketId));
      });
    };
    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      }
    };
  }, [location.state?.username, navigate, roomId]);

  if (!location.state) {
    return <Navigate to="/" />;
  }

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success(`Room ID is copied`);
    } catch (error) {
      console.log(error);
      toast.error("Unable to copy the room ID");
    }
  };

  const leaveRoom = () => {
    navigate("/");
  };

  const runCode = async () => {
    setIsCompiling(true);
    try {
      const response = await axios.post("http://localhost:5000/compile", {
        code: codeRef.current,
        language: selectedLanguage,
      });

      console.log("Backend response:", response.data);
      setOutput(response.data.output || JSON.stringify(response.data));
    } catch (error) {
      console.error("Error compiling code:", error);
      setOutput(error.response?.data?.error || "An error occurred");
    } finally {
      setIsCompiling(false);
    }
  };

  const toggleCompileWindow = () => {
    setIsCompileWindowOpen(!isCompileWindowOpen);
  };

  return (
    <div className="container-fluid vh-100 text-white d-flex flex-column" style={{ background: 'linear-gradient(to right, #00c6ff, #0072ff)' }}>
      <div className="row flex-grow-1">
        {/* Client panel */}
        <div className="col-md-2 d-flex flex-column p-4" style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          boxShadow: '4px 0 15px rgba(0, 0, 0, 0.3)',
          borderRight: '1px solid #2a2a4a'
        }}>
          {/* Logo Section */}
          <h2 style={{
            background: 'linear-gradient(45deg, #4a90e2, #63b3ed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '1.8rem',
            fontWeight: '500',
            letterSpacing: '1px',
            // textTransform: 'uppercase'
          }}>
            CodeConnect
          </h2>
          <hr />


          {/* Members Section */}
          <div className="flex-grow-1 overflow-auto px-2" style={{
            background: 'rgba(26, 32, 44, 0.4)',
            borderRadius: '12px',
            padding: '1rem',
           
          }}>
            <span style={{
              color: '#63b3ed',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              fontWeight: '600'
            }}>
              Members
            </span>
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>

          {/* Buttons Section */}
          <div className="mt-4">
            <button
              className="btn w-100 mb-3"
              onClick={copyRoomId}
              style={{
                background: 'rgba(66, 153, 225, 0.1)',
                border: '2px solid rgba(66, 153, 225, 0.2)',
                color: '#63b3ed',
                padding: '0.75rem',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(66, 153, 225, 0.2)';
                e.currentTarget.style.borderColor = '#63b3ed';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(66, 153, 225, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(66, 153, 225, 0.2)';
              }}
            >
              <i className="bi bi-clipboard me-2"></i> Copy Room ID
            </button>
            <button
              className="btn w-100"
              onClick={leaveRoom}
              style={{
                background: 'rgba(245, 101, 101, 0.1)',
                border: '2px solid rgba(245, 101, 101, 0.2)',
                color: '#fc8181',
                padding: '0.75rem',
                transition: 'all 0.3s ease',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(245, 101, 101, 0.2)';
                e.currentTarget.style.borderColor = '#fc8181';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(245, 101, 101, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(245, 101, 101, 0.2)';
              }}
            >
              <i className="bi bi-door-open me-2"></i> Leave Room
            </button>
          </div>
        </div>

        {/* Editor panel */}
        <div className="col-md-10 d-flex flex-column p-4">
          <Editor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              codeRef.current = code; // Keep track of the current code
            }}
          />
        </div>
      </div>

      {/* Compiler toggle button */}
      {/* <button
        className="btn btn-primary position-fixed bottom-0 end-0 m-3 animate__animated animate__fadeIn"
        onClick={toggleCompileWindow}
        style={{ zIndex: 1050 }}
      >
        {isCompileWindowOpen ? "Close Compiler" : "Open Compiler"}
      </button>

      
      <div
        className={`bg-dark text-light p-3 animate__animated ${
          isCompileWindowOpen ? "d-block animate__fadeInUp" : "d-none"
        }`}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: isCompileWindowOpen ? "30vh" : "0",
          transition: "height 0.3s ease-in-out",
          overflowY: "auto",
          zIndex: 1040,
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="m-0">Compiler Output ({selectedLanguage})</h5>
          <div>
            <button
              className="btn btn-success me-2"
              onClick={runCode}
              disabled={isCompiling}
            >
              {isCompiling ? "Compiling..." : "Run Code"}
            </button>
            <button className="btn btn-secondary" onClick={toggleCompileWindow}>
              Close
            </button>
          </div>
        </div>
        <pre className="bg-secondary p-3 rounded">
          {output || "Output will appear here after compilation"}
        </pre>
      </div> */}
    </div>
  );
}

export default EditorPage;
