// ========== PARTICLE SYSTEM (Round Soft-Glow) ==========
class Particle {
    constructor(x, y, vx, vy, color, life, size = 3, grav = 150, attribute = null, skillLevel = 1) {
        this.x = x; this.y = y;
        this.startY = y; // For bounce detection
        this.centerX = x; this.centerY = y; // For radial effects
        this.vx = vx; this.vy = vy;
        this.color = color;
        this.life = this.maxLife = life;
        this.size = size;
        this.grav = grav;
        this.attribute = attribute; // NEW: attribute type
        this.skillLevel = skillLevel; // NEW: skill level (1-5)
        this.offset = Math.random() * Math.PI * 2; // For organic motion
        this.rotation = 0;
        this.bounced = false;

        // Apply skill level scaling (enhanced for visibility)
        if (skillLevel && skillLevel > 0) {
            const levelScale = 0.7 + (skillLevel - 1) * 0.3; // 0.7x at L1, 1.9x at L5
            this.size *= (0.8 + (skillLevel - 1) * 0.12); // Size: 0.8x to 1.28x
            this.maxLife *= (1 + (skillLevel - 1) * 0.06); // Life: +6% per level
            this.life = this.maxLife;
        }
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.grav * dt;
        this.life -= dt;

        // Apply attribute-specific motion behavior
        if (this.attribute && ATTRIBUTE_BEHAVIORS[this.attribute]) {
            ATTRIBUTE_BEHAVIORS[this.attribute].motion(this, dt);
        }
    }
    draw(cx, cy) {
        const lifeRatio = clamp(this.life / this.maxLife, 0, 1);
        const sp = worldToScreen(this.x, this.y);
        const sx = sp.x, sy = sp.y;

        // Base size with attribute scaling
        let s = this.size * (0.5 + lifeRatio * 0.5);
        if (this.attribute && ATTRIBUTE_BEHAVIORS[this.attribute]) {
            s *= ATTRIBUTE_BEHAVIORS[this.attribute].sizeScale(lifeRatio);
        }

        // Alpha with attribute boost
        let alpha = lifeRatio * 0.8;
        if (this.attribute && ATTRIBUTE_BEHAVIORS[this.attribute]) {
            alpha *= ATTRIBUTE_BEHAVIORS[this.attribute].alphaBoost;
        }

        // Core particle
        ctx.globalAlpha = clamp(alpha, 0, 1);
        ctx.fillStyle = this.color;

        // Shape rendering - diamond for ice
        if (this.attribute === 'ice' && ATTRIBUTE_BEHAVIORS[this.attribute].shape === 'diamond') {
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(this.rotation);
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(s, 0);
            ctx.lineTo(0, s);
            ctx.lineTo(-s, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.arc(sx, sy, s, 0, Math.PI * 2);
            ctx.fill();
        }

        // Enhanced glow for high-level skills (level 3+)
        if (this.skillLevel && this.skillLevel >= 3) {
            const glowColor = this.attribute && ATTRIBUTE_BEHAVIORS[this.attribute]
                ? ATTRIBUTE_BEHAVIORS[this.attribute].glowColor
                : '#fff';
            ctx.globalAlpha = clamp(alpha * 0.6, 0, 0.6);
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.arc(sx, sy, s * 1.8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hot center
        ctx.globalAlpha = clamp(alpha * 0.4, 0, 0.4);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sx, sy, s * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }
    alive() { return this.life > 0; }
}

const particles = [];
function emitParticles(x, y, color, count, speed = 80, life = 0.5, size = 3, grav = 150, attribute = null, skillLevel = 1) {
    // Diablo Mode: Triple particle count for spectacular effects
    const DIABLO_MODE = !SETTINGS.reducedParticles; // 低負荷モードでない場合に有効
    if (DIABLO_MODE) {
        count = Math.round(count * 3.0); // パーティクル数を3倍に
    }

    // Apply skill level scaling to count (enhanced for visibility)
    if (skillLevel && skillLevel > 0) {
        const levelScale = 0.7 + (skillLevel - 1) * 0.3; // 0.7x at L1, 1.9x at L5
        count = Math.round(count * levelScale);
    }

    if (SETTINGS.reducedParticles) count = Math.max(1, Math.floor(count * 0.55));
    // パーティクル数上限チェック
    const availableSlots = MAX_PARTICLES - particles.length;
    if (availableSlots <= 0) return; // 上限に達したら生成しない
    count = Math.min(count, availableSlots); // 上限を超えないように調整
    for (let i = 0; i < count; i++) {
        const a = randf(0, Math.PI * 2);
        const s = randf(20, speed);
        particles.push(new Particle(
            x + randf(-4,4),
            y + randf(-4,4),
            Math.cos(a)*s,
            Math.sin(a)*s,
            color,
            randf(life*0.5, life),
            randf(size*0.5, size*1.5),
            grav,
            attribute,  // NEW
            skillLevel  // NEW
        ));
    }

    // Trail effect for lightning (skill level 3+)
    if (attribute === 'lightning' && skillLevel >= 3) {
        setTimeout(() => {
            if (particles.length < MAX_PARTICLES - 5) {
                for (let i = 0; i < 3; i++) {
                    particles.push(new Particle(x, y, randf(-20,20), randf(-20,20), color, 0.2, 1, 0, attribute, skillLevel));
                }
            }
        }, 50);
    }
}

// Trail particle system for max-level skills (Level 5)
function emitTrailParticles(x, y, color, attribute, skillLevel) {
    if (skillLevel < 5) return; // Only for max level
    if (particles.length >= MAX_PARTICLES - 10) return; // Reserve slots

    const trailCount = 5;
    for (let i = 0; i < trailCount; i++) {
        setTimeout(() => {
            if (particles.length < MAX_PARTICLES - 3) {
                particles.push(new Particle(
                    x + randf(-8, 8),
                    y + randf(-8, 8),
                    randf(-15, 15),
                    randf(-15, 15),
                    color,
                    0.3,
                    2,
                    50,
                    attribute,
                    skillLevel
                ));
            }
        }, i * 40); // Staggered timing
    }
}

// ========== AMBIENT PARTICLES (Dust motes, embers) ==========
const ambientParticles = [];
class AmbientParticle {
    constructor() { this.reset(); }
    reset() {
        this.x = player.x + randf(-400, 400);
        this.y = player.y + randf(-300, 300);
        this.vx = randf(-5, 5);
        this.vy = randf(-15, -3);
        this.size = randf(0.5, 2);
        this.life = this.maxLife = randf(3, 8);
        const roll = Math.random();
        if (roll < 0.3) {
            this.type = 'ember';
        } else if (roll < 0.45) {
            this.type = 'fog';
        } else if (roll < 0.6) {
            this.type = 'ash';
        } else if (roll < 0.75) {
            this.type = 'sparkle';
        } else if (roll < 0.88) {
            this.type = 'torch_spark';
        } else {
            this.type = 'dust';
        }
        this.drift = randf(0, Math.PI * 2);
        if (this.type === 'ember') {
            const hue = 20 + Math.random() * 20;
            const light = 50 + Math.random() * 30;
            this.color = `hsl(${hue}, 100%, ${light}%)`;
            this.alpha = 0.6;
        } else if (this.type === 'fog') {
            this.color = 'rgba(120,110,100,0.08)';
            this.alpha = 0.08;
            this.size = randf(15, 35);
            this.vx = randf(-3, 3);
            this.vy = randf(-2, 2);
            this.life = this.maxLife = randf(5, 12);
        } else if (this.type === 'ash') {
            this.color = '#88776655';
            this.alpha = 0.2;
            this.size = randf(0.8, 1.8);
            this.vy = randf(3, 10);
            this.vx = randf(-4, 4);
            this.life = this.maxLife = randf(4, 9);
        } else if (this.type === 'sparkle') {
            this.color = '#ffffcc';
            this.alpha = 0.5;
            this.size = randf(0.3, 1.0);
            this.vx = randf(-2, 2);
            this.vy = randf(-2, 2);
            this.life = this.maxLife = randf(0.3, 1.0);
        } else if (this.type === 'torch_spark') {
            const hue = 25 + Math.random() * 15;
            this.color = `hsl(${hue}, 100%, 65%)`;
            this.alpha = 0.7;
            this.size = randf(0.5, 1.5);
            this.vy = randf(-25, -8);
            this.vx = randf(-8, 8);
            this.life = this.maxLife = randf(0.5, 1.5);
        } else {
            this.color = '#aa997766';
            this.alpha = 0.25;
        }
    }
    update(dt) {
        this.drift += dt * 0.5;
        this.x += (this.vx + Math.sin(this.drift) * (this.type === 'fog' ? 1 : 3)) * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }
    draw(cx, cy) {
        const sp = worldToScreen(this.x, this.y);
        const sx = sp.x, sy = sp.y;
        if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;
        const a = clamp(this.life / this.maxLife, 0, 1) * (this.life < 1 ? this.life : 1);
        ctx.globalAlpha = a * this.alpha;
        ctx.fillStyle = this.color;
        if (this.type === 'fog') {
            const fogG = ctx.createRadialGradient(sx, sy, 0, sx, sy, this.size);
            fogG.addColorStop(0, 'rgba(100,90,80,0.06)');
            fogG.addColorStop(0.5, 'rgba(80,70,60,0.03)');
            fogG.addColorStop(1, 'rgba(60,50,40,0)');
            ctx.fillStyle = fogG;
            ctx.fillRect(sx - this.size, sy - this.size, this.size * 2, this.size * 2);
        } else if (this.type === 'sparkle') {
            ctx.globalCompositeOperation = 'lighter';
            ctx.beginPath();
            ctx.arc(sx, sy, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        } else if (this.type === 'torch_spark') {
            ctx.globalCompositeOperation = 'lighter';
            ctx.beginPath();
            ctx.arc(sx, sy, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        } else {
            ctx.beginPath();
            ctx.arc(sx, sy, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    alive() { return this.life > 0; }
}
function updateAmbientParticles(dt) {
    const target = SETTINGS.reducedParticles ? 12 : 45;
    while (ambientParticles.length < target) ambientParticles.push(new AmbientParticle());
    while (ambientParticles.length > target) ambientParticles.pop();
    for (let i = ambientParticles.length - 1; i >= 0; i--) {
        ambientParticles[i].update(dt);
        if (!ambientParticles[i].alive()) ambientParticles[i].reset();
    }
}

// ========== GROUND FOG ==========
function drawGroundFog(cx, cy) {
    if (G.inTown) return;
    ctx.save();
    ctx.globalAlpha = 1;
    for (let i = 0; i < 12; i++) {
        const phase = G.time * 0.3 + i * 1.7;
        const fwx = player.x + Math.sin(phase * 0.7 + i * 2.1) * 200;
        const fwy = player.y + Math.cos(phase * 0.5 + i * 1.3) * 150;
        const fsp = worldToScreen(fwx, fwy);
        const fx = fsp.x, fy = fsp.y;
        const fogR = 60 + Math.sin(phase + i) * 20;
        const fogA = 0.06 + Math.sin(phase * 0.8 + i * 0.9) * 0.02;
        const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fogR);
        fg.addColorStop(0, `rgba(80,70,60,${fogA})`);
        fg.addColorStop(0.5, `rgba(60,50,40,${fogA * 0.5})`);
        fg.addColorStop(1, 'rgba(40,30,20,0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(fx, fy, fogR, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// ========== BLOOD POOLS (persist after monster death) ==========
const bloodPools = [];
function addBloodPool(x, y, size) {
    bloodPools.push({ x, y, size: size * 0.5, maxSize: size, alpha: 0.6, growT: 0.5, rot: Math.random() * Math.PI * 2 });
    if (bloodPools.length > 50) bloodPools.shift(); // Limit
}
function updateBloodPools(dt) {
    for (const bp of bloodPools) {
        if (bp.growT > 0) {
            bp.growT -= dt;
            bp.size = bp.maxSize * (1 - bp.growT / 0.5);
        }
    }
}
function drawBloodPools(cx, cy) {
    for (const bp of bloodPools) {
        const sp = worldToScreen(bp.x, bp.y);
        const sx = sp.x, sy = sp.y;
        if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) continue;
        ctx.save();
        ctx.translate(sx, sy + 2);
        ctx.rotate(bp.rot || 0);
        // Radial gradient blood pool (softer edges)
        const bpG = ctx.createRadialGradient(0, 0, 0, 0, 0, bp.size);
        bpG.addColorStop(0, `rgba(48,5,5,${bp.alpha * 0.8})`);
        bpG.addColorStop(0.5, `rgba(40,3,3,${bp.alpha * 0.6})`);
        bpG.addColorStop(0.8, `rgba(30,2,2,${bp.alpha * 0.3})`);
        bpG.addColorStop(1, 'rgba(20,1,1,0)');
        ctx.fillStyle = bpG;
        ctx.beginPath();
        ctx.ellipse(0, 0, bp.size, bp.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ========== FLOATING DAMAGE ==========
const floatingTexts = [];
function addFloatingText(x, y, text, color, big = false, force = false) {
    if (!force && !SETTINGS.showDamageNumbers) return;
    floatingTexts.push({ x, y, text: String(text), color, life: 1.2, maxLife: 1.2, big, vy: -60 });
}

	    // ========== SPELL IMPACT EFFECT SYSTEM ==========
	    const worldEffects = [];
	    const SPELL_ANIM_MAP = {
	        // Prefer Diablo2-like punchy impact GIFs when available.
	        fire: { mode: 'gif', key: 'fx_sign_of_fire', duration: 0.55, drawMult: 3.1 },
	        ice: { key: 'spell_flash_freeze', cols: 8, cellW: 512, cellH: 512, frames: 96, duration: 0.6 },
	        heal: { key: 'spell_flash_heal', cols: 5, cellW: 288, cellH: 320, frames: 60, duration: 0.8 },
	        lightning: { mode: 'gif', key: 'fx_energy_ball', duration: 0.55, drawMult: 3.0 },
	        poison: { mode: 'gif', key: 'fx_rain_ground', duration: 0.6, drawMult: 3.3 },
	        dark: { mode: 'gif', key: 'fx_black_explosion', duration: 0.6, drawMult: 3.2 },
	        cold: { key: 'spell_fireball_blue', cols: 4, cellW: 512, cellH: 384, frames: 40, duration: 0.5 },
	        buff_ice: { key: 'spell_sphere_blue', cols: 6, cellW: 128, cellH: 128, frames: 30, duration: 0.8 },
	        buff_dark: { key: 'spell_sphere_purple', cols: 6, cellW: 128, cellH: 128, frames: 30, duration: 0.8 },
	        buff_lightning: { key: 'spell_sphere_yellow', cols: 6, cellW: 128, cellH: 128, frames: 30, duration: 0.8 },
	        skull_poison: { key: 'spell_skull_smoke_green', cols: 19, cellW: 192, cellH: 512, frames: 19, duration: 0.6 },
    skull_dark: { key: 'spell_skull_smoke_purple', cols: 19, cellW: 192, cellH: 512, frames: 19, duration: 0.6 },
    arrows_poison: { key: 'spell_arrows_green', cols: 4, cellW: 256, cellH: 256, frames: 24, duration: 0.5 },
    arrows_lightning: { key: 'spell_arrows_yellow', cols: 4, cellW: 256, cellH: 256, frames: 24, duration: 0.5 },
};
function spawnWorldEffect(wx, wy, type, scale) {
    if (!type || !SPELL_ANIM_MAP[type]) return;
    worldEffects.push({ x: wx, y: wy, type, scale: scale || 1, start: G.time });
}
	    function drawWorldEffects(camX, camY) {
	        for (let i = worldEffects.length - 1; i >= 0; i--) {
	            const eff = worldEffects[i];
	            const anim = SPELL_ANIM_MAP[eff.type];
	            if (!anim) { worldEffects.splice(i, 1); continue; }
	            const img = OGA[anim.key];
	            if (!img) { worldEffects.splice(i, 1); continue; }
	            const elapsed = G.time - eff.start;
	            if (elapsed >= anim.duration) { worldEffects.splice(i, 1); continue; }
	            const progress = elapsed / anim.duration;
	            const prevAlpha = ctx.globalAlpha;
	            ctx.globalAlpha = (1 - progress * 0.7) * 0.8;
            const esp = worldToScreen(eff.x, eff.y);

	            if (anim.mode === 'gif') {
	                const drawSz = TILE * (anim.drawMult || 3.0) * eff.scale;
	                const dx = esp.x - drawSz / 2;
	                const dy = esp.y - drawSz / 2;
	                // Animated GIFs advance internally; we just keep drawing them each frame.
	                ctx.drawImage(img, dx, dy, drawSz, drawSz);
	            } else {
	                const frame = Math.min(Math.floor(progress * anim.frames), anim.frames - 1);
	                const col = frame % anim.cols;
	                const row = Math.floor(frame / anim.cols);
	                const sx = col * anim.cellW, sy = row * anim.cellH;
	                const drawSz = TILE * 2.5 * eff.scale;
	                const dx = esp.x - drawSz / 2;
	                const dy = esp.y - drawSz / 2;
	                ctx.drawImage(img, sx, sy, anim.cellW, anim.cellH, dx, dy, drawSz, drawSz);
	            }

	            ctx.globalAlpha = prevAlpha;
	        }
	    }

