async function getDefaultStream() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
    
        const constrains = { video: false, audio: false };
        constrains.video = devices.some(device => device.kind === 'videoinput');
        constrains.audio = devices.some(device => device.kind === 'audioinput');
    
        const stream = await navigator.mediaDevices.getUserMedia(constrains);
        return stream;
    } catch {
        console.error(error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const stream = await getDefaultStream();

    const localView = document.getElementById('local-view');
    localView.srcObject = stream;
});
