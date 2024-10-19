let userAgent;
let session;

document.addEventListener('DOMContentLoaded', function() {
  const connectBtn = document.getElementById('connect-btn');
  const callBtn = document.getElementById('call-btn');
  const hangupBtn = document.getElementById('hangup-btn');
  const pastConversationSelect = document.getElementById('past-conversation-select');
  const localLanguageSelect = document.getElementById('local-language');
  const remoteLanguageSelect = document.getElementById('remote-language');

  connectBtn.addEventListener('click', connectToSIPServer);
  callBtn.addEventListener('click', startCall);
  hangupBtn.addEventListener('click', endCall);
  pastConversationSelect.addEventListener('change', loadPastConversation);
  localLanguageSelect.addEventListener('change', updateLocalLanguage);
  remoteLanguageSelect.addEventListener('change', updateRemoteLanguage);

  loadPastConversations();
});

function connectToSIPServer() {
  const sipServer = document.getElementById('sip-server').value;
  const sipUsername = document.getElementById('sip-username').value;
  const sipPassword = document.getElementById('sip-password').value;
  const sipDisplayName = document.getElementById('sip-display-name').value;

  const socket = new SIP.WebSocketInterface(`wss://${sipServer}`);
  const configuration = {
    uri: `sip:${sipUsername}@${sipServer}`,
    authorizationUser: sipUsername,
    password: sipPassword,
    displayName: sipDisplayName,
    transportOptions: {
      wsServers: [`wss://${sipServer}`]
    }
  };

  userAgent = new SIP.UA(configuration);

  userAgent.on('registered', function() {
    console.log('SIP UA registered');
    document.getElementById('connect-btn').disabled = true;
    document.getElementById('call-btn').disabled = false;
  });

  userAgent.on('unregistered', function() {
    console.log('SIP UA unregistered');
  });

  userAgent.on('registrationFailed', function(cause) {
    console.error('SIP UA registration failed:', cause);
    showError('SIP registration failed: ' + cause);
  });

  userAgent.on('invite', function(session) {
    handleIncomingCall(session);
  });

  userAgent.start();
}

function startCall() {
  const remoteUri = document.getElementById('remote-uri').value;
  const options = {
    media: {
      constraints: {
        audio: true,
        video: false
      },
      render: {
        remote: document.getElementById('remote-audio')
      }
    }
  };

  session = userAgent.invite(remoteUri, options);
  handleCall(session);
}

function handleIncomingCall(incomingSession) {
  session = incomingSession;
  session.accept({
    media: {
      constraints: {
        audio: true,
        video: false
      },
      render: {
        remote: document.getElementById('remote-audio')
      }
    }
  });
  handleCall(session);
}

function handleCall(callSession) {
  document.getElementById('call-btn').disabled = true;
  document.getElementById('hangup-btn').disabled = false;

  callSession.on('terminated', function() {
    endCall();
  });

  startRecognition('local');
  startRecognition('remote');
}

function endCall() {
  if (session) {
    session.terminate();
  }
  document.getElementById('call-btn').disabled = false;
  document.getElementById('hangup-btn').disabled = true;
  stopRecognition('local');
  stopRecognition('remote');
}

// The rest of the functions (updateTranscript, analyzeConversation, etc.) remain the same

function startRecognition(type) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'startRecognition', type: type});
  });
}

function stopRecognition(type) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'stopRecognition', type: type});
  });
}

// Add this at the end of the file
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateTranscript') {
    updateTranscript(request.type, request.finalTranscript, request.interimTranscript);
  }
});