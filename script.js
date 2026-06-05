const emotions = {
    "Angry": 0,
    "Disgusted": 0,
    "Fearful": 0,
    "Happy": 0,
    "Neutral": 0,
    "Sad": 0,
    "Surprised": 0
}

const chart = new Chart(document.getElementById('radarChart'), {
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

/* This is the API/server interaction logic */

let API_URL = "https://emotions-api-1043697508655.us-central1.run.app"
let API_URL_LOCAL = "http://localhost:8000"

let localTesting = true
if (localTesting) {
    API_URL = API_URL_LOCAL
}


let labelsButton = document.getElementById("retrieve-labels-button")
let submitAudioButton = document.getElementById("submit-audio-button")

let fileInput = document.getElementById("fileInput")

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
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData
    })

    console.log("Predict endpoint URL: ", `${API_URL}/predict`)
    console.log(response)

    const result = await response.json()
    document.getElementById("output").textContent = JSON.stringify(result.emotions)
    chart.data.datasets[0].data = Object.values(result.emotions)
    chart.update()

    // Debugging logs
    console.log("Raw audio shape:", result["raw audio shape"])
    console.log("Mel spectrogram shape:", result["mel spectrogram shape"])
    console.log("Mel spectrogram tensor:", result["mel spectrogram tensor"])
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