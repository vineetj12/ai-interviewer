let qno = 0;
const username = localStorage.getItem("username");
let i = 0;
let domain = "";
let numberOfQuestions = 0;

async function start() {
    document.getElementById("startdiv").style.display = "none";
    if (i === 0) {
        document.getElementById("question").innerText = "Enter the number of questions you want me to give:";
        
    } else if (i === 1) {
        document.getElementById("question").innerText = "So, what domain are you looking for?";
    } else if (i === 2) {
        try {
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
    const utterance = new SpeechSynthesisUtterance(" "+document.getElementById("question").innerText);
    utterance.lang = 'en-US'; 
    const voices = speechSynthesis.getVoices();
    if (voices.length) {
      utterance.voice = voices.find(voice => voice.name === 'Google UK English Male') || voices[2]; 
    }
    speechSynthesis.speak(utterance);
}

async function submitAnswer() {
    old="";
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

            if (qno < numberOfQuestions ) {
                start();
            } else {
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
                        transcriptInput.value = currentText  + data.text;
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
