let audioContext;
let mediaRecorder;
let audioChunks = [];
let audioBuffer;
let effectType = 'demon';

document.getElementById('recordButton').addEventListener('click', async () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        document.getElementById('playButton').disabled = false;
    };

    mediaRecorder.start();
    document.getElementById('stopButton').disabled = false;
    document.getElementById('recordButton').disabled = true;
});

document.getElementById('stopButton').addEventListener('click', () => {
    mediaRecorder.stop();
    document.getElementById('stopButton').disabled = true;
});

document.getElementById('playButton').addEventListener('click', async () => {
    const modifiedBuffer = await modifyVoice(audioBuffer);
    playAudio(modifiedBuffer);
});

document.getElementById('demon').addEventListener('click', () => {
    effectType = 'demon';
});

document.getElementById('low').addEventListener('click', () => {
    effectType = 'high';
});

async function modifyVoice(buffer) {
    const offlineContext = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = offlineContext.createGain();
    gainNode.gain.value = 2;

    const biquadFilter = offlineContext.createBiquadFilter();
    if (effectType === 'demon') {
        biquadFilter.type = 'lowshelf';
        biquadFilter.frequency.setValueAtTime(1000, offlineContext.currentTime);
        biquadFilter.gain.setValueAtTime(30, offlineContext.currentTime);
    } else if (effectType === 'high') {
        biquadFilter.type = 'highshelf';
        biquadFilter.frequency.setValueAtTime(3000, offlineContext.currentTime);
        biquadFilter.gain.setValueAtTime(30, offlineContext.currentTime);
    }

    source.connect(gainNode);
    gainNode.connect(biquadFilter);
    biquadFilter.connect(offlineContext.destination);

    source.start(0);
    return offlineContext.startRendering();
}

function playAudio(buffer) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    source.connect(audioContext.destination);
    source.start(0);
}
