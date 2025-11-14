import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Power, Camera } from 'lucide-react';

/**
 * Hand Detection Test Component
 * Testing MediaPipe Hands with a 3D pitchfork that the user can "hold"
 */

// 3D Pitchfork that follows hand position
function HandHeldPitchfork({ handLandmarks }) {
  const pitchforkRef = useRef();

  useFrame(() => {
    if (!handLandmarks || !pitchforkRef.current) return;

    // Get wrist (landmark 0) and middle finger base (landmark 9) for positioning
    const wrist = handLandmarks[0];
    const middleFingerBase = handLandmarks[9];

    // Convert from MediaPipe normalized coordinates (0-1) to Three.js normalized coordinates (-1 to 1)
    // MediaPipe coordinates are already normalized, so no need for videoWidth/videoHeight
    const handX = wrist.x * 2 - 1;
    const handY = -(wrist.y * 2 - 1); // Invert Y axis

    console.log('Pitchfork position:', handX, handY);

    // Calculate rotation based on hand orientation
    const angle = Math.atan2(
      middleFingerBase.y - wrist.y,
      middleFingerBase.x - wrist.x
    );

    // Position pitchfork at hand location
    pitchforkRef.current.position.set(handX, handY, 0);

    // Rotate pitchfork to match hand orientation
    // Add 90 degrees (Math.PI/2) to make it vertical when hand is upright
    pitchforkRef.current.rotation.z = -angle + Math.PI / 2;
  });

  return (
    <group ref={pitchforkRef} scale={1.5}>
      {/* Pitchfork Handle - longer for better visibility */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.6, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Left Prong */}
      <mesh position={[-0.06, 0.2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
        <meshStandardMaterial color="#FFC627" emissive="#FFC627" emissiveIntensity={0.5} />
      </mesh>

      {/* Center Prong */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.25, 8]} />
        <meshStandardMaterial color="#FFC627" emissive="#FFC627" emissiveIntensity={0.5} />
      </mesh>

      {/* Right Prong */}
      <mesh position={[0.06, 0.2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
        <meshStandardMaterial color="#FFC627" emissive="#FFC627" emissiveIntensity={0.5} />
      </mesh>

      {/* Prong base/connector */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.15, 0.02, 0.02]} />
        <meshStandardMaterial color="#FFD700" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// 3D Scene
function HandScene({ handLandmarks }) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[2, 2, 2]} intensity={0.5} />
      <pointLight position={[-2, -2, 2]} intensity={0.3} />

      {handLandmarks && (
        <HandHeldPitchfork handLandmarks={handLandmarks} />
      )}
    </>
  );
}

// Main Hand Detection Test Component
export default function HandDetectionTest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [handLandmarks, setHandLandmarks] = useState(null);
  const [videoSize, setVideoSize] = useState({ width: 640, height: 480 });

  // Load MediaPipe scripts from CDN
  useEffect(() => {
    const loadScripts = async () => {
      try {
        setIsLoading(true);
        console.log('Loading MediaPipe scripts from CDN...');

        // Load MediaPipe Hands script
        const script1 = document.createElement('script');
        script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
        script1.crossOrigin = 'anonymous';

        const script2 = document.createElement('script');
        script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
        script2.crossOrigin = 'anonymous';

        const loadScript = (script) => {
          return new Promise((resolve, reject) => {
            script.onload = () => {
              console.log(`Loaded: ${script.src}`);
              resolve();
            };
            script.onerror = (err) => {
              console.error(`Failed to load: ${script.src}`, err);
              reject(err);
            };
            document.head.appendChild(script);
          });
        };

        await loadScript(script1);
        await loadScript(script2);

        // Wait a bit for scripts to fully initialize
        console.log('Waiting for scripts to initialize...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Initialize MediaPipe Hands from window object
        console.log('Checking for Hands in window object...');
        console.log('window.Hands:', window.Hands);
        console.log('window.Camera:', window.Camera);

        const { Hands } = window;

        if (!Hands) {
          throw new Error('MediaPipe Hands not loaded');
        }

        console.log('Initializing MediaPipe Hands...');
        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            console.log('✋ Hand detected!', results.multiHandLandmarks[0]);
            setHandLandmarks(results.multiHandLandmarks[0]);
          } else {
            setHandLandmarks(null);
          }
        });

        handsRef.current = hands;
        console.log('MediaPipe Hands initialized successfully!');
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize MediaPipe Hands:', err);
        setError(`Failed to initialize hand detection: ${err.message}`);
        setIsLoading(false);
      }
    };

    loadScripts();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, []);

  // Start camera and hand detection
  const startCamera = async () => {
    try {
      setError(null);
      console.log('Starting camera...');

      // Check if MediaPipe Hands is loaded
      if (!handsRef.current) {
        console.error('MediaPipe Hands not initialized yet');
        setError('Hand detection is still loading. Please wait a moment and try again.');
        return;
      }

      console.log('MediaPipe Hands initialized, requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });

      console.log('Camera access granted');

      // Set isActive first to render the video element
      setIsActive(true);

      // Wait for next frame to ensure video element is in DOM
      requestAnimationFrame(() => {
        if (!videoRef.current) {
          console.error('Video element not found after render');
          setError('Failed to initialize video element');
          return;
        }

        console.log('Setting up video stream...');
        videoRef.current.srcObject = stream;

        const setupCamera = async () => {
          console.log('Video metadata loaded');

          // Play the video
          try {
            await videoRef.current.play();
            console.log('Video playing');
          } catch (playError) {
            console.error('Error playing video:', playError);
          }

          setVideoSize({
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          });

          // Start MediaPipe camera
          if (handsRef.current && videoRef.current) {
            console.log('Initializing MediaPipe Camera...');

            // Check if Camera utility is available
            if (!window.Camera) {
              console.error('MediaPipe Camera utility not found in window object');
              setError('Camera utility not loaded. Please refresh the page.');
              return;
            }

            const { Camera: CameraUtil } = window;
            const camera = new CameraUtil(videoRef.current, {
              onFrame: async () => {
                if (handsRef.current && videoRef.current) {
                  await handsRef.current.send({ image: videoRef.current });
                }
              },
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight
            });

            console.log('Starting MediaPipe Camera...');
            camera.start();
            cameraRef.current = camera;
            console.log('Hand detection active!');
          }
        };

        videoRef.current.onloadedmetadata = setupCamera;
      });
    } catch (err) {
      console.error('Camera error:', err);
      setError(`Failed to access camera: ${err.message}`);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setHandLandmarks(null);
  };

  // Take screenshot
  const takeScreenshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

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

    // Download
    tempCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hand-pitchfork-test-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #8B0000 50%, #FFC627 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    content: {
      maxWidth: '800px',
      width: '100%'
    },
    title: {
      color: '#FFC627',
      fontSize: '2rem',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '20px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
    },
    subtitle: {
      color: '#FFF',
      fontSize: '1rem',
      textAlign: 'center',
      marginBottom: '20px'
    },
    videoContainer: {
      position: 'relative',
      width: '100%',
      paddingTop: '75%',
      background: '#000',
      borderRadius: '10px',
      overflow: 'hidden',
      border: '3px solid #FFC627'
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
      transform: 'scaleX(-1)'
    },
    button: {
      background: 'linear-gradient(90deg, #DC143C 0%, #FFC627 100%)',
      color: 'white',
      fontWeight: 'bold',
      padding: '15px 40px',
      borderRadius: '50px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      transition: 'transform 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    controls: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'center',
      marginTop: '20px',
      flexWrap: 'wrap'
    },
    status: {
      textAlign: 'center',
      marginTop: '15px',
      padding: '15px',
      borderRadius: '10px',
      background: 'rgba(0,0,0,0.3)',
      border: '2px solid #FFC627'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Hand Detection Test</h1>
        <p style={styles.subtitle}>
          Testing MediaPipe Hands - Hold your hand up to hold the virtual pitchfork!
        </p>

        {error && (
          <div style={{ ...styles.status, borderColor: '#DC143C', color: '#DC143C' }}>
            {error}
          </div>
        )}

        {!isActive && !error && (
          <div style={styles.controls}>
            <button onClick={startCamera} style={styles.button} disabled={isLoading}>
              <Camera size={20} />
              {isLoading ? 'Loading...' : 'Start Hand Detection'}
            </button>
          </div>
        )}

        {isActive && (
          <>
            <div style={styles.videoContainer}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={styles.video}
              />

              {isActive && (
                <Canvas
                  ref={canvasRef}
                  style={styles.canvas}
                  camera={{ position: [0, 0, 1], fov: 75 }}
                  gl={{
                    preserveDrawingBuffer: true,
                    antialias: true,
                    powerPreference: "high-performance"
                  }}
                  onCreated={({ gl }) => {
                    // Handle context loss
                    const canvas = gl.domElement;
                    canvas.addEventListener('webglcontextlost', (e) => {
                      e.preventDefault();
                      console.log('WebGL context lost, attempting to restore...');
                    });
                    canvas.addEventListener('webglcontextrestored', () => {
                      console.log('WebGL context restored');
                    });
                  }}
                >
                  <Suspense fallback={null}>
                    <HandScene handLandmarks={handLandmarks} />
                  </Suspense>
                </Canvas>
              )}

              {isLoading && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#FFC627',
                  fontSize: '1.2rem',
                  zIndex: 10
                }}>
                  Loading hand detection...
                </div>
              )}
            </div>

            <div style={styles.controls}>
              <button onClick={stopCamera} style={{ ...styles.button, background: '#DC143C' }}>
                <Power size={20} />
                Stop Camera
              </button>
              <button
                onClick={takeScreenshot}
                style={{ ...styles.button, background: 'linear-gradient(90deg, #FFC627 0%, #FFD700 100%)', color: '#8B0000' }}
              >
                <Camera size={20} />
                Take Picture
              </button>
            </div>

            <div style={styles.status}>
              <p style={{ color: handLandmarks ? '#00FF00' : '#FFC627', margin: 0 }}>
                {handLandmarks ? '✓ Hand Detected - Pitchfork Active!' : '⌛ Waiting for hand...'}
              </p>
              <p style={{ color: '#AAA', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
                Raise your hand in front of the camera to hold the virtual pitchfork
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
