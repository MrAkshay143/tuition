import { api } from '@/api/client';

type SignalPayload = {
  type: 'offer' | 'answer' | 'ice';
  payload: any;
};

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private partnerId: string;
  private onMessage: (msg: any) => void;
  private iceCandidatesQueue: any[] = [];
  private iceBatchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(partnerId: string, onMessage: (msg: any) => void) {
    this.partnerId = partnerId;
    this.onMessage = onMessage;
  }

  public async connect(isInitiator: boolean = true) {
    let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
    try {
      const configRes = await api.get('/chat/webrtc-config');
      if (configRes.data?.enabled === false) {
        console.log('WebRTC disabled by admin');
        return;
      }
      if (configRes.data?.iceServers?.length > 0) {
        iceServers = configRes.data.iceServers;
      }
    } catch (e) {
      console.warn('Failed to fetch WebRTC config, using fallback STUN');
    }

    this.pc = new RTCPeerConnection({ iceServers });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.bufferIceCandidate(event.candidate);
      }
    };
    
    this.pc.oniceconnectionstatechange = async () => {
      if (this.pc?.iceConnectionState === 'failed') {
        console.warn('ICE connection failed, restarting ICE...');
        this.pc.restartIce();
        const offer = await this.pc.createOffer({ iceRestart: true });
        await this.pc.setLocalDescription(offer);
        await this.sendSignal('offer', offer);
      }
    };

    if (isInitiator) {
      this.dataChannel = this.pc.createDataChannel('chat');
      this.setupDataChannel();
      
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      await this.sendSignal('offer', offer);
    } else {
      this.pc.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel();
      };
    }
  }

  private setupDataChannel() {
    if (!this.dataChannel) return;
    
    this.dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage(data);
      } catch (e) {
        console.error('Failed to parse WebRTC message', e);
      }
    };
  }

  public send(message: any) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  public async handleSignal(signal: SignalPayload) {
    if (!this.pc) await this.connect(false);

    try {
      if (signal.type === 'offer') {
        await this.pc!.setRemoteDescription(new RTCSessionDescription(signal.payload));
        const answer = await this.pc!.createAnswer();
        await this.pc!.setLocalDescription(answer);
        await this.sendSignal('answer', answer);
      } else if (signal.type === 'answer') {
        await this.pc!.setRemoteDescription(new RTCSessionDescription(signal.payload));
      } else if (signal.type === 'ice') {
        // payload might be a single candidate or an array of batched candidates
        const candidates = Array.isArray(signal.payload) ? signal.payload : [signal.payload];
        for (const candidate of candidates) {
          if (candidate) {
            await this.pc!.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      }
    } catch (e) {
      console.error('Error handling WebRTC signal', e);
    }
  }

  private bufferIceCandidate(candidate: any) {
    this.iceCandidatesQueue.push(candidate);
    
    if (!this.iceBatchTimeout) {
      this.iceBatchTimeout = setTimeout(() => {
        this.sendSignal('ice', this.iceCandidatesQueue);
        this.iceCandidatesQueue = [];
        this.iceBatchTimeout = null;
      }, 300);
    }
  }

  private async sendSignal(type: 'offer' | 'answer' | 'ice', payload: any) {
    try {
      await api.post('/chat/signal', {
        partner_id: parseInt(this.partnerId),
        type,
        payload
      });
    } catch (e) {
      console.error('Failed to send signal', e);
    }
  }
  
  public async fetchPendingSignals() {
    try {
      const res = await api.get('/chat/signals');
      const signals = res.data;
      if (Array.isArray(signals)) {
        for (const signal of signals) {
          if (signal.sender_id.toString() === this.partnerId) {
            await this.handleSignal(signal);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch pending signals', e);
    }
  }

  public disconnect() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    if (this.pc) {
      this.pc.close();
    }
  }
}
