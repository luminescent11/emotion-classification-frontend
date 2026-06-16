const emotions = {
    "Angry": 0,
    "Disgusted": 0,
    "Fearful": 0,
    "Happy": 0,
    "Neutral": 0,
    "Sad": 0,
    "Surprised": 0
}

const chart = new Chart(document.getElementById('radar-chart'), {
    type: 'radar',
    data: {
        labels: Object.keys(emotions),
        datasets: [{
        data: Object.values(emotions),
        borderColor: '#1D9E75',
        backgroundColor: 'rgba(29, 158, 117, 0.15)',
        pointBackgroundColor: '#1D9E75',
        }]
    },
    options: {
        scales: {
        r: {
            min: 0,
            max: 1,
            ticks: { display: false },
        }
        },
        plugins: { legend: { display: false } }
    }
})

function classNameFor(label) {
    return 'emotion-' + label.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

function updateResults(emotionsObj) {
    const labels = Object.keys(emotionsObj);
    const values = Object.values(emotionsObj);

    const biggestValue = Math.max(...values);
    const biggestIndex = values.indexOf(biggestValue);
    const biggestLabel = labels[biggestIndex];

    const biggestPct = Math.round(biggestValue * 100);

    const biggestEl = document.getElementById('biggest-percentage');
    const mainLabelEl = document.getElementById('main-emotion');

    // Clear previous emotion classes
    biggestEl.className = 'emotion-main';
    mainLabelEl.className = 'emotion-label';

    // Apply color class for main emotion
    const mainClass = classNameFor(biggestLabel);
    biggestEl.classList.add(mainClass);
    mainLabelEl.classList.add(mainClass);

    biggestEl.textContent = `${biggestPct}%`;
    mainLabelEl.textContent = biggestLabel;

    // Populate minor emotions
    const minorList = document.getElementById('minor-emotions');
    if (minorList) {
        minorList.innerHTML = '<h3>Other emotions</h3>';
        labels.forEach(label => {
            if (label === biggestLabel) return;
            const li = document.createElement('li');
            const pct = Math.round(emotionsObj[label] * 100);
            li.className = `emotion-item ${classNameFor(label)}`;
            li.innerHTML = `<span class="label-text">${label}</span><span class="percent">${pct}%</span>`;
            minorList.appendChild(li);
        });
    }
}

/* MEDIARECORDER LOGIC */

let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let timerInterval;
let recordingStartTime;

async function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await sendAudio(audioBlob);
    };

    mediaRecorder.start();
    isRecording = true;
    recordingStartTime = Date.now();
    
    const recordingButton = document.getElementById('recording-button');
    recordingButton.textContent = 'Stop Recording';
    recordingButton.classList.add('recording');
    
    // Start timer
    timerInterval = setInterval(updateTimer, 100);
}

function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    isRecording = false;
    
    clearInterval(timerInterval);
    
    const recordingButton = document.getElementById('recording-button');
    recordingButton.textContent = 'Start Recording';
    recordingButton.classList.remove('recording');
    
    // Reset timer
    document.getElementById('timer').textContent = '00:00';
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('timer').textContent = timeString;
}

function showLoading() {
    document.getElementById('results-box').classList.add('is-loading');
}

function hideLoading() {
    document.getElementById('results-box').classList.remove('is-loading');
}

/* This is the API/server interaction logic */

let API_URL = "https://emotions-api-1043697508655.us-central1.run.app"
let API_URL_LOCAL = "http://localhost:8000"

let localTesting = false
if (localTesting) {
    API_URL = API_URL_LOCAL
}




async function sendAudio(audioBlob) {
    showLoading();
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    hideLoading();
    updateResults(result.emotions);
    chart.data.datasets[0].data = Object.values(result.emotions);
    chart.update();
}

let submitAudioButton = document.getElementById("submit-audio-button")

let fileInput = document.getElementById("file-input")

async function uploadFile() {
    const file = fileInput.files[0]
    // check the file is valid
    if (!file) {
        alert("Please select a file to upload.")
        return
    }
    if (!file.type.startsWith("audio/")) {
        alert("Please select a valid audio file.")
        return
    }
    if (file.size > 10 * 1024 * 1024) { // 10 MB limit
        alert("File size exceeds the 10 MB limit.")
        return
    }
    if (fileInput.files.length > 1) {
        alert("Please select only one file.")
        return
    }

    // Create FormData object containing audio file
    showLoading();
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData
    })

    console.log("Predict endpoint URL: ", `${API_URL}/predict`)
    console.log(response)

    const result = await response.json();
    hideLoading();
    updateResults(result.emotions);
    chart.data.datasets[0].data = Object.values(result.emotions);
    chart.update();
}


function getLabels() {
    fetch(`${API_URL}/labels`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // Update the UI with the retrieved labels
        })
        .catch(error => {
            console.error("Error fetching labels:", error);
        });
}