import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Camera, Power, AlertCircle, Loader, Eye, EyeOff, Sparkles, BookOpen } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';
import * as THREE from 'three';

/**
 * ASU Sparky AR Face Filter
 * Using face-api.js for face detection + Three.js for 3D AR rendering
 * With MediaPipe Hands for hand-held pitchfork feature
 */

// ASU Quiz Component
function ASUQuiz({ onBack, styles }) {
  const questions = [
    {
      question: "What are ASU's official colors?",
      options: ["Red and White", "Maroon and Gold", "Black and Gold", "Sun Devil Red and Gold"],
      correctAnswer: "Maroon and Gold",
    },
    {
      question: "What is the name of ASU's beloved mascot?",
      options: ["Sparty", "Goldy the Gopher", "Sparky the Sun Devil", "Joe Bruin"],
      correctAnswer: "Sparky the Sun Devil",
    },
    {
      question: "ASU has been ranked #1 in the U.S. for what category for 9 consecutive years (as of 2024)?",
      options: ["Best Party School", "Most Beautiful Campus", "Innovation", "Best Engineering Program"],
      correctAnswer: "Innovation",
    },
    {
      question: "What is the name of ASU's football stadium?",
      options: ["Sun Devil Stadium", "Chase Field", "State Farm Stadium", "Maroon and Gold Field"],
      correctAnswer: "Sun Devil Stadium",
    },
    {
      question: "The gesture of holding up the index and middle fingers with the thumb holding down the ring and pinky fingers is known as what?",
      options: ["Sun Power", "The Pitchfork", "Devil's Horns", "Victory Sign"],
      correctAnswer: "The Pitchfork",
    },
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleAnswerClick = (option) => {
    if (option === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }

    const nextQuestion = currentQuestionIndex + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestionIndex(nextQuestion);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizFinished(false);
  };

  const getScoreComment = (finalScore) => {
    switch (finalScore) {
      case 0:
        return "Keep trying, Sun Devil! You'll get it next time!";
      case 1:
        return "Almost! Try again to get a full score!";
      case 2:
        return "Not bad! A true Sun Devil knows their stuff, give it another go!";
      case 3:
        return "Good job! You're on your way to becoming an ASU expert!";
      case 4:
        return "Great score! You really know your ASU trivia!";
      case 5:
        return "Perfect score! You're a true Sun Devil! Forks Up! 🔱";
      default:
        return "Thanks for playing!";
    }
  };

  return (
    <div style={{ padding: '30px', background: '#1a1a1a', color: 'white', borderRadius: '10px' }}>
      <h2 style={{ color: '#FFC627', textAlign: 'center', marginBottom: '20px' }}>ASU Trivia Quiz!</h2>
      {quizFinished ? (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.5rem' }}>Quiz Finished!</h3>
          <p style={{ fontSize: '1.2rem', color: '#FFF8DC' }}>You scored {score} out of {questions.length}</p>
          <p style={{ fontStyle: 'italic', color: '#FFD700', marginTop: '15px', fontSize: '1.1rem' }}>
            {getScoreComment(score)}
          </p>
          <button onClick={restartQuiz} style={{ ...styles.button, marginRight: '10px' }}>
            Try Again
          </button>
          <button onClick={onBack} style={{ ...styles.button, background: '#555' }}>
            Back to AR Filter
          </button>
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: '15px' }}>{questions[currentQuestionIndex].question}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {questions[currentQuestionIndex].options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerClick(option)}
                style={{
                  ...styles.button,
                  width: '100%',
                  padding: '20px',
                  background: 'linear-gradient(90deg, #8B0000 0%, #B8860B 100%)',
                  textAlign: 'left'
                }}
              >
                {option}
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px', color: '#FFC627' }}>
            <p>Question {currentQuestionIndex + 1} of {questions.length}</p>
            <p>Current Score: {score}</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button onClick={onBack} style={{ ...styles.button, background: '#555' }}>
              Exit Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 3D Hand-Held Pitchfork Component (appears when hand is detected)
function HandHeldPitchfork({ handLandmarks, color, handleColor, size = 1.0, rotation = 0 }) {
  const pitchforkRef = useRef();
  // Smoothing factor for position and rotation (lower value = smoother)
  const smoothingFactor = 0.1;

  // Target quaternion for smooth rotation
  const targetQuaternion = new THREE.Quaternion();
  useFrame((state, delta) => {
    if (!handLandmarks || !pitchforkRef.current) return;

    // Use palm center for more realistic positioning
    // Landmarks: 0=wrist, 9=middle finger base, 5=index base, 17=pinky base
    const wrist = handLandmarks[0];
    const middleFinger = handLandmarks[9];
    const indexBase = handLandmarks[5];
    const pinkyBase = handLandmarks[17];

    // Calculate palm center (average of key palm points)
    const palmCenterX = (wrist.x + middleFinger.x + indexBase.x + pinkyBase.x) / 4;
    const palmCenterY = (wrist.y + middleFinger.y + indexBase.y + pinkyBase.y) / 4;

    // Convert from MediaPipe normalized coordinates (0-1) to Three.js normalized coordinates (-1 to 1)
    const handX = palmCenterX * 2 - 1;
    const handY = -(palmCenterY * 2 - 1); // Invert Y axis

    // Calculate hand orientation using index finger to pinky vector for better accuracy
    const angle = Math.atan2(
      pinkyBase.y - indexBase.y,
      pinkyBase.x - indexBase.x
    );

    // --- Smoothing Logic ---

    // 1. Smooth Position (Lerp)
    const targetPosition = new THREE.Vector3(handX, handY, 0);
    pitchforkRef.current.position.lerp(targetPosition, smoothingFactor);

    // 2. Smooth Rotation (Slerp)
    // Create a target rotation and apply the manual offset
    const targetAngle = -angle - Math.PI / 2 + rotation;
    targetQuaternion.setFromEuler(new THREE.Euler(0, 0, targetAngle));

    // Slerp (spherical linear interpolation) the pitchfork's rotation towards the target
    pitchforkRef.current.quaternion.slerp(targetQuaternion, smoothingFactor);

    pitchforkRef.current.scale.set(size * 1.5, size * 1.5, size * 1.5);
  });

  return (
    <group ref={pitchforkRef}>
      {/* Pitchfork Handle */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.6, 8]} />
        <meshStandardMaterial color={handleColor} />
      </mesh>

      {/* Left Prong */}
      <mesh position={[-0.06, 0.2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Center Prong */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.25, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Right Prong */}
      <mesh position={[0.06, 0.2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Prong base/connector */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.15, 0.02, 0.02]} />
        <meshStandardMaterial color="#FFD700" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// 3D Devil Horns Component
function DevilHorns({ landmarks, videoWidth, videoHeight, opacity, color, size = 1.0, style = 'devil' }) {
  const hornsGroupRef = useRef();
  const smoothingFactor = 0.1;
  const targetQuaternion = new THREE.Quaternion();

  useFrame(() => {
    if (!landmarks || !hornsGroupRef.current) return;

    const leftEyebrow = landmarks._positions[19];
    const rightEyebrow = landmarks._positions[24];
    const noseBridge = landmarks._positions[27];

    // Convert from video coordinates to Three.js normalized coordinates
    const headCenterX = (noseBridge.x / videoWidth) * 2 - 1;
    const headCenterY = -((noseBridge.y / videoHeight) * 2 - 1);

    console.log('DevilHorns rendering at:', { headCenterX, headCenterY, videoWidth, videoHeight, noseBridgeX: noseBridge.x, noseBridgeY: noseBridge.y });

    // Calculate head rotation based on eyebrow positions
    const headAngle = Math.atan2(
      rightEyebrow.y - leftEyebrow.y,
      rightEyebrow.x - leftEyebrow.x
    );

    // Smooth position
    const targetPosition = new THREE.Vector3(headCenterX, headCenterY + 0.4, 0);
    hornsGroupRef.current.position.lerp(targetPosition, smoothingFactor);

    // Smooth rotation
    targetQuaternion.setFromEuler(new THREE.Euler(0, 0, -headAngle));
    hornsGroupRef.current.quaternion.slerp(targetQuaternion, smoothingFactor);

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
            <mesh position={[-0.32, 0, 0]} rotation={[Math.PI / 6, 0, Math.PI / 4]}>
              <coneGeometry args={[0.08, 0.35, 8]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.3}
                roughness={0.6}
              />
            </mesh>
            <mesh position={[0.32, 0, 0]} rotation={[Math.PI / 6, 0, -Math.PI / 4]}>
              <coneGeometry args={[0.08, 0.35, 8]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.3}
                roughness={0.6}
              />
            </mesh>
          </>
        );
      case 'straight':
        // Straight upward horns
        return (
          <>
            <mesh position={[-0.29, 0, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.06, 0.4, 8]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.3}
                roughness={0.7}
              />
            </mesh>
            <mesh position={[0.29, 0, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.06, 0.4, 8]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.3}
                roughness={0.7}
              />
            </mesh>
          </>
        );
      case 'ram':
        // Large ram horns curving outward and down
        return (
          <>
            {/* Left ram horn - multiple segments for curl effect */}
            <mesh position={[-0.32, 0.05, 0]} rotation={[Math.PI / 2.5, 0, Math.PI / 3]}>
              <torusGeometry args={[0.12, 0.05, 8, 16, Math.PI * 1.2]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.3}
                roughness={0.8}
              />
            </mesh>
            {/* Right ram horn */}
            <mesh position={[0.32, 0.05, 0]} rotation={[Math.PI / 2.5, 0, -Math.PI / 3]}>
              <torusGeometry args={[0.12, 0.05, 8, 16, Math.PI * 1.2]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.3}
                roughness={0.8}
              />
            </mesh>
          </>
        );
      case 'dragon':
        // Dragon/twisted horns pointing backward
        return (
          <>
            {/* Left dragon horn - twisted cone */}
            <mesh position={[-0.29, 0.1, -0.1]} rotation={[Math.PI / 4, 0.2, Math.PI / 6]}>
              <cylinderGeometry args={[0.02, 0.07, 0.4, 8, 4, false]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.4}
                metalness={0.4}
                roughness={0.3}
              />
            </mesh>
            {/* Right dragon horn */}
            <mesh position={[0.29, 0.1, -0.1]} rotation={[Math.PI / 4, -0.2, -Math.PI / 6]}>
              <cylinderGeometry args={[0.02, 0.07, 0.4, 8, 4, false]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.4}
                metalness={0.4}
                roughness={0.3}
              />
            </mesh>
          </>
        );
      default: // 'devil'
        // Classic devil horns angled outward
        return (
          <>
            <mesh position={[-0.29, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
              <coneGeometry args={[0.08, 0.3, 8]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.3}
                roughness={0.6}
              />
            </mesh>
            <mesh position={[0.29, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <coneGeometry args={[0.08, 0.3, 8]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.3}
                roughness={0.6}
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
  const smoothingFactor = 0.1;
  const targetQuaternion = new THREE.Quaternion();

  useFrame(() => {
    if (!landmarks) return;

    const leftEye = landmarks._positions[36];
    const rightEye = landmarks._positions[45];
    const noseBridge = landmarks._positions[27];

    // Convert coordinates
    const noseX = (noseBridge.x / videoWidth) * 2 - 1;
    const noseY = -((noseBridge.y / videoHeight) * 2 - 1);

    console.log('Sunglasses rendering at:', { noseX, noseY });

    // Calculate head rotation based on eye positions
    const headAngle = Math.atan2(
      rightEye.y - leftEye.y,
      rightEye.x - leftEye.x
    );

    if (glassesRef.current) {
      // Smooth position
      const targetPosition = new THREE.Vector3(noseX, noseY - 0.05, 0);
      glassesRef.current.position.lerp(targetPosition, smoothingFactor);

      // Smooth rotation
      targetQuaternion.setFromEuler(new THREE.Euler(0, 0, -headAngle));
      glassesRef.current.quaternion.slerp(targetQuaternion, smoothingFactor);

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
            <mesh position={[-0.15, 0, 0.001]}>
              <circleGeometry args={[0.11, 32]} />
              <meshStandardMaterial
                color={color || '#000000'}
                transparent
                opacity={opacity * 0.7}
                metalness={0.2}
                roughness={0.1}
                emissive={color}
              />
            </mesh>
            {/* Right Lens */}
            <mesh position={[0.15, 0, 0.001]}>
              <circleGeometry args={[0.11, 32]} />
              <meshStandardMaterial
                color={color || '#000000'}
                transparent
                opacity={opacity * 0.7}
                metalness={0.2}
                roughness={0.1}
                emissive={color}
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
          (() => {
            // Define the upside-down trapezoid shape for the lens
            const lensShape = new THREE.Shape();
            const width = 0.22;
            const height = 0.18;
            lensShape.moveTo(-width / 2, height / 2);
            lensShape.lineTo(width / 2, height / 2);
            lensShape.lineTo(width / 2 * 0.8, -height / 2);
            lensShape.lineTo(-width / 2 * 0.8, -height / 2);
            lensShape.closePath();

            return <>
            {/* Left Lens */}
            <mesh position={[-0.16, -0.02, 0.001]} rotation={[0, 0, 0.05]}>
              <shapeGeometry args={[lensShape]} />
              <meshStandardMaterial
                color={color || '#000000'}
                transparent
                opacity={opacity * 0.7}
                metalness={0.3}
                roughness={0.1}
                emissive={color}
              />
            </mesh>
            {/* Right Lens */}
            <mesh position={[0.16, -0.02, 0]} rotation={[0, 0, -0.05]}>
              <shapeGeometry args={[lensShape]} />
              <meshStandardMaterial
                color={color || '#000000'}
                transparent
                opacity={opacity * 0.7}
                metalness={0.3}
                roughness={0.1}
                emissive={color}
              />
            </mesh>
            {/* Nose Bridge */}
            <mesh position={[0, -0.03, 0]}>
              <boxGeometry args={[0.1, 0.015, 0.02]} />
              <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Left Frame - aviator style with gold frame */}
            <mesh position={[-0.16, -0.02, 0]} rotation={[0, 0, 0.05]}>
              <lineSegments>
                <edgesGeometry args={[new THREE.ShapeGeometry(lensShape)]} />
                <lineBasicMaterial
                  color="#FFD700"
                  transparent
                  opacity={opacity}
                />
              </lineSegments>
            </mesh>
            {/* Right Frame */}
            <mesh position={[0.16, -0.02, 0]} rotation={[0, 0, -0.05]}>
              <lineSegments>
                <edgesGeometry args={[new THREE.ShapeGeometry(lensShape)]} />
                <lineBasicMaterial
                  color="#FFD700"
                  transparent
                  opacity={opacity}
                />
              </lineSegments>
            </mesh>
          </>
          })()
        );
      case 'cat-eye':
        // Retro cat-eye style glasses
        return (
          <>
            {/* Left Lens - angled upward */}
            <mesh position={[-0.16, 0.02, 0]} rotation={[0, 0, -0.2]}>
              <boxGeometry args={[0.22, 0.14, 0.02]} />
              <meshStandardMaterial
                color={color || '#000000'}
                transparent
                opacity={opacity * 0.7}
                metalness={0.2}
                roughness={0.1}
                emissive={color}
              />
            </mesh>
            {/* Right Lens - angled upward */}
            <mesh position={[0.16, 0.02, 0]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[0.22, 0.14, 0.02]} />
              <meshStandardMaterial
                color={color || '#000000'}
                transparent
                opacity={opacity * 0.7}
                metalness={0.2}
                roughness={0.1}
                emissive={color}
              />
            </mesh>
            {/* Left outer wing */}
            <mesh position={[-0.25, 0.08, 0]} rotation={[0, 0, -0.4]}>
              <boxGeometry args={[0.1, 0.06, 0.025]} />
              <meshStandardMaterial
                color="#FFC627"
                transparent
                opacity={opacity}
                emissive="#FFC627"
                emissiveIntensity={0.3}
                metalness={0.5}
              />
            </mesh>
            {/* Right outer wing */}
            <mesh position={[0.25, 0.08, 0]} rotation={[0, 0, 0.4]}>
              <boxGeometry args={[0.1, 0.06, 0.025]} />
              <meshStandardMaterial
                color="#FFC627"
                transparent
                opacity={opacity}
                emissive="#FFC627"
                emissiveIntensity={0.3}
                metalness={0.5}
              />
            </mesh>
            {/* Bridge */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.08, 0.02, 0.02]} />
              <meshStandardMaterial color="#FFC627" transparent opacity={opacity} />
            </mesh>
          </>
        );
      case 'visor':
        // Futuristic sports visor style
        return (
          <>
            {/* Single wraparound visor lens */}
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.15, 16, 1, true, 0, Math.PI * 1.5]} />
              <meshStandardMaterial
                color={color || '#000000'}
                transparent
                opacity={opacity * 0.6}
                emissive={color}
                emissiveIntensity={0.4}
                metalness={0.7}
                roughness={0.2}
              />
            </mesh>
            {/* Left accent strip */}
            <mesh position={[-0.2, 0.08, 0.01]}>
              <boxGeometry args={[0.15, 0.02, 0.01]} />
              <meshStandardMaterial
                color="#FFC627"
                transparent
                opacity={opacity}
                emissive="#FFC627"
                emissiveIntensity={0.6}
              />
            </mesh>
            {/* Right accent strip */}
            <mesh position={[0.2, 0.08, 0.01]}>
              <boxGeometry args={[0.15, 0.02, 0.01]} />
              <meshStandardMaterial
                color="#FFC627"
                transparent
                opacity={opacity}
                emissive="#FFC627"
                emissiveIntensity={0.6}
              />
            </mesh>
            {/* Left temple piece */}
            <mesh position={[-0.28, 0.01, 0]} rotation={[0, -0.2, -0.1]}>
              <boxGeometry args={[0.1, 0.03, 0.02]} />
              <meshStandardMaterial
                color="#8B0000"
                transparent
                opacity={opacity}
                metalness={0.5}
              />
            </mesh>
            {/* Right temple piece */}
            <mesh position={[0.28, 0.01, 0]} rotation={[0, 0.2, 0.1]}>
              <boxGeometry args={[0.1, 0.03, 0.02]} />
              <meshStandardMaterial
                color="#8B0000"
                transparent
                opacity={opacity}
                metalness={0.5}
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
                color={color || '#000000'}
                transparent
                opacity={opacity * 0.7}
                metalness={0.2}
                roughness={0.1}
                emissive={color}
              />
            </mesh>
            {/* Right Lens */}
            <mesh position={[0.15, 0, 0]}>
              <boxGeometry args={[0.25, 0.15, 0.02]} />
              <meshStandardMaterial
                color={color || '#000000'}
                transparent
                opacity={opacity * 0.7}
                metalness={0.2}
                roughness={0.1}
                emissive={color}
              />
            </mesh>
            {/* Bridge */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.1, 0.03, 0.02]} />
              <meshStandardMaterial color="#FFC627" transparent opacity={opacity} />
            </mesh>
            {/* Left Frame - REMOVED */}
            {/* <mesh position={[-0.15, 0, 0]}>
              <ringGeometry args={[0.13, 0.15, 16]} />
              <meshStandardMaterial
                color="#FFC627"
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
              />
            </mesh> */}
            {/* Right Frame - REMOVED */}
            {/* <mesh position={[0.15, 0, 0]}>
              <ringGeometry args={[0.13, 0.15, 16]} />
              <meshStandardMaterial
                color="#FFC627"
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
            </mesh> */}
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

// 2D Image Mask as a 3D Plane
function ImageMask({ landmarks, videoWidth, videoHeight, opacity, size = 1.0, imageUrl }) {
  const maskRef = useRef();
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  const smoothingFactor = 0.1;
  const targetQuaternion = new THREE.Quaternion();

  useFrame(() => {
    if (!landmarks || !maskRef.current) return;

    // Define key landmark points
    const noseBridge = landmarks._positions[27];
    const leftJaw = landmarks._positions[0];
    const rightJaw = landmarks._positions[16];

    // --- Positioning and Scaling ---
    // Center the mask on the face using the nose bridge
    const faceX = (noseBridge.x / videoWidth) * 2 - 1;
    const faceY = -((noseBridge.y / videoHeight) * 2 - 1);

    // Calculate face width to scale the image appropriately
    const faceWidth = Math.abs(rightJaw.x - leftJaw.x);
    const scaleMultiplier = (faceWidth / videoWidth) * 4; // Adjust this multiplier for best fit

    // Calculate head rotation
    const headAngle = Math.atan2(
      rightJaw.y - leftJaw.y,
      rightJaw.x - leftJaw.x
    );

    // Smooth position
    const targetPosition = new THREE.Vector3(faceX, faceY - 0.15, 0.1);
    maskRef.current.position.lerp(targetPosition, smoothingFactor);

    // Smooth rotation
    targetQuaternion.setFromEuler(new THREE.Euler(0, 0, -headAngle));
    maskRef.current.quaternion.slerp(targetQuaternion, smoothingFactor);

    maskRef.current.scale.set(scaleMultiplier * size, scaleMultiplier * size, 1);
  });

  return (
    <mesh ref={maskRef}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} />
    </mesh>
  );
}

// 3D Sparky Character Component (ASU Mascot)
function SparkyCharacter({ landmarks, videoWidth, videoHeight, opacity, size = 1.0 }) {
  const sparkyRef = useRef();
  const smoothingFactor = 0.1;
  const targetQuaternion = new THREE.Quaternion();

  useFrame(() => {
    if (!landmarks || !sparkyRef.current) return;

    const leftJaw = landmarks._positions[1];
    const rightJaw = landmarks._positions[15];

    // Position Sparky on the left shoulder
    const shoulderX = (leftJaw.x / videoWidth) * 2 - 1 - 0.3;
    const shoulderY = -((leftJaw.y / videoHeight) * 2 - 1) - 0.3;

    console.log('SparkyCharacter rendering at:', { shoulderX, shoulderY });

    // Calculate head rotation
    const headAngle = Math.atan2(
      rightJaw.y - leftJaw.y,
      rightJaw.x - leftJaw.x
    );

    // Smooth position
    const targetPosition = new THREE.Vector3(shoulderX, shoulderY, 0);
    sparkyRef.current.position.lerp(targetPosition, smoothingFactor);

    // Smooth rotation
    targetQuaternion.setFromEuler(new THREE.Euler(0, 0, -headAngle));
    sparkyRef.current.quaternion.slerp(targetQuaternion, smoothingFactor);

    sparkyRef.current.scale.set(size, size, size);
  });

  return (
    <group ref={sparkyRef}>
      {/* Sparky's Head (wider and more accurate) */}
      <mesh position={[0, 0.15, 0]} scale={[1.15, 1, 1]}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial
          color="#8B0000"
          transparent
          opacity={opacity}
          emissive="#8B0000"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Sparky's Eyes (larger and angled) */}
      <mesh position={[-0.05, 0.17, 0.08]} scale={[1, 1.2, 1]} rotation={[0, 0, -0.1]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={opacity}
          emissive="#FFFFFF"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[0.05, 0.17, 0.08]} scale={[1, 1.2, 1]} rotation={[0, 0, 0.1]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={opacity}
          emissive="#FFFFFF"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Sparky's Pupils */}
      <mesh position={[-0.05, 0.17, 0.1]}>
        <sphereGeometry args={[0.01, 16, 16]} />
        <meshStandardMaterial color="#000000" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.05, 0.17, 0.1]}>
        <sphereGeometry args={[0.01, 16, 16]} />
        <meshStandardMaterial color="#000000" transparent opacity={opacity} />
      </mesh>

      {/* Sparky's Horns */}
      <mesh position={[-0.1, 0.2, 0]} rotation={[0, 0, -Math.PI / 5]}>
        <coneGeometry args={[0.025, 0.08, 8]} />
        <meshStandardMaterial
          color="#FFC627"
          transparent
          opacity={opacity}
          emissive="#FFC627"
          emissiveIntensity={0.4}
          metalness={0.5}
        />
      </mesh>
      <mesh position={[0.1, 0.2, 0]} rotation={[0, 0, Math.PI / 5]}>
        <coneGeometry args={[0.025, 0.08, 8]} />
        <meshStandardMaterial
          color="#FFC627"
          transparent
          opacity={opacity}
          emissive="#FFC627"
          emissiveIntensity={0.4}
          metalness={0.5}
        />
      </mesh>

      {/* Sparky's Mustache (Custom Smirk) */}
      <group position={[0, 0.12, 0.09]}>
        <mesh position={[-0.02, 0, 0]} rotation={[0, 0, 0.6]}>
          <cylinderGeometry args={[0.01, 0.01, 0.05, 8]} />
          <meshStandardMaterial color="#FFC627" emissive="#FFC627" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0.02, 0, 0]} rotation={[0, 0, -0.6]}>
          <cylinderGeometry args={[0.01, 0.01, 0.05, 8]} />
          <meshStandardMaterial color="#FFC627" emissive="#FFC627" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Sparky's Goatee (sharper) */}
      <mesh position={[0, 0.09, 0.08]} rotation={[0.1, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.02, 0.05, 4, 1]} />
        <meshStandardMaterial
          color="#FFC627"
          transparent
          opacity={opacity}
          emissive="#FFC627"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Sparky's Body (maroon) */}
      <mesh position={[0, -0.03, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.25, 8]} />
        <meshStandardMaterial
          color="#8B0000"
          transparent
          opacity={opacity}
          emissive="#8B0000"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Sparky's Arms */}
      <mesh position={[-0.07, 0.04, 0]} rotation={[0, 0, Math.PI / 8]}>
        <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
        <meshStandardMaterial color="#8B0000" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.07, 0.04, 0]} rotation={[0, 0, -Math.PI / 8]}>
        <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
        <meshStandardMaterial color="#8B0000" transparent opacity={opacity} />
      </mesh>

      {/* Sparky's Legs */}
      <mesh position={[-0.04, -0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.015, 0.08, 8]} />
        <meshStandardMaterial color="#8B0000" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.04, -0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.015, 0.08, 8]} />
        <meshStandardMaterial color="#8B0000" transparent opacity={opacity} />
      </mesh>

      {/* Sparky's Gold Belt */}
      <mesh position={[0, -0.06, 0]}>
        <torusGeometry args={[0.07, 0.008, 16, 32]} />
        <meshStandardMaterial
          color="#FFC627"
          transparent
          opacity={opacity}
          emissive="#FFC627"
          emissiveIntensity={0.6}
          metalness={0.8}
        />
      </mesh>

      {/* Sparky's Mini Pitchfork */}
      <group position={[0.1, 0, 0]} rotation={[0, 0, -Math.PI / 8]}>
        {/* Pitchfork handle */}
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.15, 8]} />
          <meshStandardMaterial color="#8B4513" transparent opacity={opacity} />
        </mesh>
        {/* Left prong */}
        <mesh position={[-0.015, 0.03, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.05, 8]} />
          <meshStandardMaterial
            color="#FFC627"
            transparent
            opacity={opacity}
            emissive="#FFC627"
            emissiveIntensity={0.6}
          />
        </mesh>
        {/* Center prong */}
        <mesh position={[0, 0.035, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.06, 8]} />
          <meshStandardMaterial
            color="#FFC627"
            transparent
            opacity={opacity}
            emissive="#FFC627"
            emissiveIntensity={0.6}
          />
        </mesh>
        {/* Right prong */}
        <mesh position={[0.015, 0.03, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.05, 8]} />
          <meshStandardMaterial
            color="#FFC627"
            transparent
            opacity={opacity}
            emissive="#FFC627"
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>

      {/* Sparky's Devil Tail */}
      <group position={[0.07, -0.16, -0.05]}>
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.015, 0.01, 0.1, 8]} />
          <meshStandardMaterial
            color="#8B0000"
            transparent
            opacity={opacity}
            emissive="#8B0000"
            emissiveIntensity={0.2}
          />
        </mesh>
        {/* Tail arrow tip */}
        <mesh position={[0.03, -0.06, 0]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.02, 0.04, 6]} />
          <meshStandardMaterial
            color="#FFC627"
            transparent
            opacity={opacity}
            emissive="#FFC627"
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>
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
  showSparky,
  showSparkyMask,
  hornsColor,
  glassesColor,
  pitchforkColor,
  pitchforkHandleColor,
  hornsSize,
  glassesSize,
  pitchforkSize,
  pitchforkRotation,
  sparkySize,
  sparkyMaskSize,
  hornsStyle,
  glassesStyle,
  handLandmarks
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
          {showSparky && (
            <SparkyCharacter
              landmarks={landmarks}
              videoWidth={videoWidth}
              videoHeight={videoHeight}
              opacity={opacity}
              size={sparkySize}
            />
          )}
        </>
      )}
      {showSparkyMask && landmarks && (
        <ImageMask
          landmarks={landmarks}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
          opacity={opacity}
          size={sparkyMaskSize}
          imageUrl="https://i.imgur.com/XpL3okk.png"
        />
      )}

      {/* Hand-held pitchfork appears when hand is detected */}
      {showPitchfork && handLandmarks && (
        <HandHeldPitchfork
          handLandmarks={handLandmarks}
          color={pitchforkColor}
          handleColor={pitchforkHandleColor}
          size={pitchforkSize}
          rotation={pitchforkRotation}
        />
      )}
    </>
  );
}

// Main Component
export default function ASUSparkyFaceFilter() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const handsRef = useRef(null); // MediaPipe Hands instance
  const cameraRef = useRef(null); // MediaPipe Camera instance

  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [pepTalk, setPepTalk] = useState('');
  const [opacity, setOpacity] = useState(0.9);
  const [landmarks, setLandmarks] = useState(null);
  const [videoSize, setVideoSize] = useState({ width: 640, height: 480 });

  const [showQuiz, setShowQuiz] = useState(false);

  // Screenshot selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const [startPoint, setStartPoint] = useState(null);

  // Hand detection state
  const [handLandmarks, setHandLandmarks] = useState(null);
  const [handsLoaded, setHandsLoaded] = useState(false);

  // Accessory toggles
  const [showHorns, setShowHorns] = useState(true);
  const [showGlasses, setShowGlasses] = useState(true);
  const [showPitchfork, setShowPitchfork] = useState(true);
  const [showSparky, setShowSparky] = useState(true);
  const [showSparkyMask, setShowSparkyMask] = useState(true);

  // Accessory colors
  const [hornsColor, setHornsColor] = useState('#8B0000');
  const [glassesColor, setGlassesColor] = useState('#8B0000');
  const [pitchforkColor, setPitchforkColor] = useState('#FFC627');
  const [pitchforkHandleColor, setPitchforkHandleColor] = useState('#8B4513');

  // Accessory sizes
  const [hornsSize, setHornsSize] = useState(1.0);
  const [glassesSize, setGlassesSize] = useState(1.0);
  const [pitchforkSize, setPitchforkSize] = useState(1.0);
  const [sparkySize, setSparkySize] = useState(1.0);
  const [sparkyMaskSize, setSparkyMaskSize] = useState(1.0);

  // Accessory rotation
  const [pitchforkRotation, setPitchforkRotation] = useState(0);

  // Accessory styles
  const [hornsStyle, setHornsStyle] = useState('devil'); // devil, curved, straight, ram, dragon
  const [glassesStyle, setGlassesStyle] = useState('rectangular'); // rectangular, round, aviator, cat-eye, visor

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

  // Load MediaPipe Hands from CDN
  useEffect(() => {
    const loadHandDetection = async () => {
      try {
        console.log('Loading MediaPipe Hands from CDN...');

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

        // Wait for scripts to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

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
            setHandLandmarks(results.multiHandLandmarks[0]);
          } else {
            setHandLandmarks(null);
          }
        });

        handsRef.current = hands;
        setHandsLoaded(true);
        console.log('MediaPipe Hands loaded successfully!');
      } catch (err) {
        console.error('Failed to load MediaPipe Hands:', err);
        // Don't set error state - hand detection is optional
        console.warn('Hand detection will not be available');
      }
    };

    loadHandDetection();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
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
      if (isActive) { // Only schedule the next frame if we are still active
        animationFrameRef.current = requestAnimationFrame(detectFaces);
      }

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detections.length > 0) {
        console.log('✓ Face detected! Video size:', video.videoWidth, 'x', video.videoHeight);
        console.log('✓ Nose bridge landmark:', detections[0].landmarks._positions[27]);
        setLandmarks(detections[0].landmarks); // videoSize is now set onloadedmetadata
      } else {
        console.log('✗ No face detected');
        setLandmarks(null);
      }
    } catch (err) {
      console.error('Face detection error:', err);
    }
  };

  // Start detection when active
  useEffect(() => {
    if (isActive && modelsLoaded && videoSize.width > 0) {
      detectFaces();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, modelsLoaded, videoSize]);

  // Start hand detection when camera becomes active
  useEffect(() => {
    if (!isActive || !videoRef.current || !handsLoaded || !window.Camera || cameraRef.current || videoSize.width === 0 || videoSize.height === 0) return;

    const startHandDetection = async () => {
      console.log('Starting hand detection...');
      const { Camera: CameraUtil } = window;
      const camera = new CameraUtil(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: videoSize.width,
        height: videoSize.height
      });

      camera.start();
      cameraRef.current = camera;
      console.log('Hand detection started!');
    };

    startHandDetection();

    // Cleanup function to stop the camera when the component unmounts or isActive becomes false
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [isActive, handsLoaded, videoSize]);

  // This effect activates the scene only after the video size is correctly set.
  // This prevents race conditions on startup.
  useEffect(() => {
    if (videoSize.width > 640 && !isActive) { // Use a width check to ensure it's not the default
      setIsActive(true);
    }
  }, [videoSize, isActive]);

  // Start camera
  const startCamera = async () => {
    // Reset accessory states when starting camera
    setShowHorns(false);
    setShowGlasses(false);
    setShowPitchfork(false);
    setShowSparky(false);
    setShowSparkyMask(false);

    // Set initial pitchfork rotation to 180 degrees
    setPitchforkRotation(Math.PI);

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
        videoRef.current.onloadedmetadata = async () => {
          try {
            setVideoSize({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight
            });
            await videoRef.current.play();
          } catch (err) {
            setError(`Video playback failed: ${err.message}`);
          }
        };
      }
    } catch (err) {
      setError(`Camera error: ${err.message}`);
    }
  };

  // Stop camera
  const stopCamera = () => {
    // Simply setting isActive to false will trigger the cleanup functions in the useEffect hooks
    // which is the correct React way to handle this.
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setLandmarks(null);
    setHandLandmarks(null);
    setVideoSize({ width: 640, height: 480 }); // Reset video size to prevent immediate restart
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

  // Redirect to ASU Quiz
  const redirectToQuiz = () => {
    setShowQuiz(true);
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
    selectionOverlay: {
      position: 'absolute',
      inset: 0,
      cursor: 'crosshair',
      zIndex: 20,
    },
    selectionBox: {
      position: 'absolute',
      border: '2px dashed #FFC627',
      backgroundColor: 'rgba(255, 198, 39, 0.2)',
      pointerEvents: 'none',
      zIndex: 21,
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

  // --- Interactive Screenshot Logic ---

  const startSelection = () => {
    setIsSelecting(true);
    // Add a listener to exit selection mode with the Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSelecting(false);
        setSelectionRect(null);
        setStartPoint(null);
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  };

  const handleMouseDown = (e) => {
    if (!isSelecting) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setStartPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setSelectionRect({ x: e.clientX - rect.left, y: e.clientY - rect.top, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isSelecting || !startPoint) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const newRect = {
      x: Math.min(startPoint.x, currentX),
      y: Math.min(startPoint.y, currentY),
      width: Math.abs(currentX - startPoint.x),
      height: Math.abs(currentY - startPoint.y),
    };
    setSelectionRect(newRect);
  };

  const handleMouseUp = () => {
    if (!isSelecting || !selectionRect || selectionRect.width === 0 || selectionRect.height === 0) {
      // If selection is invalid, just exit selection mode
      setIsSelecting(false);
      setStartPoint(null);
      setSelectionRect(null);
      return;
    }

    // Capture the selected region
    const video = videoRef.current;
    const threeCanvas = canvasRef.current;
    const videoRect = video.getBoundingClientRect();

    const scaleX = video.videoWidth / videoRect.width;
    const scaleY = video.videoHeight / videoRect.height;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = selectionRect.width * scaleX;
    tempCanvas.height = selectionRect.height * scaleY;
    const ctx = tempCanvas.getContext('2d');

    // Draw the selected region from the video and 3D canvas
    const sourceX = (videoRect.width - selectionRect.x - selectionRect.width) * scaleX; // Mirrored source X
    const sourceY = selectionRect.y * scaleY;

    // 1. Draw mirrored video portion
    ctx.drawImage(video, sourceX, sourceY, tempCanvas.width, tempCanvas.height, 0, 0, tempCanvas.width, tempCanvas.height);

    // 2. Draw mirrored 3D canvas portion
    ctx.drawImage(threeCanvas, sourceX, sourceY, tempCanvas.width, tempCanvas.height, 0, 0, tempCanvas.width, tempCanvas.height);

    // 3. Download the image
    const link = document.createElement('a');
    link.download = `asu-sparky-crop-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();

    // Exit selection mode
    setIsSelecting(false);
    setStartPoint(null);
    setSelectionRect(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>🔱 ASU Sparky AR Face Filter 🔱</h1>
          <p style={styles.subtitle}>3D AR Accessories with Three.js! Fork 'Em! 😈</p>
        </div>

        <div style={styles.cameraSection}>
          <div
            style={styles.videoContainer}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
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

            {isSelecting && (
              <div style={styles.selectionOverlay}>
                {selectionRect && (
                  <div style={{
                    ...styles.selectionBox,
                    left: `${selectionRect.x}px`,
                    top: `${selectionRect.y}px`,
                    width: `${selectionRect.width}px`,
                    height: `${selectionRect.height}px`,
                  }} />
                )}
              </div>
            )}

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
              >
                <Suspense fallback={null}>
                  <ARScene
                    // Pass all the state props to the AR Scene
                    landmarks={landmarks}
                    videoWidth={videoSize.width}
                    videoHeight={videoSize.height}
                    opacity={opacity}
                    showHorns={showHorns}
                    showGlasses={showGlasses}
                    showPitchfork={showPitchfork}
                    showSparky={showSparky}
                    showSparkyMask={showSparkyMask}
                    hornsColor={hornsColor}
                    glassesColor={glassesColor}
                    pitchforkColor={pitchforkColor}
                    pitchforkHandleColor={pitchforkHandleColor}
                    hornsSize={hornsSize}
                    glassesSize={glassesSize}
                    pitchforkSize={pitchforkSize}
                    pitchforkRotation={pitchforkRotation}
                    sparkySize={sparkySize}
                    sparkyMaskSize={sparkyMaskSize}
                    hornsStyle={hornsStyle}
                    glassesStyle={glassesStyle}
                    handLandmarks={handLandmarks}
                  />
                </Suspense>
              </Canvas>
            )}
          </div>

          {showQuiz ? (
            <ASUQuiz onBack={() => setShowQuiz(false)} styles={styles} />
          ) : (
            <>
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
                  onClick={startSelection}
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
                <button
                  onClick={redirectToQuiz}
                  style={{ ...styles.button, background: 'linear-gradient(90deg, #00A3E0 0%, #005A8C 100%)', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <BookOpen size={20} />
                  Take ASU Quiz!
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
                  <button
                    onClick={() => setShowSparky(!showSparky)}
                    style={{
                      ...styles.button,
                      background: showSparky ? 'linear-gradient(90deg, #FFC627 0%, #FFD700 100%)' : '#555',
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      color: showSparky ? '#8B0000' : '#FFF'
                    }}
                  >
                    😈 Sparky {showSparky ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => setShowSparkyMask(!showSparkyMask)}
                    style={{
                      ...styles.button,
                      background: showSparkyMask ? 'linear-gradient(90deg, #FFC627 0%, #FFD700 100%)' : '#555',
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      color: showSparkyMask ? '#8B0000' : '#FFF'
                    }}
                  >
                    😈 Sparky Mask {showSparkyMask ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Detection Status */}
              <div style={{
                marginTop: '20px',
                background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                border: '2px solid #FFC627',
                padding: '20px',
                borderRadius: '10px'
              }}>
                <h3 style={{ color: '#FFC627', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', margin: '0 0 15px 0' }}>
                  Detection Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ color: landmarks ? '#00FF00' : '#FF0000', fontSize: '0.9rem', textAlign: 'center', margin: '0' }}>
                    {landmarks ? '✓ Face detected - Accessories active!' : '✗ No face detected - Move into camera view'}
                  </p>
                  {showPitchfork && (
                    <p style={{ color: handLandmarks ? '#00FF00' : '#FFC627', fontSize: '0.9rem', textAlign: 'center', margin: '0' }}>
                      {handLandmarks ? '✓ Hand detected - Pitchfork active!' : '⌛ Raise your hand to hold the pitchfork'}
                    </p>
                  )}
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
                  <div>
                    <label style={{ color: '#FFF', fontSize: '0.9rem', display: 'block', textAlign: 'center', marginBottom: '5px' }}>
                      🔱 Pitchfork Size: {Math.round(pitchforkSize * 100)}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={pitchforkSize * 100}
                      onChange={(e) => setPitchforkSize(e.target.value / 100)}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#FFF', fontSize: '0.9rem', display: 'block', textAlign: 'center', marginBottom: '5px' }}>
                      😈 Sparky Size: {Math.round(sparkySize * 100)}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={sparkySize * 100}
                      onChange={(e) => setSparkySize(e.target.value / 100)}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#FFF', fontSize: '0.9rem', display: 'block', textAlign: 'center', marginBottom: '5px' }}>
                      😈 Sparky Mask Size: {Math.round(sparkyMaskSize * 100)}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={sparkyMaskSize * 100}
                      onChange={(e) => setSparkyMaskSize(e.target.value / 100)}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>

              {/* Pitchfork Rotation */}
              <div style={{
                marginTop: '20px',
                background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                border: '2px solid #FFC627',
                padding: '20px',
                borderRadius: '10px'
              }}>
                <h3 style={{ color: '#FFC627', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', margin: '0 0 15px 0' }}>
                  Pitchfork Rotation
                </h3>
                <div>
                  <label style={{ color: '#FFF', fontSize: '0.9rem', display: 'block', textAlign: 'center', marginBottom: '10px' }}>
                    🔱 Rotation: {Math.round((pitchforkRotation * 180) / Math.PI)}°
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={(pitchforkRotation * 180) / Math.PI}
                    onChange={(e) => setPitchforkRotation((e.target.value * Math.PI) / 180)}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                    <span style={{ color: '#FFC627', fontSize: '0.8rem' }}>-180°</span>
                    <span style={{ color: '#FFC627', fontSize: '0.8rem' }}>0°</span>
                    <span style={{ color: '#FFC627', fontSize: '0.8rem' }}>+180°</span>
                  </div>
                  <button
                    onClick={() => setPitchforkRotation(0)}
                    style={{
                      ...styles.button,
                      background: 'linear-gradient(90deg, #FFC627 0%, #FFD700 100%)',
                      color: '#8B0000',
                      padding: '8px 20px',
                      fontSize: '0.85rem',
                      marginTop: '10px',
                      width: '100%'
                    }}
                  >
                    Reset Rotation
                  </button>
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
                      <option value="ram">Ram (Spiral)</option>
                      <option value="dragon">Dragon (Twisted)</option>
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
                      <option value="cat-eye">Cat-Eye</option>
                      <option value="visor">Visor (Futuristic)</option>
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
