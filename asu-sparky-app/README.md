# ASU Sparky Face Filter

A real-time face detection web application that overlays the ASU Sparky mascot on your face using machine learning. Built with React, Vite, and face-api.js.

## Features

- **Real-time Face Detection**: Uses TinyFaceDetector ML model for fast face detection
- **68-Point Facial Landmark Tracking**: Tracks key facial features including eyes, nose, mouth, and jawline
- **Sparky Overlay**: Automatically overlays ASU's Sparky mascot on detected faces
- **Live Webcam Feed**: Runs entirely in the browser with no server required
- **ASU Branding**: Full Sun Devil pride with ASU colors and styling

## How It Works

The application uses TensorFlow.js-based machine learning models to:

1. Detect faces in real-time from your webcam feed
2. Identify 68 facial landmarks on each detected face
3. Overlay the Sparky mascot image scaled to fit your face
4. Display all processing live on an HTML5 canvas

### Face Landmark Breakdown

The 68 facial landmarks represent:
- **Points 0-16**: Jaw line
- **Points 17-21**: Left eyebrow
- **Points 22-26**: Right eyebrow
- **Points 27-35**: Nose
- **Points 36-41**: Left eye
- **Points 42-47**: Right eye
- **Points 48-67**: Mouth

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- A modern web browser with webcam access (Chrome, Firefox, Safari, Edge)
- Webcam/camera device

## Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd asu_sparky
   ```

2. **Navigate to the app directory**:
   ```bash
   cd asu-sparky-app
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

## Running the Application

Follow these steps to run the ASU Sparky Face Filter:

1. **Navigate to the app directory** (if you haven't already):
   ```bash
   cd asu-sparky-app
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open the application in your browser**:
   - Look for the local server URL in the terminal output (typically `http://localhost:5173`)
   - **macOS/Linux**: Hold `Cmd` and click the localhost URL
   - **Windows**: Hold `Ctrl` and click the localhost URL
   - Or manually copy and paste the URL into your browser

4. **Allow camera access** when prompted by your browser

5. **Click "Start Camera"** to begin the face detection

6. **Position your face** in front of the camera and watch Sparky appear!

## Usage Tips

- Ensure you have **good lighting** for best face detection results
- **Face the camera directly** for optimal landmark tracking
- **Move closer** if your face isn't being detected
- The app displays **green dots** showing the 68 facial landmarks being tracked
- A **red bounding box** appears around detected faces
- The **Sparky overlay** is semi-transparent so you can see both your face and the mascot

## Project Structure

```
asu-sparky-app/
├── src/
│   ├── asu-sparky-face-filter.jsx  # Main component with face detection logic
│   ├── main.jsx                    # React entry point
│   ├── index.css                   # Global styles
│   └── App.css                     # App-specific styles
├── public/                         # Static assets
├── index.html                      # HTML entry point
├── package.json                    # Dependencies and scripts
├── vite.config.js                  # Vite configuration
└── README.md                       # This file
```

## Technologies Used

- **React 19.1.1**: UI framework
- **Vite**: Fast build tool and dev server
- **@vladmandic/face-api**: Face detection and landmark tracking (TensorFlow.js-based)
- **Lucide React**: Icon components
- **HTML5 Canvas**: Real-time graphics rendering
- **MediaDevices API**: Webcam access

## Build for Production

To create a production build:

```bash
npm run build
```

The optimized files will be in the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

## Browser Compatibility

This application requires:
- Modern browser with ES6+ support
- WebRTC support for camera access
- Canvas API support
- WebGL support (for TensorFlow.js)

**Recommended browsers**:
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Troubleshooting

### Camera Not Working
- Check browser permissions for camera access
- Ensure no other application is using the camera
- Try refreshing the page
- Check browser console for error messages

### Face Not Detected
- Improve lighting conditions
- Move closer to the camera
- Face the camera directly
- Ensure your face is fully visible

### Models Not Loading
- Check your internet connection (models are loaded from CDN)
- Wait a moment for the models to download (~650KB total)
- Clear browser cache and try again

### Performance Issues
- Close other browser tabs
- Ensure your device has adequate processing power
- Lower browser zoom level
- Try a different browser

## Development

To modify the code:

1. The main face detection logic is in `src/asu-sparky-face-filter.jsx`
2. Run `npm run dev` for hot-reloading during development
3. The app uses inline styles - modify the `styles` object in the component
4. Face detection parameters can be adjusted in the `detectFaces()` function

### Key Configuration Options

In `detectFaces()` function:
- `inputSize: 320` - Model input size (increase for better accuracy, decrease for speed)
- `scoreThreshold: 0.5` - Detection confidence threshold (0-1)
- `scale: 1.5` - Sparky overlay size multiplier

## License

This project is for educational and promotional purposes for Arizona State University.

## Credits

Built with love for Sun Devil Nation! Fork 'Em! 🔱

---

**Go ASU! Go Sun Devils!**
