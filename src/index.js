const PEERS = new Map();
const VIEWS = new Map();

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

function createPeerConnection(id) {
    const peerConnection = new RTCPeerConnection({
        iceServers: [{
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun3.l.google.com:19302',
                'stun:stun4.l.google.com:19302',
            ]
        }]
    });
    peerConnection.onicecandidate = ({ candidate }) => signalingSend(JSON.stringify({ candidate }));
    peerConnection.onnegotiationneeded = async () => {
        try {
            await peerConnection.setLocalDescription(await peerConnection.createOffer());
            signalingSend(JSON.stringify({ description: peerConnection.localDescription }));
        } catch (err) {
            console.error(err);
        }
    };
    peerConnection.on

    const remoteView = document.createElement('video');
    remoteView.autoplay = true;
    remoteView.id = id;

    peerConnection.ontrack = (event) => {
        if (remoteView.srcObject) return;

        const stream = event.streams[0];
        remoteView.srcObject = stream;
    };

    document.body.appendChild(remoteView);

    VIEWS.set(id, remoteView);
    PEERS.set(id, peerConnection);
}

document.addEventListener('DOMContentLoaded', async () => {
    const stream = await getDefaultStream();

    const localView = document.getElementById('local-view');
    localView.srcObject = stream;
});
