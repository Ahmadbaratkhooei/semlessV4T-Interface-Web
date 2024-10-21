var srcLang = "eng";
var tgtLang = "eng";
let audioData;
let mediaRecorder;
let chunks = [];
let audioURL;
let myAudioData;
let mySampleRate = 16000;  // required by seamlessm4tv2 model
let stopButtonId;

// Create a dropdown list
function createDropdown(id, options, callback) {
    var select = document.createElement("select");
    select.id = id;
    select.name = id;
    for (var i = 0; i < options.length; i++) {
        var option = document.createElement("option");
        option.value = options[i].value;
        option.text = options[i].text;
        select.appendChild(option);
    }
    select.onchange = function() {
        callback(id);
    };
    return select;
}

function srcDropdownSelected(selectId) {
    var selectedValue = document.getElementById(selectId).value;
    srcLang = selectedValue;
    console.log('you selected srcLang: ', srcLang);
}

function tgtDropdownSelected(selectId) {
    var selectedValue = document.getElementById(selectId).value;
    tgtLang = selectedValue;
    console.log('you selected tgtLang: ', tgtLang);
}

function t2tTranslate(selectId) {
    const inputText = document.getElementById('inputText').value;
    fetch('http://localhost:10006/t2t', {  // updated URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputText, srcLang, tgtLang }),
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('result').innerText = data.processedText;
    })
    .catch(error => console.error('Error:', error));
}

function t2sTranslate(selectId) {
    const inputText = document.getElementById('inputText').value;
    fetch('http://localhost:10006/t2s', {  // updated URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputText, srcLang, tgtLang }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.audioData) {
            audioData = data.audioData;
            playAudio(data.audioData, data.sample_rate);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to upload audio file
function uploadAudioFile(event, task) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            const audioContext = new AudioContext();
            audioContext.decodeAudioData(arrayBuffer, function(buffer) {
                const sourceBuffer = buffer.getChannelData(0);
                const targetBuffer = new Float32Array(Math.round(sourceBuffer.length * mySampleRate / buffer.sampleRate));
                const ratio = sourceBuffer.length / targetBuffer.length;
                for (let i = 0; i < targetBuffer.length; i++) {
                    const sourceIndex = Math.round(i * ratio);
                    targetBuffer[i] = sourceBuffer[sourceIndex];
                }
                myAudioData = Array.from(targetBuffer);
                console.log("Audio file uploaded and processed for sending.");

                // Send the audio data for S2T or S2S processing
                if (task === 's2t') {
                    send_s2tTranslate(myAudioData, mySampleRate);
                } else if (task === 's2s') {
                    send_s2sTranslate(myAudioData, mySampleRate);
                }
            });
        };
        reader.readAsArrayBuffer(file);
    }
}

// Function to record audio from the microphone
async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function(e) {
        chunks.push(e.data);
    };

    mediaRecorder.onstop = function() {
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        chunks = [];
        const reader = new FileReader();
        reader.onload = function() {
            const arrayBuffer = reader.result;
            const audioContext = new AudioContext();
            audioContext.decodeAudioData(arrayBuffer, function(buffer) {
                const sourceBuffer = buffer.getChannelData(0);
                const targetBuffer = new Float32Array(Math.round(sourceBuffer.length * mySampleRate / buffer.sampleRate));
                const ratio = sourceBuffer.length / targetBuffer.length;
                for (let i = 0; i < targetBuffer.length; i++) {
                    const sourceIndex = Math.round(i * ratio);
                    targetBuffer[i] = sourceBuffer[sourceIndex];
                }
                myAudioData = Array.from(targetBuffer);
                console.log("Audio data prepared for sending.");

                // Send the audio data for S2T or S2S processing
                if (stopButtonId === 'stopS2T') {
                    send_s2tTranslate(myAudioData, mySampleRate);
                } else if (stopButtonId === 'stopS2S') {
                    send_s2sTranslate(myAudioData, mySampleRate);
                }
            });
        };
        reader.readAsArrayBuffer(blob);
    };

    mediaRecorder.start();
}

// Function to stop recording
function stopRecording(buttonId) {
    stopButtonId = buttonId;
    mediaRecorder.stop();
}

function send_s2tTranslate(audioData, sampleRate) {
    fetch('http://localhost:10006/s2t', {  // updated URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioSample: audioData, sampleRate, srcLang, tgtLang }),
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('result').innerText = data.processedText;
    })
    .catch(error => console.error('Error:', error));
}

function send_s2sTranslate(audioData, sampleRate) {
    fetch('http://localhost:10006/s2s', {  // updated URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioSample: audioData, sampleRate, srcLang, tgtLang }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.audioData) {
            playAudio(data.audioData, data.sample_rate);
        }
    })
    .catch(error => console.error('Error:', error));
}

function playAudio(audioData, sample_rate) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = audioContext.createBuffer(1, audioData.length, sample_rate);
    const audioBufferChannel = audioBuffer.getChannelData(0);
    for (let i = 0; i < audioData.length; i++) {
        audioBufferChannel[i] = audioData[i];
    }
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
}
