import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import axios from 'axios';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaRegHandPaper, FaSignOutAlt, FaSmile, FaComments, FaTimes, FaThumbtack, FaUserFriends } from 'react-icons/fa';

const initialMediaState = { audio: true, video: true };

export default function VideoChat({ socket, interviewId, userId }) {
  // Add keyframes for red glow (move this to the top)
  const pipGlowStyle = `@keyframes pip-red-glow { 0% { border-color: #ff1744; box-shadow: 0 0 8px #ff1744; } 100% { border-color: #ff5252; box-shadow: 0 0 16px #ff5252; } }`;
  const pipStyle = {
    position: 'fixed',
    bottom: 24,
    right: 24,
    width: 320,
    height: 240,
    zIndex: 2000,
    background: '#232526',
    borderRadius: 16,
    boxShadow: '0 2px 16px rgba(0,0,0,0.6)',
    border: '4px solid transparent',
    animation: 'pip-red-glow 1.2s infinite alternate',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const [peers, setPeers] = useState({}); // { socketId: PeerInstance }
  const [streams, setStreams] = useState({}); // { socketId: MediaStream }
  const [participants, setParticipants] = useState([]); // [{id, userId}]
  const [mediaState, setMediaState] = useState(initialMediaState);
  const [localStream, setLocalStream] = useState(null);
  const [chat, setChat] = useState([]); // [{userId, message, timestamp}]
  const [message, setMessage] = useState('');
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const localVideoRef = useRef();
  const screenTrackRef = useRef();
  const [emojiOverlays, setEmojiOverlays] = useState({}); // { socketId: {emoji, timestamp} }
  const [dmRecipient, setDmRecipient] = useState(''); // socketId of DM recipient
  const [isFullScreen, setIsFullScreen] = useState(true);
  const pipVideoRef = useRef();
  const [isBrowserFullScreen, setIsBrowserFullScreen] = useState(false);
  const fullScreenContainerRef = useRef();
  const fullScreenVideoRef = useRef();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [pinnedId, setPinnedId] = useState(null); // For pinning a participant

  // Listen for browser fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      const fsElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      setIsBrowserFullScreen(!!fsElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);

  // Maximize handler
  const handleMaximize = () => {
    const elem = fullScreenContainerRef.current;
    if (!elem) {
      console.error('FullScreen container ref is null');
      return;
    }
    try {
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
      else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
      else alert('Fullscreen API is not supported in this browser.');
      console.log('Requested fullscreen on', elem);
    } catch (e) {
      console.error('Fullscreen request failed:', e);
    }
  };

  // Minimize handler (exit full screen)
  const handleMinimize = () => {
    try {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
      else alert('Fullscreen API is not supported in this browser.');
      console.log('Exited fullscreen');
    } catch (e) {
      console.error('Exit fullscreen failed:', e);
    }
  };

  // Get user media
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      });
  }, []);

  // Join room and handle signaling
  useEffect(() => {
    if (!localStream) return;
    socket.emit('join-video-room', { interviewId, userId });
    const peerRefs = {};

    socket.on('video-initiate', ({ to }) => {
      if (to === socket.id) return;
      const peer = new Peer({ initiator: true, trickle: false, stream: localStream });
      peer.on('signal', signal => {
        socket.emit('video-signal', { signal, to, interviewId });
      });
      peer.on('stream', remoteStream => {
        setStreams(s => ({ ...s, [to]: remoteStream }));
      });
      peerRefs[to] = peer;
      setPeers(p => ({ ...p, [to]: peer }));
    });

    socket.on('video-signal', ({ signal, from }) => {
      let peer = peerRefs[from];
      if (!peer) {
        peer = new Peer({ initiator: false, trickle: false, stream: localStream });
        peer.on('signal', s => {
          socket.emit('video-signal', { signal: s, to: from, interviewId });
        });
        peer.on('stream', remoteStream => {
          setStreams(s => ({ ...s, [from]: remoteStream }));
        });
        peerRefs[from] = peer;
        setPeers(p => ({ ...p, [from]: peer }));
      }
      peer.signal(signal);
    });

    socket.on('video-participants', (list) => {
      setParticipants(list);
    });

    socket.on('video-chat-message', (msg) => {
      setChat(c => [...c, msg]);
    });

    socket.on('video-chat-dm', (msg) => {
      setChat(c => [...c, { ...msg, dm: true }]);
    });

    socket.on('raise-hand', ({ userId }) => {
      setChat(c => [...c, { userId, message: '✋ raised their hand', timestamp: Date.now() }]);
    });

    socket.on('emoji-reaction', ({ userId, emoji, timestamp }) => {
      setEmojiOverlays(prev => ({ ...prev, [userId]: { emoji, timestamp } }));
      setTimeout(() => {
        setEmojiOverlays(prev => {
          const copy = { ...prev };
          delete copy[userId];
          return copy;
        });
      }, 2000);
    });

    return () => {
      socket.emit('leave-video-room', { interviewId });
      Object.values(peerRefs).forEach(p => p.destroy());
      setPeers({});
      setStreams({});
      socket.off('video-initiate');
      socket.off('video-signal');
      socket.off('video-participants');
      socket.off('video-chat-message');
      socket.off('video-chat-dm');
      socket.off('raise-hand');
      socket.off('emoji-reaction');
    };
  }, [localStream, interviewId, userId, socket]);

  // Mute/unmute/camera toggle
  const toggleMedia = (type) => {
    if (!localStream) return;
    localStream.getTracks().forEach(track => {
      if (track.kind === type) track.enabled = !track.enabled;
    });
    setMediaState(s => ({ ...s, [type]: !s[type] }));
  };

  // Leave call
  const leaveCall = () => {
    socket.emit('leave-video-room', { interviewId });
    Object.values(peers).forEach(p => p.destroy());
    setPeers({});
    setStreams({});
    setLocalStream(null);
  };

  // Send chat message (with DM support)
  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      if (dmRecipient) {
        socket.emit('video-chat-dm', { interviewId, fromUserId: userId, toSocketId: dmRecipient, message });
      } else {
        socket.emit('video-chat-message', { interviewId, userId, message });
      }
      setMessage('');
    }
  };

  // File upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await axios.post(`${API_URL}/api/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    const { url, originalName } = res.data;
    socket.emit('video-chat-message', { interviewId, userId, message: `[file]${originalName}::${url}` });
  };

  // Raise hand
  const raiseHand = () => {
    setHandRaised(true);
    socket.emit('raise-hand', { interviewId, userId });
    setTimeout(() => setHandRaised(false), 2000);
  };

  // Screen sharing
  const startScreenShare = async () => {
    if (!localStream) return;
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    screenTrackRef.current = screenStream.getVideoTracks()[0];
    Object.values(peers).forEach(peer => {
      const sender = peer._pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) sender.replaceTrack(screenTrackRef.current);
    });
    screenTrackRef.current.onended = () => stopScreenShare();
    setScreenSharing(true);
  };
  const stopScreenShare = () => {
    if (!localStream || !screenTrackRef.current) return;
    Object.values(peers).forEach(peer => {
      const sender = peer._pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) sender.replaceTrack(localStream.getVideoTracks()[0]);
    });
    setScreenSharing(false);
  };

  const sendEmoji = (emoji) => {
    socket.emit('emoji-reaction', { interviewId, userId, emoji });
  };

  const emojiList = ['👍', '😂', '👏', '❤️', '😮', '🎉', '😢', '🤔'];

  // In PiP, show remote video if available, else local
  let pipStream = null;
  let pipLabel = '';
  let pipId = '';
  const remoteParticipant = participants.find(p => p.id !== socket.id && streams[p.id]);
  if (remoteParticipant) {
    pipStream = streams[remoteParticipant.id];
    pipLabel = remoteParticipant.userId;
    pipId = remoteParticipant.id;
  } else {
    pipStream = localStream;
    pipLabel = userId + ' (You)';
    pipId = 'local';
  }

  // Combine local and remote streams for rendering (fix for ReferenceError)
  const allStreams = [
    { id: 'local', userId, stream: localStream },
    ...participants
      .filter(p => p.id !== socket.id && streams[p.id])
      .map(p => ({
        id: p.id,
        userId: p.userId,
        stream: streams[p.id]
      }))
  ];

  // PiP video effect
  useEffect(() => {
    if (!isBrowserFullScreen && pipVideoRef.current && pipStream) {
      pipVideoRef.current.srcObject = pipStream;
      pipVideoRef.current.play && pipVideoRef.current.play();
      console.log('PiP video srcObject set:', pipStream);
    }
  }, [pipStream, isBrowserFullScreen]);

  // Fullscreen video effect
  useEffect(() => {
    if (isBrowserFullScreen && fullScreenVideoRef.current && pipStream) {
      fullScreenVideoRef.current.srcObject = pipStream;
      fullScreenVideoRef.current.play && fullScreenVideoRef.current.play();
      console.log('Fullscreen video srcObject set:', pipStream);
    }
  }, [pipStream, isBrowserFullScreen]);

  // For status dot
  function getStatusDot(id) {
    // Green if online, red if muted audio
    if (id === 'local') {
      return mediaState.audio ? '#4caf50' : '#ff1744';
    }
    // For remote, assume online and not muted (can be improved)
    return '#4caf50';
  }

  // Always render the full screen container, but only show the full UI when in full screen
  return (
    <>
      {/* Fullscreen container (always present) */}
      <div
        ref={fullScreenContainerRef}
        style={{
          background: 'linear-gradient(135deg, #181c20 0%, #232526 100%)',
          borderRadius: 16,
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 3000,
          border: '4px solid #61dafb',
          display: isBrowserFullScreen ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'hidden',
        }}
      >
        {isBrowserFullScreen && (
          <>
            {/* Focused Main Video Area */}
            {(() => {
              // Find screen sharing participant (if any)
              let screenSharer = null;
              if (screenSharing) {
                screenSharer = { id: 'local', userId, stream: localStream };
              } else {
                const remoteScreenSharer = participants.find(p => p.id !== socket.id && streams[p.id] && streams[p.id].getVideoTracks().some(t => t.label.toLowerCase().includes('screen')));
                if (remoteScreenSharer) {
                  screenSharer = {
                    id: remoteScreenSharer.id,
                    userId: remoteScreenSharer.userId,
                    stream: streams[remoteScreenSharer.id]
                  };
                }
              }
              // Determine which stream to focus: pinned > screen share > first
              let focusStream = null;
              let isScreenShare = false;
              if (pinnedId) {
                focusStream = allStreams.find(s => s.id === pinnedId);
              } else if (screenSharer) {
                focusStream = screenSharer;
                isScreenShare = true;
              } else {
                focusStream = allStreams[0];
              }
              // If only one participant, make video fullscreen above controls
              const isSolo = allStreams.length === 1;
              // Calculate main video width based on chat visibility
              const mainVideoWidth = isSolo
                ? (showChat ? 'calc(100vw - 340px)' : '100vw')
                : (showChat ? 'calc(80vw - 170px)' : '80vw');
              return focusStream ? (
                <div style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: isSolo ? 'flex-end' : 'center',
                  marginBottom: isSolo ? 0 : 12,
                  height: isSolo ? 'calc(100vh - 140px)' : undefined,
                  minHeight: isSolo ? '0' : undefined,
                }}>
                  <div style={{
                    position: 'relative',
                    width: mainVideoWidth,
                    height: isSolo ? '100%' : undefined,
                    maxWidth: isSolo ? mainVideoWidth : 900,
                    aspectRatio: '16/9',
                    background: '#181c20',
                    borderRadius: isSolo ? 0 : 18,
                    boxShadow: isSolo ? 'none' : '0 4px 32px rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                    border: isSolo ? 'none' : '4px solid #61dafb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: isSolo ? undefined : 'focus-glow 1.5s infinite alternate',
                    transition: 'width 0.3s cubic-bezier(.4,2,.6,1)',
                  }}>
                    <style>{`@keyframes focus-glow { 0% { box-shadow: 0 0 0 0 #61dafb; } 100% { box-shadow: 0 0 32px 8px #61dafb55; } }`}</style>
                    <video
                      ref={focusStream.id === 'local' ? localVideoRef : undefined}
                      autoPlay
                      muted={focusStream.id === 'local'}
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#222', border: 'none' }}
                      srcObject={focusStream.stream}
                      onLoadedMetadata={e => e.target.play()}
                    />
                    {/* Emoji overlay */}
                    {emojiOverlays[focusStream.userId] && (
                      <span style={{ position: 'absolute', top: 18, left: 24, fontSize: 48, zIndex: 2, pointerEvents: 'none', filter: 'drop-shadow(0 2px 8px #000)' }}>{emojiOverlays[focusStream.userId].emoji}</span>
                    )}
                    {/* Name overlay and status */}
                    <span style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', background: 'rgba(24,28,32,0.7)', color: '#fff', fontWeight: 600, fontSize: 18, padding: '0.4rem 1rem', letterSpacing: 0.5, borderBottomLeftRadius: isSolo ? 0 : 18, borderBottomRightRadius: isSolo ? 0 : 18, textShadow: '0 2px 8px #000', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: getStatusDot(focusStream.id), marginRight: 8, border: '2px solid #fff' }}></span>
                      {focusStream.userId}{focusStream.id === 'local' ? ' (You)' : ''}
                      {isScreenShare && <span style={{ background: '#00C853', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 13, marginLeft: 10 }}>Screen Sharing</span>}
                      {pinnedId === focusStream.id && <span style={{ background: '#ff1744', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 13, marginLeft: 10, display: 'flex', alignItems: 'center', gap: 4 }}><FaThumbtack style={{ transform: 'rotate(-20deg)' }} />Pinned</span>}
                    </span>
                    {/* Unpin button if pinned */}
                    {pinnedId === focusStream.id && !isSolo && (
                      <button onClick={() => setPinnedId(null)} title="Unpin" style={{ position: 'absolute', top: 18, right: 24, background: '#ff1744', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: 16, cursor: 'pointer', zIndex: 3 }}><FaThumbtack style={{ transform: 'rotate(-20deg)' }} /> Unpin</button>
                    )}
                  </div>
                </div>
              ) : null;
            })()}
            {/* Thumbnails Row */}
            {allStreams.length > 1 && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 18, marginBottom: 18, overflowX: 'auto', padding: '0 2vw' }}>
                {allStreams.filter(s => {
                  // Don't show the focused stream as a thumbnail
                  let screenSharerId = null;
                  if (screenSharing) screenSharerId = 'local';
                  else {
                    const remoteScreenSharer = participants.find(p => p.id !== socket.id && streams[p.id] && streams[p.id].getVideoTracks().some(t => t.label.toLowerCase().includes('screen')));
                    if (remoteScreenSharer) screenSharerId = remoteScreenSharer.id;
                  }
                  let focusId = pinnedId || screenSharerId || (allStreams[0] && allStreams[0].id);
                  return s.id !== focusId;
                }).map(({ id, userId, stream }) => (
                  <div key={id} style={{ position: 'relative', width: 160, height: 90, background: '#181c20', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', overflow: 'hidden', border: '2px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow 0.2s', cursor: 'pointer' }}>
                    <video
                      ref={id === 'local' ? localVideoRef : undefined}
                      autoPlay
                      muted={id === 'local'}
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#222', border: 'none' }}
                      srcObject={stream}
                      onLoadedMetadata={e => e.target.play()}
                    />
                    {/* Status dot */}
                    <span style={{ position: 'absolute', top: 8, left: 10, width: 10, height: 10, borderRadius: '50%', background: getStatusDot(id), border: '2px solid #fff' }}></span>
                    {/* Name overlay */}
                    <span style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', background: 'rgba(24,28,32,0.7)', color: '#fff', fontWeight: 600, fontSize: 13, padding: '0.2rem 0.7rem', letterSpacing: 0.5, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, textShadow: '0 2px 8px #000', display: 'flex', alignItems: 'center', gap: 6 }}>{userId}{id === 'local' ? ' (You)' : ''}</span>
                    {/* Pin button */}
                    <button onClick={() => setPinnedId(id)} title="Pin" style={{ position: 'absolute', top: 8, right: 10, background: '#61dafb', color: '#232526', border: 'none', borderRadius: 8, padding: '4px 8px', fontWeight: 700, fontSize: 14, cursor: 'pointer', zIndex: 3, display: 'flex', alignItems: 'center', gap: 4 }}><FaThumbtack style={{ transform: 'rotate(-20deg)' }} /> Pin</button>
                  </div>
                ))}
              </div>
            )}
            {/* Controls Bar */}
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100vw',
                background: 'rgba(24,28,32,0.95)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 24,
                padding: '1.2rem 2vw',
                zIndex: 10,
                boxShadow: '0 -2px 24px rgba(0,0,0,0.4)',
              }}
            >
              <button onClick={handleMinimize} title="Minimize" style={{ background: '#232526', color: '#fff', border: 'none', borderRadius: 50, width: 54, height: 54, fontSize: 22, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}><FaTimes /></button>
              <button onClick={() => toggleMedia('audio')} title={mediaState.audio ? 'Mute' : 'Unmute'} style={{ background: mediaState.audio ? '#232526' : '#ff9800', color: '#fff', border: 'none', borderRadius: 50, width: 54, height: 54, fontSize: 22, cursor: 'pointer' }}>{mediaState.audio ? <FaMicrophone /> : <FaMicrophoneSlash />}</button>
              <button onClick={() => toggleMedia('video')} title={mediaState.video ? 'Camera Off' : 'Camera On'} style={{ background: mediaState.video ? '#232526' : '#ff9800', color: '#fff', border: 'none', borderRadius: 50, width: 54, height: 54, fontSize: 22, cursor: 'pointer' }}>{mediaState.video ? <FaVideo /> : <FaVideoSlash />}</button>
              <button onClick={screenSharing ? stopScreenShare : startScreenShare} title={screenSharing ? 'Stop Share' : 'Share Screen'} style={{ background: screenSharing ? '#00C853' : '#232526', color: '#fff', border: 'none', borderRadius: 50, width: 54, height: 54, fontSize: 22, cursor: 'pointer' }}><FaDesktop /></button>
              <button onClick={raiseHand} disabled={handRaised} title="Raise Hand" style={{ background: handRaised ? '#232526' : '#61dafb', color: '#fff', border: 'none', borderRadius: 50, width: 54, height: 54, fontSize: 22, cursor: 'pointer', opacity: handRaised ? 0.5 : 1 }}><FaRegHandPaper /></button>
              <button onClick={() => setShowEmojiPicker(e => !e)} title="Emojis" style={{ background: '#232526', color: '#fff', border: 'none', borderRadius: 50, width: 54, height: 54, fontSize: 22, cursor: 'pointer' }}><FaSmile /></button>
              <button onClick={() => setShowChat(c => !c)} title="Toggle Chat" style={{ background: showChat ? '#61dafb' : '#232526', color: showChat ? '#232526' : '#fff', border: 'none', borderRadius: 50, width: 54, height: 54, fontSize: 22, cursor: 'pointer' }}><FaComments /></button>
              <button onClick={leaveCall} title="Leave" style={{ background: '#ff1744', color: '#fff', border: 'none', borderRadius: 50, width: 90, height: 54, fontSize: 18, fontWeight: 700, cursor: 'pointer', marginLeft: 16 }}>Leave</button>
              {showEmojiPicker && (
                <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#232526', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.4)', padding: 16, display: 'flex', gap: 8, zIndex: 100 }}>
                  {emojiList.map(e => (
                    <button key={e} onClick={() => { sendEmoji(e); setShowEmojiPicker(false); }} style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>{e}</button>
                  ))}
                </div>
              )}
            </div>
            {/* Chat Panel */}
            {showChat && (
              <div
                style={{
                  position: 'fixed',
                  right: 0,
                  top: 0,
                  height: '100vh',
                  width: 340,
                  background: 'rgba(24,28,32,0.98)',
                  borderLeft: '2px solid #232526',
                  boxShadow: '-2px 0 24px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 20,
                }}
              >
                {/* Participant List */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '1.2rem 1rem 0.5rem 1rem', fontWeight: 700, fontSize: 18, color: '#61dafb', borderBottom: '1px solid #232526' }}><FaUserFriends /> Participants ({participants.length}): {participants.map(p => p.userId).join(', ')}</div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                  {chat.map((msg, i) => {
                    if (msg.message.startsWith('[file]')) {
                      const [name, url] = msg.message.replace('[file]', '').split('::');
                      return <div key={i} style={{ fontSize: 14, marginBottom: 8 }}><b>{msg.userId || msg.fromUserId}:</b> <a href={url} target="_blank" rel="noopener noreferrer" download>{name}</a> <span style={{ color: '#888', fontSize: 10 }}>{new Date(msg.timestamp).toLocaleTimeString()}</span> {msg.dm && <span style={{ color: '#f39c12', fontSize: 11 }}>(Private)</span>}</div>;
                    }
                    return <div key={i} style={{ fontSize: 14, marginBottom: 8 }}><b>{msg.userId || msg.fromUserId}:</b> {msg.message} <span style={{ color: '#888', fontSize: 10 }}>{new Date(msg.timestamp).toLocaleTimeString()}</span> {msg.dm && <span style={{ color: '#f39c12', fontSize: 11 }}>(Private)</span>}</div>;
                  })}
                </div>
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: 4, padding: '0.5rem 1rem 1rem 1rem' }}>
                  <input value={message} onChange={e => setMessage(e.target.value)} style={{ flex: 1, borderRadius: 6, border: '1px solid #444', padding: 8, fontSize: 15, background: '#232526', color: '#fff' }} placeholder="Type a message..." />
                  <button type="submit" style={{ background: '#61dafb', color: '#232526', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Send</button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
      {/* PiP mode */}
      {!isBrowserFullScreen && (
        <>
          <style>{pipGlowStyle}</style>
          <div style={pipStyle}>
            <video
              ref={pipVideoRef}
              key={'pip-' + (pipStream && pipStream.id ? pipStream.id : Math.random())}
              autoPlay
              muted={pipLabel.endsWith('(You)')}
              playsInline
              style={{ width: 288, height: 180, borderRadius: 10, background: '#222', border: 'none', objectFit: 'cover' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 288, marginTop: 4 }}>
              <span style={{ color: '#fff', fontSize: 14 }}>{pipLabel}</span>
              <button onClick={handleMaximize} title="Maximize" style={{ background: '#ff1744', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 700, cursor: 'pointer' }}>Maximize</button>
            </div>
            {!document.fullscreenEnabled && <div style={{ color: 'red', fontSize: 12, marginTop: 8 }}>Fullscreen not supported in this browser.</div>}
          </div>
        </>
      )}
    </>
  );
} 