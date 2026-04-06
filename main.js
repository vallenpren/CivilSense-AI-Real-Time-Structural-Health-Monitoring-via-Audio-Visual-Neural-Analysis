// DOM Elements
const videoElement = document.getElementById('cameraFeed');
const btnStartAudio = document.getElementById('btnStartAudio');
const btnScan = document.getElementById('btnScan');
const btnToggleAR = document.getElementById('btnToggleAR');
const arOverlay = document.getElementById('ar-overlay');
const scanFrame = document.querySelector('.scan-frame');

// Update UI Text Elements
const valFreq = document.getElementById('valFreq');
const valAmp = document.getElementById('valAmp');
const valDepth = document.getElementById('valDepth');
const valWidth = document.getElementById('valWidth');
const overallStatus = document.getElementById('overallStatus');

// Canvas Audio Visualizer
const canvas = document.getElementById('audioVisualizer');
const canvasCtx = canvas.getContext('2d');

// State
let audioContext;
let analyser;
let dataArray;
let source;
let isAudioScanning = false;
let animationId;

// Initialize Camera
async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: true // needed for mic access
    });
    videoElement.srcObject = stream;
    
    // Setup Audio Context from camera stream (or mic)
    initAudio(stream);
    
  } catch (err) {
    console.error('Camera/Mic access denied or unavailable.', err);
    // Fallback Mock Video or static behavior
  }
}

// Initialize Audio Context for visualization
function initAudio(stream) {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  
  source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  
  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  
  // Set Canvas proper size based on CSS
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  
  drawVisualizer();
}

function drawVisualizer() {
  animationId = requestAnimationFrame(drawVisualizer);

  if (!isAudioScanning) {
    // Draw flat line
    canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, canvas.height / 2);
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
    return;
  }

  analyser.getByteFrequencyData(dataArray);

  canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  const barWidth = (canvas.width / dataArray.length) * 2.5;
  let barHeight;
  let x = 0;

  // Mock specific frequency ranges for "Concrete Analysis"
  let maxAmp = 0;

  for (let i = 0; i < dataArray.length; i++) {
    barHeight = dataArray[i];
    if(barHeight > maxAmp) maxAmp = barHeight;

    canvasCtx.fillStyle = `rgb(${barHeight + 50}, 240, 255)`;
    canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

    x += barWidth + 1;
  }
  
  // Update mock UI metrics slightly based on amplitude
  if (Math.random() > 0.8) {
    valFreq.textContent = `${Math.floor(800 + (maxAmp * 10))} Hz`;
    valAmp.textContent = `${Math.floor(-60 + (maxAmp / 4))} dB`;
  }
}

// Audio Button Handler
btnStartAudio.addEventListener('click', async () => {
  if (!audioContext) {
    alert("Please allow microphone permissions first.");
    return;
  }
  
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  
  isAudioScanning = !isAudioScanning;
  btnStartAudio.textContent = isAudioScanning ? "STOP SCANNING" : "START AUDIO SCAN";
  
  if (isAudioScanning) {
    btnStartAudio.classList.add('active');
    btnStartAudio.style.background = 'var(--primary)';
    btnStartAudio.style.color = '#000';
  } else {
    btnStartAudio.classList.remove('active');
    btnStartAudio.style.background = '';
    btnStartAudio.style.color = '';
    valFreq.textContent = "0 Hz";
    valAmp.textContent = "0 dB";
  }
});

// Vision Scan Handler (Mock Edge Detection / AI processing)
btnScan.addEventListener('click', () => {
  if (scanFrame.classList.contains('scanning')) return;
  
  scanFrame.classList.add('scanning');
  valDepth.textContent = "Analisis...";
  valDepth.className = "value warning";
  valWidth.textContent = "Analisis...";
  valWidth.className = "value warning";
  overallStatus.textContent = "PROCESSING";
  overallStatus.className = "status-badge warning";
  
  btnScan.textContent = "ANALYZING 3D MESH...";
  
  // Simulate AI processing time
  setTimeout(() => {
    scanFrame.classList.remove('scanning');
    btnScan.textContent = "ANALYZE CURRENT FRAME";
    
    // Simulate finding a crack
    valDepth.textContent = "12.4 mm";
    valDepth.className = "value critical";
    
    valWidth.textContent = "4.2 mm";
    valWidth.className = "value warning";
    
    overallStatus.textContent = "CRITICAL";
    overallStatus.className = "status-badge critical";
  }, 3000);
});

// AR Toggle
btnToggleAR.addEventListener('click', () => {
  const isActive = arOverlay.classList.contains('active');
  if (isActive) {
    arOverlay.classList.remove('active');
    btnToggleAR.classList.remove('active');
  } else {
    arOverlay.classList.add('active');
    btnToggleAR.classList.add('active');
  }
});

// Start app
window.addEventListener('load', () => {
  initCamera();
});
