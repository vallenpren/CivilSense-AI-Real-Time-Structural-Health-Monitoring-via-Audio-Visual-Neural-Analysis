import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

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

let currentLang = 'en';

const translations = {
  en: {
    status: "INITIALIZING...",
    acousticTitle: "Acoustic Emission Analysis",
    acousticSub: "Microscopic Void Detection via Sound Resonance",
    freq: "Freq:",
    amp: "Amp:",
    btnAudioStart: "START AUDIO SCAN",
    btnAudioStop: "STOP SCANNING",
    visionTitle: "Vision Crack Estimator",
    visionSub: "3D Texture Depth Mapping",
    depth: "Crack Depth:",
    width: "Width:",
    btnScan: "ANALYZE CURRENT FRAME",
    btnScanActive: "ANALYZING 3D MESH...",
    targetStatus: "Target Surface Condition",
    overallProcessing: "PROCESSING",
    overallCritical: "CRITICAL",
    btnExport: "Export Doc Report",
    btnAR: "Toggle AR Heatmap",
    reportTitle: "Structural Health Monitoring Report",
    reportDesc: "This document contains automated analysis from CivilSense AI.",
    valDepthAnalyzing: "Analyzing...",
    valWidthAnalyzing: "Analyzing..."
  },
  id: {
    status: "MEMULAI...",
    acousticTitle: "Analisis Emisi Akustik",
    acousticSub: "Deteksi Rongga Mikroskopis via Resonansi Suara",
    freq: "Frek:",
    amp: "Amp:",
    btnAudioStart: "MULAI PINDAIAN",
    btnAudioStop: "HENTIKAN PINDAIAN",
    visionTitle: "Estimatior Retakan Visual",
    visionSub: "Pemetaan Kedalaman Tekstur 3D",
    depth: "Kedalaman Retak:",
    width: "Lebar:",
    btnScan: "ANALISIS BINGKAI INI",
    btnScanActive: "MENGANALISIS MESH 3D...",
    targetStatus: "Kondisi Permukaan Target",
    overallProcessing: "MEMPROSES",
    overallCritical: "KRITIS",
    btnExport: "Ekspor Laporan Doc",
    btnAR: "Peralihan Heatmap AR",
    reportTitle: "Laporan Pemantauan Kesehatan Struktur",
    reportDesc: "Dokumen ini berisi analisis otomatis dari CivilSense AI.",
    valDepthAnalyzing: "Analisis...",
    valWidthAnalyzing: "Analisis..."
  }
};

function applyLanguage() {
  const t = translations[currentLang];
  document.getElementById('txtStatus').textContent = t.status;
  document.getElementById('txtAcousticTitle').textContent = t.acousticTitle;
  document.getElementById('txtAcousticSub').textContent = t.acousticSub;
  document.getElementById('txtFreq').textContent = t.freq;
  document.getElementById('txtAmp').textContent = t.amp;
  document.getElementById('txtBtnAudio').textContent = isAudioScanning ? t.btnAudioStop : t.btnAudioStart;
  document.getElementById('txtVisionTitle').textContent = t.visionTitle;
  document.getElementById('txtVisionSub').textContent = t.visionSub;
  document.getElementById('txtDepth').textContent = t.depth;
  document.getElementById('txtWidth').textContent = t.width;
  document.getElementById('txtBtnScan').textContent = scanFrame.classList.contains('scanning') ? t.btnScanActive : t.btnScan;
  document.getElementById('txtTargetStatus').textContent = t.targetStatus;
  document.getElementById('txtBtnExport').textContent = t.btnExport;
  document.getElementById('txtBtnAR').textContent = t.btnAR;
  
  if (overallStatus.textContent === translations[currentLang === 'en' ? 'id' : 'en'].overallProcessing) overallStatus.textContent = t.overallProcessing;
  if (overallStatus.textContent === translations[currentLang === 'en' ? 'id' : 'en'].overallCritical) overallStatus.textContent = t.overallCritical;
}

document.getElementById('btnLangToggle').addEventListener('click', () => {
  currentLang = currentLang === 'en' ? 'id' : 'en';
  applyLanguage();
});

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
  document.getElementById('txtBtnAudio').textContent = isAudioScanning ? translations[currentLang].btnAudioStop : translations[currentLang].btnAudioStart;
  
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
  valDepth.textContent = translations[currentLang].valDepthAnalyzing;
  valDepth.className = "value warning";
  valWidth.textContent = translations[currentLang].valWidthAnalyzing;
  valWidth.className = "value warning";
  overallStatus.textContent = translations[currentLang].overallProcessing;
  overallStatus.className = "status-badge warning";
  
  document.getElementById('txtBtnScan').textContent = translations[currentLang].btnScanActive;
  
  // Simulate AI processing time
  setTimeout(() => {
    scanFrame.classList.remove('scanning');
    document.getElementById('txtBtnScan').textContent = translations[currentLang].btnScan;
    
    // Simulate finding a crack
    valDepth.textContent = "12.4 mm";
    valDepth.className = "value critical";
    
    valWidth.textContent = "4.2 mm";
    valWidth.className = "value warning";
    
    overallStatus.textContent = translations[currentLang].overallCritical;
    overallStatus.className = "status-badge critical";
  }, 3000);
});

// Export Doc Handler
document.getElementById('btnExport').addEventListener('click', async () => {
  const t = translations[currentLang];
  const depthVal = document.getElementById('valDepth').textContent;
  const widthVal = document.getElementById('valWidth').textContent;
  const freqVal = document.getElementById('valFreq').textContent;
  const statusStr = overallStatus.textContent;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "CivilSense AI",
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            text: t.reportTitle,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: t.reportDesc }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: t.acousticTitle, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `${t.freq} ${freqVal}`, bullet: { level: 0 } }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: t.visionTitle, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `${t.depth} ${depthVal}`, bullet: { level: 0 } }),
          new Paragraph({ text: `${t.width} ${widthVal}`, bullet: { level: 0 } }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: `${t.targetStatus}: ${statusStr}`, heading: HeadingLevel.HEADING_3 })
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `CivilSense_Report_${new Date().getTime()}.docx`);
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
