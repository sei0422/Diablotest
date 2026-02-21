// ========================================
// 黒焔の迷宮 - Diablo Style Hack & Slash
// ========================================
'use strict';

// ========== PROJECTION (Top-Down / Isometric) ==========
// Keep simulation in "world pixels" (top-down), but project for rendering and mouse picking.
// This lets us iterate toward a D2-like look without rewriting physics/collision first.
function isIsoView() { return !!(typeof SETTINGS !== 'undefined' && SETTINGS.isometricView); }
function _getIsoCamWorld() {
    // In iso view we track the camera by center-world position (player follow).
    // Fallback to current `G.camX/G.camY` if older state doesn't have center cached yet.
    const camWX = (G.camWX != null) ? G.camWX : (typeof player !== 'undefined' ? (player.x || 0) : 0);
    const camWY = (G.camWY != null) ? G.camWY : (typeof player !== 'undefined' ? (player.y || 0) : 0);
    return { camWX, camWY };
}
function worldToScreen(wx, wy) {
    if (!isIsoView()) return { x: wx - G.camX, y: wy - G.camY };
    const { camWX, camWY } = _getIsoCamWorld();
    // For TILE=40: diamond width ~40, height ~20.
    const ix = (wx - wy) * 0.5;
    const iy = (wx + wy) * 0.25;
    const camIX = (camWX - camWY) * 0.5;
    const camIY = (camWX + camWY) * 0.25;
    return { x: (ix - camIX) + W / 2, y: (iy - camIY) + H / 2 };
}
function screenToWorld(sx, sy) {
    if (!isIsoView()) return { x: sx + G.camX, y: sy + G.camY };
    const { camWX, camWY } = _getIsoCamWorld();
    const camIX = (camWX - camWY) * 0.5;
    const camIY = (camWX + camWY) * 0.25;
    const ix = (sx - W / 2) + camIX;
    const iy = (sy - H / 2) + camIY;
    // Inverse of:
    // ix = (wx - wy)/2
    // iy = (wx + wy)/4
    const wx = ix + 2 * iy;
    const wy = 2 * iy - ix;
    return { x: wx, y: wy };
}
function depthKey(wx, wy) {
    // Depth sort should be camera-independent.
    return isIsoView() ? (wx + wy) : wy;
}
function groundYOffset() {
    // Existing art assumes a square tile with "ground" at TILE/2.
    // In iso mode, the ground plane is visually flatter, so reduce offsets a bit.
    return isIsoView() ? (TILE / 4) : (TILE / 2);
}
function drawIsoDiamond(tex, cx, cy, w, h, alpha = 1, filter = null, fillFallback = null) {
    ctx.save();
    if (filter) ctx.filter = filter;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h / 2);
    ctx.lineTo(cx + w / 2, cy);
    ctx.lineTo(cx, cy + h / 2);
    ctx.lineTo(cx - w / 2, cy);
    ctx.closePath();
    ctx.clip();
    if (tex) {
        ctx.drawImage(tex, cx - w / 2, cy - h / 2, w, h);
    } else if (fillFallback) {
        ctx.fillStyle = fillFallback;
        ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    }
    ctx.restore();
}
const MAX_PARTICLES = 1500; // Diablo風：パーティクル数の上限を3倍に（500→1500）
const PLAYER_DRAW_SCALE = 1.8;
const MONSTER_DRAW_SCALES = {
    skeleton: 1.5, zombie: 1.6, imp: 1.3, ghost: 1.4, demonlord: 2.0,
    mummy: 1.5, scarab: 1.2, sand_golem: 1.7, treeant: 1.8,
    poison_spider: 1.2, jungle_shaman: 1.4, demon: 1.6, hellhound: 1.4,
    frost_zombie: 1.6, ice_wraith: 1.4, yeti: 1.8
};
let W = window.innerWidth, H = window.innerHeight;

// --- Canvas Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let DPR = Math.min(window.devicePixelRatio || 1, 2);
function resizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = true;
}
resizeCanvas();

const DOM = {
    titleScreen: document.getElementById('titleScreen'),
    titleStartText: document.getElementById('titleStartText'),
    titleSaveMenu: document.getElementById('titleSaveMenu'),
    titleSaveContent: document.getElementById('titleSaveContent'),
    classSelect: document.getElementById('classSelect'),
    statsPanel: document.getElementById('statsPanel'),
    statsContent: document.getElementById('statsContent'),
    inventoryPanel: document.getElementById('inventoryPanel'),
    inventoryContent: document.getElementById('inventoryContent'),
    tooltip: document.getElementById('tooltip'),
    logPanel: document.getElementById('logPanel'),
    levelUpNotice: document.getElementById('levelUpNotice'),
    deathScreen: document.getElementById('deathScreen'),
    helpOverlay: document.getElementById('helpOverlay'),
    skillTreePanel: document.getElementById('skillTreePanel'),
    skillTreeContent: document.getElementById('skillTreeContent'),
    skillEditBtn: document.getElementById('skillEditBtn'),
    promotionOverlay: document.getElementById('promotionOverlay'),
    promotionContent: document.getElementById('promotionContent'),
    skillSelectOverlay: document.getElementById('skillSelectOverlay'),
    skillSelectContent: document.getElementById('skillSelectContent'),
    settingsPanel: document.getElementById('settingsPanel'),
    settingsContent: document.getElementById('settingsContent'),
    pauseOverlay: document.getElementById('pauseOverlay')
};

// --- Game State ---
const G = {
    started: false,
    titlePhase: 'start', // 'start' | 'classSelect'
    selectedClassIdx: 0,
    floor: 1,
    camX: 0, camY: 0,
    shakeT: 0, shakeAmt: 0, dmgFlashT: 0,
    time: 0,
    dead: false,
    paused: false,
    autoPickup: false,
    autoPickupRarity: 'magic',
    dungeonSeed: 0,
    saveSlot: 1,
    spawnTimer: 0, // 敵リスポーンタイマー
    spawnInterval: 8, // 8秒ごとに敵を追加出現
    // ACT/チャプターシステム
    act: 1, actFloor: 1, cycle: 0, inTown: false, difficulty: 'normal', // 'normal' | 'nightmare' | 'hell'
    gold: 0, quests: {}, questKillCounts: {},
    waypoints: [1], stash: [], maxStash: 48,
    shopItems: [], gambleItems: [], bossesDefeated: {},
    activeNPC: null, dialogState: 0, townUIMode: null,
    actTransitionTimer: 0, actTransitionText: '',
    portalCasting: false, portalTimer: 0,
    portalReturn: null, // {act, actFloor, cycle, floor, x, y, dungeon, monsters, groundItems, dungeonSeed}
    inUber: false, uberBossesDefeated: {},
    showOverlayMap: false,
    questItems: [] // Separate storage for quest keys (don't consume inventory space)
};

const SETTINGS = {
    sound: true,
    screenShake: true,
    reducedParticles: false,
    filmGrain: true,
    showFPS: false,
    showDamageNumbers: true,
    // Experimental: pseudo-isometric projection (closer to Diablo 2 feel).
    // Toggle at runtime with the `V` key.
    isometricView: false
};

function loadSettings() {
    try {
        const raw = localStorage.getItem('diablo_settings');
        if (!raw) return;
        const data = JSON.parse(raw);
        for (const k of Object.keys(SETTINGS)) {
            if (typeof data[k] === 'boolean') SETTINGS[k] = data[k];
        }
    } catch (e) { /* ignore */ }
}
function saveSettings() {
    try { localStorage.setItem('diablo_settings', JSON.stringify(SETTINGS)); } catch (e) { /* ignore */ }
}
const SAVE_SLOT_COUNT = 3;
const SAVE_SLOT_KEY = 'diablo_save_slot';
function getSaveKey(slot) { return `diablo_save_${slot}`; }
function initSaveSlot() {
    try {
        const raw = localStorage.getItem(SAVE_SLOT_KEY);
        const slot = parseInt(raw, 10);
        if (slot >= 1 && slot <= SAVE_SLOT_COUNT) G.saveSlot = slot;
    } catch (e) { /* ignore */ }
}
window.setSaveSlot = function(slot) {
    if (slot < 1 || slot > SAVE_SLOT_COUNT) return;
    G.saveSlot = slot;
    try { localStorage.setItem(SAVE_SLOT_KEY, String(slot)); } catch (e) { /* ignore */ }
    renderSettingsUI();
    renderTitleSaveMenu();
};
function getSaveMeta(slot) {
    try {
        const raw = localStorage.getItem(getSaveKey(slot));
        if (!raw) return null;
        const save = JSON.parse(raw);
        if (!save || !save.player) return null;
        return {
            timestamp: save.timestamp || 0,
            level: save.player.level || 1,
            floor: save.floor || 1,
            act: save.act || 0,
            cycle: save.cycle || 0,
            className: save.player.className || save.playerClass || '不明'
        };
    } catch (e) { return null; }
}
function hasSaveData(slot) {
    try { return !!localStorage.getItem(getSaveKey(slot)); } catch (e) { return false; }
}
function hasAnySaveData() {
    for (let i = 1; i <= SAVE_SLOT_COUNT; i++) {
        if (hasSaveData(i)) return true;
    }
    return false;
}
loadSettings();
initSaveSlot();
renderTitleSaveMenu();

// --- Seeded PRNG (mulberry32) for dungeon reproducibility ---
let _seedState = 0;
let _useSeededRng = false;
function mulberry32() {
    let t = (_seedState += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function seedRng(seed) { _seedState = seed | 0; _useSeededRng = true; }
function unseedRng() { _useSeededRng = false; }
function _rng() { return _useSeededRng ? mulberry32() : Math.random(); }

// --- Utility ---
function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
const rand = (a, b) => Math.floor(_rng() * (b - a + 1)) + a;
const randf = (a, b) => _rng() * (b - a) + a;
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
const FONT_UI = '"Spectral", "Garamond", "Georgia", serif';
const FONT_EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';
const FONT_TITLE = '"Cinzel", "IM Fell English", "Garamond", serif';

// --- Log System ---
const logMessages = [];
let logDirty = false;
let lastLogRender = 0;
function addLog(msg, color = '#daa520') {
    logMessages.push({ msg: escapeHtml(msg), color, time: G.time });
    if (logMessages.length > 8) logMessages.shift();
    logDirty = true;
}
function drawLog() {
    if (!logDirty && G.time - lastLogRender < 0.25) return;
    const el = DOM.logPanel;
    el.innerHTML = logMessages.map((l) => {
        const age = G.time - l.time;
        const cls = age > 5 ? 'fade' : '';
        return `<div class="log-msg ${cls}" style="color:${l.color}">${l.msg}</div>`;
    }).join('');
    logDirty = false;
    lastLogRender = G.time;
}

// ========== MAIN GAME LOOP ==========
let lastTime = 0;
let fps = 0;
let fpsAcc = 0;
let fpsFrames = 0;
function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    if (!G.started || G.dead) return;

    fpsAcc += dt;
    fpsFrames++;
    if (fpsAcc >= 0.5) { fps = fpsFrames / fpsAcc; fpsAcc = 0; fpsFrames = 0; }

    let canUpdate = !G.paused;
    // Hitstop: freeze updates briefly, but keep rendering.
    if (canUpdate && (G.hitStopT || 0) > 0) {
        G.hitStopT = Math.max(0, (G.hitStopT || 0) - dt);
        canUpdate = false;
    }
    let aliveMonsterCount = 0;
    for (let i = 0; i < monsters.length; i++) if (monsters[i].alive) aliveMonsterCount++;
    if (canUpdate) {
        G.time += dt;
        sfxAmbient();
        if (G.hintTimer > 0) G.hintTimer -= dt;
        if (G.dmgFlashT > 0) G.dmgFlashT -= dt;
        updateAmbientParticles(dt);
        updateBloodPools(dt);
    }

    // Update
    if (canUpdate) {
        player.update(dt);

        // ACT transition timer
        if (G.actTransitionTimer > 0) G.actTransitionTimer -= dt;

        // Town portal casting timer
        if (G.portalCasting) {
            G.portalTimer -= dt;
            // Cancel if player moves or takes damage
            if (player.moving) {
                G.portalCasting = false;
                G.portalTimer = 0;
                addLog('帰還が中断された！', '#ff4444');
            } else if (G.portalTimer <= 0) {
                G.portalCasting = false;
                G.portalTimer = 0;
                // Save dungeon state for portal return
                G.portalReturn = {
                    act: G.act, actFloor: G.actFloor, cycle: G.cycle,
                    floor: G.floor, x: player.x, y: player.y,
                    dungeon: dungeon, monsters: [...monsters],
                    groundItems: [...groundItems], dungeonSeed: G.dungeonSeed,
                    inUber: G.inUber
                };
                addLog('町へ帰還した！', '#88ff88');
                enterTown(G.act);
                addLog('青いポータルでダンジョンに戻れる', '#8888ff');
            }
        }

        if (!G.inTown) {
            // Mercenary update
            if (mercenary && mercenary.alive) mercenary.update(dt);
            // Mercenary projectiles
            for (let mi = mercProjectiles.length - 1; mi >= 0; mi--) {
                const mp = mercProjectiles[mi];
                mp.update(dt);
                if (mp.life <= 0) { mercProjectiles[mi] = mercProjectiles[mercProjectiles.length - 1]; mercProjectiles.pop(); continue; }
                for (const m of monsters) {
                    if (m.alive && dist(mp.x, mp.y, m.x, m.y) < mp.r + (m.r || 12)) {
                        monsterTakeDmg(m, mp.dmg, false, mp.element);
                        emitParticles(mp.x, mp.y, mp.color, 6, 50, 0.3, 2, 0);
                        mercProjectiles[mi] = mercProjectiles[mercProjectiles.length - 1]; mercProjectiles.pop();
                        break;
                    }
                }
            }
            for (const m of monsters) {
                m.update(dt, player);
                if (m.isBoss && m.alive) updateBossAI(m, dt);
            }

            // Enemy projectile update
            for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
                const ep = enemyProjectiles[i];
                ep.update(dt);
                if (ep.life <= 0) { enemyProjectiles[i] = enemyProjectiles[enemyProjectiles.length - 1]; enemyProjectiles.pop(); continue; }
                // Hit mercenary
                if (mercenary && mercenary.alive && dist(ep.x, ep.y, mercenary.x, mercenary.y) < ep.r + mercenary.radius) {
                    mercenary.takeDmg(ep.dmg);
                    emitParticles(ep.x, ep.y, ep.color, 6, 50, 0.3, 2, 0);
                    enemyProjectiles[i] = enemyProjectiles[enemyProjectiles.length - 1]; enemyProjectiles.pop();
                    continue;
                }
                // Hit player
                if (dist(ep.x, ep.y, player.x, player.y) < ep.r + player.radius) {
                    player.takeDamage(ep.dmg, ep.element || null);
                    emitParticles(ep.x, ep.y, ep.color, 8, 50, 0.3, 2, 0);
                    enemyProjectiles[i] = enemyProjectiles[enemyProjectiles.length - 1]; enemyProjectiles.pop();
                }
            }

            // 敵の継続的な出現（ワラワラ感）- 階段付近では出現しない、ウーバーフロアでは無効
            G.spawnTimer += dt;
            if (G.spawnTimer >= G.spawnInterval && !G.inUber) {
                G.spawnTimer = 0;
                const aliveCount = aliveMonsterCount;
                const maxMonsters = 30 + G.actFloor * 5;
                if (aliveCount < maxMonsters && dungeon && dungeon.rooms.length > 1) {
                    const spawnCount = Math.min(3 + Math.floor(G.actFloor / 2), maxMonsters - aliveCount);
                    const actDef = getCurrentActDef();
                    const types = actDef.monsterTypes;
                    const stairCX = dungeon.stairsX * TILE + TILE/2;
                    const stairCY = dungeon.stairsY * TILE + TILE/2;
                    for (let i = 0; i < spawnCount; i++) {
                        const room = dungeon.rooms[rand(1, dungeon.rooms.length - 1)];
                        const mx = room.x * TILE + rand(TILE, (room.w - 1) * TILE);
                        const my = room.y * TILE + rand(TILE, (room.h - 1) * TILE);
                        if (dist(mx, my, stairCX, stairCY) < 300) continue;
                        const m = new Monster(mx, my, types[rand(0, types.length - 1)], G.floor);
                        const champRoll = Math.random();
                        if (champRoll < 0.02) { m.makeUnique(); }
                        else if (champRoll < 0.10) { m.makeChampion(); }
                        monsters.push(m);
                    }
                }
            }
        }
    }

    // Remove dead monsters after animation
    if (canUpdate && !G.inTown) {
        for (let i = monsters.length - 1; i >= 0; i--) {
            if (!monsters[i].alive && monsters[i].deathT <= 0) { monsters[i] = monsters[monsters.length - 1]; monsters.pop(); }
        }
    }

    // Projectiles
    if (canUpdate) for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update(dt);
        if (p.life <= 0) { projectiles[i] = projectiles[projectiles.length - 1]; projectiles.pop(); continue; }

            // Frozen Orb shard emission
            if (p.frozen_orb) {
                p.shardTimer = (p.shardTimer || 0) + dt;
                if (p.shardTimer >= 0.15) {
                    p.shardTimer = 0;
                    const numShards = p.shardCount || 6;
                    for (let si = 0; si < numShards; si++) {
                        const sa = (Math.PI * 2 / numShards) * si + G.time * 3;
                        const sx = p.x + Math.cos(sa) * 15;
                        const sy = p.y + Math.sin(sa) * 15;
                        const tx = p.x + Math.cos(sa) * 200;
                        const ty = p.y + Math.sin(sa) * 200;
                        const shard = new Projectile(sx, sy, tx, ty, p.shardDmg || 10, '#aaddff', 300, 4, 'ice');
                        shard.life = 0.4;
                        projectiles.push(shard);
                    }
                }
            }

        // Check monster collision
        for (const m of monsters) {
            if (m.alive && dist(p.x, p.y, m.x, m.y) < p.r + m.r) {
                const isCrit = Math.random() * 100 < player.getCritChance();
                const d = isCrit ? p.dmg * player.getCritDamage() / 100 : p.dmg;
                // Map projectile attribute to immunity element
                const projElem = p.attribute === 'ice' ? 'cold' : (p.attribute === 'arcane' ? null : p.attribute || null);
                monsterTakeDmg(m, d, isCrit, projElem);
                emitParticles(p.x, p.y, '#ffaa00', 10, 80, 0.4, 3, 0);
                // Spell impact VFX (element-specific animations)
                if (p.attribute === 'fire') spawnWorldEffect(p.x, p.y, 'fire', 0.8);
                else if (p.attribute === 'ice' || p.attribute === 'cold') spawnWorldEffect(p.x, p.y, 'cold', 0.7);
                else if (p.attribute === 'lightning') spawnWorldEffect(p.x, p.y, 'lightning', 0.8);
                else if (p.attribute === 'poison') spawnWorldEffect(p.x, p.y, 'poison', 0.7);
                else if (p.attribute === 'dark' || p.attribute === 'arcane') spawnWorldEffect(p.x, p.y, 'dark', 0.8);
                projectiles[i] = projectiles[projectiles.length - 1]; projectiles.pop();
                break;
            }
        }
    }

    // Traps
    if (canUpdate && G.traps) {
        for (let i = G.traps.length - 1; i >= 0; i--) {
            const tr = G.traps[i];
            tr.life -= dt;
            if (tr.life <= 0) { G.traps[i] = G.traps[G.traps.length - 1]; G.traps.pop(); continue; }
            if (!tr.triggered) {
                for (const m of monsters) {
                    if (m.alive && dist(tr.x, tr.y, m.x, m.y) < tr.r) {
                        tr.triggered = true;
                        monsterTakeDmg(m, tr.dmg, false, 'fire');
                        emitParticles(tr.x, tr.y, '#ff6600', 20, 100, 0.5, 4, 50);
                        playNoise(0.15, 0.1, 2000);
                        G.shakeT = 0.15; G.shakeAmt = 6; // Diablo風：2倍
                        addLog('トラップ発動！', '#ff6600');
                        G.traps[i] = G.traps[G.traps.length - 1]; G.traps.pop();
                        break;
                    }
                }
            }
        }
    }

    // Particles
    if (canUpdate) for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (!particles[i].alive()) { particles[i] = particles[particles.length - 1]; particles.pop(); }
    }

    // Floating texts
    if (canUpdate) for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].life -= dt;
        if (floatingTexts[i].life <= 0) { floatingTexts[i] = floatingTexts[floatingTexts.length - 1]; floatingTexts.pop(); }
    }

            // Update summoned minions
    if (canUpdate && G.minions) {
        for (let mi = G.minions.length - 1; mi >= 0; mi--) {
            const mn = G.minions[mi];
            mn.life -= dt;
            if (mn.life <= 0 || mn.hp <= 0) {
                emitParticles(mn.x, mn.y, '#88ddff', 10, 50, 0.3, 2, -20);
                G.minions[mi] = G.minions[G.minions.length - 1]; G.minions.pop(); continue;
            }
            let nearM = null, nearD = 200;
            for (const m of monsters) {
                if (!m.alive) continue;
                const d = dist(mn.x, mn.y, m.x, m.y);
                if (d < nearD) { nearD = d; nearM = m; }
            }
            if (nearM) {
                const a = Math.atan2(nearM.y - mn.y, nearM.x - mn.x);
                mn.x += Math.cos(a) * 140 * dt;
                mn.y += Math.sin(a) * 140 * dt;
                mn.attackCD -= dt;
                if (nearD < 50 && mn.attackCD <= 0) {
                    mn.attackCD = 0.8;
                    monsterTakeDmg(nearM, mn.dmg, Math.random() < 0.1);
                    emitParticles(nearM.x, nearM.y, '#88ddff', 5, 30, 0.2, 2, 0);
                }
            } else {
                const pd = dist(mn.x, mn.y, player.x, player.y);
                if (pd > 80) {
                    const a = Math.atan2(player.y - mn.y, player.x - mn.x);
                    mn.x += Math.cos(a) * 120 * dt;
                    mn.y += Math.sin(a) * 120 * dt;
                }
            }
        }
    }

// Auto pickup
    if (canUpdate && G.autoPickup) {
        const rarityOrder = ['normal','common','magic','rare','legendary','unique','runeword'];
        const minRarity = rarityOrder.indexOf(G.autoPickupRarity);
        for (const gi of groundItems) {
            if (dist(player.x, player.y, gi.x, gi.y) < 60) {
                if (isPotion(gi.item) || isCharm(gi.item) || gi.item.typeKey === 'rune') { player.pickupNearby(); break; }
                const itemRarity = rarityOrder.indexOf(gi.item.rarityKey || 'normal');
                if (itemRarity >= minRarity) { player.pickupNearby(); break; }
            }
        }
    } else if (canUpdate) {
        for (const gi of groundItems) {
            if ((isPotion(gi.item) || isCharm(gi.item)) && dist(player.x, player.y, gi.x, gi.y) < 40) {
                player.pickupNearby(); break;
            }
        }
    }

    // Chest check - open chests when walked over (not in town)
    const ptx = Math.floor(player.x / TILE), pty = Math.floor(player.y / TILE);
    if (canUpdate && !G.inTown && dungeon.get(ptx, pty) === 3) {
        dungeon.set(ptx, pty, 1);
        sfxChestOpen();
        const numItems = rand(1, 3);
        for (let ci = 0; ci < numItems; ci++) {
            dropItem(player.x, player.y, generateItem(G.floor));
        }
        if (Math.random() < 0.35) dropItem(player.x, player.y, generatePotion('hp'));
        addLog('宝箱を開けた！', '#ffd700');
        emitParticles(player.x, player.y, '#ffd700', 15, 60, 0.5, 3, -40);
    }

    // Stairs: Eキー手動のみ（自動降下なし）

    // Level up notice
    if (canUpdate && levelUpTimer > 0) {
        levelUpTimer -= dt;
        if (levelUpTimer <= 0) DOM.levelUpNotice.style.display = 'none';
    }

    // Camera
    if (canUpdate) {
        if (isIsoView()) {
            if (G.camWX == null) { G.camWX = player.x; G.camWY = player.y; }
            G.camWX = lerp(G.camWX, player.x, 0.1);
            G.camWY = lerp(G.camWY, player.y, 0.1);
        } else {
            G.camX = lerp(G.camX, player.x - W / 2, 0.1);
            G.camY = lerp(G.camY, player.y - H / 2, 0.1);
        }
    }

    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (G.shakeT > 0) {
        G.shakeT -= dt;
        if (SETTINGS.screenShake) {
            shakeX = randf(-G.shakeAmt, G.shakeAmt);
            shakeY = randf(-G.shakeAmt, G.shakeAmt);
        }
    }

    // ===== RENDER =====
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(shakeX, shakeY);

    dungeon.draw(G.camX, G.camY);

    // Blood pools (under everything else)
    drawBloodPools(G.camX, G.camY);

    // Ground fog (under entities)
    drawGroundFog(G.camX, G.camY);

    // Ambient particles (dust/embers in the air)
    for (const ap of ambientParticles) ap.draw(G.camX, G.camY);

    // Meteor warning circle
    if (player.meteorT > 0 && G.meteorX) {
        const msp = worldToScreen(G.meteorX, G.meteorY);
        const mx = msp.x, my = msp.y;
        const pulse = 0.3 + Math.sin(G.time * 12) * 0.2;
        ctx.strokeStyle = `rgba(255,80,0,${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx, my, 100, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,60,0,${pulse * 0.15})`;
        ctx.beginPath();
        ctx.arc(mx, my, 100, 0, Math.PI * 2);
        ctx.fill();
        // Inner shrinking circle
        const shrink = player.meteorT / 0.8;
        ctx.strokeStyle = `rgba(255,200,0,${pulse})`;
        ctx.beginPath();
        ctx.arc(mx, my, 100 * shrink, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawGroundItems();
    // Draw traps
    if (G.traps) {
        for (const tr of G.traps) {
            const tsp = worldToScreen(tr.x, tr.y);
            const tx = tsp.x, ty = tsp.y;
            const pulse = 0.4 + Math.sin(G.time * 5) * 0.15;
            ctx.strokeStyle = `rgba(255,100,0,${pulse})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(tx, ty, 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = `rgba(255,80,0,${pulse * 0.3})`;
            ctx.beginPath();
            ctx.arc(tx, ty, 6, 0, Math.PI * 2);
            ctx.fill();
            // Spikes
            for (let a = 0; a < 6; a++) {
                const angle = a * Math.PI / 3 + G.time;
                ctx.fillStyle = `rgba(200,100,0,${pulse * 0.5})`;
                ctx.fillRect(tx + Math.cos(angle) * 6 - 1, ty + Math.sin(angle) * 6 - 1, 2, 2);
            }
        }
    }
    for (const p of projectiles) p.draw(G.camX, G.camY);
    for (const ep of enemyProjectiles) ep.draw(G.camX, G.camY);
    if (!G.inTown) {
        drawActorsDepthSorted();
    }
    drawWorldEffects(G.camX, G.camY);
    for (const mp of mercProjectiles) mp.draw(G.camX, G.camY);
    // Draw town NPCs
    if (G.inTown) {
        const npcSprSize = 48; // rendered sprite size (ATLAS fallback)
        const npcHiSize = TILE * PLAYER_DRAW_SCALE * 2.0; // match player hi-res size
        for (const npc of townNPCs) {
            const nsp = worldToScreen(npc.x, npc.y);
            const nx = nsp.x, ny = nsp.y;
            if (nx < -100 || nx > W + 100 || ny < -100 || ny > H + 100) continue;
            let npcDrawn = false;
            const bob = Math.sin(G.time * 1.5 + npc.x * 0.1) * 1.5;
            // 1) Hi-res FLARE sprite (same system as player)
            if (npc.hiresClass && hiresSpritesLoaded) {
                // Deterministic direction from NPC id (variety instead of all facing south)
                const dirHash = npc.id.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
                const npcDir = dirHash % 8;
                // Animation per role: blacksmith hammers, quest/uber channels, others idle
                let npcAnim = 'stance';
                let npcTimeScale = 1.0;
                if (npc.type === 'blacksmith') { npcAnim = 'swing'; npcTimeScale = 0.35; }
                else if (npc.type === 'mercenary') { npcAnim = 'swing'; npcTimeScale = 0.25; }
                else if (npc.type === 'quest' || npc.type === 'uber_portal') { npcAnim = 'cast'; npcTimeScale = 0.3; }
                // Drop shadow
                const shadowRx = TILE * PLAYER_DRAW_SCALE * 0.28;
                const shG = ctx.createRadialGradient(nx, ny + groundYOffset(), 0, nx, ny + groundYOffset(), shadowRx);
                shG.addColorStop(0, 'rgba(0,0,0,0.35)');
                shG.addColorStop(0.6, 'rgba(0,0,0,0.12)');
                shG.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = shG;
                ctx.beginPath();
                ctx.ellipse(nx, ny + groundYOffset(), shadowRx, 5, 0, 0, Math.PI * 2);
                ctx.fill();
                // Draw hi-res animated sprite
                const hiDy = ny + bob + groundYOffset() - npcHiSize * 0.75;
                if (drawHiResSpr(npc.hiresClass, npcAnim, npcDir, G.time * npcTimeScale, nx - npcHiSize/2, hiDy, npcHiSize, npcHiSize)) {
                    npcDrawn = true;
                }
            }
            // 2) Waypoint portal
            if (!npcDrawn && npc.type === 'waypoint') {
                _drawWaypointIcon(ctx, nx, ny - 8, 28);
                npcDrawn = true;
            }
            // 3) ATLAS sprite fallback
            if (!npcDrawn && npc.sprite && ATLAS[npc.sprite]) {
                if (drawSpr(npc.sprite, nx - npcSprSize/2, ny - npcSprSize + 4 + bob, npcSprSize, npcSprSize, false, true)) {
                    npcDrawn = true;
                }
            }
            // 4) Diamond fallback
            if (!npcDrawn) {
                ctx.fillStyle = '#aaaaaa';
                ctx.beginPath();
                ctx.moveTo(nx, ny - 20); ctx.lineTo(nx + 10, ny - 8);
                ctx.lineTo(nx, ny + 4); ctx.lineTo(nx - 10, ny - 8);
                ctx.closePath(); ctx.fill();
            }
            // NPC name label (positioned above sprite)
            const nameY = npcDrawn && npc.hiresClass && hiresSpritesLoaded
                ? ny + bob + TILE/2 - npcHiSize * 0.75 - 4
                : ny - npcSprSize + 2;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.font = `bold 11px ${FONT_UI}`;
            ctx.fillStyle = '#000'; ctx.fillText(npc.name, nx + 1, nameY + 1);
            ctx.fillStyle = '#ffd700'; ctx.fillText(npc.name, nx, nameY);
            // [E] prompt if near
            const pd = dist(player.x, player.y, npc.x, npc.y);
            if (pd < npc.interactRadius) {
                ctx.font = `bold 10px ${FONT_UI}`;
                ctx.fillStyle = '#88ff88';
                ctx.fillText('[E] 話す', nx, ny + 16);
            }
        }
    }
    // Draw town portal (return portal)
    if (G.inTown && G.portalReturn) {
        const pr = G.portalReturn;
        // Portal position: near player spawn (plaza center offset)
        const r0 = dungeon.rooms[0];
        const portalWX = r0.cx * TILE + TILE/2 + 60;
        const portalWY = r0.cy * TILE + TILE/2;
        G._portalScreenX = portalWX; G._portalScreenY = portalWY; // for interaction check
        const psp = worldToScreen(portalWX, portalWY);
        const ppx = psp.x, ppy = psp.y;
        if (ppx > -80 && ppx < W + 80 && ppy > -80 && ppy < H + 80) {
            // Swirling blue oval portal
            ctx.save();
            const pulse = 0.6 + Math.sin(G.time * 2) * 0.15;
            // Outer glow
            ctx.globalAlpha = 0.3 * pulse;
            ctx.fillStyle = '#4488ff';
            ctx.beginPath();
            ctx.ellipse(ppx, ppy - 16, 28, 36, 0, 0, Math.PI * 2);
            ctx.fill();
            // Inner bright core
            ctx.globalAlpha = 0.7 * pulse;
            ctx.fillStyle = '#88bbff';
            ctx.beginPath();
            ctx.ellipse(ppx, ppy - 16, 18, 28, 0, 0, Math.PI * 2);
            ctx.fill();
            // Center white glow
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = '#ccddff';
            ctx.beginPath();
            ctx.ellipse(ppx, ppy - 16, 8, 14, 0, 0, Math.PI * 2);
            ctx.fill();
            // Orbiting particles
            for (let i = 0; i < 8; i++) {
                const a = G.time * 2.5 + i * Math.PI / 4;
                const ox = Math.cos(a) * 22;
                const oy = Math.sin(a) * 32;
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = '#aaccff';
                ctx.beginPath();
                ctx.arc(ppx + ox, ppy - 16 + oy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            // Label
            ctx.font = `bold 10px ${FONT_UI}`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#88bbff';
            ctx.fillText(`ACT${pr.act} 第${pr.actFloor}層`, ppx, ppy + 24);
            // [E] prompt if near
            const portalD = dist(player.x, player.y, portalWX, portalWY);
            if (portalD < 60) {
                ctx.font = `bold 10px ${FONT_UI}`;
                ctx.fillStyle = '#88ff88';
                ctx.fillText('[E] 戻る', ppx, ppy + 36);
            }
        }
    }

    // Town: keep original ordering for NPC/town visuals.
    if (G.inTown) {
        // Draw mercenary
        if (mercenary && mercenary.alive) mercenary.draw(G.camX, G.camY);
        // Draw summoned minions
        if (G.minions) {
            for (const mn of G.minions) {
                const msp = worldToScreen(mn.x, mn.y);
                const mx = msp.x, my = msp.y;
                const pulse = 0.5 + Math.sin(G.time * 4) * 0.2;
                ctx.globalAlpha = 0.7 + pulse * 0.3;
                ctx.fillStyle = '#88ccff';
                ctx.beginPath(); ctx.arc(mx, my - 4, 10, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = pulse * 0.3;
                ctx.fillStyle = '#aaddff';
                ctx.beginPath(); ctx.arc(mx, my - 4, 16, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
                const hpPct = mn.hp / mn.maxHP;
                ctx.fillStyle = '#333'; ctx.fillRect(mx - 12, my - 18, 24, 3);
                ctx.fillStyle = hpPct > 0.5 ? '#00cc00' : '#cc6600';
                ctx.fillRect(mx - 12, my - 18, 24 * hpPct, 3);
            }
        }
        player.draw(G.camX, G.camY);
    }
    for (const p of particles) p.draw(G.camX, G.camY);
    drawFloatingTexts();
    drawLighting();

    // Film grain overlay (frame-skipped: update every 3 frames, cache full-screen)
    if (SETTINGS.filmGrain && TILE_TEXTURES['grain']) {
        if (!G._grainFrame) G._grainFrame = 0;
        G._grainFrame++;
        if (!G._grainFullCache || G._grainFullCache.width !== W || G._grainFullCache.height !== H || G._grainFrame % 3 === 0) {
            if (!G._grainFullCache || G._grainFullCache.width !== W || G._grainFullCache.height !== H) {
                G._grainFullCache = document.createElement('canvas');
                G._grainFullCache.width = W; G._grainFullCache.height = H;
            }
            const gfCtx = G._grainFullCache.getContext('2d');
            gfCtx.clearRect(0, 0, W, H);
            const gx = (Math.random() * 256) | 0;
            const gy = (Math.random() * 256) | 0;
            const gc = TILE_TEXTURES['grain'];
            for (let py = -gy; py < H; py += 256) {
                for (let px = -gx; px < W; px += 256) {
                    gfCtx.drawImage(gc, px, py);
                }
            }
        }
        ctx.globalAlpha = 0.15;
        ctx.globalCompositeOperation = 'overlay';
        ctx.drawImage(G._grainFullCache, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }

    ctx.restore();

    // Screen flash effect for Level 5 skills
    if (G.flashT && G.flashT > 0) {
        ctx.globalAlpha = Math.min((G.flashAlpha || 0.3) * (G.flashT / 0.15), 1);
        ctx.fillStyle = G.flashColor || '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        if (canUpdate) G.flashT = Math.max(0, G.flashT - dt);
    }

    drawHUD();
    drawShortcutHints();
    drawOverlayMap();
    drawLog();

    // Town portal casting overlay
    if (G.portalCasting && G.portalTimer > 0) {
        const prog = 1 - G.portalTimer / 2.0;
        // Swirling blue portal effect around player
        const psp = worldToScreen(player.x, player.y);
        const px = psp.x, py = psp.y;
        ctx.save();
        for (let i = 0; i < 12; i++) {
            const angle = G.time * 3 + (i * Math.PI * 2 / 12);
            const r = 30 + prog * 20;
            const ox = Math.cos(angle) * r;
            const oy = Math.sin(angle) * r * 0.6;
            ctx.globalAlpha = 0.5 + prog * 0.4;
            ctx.fillStyle = i % 2 === 0 ? '#4488ff' : '#88bbff';
            ctx.beginPath();
            ctx.arc(px + ox, py + oy - 10, 3 + prog * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        // Progress bar
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(W/2 - 80, H/2 + 60, 160, 14);
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(W/2 - 78, H/2 + 62, 156 * prog, 10);
        ctx.font = `bold 14px ${FONT_UI}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaccff';
        ctx.fillText('帰還中...', W/2, H/2 + 55);
    }

    // ACT transition overlay
    if (G.actTransitionTimer > 0) {
        const alpha = G.actTransitionTimer > 2.5 ? (3 - G.actTransitionTimer) * 2 :
                      G.actTransitionTimer < 0.5 ? G.actTransitionTimer * 2 : 1;
        ctx.fillStyle = `rgba(0,0,0,${alpha * 0.85})`;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = alpha;
        ctx.font = `bold 36px ${FONT_TITLE}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(G.actTransitionText || '', W/2, H/2 - 20);
        ctx.font = `18px ${FONT_UI}`;
        ctx.fillStyle = '#aaa';
        ctx.fillText(G.actTransitionText2 || '', W/2, H/2 + 20);
        ctx.globalAlpha = 1;
    }

    // Update UI panels if open (throttled to ~5 Hz to avoid DOM churn)
    if (!G._panelThrottle) G._panelThrottle = 0;
    G._panelThrottle -= dt;
    if (G._panelThrottle <= 0) {
        G._panelThrottle = 0.2;
        if (isPanelVisible(DOM.statsPanel)) updateStatsPanel();
        if (isPanelVisible(DOM.inventoryPanel)) updateInventoryPanel();
    }
}

// Handle resize
window.addEventListener('resize', () => {
    resizeCanvas();
    if (skillTreeViewMode === 'tree' && DOM.skillTreePanel.style.display !== 'none') {
        requestAnimationFrame(() => drawSkillTreeConnections());
    }
});

// Capture R key even when focus is on UI elements
// 重複リスナーを削除 - メインハンドラ（Line 5227）が正しく処理する

document.addEventListener('visibilitychange', () => {
    if (document.hidden && G.started && !G.dead) setPaused(true);
});

// Tooltip on hover (ground items + skill bar)
canvas.addEventListener('mousemove', e => {
    if (!G.started || G.paused || isPanelVisible(DOM.settingsPanel) || skillSelectOpen) { DOM.tooltip.style.display = 'none'; return; }
    const mp = getCanvasMousePos(e);
    const mx = mp.x, my = mp.y;
    const wp = screenToWorld(mx, my);
    const wx = wp.x, wy = wp.y;
    const tt = DOM.tooltip;
    let found = false;

    // Check skill bar hover
    const numSk = 6;
    const skW = 48, skGap = 5;
    const skTotalW = numSk * skW + (numSk - 1) * skGap;
    const skStartX = W / 2 - skTotalW / 2;
    const skY = H - 62;
    for (let i = 1; i <= numSk; i++) {
        const sx = skStartX + (i - 1) * (skW + skGap);
        if (mx >= sx && mx <= sx + skW && my >= skY && my <= skY + 48) {
            const sk = player.skills[i];
            if (!sk) {
                tt.innerHTML = `<div class="tt-name" style="color:#888">空スロット</div><div class="tt-type">キー: ${i}</div>`;
            } else {
                const allAvail = getAllAvailableSkills();
                const skDef = allAvail.find(s => s.id === sk.id) || sk;
                tt.innerHTML = buildSkillTooltipHTML({ ...skDef, mp: sk.mp, maxCD: sk.maxCD }, i);
            }
            tt.style.display = 'block';
            tt.style.left = (e.clientX + 10) + 'px';
            tt.style.top = (skY - 90) + 'px';
            found = true;
            break;
        }
    }

    // Check ground items
    if (!found) {
    for (const gi of groundItems) {
        if (dist(wx, wy, gi.x, gi.y) < 25) {
            tt.innerHTML = buildTooltipHTML(gi.item, true);
            tt.style.display = 'block';
            tt.style.left = (e.clientX + 15) + 'px';
            tt.style.top = (e.clientY - 10) + 'px';
            found = true;
            break;
        }
    }
    if (!found && !e.target.closest('.ui-panel')) {
        tt.style.display = 'none';
    }
    } // close if(!found) for ground items
});

// ========== TEST RUNNER ==========
function runTests() {
    const results = [];
    const assert = (name, cond) => results.push({ name, ok: !!cond });
    assert('clamp lower', clamp(-1, 0, 1) === 0);
    assert('clamp upper', clamp(2, 0, 1) === 1);
    assert('lerp midpoint', lerp(0, 10, 0.5) === 5);
    assert('pickRarity common', pickRarity(0.0) === 'common');
    assert('pickRarity magic boundary', pickRarity(0.5) === 'magic');
    assert('pickRarity rare boundary', pickRarity(0.78) === 'rare');
    assert('pickRarity legendary boundary', pickRarity(0.93) === 'legendary');
    assert('pickRarity unique boundary', pickRarity(0.99) === 'unique');
    assert('affix count common', getAffixCount(RARITY.common) === 0);

    const wrap = document.createElement('div');
    wrap.style.position = 'fixed';
    wrap.style.inset = '0';
    wrap.style.background = 'rgba(0,0,0,0.92)';
    wrap.style.color = '#e8d7b8';
    wrap.style.fontFamily = FONT_UI;
    wrap.style.padding = '24px';
    wrap.style.zIndex = '3000';
    wrap.innerHTML = `<div style="font-family:${FONT_TITLE};font-size:24px;margin-bottom:10px;letter-spacing:2px">TEST RESULTS</div>`;
    const list = document.createElement('div');
    for (const r of results) {
        const row = document.createElement('div');
        row.style.padding = '6px 0';
        row.textContent = `${r.ok ? 'PASS' : 'FAIL'} - ${r.name}`;
        row.style.color = r.ok ? '#40d97b' : '#d24b4b';
        list.appendChild(row);
    }
    wrap.appendChild(list);
    document.body.appendChild(wrap);
    return results.every(r => r.ok);
}

// Start the loop
const TEST_MODE = new URLSearchParams(window.location.search).has('test');
if (TEST_MODE) {
    runTests();
} else {
    requestAnimationFrame(gameLoop);
}
