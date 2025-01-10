// Set default languages
var srcLang = "eng"; // Default source language: English
var tgtLang = "eng"; // Default target language: English

// Variables for audio processing
let audioData; // Holds audio data for playback
let mediaRecorder; // MediaRecorder instance for recording
let chunks = []; // Array to store recorded audio chunks
let audioURL; // URL of the recorded audio
let myAudioData; // Processed audio data for translation
let mySampleRate = 16000; // Required sample rate for SeamlessM4T model
let stopButtonId; // ID of the button used to stop recording

// Initialize dropdowns and event listeners
document.addEventListener("DOMContentLoaded", function () {
    // Language options for the dropdown
    var langOptions = [
        { value: "eng", text: "English" },
        { value: "deu", text: "German" },
        { value: "pes", text: "Persian" },
        { value: "pol", text: "Polish" },
        { value: "spa", text: "Spanish" },
        { value: "ita", text: "Italian" }
    ];

    // Create and replace dropdowns for language selection
    var srcDropdown = createDropdown("srcLang", langOptions, srcDropdownSelected);
    var tgtDropdown = createDropdown("tgtLang", langOptions, tgtDropdownSelected);
    document.getElementById("srcLang").replaceWith(srcDropdown);
    document.getElementById("tgtLang").replaceWith(tgtDropdown);

    // Set up button event listeners
    document.getElementById("t2tButton").addEventListener("click", () => t2tTranslate());
    document.getElementById("t2sButton").addEventListener("click", () => t2sTranslate());
    document.getElementById("audioFileS2T").addEventListener("change", (event) => uploadAudioFile(event, "s2t"));
    document.getElementById("audioFileS2S").addEventListener("change", (event) => uploadAudioFile(event, "s2s"));
    document.getElementById("startRecording").addEventListener("click", startRecording);
    document.getElementById("stopS2T").addEventListener("click", () => stopRecording("stopS2T"));
    document.getElementById("stopS2S").addEventListener("click", () => stopRecording("stopS2S"));
});

// Create a dropdown element
function createDropdown(id, options, callback) {
    var select = document.createElement("select"); // Create a dropdown
    select.id = id;
    select.name = id;

    // Add options to the dropdown
    for (var i = 0; i < options.length; i++) {
        var option = document.createElement("option");
        option.value = options[i].value;
        option.text = options[i].text;
        select.appendChild(option);
    }

    // Attach callback for when the selection changes
    select.onchange = function () {
        callback(id);
    };

    return select;
}

// Callback for source language selection
function srcDropdownSelected(selectId) {
    var selectedValue = document.getElementById(selectId).value;
    srcLang = selectedValue; // Update source language
    console.log("You selected srcLang: ", srcLang);
}

// Callback for target language selection
function tgtDropdownSelected(selectId) {
    var selectedValue = document.getElementById(selectId).value;
    tgtLang = selectedValue; // Update target language
    console.log("You selected tgtLang: ", tgtLang);
}

// Function to handle Text-to-Text translation
function t2tTranslate() {
    const inputText = document.getElementById("inputText").value;
    fetch("http://localhost:10006/t2t", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText, srcLang, tgtLang }) // Send input text and language info
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById("result").innerText = data.processedText; // Display translation
        })
        .catch(error => console.error("Error:", error));
}

// Function to handle Text-to-Speech translation
function t2sTranslate() {
    const inputText = document.getElementById("inputText").value;
    fetch("http://localhost:10006/t2s", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText, srcLang, tgtLang }) // Send input text and language info
    })
        .then(response => response.json())
        .then(data => {
            if (data.audioData) {
                audioData = data.audioData;
                playAudio(data.audioData, data.sample_rate); // Play translated speech
            }
        })
        .catch(error => console.error("Error:", error));
}

// Function to handle file upload for translation
function uploadAudioFile(event, task) {
    const file = event.target.files[0]; // Get the uploaded file
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const arrayBuffer = e.target.result;
            const audioContext = new AudioContext();
            audioContext.decodeAudioData(arrayBuffer, function (buffer) {
                // Resample audio to required sample rate
                const sourceBuffer = buffer.getChannelData(0);
                const targetBuffer = new Float32Array(Math.round(sourceBuffer.length * mySampleRate / buffer.sampleRate));
                const ratio = sourceBuffer.length / targetBuffer.length;
                for (let i = 0; i < targetBuffer.length; i++) {
                    const sourceIndex = Math.round(i * ratio);
                    targetBuffer[i] = sourceBuffer[sourceIndex];
                }
                myAudioData = Array.from(targetBuffer); // Prepare audio data
                console.log("Audio file uploaded and processed for sending.");

                // Send for translation
                if (task === "s2t") {
                    send_s2tTranslate(myAudioData, mySampleRate);
                } else if (task === "s2s") {
                    send_s2sTranslate(myAudioData, mySampleRate);
                }
            });
        };
        reader.readAsArrayBuffer(file);
    }
}

// Function to start recording audio from the microphone
async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function (e) {
        chunks.push(e.data); // Store audio chunks
    };

    mediaRecorder.onstop = function () {
        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        chunks = [];
        const reader = new FileReader();
        reader.onload = function () {
            const arrayBuffer = reader.result;
            const audioContext = new AudioContext();
            audioContext.decodeAudioData(arrayBuffer, function (buffer) {
                // Resample audio to required sample rate
                const sourceBuffer = buffer.getChannelData(0);
                const targetBuffer = new Float32Array(Math.round(sourceBuffer.length * mySampleRate / buffer.sampleRate));
                const ratio = sourceBuffer.length / targetBuffer.length;
                for (let i = 0; i < targetBuffer.length; i++) {
                    const sourceIndex = Math.round(i * ratio);
                    targetBuffer[i] = sourceBuffer[sourceIndex];
                }
                myAudioData = Array.from(targetBuffer); // Prepare audio data
                console.log("Audio data prepared for sending.");

                // Send audio based on the stop button ID
                if (stopButtonId === "stopS2T") {
                    send_s2tTranslate(myAudioData, mySampleRate);
                } else if (stopButtonId === "stopS2S") {
                    send_s2sTranslate(myAudioData, mySampleRate);
                }
            });
        };
        reader.readAsArrayBuffer(blob);
    };

    mediaRecorder.start(); // Start recording
}

// Function to stop recording
function stopRecording(buttonId) {
    stopButtonId = buttonId;
    mediaRecorder.stop(); // Stop recording
}

// Function to send audio for Speech-to-Text translation
function send_s2tTranslate(audioData, sampleRate) {
    fetch("http://localhost:10006/s2t", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioSample: audioData, sampleRate, srcLang, tgtLang })
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById("result").innerText = data.processedText; // Display result
        })
        .catch(error => console.error("Error:", error));
}

// Function to send audio for Speech-to-Speech translation
function send_s2sTranslate(audioData, sampleRate) {
    fetch("http://localhost:10006/s2s", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioSample: audioData, sampleRate, srcLang, tgtLang })
    })
        .then(response => response.json())
        .then(data => {
            if (data.audioData) {
                playAudio(data.audioData, data.sample_rate); // Play translated speech
            }
        })
        .catch(error => console.error("Error:", error));
}

// Function to play audio data
function playAudio(audioData, sample_rate) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = audioContext.createBuffer(1, audioData.length, sample_rate);
    const audioBufferChannel = audioBuffer.getChannelData(0);

    // Populate audio buffer with data
    for (let i = 0; i < audioData.length; i++) {
        audioBufferChannel[i] = audioData[i];
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination); // Connect to audio output
    source.start(); // Play the audio
}
