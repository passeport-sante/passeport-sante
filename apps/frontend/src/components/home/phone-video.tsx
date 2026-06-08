"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function PhoneVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video
        ref={videoRef}
        src="/assets/video/Le%20savoir%2C%20c'est%20le%20pouvoir.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <button
        onClick={toggleMute}
        aria-label={muted ? "Activer le son" : "Couper le son"}
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.5)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          backdropFilter: "blur(4px)",
        }}
      >
        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>
    </div>
  );
}
