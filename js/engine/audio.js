const AudioEngine = {
  ctx: null, sfxEnabled: true, sfxVol: 0.5,
  init() {
    const s = JSON.parse(localStorage.getItem('veselia_set_v1'));
    if(s) { this.sfxEnabled = s.sfxOn; this.sfxVol = s.sfxVol / 100; }
    
    // 强制在第一次触摸屏幕时解锁音频上下文
    const unlockAudio = () => {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      document.body.removeEventListener('pointerdown', unlockAudio);
    };
    document.body.addEventListener('pointerdown', unlockAudio);
  },
  updateSettings(s) { this.sfxEnabled = s.sfxOn; this.sfxVol = s.sfxVol / 100; },
  playClick() {
    if(!this.sfxEnabled || !this.ctx) return;
    const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(this.sfxVol * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.1);
  },
  playPage() {
    if(!this.sfxEnabled || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.2; const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource(); noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, this.ctx.currentTime); filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.2);
    const gain = this.ctx.createGain(); gain.gain.setValueAtTime(this.sfxVol * 0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination); noise.start();
  }
};
