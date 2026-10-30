/**
 * =========================================
 * 奶娃大笑遊戲 (Naiva Laughing Game) - game.js
 * =========================================
 */

// ─── 遊戲設定與常數 ──────────────────────────────
const CONFIG = {
  imgSrc: 'naiva.png',
  defaultTime: 30,
  maxOnScreen: 6,
  goldenChance: 0.18,          // 18% 機率生成狂熱金奶娃
  ytVideoId: 'Y2Xn97vhgsQ',     // YouTube 官方背景音樂
  localStorageKey: 'naiva_high_score_v1'
};

// ─── 音效引擎 (Web Audio API 合成器 + YouTube 音樂) ────────
class AudioEngine {
  constructor() {
    this.muted = false;
    this.ytPlayer = null;
    this.ytReady = false;
    this.audioCtx = null;
    this.bgmOscInterval = null;
    this.initYouTube();
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  initYouTube() {
    // 載入 YouTube IFrame API
    window.onYouTubeIframeAPIReady = () => {
      this.ytPlayer = new YT.Player('yt-player', {
        videoId: CONFIG.ytVideoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          playlist: CONFIG.ytVideoId,
          playsinline: 1,
          modestbranding: 1
        },
        events: {
          onReady: () => {
            this.ytReady = true;
          },
          onError: () => {
            console.warn('YouTube 音訊載入失敗，將使用內建合成音效作為備援。');
          }
        }
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }

  playBGM() {
    if (this.muted) return;
    if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
      try {
        this.ytPlayer.unMute();
        this.ytPlayer.playVideo();
        return;
      } catch (err) {
        console.warn('YouTube 播放受限，使用合成音樂備援', err);
      }
    }
    // 備援合成歡樂旋律
    this.startSynthBgm();
  }

  pauseBGM() {
    if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      try { this.ytPlayer.pauseVideo(); } catch (e) {}
    }
    this.stopSynthBgm();
  }

  stopBGM() {
    if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.stopVideo === 'function') {
      try { this.ytPlayer.stopVideo(); } catch (e) {}
    }
    this.stopSynthBgm();
  }

  startSynthBgm() {
    if (this.bgmOscInterval || this.muted) return;
    const ctx = this.getAudioContext();
    const notes = [261.6, 329.6, 392.0, 523.3, 392.0, 329.6]; // C-E-G-C-G-E 歡樂循環
    let noteIdx = 0;

    this.bgmOscInterval = setInterval(() => {
      if (this.muted) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(notes[noteIdx % notes.length], t);
      noteIdx++;

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.32);
    }, 320);
  }

  stopSynthBgm() {
    if (this.bgmOscInterval) {
      clearInterval(this.bgmOscInterval);
      this.bgmOscInterval = null;
    }
  }

  // 逼真魔性笑聲合成音效
  playLaughSound(pitchMultiplier = 1.0) {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    const laughPitches = [0, 2, 4, 1, 3, -1, 2, 5]; // 咯咯大笑音程
    const startTime = ctx.currentTime;

    laughPitches.forEach((semi, i) => {
      const t = startTime + i * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = 380 * pitchMultiplier * Math.pow(2, semi / 12);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.35, t + 0.065);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    });
  }

  // 金色奶娃專屬清脆和弦音
  playGoldenChime() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C 和弦琶音
    const t = ctx.currentTime;

    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.25, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.38);
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.pauseBGM();
    } else {
      this.playBGM();
    }
    return this.muted;
  }
}

// ─── 遊戲主控模組 ──────────────────────────────
class NaivaGame {
  constructor() {
    this.audio = new AudioEngine();

    // DOM 元素引用
    this.starsContainer = document.getElementById('stars-container');
    this.gameArea = document.getElementById('game-area');
    this.scoreEl = document.getElementById('score-display');
    this.timerEl = document.getElementById('timer-display');
    this.comboEl = document.getElementById('combo-display');
    this.highScoreEl = document.getElementById('high-score-display');
    this.startModal = document.getElementById('start-modal');
    this.endModal = document.getElementById('end-modal');
    this.pauseModal = document.getElementById('pause-modal');
    this.muteBtn = document.getElementById('mute-btn');
    this.pauseBtn = document.getElementById('pause-btn');

    // 遊戲運行狀態
    this.selectedTime = CONFIG.defaultTime;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalClicks = 0;
    this.hits = 0;
    this.timeLeft = this.selectedTime;
    this.isRunning = false;
    this.isPaused = false;
    this.activeNaivas = [];
    this.spawnTimer = null;
    this.countdownTimer = null;

    this.highScore = parseInt(localStorage.getItem(CONFIG.localStorageKey), 10) || 0;

    this.initStars();
    this.bindEvents();
    this.updateHUD();
  }

  initStars() {
    const starCount = 65;
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      const size = (Math.random() * 2.8 + 1).toFixed(1);
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}vw`;
      star.style.top = `${Math.random() * 100}vh`;
      star.style.setProperty('--duration', `${(Math.random() * 3 + 2).toFixed(1)}s`);
      star.style.animationDelay = `${(Math.random() * 4).toFixed(1)}s`;
      this.starsContainer.appendChild(star);
    }
  }

  bindEvents() {
    // 難度時間按鈕切換
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedTime = parseInt(btn.dataset.time, 10);
      });
    });

    // 開始按鈕
    document.getElementById('start-btn').addEventListener('click', () => this.startGame());
    document.getElementById('restart-btn').addEventListener('click', () => this.startGame());

    // 暫停與恢復
    this.pauseBtn.addEventListener('click', () => this.togglePause());
    document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());

    // 靜音切換
    this.muteBtn.addEventListener('click', () => {
      const isMuted = this.audio.toggleMute();
      this.muteBtn.textContent = isMuted ? '🔇' : '🔊';
      this.muteBtn.title = isMuted ? '取消靜音' : '靜音';
    });

    // 點擊空白處斷 Combo
    this.gameArea.addEventListener('click', (e) => {
      if (this.isRunning && !this.isPaused && e.target === this.gameArea) {
        this.totalClicks++;
        this.breakCombo();
      }
    });

    // 手機防誤觸與快速點擊體驗
    document.addEventListener('gesturestart', (e) => e.preventDefault());
  }

  startGame() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalClicks = 0;
    this.hits = 0;
    this.timeLeft = this.selectedTime;
    this.activeNaivas = [];
    this.gameArea.innerHTML = '';

    this.startModal.classList.add('hidden');
    this.endModal.classList.add('hidden');
    this.pauseModal.classList.add('hidden');

    this.isRunning = true;
    this.isPaused = false;
    document.body.classList.remove('fever-mode');
    this.timerEl.style.color = 'var(--danger-color)';

    this.updateHUD();
    this.audio.playBGM();

    // 啟動定時器 (隨時間加速生成速度)
    this.scheduleNextSpawn();
    this.countdownTimer = setInterval(() => this.tick(), 1000);
  }

  scheduleNextSpawn() {
    if (!this.isRunning || this.isPaused) return;

    // 時間越少，生成節奏越快 (由 900ms 降至 500ms)
    const ratio = Math.max(0, this.timeLeft / this.selectedTime);
    const interval = 500 + ratio * 420;

    this.spawnNaiva();
    this.spawnTimer = setTimeout(() => this.scheduleNextSpawn(), interval);
  }

  tick() {
    if (this.isPaused) return;

    this.timeLeft--;
    this.updateHUD();

    if (this.timeLeft <= 5) {
      this.timerEl.style.color = '#ff1744';
      this.timerEl.style.transform = 'scale(1.15)';
      setTimeout(() => { this.timerEl.style.transform = 'scale(1)'; }, 200);
    }

    if (this.timeLeft <= 0) {
      this.endGame();
    }
  }

  spawnNaiva() {
    if (!this.isRunning || this.isPaused) return;
    if (this.activeNaivas.length >= CONFIG.maxOnScreen) return;

    const areaW = this.gameArea.clientWidth;
    const areaH = this.gameArea.clientHeight;

    const isGolden = Math.random() < CONFIG.goldenChance;
    const size = Math.floor(Math.random() * 50 + 85); // 85px ~ 135px

    const x = Math.max(10, Math.min(areaW - size - 15, Math.random() * (areaW - size)));
    const y = Math.max(10, Math.min(areaH - size - 15, Math.random() * (areaH - size)));

    const el = document.createElement('div');
    el.className = `naiva popping-in ${isGolden ? 'golden' : 'floating'}`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    const img = document.createElement('img');
    img.src = CONFIG.imgSrc;
    img.draggable = false;
    img.alt = '奶娃';
    el.appendChild(img);

    // 綁定點擊與觸控
    const hitHandler = (e) => this.onNaivaClick(e, el, size, isGolden);
    el.addEventListener('pointerdown', hitHandler);

    this.gameArea.appendChild(el);
    this.activeNaivas.push(el);

    // 自動超時淡出消失
    const lifeTime = isGolden ? 2200 : (2700 + Math.random() * 1100);
    el._autoRemoveTimer = setTimeout(() => {
      if (el.parentNode) {
        this.removeNaiva(el, false);
      }
    }, lifeTime);
  }

  onNaivaClick(e, el, size, isGolden) {
    if (!this.isRunning || this.isPaused || el.classList.contains('clicked')) return;
    e.stopPropagation();

    clearTimeout(el._autoRemoveTimer);
    el.classList.remove('popping-in', 'floating');
    el.classList.add('clicked');

    this.totalClicks++;
    this.hits++;
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    // 連擊加分公式
    let basePts = 10;
    if (this.combo >= 10) basePts = 40;
    else if (this.combo >= 5) basePts = 30;
    else if (this.combo >= 3) basePts = 20;

    const multiplier = isGolden ? 3 : 1;
    const finalPts = basePts * multiplier;
    this.score += finalPts;

    // 狂熱模式 (5 Combo 以上)
    if (this.combo >= 5) {
      document.body.classList.add('fever-mode');
    }

    // 音效反饋
    if (isGolden) {
      this.audio.playGoldenChime();
    } else {
      const pitch = 1.0 + Math.min(0.6, (this.combo * 0.05));
      this.audio.playLaughSound(pitch);
    }

    // 產生特效：浮動分數、水波紋、彩紙粒子
    this.spawnFloatingScore(el, size, finalPts, isGolden);
    this.spawnRipple(e.clientX, e.clientY);
    this.spawnParticles(e.clientX, e.clientY, isGolden ? 12 : 6, isGolden);

    this.updateHUD(true);

    setTimeout(() => this.removeNaiva(el, true), 310);
  }

  removeNaiva(el, wasClicked) {
    if (!wasClicked) {
      this.breakCombo();
    }
    const idx = this.activeNaivas.indexOf(el);
    if (idx !== -1) {
      this.activeNaivas.splice(idx, 1);
    }
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
    this.updateHUD();
  }

  breakCombo() {
    this.combo = 0;
    document.body.classList.remove('fever-mode');
    this.updateHUD();
  }

  spawnFloatingScore(el, size, pts, isGolden) {
    const fs = document.createElement('div');
    fs.className = `float-score ${isGolden ? 'golden' : ''}`;
    let text = `+${pts}`;
    if (isGolden) text += ' 👑';
    else if (this.combo >= 5) text += ' 🔥';

    fs.textContent = text;
    fs.style.left = `${el.offsetLeft + size / 2 - 25}px`;
    fs.style.top = `${el.offsetTop - 15}px`;

    this.gameArea.appendChild(fs);
    setTimeout(() => fs.remove(), 850);
  }

  spawnRipple(clientX, clientY) {
    const rip = document.createElement('div');
    rip.className = 'ripple';
    rip.style.left = `${clientX}px`;
    rip.style.top = `${clientY}px`;
    this.gameArea.appendChild(rip);
    setTimeout(() => rip.remove(), 550);
  }

  spawnParticles(x, y, count, isGolden) {
    const colors = isGolden
      ? ['#FFD700', '#FFA500', '#FFF', '#FF4757']
      : ['#FFD700', '#2ED573', '#70A1FF', '#FF6B6B'];

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const dist = Math.random() * 60 + 35;
      const dx = `${Math.cos(angle) * dist}px`;
      const dy = `${Math.sin(angle) * dist}px`;
      const sz = Math.random() * 7 + 4;

      p.style.width = `${sz}px`;
      p.style.height = `${sz}px`;
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.setProperty('--dx', dx);
      p.style.setProperty('--dy', dy);

      this.gameArea.appendChild(p);
      setTimeout(() => p.remove(), 650);
    }
  }

  updateHUD(animateCombo = false) {
    this.scoreEl.textContent = `⭐ ${this.score}`;
    this.timerEl.textContent = `⏱ ${this.timeLeft}`;
    this.highScoreEl.textContent = `🏆 最高: ${this.highScore}`;

    if (this.combo >= 10) {
      this.comboEl.textContent = `💥 FEVER ×${this.combo}!`;
      this.comboEl.style.color = '#ff4757';
    } else if (this.combo >= 5) {
      this.comboEl.textContent = `🔥 連擊 ×${this.combo}`;
      this.comboEl.style.color = '#ffa500';
    } else if (this.combo >= 3) {
      this.comboEl.textContent = `✨ 連擊 ×${this.combo}`;
      this.comboEl.style.color = '#2ed573';
    } else {
      this.comboEl.textContent = '';
    }

    if (animateCombo && this.combo >= 3) {
      this.comboEl.classList.remove('combo-bounce');
      void this.comboEl.offsetWidth; // 強制重繪以重播動畫
      this.comboEl.classList.add('combo-bounce');
    }
  }

  togglePause() {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.audio.pauseBGM();
      this.pauseModal.classList.remove('hidden');
      this.pauseBtn.textContent = '▶';
      clearTimeout(this.spawnTimer);
    } else {
      this.audio.playBGM();
      this.pauseModal.classList.add('hidden');
      this.pauseBtn.textContent = '⏸';
      this.scheduleNextSpawn();
    }
  }

  endGame() {
    this.isRunning = false;
    clearTimeout(this.spawnTimer);
    clearInterval(this.countdownTimer);
    this.audio.stopBGM();
    document.body.classList.remove('fever-mode');

    // 更新最高紀錄
    let isNewRecord = false;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(CONFIG.localStorageKey, this.highScore.toString());
      isNewRecord = true;
    }

    const accuracy = this.totalClicks > 0
      ? Math.round((this.hits / this.totalClicks) * 100)
      : 0;

    // 計算稱號評等
    let grade = '🤣 再接再厲！';
    if (this.score >= 550) grade = '👑 奶娃至尊神手！';
    else if (this.score >= 380) grade = '🏆 大笑狂暴大師！';
    else if (this.score >= 220) grade = '😄 手速高手！';
    else if (this.score >= 120) grade = '👍 表現不錯！';

    // 填寫結算畫面數據
    document.getElementById('final-score-val').textContent = `${this.score} 分`;
    document.getElementById('final-grade').textContent = grade;
    document.getElementById('stat-accuracy').textContent = `${accuracy}%`;
    document.getElementById('stat-max-combo').textContent = `×${this.maxCombo}`;
    document.getElementById('new-record-tag').style.display = isNewRecord ? 'inline-block' : 'none';

    setTimeout(() => {
      this.gameArea.innerHTML = '';
      this.activeNaivas = [];
      this.endModal.classList.remove('hidden');
    }, 450);
  }
}

// ─── DOM 載入完畢後自動初始化 ──────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.naivaGame = new NaivaGame();
});
