// ========== MONSTERS ==========
// ========== MONSTER IMMUNITY SYSTEM ==========
// Immunities: 100% = immune (0 damage), 50-99% = resistant, <50% = normal
// Nightmare: some monsters gain resistances. Hell: some gain full immunity.
const MONSTER_IMMUNITIES = {
    // ACT1: undead = cold resistant, physical normal
    skeleton:      { hell: { cold: 100 }, nightmare: { cold: 50 } },
    zombie:        { hell: { cold: 100, poison: 75 }, nightmare: { cold: 50 } },
    // ACT2: desert = fire resistant
    mummy:         { hell: { fire: 100 }, nightmare: { fire: 50 } },
    scarab:        { hell: { poison: 100 }, nightmare: { poison: 50 } },
    sand_golem:    { hell: { fire: 100, lightning: 75 }, nightmare: { fire: 50 } },
    // ACT3: jungle = poison resistant
    treeant:       { hell: { fire: 100 }, nightmare: { fire: 50 } },
    poison_spider: { hell: { poison: 100 }, nightmare: { poison: 50 } },
    jungle_shaman: { hell: { lightning: 100 }, nightmare: { lightning: 50 } },
    // ACT4: hell = fire resistant
    demon:         { hell: { fire: 100 }, nightmare: { fire: 50 } },
    hellhound:     { hell: { fire: 100, cold: 75 }, nightmare: { fire: 50 } },
    imp:           { hell: { fire: 100 }, nightmare: { fire: 50 } },
    // ACT5: ice = cold resistant
    frost_zombie:  { hell: { cold: 100 }, nightmare: { cold: 50 } },
    ice_wraith:    { hell: { cold: 100, lightning: 75 }, nightmare: { cold: 50 } },
    yeti:          { hell: { cold: 100 }, nightmare: { cold: 50 } }
};
const IMMUNITY_ICONS = { fire: '🔥', cold: '❄', lightning: '⚡', poison: '☠' };
const IMMUNITY_COLORS = { fire: '#ff4400', cold: '#44aaff', lightning: '#ffdd00', poison: '#44cc00' };

function getMonsterImmunities(monsterType) {
    const diff = G.difficulty || 'normal';
    if (diff === 'normal') return {};
    const entry = MONSTER_IMMUNITIES[monsterType];
    if (!entry) return {};
    return entry[diff] || {};
}

const MONSTER_DEFS = {
    skeleton: { name: 'スケルトン', r: 12, hp: 40, dmg: 8, spd: 60, xp: 25, color: '#9a8a6a', loot: 0.4, icon: '💀', defense: 10 },
    zombie:   { name: 'ゾンビ', r: 14, hp: 70, dmg: 12, spd: 40, xp: 35, color: '#3a4a25', loot: 0.45, icon: '🧟', defense: 10 },
    imp:      { name: 'インプ', r: 10, hp: 30, dmg: 15, spd: 100, xp: 45, color: '#8a2a2a', loot: 0.5, icon: '👹', defense: 10, ranged: true, projSpd: 200, projColor: '#ff4422', preferredRange: 150, projCd: 1.8, element: 'fire' },
    ghost:    { name: 'ゴースト', r: 11, hp: 25, dmg: 10, spd: 110, xp: 55, color: '#555588', loot: 0.55, icon: '👻', defense: 10 },
    demonlord:{ name: 'デーモンロード', r: 22, hp: 300, dmg: 30, spd: 70, xp: 300, color: '#8a1515', loot: 1.0, icon: '👿', defense: 10 },
    // ACT2 monsters
    mummy:      { name: 'マミー', r: 14, hp: 80, dmg: 14, spd: 45, xp: 40, color: '#a89060', loot: 0.45, icon: '🧟', defense: 25 },
    scarab:     { name: 'スカラベ', r: 9, hp: 35, dmg: 18, spd: 120, xp: 50, color: '#44662a', loot: 0.4, icon: '🪲', defense: 25 },
    sand_golem: { name: 'サンドゴーレム', r: 18, hp: 120, dmg: 20, spd: 50, xp: 60, color: '#b8a060', loot: 0.5, icon: '🗿', defense: 25 },
    // ACT3 monsters
    treeant:        { name: 'トレアント', r: 18, hp: 100, dmg: 16, spd: 40, xp: 55, color: '#2a5a1a', loot: 0.5, icon: '🌳', defense: 50 },
    poison_spider:  { name: '毒蜘蛛', r: 8, hp: 28, dmg: 20, spd: 130, xp: 55, color: '#44aa22', loot: 0.45, icon: '🕷', defense: 50, ranged: true, projSpd: 180, projColor: '#44cc22', preferredRange: 120, projCd: 1.5, element: 'poison' },
    jungle_shaman:  { name: 'ジャングルシャーマン', r: 12, hp: 50, dmg: 22, spd: 70, xp: 65, color: '#558844', loot: 0.55, icon: '🧙', defense: 50, ranged: true, projSpd: 160, projColor: '#88ff44', preferredRange: 180, projCd: 2.0, element: 'poison' },
    // ACT4 monsters
    demon:     { name: 'デーモン', r: 16, hp: 130, dmg: 25, spd: 80, xp: 150, color: '#aa2020', loot: 0.55, icon: '👹', defense: 80 },
    hellhound: { name: 'ヘルハウンド', r: 12, hp: 70, dmg: 22, spd: 140, xp: 130, color: '#cc4400', loot: 0.50, icon: '🐕', defense: 80 },
    // ACT5 monsters
    frost_zombie: { name: 'フロストゾンビ', r: 14, hp: 140, dmg: 28, spd: 50, xp: 100, color: '#5588aa', loot: 0.45, icon: '🧟', defense: 120 },
    ice_wraith:   { name: 'アイスレイス', r: 11, hp: 65, dmg: 24, spd: 110, xp: 110, color: '#88bbdd', loot: 0.5, icon: '👻', defense: 120, ranged: true, projSpd: 220, projColor: '#88ddff', preferredRange: 160, projCd: 1.6, element: 'cold' },
    yeti:         { name: 'イエティ', r: 20, hp: 220, dmg: 35, spd: 60, xp: 140, color: '#aaccdd', loot: 0.55, icon: '🦍', defense: 120 }
};

// Champion/Unique monster affix system (D2-style)
const CHAMPION_AFFIXES = {
    extra_strong: { name: '剛力', color: '#ff6644', dmgMult: 1.5, hpMult: 1.0 },
    extra_fast:   { name: '俊足', color: '#44ddff', spdMult: 1.5, hpMult: 1.0 },
    fire_enchanted:{ name: '火炎', color: '#ff4400', hpMult: 1.2, element: 'fire', auraDmg: 3, auraColor: '#ff4400' },
    cold_enchanted:{ name: '冷気', color: '#88ddff', hpMult: 1.2, element: 'cold', auraDmg: 2, auraColor: '#88ddff', slowOnHit: 0.4 },
    lightning_enchanted:{ name: '雷光', color: '#ffff44', hpMult: 1.2, element: 'lightning', auraDmg: 4, auraColor: '#ffff44' },
    stone_skin:   { name: '石肌', color: '#888888', defMult: 3.0, hpMult: 1.3 },
    cursed:       { name: '呪い', color: '#aa44aa', hpMult: 1.1, curseDmg: 1.25 },
    spectral_hit: { name: '幽撃', color: '#cc88ff', hpMult: 1.1, ignoreDefense: true }
};
const CHAMPION_AFFIX_KEYS = Object.keys(CHAMPION_AFFIXES);

// Unique monster name prefixes/suffixes
const UNIQUE_MONSTER_TITLES = ['暗黒の', '灼熱の', '凍てつく', '不死なる', '狂乱の', '古の', '恐怖の', '堕落した'];
const UNIQUE_MONSTER_SUFFIXES = ['破壊者', '支配者', '殲滅者', '略奪者', '亡霊'];

const monsters = [];
class Monster {
    constructor(x, y, type, floor, bossKey) {
        this.x = x; this.y = y;
        this.type = type;
        this.bossKey = bossKey || null;
        this.isBoss = !!bossKey;
        this.level = getMonsterLevel(G.act, G.actFloor);
        const d = MONSTER_DEFS[type] || MONSTER_DEFS.skeleton;
        this.def = d;
        const s = 1 + (floor - 1) * 0.3;
        const cm = getCycleMult();

        if (this.isBoss && BOSS_DEFS[bossKey]) {
            const bd = BOSS_DEFS[bossKey];
            this.maxHP = Math.round(bd.hp * cm);
            this.hp = this.maxHP;
            this.dmg = Math.round(bd.dmg * cm);
            this.spd = bd.spd;
            this.r = bd.r;
            this.defense = Math.round((bd.defense || 0) * cm);
            this.def = { ...d, name: bd.name, icon: bd.icon, xp: bd.xp, loot: 1.0, color: bd.color };
            this.bossPhase = 0;
            this.bossCD = {};
            this.bossState = 'idle';
            this.bossBurrowT = 0;
            this.drawScale = 2.2;
            this.aggroRange = 500;
        } else {
            this.maxHP = Math.round(d.hp * s * cm);
            this.hp = this.maxHP;
            this.dmg = Math.round(d.dmg * s * cm);
            this.spd = d.spd;
            this.r = d.r;
            this.defense = Math.round((d.defense || 0) * s);
            this.drawScale = MONSTER_DRAW_SCALES[type] || 1.3;
            this.aggroRange = type === 'demonlord' ? 400 : 250;
        }
        this.immunities = getMonsterImmunities(type);
        this.alive = true;
        this.deathT = 0;
        this.atkCD = 0;
        this.phase = type === 'ghost' || type === 'ice_wraith';
        this.phaseAlpha = 1;
        this.hitFlash = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.frozenT = 0;
        this.cursedT = 0;
        this.curseDmgMult = 1;
        this.origSpd = this.spd;
        this.aggroed = false;

        // Ranged AI properties
        this.ranged = d.ranged || false;
        this.projSpd = d.projSpd || 0;
        this.projColor = d.projColor || '#ff0000';
        this.preferredRange = d.preferredRange || 0;
        this.projCd = d.projCd || 1.5;
        this.rangedAtkCD = 0;
        this.element = d.element || null;

        // Champion/Unique properties (set by applyChampionAffix)
        this.isChampion = false;
        this.isUnique = false;
        this.championAffixes = [];
        this.uniqueName = null;
    }

    applyChampionAffix(affixKey) {
        const affix = CHAMPION_AFFIXES[affixKey];
        if (!affix) return;
        this.championAffixes.push(affixKey);
        if (affix.dmgMult) this.dmg = Math.round(this.dmg * affix.dmgMult);
        if (affix.spdMult) { this.spd = Math.round(this.spd * affix.spdMult); this.origSpd = this.spd; }
        if (affix.hpMult) { this.maxHP = Math.round(this.maxHP * affix.hpMult); this.hp = this.maxHP; }
        if (affix.defMult) this.defense = Math.round(this.defense * affix.defMult);
    }

    makeChampion() {
        this.isChampion = true;
        this.maxHP = Math.round(this.maxHP * 2.0);
        this.hp = this.maxHP;
        this.dmg = Math.round(this.dmg * 1.3);
        this.drawScale = (this.drawScale || 1) * 1.15;
        // 1-2 random affixes
        const count = rand(1, 2);
        const used = new Set();
        for (let i = 0; i < count; i++) {
            let key;
            do { key = CHAMPION_AFFIX_KEYS[rand(0, CHAMPION_AFFIX_KEYS.length - 1)]; } while (used.has(key));
            used.add(key);
            this.applyChampionAffix(key);
        }
    }

    makeUnique() {
        this.isUnique = true;
        this.maxHP = Math.round(this.maxHP * 3.5);
        this.hp = this.maxHP;
        this.dmg = Math.round(this.dmg * 1.8);
        this.drawScale = (this.drawScale || 1) * 1.25;
        this.aggroRange = Math.max(this.aggroRange, 350);
        // Unique name
        const title = UNIQUE_MONSTER_TITLES[rand(0, UNIQUE_MONSTER_TITLES.length - 1)];
        const suffix = UNIQUE_MONSTER_SUFFIXES[rand(0, UNIQUE_MONSTER_SUFFIXES.length - 1)];
        this.uniqueName = title + suffix;
        // 2-3 random affixes
        const count = rand(2, 3);
        const used = new Set();
        for (let i = 0; i < count; i++) {
            let key;
            do { key = CHAMPION_AFFIX_KEYS[rand(0, CHAMPION_AFFIX_KEYS.length - 1)]; } while (used.has(key));
            used.add(key);
            this.applyChampionAffix(key);
        }
    }

    update(dt) {
        if (!this.alive) { this.deathT -= dt; return; }
        this.atkCD = Math.max(0, this.atkCD - dt);
        this.hitFlash = Math.max(0, this.hitFlash - dt);
        // Knockback decay
        if (this.knockbackX !== 0 || this.knockbackY !== 0) {
            const decay = Math.min(1, dt / 0.15);
            this.knockbackX *= (1 - decay);
            this.knockbackY *= (1 - decay);
            if (Math.abs(this.knockbackX) < 0.1) this.knockbackX = 0;
            if (Math.abs(this.knockbackY) < 0.1) this.knockbackY = 0;
        }

        // Frozen state
        if (this.frozenT > 0) {
            this.frozenT -= dt;
            if (this.frozenT <= 0) {
                this.spd = this.origSpd; // restore speed
            }
        }
        if (this.cursedT > 0) {
            this.cursedT -= dt;
            if (this.cursedT <= 0) {
                this.curseDmgMult = 1;
            }
        }

        if (this.phase) {
            this.phaseAlpha = 0.3 + Math.sin(G.time * 3) * 0.3;
        }

        // Ranged attack cooldown
        this.rangedAtkCD = Math.max(0, this.rangedAtkCD - dt);

        // Champion aura damage tick
        if ((this.isChampion || this.isUnique) && this.alive) {
            for (const affKey of this.championAffixes) {
                const aff = CHAMPION_AFFIXES[affKey];
                if (aff && aff.auraDmg) {
                    const auraDist = dist(this.x, this.y, player.x, player.y);
                    if (auraDist < 60) {
                        if (!this._auraTick) this._auraTick = 0;
                        this._auraTick += dt;
                        if (this._auraTick >= 1.0) {
                            this._auraTick = 0;
                            player.takeDamage(Math.round(this.dmg * 0.15), aff.element || null);
                        }
                    }
                }
            }
        }

        const d = dist(this.x, this.y, player.x, player.y);
        if (d < this.aggroRange && this.frozenT <= 0) {
            // Growl on first aggro
            if (!this.aggroed) { this.aggroed = true; sfxMonsterGrowl(); }
            const dx = player.x - this.x, dy = player.y - this.y;
            const len = Math.hypot(dx, dy) || 1;
            const step = this.spd * dt;
            const mx = dx / len, my = dy / len;

            // Ranged monsters: keep distance, fire projectiles
            if (this.ranged && this.preferredRange > 0) {
                if (d < this.preferredRange * 0.7) {
                    // Too close - retreat
                    const nx = this.x - mx * step;
                    const ny = this.y - my * step;
                    const cr = Math.max(this.r - 4, 4);
                    if (this.phase) { this.x = nx; this.y = ny; }
                    else {
                        const canBoth = canWalk(nx, ny, cr);
                        if (canBoth) { this.x = nx; this.y = ny; }
                        else {
                            const canX = canWalk(this.x - mx * step, this.y, cr);
                            const canY = canWalk(this.x, this.y - my * step, cr);
                            if (canX) this.x -= mx * step;
                            else if (canY) this.y -= my * step;
                        }
                    }
                } else if (d > this.preferredRange * 1.3) {
                    // Too far - approach
                    const nx = this.x + mx * step;
                    const ny = this.y + my * step;
                    const cr = Math.max(this.r - 4, 4);
                    if (this.phase) { this.x = nx; this.y = ny; }
                    else {
                        const canBoth = canWalk(nx, ny, cr);
                        if (canBoth) { this.x = nx; this.y = ny; }
                        else {
                            const canX = canWalk(this.x + mx * step, this.y, cr);
                            const canY = canWalk(this.x, this.y + my * step, cr);
                            if (canX) this.x += mx * step;
                            else if (canY) this.y += my * step;
                        }
                    }
                }
                // Fire projectile
                if (this.rangedAtkCD <= 0 && d < this.preferredRange * 1.5) {
                    this.rangedAtkCD = this.projCd;
                    const ep = new EnemyProjectile(this.x, this.y, player.x, player.y,
                        this.dmg, this.projColor, this.projSpd, 4);
                    ep.element = this.element || null;
                    enemyProjectiles.push(ep);
                    emitParticles(this.x, this.y, this.projColor, 3, 30, 0.2, 2, 0);
                }
            } else {
                // Melee monsters: chase and attack
                const nx = this.x + mx * step;
                const ny = this.y + my * step;
                const cr = Math.max(this.r - 4, 4);

                if (this.phase) {
                    this.x = nx; this.y = ny;
                } else {
                    const canBoth = canWalk(nx, ny, cr);
                    const canX = canWalk(this.x + mx * step, this.y, cr);
                    const canY = canWalk(this.x, this.y + my * step, cr);
                    if (canBoth) { this.x = nx; this.y = ny; }
                    else if (canX) { this.x += mx * step; }
                    else if (canY) { this.y += my * step; }
                }

                if (d < this.r + player.radius + 10 && this.atkCD <= 0) {
                    let meleeDmg = this.dmg;
                    let meleeElement = null;
                    for (const affKey of (this.championAffixes || [])) {
                        const aff = CHAMPION_AFFIXES[affKey];
                        if (aff && aff.element) meleeElement = aff.element;
                        if (aff && aff.slowOnHit && player.speedDebuffT === undefined) {
                            player.speedDebuffT = aff.slowOnHit;
                        }
                    }
                    // Mercenary tank: 25% chance to redirect melee attack to merc (fighter: 40%)
                    if (mercenary && mercenary.alive && dist(this.x, this.y, mercenary.x, mercenary.y) < this.r + mercenary.radius + 15) {
                        const tauntChance = mercenary.type === 'fighter' ? 0.4 : 0.25;
                        if (Math.random() < tauntChance) {
                            // D2-style: bosses deal massive damage to mercs
                            const mercDmgMult = this.isBoss ? 7 : (this.isChampion || this.isUnique) ? 2 : 1;
                            mercenary.takeDmg(meleeDmg * mercDmgMult);
                            this.atkCD = 1.0; return;
                        }
                    }
                    const monAR = getMonsterAR(this);
                    player.takeDamage(meleeDmg, meleeElement, this.level || 1, monAR);
                    this.atkCD = 1.0;
                }
            }
        }
    }

    _darken(hex, factor) {
        const r = parseInt(hex.slice(1,3),16);
        const g = parseInt(hex.slice(3,5),16);
        const b = parseInt(hex.slice(5,7),16);
        return `rgb(${Math.round(r*factor)},${Math.round(g*factor)},${Math.round(b*factor)})`;
    }

    draw(cx, cy) {
        const sp = worldToScreen(this.x + (this.knockbackX || 0), this.y + (this.knockbackY || 0));
        const sx = sp.x, sy = sp.y;
        const mScale = this.drawScale || 1;
        if (sx < -80 * mScale || sx > W + 80 * mScale || sy < -80 * mScale || sy > H + 80 * mScale) return;

        // Death animation - squash/stretch + red tint + fade
        const deathProgress = !this.alive ? clamp(1 - this.deathT / 0.5, 0, 1) : 0;
        if (!this.alive) {
            ctx.globalAlpha = clamp(this.deathT / 0.5, 0, 1) * (1 - deathProgress * 0.3);
        }
        if (this.phase) ctx.globalAlpha = this.phaseAlpha;

        ctx.save();

        // Procedural animation transforms for monsters
        let mBounce = 0, mTilt = 0, mScX = 1, mScY = 1;
        if (this.alive && this.aggroed && this.frozenT <= 0) {
            // Walking animation
            const mWalkT = G.time * (this.spd / 15);
            mBounce = Math.abs(Math.sin(mWalkT)) * 3 * mScale;
            mTilt = Math.sin(mWalkT) * 0.04;
            const mLand = Math.abs(Math.sin(mWalkT));
            mScX = 1 + (1 - mLand) * 0.025;
            mScY = 1 - (1 - mLand) * 0.025;
        } else if (this.alive) {
            // Idle breathing
            mBounce = Math.sin(G.time * 1.5 + this.x * 0.1) * 1.5;
            mScY = 1 + Math.sin(G.time * 1.5 + this.x * 0.1) * 0.01;
        }

        // Enhanced death animation (2-phase)
        if (!this.alive && deathProgress > 0) {
            if (deathProgress < 0.4) {
                // Phase 1: white flash burst
                const flashP = deathProgress / 0.4;
                mScX = 1 + flashP * 0.3;
                mScY = 1 + flashP * 0.2;
            } else {
                // Phase 2: collapse + fade
                const collapseP = (deathProgress - 0.4) / 0.6;
                mScX = 1.3 + collapseP * 0.4;
                mScY = 1.2 - collapseP * 0.8;
            }
            ctx.translate(sx, sy);
            ctx.scale(mScX, mScY);
            ctx.translate(-sx, -sy);
        } else if (this.alive) {
            // Apply walk/idle transforms
            ctx.translate(sx, sy);
            ctx.translate(0, -mBounce);
            ctx.rotate(mTilt);
            ctx.scale(mScX, mScY);
            ctx.translate(-sx, -sy);
        }

        // Shadow ellipse under all monsters (radial gradient)
        const mShadowRx = this.r * mScale * 0.8;
        const mShadowG = ctx.createRadialGradient(sx, sy + this.r * mScale * 0.5 + 3, 0, sx, sy + this.r * mScale * 0.5 + 3, mShadowRx);
        mShadowG.addColorStop(0, 'rgba(0,0,0,0.4)');
        mShadowG.addColorStop(0.6, 'rgba(0,0,0,0.15)');
        mShadowG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = mShadowG;
        ctx.beginPath();
        ctx.ellipse(sx, sy + this.r * mScale * 0.5 + 3, mShadowRx, 4 * mScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Apply hit flash to drawing
        let alphaFlash = 1;
        if (this.hitFlash > 0) {
            alphaFlash = 0.5 + 0.5 * (this.hitFlash / 0.1);
        }

        // Type-specific detailed rendering (OGA hi-res sprites first, then fallback)
        let _drewOGA = false;
        if (ogaLoaded && OGA_CREATURE_MAP[this.type]) {
            const _dirIdx = getMonsterFacingDir(this);
            // Larger draw size: 3x tile for good visibility (256px src → ~96px)
            const _drawSize = TILE * mScale * 3.0;
            const _prevAlpha = ctx.globalAlpha;
            ctx.globalAlpha *= alphaFlash;
            // FLARE sprites: feet at ~75% of cell. Align with shadow position
            const _mFeetY = this.r * mScale * 0.5 + 3;
            _drewOGA = drawOGACreature(this.type, _dirIdx, G.time, sx - _drawSize/2, sy + _mFeetY - _drawSize * 0.78, _drawSize, _drawSize);
            ctx.globalAlpha = _prevAlpha;
        }
        if (!_drewOGA) {
            if (this.isBoss) this._drawBoss(sx, sy, alphaFlash);
            else if (this.type === 'skeleton') this._drawSkeleton(sx, sy, alphaFlash);
            else if (this.type === 'zombie' || this.type === 'frost_zombie') this._drawZombie(sx, sy, alphaFlash);
            else if (this.type === 'imp') this._drawImp(sx, sy, alphaFlash);
            else if (this.type === 'ghost' || this.type === 'ice_wraith') this._drawGhost(sx, sy, alphaFlash);
            else if (this.type === 'demonlord') this._drawDemonLord(sx, sy, alphaFlash);
            else this._drawGeneric(sx, sy, alphaFlash);
        }

        // Death visual overlay (2-phase)
        if (!this.alive && deathProgress > 0) {
            const dR = this.r * mScale * 2;
            if (deathProgress < 0.4) {
                // Phase 1: white flash burst
                const flashP = deathProgress / 0.4;
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = (1 - flashP) * 0.8;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(sx, sy, dR * (0.5 + flashP * 0.5), 0, Math.PI * 2); ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
            } else {
                // Phase 2: red tint + collapse
                const collapseP = (deathProgress - 0.4) / 0.6;
                ctx.globalCompositeOperation = 'source-atop';
                ctx.globalAlpha = collapseP * 0.5;
                ctx.fillStyle = '#cc0000';
                ctx.fillRect(sx - dR, sy - dR, dR * 2, dR * 2);
                ctx.globalCompositeOperation = 'source-over';
            }
        }

        ctx.restore();
        ctx.globalAlpha = 1;

        const mScaledR = this.r * (this.drawScale || 1);

        // Frozen indicator overlay (scaled)
        if (this.frozenT > 0) {
            ctx.strokeStyle = '#88ddff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, mScaledR + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(100,200,255,0.15)';
            ctx.beginPath();
            ctx.arc(sx, sy, mScaledR + 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Champion/Unique aura effect
        if (this.alive && (this.isChampion || this.isUnique)) {
            for (const affKey of this.championAffixes) {
                const aff = CHAMPION_AFFIXES[affKey];
                if (aff && aff.auraColor) {
                    const pulse = 0.2 + Math.sin(G.time * 4 + this.x * 0.1) * 0.1;
                    ctx.globalAlpha = pulse;
                    ctx.strokeStyle = aff.auraColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(sx, sy, mScaledR + 8, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
            // General champion glow
            const champColor = this.isUnique ? '#ffd700' : '#6666ff';
            const glowPulse = 0.15 + Math.sin(G.time * 3) * 0.08;
            ctx.globalAlpha = glowPulse;
            ctx.fillStyle = champColor;
            ctx.beginPath();
            ctx.arc(sx, sy, mScaledR + 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // HP bar (scaled position) - OGA Dark Fantasy HP bar (rank-differentiated)
        if (this.alive && this.hp < this.maxHP) {
            const bw = mScaledR * 2.2;
            const mHpRatio = this.hp / this.maxHP;
            // Select HP bar style: B-series for elites/uniques, D-series for normal
            const hpFilled = (this.isUnique || this.isChampion)
                ? (OGA.ui_hpbar_b1 || OGA.ui_hpbar) : OGA.ui_hpbar;
            const hpEmpty = (this.isUnique || this.isChampion)
                ? (OGA.ui_hpbar_b2 || OGA.ui_hpbar_empty) : OGA.ui_hpbar_empty;
            if (ogaLoaded && hpEmpty && hpFilled) {
                // Maintain source aspect ratio (1137:356 ≈ 3.19:1)
                const barH = Math.max(6, Math.round(bw / 3.19));
                const hpY = sy - mScaledR - barH - 4;
                ctx.drawImage(hpEmpty, sx - bw/2, hpY, bw, barH);
                if (mHpRatio > 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(sx - bw/2, hpY, bw * mHpRatio, barH);
                    ctx.clip();
                    ctx.drawImage(hpFilled, sx - bw/2, hpY, bw, barH);
                    ctx.restore();
                }
            } else {
                const hpY = sy - mScaledR - 10;
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(sx - bw/2, hpY, bw, 4);
                const hpColor = this.isUnique ? '#ffd700' : this.isChampion ? '#6666ff' :
                    (mHpRatio > 0.3 ? '#00aa00' : '#dd3300');
                ctx.fillStyle = hpColor;
                ctx.fillRect(sx - bw/2, hpY, bw * mHpRatio, 4);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(sx - bw/2, hpY, bw, 4);
            }
            // Immunity icons above HP bar
            if (this.immunities) {
                const immKeys = Object.keys(this.immunities).filter(k => this.immunities[k] >= 100);
                if (immKeys.length > 0) {
                    ctx.font = '8px monospace';
                    ctx.textAlign = 'center';
                    const totalW = immKeys.length * 12;
                    for (let ii = 0; ii < immKeys.length; ii++) {
                        const ik = immKeys[ii];
                        ctx.fillStyle = IMMUNITY_COLORS[ik] || '#888';
                        ctx.fillText(IMMUNITY_ICONS[ik] || '?', sx - totalW/2 + ii * 12 + 6, hpY - 2);
                    }
                }
            }
        }

        // Name plate (scaled position)
        if (this.alive) {
            if (this.isUnique) {
                // Unique: gold name with title
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(this.uniqueName, sx, sy - mScaledR - 14);
                ctx.font = '8px monospace';
                ctx.fillText(this.def.name, sx, sy + mScaledR + 12);
                // Affix labels
                const affNames = this.championAffixes.map(k => CHAMPION_AFFIXES[k].name).join(' ');
                ctx.fillStyle = '#ff8844';
                ctx.font = '7px monospace';
                ctx.fillText(affNames, sx, sy + mScaledR + 20);
            } else if (this.isChampion) {
                // Champion: blue name
                ctx.fillStyle = '#8888ff';
                ctx.font = 'bold 8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('★ ' + this.def.name, sx, sy + mScaledR + 12);
                const affNames = this.championAffixes.map(k => CHAMPION_AFFIXES[k].name).join(' ');
                ctx.fillStyle = '#6688cc';
                ctx.font = '7px monospace';
                ctx.fillText(affNames, sx, sy + mScaledR + 20);
            } else {
                ctx.fillStyle = '#aaaaaa';
                ctx.font = '8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(this.def.name, sx, sy + mScaledR + 12);
            }
        }

        // Boss aura
        if (this.type === 'demonlord' && this.alive) {
            ctx.strokeStyle = `rgba(200,50,50,${0.25 + Math.sin(G.time * 3.5) * 0.1})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(sx, sy, mScaledR + 10, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Boss name override
        if (this.type === 'demonlord' && this.alive) {
            ctx.fillStyle = '#cc5555';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.def.name, sx, sy - mScaledR - 14);
        }
    }

_drawHitFlash(sx, sy, alphaFlash, r, color) {
    if (this.hitFlash > 0) {
        const flashIntensity = this.hitFlash / 0.1;
        const mScale = this.drawScale || 1;
        const scaledR = r * mScale;
        ctx.save();
        // White outline flash (larger, bright)
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = flashIntensity * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, scaledR * 1.15, 0, Math.PI * 2);
        ctx.fill();
        // Radial impact glow
        const impG = ctx.createRadialGradient(sx, sy, 0, sx, sy, scaledR * 2);
        impG.addColorStop(0, `rgba(255,255,255,${flashIntensity * 0.3})`);
        impG.addColorStop(0.4, color + Math.round(flashIntensity * 60).toString(16).padStart(2,'0'));
        impG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = flashIntensity * 0.5;
        ctx.fillStyle = impG;
        ctx.beginPath();
        ctx.arc(sx, sy, scaledR * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // OGA sparks overlay for elemental hits
        if (ogaLoaded && OGA.fx_sparks && this.lastHitElement && this.lastHitElement !== 'physical') {
            ctx.globalAlpha = flashIntensity * 0.8;
            drawOGASparks(this.lastHitElement, G.time, sx - scaledR, sy - scaledR, scaledR * 2, scaledR * 2);
            ctx.globalAlpha = 1;
        }
        // VFX impact overlay (element-specific 16-frame strips)
        if (ogaLoaded) {
            let vfxImg;
            const hitEl = this.lastHitElement;
            if (hitEl === 'physical' || !hitEl) {
                // Alternate between blood and impact_set2 for physical variety
                vfxImg = ((this.type.charCodeAt(0) || 0) % 2 === 0)
                    ? OGA.vfx_impact_blood : (OGA.vfx_impact_set2 || OGA.vfx_impact_blood);
            } else if (hitEl === 'cold' || hitEl === 'ice') {
                vfxImg = OGA.vfx_impact_water || OGA.vfx_impact_earth;
            } else if (hitEl === 'lightning') {
                vfxImg = OGA.vfx_impact_air || OGA.vfx_impact_earth;
            } else if (hitEl === 'dark') {
                vfxImg = OGA.vfx_impact_chaos || OGA.vfx_impact_earth;
            } else if (hitEl === 'heal' || hitEl === 'holy') {
                vfxImg = OGA.vfx_impact_divine || OGA.vfx_impact_earth;
            } else {
                vfxImg = OGA.vfx_impact_earth;
            }
            if (vfxImg) {
                const vfxCellSz = (vfxImg.height / 4) | 0; // 128px (4 rows of variants)
                const vfxFrames = (vfxImg.width / vfxCellSz) | 0; // 16 or 8
                const vfxFrame = Math.floor((1 - flashIntensity) * vfxFrames);
                if (vfxFrame < vfxFrames) {
                    ctx.globalAlpha = flashIntensity * 0.7;
                    const vfxRow = (this.type.charCodeAt(0) || 0) % 4;
                    const vfxSz = scaledR * 3;
                    ctx.drawImage(vfxImg, vfxFrame * vfxCellSz, vfxRow * vfxCellSz, vfxCellSz, vfxCellSz,
                        sx - vfxSz / 2, sy - vfxSz / 2, vfxSz, vfxSz);
                    ctx.globalAlpha = 1;
                }
            }
        }
    }
}

_drawSkeleton(sx, sy, alphaFlash) {
    const flipX = player.x < this.x;
    const s = this.drawScale || 1;
    const dw = TILE * s, dh = TILE * s;
    drawSpr('skeleton', sx - dw/2, sy - dh/2, dw, dh, flipX, true);
    this._drawHitFlash(sx, sy, alphaFlash, this.r, '#ff4400');
}

_drawZombie(sx, sy, alphaFlash) {
    const flipX = player.x < this.x;
    const s = this.drawScale || 1;
    const dw = TILE * s, dh = TILE * s;
    drawSpr('zombie', sx - dw/2, sy - dh/2, dw, dh, flipX, true);
    this._drawHitFlash(sx, sy, alphaFlash, this.r, '#ff4400');
}

_drawImp(sx, sy, alphaFlash) {
    const flipX = player.x < this.x;
    const s = this.drawScale || 1;
    const dw = TILE * s, dh = TILE * s;
    drawSpr('imp', sx - dw/2, sy - dh/2, dw, dh, flipX, true);
    this._drawHitFlash(sx, sy, alphaFlash, this.r, '#ff4400');
}

_drawGhost(sx, sy, alphaFlash) {
    const flipX = player.x < this.x;
    const s = this.drawScale || 1;
    const dw = TILE * s, dh = TILE * s;
    ctx.globalAlpha = 0.55 + Math.sin(G.time * 3) * 0.15;
    drawSpr('banshee', sx - dw/2, sy - dh/2, dw, dh, flipX, true);
    ctx.globalAlpha = 1;
    this._drawHitFlash(sx, sy, alphaFlash, this.r, '#8844ff');
}

_drawDemonLord(sx, sy, alphaFlash) {
    const flipX = player.x < this.x;
    const bossScale = this.drawScale || 2.0;
    const bw = TILE * bossScale, bh = TILE * bossScale;

    // Ground aura (dark pulsing circle beneath boss)
    const auraR = TILE * 1.2;
    const auraAlpha = 0.08 + Math.sin(G.time * 2.5) * 0.04;
    const auraG = ctx.createRadialGradient(sx, sy + 5, 0, sx, sy + 5, auraR);
    auraG.addColorStop(0, `rgba(180,30,0,${auraAlpha})`);
    auraG.addColorStop(0.5, `rgba(120,10,0,${auraAlpha * 0.5})`);
    auraG.addColorStop(1, 'rgba(80,0,0,0)');
    ctx.fillStyle = auraG;
    ctx.beginPath(); ctx.arc(sx, sy + 5, auraR, 0, Math.PI * 2); ctx.fill();

    drawSpr('deathKnight', sx - bw/2, sy - bh/2, bw, bh, flipX);

    // Fire particles around boss
    for (let fp = 0; fp < 5; fp++) {
        const angle = G.time * 1.5 + fp * (Math.PI * 2 / 5);
        const fpDist = TILE * 0.6 + Math.sin(G.time * 3 + fp * 2) * 5;
        const fpx = sx + Math.cos(angle) * fpDist;
        const fpy = sy + Math.sin(angle) * fpDist * 0.5 - Math.abs(Math.sin(G.time * 5 + fp)) * 8;
        const fpSize = 2 + Math.sin(G.time * 6 + fp) * 1;
        ctx.globalAlpha = 0.3 + Math.sin(G.time * 4 + fp * 1.5) * 0.15;
        ctx.fillStyle = '#ff6020';
        ctx.beginPath(); ctx.arc(fpx, fpy, fpSize, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffaa40';
        ctx.beginPath(); ctx.arc(fpx, fpy, fpSize * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Inner glow
    ctx.globalAlpha = 0.12 + Math.sin(G.time * 4) * 0.05;
    ctx.fillStyle = '#ff4400';
    ctx.beginPath(); ctx.arc(sx, sy, TILE * 0.75, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Double ring aura
    ctx.strokeStyle = `rgba(200,50,50,${0.2 + Math.sin(G.time * 3) * 0.1})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(sx, sy, TILE * 0.9, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = `rgba(255,100,20,${0.15 + Math.sin(G.time * 4.5) * 0.08})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(sx, sy, TILE * 1.1, 0, Math.PI * 2); ctx.stroke();

    this._drawHitFlash(sx, sy, alphaFlash, this.r * 1.3, '#ff4400');
}

_drawGeneric(sx, sy, alphaFlash) {
    // Generic colored circle draw for new monster types (scaled)
    const color = this.def.color || '#888';
    const s = this.drawScale || 1;
    const r = this.r * s;
    // Body
    ctx.fillStyle = this._darken(color, 0.6);
    ctx.beginPath(); ctx.arc(sx, sy + 2 * s, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(sx - r * 0.25, sy - r * 0.25, r * 0.45, 0, Math.PI * 2); ctx.fill();
    // Eyes
    const eyeOff = 3 * s;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath(); ctx.arc(sx - eyeOff, sy - 2 * s, 1.5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + eyeOff, sy - 2 * s, 1.5 * s, 0, Math.PI * 2); ctx.fill();
    // Icon above
    ctx.font = `${Math.round(r * 1.2)}px ${FONT_EMOJI}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.def.icon || '?', sx, sy);
    this._drawHitFlash(sx, sy, alphaFlash, this.r, '#ff4400');
}

_drawBoss(sx, sy, alphaFlash) {
    const bd = BOSS_DEFS[this.bossKey] || UBER_BOSS_DEFS[this.bossKey] || {};
    const bossScale = this.drawScale || 2.2;
    const bw = TILE * bossScale, bh = TILE * bossScale;
    const color = bd.color || '#ff0000';

    // Ground aura
    const auraR = TILE * 1.4;
    const auraAlpha = 0.1 + Math.sin(G.time * 2.5) * 0.05;
    const rr = parseInt(color.slice(1,3),16), gg = parseInt(color.slice(3,5),16), bb = parseInt(color.slice(5,7),16);
    const aG = ctx.createRadialGradient(sx, sy + 5, 0, sx, sy + 5, auraR);
    aG.addColorStop(0, `rgba(${rr},${gg},${bb},${auraAlpha})`);
    aG.addColorStop(0.5, `rgba(${rr},${gg},${bb},${auraAlpha * 0.4})`);
    aG.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);
    ctx.fillStyle = aG; ctx.beginPath(); ctx.arc(sx, sy + 5, auraR, 0, Math.PI * 2); ctx.fill();

    // Boss body - large icon
    ctx.font = `${Math.round(bw * 0.7)}px ${FONT_EMOJI}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(bd.icon || '👿', sx, sy - 4);

    // Pulsing rings
    for (let ri = 0; ri < 2; ri++) {
        const ringR = TILE * (0.9 + ri * 0.25);
        const ringA = 0.15 + Math.sin(G.time * (3 + ri)) * 0.08;
        ctx.strokeStyle = `rgba(${rr},${gg},${bb},${ringA})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(sx, sy, ringR, 0, Math.PI * 2); ctx.stroke();
    }

    // Rotating particles
    for (let fp = 0; fp < 4; fp++) {
        const angle = G.time * 1.5 + fp * (Math.PI * 2 / 4);
        const fpDist = TILE * 0.6 + Math.sin(G.time * 3 + fp * 2) * 5;
        const fpx = sx + Math.cos(angle) * fpDist;
        const fpy = sy + Math.sin(angle) * fpDist * 0.5;
        const fpSize = 2 + Math.sin(G.time * 6 + fp) * 1;
        ctx.globalAlpha = 0.3 + Math.sin(G.time * 4 + fp * 1.5) * 0.15;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(fpx, fpy, fpSize, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Boss name plate
    ctx.font = `bold 12px ${FONT_UI}`;
    ctx.fillStyle = '#000'; ctx.fillText(bd.name || 'BOSS', sx + 1, sy - this.r - 21);
    ctx.fillStyle = color; ctx.fillText(bd.name || 'BOSS', sx, sy - this.r - 22);

    // Boss HP bar (wider) - OGA Dark Fantasy A-series HP bar
    const barW = 60;
    const hpPct = clamp(this.hp / this.maxHP, 0, 1);
    const bossHpFilled = OGA.ui_hpbar_a1 || OGA.ui_hpbar;
    const bossHpEmpty = OGA.ui_hpbar_a2 || OGA.ui_hpbar_empty;
    if (ogaLoaded && bossHpEmpty && bossHpFilled) {
        // Maintain source aspect ratio (1137:356 ≈ 3.19:1)
        const barH = Math.round(barW / 3.19);
        const barY = sy - this.r - barH - 6;
        ctx.drawImage(bossHpEmpty, sx - barW/2, barY, barW, barH);
        if (hpPct > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(sx - barW/2, barY, barW * hpPct, barH);
            ctx.clip();
            ctx.drawImage(bossHpFilled, sx - barW/2, barY, barW, barH);
            ctx.restore();
        }
    } else {
        const barH = 5;
        ctx.fillStyle = '#333'; ctx.fillRect(sx - barW/2, sy - this.r - 14, barW, barH);
        ctx.fillStyle = hpPct > 0.3 ? '#cc0000' : '#ff4400';
        ctx.fillRect(sx - barW/2, sy - this.r - 14, barW * hpPct, barH);
        ctx.strokeStyle = '#666'; ctx.lineWidth = 0.5;
        ctx.strokeRect(sx - barW/2, sy - this.r - 14, barW, barH);
    }

    this._drawHitFlash(sx, sy, alphaFlash, this.r * 1.3, color);
}
}

// ========== ENEMY PROJECTILES ==========
const enemyProjectiles = [];
class EnemyProjectile {
    constructor(x, y, tx, ty, dmg, color, spd, r) {
        this.x = x; this.y = y;
        this.dmg = dmg; this.color = color; this.r = r || 5;
        const d = Math.hypot(tx - x, ty - y) || 1;
        this.vx = (tx - x) / d * spd;
        this.vy = (ty - y) / d * spd;
        this.life = 3;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }
    draw(cx, cy) {
        const sp = worldToScreen(this.x, this.y);
        const sx = sp.x, sy = sp.y;
        if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) return;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(sx, sy, this.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(sx, sy, this.r * 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ========== BOSS AI ==========
function updateBossAI(m, dt) {
    if (!m.isBoss || !m.alive) return;
    const bd = BOSS_DEFS[m.bossKey] || UBER_BOSS_DEFS[m.bossKey];
    if (!bd) return;

    // Determine current phase based on HP%
    const hpPct = m.hp / m.maxHP;
    let activePhase = bd.phases[0];
    for (const ph of bd.phases) {
        if (hpPct <= ph.hpPct) activePhase = ph;
    }

    // Update cooldowns
    for (const key of Object.keys(m.bossCD)) {
        m.bossCD[key] = Math.max(0, m.bossCD[key] - dt);
    }

    const pdist = dist(m.x, m.y, player.x, player.y);
    if (pdist > m.aggroRange) return;

    // Phase-specific behavior
    const cdKey = activePhase.type;
    const cd = m.bossCD[cdKey] || 0;

    switch (activePhase.type) {
        case 'melee':
            // Chase and attack (handled by normal monster AI)
            break;
        case 'summon':
            if (cd <= 0) {
                m.bossCD[cdKey] = activePhase.cd;
                const sType = activePhase.summonType;
                for (let i = 0; i < activePhase.count; i++) {
                    const angle = Math.PI * 2 * i / activePhase.count;
                    const sx = m.x + Math.cos(angle) * 60;
                    const sy = m.y + Math.sin(angle) * 60;
                    if (MONSTER_DEFS[sType]) {
                        monsters.push(new Monster(sx, sy, sType, getGlobalFloor(G.act, G.actFloor, G.cycle)));
                    }
                }
                addLog(`${bd.name}が仲間を召喚した！`, '#ff4444');
                emitParticles(m.x, m.y, bd.color, 20, 80, 0.5, 4, -20);
            }
            break;
        case 'nova':
            if (cd <= 0) {
                m.bossCD[cdKey] = activePhase.cd;
                for (let i = 0; i < activePhase.count; i++) {
                    const angle = Math.PI * 2 * i / activePhase.count;
                    const tx = m.x + Math.cos(angle) * 300;
                    const ty = m.y + Math.sin(angle) * 300;
                    const ep = new EnemyProjectile(m.x, m.y, tx, ty,
                        Math.round(activePhase.projDmg * getCycleMult()),
                        activePhase.projColor, activePhase.projSpd, 5);
                    ep.element = activePhase.element || null;
                    enemyProjectiles.push(ep);
                }
                addLog(`${bd.name}が全方位攻撃！`, '#ff4444');
            }
            break;
        case 'fire_breath':
            if (cd <= 0) {
                m.bossCD[cdKey] = activePhase.cd;
                const baseAngle = Math.atan2(player.y - m.y, player.x - m.x);
                const spread = Math.PI * 0.5;
                for (let i = 0; i < activePhase.count; i++) {
                    const a = baseAngle - spread / 2 + spread * i / (activePhase.count - 1);
                    const tx = m.x + Math.cos(a) * 300;
                    const ty = m.y + Math.sin(a) * 300;
                    const ep = new EnemyProjectile(m.x, m.y, tx, ty,
                        Math.round(activePhase.projDmg * getCycleMult()),
                        activePhase.projColor, activePhase.projSpd, 6);
                    ep.element = activePhase.element || 'fire';
                    enemyProjectiles.push(ep);
                }
                addLog(`${bd.name}が炎のブレスを吐いた！`, '#ff4444');
            }
            break;
        case 'poison_spray':
            if (cd <= 0) {
                m.bossCD[cdKey] = activePhase.cd;
                const baseA = Math.atan2(player.y - m.y, player.x - m.x);
                const sp = Math.PI * 0.4;
                for (let i = 0; i < activePhase.count; i++) {
                    const a = baseA - sp / 2 + sp * i / (activePhase.count - 1);
                    const tx = m.x + Math.cos(a) * 300;
                    const ty = m.y + Math.sin(a) * 300;
                    const ep = new EnemyProjectile(m.x, m.y, tx, ty,
                        Math.round(activePhase.projDmg * getCycleMult()),
                        activePhase.projColor, activePhase.projSpd, 5);
                    ep.element = activePhase.element || 'poison';
                    enemyProjectiles.push(ep);
                }
            }
            break;
        case 'teleport_attack':
            if (cd <= 0 && pdist > 100) {
                m.bossCD[cdKey] = activePhase.cd;
                // Teleport near player
                const ta = Math.random() * Math.PI * 2;
                m.x = player.x + Math.cos(ta) * 80;
                m.y = player.y + Math.sin(ta) * 80;
                emitParticles(m.x, m.y, '#aa44ff', 15, 60, 0.4, 3, -20);
                addLog(`${bd.name}がテレポートした！`, '#aa44ff');
            }
            break;
        case 'burrow':
            if (cd <= 0) {
                m.bossCD[cdKey] = activePhase.cd;
                m.bossBurrowT = 2.0;
                emitParticles(m.x, m.y, '#aa8833', 20, 80, 0.5, 4, -30);
            }
            if (m.bossBurrowT > 0) {
                m.bossBurrowT -= dt;
                if (m.bossBurrowT <= 0) {
                    // Emerge near player
                    m.x = player.x + (Math.random() - 0.5) * 100;
                    m.y = player.y + (Math.random() - 0.5) * 100;
                    emitParticles(m.x, m.y, '#aa8833', 25, 100, 0.6, 5, -40);
                    player.takeDamage(Math.round(20 * getCycleMult()), 'fire');
                    addLog(`${bd.name}が地中から出現！`, '#ff8800');
                }
            }
            break;
        case 'quake':
            if (cd <= 0 && pdist < activePhase.radius + 50) {
                m.bossCD[cdKey] = activePhase.cd;
                if (pdist < activePhase.radius) {
                    player.takeDamage(Math.round(activePhase.dmg * getCycleMult()), 'fire');
                }
                G.shakeT = 0.5; G.shakeAmt = 10;
                emitParticles(m.x, m.y, '#886644', 30, 120, 0.6, 5, -50);
                addLog(`${bd.name}の地震攻撃！`, '#ff8800');
            }
            break;
        case 'freeze_aura':
            if (cd <= 0) {
                m.bossCD[cdKey] = activePhase.cd;
                if (pdist < activePhase.radius) {
                    player.takeDamage(Math.round(activePhase.dmg * getCycleMult()), 'cold');
                    addLog('凍結オーラのダメージ！', '#88ddff');
                }
                emitParticles(m.x, m.y, '#aaddff', 20, 100, 0.5, 4, -30);
            }
            break;
        case 'blizzard':
            if (cd <= 0) {
                m.bossCD[cdKey] = activePhase.cd;
                for (let i = 0; i < activePhase.count; i++) {
                    const bx = player.x + (Math.random() - 0.5) * activePhase.radius * 2;
                    const by = player.y + (Math.random() - 0.5) * activePhase.radius * 2;
                    setTimeout(() => {
                        if (!G.started || G.dead || !m.alive) return;
                        const hitD = dist(bx, by, player.x, player.y);
                        if (hitD < 40) player.takeDamage(Math.round(activePhase.dmg * getCycleMult()), 'cold');
                        emitParticles(bx, by, '#aaddff', 10, 60, 0.4, 3, -30);
                    }, i * 300);
                }
                addLog(`${bd.name}のブリザード！`, '#88ddff');
            }
            break;
        case 'meteor':
            if (cd <= 0) {
                m.bossCD[cdKey] = activePhase.cd;
                for (let i = 0; i < activePhase.count; i++) {
                    const mx = player.x + (Math.random() - 0.5) * 250;
                    const my = player.y + (Math.random() - 0.5) * 250;
                    setTimeout(() => {
                        if (!G.started || G.dead || !m.alive) return;
                        const hitD = dist(mx, my, player.x, player.y);
                        if (hitD < activePhase.radius) {
                            player.takeDamage(Math.round(activePhase.dmg * getCycleMult()), 'fire');
                        }
                        emitParticles(mx, my, '#ff6600', 25, 100, 0.6, 5, -40);
                        G.shakeT = 0.2; G.shakeAmt = 6;
                    }, 800 + i * 400);
                }
                addLog(`${bd.name}のメテオ！`, '#ff4400');
            }
            break;
    }
}

// D2-inspired hit chance (clamped): 100 * (2*aLvl/(aLvl+dLvl)) * (AR/(AR+Def)).
// Note: In this game, "defense" is also used for damage reduction, so we allow scaling here to avoid double-dipping.
function calcHitChance(attackerLevel, attackRating, defenderLevel, defense, defenseScale = 0.40) {
    const aLvl = Math.max(1, attackerLevel | 0);
    const dLvl = Math.max(1, defenderLevel | 0);
    const ar = Math.max(0, attackRating || 0);
    const effDef = Math.max(0, defense || 0) * Math.max(0, defenseScale || 0);

    const lvlFactor = (2 * aLvl) / (aLvl + dLvl);
    const arFactor = (ar <= 0) ? 0 : (ar / (ar + effDef));
    let chance = Math.round(100 * lvlFactor * arFactor);
    if (!isFinite(chance)) chance = 5;
    return Math.min(95, Math.max(5, chance));
}
function getPlayerAR() {
    const totalDex = player.getTotalStat('dex');
    const totalStr = player.getTotalStat('str');
    // Make early-game hits reliable; let Defense still matter via calcHitChance scaling.
    return totalStr * 2 + totalDex * 5 + player.level * 8;
}
function getMonsterAR(m) {
    // D2-ish: AR grows mainly by level; avoid tying AR too strongly to raw damage.
    const lvl = Math.max(1, (m && m.level) ? (m.level | 0) : 1);
    const dmg = Math.max(1, (m && m.dmg) ? (m.dmg | 0) : 10);
    let ar = Math.round(4 + lvl * 6 + dmg * 0.25);
    if (m && m.isBoss) ar = Math.round(ar * 1.6);
    else if (m && m.isUnique) ar = Math.round(ar * 1.25);
    else if (m && m.isChampion) ar = Math.round(ar * 1.15);
    return Math.max(1, ar);
}

function monsterTakeDmg(m, dmg, isCrit, element) {
    // D2-style hit check (player attacking monster)
    const playerAR = getPlayerAR();
    const mDef = m.defense || 0;
    const mLvl = m.level || getMonsterLevel(G.act, G.actFloor);
    // Monsters in this game already reduce damage via defense, so scale it down for hit checks to avoid too many misses.
    const hitChance = calcHitChance(player.level, playerAR, mLvl, mDef, 0.40);
    if (Math.random() * 100 >= hitChance) {
        addFloatingText(m.x, m.y - m.r - 10, 'MISS', '#888888');
        return;
    }
    // Monster immunity/resistance check
    if (element && m.immunities && m.immunities[element]) {
        const res = m.immunities[element];
        if (res >= 100) {
            addFloatingText(m.x, m.y - m.r - 10, 'IMMUNE', IMMUNITY_COLORS[element] || '#888');
            return;
        } else if (res > 0) {
            dmg = Math.max(1, Math.round(dmg * (1 - res / 100)));
        }
    }
    if (m.cursedT > 0 && m.curseDmgMult > 1) dmg = Math.round(dmg * m.curseDmgMult);
    const monDef = m.defense || 0;
    dmg = Math.max(1, Math.round(dmg * (100 / (100 + monDef))));
    m.hp -= dmg;
    m.hitFlash = 0.1;
    m.lastHitElement = element || 'physical';
    addFloatingText(m.x, m.y - m.r - 10, Math.round(dmg), isCrit ? '#ffff00' : '#ff6666', isCrit);

    // Hitstop: small freeze on impactful hits (melee contact / crit) for D2-like punch.
    const meleeContact = dist(player.x, player.y, m.x, m.y) < (player.getWeaponReach() + 10);
    if (isCrit || (meleeContact && (element == null || element === 'physical'))) {
        const t = isCrit ? 0.06 : 0.035;
        G.hitStopT = Math.max(G.hitStopT || 0, t);
    }
    // Knockback (hit stagger)
    const hitAngle = Math.atan2(m.y - player.y, m.x - player.x);
    const kbBase = isCrit ? 10 : 5;
    const kbDist = kbBase + Math.min(14, Math.sqrt(Math.max(1, dmg)) * 0.6);
    m.knockbackX = Math.cos(hitAngle) * kbDist;
    m.knockbackY = Math.sin(hitAngle) * kbDist;
    // Hit spark particles (white flash + colored sparks)
    const sparkCount = isCrit ? 8 : 4;
    for (let i = 0; i < sparkCount; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        const sa = hitAngle + (Math.random() - 0.5) * Math.PI;
        const ss = 80 + Math.random() * 120;
        particles.push(new Particle(
            m.x, m.y, Math.cos(sa) * ss, Math.sin(sa) * ss,
            i < 2 ? '#ffffff' : '#ffdd88', 0.15 + Math.random() * 0.1,
            1 + Math.random() * 1.5, 0
        ));
    }
    // Critical hit: micro screen shake + edge flash
    if (isCrit) {
        G.shakeT = Math.max(G.shakeT || 0, 0.08);
        G.shakeAmt = Math.max(G.shakeAmt || 0, 4);
        G.flashT = 0.06; G.flashAlpha = 0.15; G.flashColor = '#ffff44';
    }
    // Directional blood splatter (from player angle)
    const bloodCount = isCrit ? 12 : 6;
    for (let i = 0; i < bloodCount; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        const spread = (Math.random() - 0.5) * 1.2;
        const angle = hitAngle + spread;
        const speed = 40 + Math.random() * 60;
        const bColor = isCrit ? '#ff2200' : '#cc0000';
        particles.push(new Particle(
            m.x, m.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            bColor,
            0.3 + Math.random() * 0.3,
            1 + Math.random() * 2,
            120
        ));
    }
    emitParticles(m.x, m.y, '#cc0000', isCrit ? 5 : 3, 70, 0.4, 3);
    if (m.hp <= 0) {
        m.alive = false;
        m.deathT = 0.6;
        sfxMonsterDeath();
        addBloodPool(m.x, m.y, m.r * 2 + 5);
        emitParticles(m.x, m.y, '#660000', 12, 60, 0.6, 2, 80);
        // Death white flash burst
        emitParticles(m.x, m.y, '#ffffff', 4, 80, 0.2, 4, 0);
        const globalF = getGlobalFloor(G.act, G.actFloor, G.cycle);
        const xpMult = m.isUnique ? 5 : m.isChampion ? 3 : 1;
        const mlvl = getMonsterLevel(G.act, G.actFloor);
        const xpPenalty = getXPPenalty(player.level, mlvl);
        const baseXP = Math.round(m.def.xp * (1 + (globalF - 1) * 0.07) * (1 + G.cycle * 0.3) * xpMult * xpPenalty);
        player.addXP(baseXP);
        // Mercenary independent XP (50% of player XP, own level penalty)
        if (mercenary && mercenary.alive) {
            const mercPenalty = getXPPenalty(mercenary.level, mlvl);
            mercenary.addXP(Math.round(baseXP * 0.5 * mercPenalty));
        }
        // Gold drop (champion/unique drop more)
        const goldMult = m.isUnique ? 4 : m.isChampion ? 2.5 : 1;
        const goldAmt = Math.round(rand(Math.max(1, m.def.xp * 0.5), m.def.xp * 1.5) * goldMult);
        G.gold += goldAmt;
        addFloatingText(m.x, m.y - m.r - 25, `+${goldAmt}G`, '#ffd700');
	            // Drop loot (D2-ish: most mobs drop nothing; champs/uniques/bosses are better, but not showers)
	            const diffDrop = DIFFICULTY_DEFS[G.difficulty || 'normal'].dropBonus || 0;
	            function dropRolledItem(rarityHint) { dropItem(m.x, m.y, generateItem(globalF, rarityHint || null)); }

	            // Item drop chance baseline (derived from monster def + difficulty)
	            let itemChance = (m.def.loot || 0.4) * 0.25 + diffDrop * 0.15; // ~0.10 base for loot=0.4
	            if (m.isChampion) itemChance += 0.18;
	            if (m.isUnique) itemChance += 0.28;
	            if (m.isBoss || m.type === 'demonlord') itemChance += 0.38;
	            itemChance = Math.max(0, Math.min(0.85, itemChance));

	            if (m.isBoss || m.type === 'demonlord') {
	                // 2 guaranteed magic+ (rare is still uncommon), plus a couple of extra rolls.
	                dropRolledItem(Math.random() < (0.08 + diffDrop * 0.15) ? 'rare' : 'magic');
	                dropRolledItem(Math.random() < (0.06 + diffDrop * 0.12) ? 'rare' : 'magic');
	                if (Math.random() < itemChance) dropRolledItem(Math.random() < 0.10 ? 'rare' : null);
	                if (Math.random() < itemChance * 0.6) dropRolledItem(Math.random() < 0.06 ? 'rare' : 'magic');
	            } else if (m.isUnique) {
	                if (Math.random() < itemChance) dropRolledItem(Math.random() < 0.16 ? 'rare' : 'magic');
	                if (Math.random() < itemChance * 0.75) dropRolledItem(Math.random() < 0.08 ? 'rare' : 'magic');
	            } else if (m.isChampion) {
	                if (Math.random() < itemChance) dropRolledItem(Math.random() < 0.10 ? 'rare' : 'magic');
	            } else {
	                if (Math.random() < itemChance) dropRolledItem(Math.random() < 0.15 ? 'magic' : null);
	            }

	            // Potions: common, but not every kill. Bosses drop more.
	            const hpChance = (m.isBoss || m.type === 'demonlord') ? 0.22 : m.isUnique ? 0.14 : m.isChampion ? 0.12 : 0.08;
	            const mpChance = (m.isBoss || m.type === 'demonlord') ? 0.14 : m.isUnique ? 0.10 : m.isChampion ? 0.08 : 0.05;
	            if (Math.random() < hpChance) dropItem(m.x, m.y, generatePotion('hp'));
	            if (Math.random() < mpChance) dropItem(m.x, m.y, generatePotion('mp'));

	            // Rejuvenation: rare bonus for special monsters.
	            if ((m.isChampion || m.isUnique || m.isBoss || m.type === 'demonlord') && Math.random() < 0.04) {
	                dropItem(m.x, m.y, generatePotion('rejuv'));
	            }

	            // Charms: uncommon.
	            const charmChance = (m.isBoss || m.type === 'demonlord') ? 0.10 : m.isUnique ? 0.05 : m.isChampion ? 0.03 : 0.01;
	            if (Math.random() < charmChance) dropItem(m.x, m.y, generateCharm(globalF));

	            // Runes: low chance, scaled a bit with difficulty.
	            const runeChance = (m.isBoss || m.type === 'demonlord') ? 0.05 : m.isUnique ? 0.02 : m.isChampion ? 0.012 : 0.006;
	            const runeRoll = Math.min(0.10, runeChance + diffDrop * 0.02);
	            if (Math.random() < runeRoll) {
	                const runeItem = generateRune(globalF);
	                dropItem(m.x, m.y, runeItem);
	                if (runeItem.runeDef.tier === 3) {
	                    addLog(`★ 高級ルーン『${runeItem.runeDef.name}』がドロップ！`, '#ff8800');
	                    sfxLegendary();
	                }
	            } else if ((m.isBoss || m.type === 'demonlord') && Math.random() < 0.02 + diffDrop * 0.02) {
	                // Bosses get a small second roll, but not guaranteed.
	                dropItem(m.x, m.y, generateRune(globalF));
	            }
        // Boss defeat with screen shake + white flash
        if (m.isBoss && m.bossKey) {
            G.shakeT = 0.6; G.shakeAmt = 15;
            G.flashT = 0.2; G.flashAlpha = 0.5; G.flashColor = '#ffffff';
            emitParticles(m.x, m.y, '#ffffff', 12, 120, 0.4, 5, 0);
            G.bossesDefeated[m.bossKey] = (G.bossesDefeated[m.bossKey] || 0) + 1;
            checkQuestProgress('boss_killed', m.bossKey);
            // Promotion gating uses boss defeat; trigger the check here too (otherwise you'd need another level-up).
            checkPromotion();
            // Uber key drop from Act bosses on Nightmare/Hell
            if (G.difficulty !== 'normal') {
                const keyChance = G.difficulty === 'hell' ? 0.33 : 0.10;
                for (const [keyId, keyDef] of Object.entries(UBER_KEY_DEFS)) {
                    if (keyDef.fromBoss === m.bossKey && Math.random() < keyChance) {
                        const keyItem = {
                            name: keyDef.name, typeKey: 'quest_key', icon: keyDef.icon,
                            rarityKey: 'unique', rarity: { name: 'ユニーク', color: '#ffd700' },
                            typeInfo: { name: keyDef.name, icon: keyDef.icon, slot: null },
                            baseDmg: 0, baseDef: 0, affixes: [], desc: keyDef.desc,
                            uberKeyId: keyId, qty: 1, requiredLevel: 0, itemLevel: 0
                        };
                        dropItem(m.x, m.y, keyItem);
                        sfxLegendary();
                        addLog(`★ ${keyDef.name} がドロップ！`, keyDef.color);
                    }
                }
            }
            // Uber boss defeat: drop Hellfire Torch
            if (m.isUber) {
                G.uberBossesDefeated = G.uberBossesDefeated || {};
                G.uberBossesDefeated[m.bossKey] = true;
                // Check if all 3 uber bosses defeated
                const allUbersDead = ['uber_diablo', 'uber_mephisto', 'uber_baal'].every(
                    k => G.uberBossesDefeated[k]
                );
                if (allUbersDead) {
                    // Drop Hellfire Torch
                    const torch = {
                        name: UBER_TORCH_DEF.name, typeKey: UBER_TORCH_DEF.typeKey,
                        icon: UBER_TORCH_DEF.icon,
                        rarityKey: 'unique', rarity: { name: 'ユニーク', color: '#ffd700' },
                        typeInfo: ITEM_TYPES[UBER_TORCH_DEF.typeKey],
                        baseDmg: 0, baseDef: 0, desc: UBER_TORCH_DEF.desc,
                        affixes: UBER_TORCH_DEF.affixes.map(a => ({ ...a })),
                        qty: 1, requiredLevel: 50, itemLevel: 99, sockets: 0
                    };
                    dropItem(m.x, m.y, torch);
                    sfxLegendary();
                    G.shakeT = 1.0; G.shakeAmt = 20;
                    G.flashT = 0.5; G.flashAlpha = 0.8; G.flashColor = '#ffd700';
                    addLog(`★★★ ヘルファイアトーチを獲得！★★★`, '#ffd700');
                    addLog('パンデモニウムの試練を制覇した！', '#ff8800');
                }
            }
            addLog(`★ ${m.def.name} を討伐した！★`, '#ffd700');
        } else if (m.isUnique) {
            addLog(`★ ユニークモンスター ${m.uniqueName} を討伐！(+${Math.round(m.def.xp * xpMult)} XP)`, '#ffd700');
            G.shakeT = 0.3; G.shakeAmt = 8;
            emitParticles(m.x, m.y, '#ffd700', 20, 100, 0.5, 4, 0);
        } else if (m.isChampion) {
            addLog(`チャンピオン ${m.def.name} を倒した！(+${Math.round(m.def.xp * xpMult)} XP)`, '#8888ff');
        } else {
            addLog(`${m.def.name} を倒した! (+${m.def.xp} XP)`, '#ffaa00');
        }
        // Quest progress: kill count
        G.questKillCounts._total = (G.questKillCounts._total || 0) + 1;
        checkQuestProgress('monster_killed', m.type);
    }
}

// ========== QUEST SYSTEM ==========
function checkQuestProgress(eventType, target) {
    for (const [qid, qdef] of Object.entries(QUEST_DEFS)) {
        const state = G.quests[qid];
        if (!state || state.status !== 'active') continue;

        if (eventType === 'boss_killed' && qdef.type === 'kill_boss' && qdef.target === target) {
            G.quests[qid].status = 'complete';
            addLog(`★ クエスト達成: ${qdef.name}！町に戻って報告しよう`, '#ffd700');
        }
        if (eventType === 'monster_killed' && qdef.type === 'kill_count') {
            G.quests[qid].progress = (G.quests[qid].progress || 0) + 1;
            if (G.quests[qid].progress >= qdef.target) {
                G.quests[qid].status = 'complete';
                addLog(`★ クエスト達成: ${qdef.name}！町に戻って報告しよう`, '#ffd700');
            }
        }
    }
}

function canAcceptQuest(qid) {
    const qdef = QUEST_DEFS[qid];
    if (!qdef) return false;
    if (G.quests[qid] && G.quests[qid].status === 'rewarded') return false;
    if (qdef.prereq && (!G.quests[qdef.prereq] || G.quests[qdef.prereq].status !== 'rewarded')) return false;
    return true;
}

function acceptQuest(qid) {
    if (!canAcceptQuest(qid)) return false;
    G.quests[qid] = { status: 'active', progress: 0 };
    addLog(`クエスト受諾: ${QUEST_DEFS[qid].name}`, '#4488ff');
    return true;
}

function turnInQuest(qid) {
    const qdef = QUEST_DEFS[qid];
    const state = G.quests[qid];
    if (!qdef || !state || state.status !== 'complete') return false;
    state.status = 'rewarded';
    // Grant rewards
    if (qdef.rewards.xp) player.addXP(qdef.rewards.xp);
    if (qdef.rewards.gold) G.gold += qdef.rewards.gold;
    if (qdef.rewards.item) {
        const item = generateItem(getGlobalFloor(G.act, G.actFloor, G.cycle), qdef.rewards.item);
        player.inventory.push(item);
        addLog(`報酬アイテム: ${item.name}`, item.rarity.color);
    }
    if (qdef.rewards.skillReset) {
        player.skillResetAvailable = true;
        addLog('★ スキルリセット権を獲得！（町の長老に話しかけてスキルを振り直せます）', '#ff88ff');
    }
    addLog(`クエスト完了報酬: +${qdef.rewards.xp || 0} XP, +${qdef.rewards.gold || 0} G`, '#ffd700');
    return true;
}

function getActiveQuests() {
    const result = [];
    for (const [qid, state] of Object.entries(G.quests)) {
        if (state.status === 'active' || state.status === 'complete') {
            result.push({ qid, ...QUEST_DEFS[qid], ...state });
        }
    }
    return result;
}

// ========== SHOP / ECONOMY ==========
// D2-style price calculation: base price × rarity multiplier × level factor
function calculateSellPrice(item) {
    // Special handling for potions
    if (isPotion(item)) {
        const potionPrices = {
            hp1: 50, hp2: 100, hp3: 200, hp4: 350, hp5: 600,
            mp1: 80, mp2: 150, mp3: 300,
            rejuv: 500, fullrejuv: 2000
        };
        return potionPrices[item.typeKey] || 50;
    }

    // Special handling for runes
    if (isRune(item)) {
        const runeTier = item.runeTier || 1;
        return Math.round(1000 * Math.pow(2, runeTier - 1)); // Exponential pricing for runes
    }

    // Get base price by item type
    const basePrice = ITEM_BASE_PRICES[item.typeKey] || 100;

    // Get rarity multiplier
    const rarityMult = RARITY_PRICE_MULT[item.rarityKey] || 1;

    // Level factor (D2-style: price increases with item level)
    const itemLevel = item.itemLevel || 1;
    const levelFactor = 1 + (itemLevel - 1) * 0.1;

    return Math.round(basePrice * rarityMult * levelFactor);
}

// D2-style buy price: sell price × 5 (NPC sells at 5x the buy-back price)
// This means if you sell for 100G, NPC sells it for 500G (buy-back is 20% of sell price)
function calculateBuyPrice(item) {
    return calculateSellPrice(item) * 5;
}
function calculateSmithCost(item) {
    const base = { common:100, magic:250, rare:500, legendary:1000, unique:2000, runeword:2500 };
    const b = base[item.rarityKey] || 100;
    const lvl = item.itemLevel || 1;
    return Math.round(b * (1 + (lvl - 1) * 0.15));
}
// D2-style shop item generation: level-appropriate items with controlled rarity
function generateShopItems(act) {
    const items = [];
    // Use player level for item generation (D2 style: shop items scale with player level)
    const itemLevel = Math.max(1, player.level + rand(-2, 2));

    // Generate 8-12 equipment items (D2-style variety)
    const equipCount = 8 + rand(0, 4);
    for (let i = 0; i < equipCount; i++) {
        // D2-style rarity distribution for shops: mostly normal/magic, rare is uncommon
        const rarityRoll = Math.random();
        let forceRarity = null;
        if (rarityRoll < 0.10) {
            forceRarity = 'rare'; // 10% rare
        } else if (rarityRoll < 0.40) {
            forceRarity = 'magic'; // 30% magic
        }
        // 60% common (forceRarity = null)

        items.push(generateItem(itemLevel, forceRarity));
    }

    // Always include potions (tiered by act)
    for (let i = 0; i < 3; i++) items.push(generatePotion('hp', act));
    for (let i = 0; i < 3; i++) items.push(generatePotion('mp', act));
    if (act >= 3) items.push(generatePotion('rejuv'));

    return items;
}

// ========== PROJECTILES ==========
const projectiles = [];
class Projectile {
    constructor(x, y, tx, ty, dmg, color, spd, r, attribute) {
        this.x = x; this.y = y;
        this.dmg = dmg; this.color = color; this.r = r;
        this.attribute = attribute; // Store attribute for aura rendering
        const d = Math.hypot(tx - x, ty - y) || 1;
        this.vx = (tx - x) / d * spd;
        this.vy = (ty - y) / d * spd;
        this.life = 3;
        this.trail = [];
    }
    update(dt) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 8) this.trail.shift();
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        emitParticles(this.x, this.y, this.color, 1, 20, 0.2, 2, 0);
    }
    draw(cx, cy) {
        const sp = worldToScreen(this.x, this.y);
        const px = sp.x, py = sp.y;

        // Try OGA projectile sprite first
        if (ogaLoaded && this.attribute && OGA_PROJ_MAP[this.attribute]) {
            const _dirIdx = getFacingDir8(this.vx, this.vy);
            // Fixed visual size (not tied to collision radius)
            const _sprSize = Math.max(this.r * 6, 32);
            // Use life as spawn offset for animation desync between projectiles
            const _spawnOff = this.life * 7.3;
            if (drawOGAProjectile(this.attribute, _dirIdx, G.time, _spawnOff, px - _sprSize/2, py - _sprSize/2, _sprSize, _sprSize)) {
                // Draw glow behind sprite
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.3;
                const _glowR = this.r * 3;
                const _grd = ctx.createRadialGradient(px, py, 0, px, py, _glowR);
                _grd.addColorStop(0, this.color + 'aa');
                _grd.addColorStop(1, this.color + '00');
                ctx.fillStyle = _grd;
                ctx.beginPath(); ctx.arc(px, py, _glowR, 0, Math.PI * 2); ctx.fill();
                // VFX ball overlay (fire/lightning/arcane)
                if (OGA.vfx_ball_set) {
                    const _ballRows = { fire: 0, lightning: 1, arcane: 2, poison: 2 };
                    const _ballRow = _ballRows[this.attribute];
                    if (_ballRow !== undefined) {
                        const _bCsz = 128;
                        const _bFrame = Math.floor((G.time * 8 + this.life * 5) % 8);
                        const _bSz = this.r * 5;
                        ctx.globalAlpha = 0.5;
                        ctx.drawImage(OGA.vfx_ball_set, _bFrame * _bCsz, _ballRow * _bCsz, _bCsz, _bCsz,
                            px - _bSz/2, py - _bSz/2, _bSz, _bSz);
                    }
                }
                ctx.restore();
                // Trail
                if (this.trail.length > 1) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'lighter';
                    for (let i = 1; i < this.trail.length; i++) {
                        ctx.globalAlpha = (i / this.trail.length) * 0.3;
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = this.r * (i / this.trail.length);
                        const a0 = worldToScreen(this.trail[i-1].x, this.trail[i-1].y);
                        const a1 = worldToScreen(this.trail[i].x, this.trail[i].y);
                        ctx.beginPath();
                        ctx.moveTo(a0.x, a0.y);
                        ctx.lineTo(a1.x, a1.y);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
                ctx.globalAlpha = 1;
                // Skip original rendering for attributed projectile
                if (this.attribute && ATTRIBUTE_BEHAVIORS[this.attribute]) {
                    const auraColor = ATTRIBUTE_BEHAVIORS[this.attribute].glowColor;
                    const auraSize = this.r * (1.5 + Math.sin(G.time * 8) * 0.3);
                    ctx.globalAlpha = 0.25;
                    ctx.strokeStyle = auraColor; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(px, py, auraSize, 0, Math.PI * 2); ctx.stroke();
                    ctx.globalAlpha = 1;
                }
                return;
            }
        }

        // Fallback: original rendering
        // Smooth continuous trail line
        if (this.trail.length > 1) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 1; i < this.trail.length; i++) {
                const a = (i / this.trail.length) * 0.4;
                ctx.globalAlpha = a;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.r * (i / this.trail.length) * 1.5;
                const a0 = worldToScreen(this.trail[i-1].x, this.trail[i-1].y);
                const a1 = worldToScreen(this.trail[i].x, this.trail[i].y);
                ctx.beginPath();
                ctx.moveTo(a0.x, a0.y);
                ctx.lineTo(a1.x, a1.y);
                ctx.stroke();
            }
            ctx.restore();
        }
        ctx.globalAlpha = 1;

        // Expanded glow (5x radius, pulsing)
        const pulse = 1 + Math.sin(G.time * 12) * 0.15;
        const glowR = this.r * 5 * pulse;
        const grd = ctx.createRadialGradient(px, py, 0, px, py, glowR);
        grd.addColorStop(0, this.color + 'cc');
        grd.addColorStop(0.3, this.color + '66');
        grd.addColorStop(1, this.color + '00');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(px, py, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing core
        const coreR = this.r * 0.6 * pulse;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(px, py, coreR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(px, py, this.r * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Add glowing aura ring for attributed projectiles
        if (this.attribute && ATTRIBUTE_BEHAVIORS[this.attribute]) {
            const auraColor = ATTRIBUTE_BEHAVIORS[this.attribute].glowColor;
            const auraSize = this.r * (1.5 + Math.sin(G.time * 8) * 0.3);
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = auraColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, auraSize, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
}

