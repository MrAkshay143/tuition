import { useEffect, useRef, useState } from 'react';
import { api } from '../client';
import toast from 'react-hot-toast';

export const useWebRTCChat = (partnerId: number | null) => {
  const [messages, setMessages] = useState<any[]>([]);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!partnerId) return;

    setMessages([]);

    const initWebRTC = async () => {
      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      dataChannel.current = peerConnection.current.createDataChannel('chat');
      
      dataChannel.current.onopen = () => {
        console.log('WebRTC Data Channel Opened');
        setIsConnected(true);
      };

      dataChannel.current.onclose = () => setIsConnected(false);

      dataChannel.current.onmessage = (event) => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          body: event.data,
          sender_id: partnerId,
          created_at: new Date().toISOString()
        }]);
      };

      peerConnection.current.ondatachannel = (event) => {
        event.channel.onmessage = (e) => {
          setMessages(prev => [...prev, {
            id: Date.now(),
            body: e.data,
            sender_id: partnerId,
            created_at: new Date().toISOString()
          }]);
        };
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          api.post(`/chat/signal/${partnerId}`, {
            type: 'candidate',
            candidate: event.candidate
          }).catch(() => {});
        }
      };

      try {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        
        api.post(`/chat/signal/${partnerId}`, {
          type: 'offer',
          sdp: offer.sdp
        }).catch(() => {});
      } catch (err) {
        console.error("WebRTC Initialization Failed", err);
      }
    };

    initWebRTC();

    return () => {
      dataChannel.current?.close();
      peerConnection.current?.close();
    };
  }, [partnerId]);

  const sendMessage = (body: string) => {
    if (dataChannel.current?.readyState === 'open') {
      dataChannel.current.send(body);
      setMessages(prev => [...prev, {
        id: Date.now(),
        body: body,
        sender_id: 0,
        created_at: new Date().toISOString()
      }]);
      return true;
    } else {
      toast.error('WebRTC Data Channel is not open. Signaling fallback active.');
      api.post(`/chat/messages/${partnerId}`, { type: 'text', body });
      setMessages(prev => [...prev, {
        id: Date.now(),
        body: body,
        sender_id: 0,
        created_at: new Date().toISOString()
      }]);
      return false;
    }
  };

  return { webrtcMessages: messages, sendWebRTCMessage: sendMessage, isConnected };
};
