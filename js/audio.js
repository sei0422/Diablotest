// --- Audio System (Web Audio API with Dungeon Reverb) ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx, reverbNode, masterGain, reverbSend, dryGain;
let bgmNodes = null;

const ITEM_ICON_SPRITE = {
    '\u2694': 'iSword', '\ud83e\udea3': 'iAxe', '\ud83d\udd2e': 'iStaff',
    '\ud83d\udee1': 'iShield', '\u26d1': 'iHelmet', '\ud83e\uddba': 'iArmor',
    '\ud83d\udc8d': 'iRing', '\ud83d\udcbf': 'iAmulet', '\ud83d\udc62': 'iBoots',
    '\ud83e\uddea': 'iPotion'
};


function initAudio() {
    if (!SETTINGS.sound) return;
    if (!audioCtx) {
        audioCtx = new AudioCtx();
        // Master output chain
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 1.0;
        masterGain.connect(audioCtx.destination);

        // Dry path
        dryGain = audioCtx.createGain();
        dryGain.gain.value = 0.75;
        dryGain.connect(masterGain);

        // Reverb (dungeon echo)
        reverbNode = audioCtx.createConvolver();
        const rate = audioCtx.sampleRate;
        const len = rate * 2.2; // 2.2s reverb tail - cathedral feel
        const impulse = audioCtx.createBuffer(2, len, rate);
        for (let ch = 0; ch < 2; ch++) {
            const d = impulse.getChannelData(ch);
            for (let i = 0; i < len; i++) {
                // Exponential decay with some early reflections
                const t = i / rate;
                const decay = Math.pow(1 - i / len, 1.8);
                const earlyRef = t < 0.05 ? 0.8 : (t < 0.12 ? 0.4 : 1);
                d[i] = (Math.random() * 2 - 1) * decay * earlyRef;
            }
        }
        reverbNode.buffer = impulse;
        reverbSend = audioCtx.createGain();
        reverbSend.gain.value = 0.35; // Reverb wet amount
        reverbNode.connect(reverbSend);
        reverbSend.connect(masterGain);

        // Start background music
        startBGM();
    }
}

// Route audio node to both dry + reverb
function routeToOutput(node) {
    if (dryGain) { node.connect(dryGain); node.connect(reverbNode); }
    else node.connect(audioCtx.destination);
}

// ACT-specific BGM themes (Web Audio synthesized)
const ACT_BGM_THEMES = {
    1: { sub: 36.7, pad: 73.4, tension: 108, filterFreq: 200, lfoSpeed: 0.08, vol: 0.025, padType: 'triangle' }, // Cathedral: dark, low
    2: { sub: 41.2, pad: 82.4, tension: 123, filterFreq: 300, lfoSpeed: 0.06, vol: 0.022, padType: 'sine' },      // Desert: open, warm
    3: { sub: 32.7, pad: 65.4, tension: 98, filterFreq: 250, lfoSpeed: 0.1, vol: 0.028, padType: 'triangle' },    // Jungle: dense, low
    4: { sub: 27.5, pad: 55.0, tension: 82, filterFreq: 180, lfoSpeed: 0.12, vol: 0.03, padType: 'sawtooth' },    // Hell: heavy, dissonant
    5: { sub: 49.0, pad: 98.0, tension: 147, filterFreq: 350, lfoSpeed: 0.05, vol: 0.02, padType: 'sine' },       // Ice: high, ethereal
    town: { sub: 55.0, pad: 110, tension: 165, filterFreq: 400, lfoSpeed: 0.04, vol: 0.015, padType: 'sine' }     // Town: calm, warm
};
let currentBGMAct = null;

function startBGM(act) {
    const targetAct = act || G.act || 1;
    const themeKey = G.inTown ? 'town' : targetAct;
    if (bgmNodes && currentBGMAct === themeKey) return;
    stopBGM();
    if (!audioCtx || audioCtx.state === 'suspended') return;
    const theme = ACT_BGM_THEMES[themeKey] || ACT_BGM_THEMES[1];
    currentBGMAct = themeKey;
    const t = audioCtx.currentTime;
    const bgmGain = audioCtx.createGain();
    bgmGain.gain.value = theme.vol;

    // Sub bass drone
    const sub = audioCtx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = theme.sub;
    sub.connect(bgmGain);
    sub.start(t);

    // Dark pad
    const pad1 = audioCtx.createOscillator();
    pad1.type = theme.padType;
    pad1.frequency.value = theme.pad;
    const padFilter = audioCtx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = theme.filterFreq;
    pad1.connect(padFilter);
    padFilter.connect(bgmGain);
    pad1.start(t);

    // Dissonant tension note
    const pad2 = audioCtx.createOscillator();
    pad2.type = 'sine';
    pad2.frequency.value = theme.tension;
    const pad2G = audioCtx.createGain();
    pad2G.gain.value = 0.4;
    pad2.connect(pad2G);
    pad2G.connect(bgmGain);
    pad2.start(t);

    // Slow LFO for pulsing
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = theme.lfoSpeed;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain);
    lfoGain.connect(bgmGain.gain);
    lfo.start(t);

    routeToOutput(bgmGain);
    bgmNodes = { sub, pad1, pad2, lfo, bgmGain };
}
function stopBGM() {
    if (!bgmNodes) return;
    for (const node of Object.values(bgmNodes)) {
        try { node.stop?.(); } catch (e) { /* ignore */ }
        try { node.disconnect?.(); } catch (e) { /* ignore */ }
    }
    bgmNodes = null;
    currentBGMAct = null;
}

function setSoundEnabled(enabled) {
    SETTINGS.sound = enabled;
    saveSettings();
    if (enabled) {
        initAudio();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        if (audioCtx && !bgmNodes) startBGM();
    } else {
        stopBGM();
        if (audioCtx && audioCtx.state !== 'closed') audioCtx.suspend();
    }
}

function playSound(freq, type, duration, volume = 0.15) {
    if (!audioCtx || !SETTINGS.sound) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    routeToOutput(gain);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Noise burst for impact/explosion sounds
function playNoise(duration, volume = 0.1, filterFreq = 2000) {
    if (!audioCtx || !SETTINGS.sound) return;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + duration);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    routeToOutput(gain);
    src.start();
    src.stop(audioCtx.currentTime + duration);
}

// Sweep sound (for magic effects)
function playSweep(startFreq, endFreq, duration, type = 'sine', volume = 0.1) {
    if (!audioCtx || !SETTINGS.sound) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    routeToOutput(gain);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Melee hit - heavy metal clang + bone crunch + body impact
function sfxHit() {
    // Metal clang
    playNoise(0.06, 0.12, 4000);
    playSound(220, 'sawtooth', 0.06, 0.12);
    // Body thud
    playSound(80, 'square', 0.08, 0.09);
    // Secondary impact
    setTimeout(() => { playNoise(0.04, 0.06, 1200); playSound(55, 'sine', 0.1, 0.05); }, 25);
    // Bone crack
    setTimeout(() => playNoise(0.02, 0.04, 6000), 40);
}

// Item pickup - metallic clink with echo
function sfxPickup() {
    playSound(1200, 'sine', 0.04, 0.06);
    setTimeout(() => playSound(1500, 'sine', 0.06, 0.05), 40);
    setTimeout(() => playSound(1800, 'sine', 0.08, 0.04), 80);
    setTimeout(() => playSound(1200, 'triangle', 0.12, 0.02), 120);
}

// Fireball - deep whoosh + magical crackle
function sfxFireball() {
    playSweep(500, 120, 0.35, 'sawtooth', 0.09);
    playNoise(0.2, 0.07, 1800);
    playSound(150, 'triangle', 0.15, 0.04);
    setTimeout(() => { playNoise(0.12, 0.05, 3000); playSweep(300, 80, 0.2, 'triangle', 0.03); }, 50);
}

// Whirlwind - rushing gale
function sfxWhirlwind() {
    playNoise(0.5, 0.09, 1500);
    playSweep(180, 450, 0.25, 'triangle', 0.07);
    playSweep(350, 120, 0.35, 'triangle', 0.05);
    playSound(100, 'sawtooth', 0.3, 0.03);
    setTimeout(() => playNoise(0.3, 0.04, 800), 100);
}

// Heal - ethereal chime with holy resonance
function sfxHeal() {
    playSound(523, 'sine', 0.2, 0.07);
    playSound(523 * 1.5, 'sine', 0.2, 0.03);
    setTimeout(() => { playSound(659, 'sine', 0.2, 0.06); playSound(659 * 1.5, 'sine', 0.15, 0.02); }, 100);
    setTimeout(() => { playSound(784, 'sine', 0.25, 0.06); playSound(1047, 'sine', 0.3, 0.04); }, 200);
    setTimeout(() => playSound(1320, 'sine', 0.4, 0.03), 300);
}

// Level up - triumphant cathedral fanfare
function sfxLevelUp() {
    playSound(294, 'square', 0.15, 0.08);
    playSound(294, 'sine', 0.3, 0.05);
    setTimeout(() => { playSound(370, 'square', 0.15, 0.08); playSound(370, 'sine', 0.2, 0.04); }, 120);
    setTimeout(() => { playSound(440, 'square', 0.15, 0.1); playSound(440, 'sine', 0.2, 0.05); }, 240);
    setTimeout(() => {
        playSound(587, 'sine', 0.5, 0.12); playSound(294, 'sine', 0.5, 0.06);
        playSound(440, 'sine', 0.5, 0.04); playNoise(0.15, 0.03, 5000);
    }, 360);
}

// Death - deep dread + collapse
function sfxDeath() {
    playSweep(250, 35, 0.8, 'sawtooth', 0.14);
    playNoise(0.4, 0.1, 600);
    playSound(30, 'square', 0.6, 0.12);
    setTimeout(() => { playSound(25, 'sawtooth', 0.5, 0.08); playNoise(0.5, 0.06, 300); }, 100);
    setTimeout(() => playNoise(0.3, 0.04, 200), 300);
}

// Stairs - ominous descending echo
function sfxStairs() {
    playSound(440, 'sine', 0.15, 0.07);
    setTimeout(() => playSound(392, 'sine', 0.15, 0.07), 120);
    setTimeout(() => playSound(330, 'sine', 0.15, 0.07), 240);
    setTimeout(() => { playSound(294, 'sine', 0.3, 0.06); playSound(147, 'sine', 0.4, 0.04); }, 360);
    setTimeout(() => playNoise(0.2, 0.03, 400), 450);
}

// Legendary drop - heavenly choir
function sfxLegendary() {
    playSound(440, 'sine', 0.15, 0.1);
    playSound(554, 'sine', 0.15, 0.05);
    setTimeout(() => { playSound(554, 'sine', 0.15, 0.1); playSound(659, 'sine', 0.15, 0.05); }, 80);
    setTimeout(() => { playSound(659, 'sine', 0.2, 0.1); playSound(831, 'sine', 0.2, 0.05); }, 160);
    setTimeout(() => {
        playSound(880, 'sine', 0.6, 0.14); playSound(1100, 'sine', 0.5, 0.06);
        playSound(440, 'sine', 0.6, 0.06); playNoise(0.15, 0.04, 6000);
    }, 260);
    setTimeout(() => playSound(1320, 'sine', 0.4, 0.05), 400);
}

// Frost Nova - glass shattering + icy wind
function sfxFrostNova() {
    playNoise(0.25, 0.1, 5000);
    playSweep(3000, 400, 0.15, 'sine', 0.07);
    playSound(2000, 'square', 0.03, 0.06); // Sharp crack
    setTimeout(() => { playNoise(0.2, 0.06, 7000); playSweep(2000, 200, 0.25, 'sine', 0.04); }, 40);
    setTimeout(() => playNoise(0.15, 0.03, 3000), 100);
}

// Shield activate - deep energy hum with resonance
function sfxShield() {
    playSweep(150, 600, 0.25, 'sine', 0.09);
    playSound(300, 'triangle', 0.4, 0.06);
    playSound(600, 'sine', 0.3, 0.04);
    setTimeout(() => { playSound(450, 'sine', 0.25, 0.04); playSweep(600, 800, 0.15, 'triangle', 0.03); }, 100);
}

// Meteor - ominous descent
function sfxMeteorCast() {
    playSweep(120, 50, 0.6, 'sawtooth', 0.07);
    playNoise(0.5, 0.05, 500);
    playSweep(80, 40, 0.7, 'square', 0.03);
    setTimeout(() => playSweep(200, 60, 0.4, 'triangle', 0.03), 200);
}

// Meteor impact - massive explosion
function sfxMeteorImpact() {
    playNoise(0.5, 0.18, 2500);
    playSound(50, 'square', 0.4, 0.15);
    playSound(35, 'sawtooth', 0.6, 0.1);
    playNoise(0.15, 0.1, 5000); // High freq debris
    setTimeout(() => { playNoise(0.4, 0.1, 1000); playSound(70, 'triangle', 0.3, 0.06); }, 50);
    setTimeout(() => { playNoise(0.3, 0.06, 500); playSound(40, 'sine', 0.4, 0.04); }, 150);
    setTimeout(() => playNoise(0.2, 0.03, 300), 300);
}

// Monster death - guttural collapse + bone crunch
function sfxMonsterDeath() {
    playSound(100, 'sawtooth', 0.15, 0.1);
    playNoise(0.12, 0.08, 1500);
    playSound(55, 'square', 0.1, 0.07);
    setTimeout(() => { playNoise(0.08, 0.05, 3000); playSound(40, 'sine', 0.15, 0.04); }, 50);
    setTimeout(() => playNoise(0.06, 0.03, 800), 100);
}

// Footstep - alternating stone taps with variation
let lastFootstepTime = 0;
let footstepAlt = false;
function sfxFootstep() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    if (now - lastFootstepTime < 0.28) return;
    lastFootstepTime = now;
    footstepAlt = !footstepAlt;
    const pitch = footstepAlt ? 90 : 75;
    const vol = 0.015 + Math.random() * 0.01;
    playNoise(0.035, vol, 500 + Math.random() * 300);
    playSound(pitch + Math.random() * 30, 'triangle', 0.03, vol * 0.8);
}

// Chest open - heavy creak + gold jingle
function sfxChestOpen() {
    playSweep(120, 250, 0.2, 'sawtooth', 0.06);
    playNoise(0.12, 0.06, 1000);
    setTimeout(() => { playNoise(0.08, 0.04, 600); playSweep(250, 150, 0.15, 'triangle', 0.04); }, 80);
    setTimeout(() => sfxPickup(), 150);
    setTimeout(() => sfxPickup(), 200);
}

// Monster growl - when monster aggros player
function sfxMonsterGrowl() {
    if (!audioCtx) return;
    playSweep(120, 60, 0.3, 'sawtooth', 0.04);
    playNoise(0.15, 0.02, 600);
}

// Player hit - pain grunt
function sfxPlayerHit() {
    playNoise(0.06, 0.06, 1500);
    playSound(150, 'sawtooth', 0.08, 0.05);
    setTimeout(() => playSound(100, 'square', 0.05, 0.03), 30);
}

// Ambient dungeon - layered environmental sounds
let lastAmbientTime = 0;
let ambientDripTimer = 0;
// ACT-specific ambient sound sets
const ACT_AMBIENT = {
    1: [ // Cathedral: drips, chains, stone, ghosts
        () => { const f=1500+Math.random()*1000; playSound(f,'sine',0.06,0.025); setTimeout(()=>playSound(f*0.7,'sine',0.05,0.015),100+Math.random()*80); },
        () => { for(let i=0;i<3;i++) setTimeout(()=>playNoise(0.02,0.015,4000+Math.random()*2000),i*60); },
        () => { playSweep(60,40,0.3,'sawtooth',0.008); },
        () => { playSweep(200,150,0.6,'sine',0.01); setTimeout(()=>playSweep(170,130,0.4,'sine',0.006),300); }
    ],
    2: [ // Desert: wind, sand, distant rumble
        () => { playNoise(1.0,0.015,600); playSweep(300,100,0.8,'sine',0.004); },
        () => { playNoise(0.3,0.01,1200); },
        () => { playNoise(0.5,0.015,250); playSound(30,'sine',0.4,0.008); },
        () => { playSweep(800,400,0.5,'sine',0.003); }
    ],
    3: [ // Jungle: insects, birds, rain, frogs
        () => { for(let i=0;i<5;i++) setTimeout(()=>playSound(3000+Math.random()*2000,'sine',0.02,0.008),i*40); },
        () => { playSweep(2000,1500,0.3,'sine',0.006); setTimeout(()=>playSweep(1800,1200,0.25,'sine',0.004),200); },
        () => { for(let i=0;i<8;i++) setTimeout(()=>playNoise(0.01,0.004,6000),i*30+Math.random()*20); },
        () => { playSound(150,'square',0.1,0.008); setTimeout(()=>playSound(120,'square',0.08,0.006),200); }
    ],
    4: [ // Hell: fire, screams, explosions, lava
        () => { playNoise(0.8,0.02,200); playSound(25,'sawtooth',0.6,0.01); },
        () => { playSweep(400,100,0.5,'sawtooth',0.012); },
        () => { playNoise(0.2,0.025,150); playSound(40,'sine',0.3,0.015); },
        () => { playSweep(600,200,0.4,'sine',0.008); setTimeout(()=>playSweep(500,150,0.3,'sine',0.005),150); }
    ],
    5: [ // Ice: wind, cracking ice, crystals, howl
        () => { playNoise(1.2,0.012,1000); playSweep(500,300,0.8,'sine',0.003); },
        () => { playSound(2500,'sine',0.03,0.015); setTimeout(()=>playSound(3000,'sine',0.02,0.01),100); },
        () => { for(let i=0;i<3;i++) setTimeout(()=>playSound(4000+Math.random()*1000,'sine',0.01,0.006),i*80); },
        () => { playSweep(300,150,0.8,'sine',0.008); }
    ]
};

function sfxAmbient() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    if (now - lastAmbientTime < 3 + Math.random() * 6) return;
    lastAmbientTime = now;
    const act = G.act || 1;
    const sounds = ACT_AMBIENT[act] || ACT_AMBIENT[1];
    const idx = Math.floor(Math.random() * sounds.length);
    sounds[idx]();
}

