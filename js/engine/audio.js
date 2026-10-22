const AudioEngine = {
  ctx: null, sfxEnabled: true, sfxVol: 0.5,
  init() {
    const s = JSON.parse(localStorage.getItem('veselia_settings_v1'));
    if(s) { this.sfxEnabled = s.sfxOn; this.sfxVol = s.sfxVol / 100; }
    document.body.addEventListener('pointerdown', () => {
      if(!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if(this.ctx.state === 'suspended') this.ctx.resume();
    }, { once: true });
  },
  updateSettings(s) { this.sfxEnabled = s.sfxOn; this.sfxVol = s.sfxVol / 100; },
  playClick() {
    if(!this.sfxEnabled || !this.ctx) return;
    const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(this.sfxVol * 0.3, this.ctx.currentTime);
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
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime); filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.2);
    const gain = this.ctx.createGain(); gain.gain.setValueAtTime(this.sfxVol * 0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination); noise.start();
  }
};
