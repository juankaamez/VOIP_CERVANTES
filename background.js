chrome.runtime.onInstalled.addListener(() => {
  console.log('VoIP Assistant with SIP installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeTranscript') {
    // Here you would implement the logic to send the transcript to a server for analysis
    // For now, we'll just log the request and send a mock response
    console.log('Received transcript for analysis:', request.transcript);
    
    // Mock analysis result
    const mockAnalysis = {
      tips: ['Speak more slowly', 'Use more varied vocabulary'],
      grammar: ['Check subject-verb agreement', 'Watch out for run-on sentences'],
      skills: ['Good use of active listening', 'Try to ask more open-ended questions'],
      tactics: ['Effective use of mirroring', 'Consider using more "we" statements'],
      rating: 7.5
    };

    sendResponse({success: true, analysis: mockAnalysis});
  }
  return true; // Indicates that the response will be sent asynchronously
});