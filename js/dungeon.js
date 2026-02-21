const DUNGEON_PROP_PROFILES = {
    cathedral: {
        common: ['kenney_barrel', 'kenney_barrels', 'kenney_barrels_stacked', 'kenney_crate', 'kenney_crates'],
        support: ['kenney_chair', 'kenney_woodpile'],
        feature: ['kenney_table_short', 'kenney_table_round'],
        commonMod: 173, supportMod: 389, featureMod: 557
    },
    desert: {
        common: ['kenney_crate', 'kenney_crates', 'kenney_woodpile', 'kenney_barrel'],
        support: ['kenney_chair'],
        feature: ['kenney_table_short'],
        commonMod: 161, supportMod: 347, featureMod: 521
    },
    jungle: {
        common: ['kenney_woodpile', 'kenney_crate', 'kenney_barrel', 'kenney_barrels'],
        support: ['kenney_chair', 'kenney_barrels_stacked'],
        feature: ['kenney_table_round', 'kenney_table_short'],
        commonMod: 157, supportMod: 331, featureMod: 503
    },
    hell: {
        common: ['kenney_barrel', 'kenney_barrels_stacked', 'kenney_crate'],
        support: ['kenney_crates'],
        feature: ['kenney_table_short'],
        commonMod: 211, supportMod: 419, featureMod: 677
    },
    ice: {
        common: ['kenney_crate', 'kenney_crates', 'kenney_barrel'],
        support: ['kenney_chair', 'kenney_barrels'],
        feature: ['kenney_table_round'],
        commonMod: 181, supportMod: 373, featureMod: 601
    }
};

const DUNGEON_PROP_SCALE = {
    kenney_barrels_stacked: 1.08,
    kenney_table_round: 1.08,
    kenney_table_short: 1.08,
    kenney_chair: 0.96
};

function pickDungeonPropForTheme(theme, h, allowFeature) {
    const profile = DUNGEON_PROP_PROFILES[theme] || DUNGEON_PROP_PROFILES.cathedral;
    if (h % profile.commonMod === 0) {
        const key = profile.common[h % profile.common.length];
        return { key, scale: DUNGEON_PROP_SCALE[key] || 1 };
    }
    if (h % profile.supportMod === 0) {
        const key = profile.support[h % profile.support.length];
        return { key, scale: DUNGEON_PROP_SCALE[key] || 1 };
    }
    if (allowFeature && h % profile.featureMod === 0) {
        const key = profile.feature[h % profile.feature.length];
        return { key, scale: DUNGEON_PROP_SCALE[key] || 1 };
    }
    return null;
}

function getDungeonPropStateKey(tx, ty) {
    return ty * MAP_W + tx;
}

function resolveDungeonPropAtTile(dng, tx, ty) {
    if (!dng || !dng.get || dng.get(tx, ty) !== 1) return null;
    const nearWall = dng.get(tx, ty - 1) === 0 || dng.get(tx - 1, ty) === 0 || dng.get(tx + 1, ty) === 0;
    const hasSpecialNeighbor = dng.get(tx, ty - 1) >= 2 || dng.get(tx, ty + 1) >= 2 || dng.get(tx - 1, ty) >= 2 || dng.get(tx + 1, ty) >= 2;
    if (!nearWall || hasSpecialNeighbor) return null;
    const h = (((tx + 17) * 73856093) ^ ((ty + 31) * 19349663)) >>> 0;
    const theme = dng._tileTheme || 'cathedral';
    const allowFeature = dng.get(tx + 1, ty) === 1 && dng.get(tx, ty + 1) === 1;
    return pickDungeonPropForTheme(theme, h, allowFeature);
}

function isDungeonPropBroken(dng, tx, ty) {
    if (!dng || !dng.brokenProps) return false;
    return dng.brokenProps.has(getDungeonPropStateKey(tx, ty));
}

function breakDungeonProp(tx, ty, prop) {
    if (!dungeon || !prop || G.inTown) return false;
    if (!dungeon.brokenProps) dungeon.brokenProps = new Set();
    const key = getDungeonPropStateKey(tx, ty);
    if (dungeon.brokenProps.has(key)) return false;
    dungeon.brokenProps.add(key);

    const px = tx * TILE + TILE / 2;
    const py = ty * TILE + TILE / 2;
    sfxHit();
    emitParticles(px, py, '#b28a55', 14, 85, 0.35, 2, -20);
    addFloatingText(px, py - 18, 'BREAK', '#caa06a');

    const globalF = getGlobalFloor(G.act, G.actFloor, G.cycle);
	        const goldAmt = rand(6 + globalF * 2, 20 + globalF * 5);
	        G.gold += goldAmt;
	        addFloatingText(px, py - 34, `+${goldAmt}G`, '#ffd700');
	        // D2-ish: breakables are nice-to-have, not loot pinatas.
	        if (Math.random() < 0.08) dropItem(px, py, generatePotion(Math.random() < 0.65 ? 'hp' : 'mp'));
	        if (Math.random() < 0.03) dropItem(px, py, generateItem(globalF, Math.random() < 0.08 ? 'magic' : null));
	        addLog('壊せるオブジェクトを破壊した', '#b28a55');
	        return true;
	    }

function tryBreakNearbyDungeonProps(cx, cy, range, maxBreak = 1) {
    if (!dungeon || G.inTown || maxBreak <= 0) return 0;
    const tRange = Math.ceil(range / TILE);
    const tx0 = Math.floor(cx / TILE), ty0 = Math.floor(cy / TILE);
    const candidates = [];
    for (let ty = ty0 - tRange; ty <= ty0 + tRange; ty++) {
        for (let tx = tx0 - tRange; tx <= tx0 + tRange; tx++) {
            const prop = resolveDungeonPropAtTile(dungeon, tx, ty);
            if (!prop || isDungeonPropBroken(dungeon, tx, ty)) continue;
            const px = tx * TILE + TILE / 2;
            const py = ty * TILE + TILE / 2;
            const d = dist(cx, cy, px, py);
            if (d <= range) candidates.push({ tx, ty, prop, d });
        }
    }
    if (!candidates.length) return 0;
    candidates.sort((a, b) => a.d - b.d);
    let broken = 0;
    for (const c of candidates) {
        if (breakDungeonProp(c.tx, c.ty, c.prop)) {
            broken++;
            if (broken >= maxBreak) break;
        }
    }
    return broken;
}

function getClickableDungeonPropAtWorld(wx, wy, maxDist = TILE * 0.95) {
    if (!dungeon || G.inTown) return null;
    const tx0 = Math.floor(wx / TILE);
    const ty0 = Math.floor(wy / TILE);
    let best = null;
    for (let ty = ty0 - 1; ty <= ty0 + 1; ty++) {
        for (let tx = tx0 - 1; tx <= tx0 + 1; tx++) {
            const prop = resolveDungeonPropAtTile(dungeon, tx, ty);
            if (!prop || isDungeonPropBroken(dungeon, tx, ty)) continue;
            const px = tx * TILE + TILE / 2;
            const py = ty * TILE + TILE / 2;
            const d = dist(wx, wy, px, py);
            if (d > maxDist) continue;
            if (!best || d < best.d) best = { tx, ty, prop, px, py, d };
        }
    }
    return best;
}

// ========== TILE TEXTURE SYSTEM (Offscreen Canvas) ==========
// Pre-render tile textures for much better visual quality
const TILE_TEXTURES = {};

function generateTileTextures(theme) {
    theme = theme || 'cathedral';
    const actDef = Object.values(ACT_DEFS).find(a => a.tileTheme === theme) || ACT_DEFS[1];
    const themeColors = actDef.floorColors || { base: [24,22,20] };
    const themeWall = actDef.wallColors || {};

    // Helper: create noise pattern on a canvas
    function addNoise(tctx, w, h, intensity, r, g, b) {
        const id = tctx.getImageData(0, 0, w, h);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
            const n = (Math.random() - 0.5) * intensity;
            d[i] = clamp(d[i] + n * r, 0, 255);
            d[i+1] = clamp(d[i+1] + n * g, 0, 255);
            d[i+2] = clamp(d[i+2] + n * b, 0, 255);
        }
        tctx.putImageData(id, 0, 0);
    }

    // --- FLOOR TILES (9 variants — seamless, no borders) ---
    // Codex advice: no strokeRect borders, no bevels, low noise,
    // no per-variant identity marks. Differences = subtle color only.
    for (let v = 0; v < 9; v++) {
        const c = document.createElement('canvas');
        c.width = TILE; c.height = TILE;
        const tc = c.getContext('2d');

        // Base color from theme (subtle variation per variant)
        const darkF = 0.8;
        const baseR = Math.round((themeColors.base[0] + v * 1) * darkF);
        const baseG = Math.round((themeColors.base[1] + v * 1) * darkF);
        const baseB = Math.round((themeColors.base[2] + v * 0.5) * darkF);
        tc.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
        tc.fillRect(0, 0, TILE, TILE);

        // Very light stone grain noise (low intensity = less visible seams)
        addNoise(tc, TILE, TILE, 5, 1, 0.85, 0.7);

        TILE_TEXTURES['floor_' + v] = c;
    }

    // --- WALL TILE (exposed to floor, 3-row brick pattern) ---
    const wallC = document.createElement('canvas');
    wallC.width = TILE; wallC.height = TILE;
    const wc = wallC.getContext('2d');

    // Dark stone base (theme-based)
    wc.fillStyle = themeColors.wall || '#3d3228';
    wc.fillRect(0, 0, TILE, TILE);

    // Brick pattern (3 rows)
    const thirdH = Math.floor(TILE / 3);
    // Row 1: full width brick
    wc.fillStyle = themeWall.primary || '#44382c';
    wc.fillRect(2, 2, TILE - 4, thirdH - 3);
    // Row 2: two half bricks
    wc.fillStyle = themeWall.secondary || '#403428';
    wc.fillRect(2, thirdH + 1, TILE / 2 - 3, thirdH - 2);
    wc.fillStyle = themeWall.tertiary || '#3e3226';
    wc.fillRect(TILE / 2 + 1, thirdH + 1, TILE / 2 - 3, thirdH - 2);
    // Row 3: offset brick (1/3 + 2/3)
    wc.fillStyle = '#3b3024';
    wc.fillRect(2, thirdH * 2 + 1, TILE / 3 - 2, thirdH - 3);
    wc.fillStyle = '#42362a';
    wc.fillRect(TILE / 3 + 1, thirdH * 2 + 1, TILE - TILE / 3 - 3, thirdH - 3);

    // Mortar lines (D2 mortar color: #1e1610)
    wc.strokeStyle = '#1e1610';
    wc.lineWidth = 1;
    wc.beginPath();
    wc.moveTo(0, thirdH); wc.lineTo(TILE, thirdH); wc.stroke();
    wc.beginPath();
    wc.moveTo(0, thirdH * 2); wc.lineTo(TILE, thirdH * 2); wc.stroke();
    wc.beginPath();
    wc.moveTo(TILE / 2, thirdH); wc.lineTo(TILE / 2, thirdH * 2); wc.stroke();
    wc.beginPath();
    wc.moveTo(TILE / 3, thirdH * 2); wc.lineTo(TILE / 3, TILE); wc.stroke();

    // Top bevel / highlight gleam
    wc.fillStyle = 'rgba(255,240,200,0.08)';
    wc.fillRect(0, 0, TILE, 2);
    wc.fillStyle = 'rgba(255,240,200,0.03)';
    wc.fillRect(0, 2, TILE, 1);

    // ACT-specific wall accents
    if (theme === 'jungle') {
        // Moss creep on bottom
        wc.fillStyle = 'rgba(30,60,20,0.12)';
        wc.fillRect(0, TILE - 6, TILE, 6);
    } else if (theme === 'hell') {
        // Warm glow seam at mortar lines
        wc.fillStyle = 'rgba(200,60,0,0.06)';
        wc.fillRect(0, thirdH - 1, TILE, 3);
        wc.fillRect(0, thirdH * 2 - 1, TILE, 3);
    } else if (theme === 'ice') {
        // Frost rime on top edge
        wc.fillStyle = 'rgba(180,210,240,0.08)';
        wc.fillRect(0, 0, TILE, 4);
    } else if (theme === 'desert') {
        // Sand dust accumulation at bottom
        wc.fillStyle = 'rgba(80,65,40,0.1)';
        wc.fillRect(0, TILE - 4, TILE, 4);
    }
    // Stone grain
    addNoise(wc, TILE, TILE, 12, 1, 0.85, 0.65);

    TILE_TEXTURES['wall'] = wallC;

    // --- WALL TILE VARIANT 2 (offset 3-row) ---
    const wallC2 = document.createElement('canvas');
    wallC2.width = TILE; wallC2.height = TILE;
    const wc2 = wallC2.getContext('2d');
    wc2.fillStyle = '#3a3025';
    wc2.fillRect(0, 0, TILE, TILE);
    // Offset 3-row brick pattern
    wc2.fillStyle = '#403428';
    wc2.fillRect(2, 2, TILE / 2 - 3, thirdH - 3);
    wc2.fillStyle = '#3e3226';
    wc2.fillRect(TILE / 2 + 1, 2, TILE / 2 - 3, thirdH - 3);
    wc2.fillStyle = '#44382c';
    wc2.fillRect(2, thirdH + 1, TILE - 4, thirdH - 2);
    wc2.fillStyle = '#3c3026';
    wc2.fillRect(2, thirdH * 2 + 1, TILE * 2/3 - 3, thirdH - 3);
    wc2.fillStyle = '#403428';
    wc2.fillRect(TILE * 2/3 + 1, thirdH * 2 + 1, TILE / 3 - 3, thirdH - 3);
    wc2.strokeStyle = '#1e1610';
    wc2.lineWidth = 1;
    wc2.beginPath();
    wc2.moveTo(0, thirdH); wc2.lineTo(TILE, thirdH); wc2.stroke();
    wc2.beginPath();
    wc2.moveTo(0, thirdH * 2); wc2.lineTo(TILE, thirdH * 2); wc2.stroke();
    wc2.beginPath();
    wc2.moveTo(TILE / 2, 0); wc2.lineTo(TILE / 2, thirdH); wc2.stroke();
    wc2.beginPath();
    wc2.moveTo(TILE * 2/3, thirdH * 2); wc2.lineTo(TILE * 2/3, TILE); wc2.stroke();
    wc2.fillStyle = 'rgba(255,240,200,0.04)';
    wc2.fillRect(0, 0, TILE, 2);
    addNoise(wc2, TILE, TILE, 10, 1, 0.85, 0.65);
    TILE_TEXTURES['wall2'] = wallC2;

    // --- DEEP WALL (not adjacent to floor) ---
    const deepC = document.createElement('canvas');
    deepC.width = TILE; deepC.height = TILE;
    const dc = deepC.getContext('2d');
    dc.fillStyle = '#141210';
    dc.fillRect(0, 0, TILE, TILE);
    addNoise(dc, TILE, TILE, 8, 0.6, 0.5, 0.4);
    TILE_TEXTURES['deep_wall'] = deepC;

    // --- WALL FACE (3D bottom of wall when floor below - taller) ---
    const faceC = document.createElement('canvas');
    faceC.width = TILE; faceC.height = 14;
    const fc = faceC.getContext('2d');
    const faceG = fc.createLinearGradient(0, 0, 0, 14);
    faceG.addColorStop(0, '#3a2e22');
    faceG.addColorStop(0.3, '#352a20');
    faceG.addColorStop(0.7, '#2a201a');
    faceG.addColorStop(1, '#1a1510');
    fc.fillStyle = faceG;
    fc.fillRect(0, 0, TILE, 14);
    // Stone block lines
    fc.strokeStyle = 'rgba(0,0,0,0.3)';
    fc.lineWidth = 0.5;
    fc.beginPath(); fc.moveTo(TILE * 0.3, 0); fc.lineTo(TILE * 0.3, 14); fc.stroke();
    fc.beginPath(); fc.moveTo(TILE * 0.7, 0); fc.lineTo(TILE * 0.7, 14); fc.stroke();
    // Top highlight (wall edge gleam)
    fc.fillStyle = 'rgba(255,240,200,0.06)';
    fc.fillRect(0, 0, TILE, 2);
    // Bottom line
    fc.fillStyle = 'rgba(0,0,0,0.6)';
    fc.fillRect(0, 13, TILE, 1);
    addNoise(fc, TILE, 14, 10, 0.7, 0.6, 0.5);
    TILE_TEXTURES['wall_face'] = faceC;

    // --- BLOOD SPLATTER variants ---
    for (let v = 0; v < 3; v++) {
        const bc = document.createElement('canvas');
        bc.width = TILE; bc.height = TILE;
        const btc = bc.getContext('2d');
        btc.clearRect(0, 0, TILE, TILE);
        // Random blood drops
        const drops = 3 + v * 2;
        for (let d = 0; d < drops; d++) {
            const bx = 5 + Math.random() * (TILE - 10);
            const by = 5 + Math.random() * (TILE - 10);
            const br = 1 + Math.random() * (3 + v);
            btc.fillStyle = `rgba(${60 + v * 15},${8 + v * 3},${5 + v * 2},${0.15 + Math.random() * 0.15})`;
            btc.beginPath();
            btc.ellipse(bx, by, br, br * (0.6 + Math.random() * 0.8), Math.random() * Math.PI, 0, Math.PI * 2);
            btc.fill();
        }
        TILE_TEXTURES['blood_' + v] = bc;
    }

    // --- FLOOR SHADOW (cast from wall above) ---
    const shadowTopC = document.createElement('canvas');
    shadowTopC.width = TILE; shadowTopC.height = 14;
    const stc = shadowTopC.getContext('2d');
    const sg = stc.createLinearGradient(0, 0, 0, 14);
    sg.addColorStop(0, 'rgba(0,0,0,0.4)');
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    stc.fillStyle = sg;
    stc.fillRect(0, 0, TILE, 14);
    TILE_TEXTURES['shadow_top'] = shadowTopC;

    // --- FLOOR SHADOW (cast from wall on left) ---
    const shadowLeftC = document.createElement('canvas');
    shadowLeftC.width = 10; shadowLeftC.height = TILE;
    const slc = shadowLeftC.getContext('2d');
    const slg = slc.createLinearGradient(0, 0, 10, 0);
    slg.addColorStop(0, 'rgba(0,0,0,0.25)');
    slg.addColorStop(1, 'rgba(0,0,0,0)');
    slc.fillStyle = slg;
    slc.fillRect(0, 0, 10, TILE);
    TILE_TEXTURES['shadow_left'] = shadowLeftC;

    // --- FILM GRAIN (Pre-rendered noise overlay) ---
    const grainC = document.createElement('canvas');
    grainC.width = 256; grainC.height = 256;
    const gctx = grainC.getContext('2d');
    const gid = gctx.createImageData(256, 256);
    const gdata = gid.data;
    for (let i = 0; i < gdata.length; i += 4) {
        const v = (Math.random() * 30) | 0;
        gdata[i] = gdata[i+1] = gdata[i+2] = v;
        gdata[i+3] = 25;
    }
    gctx.putImageData(gid, 0, 0);
    TILE_TEXTURES['grain'] = grainC;

    // Override tile textures with sprite sheet if loaded
    if (spritesLoaded && SPRITES.tiles) {
        const overrides = {
            wall:'wallTop', wall2:'wallSide1', deep_wall:'deepWall',
            floor_0:'floorBlank', floor_1:'floor1', floor_2:'floor2', floor_3:'floor3',
            blood_0:'blood1', blood_1:'blood2', blood_2:'corpse1'
        };
        for (const [texKey, atlasKey] of Object.entries(overrides)) {
            const a = ATLAS[atlasKey];
            if (!a || !SPRITES[a[0]] || !TILE_TEXTURES[texKey]) continue;
            const c = TILE_TEXTURES[texKey];
            const tc = c.getContext('2d');
            tc.imageSmoothingEnabled = false;
            tc.clearRect(0, 0, c.width, c.height);
            tc.drawImage(SPRITES[a[0]], a[1], a[2], SP, SP, 0, 0, c.width, c.height);
        }
        // Wall face: bottom portion of catacomb wall side
        const wf = TILE_TEXTURES['wall_face'];
        if (wf) {
            const a = ATLAS.catWallSide;
            if (a && SPRITES[a[0]]) {
                const wfc = wf.getContext('2d');
                wfc.imageSmoothingEnabled = false;
                wfc.clearRect(0, 0, wf.width, wf.height);
                wfc.drawImage(SPRITES[a[0]], a[1], a[2] + 22, SP, 10, 0, 0, wf.width, wf.height);
            }
        }
    }

    // --- DUNGEON TILESET OVERRIDE (pre-rendered 3D stone tiles) ---
    // Replaces procedural floor tiles with dungeon_tileset isometric tiles
    // Crop strategy: top face of isometric block (sx=25, sy=0, sw=400, sh=215)
    const DT_TILES = ['dt_tile1','dt_tile2','dt_tile3','dt_tile4','dt_tile5','dt_tile6','dt_tile7'];
    const DT_ACT_TINT = {
        cathedral: null,                    // gray stone as-is
        desert: 'rgb(240,220,180)',         // warm sandstone
        jungle: 'rgb(190,225,185)',         // green moss
        hell: 'rgb(230,180,170)',           // red/dark
        ice: 'rgb(190,210,240)',            // blue/frost
    };
    if (ogaLoaded && OGA.dt_tile1) {
        // Floor tiles (floor_0 through floor_8)
        for (let v = 0; v < 9; v++) {
            const tileKey = DT_TILES[v % DT_TILES.length];
            const src = OGA[tileKey];
            if (!src) continue;
            const c = TILE_TEXTURES['floor_' + v];
            const tc = c.getContext('2d');
            tc.imageSmoothingEnabled = true;
            tc.clearRect(0, 0, TILE, TILE);
            // Crop top face of isometric block, scale to TILE×TILE
            tc.drawImage(src, 25, 0, 400, 215, 0, 0, TILE, TILE);
            // Variants 4-8: darken progressively for visual variety
            if (v >= 4) {
                tc.globalCompositeOperation = 'multiply';
                const dim = 235 - (v - 4) * 10;
                tc.fillStyle = `rgb(${dim},${dim},${dim})`;
                tc.fillRect(0, 0, TILE, TILE);
                tc.globalCompositeOperation = 'source-over';
            }
            // ACT-specific color tinting
            const tint = DT_ACT_TINT[theme];
            if (tint) {
                tc.globalCompositeOperation = 'multiply';
                tc.fillStyle = tint;
                tc.fillRect(0, 0, TILE, TILE);
                tc.globalCompositeOperation = 'source-over';
            }
        }
        // Wall tiles
        const w1 = TILE_TEXTURES['wall'];
        const w1c = w1.getContext('2d');
        w1c.imageSmoothingEnabled = true;
        w1c.clearRect(0, 0, TILE, TILE);
        w1c.drawImage(OGA.dt_tile1, 0, 0, 450, 392, 0, 0, TILE, TILE);
        // Wall 2 (different tile for variety)
        const w2 = TILE_TEXTURES['wall2'];
        const w2c = w2.getContext('2d');
        w2c.imageSmoothingEnabled = true;
        w2c.clearRect(0, 0, TILE, TILE);
        w2c.drawImage(OGA.dt_tile4, 0, 0, 450, 392, 0, 0, TILE, TILE);
        // Deep wall (heavily darkened)
        const dw = TILE_TEXTURES['deep_wall'];
        const dwc = dw.getContext('2d');
        dwc.imageSmoothingEnabled = true;
        dwc.clearRect(0, 0, TILE, TILE);
        dwc.drawImage(OGA.dt_tile1, 0, 0, 450, 392, 0, 0, TILE, TILE);
        dwc.globalCompositeOperation = 'multiply';
        dwc.fillStyle = 'rgb(80,80,80)';
        dwc.fillRect(0, 0, TILE, TILE);
        dwc.globalCompositeOperation = 'source-over';
        // Wall face: crop bottom/front face of isometric block
        const wf = TILE_TEXTURES['wall_face'];
        if (wf) {
            const wfc = wf.getContext('2d');
            wfc.imageSmoothingEnabled = true;
            wfc.clearRect(0, 0, wf.width, wf.height);
            wfc.drawImage(OGA.dt_tile1, 25, 250, 400, 142, 0, 0, wf.width, wf.height);
        }
    }

    // --- 2D PIXEL DUNGEON TILESET OVERRIDE ---
    // Real pixel art tiles with ACT-specific hue-rotate theming (Codex-validated approach)
    // Overrides all previous tile layers (procedural, sprite, dungeon_tileset)
    if (ogaLoaded && OGA.pixel_dungeon_ts) {
        const pdImg = OGA.pixel_dungeon_ts;
        const PD = 16; // 16px source tile cells in 10×10 grid (160×160)

        // ACT theme CSS filters (base tileset: dark purple-brown dungeon)
        // Codex advice: combine hue-rotate with saturate(1.1-1.4) and brightness(0.95-1.15)
        const PD_THEME = {
            cathedral: '',  // Original dark dungeon colors
            desert: 'hue-rotate(30deg) saturate(1.4) brightness(1.1)',
            jungle: 'hue-rotate(95deg) saturate(1.2)',
            hell: 'hue-rotate(330deg) saturate(1.5) brightness(1.1)',
            ice: 'hue-rotate(190deg) saturate(1.2) brightness(1.05)',
        };
        const pdF = PD_THEME[theme] || '';

        // Floor tiles: 9 variants from the auto-tile interior region
        // In the 10×10 grid, cols 1-3 rows 1-3 contain floor and transition tiles
        const pdFloor = [
            [1,1], [2,1], [3,1],
            [1,2], [2,2], [3,2],
            [1,3], [2,3], [3,3],
        ];
        for (let v = 0; v < 9; v++) {
            const [col, row] = pdFloor[v];
            const tex = TILE_TEXTURES['floor_' + v];
            const tc = tex.getContext('2d');
            tc.clearRect(0, 0, TILE, TILE);
            tc.imageSmoothingEnabled = false;
            if (pdF) tc.filter = pdF;
            tc.drawImage(pdImg, col * PD, row * PD, PD, PD, 0, 0, TILE, TILE);
            tc.filter = 'none';
        }

        // Wall tiles (stone block surface viewed from above)
        for (const [key, col, row] of [['wall', 0, 0], ['wall2', 2, 0]]) {
            const tex = TILE_TEXTURES[key];
            const tc = tex.getContext('2d');
            tc.clearRect(0, 0, TILE, TILE);
            tc.imageSmoothingEnabled = false;
            if (pdF) tc.filter = pdF;
            tc.drawImage(pdImg, col * PD, row * PD, PD, PD, 0, 0, TILE, TILE);
            tc.filter = 'none';
        }

        // Deep wall (unexposed walls = very dark void)
        {
            const dw = TILE_TEXTURES['deep_wall'];
            const dwc = dw.getContext('2d');
            dwc.clearRect(0, 0, TILE, TILE);
            dwc.imageSmoothingEnabled = false;
            dwc.filter = (pdF ? pdF + ' ' : '') + 'brightness(0.2)';
            dwc.drawImage(pdImg, 1 * PD, 1 * PD, PD, PD, 0, 0, TILE, TILE);
            dwc.filter = 'none';
        }

        // Wall face (vertical face below exposed walls, squished wall tile + darkened)
        {
            const wf = TILE_TEXTURES['wall_face'];
            if (wf) {
                const wfc = wf.getContext('2d');
                wfc.clearRect(0, 0, wf.width, wf.height);
                wfc.imageSmoothingEnabled = false;
                wfc.filter = (pdF ? pdF + ' ' : '') + 'brightness(0.5)';
                wfc.drawImage(pdImg, 0, 0, PD, PD, 0, 0, wf.width, wf.height);
                wfc.filter = 'none';
                wfc.fillStyle = 'rgba(0,0,0,0.5)';
                wfc.fillRect(0, wf.height - 2, wf.width, 2);
            }
        }

        console.log('2D Pixel Dungeon tiles:', theme, pdF || '(original)');
    }

    // --- GLOBAL DARKENING PASS (multiply composite) ---
    const darkenKeys = ['floor_0','floor_1','floor_2','floor_3','floor_4','floor_5','floor_6','floor_7','floor_8','wall','wall2'];
    for (const key of darkenKeys) {
        const tex = TILE_TEXTURES[key];
        if (!tex) continue;
        const tc = tex.getContext('2d');
        tc.globalCompositeOperation = 'multiply';
        // Minimal darkening for pixel art tileset (preserve detail), heavier for procedural
        tc.fillStyle = ogaLoaded && OGA.pixel_dungeon_ts ? 'rgb(252,250,248)' :
                       (ogaLoaded && OGA.dt_tile1 ? 'rgb(240,235,230)' : 'rgb(220,215,210)');
        tc.fillRect(0, 0, tex.width, tex.height);
        tc.globalCompositeOperation = 'source-over';
    }
}

// ========== DUNGEON GENERATION ==========
class Dungeon {
    constructor(floor) {
        this.floor = floor;
        this.tiles = new Uint8Array(MAP_W * MAP_H); // 0=wall, 1=floor, 2=stairs, 3=chest
        this.rooms = [];
        this.explored = new Uint8Array(MAP_W * MAP_H);
        this.brokenProps = new Set();
        this.minimapDirty = true;
        this.minimapCache = null;
        this.torchPositions = []; // cached torch world positions
        this.generate();
        this._cacheTorchPositions();
    }
    _cacheTorchPositions() {
        this.torchPositions = [];
        for (let y = 0; y < MAP_H; y++) {
            for (let x = 0; x < MAP_W; x++) {
                if (this.get(x, y) !== 0) continue;
                const isExposed = this.walkable(x, y+1) || this.walkable(x+1, y) || this.walkable(x-1, y) || this.walkable(x, y-1);
                if (isExposed && (x * 7 + y * 13) % 29 === 0) {
                    this.torchPositions.push({ wx: x * TILE + TILE/2, wy: y * TILE + TILE/2 - 4, seed: x * 3 + y * 5 });
                }
            }
        }
    }
    idx(x, y) { return y * MAP_W + x; }
    get(x, y) {
        if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return 0;
        return this.tiles[this.idx(x, y)];
    }
    set(x, y, v) {
        if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) this.tiles[this.idx(x, y)] = v;
    }
    walkable(x, y) { const t = this.get(x, y); return t === 1 || t === 2 || t === 3; }

    generate() {
        this.tiles.fill(0);
        const roomCount = 8 + Math.min(this.floor, 8);

        // Generate rooms with varied sizes
        for (let i = 0; i < roomCount * 3 && this.rooms.length < roomCount; i++) {
            // Varied room shapes
            const shapeRoll = _rng();
            let w, h;
            if (shapeRoll < 0.4) {
                // Normal room
                w = rand(4, 9); h = rand(4, 7);
            } else if (shapeRoll < 0.7) {
                // Long corridor room
                if (_rng() < 0.5) { w = rand(8, 14); h = rand(3, 4); }
                else { w = rand(3, 4); h = rand(8, 14); }
            } else if (shapeRoll < 0.9) {
                // Large room
                w = rand(8, 12); h = rand(7, 10);
            } else {
                // Tiny room
                w = rand(3, 5); h = rand(3, 5);
            }

            const rx = rand(2, MAP_W - w - 2);
            const ry = rand(2, MAP_H - h - 2);

            let valid = true;
            for (const r of this.rooms) {
                if (rx < r.x + r.w + 2 && rx + w + 2 > r.x && ry < r.y + r.h + 2 && ry + h + 2 > r.y) {
                    valid = false; break;
                }
            }
            if (!valid) continue;

            this.rooms.push({ x: rx, y: ry, w, h, cx: rx + (w>>1), cy: ry + (h>>1) });

            // Carve room with optional irregular edges
            for (let yy = ry; yy < ry + h; yy++) {
                for (let xx = rx; xx < rx + w; xx++) {
                    // Cut corners for organic feel
                    const isCorner = (xx === rx && yy === ry) || (xx === rx + w - 1 && yy === ry) ||
                                    (xx === rx && yy === ry + h - 1) || (xx === rx + w - 1 && yy === ry + h - 1);
                    if (isCorner && _rng() < 0.4) continue;
                    this.set(xx, yy, 1);
                }
            }
        }

        // Sort rooms for better connectivity (nearest-neighbor)
        if (this.rooms.length > 2) {
            const sorted = [this.rooms[0]];
            const remaining = this.rooms.slice(1);
            while (remaining.length > 0) {
                const last = sorted[sorted.length - 1];
                let bestIdx = 0, bestDist = Infinity;
                for (let i = 0; i < remaining.length; i++) {
                    const d = Math.hypot(remaining[i].cx - last.cx, remaining[i].cy - last.cy);
                    if (d < bestDist) { bestDist = d; bestIdx = i; }
                }
                sorted.push(remaining.splice(bestIdx, 1)[0]);
            }
            this.rooms = sorted;
        }

        // Connect rooms with winding corridors
        for (let i = 1; i < this.rooms.length; i++) {
            const a = this.rooms[i - 1], b = this.rooms[i];
            let cx = a.cx, cy = a.cy;

            // Randomly choose horizontal-first or vertical-first
            if (_rng() < 0.5) {
                // Horizontal then vertical
                while (cx !== b.cx) {
                    this.set(cx, cy, 1);
                    // Widen corridor occasionally
                    if (_rng() < 0.3) this.set(cx, cy + 1, 1);
                    cx += cx < b.cx ? 1 : -1;
                }
                while (cy !== b.cy) {
                    this.set(cx, cy, 1);
                    if (_rng() < 0.3) this.set(cx + 1, cy, 1);
                    cy += cy < b.cy ? 1 : -1;
                }
            } else {
                // Vertical then horizontal
                while (cy !== b.cy) {
                    this.set(cx, cy, 1);
                    if (_rng() < 0.3) this.set(cx + 1, cy, 1);
                    cy += cy < b.cy ? 1 : -1;
                }
                while (cx !== b.cx) {
                    this.set(cx, cy, 1);
                    if (_rng() < 0.3) this.set(cx, cy + 1, 1);
                    cx += cx < b.cx ? 1 : -1;
                }
            }
            this.set(cx, cy, 1);
        }

        // Extra connections for loops (makes dungeon more interesting)
        const extraLoops = rand(2, Math.min(this.rooms.length - 1, 5));
        for (let i = 0; i < extraLoops; i++) {
            const a = this.rooms[rand(0, this.rooms.length - 1)];
            const b = this.rooms[rand(0, this.rooms.length - 1)];
            if (a === b) continue;
            let cx = a.cx, cy = a.cy;
            // Slightly drunk walk for organic corridors
            while (cx !== b.cx || cy !== b.cy) {
                this.set(cx, cy, 1);
                if (_rng() < 0.15 && cx !== b.cx && cy !== b.cy) {
                    // Random wobble
                    if (_rng() < 0.5) cx += cx < b.cx ? 1 : -1;
                    else cy += cy < b.cy ? 1 : -1;
                } else {
                    // Move toward target
                    if (Math.abs(b.cx - cx) > Math.abs(b.cy - cy))
                        cx += cx < b.cx ? 1 : -1;
                    else
                        cy += cy < b.cy ? 1 : -1;
                }
            }
            this.set(cx, cy, 1);
        }

        // Place stairs in the room farthest from start
        const startRoom = this.rooms[0];
        let farthestRoom = this.rooms[this.rooms.length - 1];
        let farthestDist = 0;
        for (const r of this.rooms) {
            const d = Math.hypot(r.cx - startRoom.cx, r.cy - startRoom.cy);
            if (d > farthestDist) { farthestDist = d; farthestRoom = r; }
        }
        this.stairsX = farthestRoom.cx;
        this.stairsY = farthestRoom.cy;
        this.set(this.stairsX, this.stairsY, 2);

        // Chests in some rooms (never in first or stairs room)
        for (let i = 1; i < this.rooms.length; i++) {
            const r = this.rooms[i];
            if (r === farthestRoom) continue;
            if (_rng() < 0.3) {
                const cx = r.x + rand(1, r.w - 2);
                const cy = r.y + rand(1, r.h - 2);
                if (this.get(cx, cy) === 1) this.set(cx, cy, 3);
            }
        }

        // Scatter some random floor decorations (pillars = unwalkable in floor)
        for (const r of this.rooms) {
            if (r.w >= 7 && r.h >= 6 && _rng() < 0.4) {
                // Add pillars to big rooms
                const px1 = r.x + 2, py1 = r.y + 2;
                const px2 = r.x + r.w - 3, py2 = r.y + r.h - 3;
                this.set(px1, py1, 0); this.set(px2, py1, 0);
                this.set(px1, py2, 0); this.set(px2, py2, 0);
            }
        }
    }

    reveal(px, py, radius) {
        const tr = Math.ceil(radius / TILE);
        const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
        for (let dy = -tr; dy <= tr; dy++) {
            for (let dx = -tr; dx <= tr; dx++) {
                const xx = tx + dx, yy = ty + dy;
                if (xx >= 0 && xx < MAP_W && yy >= 0 && yy < MAP_H) {
                    if (dx*dx + dy*dy <= tr*tr) {
                        if (!this.explored[this.idx(xx, yy)]) this.minimapDirty = true;
                        this.explored[this.idx(xx, yy)] = 1;
                    }
                }
            }
        }
    }

    draw(camX, camY) {
        if (isIsoView()) {
            this.drawIso();
            return;
        }
        const startX = Math.max(0, Math.floor(camX / TILE) - 1);
        const startY = Math.max(0, Math.floor(camY / TILE) - 1);
        const endX = Math.min(MAP_W, startX + Math.ceil(W / TILE) + 3);
        const endY = Math.min(MAP_H, startY + Math.ceil(H / TILE) + 3);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const sx = x * TILE - camX, sy = y * TILE - camY;
                const t = this.get(x, y);

                if (t === 0) {
                    // === WALL ===
                    const hasFloorBelow = this.walkable(x, y + 1);
                    const hasFloorRight = this.walkable(x + 1, y);
                    const hasFloorLeft = this.walkable(x - 1, y);
                    const hasFloorAbove = this.walkable(x, y - 1);
                    const isExposed = hasFloorBelow || hasFloorRight || hasFloorLeft || hasFloorAbove;

                    if (isExposed) {
                        // Pre-rendered wall texture
                        const wallTex = (x + y) % 2 === 0 ? TILE_TEXTURES['wall'] : TILE_TEXTURES['wall2'];
                        ctx.drawImage(wallTex, sx, sy);

                        // 3D wall face below (taller)
                        if (hasFloorBelow) {
                            ctx.drawImage(TILE_TEXTURES['wall_face'], sx, sy + TILE - 14);
                        }

                        // Moss (deterministic)
                        if ((x * 13 + y * 7) % 23 === 0) {
                            ctx.fillStyle = 'rgba(35,60,25,0.2)';
                            ctx.fillRect(sx + 2, sy + TILE - 14, 8, 5);
                            ctx.fillStyle = 'rgba(40,70,28,0.15)';
                            ctx.fillRect(sx + 4, sy + TILE - 16, 4, 3);
                        }

                        // Wall crack
                        if ((x * 11 + y * 3) % 31 === 0) {
                            ctx.strokeStyle = 'rgba(0,0,0,0.25)';
                            ctx.lineWidth = 0.5;
                            ctx.beginPath();
                            ctx.moveTo(sx + 10, sy + 4);
                            ctx.lineTo(sx + 16, sy + 14);
                            ctx.lineTo(sx + 13, sy + 28);
                            ctx.stroke();
                        }
                    } else {
                        ctx.drawImage(TILE_TEXTURES['deep_wall'], sx, sy);
                    }

                    // Torch on wall (animated sprite + enhanced glow)
                    if (isExposed && (x * 7 + y * 13) % 29 === 0) {
                        const torchFrame = Math.floor((G.time * 6 + x * 3 + y * 5) % 6);
                        const fl = Math.sin(G.time * 8 + x * 3 + y * 5) * 3;
                        // Outer soft glow (large, faint)
                        const outerR = 55 + fl * 4;
                        const outerG = ctx.createRadialGradient(sx + TILE/2, sy + TILE/2 - 4, 0, sx + TILE/2, sy + TILE/2 - 4, outerR);
                        outerG.addColorStop(0, 'rgba(255,160,64,0.15)');
                        outerG.addColorStop(0.4, 'rgba(255,96,16,0.06)');
                        outerG.addColorStop(1, 'rgba(255,80,10,0)');
                        ctx.fillStyle = outerG;
                        ctx.fillRect(sx + TILE/2 - outerR, sy + TILE/2 - 4 - outerR, outerR * 2, outerR * 2);
                        drawSpr('torch' + torchFrame, sx, sy, TILE, TILE);
                        // Inner core glow (small, bright)
                        const innerR = 12 + fl;
                        const innerG = ctx.createRadialGradient(sx + TILE/2, sy + TILE/2 - 8, 0, sx + TILE/2, sy + TILE/2 - 8, innerR);
                        innerG.addColorStop(0, 'rgba(255,220,140,0.3)');
                        innerG.addColorStop(0.5, 'rgba(255,160,64,0.12)');
                        innerG.addColorStop(1, 'rgba(255,128,32,0)');
                        ctx.fillStyle = innerG;
                        ctx.fillRect(sx + TILE/2 - innerR, sy + TILE/2 - 8 - innerR, innerR * 2, innerR * 2);
                    }

                    // Pillar detection (isolated wall surrounded by floor on 3+ sides)
                    if (isExposed) {
                        const floorCount = (hasFloorBelow?1:0) + (this.walkable(x+1,y)?1:0) + (this.walkable(x-1,y)?1:0) + (this.walkable(x,y-1)?1:0);
                        if (floorCount >= 3) {
                            // Draw as pillar with highlight
                            ctx.fillStyle = 'rgba(255,240,200,0.03)';
                            ctx.fillRect(sx + 4, sy + 2, TILE - 8, TILE - 4);
                            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                            ctx.lineWidth = 0.5;
                            ctx.strokeRect(sx + 4, sy + 2, TILE - 8, TILE - 4);
                        }
                    }

                } else if (t === 1) {
                    // === FLOOR ===
                    // Better hash to avoid directional striping (Codex advice)
                    const variant = ((x * 2654435761 + y * 2246822519) >>> 0) % 9;
                    ctx.drawImage(TILE_TEXTURES['floor_' + variant], sx, sy);

                    // Large-scale tint overlay: subtle color zones spanning ~4 tiles
                    // Breaks the 40px repetition cadence without adding per-tile detail
                    const zoneX = Math.floor(x / 4), zoneY = Math.floor(y / 4);
                    const zoneHash = ((zoneX * 1597334677 + zoneY * 3812015801) >>> 0) % 100;
                    if (zoneHash < 30) {
                        // Darker patch (worn stone / dampness)
                        ctx.fillStyle = 'rgba(0,0,0,0.04)';
                        ctx.fillRect(sx, sy, TILE, TILE);
                    } else if (zoneHash < 50) {
                        // Warmer patch (torch-lit area)
                        ctx.fillStyle = 'rgba(40,25,10,0.03)';
                        ctx.fillRect(sx, sy, TILE, TILE);
                    }

                    // Blood splatters (rare, pre-rendered texture)
                    const bloodHash = (x * 17 + y * 31) % 53;
                    if (bloodHash < 2) {
                        ctx.drawImage(TILE_TEXTURES['blood_' + (bloodHash % 3)], sx, sy);
                    }

                    // Wall shadows
                    if (this.get(x, y - 1) === 0) {
                        ctx.drawImage(TILE_TEXTURES['shadow_top'], sx, sy);
                    }
                    if (this.get(x - 1, y) === 0) {
                        ctx.drawImage(TILE_TEXTURES['shadow_left'], sx, sy);
                    }

                    // Sparse dungeon props near walls for variety without visual noise
                    const prop = resolveDungeonPropAtTile(this, x, y);
                    if (prop && !isDungeonPropBroken(this, x, y)) {
                        // Highlight if hovered or targeted
                        const isHovered = hoveredProp && hoveredProp.tx === x && hoveredProp.ty === y;
                        const isTargeted = player.targetBreakProp && player.targetBreakProp.tx === x && player.targetBreakProp.ty === y;
                        if (isHovered || isTargeted) {
                            const highlightColor = isTargeted ? 'rgba(255,200,80,0.4)' : 'rgba(255,220,120,0.35)';
                            const glowRadius = TILE * 0.8;
                            const glow = ctx.createRadialGradient(sx + TILE/2, sy + TILE/2, 0, sx + TILE/2, sy + TILE/2, glowRadius);
                            glow.addColorStop(0, highlightColor);
                            glow.addColorStop(0.5, 'rgba(255,200,80,0.15)');
                            glow.addColorStop(1, 'rgba(255,180,60,0)');
                            ctx.fillStyle = glow;
                            ctx.fillRect(sx - glowRadius/2, sy - glowRadius/2, glowRadius * 1.5, glowRadius * 1.5);
                        }
                        drawKenneyDungeonProp(prop.key, sx, sy, prop.scale);
                    }

                } else if (t === 2) {
                    // === STAIRS (Sprite) ===
                    const variant = ((x * 2654435761 + y * 2246822519) >>> 0) % 9;
                    ctx.drawImage(TILE_TEXTURES['floor_' + variant], sx, sy);
                    if (ogaLoaded && OGA.kenney_stairs) {
                        const ksW = Math.round(TILE * 1.4);
                        const ksH = Math.round(ksW * (OGA.kenney_stairs.height / OGA.kenney_stairs.width));
                        ctx.drawImage(OGA.kenney_stairs, sx + (TILE - ksW) / 2, sy + TILE - ksH, ksW, ksH);
                    } else {
                        drawSpr('stairsDown', sx, sy, TILE, TILE);
                    }

                    // D2-style gold ethereal glow
                    const glowPulse = Math.sin(G.time * 2.5) * 0.05;
                    const sg = ctx.createRadialGradient(sx + TILE/2, sy + TILE/2, 0, sx + TILE/2, sy + TILE/2, TILE * 1.3);
                    sg.addColorStop(0, `rgba(200,170,80,${0.3 + glowPulse})`);
                    sg.addColorStop(0.3, `rgba(180,140,50,${0.15 + glowPulse})`);
                    sg.addColorStop(0.6, 'rgba(160,120,40,0.05)');
                    sg.addColorStop(1, 'rgba(140,100,30,0)');
                    ctx.fillStyle = sg;
                    ctx.fillRect(sx - TILE/2, sy - TILE/2, TILE * 2, TILE * 2);

                    // Gold sparkles
                    for (let i = 0; i < 4; i++) {
                        const sa = G.time * 2 + i * 1.57;
                        const spx = sx + TILE/2 + Math.cos(sa) * 14;
                        const spy = sy + TILE/2 + Math.sin(sa * 1.3) * 10 - 4;
                        ctx.fillStyle = `rgba(220,190,100,${0.25 + Math.sin(sa * 3) * 0.15})`;
                        ctx.beginPath();
                        ctx.arc(spx, spy, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }

                } else if (t === 3) {
                    // === CHEST (Sprite) ===
                    const variant = ((x * 7 + y * 13) % 9);
                    ctx.drawImage(TILE_TEXTURES['floor_' + variant], sx, sy);
                    // Use dungeon_tileset chest if available, fallback to sprite
                    if (ogaLoaded && OGA.dt_chest_closed) {
                        const chImg = OGA.dt_chest_closed;
                        const cSz = Math.min(chImg.width, chImg.height);
                        const cx = (chImg.width - cSz) / 2;
                        const cy = (chImg.height - cSz) / 2;
                        ctx.drawImage(chImg, cx, cy, cSz, cSz, sx, sy, TILE, TILE);
                    } else {
                        drawSpr('chestClosed', sx, sy, TILE, TILE);
                    }
                    // Gold glow
                    ctx.globalAlpha = 0.12;
                    ctx.fillStyle = '#c8a030';
                    ctx.beginPath();
                    ctx.arc(sx + TILE/2, sy + TILE/2, TILE * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            }
        }
    }

    drawIso() {
        // Painter order for diamond tiles: back-to-front by (x + y).
        // In iso mode we draw the whole map (60x60 = 3600 tiles), which is acceptable and simpler.
        const diamondW = TILE;
        const diamondH = TILE / 2;
        const drawVariant = (x, y) => (((x * 2654435761 + y * 2246822519) >>> 0) % 9);

        for (let sum = 0; sum <= (MAP_W - 1) + (MAP_H - 1); sum++) {
            const x0 = Math.max(0, sum - (MAP_H - 1));
            const x1 = Math.min(MAP_W - 1, sum);
            for (let x = x0; x <= x1; x++) {
                const y = sum - x;
                const t = this.get(x, y);

                const wx = x * TILE + TILE / 2;
                const wy = y * TILE + TILE / 2;
                const sp = worldToScreen(wx, wy);
                const sx = sp.x, sy = sp.y;

                // Basic culling
                if (sx < -diamondW || sx > W + diamondW || sy < -diamondH * 2 || sy > H + diamondH * 2) continue;

                if (t === 1 || t === 2 || t === 3) {
                    const variant = drawVariant(x, y);
                    const tex = TILE_TEXTURES['floor_' + variant];
                    drawIsoDiamond(tex, sx, sy, diamondW, diamondH, 1, null, '#202020');
                } else {
                    // Wall: draw top diamond + a simple south-facing vertical face for depth.
                    const wallTex = (x + y) % 2 === 0 ? TILE_TEXTURES['wall'] : TILE_TEXTURES['wall2'];
                    drawIsoDiamond(wallTex, sx, sy, diamondW, diamondH, 1, 'brightness(0.55)', '#0a0a0a');

                    // South face (only if adjacent to walkable tile below).
                    if (this.walkable(x, y + 1)) {
                        const wallH = Math.round(diamondH * 1.6);
                        const g = ctx.createLinearGradient(0, sy, 0, sy + wallH);
                        g.addColorStop(0, 'rgba(0,0,0,0.25)');
                        g.addColorStop(1, 'rgba(0,0,0,0.55)');
                        ctx.fillStyle = g;
                        ctx.beginPath();
                        ctx.moveTo(sx - diamondW / 2, sy);
                        ctx.lineTo(sx + diamondW / 2, sy);
                        ctx.lineTo(sx + diamondW / 2, sy + wallH);
                        ctx.lineTo(sx - diamondW / 2, sy + wallH);
                        ctx.closePath();
                        ctx.fill();
                        // Edge line for readability
                        ctx.globalAlpha = 0.35;
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(sx - diamondW / 2, sy);
                        ctx.lineTo(sx + diamondW / 2, sy);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                }

                // Overlay props on walkable tiles (stairs/chest only for now).
                if (t === 2) {
                    if (ogaLoaded && OGA.kenney_stairs) {
                        const ksW = Math.round(TILE * 1.2);
                        const ksH = Math.round(ksW * (OGA.kenney_stairs.height / OGA.kenney_stairs.width));
                        ctx.drawImage(OGA.kenney_stairs, sx - ksW / 2, sy - ksH + diamondH * 0.2, ksW, ksH);
                    } else {
                        drawSpr('stairsDown', sx - TILE / 2, sy - TILE / 2, TILE, TILE);
                    }
                } else if (t === 3) {
                    if (ogaLoaded && OGA.dt_chest_closed) {
                        const chImg = OGA.dt_chest_closed;
                        const cSz = Math.min(chImg.width, chImg.height);
                        const cx = (chImg.width - cSz) / 2;
                        const cy = (chImg.height - cSz) / 2;
                        ctx.drawImage(chImg, cx, cy, cSz, cSz, sx - TILE / 2, sy - TILE / 2, TILE, TILE);
                    } else {
                        drawSpr('chestClosed', sx - TILE / 2, sy - TILE / 2, TILE, TILE);
                    }
                }
            }
        }
    }
}

