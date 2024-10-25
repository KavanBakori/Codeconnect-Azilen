import React, { useState } from "react";
import { v4 as uuid } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const navigate = useNavigate();

  const generateRoomId = (e) => {
    e.preventDefault();
    const Id = uuid();
    setRoomId(Id);
    toast.success("Room Id is generated");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("Both the field is requried");
      return;
    }

    // redirect
    navigate(`/editor/${roomId}`, {
      state: {
        username,
      },
    });
    toast.success("room is created");
  };

  // when enter then also join
  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  return (
    <div className="container-fluid" style={{ background: 'linear-gradient(to right, #00c6ff, #0072ff)', minHeight: '100vh' }}>
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-12 col-md-6">
          <div className="card shadow-lg p-4 mb-5 bg-white rounded" style={{ borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div className="card-body text-center">
              <h1 className="text-primary font-weight-bold animate__animated animate__fadeInDown" style={{ fontSize: '2.5rem' }}>CodeConnect</h1>
              <br />
              <h4 className="card-title text-secondary mb-4" style={{ fontSize: '1.5rem' }}>Enter the ROOM ID</h4>

              <div className="form-group">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="form-control mb-3 shadow-sm"
                  placeholder="ROOM ID"
                  onKeyUp={handleInputEnter}
                  style={{
                    borderRadius: '30px',
                    border: '1px solid #007bff',
                    transition: 'border-color 0.3s ease',
                    padding: '12px 20px'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#00c6ff')}
                  onBlur={(e) => (e.target.style.borderColor = '#007bff')}
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-control mb-3 shadow-sm"
                  placeholder="USERNAME"
                  onKeyUp={handleInputEnter}
                  style={{
                    borderRadius: '30px',
                    border: '1px solid #007bff',
                    transition: 'border-color 0.3s ease',
                    padding: '12px 20px'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#00c6ff')}
                  onBlur={(e) => (e.target.style.borderColor = '#007bff')}
                />
              </div>
              <button
                onClick={joinRoom}
                className="btn btn-primary btn-lg btn-block shadow-sm"
                style={{
                  borderRadius: '30px',
                  padding: '12px',
                  transition: 'background-color 0.3s ease, transform 0.3s ease'
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#0056b3')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#007bff')}
              >
                JOIN
              </button>
              <p className="mt-4 text-dark">
                Don't have a room ID? create{" "}
                <span
                  onClick={generateRoomId}
                  className="text-blue-100 font-weight-bold"
                  style={{ cursor: "pointer", textDecoration: 'underline' }}
                >
                  New Room
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>


  );
}

export default Home;
