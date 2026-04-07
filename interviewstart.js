let qno = 0;
const username = localStorage.getItem("username");
let i = 0;
let domain = "";
let numberOfQuestions = 0;

let gazeInterval = null;
let gazeDataLog = [];
let offLaptopPercent = 0
let camera = null;
let postureLog = [];
let isPostureTracking = false;

let result = 1; // Default = pass
let badPostureStartTime = null;

async function start() {
    document.getElementById("startdiv").style.display = "none";
    if (i === 0) {
        document.getElementById("question").innerText = "Enter the number of questions you want me to give:";

    } else if (i === 1) {
        document.getElementById("question").innerText = "So, what domain are you looking for?";
        startEyeTracking();
        startPostureTracking();
    } else if (i === 2) {
        try {
            // startEyeTracking();
            // startPostureTracking();
            const response = await fetch("https://aiserver-phi.vercel.app/interview", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "username": username
                },
                body: JSON.stringify({
                    numberofquestion: numberOfQuestions,
                    domain: domain
                })
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            qno = data.qno;
            document.getElementById("question").innerText = `${data.question}`;
        } catch (error) {
            console.error("Fetch error:", error);
            alert("Failed to fetch question. Check console for details.");
        }
    }
    const utterance = new SpeechSynthesisUtterance(" " + document.getElementById("question").innerText);
    utterance.lang = 'en-US';
    const voices = speechSynthesis.getVoices();
    if (voices.length) {
        utterance.voice = voices.find(voice => voice.name === 'Google UK English Male') || voices[2];
    }
    speechSynthesis.speak(utterance);
}

async function submitAnswer() {
    old = "";
    const answer = document.getElementById("answer").value.trim();
    if (!answer) {
        alert("Please enter your answer.");
        return;
    }

    if (i === 0) {
        numberOfQuestions = parseInt(answer);
        if (isNaN(numberOfQuestions) || numberOfQuestions <= 0) {
            alert("Please enter a valid number of questions.");
            return;
        }
        i++;
        document.getElementById("answer").value = "";
        start();
    } else if (i === 1) {
        domain = answer;
        i++;
        document.getElementById("answer").value = "";
        start();
    } else {
        try {
            const response = await fetch("https://aiserver-phi.vercel.app/addanswer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "username": username
                },
                body: JSON.stringify({ answer })
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            alert("Answer submitted!");
            document.getElementById("answer").value = "";

            if (qno < numberOfQuestions) {
                start();
            } else {
                stopEyeTracking(); // 👈 Add this line
                stopPostureTracking();
                offLaptopPercent = calculateOffLaptopPercentage();
                // console.log("✅ Off-Laptop Time:", offLaptopPercent, "%");
                saveRecording();
                getScore();
            }
        } catch (error) {
            console.error("Error submitting answer:", error);
            alert("Failed to submit answer. Check console for details.");
        }
    }
}



function getScore() {
    window.location.href = "getscore.html";
}

async function home() {
    try {
        alert("This interview will not be saved");
        const response = await fetch("https://aiserver-phi.vercel.app/home", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "username": username
            }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        data.message ? (window.location.href = "aifrontend.html") : alert("Something went wrong");
    } catch (error) {
        console.error("Error in home function:", error);
        alert("Failed to navigate. Check console for details.");
    }
}

// Audio Recording
let mediaRecorderAudio;
let audioChunks = [];
let isAudioRecording = false;
const recordToggleBtn = document.getElementById('mic');
const transcriptInput = document.getElementById('answer');

recordToggleBtn.addEventListener('click', async (event) => {
    event.preventDefault();

    if (!isAudioRecording) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Your browser doesn't support audio recording.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderAudio = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorderAudio.ondataavailable = e => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorderAudio.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');

                const currentText = transcriptInput.value;
                transcriptInput.value = currentText + "\n⌛ Transcribing...";

                try {
                    const response = await fetch('https://aiserver-phi.vercel.app/transcribe', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();
                    if (data.text) {
                        transcriptInput.value = currentText + data.text;
                    } else {
                        transcriptInput.value = currentText + "\n❌ Failed to transcribe.";
                    }
                } catch (err) {
                    console.error(err);
                    transcriptInput.value = currentText + `\n❌ Error: ${err.message}`;
                }
            };

            mediaRecorderAudio.start();
            isAudioRecording = true;
            recordToggleBtn.classList.add('recording');
        } catch (err) {
            console.error("Microphone access error:", err);
            alert("Please allow microphone permissions.");
        }
    } else {
        if (mediaRecorderAudio && mediaRecorderAudio.state !== 'inactive') {
            mediaRecorderAudio.stop();
        }
        isAudioRecording = false;
        recordToggleBtn.classList.remove('recording');
    }
});

// Video Recording
let mediaRecorder;
let recordedChunks = [];
let stream = null;
let isCameraOn = false;
let isRecording = false;
const videoElement = document.getElementById('uservedio');
const cameraButton = document.getElementById('camera');

// IndexedDB for storing videos
const dbName = "VideoDB";
let db;
const request = indexedDB.open(dbName, 1);
request.onupgradeneeded = (event) => {
    db = event.target.result;
    db.createObjectStore("videos", { keyPath: "id" });
};
request.onsuccess = (event) => {
    db = event.target.result;
    clearSavedVideos();
};
request.onerror = (event) => {
    console.error("IndexedDB error:", event.target.errorCode);
};

function clearSavedVideos() {
    const tx = db.transaction("videos", "readwrite");
    const store = tx.objectStore("videos");
    store.clear();
}

cameraButton.addEventListener('click', async () => {
    if (!isCameraOn && !isRecording) {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            videoElement.srcObject = stream;

            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };

            mediaRecorder.onstop = saveRecording;

            mediaRecorder.start();
            isCameraOn = true;
            isRecording = true;
            cameraButton.textContent = 'Stop Camera';
        } catch (error) {
            console.error('Camera error:', error);
            alert('Failed to access camera. Please allow permission.');
        }
    } else if (isCameraOn && isRecording) {
        mediaRecorder.stop();
        isRecording = false;

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
        }
        isCameraOn = false;
        cameraButton.textContent = 'Start Camera';
    }
});

function saveRecording() {
    const recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
    const tx = db.transaction("videos", "readwrite");
    const store = tx.objectStore("videos");
    store.put({ id: "latest", blob: recordedBlob });
    recordedChunks = [];
    console.log("Video recording saved to IndexedDB.");
}

function startEyeTracking() {
    let latestGaze = null;

    webgazer.setGazeListener((data) => {
        if (data) {
            latestGaze = {
                x: parseFloat(data.x.toFixed(2)),
                y: parseFloat(data.y.toFixed(2)),
                time: new Date().toISOString()
            };

            // Move the red dot
            const dot = document.getElementById("eye-dot");
            if (dot && latestGaze) {
                dot.style.left = latestGaze.x + "px";
                dot.style.top = latestGaze.y + "px";
            }
        }
    });

    webgazer
        .showVideo(false)
        .showPredictionPoints(false)
        .showFaceOverlay(false)
        .begin();

    if (!gazeInterval) {
        gazeInterval = setInterval(() => {
            if (latestGaze) {
                gazeDataLog.push(latestGaze);
                console.log("Gaze Logged (1/sec):", latestGaze);
                latestGaze = null;
            }
        }, 1000);
    }
}

function isOffLaptop(gaze) {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // Consider "off-laptop" as being far outside the screen
    return gaze.x < -100 || gaze.y < -100 || gaze.x > screenW + 100 || gaze.y > screenH + 100;
}

function calculateOffLaptopPercentage() {
    const totalSamples = gazeDataLog.length;
    if (totalSamples === 0) return 0;

    const offLaptopSamples = gazeDataLog.filter(isOffLaptop).length;
    const percentage = (offLaptopSamples / totalSamples) * 100;

    console.log(`📊 Percentage time off-laptop: ${percentage.toFixed(2)}%`);
    return percentage.toFixed(2);
}

function stopEyeTracking() {
    clearInterval(gazeInterval);
    gazeInterval = null;
    webgazer.end();
    console.log("Eye Tracking Stopped. Final Gaze Log:", gazeDataLog);

    // Optionally: Save the gazeDataLog to server or localStorage
    // localStorage.setItem("gazeLog", JSON.stringify(gazeDataLog));
}

// function startPostureTracking() {
//     isPostureTracking = true;

//     const pose = new Pose.Pose({
//         locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
//     });

//     pose.setOptions({
//         modelComplexity: 0,
//         smoothLandmarks: true,
//         enableSegmentation: false,
//         minDetectionConfidence: 0.5,
//         minTrackingConfidence: 0.5
//     });

//     pose.onResults((results) => {
//         if (!results.poseLandmarks || !isPostureTracking) return;

//         const leftShoulder = results.poseLandmarks[11];
//         const rightShoulder = results.poseLandmarks[12];
//         const leftHip = results.poseLandmarks[23];
//         const rightHip = results.poseLandmarks[24];

//         // Rough posture check: vertical alignment of shoulders vs hips
//         const shoulderAvgY = (leftShoulder.y + rightShoulder.y) / 2;
//         const hipAvgY = (leftHip.y + rightHip.y) / 2;

//         const postureStatus = (hipAvgY - shoulderAvgY) > 0.2 ? "Bad Posture" : "Good Posture";
//         console.log("📏 Posture:", postureStatus);

//         // Save log
//         postureLog.push({
//             status: postureStatus,
//             timestamp: new Date().toISOString()
//         });
//     });

//     camera = new Camera(videoElement, {
//         onFrame: async () => {
//             await pose.send({ image: videoElement });
//         },
//         width: 640,
//         height: 480
//     });

//     camera.start();
// }
function startPostureTracking() {
    isPostureTracking = true;

    const postureStatusEl = document.getElementById("posture-status");

    const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    pose.onResults((results) => {
        if (!results.poseLandmarks || !isPostureTracking) return;

        const leftShoulder = results.poseLandmarks[11];
        const rightShoulder = results.poseLandmarks[12];
        const leftHip = results.poseLandmarks[23];
        const rightHip = results.poseLandmarks[24];

        const shoulderAvgY = (leftShoulder.y + rightShoulder.y) / 2;
        const hipAvgY = (leftHip.y + rightHip.y) / 2;

        const delta = hipAvgY - shoulderAvgY;
        const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
        
        let postureStatus = "Good Posture";
        // Loosened: 0.3 vertical slack, 0.1 tilt slack
        if (delta < 0.5 && shoulderTilt < 0.4) {
            postureStatus = " Bad Posture";
        }
        if (postureStatus === "Bad Posture") {
            if (!badPostureStartTime) {
                badPostureStartTime = Date.now();
            } else {
                const elapsed = (Date.now() - badPostureStartTime) / 1000;
                if (elapsed >= 10) {
                    result = 0; // Fail condition: bad posture for 10s+
                }
            }
        } else {
            badPostureStartTime = null; // reset if posture becomes good again
        }
        
        // Update display
        postureStatusEl.textContent = `Posture: ${postureStatus}`;
        postureStatusEl.style.backgroundColor = postureStatus === "Good Posture" ? "green" : "red";

        // Save log
        postureLog.push({
            status: postureStatus,
            timestamp: new Date().toISOString()
        });
    });

    camera = new Camera(videoElement, {
        onFrame: async () => {
            await pose.send({ image: videoElement });
        },
        width: 640,
        height: 480
    });

    camera.start();
}


// function stopPostureTracking() {
//     isPostureTracking = false;
//     if (camera) {
//         camera.stop();
//         console.log("Posture tracking stopped.");
//     }
//     console.log("📄 Posture Log:", postureLog);
// }
function stopPostureTracking() {
    isPostureTracking = false;
    if (camera) {
        camera.stop();
        console.log("🛑 Posture tracking stopped.");
    }
    console.log("📄 Posture Log:", postureLog);
}

// export {result, offLaptopPercent}
window.result = result;
window.offLaptopPercent = offLaptopPercent;
