const peerList = new Map();
let signaling = null;

async function getDefaultStream() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        const constrains = { video: false, audio: false };
        constrains.video = devices.some(device => device.kind === 'videoinput');
        constrains.audio = devices.some(device => device.kind === 'audioinput');

        const stream = await navigator.mediaDevices.getUserMedia(constrains);
        return stream;
    } catch (error) {
        console.error(error);
        return null;
    }
}

function signalingSend(object) {
    const data = JSON.stringify(object);
    console.log('[SEND] ', data);
    signaling.send(data);
}

async function signalingStart(stream) {
    signaling = new WebSocket('wss://' + location.host + '/signaling');
    signaling.onopen = () => {
        signalingSend({ type: 'join' });
    }
    signaling.onmessage = async (message) => {
        console.log('[RECEIVE] ', message.data);
        const { type, source, peerList, description, candidate } = JSON.parse(message.data);

        try {
            if (type === "list") {
                peerList.forEach(async (peerId) => {
                    const peerConnection = createPeerConnection(peerId);
                    
                    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

                    const localDescription = await peerConnection.createOffer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true
                    });
                    await peerConnection.setLocalDescription(localDescription);
                    signalingSend({ target: peerId, description: peerConnection.localDescription });
                });
            } else if (description) {
                const peerConnection = createPeerConnection(source);

                if (description.type === 'offer') {
                    await peerConnection.setRemoteDescription(description);

                    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

                    const localDescription = await peerConnection.createAnswer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true
                    });
                    await peerConnection.setLocalDescription(localDescription);
                    signalingSend({ target: source, description: peerConnection.localDescription });
                } else if (description.type === 'answer') {
                    await peerConnection.setRemoteDescription(description);
                } else {
                    console.error('Unsuported SDP type: ', description);
                }
            } else if (candidate) {
                const peerConnection = createPeerConnection(source);

                await peerConnection.addIceCandidate(candidate);
            }
        } catch (error) {
            console.error(error);
        }
    }
}

function createPeerConnection(id) {
    if (peerList.has(id)) {
        return peerList.get(id);
    }

    const peerConnection = new RTCPeerConnection({
        iceServers: [{
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun3.l.google.com:19302',
                'stun:stun4.l.google.com:19302',
                'stun:stun01.sipphone.com',
                'stun:stun.ekiga.net',
                'stun:stun.fwdnet.net',
                'stun:stun.ideasip.com',
                'stun:stun.iptel.org',
                'stun:stun.rixtelecom.se',
                'stun:stun.schlund.de',
                'stun:stunserver.org',
                'stun:stun.softjoys.com',
                'stun:stun.voiparound.com',
                'stun:stun.voipbuster.com',
                'stun:stun.voipstunt.com',
                'stun:stun.voxgratia.org',
                'stun:stun.xten.com',
            ]
        }]
    });
    peerConnection.onicecandidate = ({ candidate }) => signalingSend({ target: id, candidate });
    peerConnection.onnegotiationneeded = async () => {
        try {
            await peerConnection.setLocalDescription(await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            }));
            signalingSend({ target: id, description: peerConnection.localDescription });
        } catch (error) {
            console.error(error);
        }
    };

    const remoteView = document.createElement('video');
    remoteView.width = 240;
    remoteView.height = 320;
    remoteView.autoplay = true;
    remoteView.id = id;

    peerConnection.oniceconnectionstatechange = (event) => {
        switch (peerConnection.iceConnectionState) {
            case "disconnected":
            case "failed":
                console.log("One or more transports has terminated unexpectedly");
            case "closed":
                peerConnection.close();
                console.log("Connection has been closed");
                let view = document.getElementById(id);
                console.log(view);
                if (view) {
                    view.remove();
                }
                peerList.delete(id);
                break;
        }
    };
    peerConnection.ontrack = (event) => {
        const stream = event.streams[0];

        remoteView.srcObject = null;
        remoteView.srcObject = stream;
    };

    document.body.appendChild(remoteView);

    peerList.set(id, peerConnection);

    return peerConnection;
}

document.addEventListener('DOMContentLoaded', async () => {
    const stream = await getDefaultStream();

    const localView = document.getElementById('local-view');
    localView.srcObject = stream;

    signalingStart(stream);
});
