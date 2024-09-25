const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const toggleCameraButton = document.getElementById('toggleCameraButton');
const toggleMicButton = document.getElementById('toggleMicButton');
const socket = new WebSocket('http://localhost:8000/ws');

let peerConnection;
let localMediaStream;
let remoteId;
const remoteMediaStream = new MediaStream();

socket.onopen = () => {
  console.log('socket::open');
};

socket.onmessage = async ({ data }) => {
  try {
    const jsonMessage = JSON.parse(data);

    console.log('action', jsonMessage.action);
    switch (jsonMessage.action) {
      case 'start':
        console.log('start', jsonMessage.id);
        callButton.disabled = false;

        document.getElementById('localId').innerHTML = jsonMessage.id;
        break;
      case 'offer':
        remoteId = jsonMessage.data.remoteId;
        delete jsonMessage.data.remoteId;

        await initializePeerConnection(localMediaStream.getTracks());
        await peerConnection.setRemoteDescription(new RTCSessionDescription(jsonMessage.data.offer));

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        sendSocketMessage('answer', { remoteId, answer }); 
        break;
      case 'answer':
        await peerConnection.setRemoteDescription(new RTCSessionDescription(jsonMessage.data.answer));
        break;
      case 'iceCandidate':
        await peerConnection.addIceCandidate(jsonMessage.data.candidate);
        break;
      case 'remoteMicStatus':
        updateRemoteMicUI(jsonMessage.data.enabled);
        break;

      case 'remoteCameraStatus':
        updateRemoteCameraUI(jsonMessage.data.enabled);
        break;
      default: console.warn('unknown action', jsonMessage.action);
    }
  } catch (error) {
    console.error('failed to handle socket message', error);
  }
};

socket.onerror = (error) => {
  console.error('socket::error', error);
};

socket.onclose = () => {
  console.log('socket::close');
  stop();
};

const sendSocketMessage = (action, data) => {
  const message = { action, data };
  socket.send(JSON.stringify(message));
};

const start = async () => {
  try {
    localMediaStream = await getLocalMediaStream(); 

    sendSocketMessage('start');
  } catch (error) {
    console.error('failed to start stream', error);
  }
};


const call = async () => {
  try {
    remoteId = document.getElementById('callId').value;

    if (!remoteId) {
      alert('Please enter a remote id');

      return;
    }

    console.log('call: ', remoteId);
    localMediaStream = await getLocalMediaStream();
    await initializePeerConnection(localMediaStream.getTracks());
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    sendSocketMessage('offer', { offer, remoteId });
  } catch (error) {
    console.error('failed to initialize call', error);
  }
};

const hangup = () => socket.close();

const stop = () => {
  if (!localVideo.srcObject) return;

  for (const track of localVideo.srcObject.getTracks()) {
    track.stop();
  }

  peerConnection.close();
  callButton.disabled = true;
  hangupButton.disabled = true;
  localVideo.srcObject = undefined;
  remoteVideo.srcObject = undefined;
};

const getLocalMediaStream = async () => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    console.log('got local media stream');

    localVideo.srcObject = mediaStream;

    return mediaStream;
  } catch (error) {
    console.error('failed to get local media stream', error);
  }
};

const initializePeerConnection = async (mediaTracks) => {
  const config = { iceServers: [{ urls: [ 'stun:stun1.l.google.com:19302' ] } ] };
  peerConnection = new RTCPeerConnection(config);

  peerConnection.onicecandidate = ({ candidate }) => {
    if (!candidate) return;

    console.log('peerConnection::icecandidate', candidate);
    console.log('remote', remoteId);
    sendSocketMessage('iceCandidate', { remoteId, candidate });
  };

  peerConnection.oniceconnectionstatechange = () => {
  console.log('peerConnection::iceconnectionstatechange newState=', peerConnection.iceConnectionState);
    if (peerConnection.iceConnectionState === 'disconnected') {
      alert('Connection has been closed stopping...');
      socket.close();
    }
  };

  peerConnection.ontrack = ({ track }) => {
    console.log('peerConnection::track', track);
    remoteMediaStream.addTrack(track);
    remoteVideo.srcObject = remoteMediaStream;
  };

  for (const track of mediaTracks) {
    peerConnection.addTrack(track);
  }
};

const toggleLocalMic = () => {
  const audioTrack = localMediaStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    console.log('Local Mic ' + (audioTrack.enabled ? 'unmuted' : 'muted'));

    // Notify the remote peer about the mic toggle for UI update
    sendSocketMessage('remoteMicStatus', { enabled: audioTrack.enabled });
  }
};

const toggleLocalCamera = () => {
  const videoTrack = localMediaStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    console.log('Local Camera ' + (videoTrack.enabled ? 'started' : 'stopped'));

    // Notify the remote peer about the camera toggle for UI update
    sendSocketMessage('remoteCameraStatus', { enabled: videoTrack.enabled });
  }
};

const toggleRemoteMic = (enabled) => {
  const audioTrack = remoteMediaStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = enabled;
    console.log('Remote Mic ' + (audioTrack.enabled ? 'unmuted' : 'muted'));
  }
};

const toggleRemoteCamera = (enabled) => {
  const videoTrack = remoteMediaStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = enabled;
    console.log('Remote Camera ' + (videoTrack.enabled ? 'started' : 'stopped'));
  }
};

const updateRemoteMicUI = (enabled) => {
  const micStatusElement = document.getElementById('remoteMicStatus');
  if (micStatusElement) {
    micStatusElement.textContent = enabled ? 'Remote Mic: Unmuted' : 'Remote Mic: Muted';
  }
};

const updateRemoteCameraUI = (enabled) => {
  const cameraStatusElement = document.getElementById('remoteCameraStatus');
  if (cameraStatusElement) {
    cameraStatusElement.textContent = enabled ? 'Remote Camera: On' : 'Remote Camera: Off';
  }
};



hangupButton.disabled = false;

