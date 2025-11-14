import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Camera, Power, AlertCircle, Loader, Eye, EyeOff, Sparkles } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';
import * as THREE from 'three';

/**
 * ASU Sparky AR Face Filter
 * Using face-api.js for face detection + Three.js for 3D AR rendering
 */

// 3D Devil Horns Component
function DevilHorns({ landmarks, videoWidth, videoHeight, opacity, color, size = 1.0, style = 'devil' }) {
  const hornsGroupRef = useRef();

  useFrame(() => {
    if (!landmarks || !hornsGroupRef.current) return;

    const positions = landmarks.positions;
    const leftEyebrow = positions[19];
    const rightEyebrow = positions[24];
    const noseBridge = positions[27];

    // Convert from video coordinates to Three.js normalized coordinates
    const headCenterX = ((noseBridge._x / videoWidth) * 2 - 1);
    const headCenterY = -((noseBridge._y / videoHeight) * 2 - 1);

    // Calculate head rotation based on eyebrow positions
    const headAngle = Math.atan2(
      rightEyebrow._y - leftEyebrow._y,
      rightEyebrow._x - leftEyebrow._x
    );

    // Position the group at the top of the head
    hornsGroupRef.current.position.set(headCenterX, headCenterY + 0.4, 0);

    // Rotate the entire horn group with the head (inverted)
    hornsGroupRef.current.rotation.z = -headAngle;

    // Apply scale
    hornsGroupRef.current.scale.set(size, size, size);
  });

  // Different horn styles
  const renderHorns = () => {
    switch (style) {
      case 'curved':
        // Curved horns pointing backward
        return (
          <>
            <mesh position={[-0.25, 0, 0]} rotation={[Math.PI / 6, 0, Math.PI / 4]}>
              <coneGeometry args={[0.08, 0.35, 8]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.3}
              />
            </mesh>
            <mesh position={[0.25, 0, 0]} rotation={[Math.PI / 6, 0, -Math.PI / 4]}>
              <coneGeometry args={[0.08, 0.35, 8]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.3}
              />
            </mesh>
          </>
        );
      case 'straight':
        // Straight upward horns
        return (
          <>
            <mesh position={[-0.25, 0, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.06, 0.4, 8]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.3}
              />
            </mesh>
            <mesh position={[0.25, 0, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.06, 0.4, 8]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.3}
              />
            </mesh>
          </>
        );
      default: // 'devil'
        // Classic devil horns angled outward
        return (
          <>
            <mesh position={[-0.25, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
              <coneGeometry args={[0.08, 0.3, 8]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.3}
              />
            </mesh>
            <mesh position={[0.25, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <coneGeometry args={[0.08, 0.3, 8]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.3}
              />
            </mesh>
          </>
        );
    }
  };

  return (
    <group ref={hornsGroupRef}>
      {renderHorns()}
    </group>
  );
}

// 3D ASU Sunglasses Component
function Sunglasses({ landmarks, videoWidth, videoHeight, opacity, color, size = 1.0, style = 'rectangular' }) {
  const glassesRef = useRef();

  useFrame(() => {
    if (!landmarks) return;

    const positions = landmarks.positions;
    const leftEye = positions[36];
    const rightEye = positions[45];
    const noseBridge = positions[27];

    // Convert coordinates
    const noseX = (noseBridge._x / videoWidth) * 2 - 1;
    const noseY = -((noseBridge._y / videoHeight) * 2 - 1);

    // Calculate head rotation based on eye positions
    const headAngle = Math.atan2(
      rightEye._y - leftEye._y,
      rightEye._x - leftEye._x
    );

    if (glassesRef.current) {
      glassesRef.current.position.set(noseX, noseY, 0);
      // Rotate glasses with head (inverted)
      glassesRef.current.rotation.z = -headAngle;
      // Apply scale
      glassesRef.current.scale.set(size, size, size);
    }
  });

  // Different glasses styles
  const renderGlasses = () => {
    switch (style) {
      case 'round':
        // Round sunglasses
        return (
          <>
            {/* Left Lens */}
            <mesh position={[-0.15, 0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.02, 32]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity * 0.7}
                emissive="#FFC627"
                emissiveIntensity={0.2}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </mesh>
            {/* Right Lens */}
            <mesh position={[0.15, 0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.02, 32]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity * 0.7}
                emissive="#FFC627"
                emissiveIntensity={0.2}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </mesh>
            {/* Bridge */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.1, 0.03, 0.02]} />
              <meshStandardMaterial color="#FFC627" transparent opacity={opacity} />
            </mesh>
            {/* Left Frame */}
            <mesh position={[-0.15, 0, 0]}>
              <ringGeometry args={[0.11, 0.13, 32]} />
              <meshStandardMaterial
                color="#FFC627"
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Right Frame */}
            <mesh position={[0.15, 0, 0]}>
              <ringGeometry args={[0.11, 0.13, 32]} />
              <meshStandardMaterial
                color="#FFC627"
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
              />
            </mesh>
          </>
        );
      case 'aviator':
        // Aviator style glasses - teardrop shape
        return (
          <>
            {/* Left Lens */}
            <mesh position={[-0.15, 0, 0]}>
              <boxGeometry args={[0.22, 0.18, 0.02]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity * 0.7}
                emissive="#FFC627"
                emissiveIntensity={0.2}
              />
            </mesh>
            {/* Right Lens */}
            <mesh position={[0.15, 0, 0]}>
              <boxGeometry args={[0.22, 0.18, 0.02]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity * 0.7}
                emissive="#FFC627"
                emissiveIntensity={0.2}
              />
            </mesh>
            {/* Bridge */}
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={[0.08, 0.02, 0.02]} />
              <meshStandardMaterial color="#FFC627" transparent opacity={opacity} />
            </mesh>
            {/* Left Frame - aviator style with gold frame */}
            <mesh position={[-0.15, 0, 0]}>
              <ringGeometry args={[0.14, 0.16, 16]} />
              <meshStandardMaterial
                color="#FFD700"
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            {/* Right Frame */}
            <mesh position={[0.15, 0, 0]}>
              <ringGeometry args={[0.14, 0.16, 16]} />
              <meshStandardMaterial
                color="#FFD700"
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          </>
        );
      default: // 'rectangular'
        // Classic rectangular sunglasses
        return (
          <>
            {/* Left Lens */}
            <mesh position={[-0.15, 0, 0]}>
              <boxGeometry args={[0.25, 0.15, 0.02]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity * 0.7}
                emissive="#FFC627"
                emissiveIntensity={0.2}
              />
            </mesh>
            {/* Right Lens */}
            <mesh position={[0.15, 0, 0]}>
              <boxGeometry args={[0.25, 0.15, 0.02]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity * 0.7}
                emissive="#FFC627"
                emissiveIntensity={0.2}
              />
            </mesh>
            {/* Bridge */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.1, 0.03, 0.02]} />
              <meshStandardMaterial color="#FFC627" transparent opacity={opacity} />
            </mesh>
            {/* Left Frame */}
            <mesh position={[-0.15, 0, 0]}>
              <ringGeometry args={[0.13, 0.15, 16]} />
              <meshStandardMaterial
                color="#FFC627"
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Right Frame */}
            <mesh position={[0.15, 0, 0]}>
              <ringGeometry args={[0.13, 0.15, 16]} />
              <meshStandardMaterial
                color="#FFC627"
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
              />
            </mesh>
          </>
        );
    }
  };

  return (
    <group ref={glassesRef}>
      {renderGlasses()}
    </group>
  );
}

// 3D Pitchfork Component
function Pitchfork({ landmarks, videoWidth, videoHeight, opacity, color, handleColor = '#8B4513' }) {
  const pitchforkRef = useRef();

  useFrame(() => {
    if (!landmarks) return;

    const positions = landmarks.positions;
    const chin = positions[8];
    const rightJaw = positions[16];

    const forkX = ((rightJaw._x / videoWidth) * 2 - 1) + 0.3;
    const forkY = -((chin._y / videoHeight) * 2 - 1) - 0.2;

    if (pitchforkRef.current) {
      pitchforkRef.current.position.set(forkX, forkY, 0);
    }
  });

  return (
    <group ref={pitchforkRef}>
      {/* Handle */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
        <meshStandardMaterial color={handleColor} transparent opacity={opacity} />
      </mesh>

      {/* Left Prong */}
      <mesh position={[-0.06, 0.1, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.15, 8]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Center Prong */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.2, 8]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Right Prong */}
      <mesh position={[0.06, 0.1, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.15, 8]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

// 3D Scene Component
function ARScene({
  landmarks,
  videoWidth,
  videoHeight,
  opacity,
  showHorns,
  showGlasses,
  showPitchfork,
  hornsColor,
  glassesColor,
  pitchforkColor,
  pitchforkHandleColor,
  hornsSize,
  glassesSize,
  hornsStyle,
  glassesStyle
}) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[2, 2, 2]} intensity={0.5} />
      <pointLight position={[-2, -2, 2]} intensity={0.3} />

      {landmarks && (
        <>
          {showHorns && (
            <DevilHorns
              landmarks={landmarks}
              videoWidth={videoWidth}
              videoHeight={videoHeight}
              opacity={opacity}
              color={hornsColor}
              size={hornsSize}
              style={hornsStyle}
            />
          )}
          {showGlasses && (
            <Sunglasses
              landmarks={landmarks}
              videoWidth={videoWidth}
              videoHeight={videoHeight}
              opacity={opacity}
              color={glassesColor}
              size={glassesSize}
              style={glassesStyle}
            />
          )}
          {showPitchfork && (
            <Pitchfork
              landmarks={landmarks}
              videoWidth={videoWidth}
              videoHeight={videoHeight}
              opacity={opacity}
              color={pitchforkColor}
              handleColor={pitchforkHandleColor}
            />
          )}
        </>
      )}
    </>
  );
}

// Main Component
export default function ASUSparkyFaceFilter() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [pepTalk, setPepTalk] = useState('');
  const [opacity, setOpacity] = useState(0.9);
  const [landmarks, setLandmarks] = useState(null);
  const [videoSize, setVideoSize] = useState({ width: 640, height: 480 });

  // Accessory toggles
  const [showHorns, setShowHorns] = useState(true);
  const [showGlasses, setShowGlasses] = useState(true);
  const [showPitchfork, setShowPitchfork] = useState(true);

  // Accessory colors
  const [hornsColor, setHornsColor] = useState('#8B0000');
  const [glassesColor, setGlassesColor] = useState('#8B0000');
  const [pitchforkColor, setPitchforkColor] = useState('#FFC627');
  const [pitchforkHandleColor, setPitchforkHandleColor] = useState('#8B4513');

  // Accessory sizes
  const [hornsSize, setHornsSize] = useState(1.0);
  const [glassesSize, setGlassesSize] = useState(1.0);

  // Accessory styles
  const [hornsStyle, setHornsStyle] = useState('devil'); // devil, curved, straight
  const [glassesStyle, setGlassesStyle] = useState('rectangular'); // rectangular, round, aviator

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);

        setModelsLoaded(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load models:', err);
        setError(`Failed to load face detection models: ${err.message}`);
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  // Face detection loop
  const detectFaces = async () => {
    if (!videoRef.current || !isActive || !modelsLoaded) return;

    const video = videoRef.current;

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detections.length > 0) {
        setLandmarks(detections[0].landmarks);
        setVideoSize({
          width: video.videoWidth,
          height: video.videoHeight
        });
      } else {
        setLandmarks(null);
      }
    } catch (err) {
      console.error('Face detection error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(detectFaces);
  };

  // Start detection when active
  useEffect(() => {
    if (isActive && modelsLoaded) {
      detectFaces();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, modelsLoaded]);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setIsActive(true);
            setError(null);
          }).catch(err => {
            setError(`Video playback failed: ${err.message}`);
          });
        };
      }
    } catch (err) {
      setError(`Camera error: ${err.message}`);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsActive(false);
    setLandmarks(null);
  };

  // Generate pep talk
  const generatePepTalk = () => {
    const pepTalks = [
      "You've got that Sun Devil fire! 🔱 Keep pushing forward and Fork 'Em Devils!",
      "Sparky believes in you! You're unstoppable, just like our Sun Devils! 🌟",
      "Fear the Fork! You're doing amazing - ASU pride runs through your veins! 💛❤️",
      "Maroon and Gold flows through you! Stay strong and show that Devil determination! 🔱",
      "You're a true Sun Devil! Keep that innovation and excellence going! ⚡",
      "Forks Up! You've got this - show the world what Sun Devil strength looks like! 💪",
      "From Tempe to the world! Your ASU pride is shining bright today! ✨",
      "Sparky's pumped and so should you be! You're making Sun Devil Nation proud! 🎊"
    ];

    setPepTalk(pepTalks[Math.floor(Math.random() * pepTalks.length)]);
  };

  // Take screenshot
  const takeScreenshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Create a temporary canvas to combine video and 3D
    const tempCanvas = document.createElement('canvas');
    const video = videoRef.current;
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext('2d');

    // Draw mirrored video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -tempCanvas.width, 0, tempCanvas.width, tempCanvas.height);
    ctx.restore();

    // Get the Three.js canvas and draw it on top
    const threeCanvas = canvasRef.current.querySelector('canvas');
    if (threeCanvas) {
      ctx.drawImage(threeCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
    }

    // Download the image
    tempCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asu-sparky-ar-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #8B0000 50%, #B8860B 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    card: {
      background: '#2d2d2d',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      overflow: 'hidden',
      border: '4px solid #FFC627',
      maxWidth: '1200px',
      width: '100%'
    },
    header: {
      background: 'linear-gradient(90deg, #8B0000 0%, #FFC627 100%)',
      padding: '30px',
      textAlign: 'center'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: 'white',
      margin: 0,
      marginBottom: '10px'
    },
    subtitle: {
      color: '#FFF8DC',
      fontSize: '1.1rem',
      margin: 0
    },
    cameraSection: {
      padding: '30px',
      background: '#1a1a1a'
    },
    videoContainer: {
      position: 'relative',
      background: 'black',
      borderRadius: '10px',
      overflow: 'hidden',
      aspectRatio: '16/9',
      width: '100%'
    },
    placeholder: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#333',
      flexDirection: 'column',
      zIndex: 10
    },
    video: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform: 'scaleX(-1)'
    },
    canvas: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      zIndex: 5,
      pointerEvents: 'none',
      transform: 'scaleX(-1)' // Mirror to match video
    },
    button: {
      background: 'linear-gradient(90deg, #DC143C 0%, #FFC627 100%)',
      color: 'white',
      fontWeight: 'bold',
      padding: '15px 40px',
      borderRadius: '50px',
      border: 'none',
      fontSize: '1.1rem',
      cursor: 'pointer'
    },
    controls: {
      marginTop: '30px',
      display: 'flex',
      justifyContent: 'center',
      gap: '10px',
      flexWrap: 'wrap'
    },
    footer: {
      background: '#2d2d2d',
      padding: '20px',
      textAlign: 'center',
      borderTop: '2px solid #FFC627'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>🔱 ASU Sparky AR Face Filter 🔱</h1>
          <p style={styles.subtitle}>3D AR Accessories with Three.js! Fork 'Em! 😈</p>
        </div>

        <div style={styles.cameraSection}>
          <div style={styles.videoContainer}>
            {!isActive && (
              <div style={styles.placeholder}>
                <Camera size={80} color="#FFC627" style={{ marginBottom: '20px' }} />
                <p style={{ color: '#FFF8DC', fontSize: '1.2rem', marginBottom: '20px' }}>
                  Ready for 3D AR?
                </p>
                <button
                  onClick={startCamera}
                  style={styles.button}
                  disabled={isLoading || !modelsLoaded}
                >
                  {isLoading ? 'Loading Models...' : 'Start AR Camera'}
                </button>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ ...styles.video, display: isActive ? 'block' : 'none' }}
            />

            {isActive && (
              <Canvas
                ref={canvasRef}
                style={styles.canvas}
                camera={{ position: [0, 0, 1], fov: 75 }}
              >
                <Suspense fallback={null}>
                  <ARScene
                    landmarks={landmarks}
                    videoWidth={videoSize.width}
                    videoHeight={videoSize.height}
                    opacity={opacity}
                    showHorns={showHorns}
                    showGlasses={showGlasses}
                    showPitchfork={showPitchfork}
                    hornsColor={hornsColor}
                    glassesColor={glassesColor}
                    pitchforkColor={pitchforkColor}
                    pitchforkHandleColor={pitchforkHandleColor}
                    hornsSize={hornsSize}
                    glassesSize={glassesSize}
                    hornsStyle={hornsStyle}
                    glassesStyle={glassesStyle}
                  />
                </Suspense>
              </Canvas>
            )}
          </div>

          {isLoading && (
            <div style={{
              marginTop: '20px',
              background: '#B8860B',
              padding: '15px',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Loader color="#FFF8DC" />
              <p style={{ color: '#FFF8DC', margin: 0 }}>
                Loading face detection models...
              </p>
            </div>
          )}

          {error && (
            <div style={{
              marginTop: '20px',
              background: '#8B0000',
              padding: '15px',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle color="#FFB6C1" />
              <p style={{ color: '#FFB6C1', margin: 0 }}>{error}</p>
            </div>
          )}

          {isActive && (
            <>
              <div style={styles.controls}>
                <button onClick={stopCamera} style={{ ...styles.button, background: '#DC143C', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Power size={20} />
                  Stop Camera
                </button>
                <button
                  onClick={takeScreenshot}
                  style={{ ...styles.button, background: 'linear-gradient(90deg, #FFC627 0%, #FFD700 100%)', color: '#8B0000', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <Camera size={20} />
                  Take Picture
                </button>
                <button
                  onClick={generatePepTalk}
                  style={{ ...styles.button, background: 'linear-gradient(90deg, #8B0000 0%, #FFC627 100%)', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <Sparkles size={20} />
                  Get Pep Talk!
                </button>
              </div>

              {/* Accessory Toggles */}
              <div style={{
                marginTop: '20px',
                background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                border: '2px solid #FFC627',
                padding: '20px',
                borderRadius: '10px'
              }}>
                <h3 style={{ color: '#FFC627', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', margin: '0 0 15px 0' }}>
                  Accessories
                </h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    onClick={() => setShowHorns(!showHorns)}
                    style={{
                      ...styles.button,
                      background: showHorns ? 'linear-gradient(90deg, #DC143C 0%, #8B0000 100%)' : '#555',
                      padding: '10px 20px',
                      fontSize: '0.9rem'
                    }}
                  >
                    😈 Horns {showHorns ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => setShowGlasses(!showGlasses)}
                    style={{
                      ...styles.button,
                      background: showGlasses ? 'linear-gradient(90deg, #DC143C 0%, #8B0000 100%)' : '#555',
                      padding: '10px 20px',
                      fontSize: '0.9rem'
                    }}
                  >
                    🕶️ Glasses {showGlasses ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => setShowPitchfork(!showPitchfork)}
                    style={{
                      ...styles.button,
                      background: showPitchfork ? 'linear-gradient(90deg, #DC143C 0%, #8B0000 100%)' : '#555',
                      padding: '10px 20px',
                      fontSize: '0.9rem'
                    }}
                  >
                    🔱 Pitchfork {showPitchfork ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Color Pickers */}
              <div style={{
                marginTop: '20px',
                background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                border: '2px solid #FFC627',
                padding: '20px',
                borderRadius: '10px'
              }}>
                <h3 style={{ color: '#FFC627', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', margin: '0 0 15px 0' }}>
                  Accessory Colors
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ color: '#FFF', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>
                      😈 Horns Color
                    </label>
                    <input
                      type="color"
                      value={hornsColor}
                      onChange={(e) => setHornsColor(e.target.value)}
                      style={{ width: '100%', height: '40px', cursor: 'pointer', borderRadius: '5px', border: '2px solid #FFC627' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#FFF', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>
                      🕶️ Glasses Color
                    </label>
                    <input
                      type="color"
                      value={glassesColor}
                      onChange={(e) => setGlassesColor(e.target.value)}
                      style={{ width: '100%', height: '40px', cursor: 'pointer', borderRadius: '5px', border: '2px solid #FFC627' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#FFF', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>
                      🔱 Pitchfork Prongs
                    </label>
                    <input
                      type="color"
                      value={pitchforkColor}
                      onChange={(e) => setPitchforkColor(e.target.value)}
                      style={{ width: '100%', height: '40px', cursor: 'pointer', borderRadius: '5px', border: '2px solid #FFC627' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#FFF', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>
                      🔱 Pitchfork Handle
                    </label>
                    <input
                      type="color"
                      value={pitchforkHandleColor}
                      onChange={(e) => setPitchforkHandleColor(e.target.value)}
                      style={{ width: '100%', height: '40px', cursor: 'pointer', borderRadius: '5px', border: '2px solid #FFC627' }}
                    />
                  </div>
                </div>
              </div>

              {/* Opacity Slider */}
              <div style={{
                marginTop: '20px',
                background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                border: '2px solid #FFC627',
                padding: '20px',
                borderRadius: '10px'
              }}>
                <label style={{ color: '#FFC627', fontSize: '1.2rem', fontWeight: 'bold', display: 'block', textAlign: 'center', marginBottom: '10px' }}>
                  Opacity: {Math.round(opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity * 100}
                  onChange={(e) => setOpacity(e.target.value / 100)}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              {/* Size Sliders */}
              <div style={{
                marginTop: '20px',
                background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                border: '2px solid #FFC627',
                padding: '20px',
                borderRadius: '10px'
              }}>
                <h3 style={{ color: '#FFC627', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', margin: '0 0 15px 0' }}>
                  Accessory Sizes
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ color: '#FFF', fontSize: '0.9rem', display: 'block', textAlign: 'center', marginBottom: '5px' }}>
                      😈 Horns Size: {Math.round(hornsSize * 100)}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={hornsSize * 100}
                      onChange={(e) => setHornsSize(e.target.value / 100)}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#FFF', fontSize: '0.9rem', display: 'block', textAlign: 'center', marginBottom: '5px' }}>
                      🕶️ Glasses Size: {Math.round(glassesSize * 100)}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={glassesSize * 100}
                      onChange={(e) => setGlassesSize(e.target.value / 100)}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>

              {/* Style Selectors */}
              <div style={{
                marginTop: '20px',
                background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                border: '2px solid #FFC627',
                padding: '20px',
                borderRadius: '10px'
              }}>
                <h3 style={{ color: '#FFC627', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', margin: '0 0 15px 0' }}>
                  Accessory Styles
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ color: '#FFF', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>
                      😈 Horns Style
                    </label>
                    <select
                      value={hornsStyle}
                      onChange={(e) => setHornsStyle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '2px solid #FFC627',
                        background: '#1a1a1a',
                        color: '#FFF',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="devil">Devil (Angled)</option>
                      <option value="curved">Curved</option>
                      <option value="straight">Straight</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#FFF', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>
                      🕶️ Glasses Style
                    </label>
                    <select
                      value={glassesStyle}
                      onChange={(e) => setGlassesStyle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '2px solid #FFC627',
                        background: '#1a1a1a',
                        color: '#FFF',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="rectangular">Rectangular</option>
                      <option value="round">Round</option>
                      <option value="aviator">Aviator</option>
                    </select>
                  </div>
                </div>
              </div>

              {pepTalk && (
                <div style={{
                  marginTop: '20px',
                  background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
                  border: '3px solid #FFC627',
                  padding: '20px',
                  borderRadius: '15px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: 'white', fontSize: '1.1rem', margin: 0, lineHeight: '1.6' }}>
                    {pepTalk}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div style={styles.footer}>
          <p style={{ color: '#FFC627', fontWeight: '600', margin: 0 }}>
            Built with 💛 for Sun Devil Nation | 3D AR with Three.js | Go ASU! 🔱
          </p>
        </div>
      </div>
    </div>
  );
}
