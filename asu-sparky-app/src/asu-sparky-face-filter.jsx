// Import React hooks for state management and lifecycle control
import React, { useRef, useEffect, useState } from 'react';

// Import icon components from lucide-react library for UI elements
import { Camera, Power, AlertCircle, Loader, Eye, EyeOff, Sparkles } from 'lucide-react';

// Import the face-api library for face detection and landmark tracking
import * as faceapi from '@vladmandic/face-api';

// Import the Sparky PNG image from assets folder
import sparkyPNG from './assets/500-5003481_asu-sparky-png-download-sparky-sun-devil-transparent.png';

/**
 * ASUSparkyFaceFilter Component
 *
 * This is the main React component that provides a webcam-based face filter
 * application with ASU Sparky branding. It detects faces in real-time using
 * machine learning models and overlays the ASU Sparky mascot on detected faces.
 *
 * Key Features:
 * - Real-time face detection using TinyFaceDetector model
 * - 68-point facial landmark tracking
 * - Sparky mascot overlay on detected faces
 * - Live webcam feed with canvas overlay for graphics
 * - ASU branding and styling
 */

export default function ASUSparkyFaceFilter() {
  // ========== REFS ==========
  // Refs provide direct access to DOM elements without triggering re-renders

  // Reference to the HTML <video> element that displays the webcam feed
  const videoRef = useRef(null);

  // Reference to the HTML <canvas> element where we draw face detection overlays
  const canvasRef = useRef(null);

  // Reference to store the animation frame ID for the detection loop
  // This is used to cancel the animation when stopping the camera
  const animationFrameRef = useRef(null);

  // Reference to store the loaded Sparky image for overlay rendering
  const sparkyImage = useRef(null);

  // ========== STATE VARIABLES ==========
  // State variables trigger component re-renders when updated

  // Tracks whether the camera is currently active and running
  const [isActive, setIsActive] = useState(false);

  // Stores any error messages to display to the user
  const [error, setError] = useState(null);

  // Indicates whether the ML models are currently being loaded
  const [isLoading, setIsLoading] = useState(false);

  // Tracks whether the face detection models have finished loading
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Controls whether facial landmarks are visible on the canvas
  // When true, shows 68 green landmark dots; when false, hides them
  const [showLandmarks, setShowLandmarks] = useState(true);

  // Stores the current pep talk message from Sparky
  const [pepTalk, setPepTalk] = useState('');

  // ========== INITIALIZATION EFFECT ==========
  // This useEffect runs once when the component mounts (empty dependency array [])
  // It handles loading the Sparky image and the ML models for face detection
  useEffect(() => {
    // ===== LOAD OVERLAY IMAGE =====
    // Create a new Image object to hold the Sparky PNG overlay
    const img = new Image();

    // Enable cross-origin loading for the image (needed for canvas drawing)
    img.crossOrigin = "anonymous";

    // Load the imported Sparky PNG from assets folder
    img.src = sparkyPNG;
    console.log('📸 Loading Sparky PNG from:', sparkyPNG);

    // Add error handling for image loading
    img.onerror = () => {
      console.error('❌ Failed to load Sparky PNG! Falling back to SVG...');
      // Fallback to SVG if PNG fails to load
      img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3CradialGradient id='grad1'%3E%3Cstop offset='0%25' style='stop-color:rgb(139,0,0);stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:rgb(220,20,60);stop-opacity:1' /%3E%3C/radialGradient%3E%3C/defs%3E%3Cellipse cx='100' cy='100' rx='80' ry='90' fill='url(%23grad1)' /%3E%3Ccircle cx='75' cy='80' r='8' fill='yellow' /%3E%3Ccircle cx='125' cy='80' r='8' fill='yellow' /%3E%3Cpath d='M 60 60 Q 50 40 55 35 L 50 30' stroke='%238B0000' stroke-width='3' fill='none' /%3E%3Cpath d='M 140 60 Q 150 40 145 35 L 150 30' stroke='%238B0000' stroke-width='3' fill='none' /%3E%3Cpath d='M 80 120 Q 100 135 120 120' stroke='black' stroke-width='3' fill='none' /%3E%3Cpath d='M 85 110 L 75 105 L 80 100' fill='white' /%3E%3Cpath d='M 115 110 L 125 105 L 120 100' fill='white' /%3E%3Ctext x='100' y='170' font-size='24' text-anchor='middle' fill='%23FFC627' font-weight='bold'%3EASU%3C/text%3E%3C/svg%3E";
    };

    img.onload = () => {
      console.log('✅ Sparky PNG loaded successfully!');
    };

    // Store the image in the ref so we can draw it on the canvas later
    sparkyImage.current = img;

    // ===== LOAD FACE DETECTION MODELS =====
    /**
     * Loads the machine learning models required for face detection
     * These models are loaded from a CDN and cached in the browser
     *
     * Models loaded:
     * 1. TinyFaceDetector - Fast, lightweight face detection model
     * 2. FaceLandmark68Net - Detects 68 facial landmarks (eyes, nose, mouth, jaw, etc.)
     */
    const loadModels = async () => {
      try {
        // Set loading state to show spinner to user
        setIsLoading(true);
        console.log('Loading face detection models...');

        // CDN URL where the pre-trained model files are hosted
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

        // Load both models in parallel using Promise.all for better performance
        // Each model consists of multiple files (weights, architecture, etc.)
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),    // ~300KB face detector
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)    // ~350KB landmark detector
        ]);

        // Update state to indicate models are ready for use
        setModelsLoaded(true);
        setIsLoading(false);
        console.log('Face detection models loaded successfully!');
      } catch (err) {
        // Handle any errors during model loading (network issues, invalid files, etc.)
        console.error('Failed to load models:', err);
        setError(`Failed to load face detection models: ${err.message}`);
        setIsLoading(false);
      }
    };

    // Execute the model loading function
    loadModels();

    // ===== CLEANUP FUNCTION =====
    // This function runs when the component unmounts
    // It cancels any ongoing animation frames to prevent memory leaks
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []); // Empty dependency array means this effect runs only once on mount

  // ========== PEP TALK GENERATOR ==========

  /**
   * Generates a random motivational pep talk from Sparky
   *
   * This function creates dynamic, personalized pep talks using:
   * - ASU-themed motivational phrases
   * - Sun Devil spirit and tradition
   * - Encouraging messages for students and fans
   * - Random selection for variety
   *
   * The pep talks are generated client-side with no AI API required
   */
  const generatePepTalk = () => {
    // Array of pep talk templates with ASU spirit
    const pepTalks = [
      "You've got that Sun Devil fire! 🔱 Keep pushing forward and Fork 'Em Devils!",
      "Sparky believes in you! You're unstoppable, just like our Sun Devils! 🌟",
      "Fear the Fork! You're doing amazing - ASU pride runs through your veins! 💛❤️",
      "Maroon and Gold flows through you! Stay strong and show that Devil determination! 🔱",
      "You're a true Sun Devil! Keep that innovation and excellence going! ⚡",
      "Sparky says: You're crushing it! Channel that ASU spirit and conquer the day! 🎉",
      "Forks Up! You've got this - show the world what Sun Devil strength looks like! 💪",
      "From Tempe to the world! Your ASU pride is shining bright today! ✨",
      "You embody the Sun Devil way! Stay fierce, stay focused, Fork 'Em! 🔥",
      "Sparky's pumped and so should you be! You're making Sun Devil Nation proud! 🎊",
      "Rise up like a true Sun Devil! Your potential is as limitless as the Arizona sky! 🌅",
      "Fear the Pitchfork! You're radiating that championship energy! 🏆",
      "You're glowing with Maroon and Gold excellence! Keep being legendary! 💫",
      "Sparky sees a winner! Keep that ASU innovation spirit burning bright! 🚀",
      "Forks up, head high! You're representing Sun Devil Nation with pride! 🔱",
      "From one Sun Devil to another: You're absolutely killing it! Fork 'Em! ⚡",
      "You've got that Tempe heat! Keep blazing your trail to success! 🌞",
      "Sparky's rooting for you! Show the world what ASU excellence looks like! 🌟",
      "Sun Devil strong! Your determination is as fierce as our mascot! 💪🔱",
      "You're a champion in Maroon and Gold! Keep that winning mentality! 🏆💛",
      "Innovation is in your DNA! ASU proud and ready to change the world! 🌍",
      "Tempe vibes and Sun Devil pride! You're on fire today! 🔥",
      "No mountain too high for a Sun Devil! Keep climbing! ⛰️",
      "Your ASU spirit is contagious! Spread that Maroon and Gold energy! 💛❤️",
      "Sparky knows you're destined for greatness! Keep shining bright! ⭐",
      "From the Valley of the Sun to victory! You've got this! ☀️",
      "Devil determination meets Sun Devil innovation! Unstoppable combo! 🚀",
      "ASU excellence runs deep in you! Keep making us proud! 🎓",
      "Forks up, chin up, never give up! That's the Sun Devil way! 🔱",
      "You're not just good, you're Sun Devil GREAT! Fork 'Em! 💪",
      "Sparky sees that championship mindset! Keep pushing forward! 🏆",
      "Maroon blood, Gold heart! You're a true Sun Devil warrior! ⚔️",
      "From Hayden Lawn to the world stage! Your journey is just beginning! 🌟",
      "ASU spirit never quits! And neither do you! Let's go! 🎉",
      "You've got that Pitchfork power! Nothing can stop you now! ⚡",
      "Sun Devil Nation is behind you! Feel that energy! 🔥",
      "Fear the Fork, embrace the challenge! You're ready for anything! 💪",
      "Sparky's cheering for you from the sidelines! Go get 'em! 📣",
      "Tempe tough, ASU proud! You embody excellence! ✨",
      "Your Sun Devil spirit lights up the desert! Keep glowing! 🌵",
      "Innovation Station! You're creating the future, Sun Devil! 🚂",
      "From Mill Avenue to Millionaire mindset! Dream big! 💰",
      "Sparky says: You're the MVP of your own story! 🏅",
      "Maroon and Gold never fold! Your resilience is incredible! 🔱",
      "Sun Devil stamina! You've got endless energy and passion! 💥",
      "ASU proud, head unbowed! You're conquering today! 👑",
      "Fork the limits! You're breaking barriers, Sun Devil! 🚧",
      "Sparky vibes: 100% positive, 100% powerful! That's you! ✅",
      "Desert heat can't match your Sun Devil fire! Blazing! 🏜️",
      "You're writing your ASU legacy right now! Make it legendary! 📖"
    ];

    // Randomly select a pep talk
    const randomIndex = Math.floor(Math.random() * pepTalks.length);
    const selectedPepTalk = pepTalks[randomIndex];

    // Update the state with the new pep talk
    setPepTalk(selectedPepTalk);

    // Log for debugging
    console.log('Generated pep talk:', selectedPepTalk);
  };

  // ========== CAMERA CONTROL FUNCTIONS ==========

  /**
   * Starts the user's webcam and begins the video stream
   *
   * This function:
   * 1. Requests permission to access the user's camera
   * 2. Sets up the video stream with specific resolution
   * 3. Connects the stream to the video element
   * 4. Handles playback and updates the active state
   *
   * @async
   */
  const startCamera = async () => {
    console.log('Starting camera...');
    try {
      // Request access to the user's camera via the MediaDevices API
      // This will trigger a browser permission prompt if not already granted
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,          // Request 640px width (VGA resolution)
          height: 480,         // Request 480px height (4:3 aspect ratio)
          facingMode: 'user'   // Use front-facing camera (for selfies)
        }
      });

      // Check if the video element ref is available
      if (videoRef.current) {
        // Attach the camera stream to the video element
        // This connects the live camera feed to the <video> tag
        videoRef.current.srcObject = stream;

        // Set up an event listener for when the video metadata is loaded
        // Metadata includes video dimensions, duration, etc.
        videoRef.current.onloadedmetadata = () => {
          // Attempt to start playing the video
          videoRef.current.play().then(() => {
            console.log('Video playing successfully');
            setIsActive(true);    // Update state to indicate camera is active
            setError(null);       // Clear any previous errors
          }).catch(err => {
            // Handle errors during video playback (autoplay restrictions, etc.)
            console.error('Video play error:', err);
            setError(`Video playback failed: ${err.message}`);
          });
        };
      }
    } catch (err) {
      // Handle errors during camera access (permission denied, no camera, etc.)
      console.error('Camera error details:', err);
      setError(`Camera error: ${err.name} - ${err.message}`);
    }
  };

  /**
   * Stops the webcam and cleans up all related resources
   *
   * This function:
   * 1. Stops all media tracks (camera stream)
   * 2. Cancels the face detection animation loop
   * 3. Clears the video element
   * 4. Updates the active state
   */
  const stopCamera = () => {
    // Check if the video element has an active stream
    if (videoRef.current && videoRef.current.srcObject) {
      // Get the MediaStream object from the video element
      const stream = videoRef.current.srcObject;

      // Get all tracks (video and audio, though we only use video)
      const tracks = stream.getTracks();

      // Stop each track to release the camera
      // This turns off the camera light and frees the hardware
      tracks.forEach(track => track.stop());

      // Clear the video element's source to remove the stream
      videoRef.current.srcObject = null;
    }

    // Cancel the ongoing face detection animation loop
    // This stops the continuous frame-by-frame processing
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Update state to indicate camera is no longer active
    setIsActive(false);
  };

  // ========== FACE DETECTION LOOP ==========

  /**
   * Main face detection and rendering loop
   *
   * This function runs continuously (via requestAnimationFrame) and:
   * 1. Captures the current video frame
   * 2. Runs face detection ML models on the frame
   * 3. Extracts 68 facial landmarks for each detected face
   * 4. Draws the video frame, landmarks, and Sparky overlay on canvas
   * 5. Adds text overlays and branding
   * 6. Schedules itself to run again on the next frame (~60fps)
   *
   * The 68 facial landmarks represent key points on the face:
   * - Points 0-16: Jaw line
   * - Points 17-21: Left eyebrow
   * - Points 22-26: Right eyebrow
   * - Points 27-35: Nose
   * - Points 36-41: Left eye
   * - Points 42-47: Right eye
   * - Points 48-67: Mouth
   *
   * @async
   */
  const detectFaces = async () => {
    // Safety check: ensure all required elements and states are ready
    // Exit early if video, canvas, or models aren't available
    if (!videoRef.current || !canvasRef.current || !isActive || !modelsLoaded) return;

    // Get references to video and canvas elements
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d'); // Get 2D drawing context for canvas

    // Check if video has enough data loaded to process
    // HAVE_ENOUGH_DATA means we have frames available to read
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // ===== SETUP CANVAS =====
      // Match canvas dimensions to actual video dimensions
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      canvas.width = displaySize.width;
      canvas.height = displaySize.height;

      // Clear the canvas from the previous frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the current video frame onto the canvas
      // This provides the background for our overlays
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        // ===== RUN FACE DETECTION =====
        // Use the face-api library to detect all faces in the current frame
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,        // Input size for the model (larger = slower but more accurate)
            scoreThreshold: 0.5    // Confidence threshold (0-1, higher = stricter)
          }))
          .withFaceLandmarks();    // Also detect 68 facial landmarks for each face

        console.log(`Faces detected: ${detections.length}`);

        // ===== PROCESS DETECTED FACES =====
        if (detections.length > 0) {
          // Get the first detected face (we only process one face at a time)
          const detection = detections[0];
          const landmarks = detection.landmarks;  // 68 facial landmark points
          const box = detection.detection.box;    // Bounding box around the face

          console.log('Face detected at:', box);

          // ===== DRAW FACE BOUNDING BOX =====
          // Draw a red rectangle around the detected face (draw this first, before Sparky)
          ctx.strokeStyle = '#FF0000';  // Red color
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // ===== OVERLAY SPARKY IMAGE =====
          // Calculate Sparky overlay size and position
          const scale = 1.5;  // Make Sparky 50% larger than the face
          const sparkyWidth = box.width * scale;
          const sparkyHeight = box.height * scale;

          // Center Sparky on the face by calculating offset
          const sparkyX = box.x - (sparkyWidth - box.width) / 2;
          const sparkyY = box.y - (sparkyHeight - box.height) / 2;

          // Draw the Sparky image if it's fully loaded
          if (sparkyImage.current.complete) {
            ctx.globalAlpha = 0.5;  // Set 50% transparency for the overlay
            ctx.drawImage(sparkyImage.current, sparkyX, sparkyY, sparkyWidth, sparkyHeight);
            ctx.globalAlpha = 1.0;  // Reset to full opacity for subsequent drawings
          }

          // ===== ADD TEXT OVERLAYS =====
          // Draw "Go Sun Devils!" text with outline (stroke + fill for bold effect)
          ctx.fillStyle = '#FFC627';        // ASU gold color
          ctx.font = 'bold 24px Arial';
          ctx.strokeStyle = '#8B0000';      // Dark red outline
          ctx.lineWidth = 3;
          ctx.strokeText('Go Sun Devils!', 20, canvas.height - 20);  // Draw outline
          ctx.fillText('Go Sun Devils!', 20, canvas.height - 20);    // Draw fill

          // ===== DRAW FACIAL LANDMARKS (ON TOP OF EVERYTHING) =====
          // DEBUG: Log landmark visibility state
          console.log('showLandmarks state:', showLandmarks);
          console.log('Number of landmark positions:', landmarks.positions.length);

          // Only draw landmarks if the user has enabled them
          if (showLandmarks) {
            // Get all 68 landmark positions (x, y coordinates)
            const positions = landmarks.positions;

            // DEBUG: Log that we're about to draw landmarks
            console.log('Drawing landmarks now...');

            // Draw each landmark as a bright green dot with yellow outline
            // Drawing AFTER Sparky overlay so landmarks appear on top
            positions.forEach((point, index) => {
              ctx.beginPath();
              // Draw a larger circle at each landmark position (8px for maximum visibility)
              ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
              ctx.fillStyle = '#00FF00';  // Bright green fill
              ctx.fill();
              ctx.strokeStyle = '#FFFF00';  // Yellow border for contrast
              ctx.lineWidth = 3;
              ctx.stroke();
            });

            // DEBUG: Confirm landmarks were drawn
            console.log(`Drew ${positions.length} landmarks`);
          } else {
            // DEBUG: Log that landmarks are hidden
            console.log('Landmarks are hidden by user toggle');
          }

          // ===== DEBUG INFO PANEL =====
          // Show comprehensive debug info in top-left corner
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';  // Semi-transparent black background
          ctx.fillRect(10, 10, 400, 120);  // Debug panel background

          // Landmark status
          ctx.fillStyle = showLandmarks ? '#00FF00' : '#FF0000';  // Green if shown, red if hidden
          ctx.font = 'bold 18px Arial';
          ctx.fillText(
            `Landmarks: ${showLandmarks ? 'VISIBLE ✓' : 'HIDDEN ✗'}`,
            20,
            35
          );

          // Detection count
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px Arial';
          ctx.fillText(`Faces detected: ${detections.length}`, 20, 60);
          ctx.fillText(`Landmark points: ${landmarks.positions.length}`, 20, 80);
          ctx.fillText(`Canvas size: ${canvas.width}x${canvas.height}`, 20, 100);
          ctx.fillText(`showLandmarks state: ${showLandmarks}`, 20, 120);
        } else {
          // ===== NO FACE DETECTED =====
          // Display a helpful message to the user
          ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';  // Semi-transparent yellow
          ctx.font = 'bold 20px Arial';
          ctx.fillText('No face detected - move closer or improve lighting', 20, 40);
        }
      } catch (err) {
        // Log any errors during face detection (shouldn't happen often)
        console.error('Face detection error:', err);
      }
    }

    // ===== SCHEDULE NEXT FRAME =====
    // Request the browser to call this function again before the next repaint
    // This creates a smooth animation loop running at ~60fps
    animationFrameRef.current = requestAnimationFrame(detectFaces);
  };

  // ========== LANDMARK DEBUG EFFECT ==========
  // This useEffect logs whenever showLandmarks changes
  useEffect(() => {
    console.log('✨ showLandmarks state changed to:', showLandmarks);
  }, [showLandmarks]);

  // ========== DETECTION EFFECT ==========
  // This useEffect starts the face detection loop when the camera becomes active
  // and stops it when the camera is turned off or component unmounts
  useEffect(() => {
    console.log('🎬 Detection effect triggered. isActive:', isActive, 'modelsLoaded:', modelsLoaded, 'showLandmarks:', showLandmarks);

    // Start the detection loop only when both conditions are met:
    // 1. Camera is active (isActive = true)
    // 2. ML models have finished loading (modelsLoaded = true)
    if (isActive && modelsLoaded) {
      console.log('🚀 Starting detection loop...');
      detectFaces();  // Kick off the first frame of the detection loop
    }

    // Cleanup function that runs when the component unmounts or dependencies change
    return () => {
      if (animationFrameRef.current) {
        console.log('🛑 Canceling animation frame...');
        // Cancel the animation frame to stop the detection loop
        // This prevents memory leaks and unnecessary processing
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, modelsLoaded, showLandmarks]);  // Re-run effect when landmarks toggle changes

  // ========== STYLES ==========
  // Inline CSS-in-JS styles for all UI components
  // Using inline styles for this component instead of separate CSS files
  // Responsive design implemented with flexible units and proper padding/margins
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #8B0000 50%, #B8860B 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(10px, 3vw, 20px)',  // Responsive padding: 10px-20px based on viewport
      fontFamily: 'Arial, sans-serif'
    },
    maxWidth: {
      maxWidth: '1200px',
      width: '100%'
    },
    card: {
      background: '#2d2d2d',
      borderRadius: 'clamp(10px, 2vw, 20px)',  // Responsive border radius
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      overflow: 'hidden',
      border: 'clamp(2px, 0.5vw, 4px) solid #FFC627'  // Responsive border width
    },
    header: {
      background: 'linear-gradient(90deg, #8B0000 0%, #FFC627 100%)',
      padding: 'clamp(15px, 4vw, 30px)',  // Responsive padding
      textAlign: 'center'
    },
    title: {
      fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',  // Responsive font: 1.5rem on mobile, 2.5rem on desktop
      fontWeight: 'bold',
      color: 'white',
      marginBottom: '10px',
      margin: 0,
      lineHeight: '1.2'  // Better text wrapping on small screens
    },
    subtitle: {
      color: '#FFF8DC',
      fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',  // Responsive subtitle
      margin: 0
    },
    cameraSection: {
      padding: 'clamp(15px, 4vw, 30px)',  // Responsive padding
      background: '#1a1a1a'
    },
    videoContainer: {
      position: 'relative',
      background: 'black',
      borderRadius: '10px',
      overflow: 'hidden',
      aspectRatio: '4/3',
      width: '100%'
    },
    placeholder: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#333',
      textAlign: 'center',
      flexDirection: 'column'
    },
    placeholderContent: {
      color: '#FFF8DC',
      padding: '20px'
    },
    placeholderText: {
      fontSize: 'clamp(1rem, 3vw, 1.3rem)',  // Responsive text
      marginBottom: '20px',
      color: '#FFF8DC'
    },
    button: {
      background: 'linear-gradient(90deg, #DC143C 0%, #FFC627 100%)',
      color: 'white',
      fontWeight: 'bold',
      padding: 'clamp(12px, 2vw, 15px) clamp(25px, 5vw, 40px)',  // Responsive button padding
      borderRadius: '50px',
      border: 'none',
      fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',  // Responsive font
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(220, 20, 60, 0.4)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      justifyContent: 'center',  // Center content on smaller screens
      width: 'auto',  // Allow button to shrink on mobile
      minWidth: 'fit-content'
    },
    stopButton: {
      background: '#DC143C',
      color: 'white',
      fontWeight: 'bold',
      padding: 'clamp(12px, 2vw, 15px) clamp(25px, 5vw, 40px)',  // Responsive button padding
      borderRadius: '50px',
      border: 'none',
      fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',  // Responsive font
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(220, 20, 60, 0.4)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      justifyContent: 'center',  // Center content on smaller screens
      width: 'auto',
      minWidth: 'fit-content'
    },
    toggleButton: {
      background: '#FFC627',  // ASU gold
      color: '#8B0000',       // Dark red text
      fontWeight: 'bold',
      padding: 'clamp(12px, 2vw, 15px) clamp(25px, 5vw, 40px)',  // Responsive button padding
      borderRadius: '50px',
      border: 'none',
      fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',  // Responsive font
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(255, 198, 39, 0.4)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      justifyContent: 'center',
      width: 'auto',
      minWidth: 'fit-content',
      marginLeft: 'clamp(10px, 2vw, 15px)'  // Space between buttons
    },
    pepTalkButton: {
      background: 'linear-gradient(90deg, #8B0000 0%, #FFC627 100%)',
      color: 'white',
      fontWeight: 'bold',
      padding: 'clamp(12px, 2vw, 15px) clamp(25px, 5vw, 40px)',
      borderRadius: '50px',
      border: 'none',
      fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(139, 0, 0, 0.4)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      justifyContent: 'center',
      width: '100%',
      marginTop: '15px'
    },
    pepTalkBox: {
      marginTop: '20px',
      background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)',
      border: '3px solid #FFC627',
      padding: 'clamp(15px, 3vw, 20px)',
      borderRadius: '15px',
      minHeight: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 25px rgba(255, 198, 39, 0.3)'
    },
    pepTalkText: {
      color: 'white',
      fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: '1.6',
      margin: 0
    },
    video: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    canvas: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    errorBox: {
      marginTop: '20px',
      background: '#8B0000',
      borderLeft: '4px solid #DC143C',
      padding: 'clamp(10px, 2vw, 15px)',  // Responsive padding
      borderRadius: '5px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap'  // Wrap on very small screens
    },
    errorText: {
      color: '#FFB6C1',
      margin: 0,
      fontSize: 'clamp(0.85rem, 2vw, 1rem)'  // Responsive text
    },
    loadingBox: {
      marginTop: '20px',
      background: '#B8860B',
      borderLeft: '4px solid #FFC627',
      padding: 'clamp(10px, 2vw, 15px)',  // Responsive padding
      borderRadius: '5px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap'  // Wrap on very small screens
    },
    loadingText: {
      color: '#FFF8DC',
      margin: 0,
      fontSize: 'clamp(0.85rem, 2vw, 1rem)'  // Responsive text
    },
    controls: {
      marginTop: 'clamp(15px, 4vw, 30px)',  // Responsive margin
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',  // Wrap buttons on very small screens
      gap: '10px'  // Space between buttons when they wrap
    },
    footer: {
      background: '#2d2d2d',
      padding: 'clamp(15px, 3vw, 20px)',  // Responsive padding
      textAlign: 'center',
      borderTop: '2px solid #FFC627'
    },
    footerText: {
      color: '#FFC627',
      fontWeight: '600',
      margin: 0,
      fontSize: 'clamp(0.85rem, 2vw, 1rem)'  // Responsive text
    },
    instructions: {
      marginTop: 'clamp(15px, 4vw, 30px)',  // Responsive margin
      background: '#2d2d2d',
      borderRadius: '10px',
      padding: 'clamp(15px, 4vw, 30px)',  // Responsive padding
      border: '2px solid #FFC627'
    },
    instructionsTitle: {
      fontSize: 'clamp(1.2rem, 3.5vw, 1.5rem)',  // Responsive title
      fontWeight: 'bold',
      color: '#FFC627',
      marginBottom: '15px',
      marginTop: 0
    },
    instructionsList: {
      color: '#ccc',
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    instructionItem: {
      marginBottom: '10px',
      fontSize: 'clamp(0.9rem, 2.2vw, 1.05rem)'  // Responsive list items
    },
    spinner: {
      animation: 'spin 1s linear infinite'
    },
    debugPanel: {
      marginTop: '20px',
      background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
      border: '3px solid #00FF00',
      padding: 'clamp(15px, 3vw, 20px)',
      borderRadius: '10px',
      fontFamily: 'monospace'
    },
    debugTitle: {
      color: '#00FF00',
      fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
      fontWeight: 'bold',
      marginBottom: '15px',
      textAlign: 'center'
    },
    debugItem: {
      color: '#FFC627',
      fontSize: 'clamp(0.95rem, 2.2vw, 1.1rem)',
      marginBottom: '8px',
      padding: '5px',
      background: 'rgba(255, 198, 39, 0.1)',
      borderRadius: '5px'
    }
  };

  // ========== COMPONENT RENDER ==========
  // Returns the JSX that defines the component's UI structure
  return (
    // Main container with gradient background
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.maxWidth}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>
              🔱 ASU Sparky Face Filter 🔱
            </h1>
            <p style={styles.subtitle}>
              Become a Sun Devil! Fork 'Em! 😈
            </p>
          </div>

          <div style={styles.cameraSection}>
            <div style={styles.videoContainer}>
              {!isActive && (
                <div style={styles.placeholder}>
                  <div style={styles.placeholderContent}>
                    <Camera size={80} color="#FFC627" style={{ marginBottom: '20px' }} />
                    <p style={styles.placeholderText}>Ready to transform into Sparky?</p>
                    <button
                      onClick={startCamera}
                      style={styles.button}
                      disabled={isLoading || !modelsLoaded}
                      onMouseOver={(e) => !e.target.disabled && (e.target.style.transform = 'scale(1.05)')}
                      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      {isLoading ? 'Loading Models...' : 'Start Camera'}
                    </button>
                  </div>
                </div>
              )}
              
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{...styles.video, display: isActive ? 'block' : 'none'}}
              />
              
              <canvas
                ref={canvasRef}
                style={{...styles.canvas, display: isActive ? 'block' : 'none'}}
              />
            </div>

            {isLoading && (
              <div style={styles.loadingBox}>
                <Loader color="#FFF8DC" style={styles.spinner} />
                <p style={styles.loadingText}>
                  Loading face detection models from CDN... This may take a moment.
                </p>
              </div>
            )}

            {error && (
              <div style={styles.errorBox}>
                <AlertCircle color="#FFB6C1" />
                <p style={styles.errorText}>{error}</p>
              </div>
            )}

            {isActive && (
              <>
                <div style={styles.controls}>
                  <button
                    onClick={stopCamera}
                    style={styles.stopButton}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    <Power size={20} />
                    Stop Camera
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔘 Toggle button clicked! Current state:', showLandmarks);
                      const newState = !showLandmarks;
                      setShowLandmarks(newState);
                      console.log('🔄 Setting showLandmarks to:', newState);
                    }}
                    style={styles.toggleButton}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    {showLandmarks ? <EyeOff size={20} /> : <Eye size={20} />}
                    {showLandmarks ? 'Hide Landmarks' : 'Show Landmarks'}
                  </button>
                </div>

                {/* Sparky's Pep Talk Section */}
                <div>
                  <button
                    onClick={generatePepTalk}
                    style={styles.pepTalkButton}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    <Sparkles size={20} />
                    Get Sparky's Pep Talk!
                  </button>

                  {/* Always render the box to prevent layout shift */}
                  <div style={styles.pepTalkBox}>
                    <p style={styles.pepTalkText}>
                      {pepTalk || "Click the button above for a motivational pep talk from Sparky! 🔱"}
                    </p>
                  </div>
                </div>

                {/* DEBUG PANEL - Shows current state for troubleshooting */}
                <div style={styles.debugPanel}>
                  <h4 style={styles.debugTitle}>🔍 DEBUG TEST PANEL 🔍</h4>
                  <div style={styles.debugItem}>
                    ⚙️ showLandmarks State: <strong style={{color: showLandmarks ? '#00FF00' : '#FF0000'}}>{String(showLandmarks)}</strong>
                  </div>
                  <div style={styles.debugItem}>
                    📹 Camera Active: <strong>{String(isActive)}</strong>
                  </div>
                  <div style={styles.debugItem}>
                    🤖 Models Loaded: <strong>{String(modelsLoaded)}</strong>
                  </div>
                  <div style={styles.debugItem}>
                    💬 Check browser console (F12) for detailed logs
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Built with 💛 for Sun Devil Nation | Go ASU! 🔱
            </p>
          </div>
        </div>

        <div style={styles.instructions}>
          <h3 style={styles.instructionsTitle}>How to Use:</h3>
          <ul style={styles.instructionsList}>
            <li style={styles.instructionItem}>✅ Wait for models to load (happens once)</li>
            <li style={styles.instructionItem}>🎥 Click "Start Camera" to activate your webcam</li>
            <li style={styles.instructionItem}>💡 Make sure you have good lighting</li>
            <li style={styles.instructionItem}>🎭 Face the camera directly and move closer if needed</li>
            <li style={styles.instructionItem}>🟢 Watch the 68 green dots track your facial features!</li>
            <li style={styles.instructionItem}>👁️ Toggle landmarks visibility with the Show/Hide button</li>
            <li style={styles.instructionItem}>✨ Click "Get Sparky's Pep Talk!" for motivational messages</li>
            <li style={styles.instructionItem}>🔱 Show your Sun Devil pride!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}