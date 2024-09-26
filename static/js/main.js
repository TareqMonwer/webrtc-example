const initialView = document.getElementById('initial-view');
const startCallButton = document.getElementById('start-call-btn');
const joinCallButton = document.getElementById('join-call-btn');
const inviteCode = document.getElementById('invite-code').value;
const hostMicControlBtn = document.getElementById('host-mic-control-btn');
const hostCamControlBtn = document.getElementById('host-cam-control-btn');
const hostEndCallButton = document.getElementById('host-end-call-btn');

const callLobbyEl = document.getElementById("call-lobby");
const hostVideoFrameEl = document.getElementById("host-video-frame");

let sessionStarted = false;
let micFillIconClasses = "bi bi-mic-fill";
let micFillMuteIconClasses = "bi bi-mic-mute-fill";
let videoFillIconClasses = "bi bi-camera-video-fill";
let videoFillOffIconClasses = "bi bi-camera-video-off-fill";

let hostMediaStream;


/***** EVENT METHODS *****/
const startEventHandler = async(event) => {
  sessionStarted = true;

  try {
    hostMediaStream = await getHostMediaStream(); 
  } catch (error) {
    console.error('failed to start stream', error);
  }

  updateUiBySessionStart();
}

const hostMicControlClickHandler = (event) => {
  if (sessionStarted && hostMediaStream) {
    const hostAudioTrack = hostMediaStream.getAudioTracks()[0];

    if (hostAudioTrack) {
      hostAudioTrack.enabled = !hostAudioTrack.enabled;

      if (hostAudioTrack.enabled) {
        hostMicControlBtn.getElementsByTagName("i")[0].className = micFillIconClasses;
        hostMicControlBtn.classList.remove("opacity-50");
      } else {
        hostMicControlBtn.getElementsByTagName("i")[0].className = micFillMuteIconClasses;
        hostMicControlBtn.classList.add("opacity-50");
      }
    }
  }
}

const hostCamControlClickHandler = async (event) => {
  if (sessionStarted && hostMediaStream) {
    const hostVideoTrack = hostMediaStream.getVideoTracks()[0];

    if (hostVideoTrack) {
      hostVideoTrack.enabled = !hostVideoTrack.enabled;

      if (hostVideoTrack.enabled) {
        // start camera again
        await getHostVideoStream();

        hostCamControlBtn.getElementsByTagName("i")[0].className = videoFillIconClasses;
        hostCamControlBtn.classList.remove("opacity-50");
      } else {
        // stop camera
        hostVideoTrack.stop();

        hostCamControlBtn.getElementsByTagName("i")[0].className = videoFillOffIconClasses;
        hostCamControlBtn.classList.add("opacity-50");
      }
    }
  }
}

const hostEndCallClickHandler = event => {
  if (sessionStarted && hostMediaStream) {
    hostMediaStream.getTracks().forEach((track) => {
        track.stop();
    });

    // reset host video frame states
    hostCamControlBtn.getElementsByTagName("i")[0].className = videoFillIconClasses;
    hostCamControlBtn.classList.remove("opacity-50");

    callLobbyEl.classList.add("d-none");
    initialView.classList.remove("d-none");
  }
}



/**** UTILITY METHODS ****/
const updateUiBySessionStart = () => {
  initialView.classList.add("d-none");
  callLobbyEl.classList.remove("d-none");
}

const getHostMediaStream = async () => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

    hostVideoFrameEl.srcObject = mediaStream;

    return mediaStream;
  } catch (error) {
    console.error('failed to get local media stream', error);
  }
};

const getHostVideoStream = async () => {
  try {
    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });

    hostVideoFrameEl.srcObject = videoStream;

    return videoStream;
  } catch (error) {
    console.error('failed to get local media stream', error);
  }
};



/****** REGISTER EVENTs ******/
startCallButton.addEventListener('click', startEventHandler);
hostMicControlBtn.addEventListener('click', hostMicControlClickHandler);
hostCamControlBtn.addEventListener('click', hostCamControlClickHandler);
hostEndCallButton.addEventListener('click', hostEndCallClickHandler);
