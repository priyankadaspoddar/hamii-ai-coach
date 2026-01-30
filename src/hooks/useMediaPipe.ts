import { useRef, useCallback, useState, useEffect } from 'react';
import {
  FaceLandmarker,
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision';

export interface AnalysisMetrics {
  // Facial (FACS-inspired)
  smileScore: number;
  eyeContactScore: number;
  attentionScore: number;
  expressionConfidence: number;
  // Posture
  postureScore: number;
  headStability: number;
  shoulderAlignment: number;
  // Speech (simulated for now)
  pitchHz: number;
  speechPace: number;
  fillerCount: number;
  // NLP (simulated for now)
  contentRelevance: number;
  sentiment: number;
  clarity: number;
}

export interface LandmarkData {
  faceLandmarks: number[][];
  poseLandmarks: number[][];
}

export function useMediaPipe() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationRef = useRef<number>(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AnalysisMetrics>({
    smileScore: 0,
    eyeContactScore: 0,
    attentionScore: 0,
    expressionConfidence: 0,
    postureScore: 0,
    headStability: 0,
    shoulderAlignment: 0,
    pitchHz: 0,
    speechPace: 0,
    fillerCount: 0,
    contentRelevance: 0,
    sentiment: 0,
    clarity: 0,
  });
  const [landmarks, setLandmarks] = useState<LandmarkData>({
    faceLandmarks: [],
    poseLandmarks: [],
  });

  // Initialize MediaPipe
  const initializeMediaPipe = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // Initialize Face Landmarker
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });

      // Initialize Pose Landmarker
      poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize MediaPipe:', err);
      setError('Failed to load AI models. Please refresh and try again.');
      setIsLoading(false);
    }
  }, []);

  // Calculate FACS-inspired metrics from face blendshapes
  const calculateFacialMetrics = useCallback((blendshapes: any[]) => {
    if (!blendshapes || blendshapes.length === 0) return {};

    const shapes = blendshapes[0]?.categories || [];
    const getShape = (name: string) => 
      shapes.find((s: any) => s.categoryName === name)?.score || 0;

    // Smile detection (AU12 + AU6)
    const mouthSmileLeft = getShape('mouthSmileLeft');
    const mouthSmileRight = getShape('mouthSmileRight');
    const smileScore = (mouthSmileLeft + mouthSmileRight) / 2;

    // Eye contact approximation (inverse of eye look away)
    const eyeLookOutLeft = getShape('eyeLookOutLeft');
    const eyeLookOutRight = getShape('eyeLookOutRight');
    const eyeLookInLeft = getShape('eyeLookInLeft');
    const eyeLookInRight = getShape('eyeLookInRight');
    const eyeContactScore = 1 - Math.max(eyeLookOutLeft, eyeLookOutRight, eyeLookInLeft, eyeLookInRight);

    // Attention (eyes open)
    const eyeBlinkLeft = getShape('eyeBlinkLeft');
    const eyeBlinkRight = getShape('eyeBlinkRight');
    const attentionScore = 1 - ((eyeBlinkLeft + eyeBlinkRight) / 2);

    // Expression confidence (how defined the expressions are)
    const expressionConfidence = Math.min(1, shapes.reduce((acc: number, s: any) => acc + Math.abs(s.score - 0.5), 0) / shapes.length * 2);

    return { smileScore, eyeContactScore, attentionScore, expressionConfidence };
  }, []);

  // Calculate posture metrics from pose landmarks
  const calculatePostureMetrics = useCallback((poseLandmarks: any[]) => {
    if (!poseLandmarks || poseLandmarks.length === 0) return {};

    const landmarks = poseLandmarks[0];
    if (!landmarks || landmarks.length < 12) return {};

    // Shoulder alignment (difference in Y between left and right shoulder)
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    const shoulderAlignment = 1 - Math.min(shoulderDiff * 5, 1);

    // Head position stability (nose position relative to shoulders)
    const nose = landmarks[0];
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const headOffset = Math.abs(nose.x - shoulderMidX);
    const headStability = 1 - Math.min(headOffset * 3, 1);

    // Overall posture score
    const postureScore = (shoulderAlignment + headStability) / 2;

    return { postureScore, headStability, shoulderAlignment };
  }, []);

  // Start camera and detection loop
  const startAnalysis = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setIsRunning(true);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 640;
      canvas.height = 480;

      let lastTime = 0;
      const drawingUtils = new DrawingUtils(ctx);

      const detect = async () => {
        if (!videoRef.current || !isRunning) return;

        const now = performance.now();
        if (now - lastTime < 33) { // ~30fps cap
          animationRef.current = requestAnimationFrame(detect);
          return;
        }
        lastTime = now;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Detect faces
        if (faceLandmarkerRef.current && videoRef.current.readyState >= 2) {
          const faceResults = faceLandmarkerRef.current.detectForVideo(videoRef.current, now);
          
          if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
            // Draw face landmarks
            for (const landmarks of faceResults.faceLandmarks) {
              drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                { color: '#30D5C8', lineWidth: 0.5 }
              );
              drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
                { color: '#E0E0E0', lineWidth: 1 }
              );
              drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
                { color: '#30D5C8', lineWidth: 1 }
              );
              drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
                { color: '#30D5C8', lineWidth: 1 }
              );
              drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_LIPS,
                { color: '#E0E0E0', lineWidth: 1 }
              );
            }

            setLandmarks(prev => ({
              ...prev,
              faceLandmarks: faceResults.faceLandmarks.map(lm => 
                lm.map(p => [p.x, p.y, p.z])
              ).flat(),
            }));

            // Calculate facial metrics
            const facialMetrics = calculateFacialMetrics(faceResults.faceBlendshapes);
            setMetrics(prev => ({ ...prev, ...facialMetrics }));
          }
        }

        // Detect pose
        if (poseLandmarkerRef.current && videoRef.current.readyState >= 2) {
          const poseResults = poseLandmarkerRef.current.detectForVideo(videoRef.current, now);
          
          if (poseResults.landmarks && poseResults.landmarks.length > 0) {
            // Draw pose landmarks
            for (const landmarks of poseResults.landmarks) {
              drawingUtils.drawLandmarks(landmarks, {
                color: '#8B5CF6',
                radius: 3,
              });
              drawingUtils.drawConnectors(
                landmarks,
                PoseLandmarker.POSE_CONNECTIONS,
                { color: '#8B5CF6', lineWidth: 2 }
              );
            }

            setLandmarks(prev => ({
              ...prev,
              poseLandmarks: poseResults.landmarks.map(lm => 
                lm.map(p => [p.x, p.y, p.z])
              ).flat(),
            }));

            // Calculate posture metrics
            const postureMetrics = calculatePostureMetrics(poseResults.landmarks);
            setMetrics(prev => ({ ...prev, ...postureMetrics }));
          }
        }

        animationRef.current = requestAnimationFrame(detect);
      };

      detect();
    } catch (err) {
      console.error('Failed to start camera:', err);
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, [isRunning, calculateFacialMetrics, calculatePostureMetrics]);

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    setIsRunning(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeMediaPipe();
    
    return () => {
      stopAnalysis();
      faceLandmarkerRef.current?.close();
      poseLandmarkerRef.current?.close();
    };
  }, [initializeMediaPipe, stopAnalysis]);

  return {
    videoRef,
    canvasRef,
    isLoading,
    isRunning,
    error,
    metrics,
    landmarks,
    startAnalysis,
    stopAnalysis,
  };
}
