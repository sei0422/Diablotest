// ========== DUNGEON INIT ==========
let dungeon;
let tileTexturesReady = false;
function initFloor(opts) {
    // opts: { useSeed: bool, skipEntities: bool }
    opts = opts || {};
    const actDef = getCurrentActDef();
    G.floor = getGlobalFloor(G.act, G.actFloor, G.cycle);
    G.inTown = false;
    // Switch to dungeon BGM for current ACT
    if (audioCtx && SETTINGS.sound) startBGM(G.act);

    generateTileTextures(actDef.tileTheme); tileTexturesReady = true;

    // Use seeded RNG for dungeon generation so save/load produces same layout
    if (opts.useSeed && G.dungeonSeed) {
        seedRng(G.dungeonSeed);
    } else {
        // Generate new seed for this floor
        G.dungeonSeed = (Math.random() * 0x7FFFFFFF) | 0;
        seedRng(G.dungeonSeed);
    }

    dungeon = new Dungeon(G.floor);
    dungeon._tileTheme = actDef.tileTheme || 'cathedral';

    // Clear visual-only arrays always
    projectiles.length = 0;
    enemyProjectiles.length = 0;
    particles.length = 0;
    bloodPools.length = 0;
    ambientParticles.length = 0;

    G.traps = [];
    G.consecrations = [];
    G.minions = [];
    G.spawnTimer = 0;
    mercProjectiles.length = 0;

    if (!opts.skipEntities) {
        // Normal flow: set player at start room, spawn fresh monsters/items
        const r0 = dungeon.rooms[0];
        player.x = r0.cx * TILE + TILE/2;
        player.y = r0.cy * TILE + TILE/2;
        player.targetX = player.x;
        player.targetY = player.y;
        player.moving = false;
        player.attacking = false;
        // Teleport mercenary
        if (mercenary && mercenary.alive) { mercenary.x = player.x + 40; mercenary.y = player.y; mercenary.target = null; }
        monsters.length = 0;
        groundItems.length = 0;

        // D2-style area system: Get current area for density and display
        const currentArea = getCurrentArea(G.act, G.actFloor);

        // Spawn monsters using ACT-specific types with area density
        let count = 15 + G.actFloor * 8; // default: medium
        if (currentArea) {
            // D2-style density control: low/medium/high/boss
            switch (currentArea.density) {
                case 'low':    count = 10 + G.actFloor * 5; break;
                case 'medium': count = 15 + G.actFloor * 8; break;
                case 'high':   count = 20 + G.actFloor * 12; break;
                case 'boss':   count = 5 + G.actFloor * 2; break; // fewer normal monsters on boss floors
            }
        }
        const types = actDef.monsterTypes;

        for (let i = 0; i < count; i++) {
            const room = dungeon.rooms[rand(1, dungeon.rooms.length - 1)];
            const mx = room.x * TILE + rand(TILE, (room.w - 1) * TILE);
            const my = room.y * TILE + rand(TILE, (room.h - 1) * TILE);
            const m = new Monster(mx, my, types[rand(0, types.length - 1)], G.floor);
            // Champion/Unique roll: 8% champion, 2% unique
            const champRoll = Math.random();
            if (champRoll < 0.02) { m.makeUnique(); }
            else if (champRoll < 0.10) { m.makeChampion(); }
            monsters.push(m);
        }

        // Boss on final floor of each ACT
        if (isBossFloor() && actDef.bossType) {
            const bossRoom = dungeon.rooms[dungeon.rooms.length - 2] || dungeon.rooms[dungeon.rooms.length - 1];
            const bm = new Monster(bossRoom.cx * TILE + TILE/2, bossRoom.cy * TILE + TILE/2,
                actDef.monsterTypes[0], G.floor, actDef.bossType);
            monsters.push(bm);
            const bd = BOSS_DEFS[actDef.bossType];
            addLog(`⚠ ${bd ? bd.name : 'ボス'}が現れた！`, '#ff0000');
        }

        // D2-style area name in log
        const areaName = currentArea ? ` [${currentArea.name}]` : '';
        addLog(`ACT${G.act} ${actDef.name} - 第${G.actFloor}層${areaName}${G.cycle > 0 ? ' (' + (G.cycle+1) + '周目)' : ''}`, '#aaaaff');
    }

    // Switch back to normal RNG after dungeon generation
    unseedRng();
}

// ========== TOWN SYSTEM ==========
const townNPCs = [];

class TownMap {
    constructor(act) {
        this.act = act;
        this.tiles = new Uint8Array(MAP_W * MAP_H);
        this.rooms = [];
        this.explored = new Uint8Array(MAP_W * MAP_H);
        this.explored.fill(1); // Town is fully explored
        this.torchPositions = [];
        this.stairsX = 0; this.stairsY = 0;
        this._generate();
        this._cacheTorchPositions();
    }
    _generate() {
        this.tiles.fill(0);
        // Central plaza
        const px = Math.floor(MAP_W / 2) - 8, py = Math.floor(MAP_H / 2) - 6;
        const pw = 16, ph = 12;
        for (let y = py; y < py + ph; y++)
            for (let x = px; x < px + pw; x++) this.set(x, y, 1);
        this.rooms.push({ x: px, y: py, w: pw, h: ph, cx: px + pw/2, cy: py + ph/2 });

        // NPC alcoves around plaza
        const alcovePositions = [
            { x: px - 6, y: py + 2 }, { x: px + pw + 1, y: py + 2 },
            { x: px - 6, y: py + ph - 6 }, { x: px + pw + 1, y: py + ph - 6 },
            { x: px + pw/2 - 2, y: py - 6 },
            { x: px + pw/2 - 8, y: py + ph + 1 }, { x: px + pw/2 + 4, y: py + ph + 1 },
            { x: px + pw/2 + 7, y: py - 6 }
        ];
        for (const ap of alcovePositions) {
            for (let y = ap.y; y < ap.y + 5; y++)
                for (let x = ap.x; x < ap.x + 5; x++) this.set(x, y, 1);
            this.rooms.push({ x: ap.x, y: ap.y, w: 5, h: 5, cx: ap.x + 2, cy: ap.y + 2 });
            // Corridor to plaza
            const cx = ap.x + 2, cy = ap.y + 2;
            const pcx = px + pw/2, pcy = py + ph/2;
            let wx = cx, wy = cy;
            while (Math.abs(wx - pcx) > 1 || Math.abs(wy - pcy) > 1) {
                if (Math.abs(wx - pcx) > Math.abs(wy - pcy)) wx += wx < pcx ? 1 : -1;
                else wy += wy < pcy ? 1 : -1;
                this.set(wx, wy, 1);
                this.set(wx + 1, wy, 1);
                this.set(wx, wy + 1, 1);
            }
        }

        // Stairs (dungeon entrance) at bottom of plaza
        this.stairsX = px + pw/2;
        this.stairsY = py + ph - 2;
        this.set(this.stairsX, this.stairsY, 2);
    }
    _cacheTorchPositions() {
        this.torchPositions = [];
        for (let y = 0; y < MAP_H; y++) {
            for (let x = 0; x < MAP_W; x++) {
                if (this.get(x, y) !== 0) continue;
                const isExposed = this.walkable(x, y+1) || this.walkable(x+1, y) || this.walkable(x-1, y) || this.walkable(x, y-1);
                if (isExposed && (x * 7 + y * 13) % 19 === 0) {
                    this.torchPositions.push({ wx: x * TILE + TILE/2, wy: y * TILE + TILE/2 - 4, seed: x * 3 + y * 5 });
                }
            }
        }
    }
    idx(x, y) { return y * MAP_W + x; }
    get(x, y) { if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return 0; return this.tiles[this.idx(x, y)]; }
    set(x, y, v) { if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) this.tiles[this.idx(x, y)] = v; }
    walkable(x, y) { const t = this.get(x, y); return t === 1 || t === 2; }
    reveal() {} // Town is always explored
}
// Copy Dungeon's draw and reveal methods to TownMap prototype
TownMap.prototype.draw = Dungeon.prototype.draw;
// TownMap.reveal is a no-op (already fully explored)

function enterTown(act) {
    G.act = act;
    G.actFloor = 0; // 0 = town
    G.inTown = true;
    G.inUber = false;
    G.floor = getGlobalFloor(act, 1, G.cycle); // for scaling reference
    // Switch to town BGM
    if (audioCtx && SETTINGS.sound) startBGM(act);

    generateTileTextures(ACT_DEFS[act].tileTheme); tileTexturesReady = true;

    dungeon = new TownMap(act);

    // Clear arrays
    projectiles.length = 0;
    enemyProjectiles.length = 0;
    particles.length = 0;
    bloodPools.length = 0;
    ambientParticles.length = 0;
    monsters.length = 0;
    groundItems.length = 0;
    G.traps = [];
    G.consecrations = [];
    G.minions = [];

    // Place player at plaza center
    const r0 = dungeon.rooms[0];
    player.x = r0.cx * TILE + TILE/2;
    player.y = r0.cy * TILE + TILE/2;
    player.targetX = player.x;
    player.targetY = player.y;
    player.moving = false;
    player.attacking = false;

    // Teleport mercenary to player and clear merc projectiles
    mercProjectiles.length = 0;
    if (mercenary && mercenary.alive) {
        mercenary.x = player.x + 40; mercenary.y = player.y;
        mercenary.target = null;
    }

    // Full heal
    player.hp = player.maxHP;
    player.mp = player.maxMP;

    // Setup NPCs
    townNPCs.length = 0;
    const npcDefs = TOWN_NPC_DEFS[act] || [];
    for (let i = 0; i < npcDefs.length; i++) {
        const npcDef = npcDefs[i];
        const room = dungeon.rooms[i + 1] || dungeon.rooms[0];
        townNPCs.push({
            ...npcDef,
            x: room.cx * TILE + TILE/2,
            y: room.cy * TILE + TILE/2,
            interactRadius: 60
        });
    }

    // Enable waypoint for this ACT
    if (!G.waypoints.includes(act)) G.waypoints.push(act);

    // Generate shop items
    G.shopItems = generateShopItems(act);
    G.gambleItems = [];

    addLog(`${ACT_DEFS[act].townName}に到着した`, '#88ff88');
    addLog('NPCに近づいてEキーで会話', '#aaaaaa');

    // Auto save
    saveGame();
}

function travelToAct(targetAct) {
    if (!G.waypoints.includes(targetAct)) return;
    closeTownUI();
    G.portalReturn = null; // close return portal when traveling
    enterTown(targetAct);
}

function usePortalReturn() {
    const pr = G.portalReturn;
    if (!pr) return;

    G.act = pr.act;
    G.actFloor = pr.actFloor;
    G.cycle = pr.cycle;
    G.floor = pr.floor;
    G.inTown = false;
    G.inUber = pr.inUber || false;
    G.dungeonSeed = pr.dungeonSeed;

    const actDef = G.inUber ? ACT_DEFS[4] : getCurrentActDef();
    generateTileTextures(actDef.tileTheme); tileTexturesReady = true;

    // Restore saved dungeon state
    dungeon = pr.dungeon;
    monsters.length = 0;
    for (const m of pr.monsters) monsters.push(m);
    groundItems.length = 0;
    for (const it of pr.groundItems) groundItems.push(it);

    // Clear visual-only arrays
    projectiles.length = 0;
    enemyProjectiles.length = 0;
    particles.length = 0;
    bloodPools.length = 0;
    ambientParticles.length = 0;
    townNPCs.length = 0;
    G.traps = [];
    G.consecrations = [];
    G.minions = [];

    // Restore player position
    player.x = pr.x;
    player.y = pr.y;
    player.targetX = pr.x;
    player.targetY = pr.y;
    player.moving = false;
    player.attacking = false;

    // Close portal after use
    G.portalReturn = null;

    addLog(G.inUber ? 'パンデモニウムに戻った' : `ACT${G.act} 第${G.actFloor}層に戻った`, '#aaaaff');
}

// ========== TOWN UI SYSTEM ==========
function closeTownUI() {
    G.townUIMode = null;
    G.activeNPC = null;
    G.dialogState = 0;
    const panels = ['dialogPanel','shopPanel','blacksmithPanel','gamblePanel','stashPanel','waypointPanel','questPanel','uberPanel','mercenaryPanel'];
    for (const id of panels) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    }
}

function openNPCInteraction(npc) {
    closeTownUI();
    // Skip NPCs requiring higher difficulty
    if (npc.requireDifficulty && G.difficulty === 'normal') {
        addLog(`${npc.name}：まだ早い...もっと強くなってから来い。`, '#888888');
        return;
    }
    G.activeNPC = npc;
    switch (npc.type) {
        case 'shop': openShopUI(npc); break;
        case 'blacksmith': openBlacksmithUI(npc); break;
        case 'stash': openStashUI(npc); break;
        case 'quest': openQuestUI(npc); break;
        case 'waypoint': openWaypointUI(npc); break;
        case 'uber_portal': openUberPortalUI(npc); break;
        case 'mercenary': openMercenaryUI(npc); break;
        case 'gamble': openGambleUI(npc); break;
    }
}

function openShopUI(npc) {
    G.townUIMode = 'shop';
    const panel = document.getElementById('shopPanel');
    if (!panel) return;
    panel.style.display = 'block';
    renderShopUI();
}
function renderShopUI() {
    const panel = document.getElementById('shopPanel');
    if (!panel) return;
    let html = `<div class="panel-header">🛒 ${G.activeNPC ? G.activeNPC.name : '商人'} <span style="float:right;color:#ffd700">💰 ${G.gold}G</span></div>`;
    html += `<div style="display:flex;gap:8px;margin:6px 0"><button class="town-btn active" onclick="shopTab='buy';renderShopUI()">購入</button><button class="town-btn" onclick="shopTab='sell';renderShopUI()">売却</button></div>`;

    if (typeof shopTab === 'undefined' || shopTab === 'buy') {
        html += '<div class="shop-grid">';
        for (let i = 0; i < G.shopItems.length; i++) {
            const item = G.shopItems[i];
            const price = calculateBuyPrice(item);
            const canBuy = G.gold >= price;
            html += `<div class="shop-item ${canBuy ? '' : 'disabled'}" onclick="buyItem(${i})" title="${escapeHtml(item.name)}">
                <span style="font-size:18px">${item.icon}</span>
                <span style="color:${item.rarity.color};font-size:11px">${escapeHtml(item.name)}</span>
                <span style="color:#ffd700;font-size:10px">${price}G</span>
            </div>`;
        }
        html += '</div>';
    } else {
        html += '<div class="shop-grid">';
        for (let i = 0; i < player.inventory.length; i++) {
            const item = player.inventory[i];
            const price = calculateSellPrice(item);
            html += `<div class="shop-item" onclick="sellItem(${i})" title="${escapeHtml(item.name)}">
                <span style="font-size:18px">${item.icon}</span>
                <span style="color:${item.rarity.color};font-size:11px">${escapeHtml(item.name)}</span>
                <span style="color:#ffd700;font-size:10px">${price}G</span>
            </div>`;
        }
        html += '</div>';
    }
    html += `<button class="town-btn" onclick="closeTownUI()" style="margin-top:8px">閉じる</button>`;
    panel.innerHTML = html;
}
window.shopTab = 'buy';
window.buyItem = function(idx) {
    const item = G.shopItems[idx];
    if (!item) return;
    const price = calculateBuyPrice(item);
    if (G.gold < price) { addLog('ゴールドが足りない', '#ff4444'); return; }
    G.gold -= price;
    if (isPotion(item)) {
        const stackIdx = findPotionStack(player.potionInv, item.typeKey);
        if (stackIdx !== -1) {
            player.potionInv[stackIdx].qty = (player.potionInv[stackIdx].qty || 1) + 1;
        } else if (player.potionInv.length >= player.maxPotionInv) {
            G.gold += price; addLog('ポーション欄が一杯', '#ff4444'); return;
        } else {
            player.potionInv.push(generatePotion(item.typeKey));
        }
    } else {
        if (player.inventory.length >= player.maxInv) { G.gold += price; addLog('インベントリが一杯', '#ff4444'); return; }
        player.inventory.push(item);
        G.shopItems.splice(idx, 1);
    }
    addLog(`${item.name} を購入 (-${price}G)`, '#88ff88');
    renderShopUI();
};
window.sellItem = function(idx) {
    const item = player.inventory[idx];
    if (!item) return;
    if (item.uberKeyId) { addLog('この鍵は売却できない！', '#ff4444'); return; }
    const price = calculateSellPrice(item);
    const totalPrice = isPotion(item) ? price * (item.qty || 1) : price;
    G.gold += totalPrice;
    player.inventory.splice(idx, 1);
    addLog(`${item.name}${isPotion(item) && (item.qty || 1) > 1 ? ' x' + (item.qty || 1) : ''} を売却 (+${totalPrice}G)`, '#ffd700');
    renderShopUI();
};

// ========== GAMBLING SYSTEM (D2-style) ==========
function openGambleUI(npc) {
    G.townUIMode = 'gamble';
    const panel = document.getElementById('gamblePanel');
    if (!panel) return;
    panel.style.display = 'block';
    renderGambleUI();
}
function renderGambleUI() {
    const panel = document.getElementById('gamblePanel');
    if (!panel) return;
    let html = `<div class="panel-header">🎲 ${G.activeNPC ? G.activeNPC.name : 'ギャンブラー'} <span style="float:right;color:#ffd700">💰 ${G.gold}G</span></div>`;
    html += `<p style="font-size:11px;color:#aaa;margin:4px 0">ギャンブルでレアアイテムを狙え！（Magic 90%, Rare 8%, Legendary 1.5%, Unique 0.5%）</p>`;
    html += '<div class="shop-grid">';

    for (let i = 0; i < GAMBLE_ITEMS.length; i++) {
        const g = GAMBLE_ITEMS[i];
        const canBuy = G.gold >= g.cost;
        html += `<div class="shop-item ${canBuy ? '' : 'disabled'}" onclick="gambleItem(${i})" title="${escapeHtml(g.name)}">
            <span style="font-size:18px">${g.icon}</span>
            <span style="color:#ffaa00;font-size:11px">${escapeHtml(g.name)}</span>
            <span style="color:#ffd700;font-size:10px">${g.cost}G</span>
        </div>`;
    }
    html += '</div>';
    html += `<button class="town-btn" onclick="closeTownUI()" style="margin-top:8px">閉じる</button>`;
    panel.innerHTML = html;
}
window.gambleItem = function(idx) {
    const g = GAMBLE_ITEMS[idx];
    if (!g || G.gold < g.cost) {
        addLog('ゴールドが足りない', '#ff4444');
        return;
    }
    if (player.inventory.length >= player.maxInv) {
        addLog('インベントリが一杯', '#ff4444');
        return;
    }

    // Deduct gold
    G.gold -= g.cost;

    // Determine item level: player.level ± 3 (D2-style level variance)
    const itemLevel = Math.max(1, player.level + rand(-3, 3));

    // Pick rarity from gambling table (no common items)
    const rarityRoll = Math.random();
    let cumulativeProb = 0;
    let rarity = 'magic'; // fallback
    for (const [r, prob] of Object.entries(GAMBLE_RARITY_TABLE)) {
        cumulativeProb += prob;
        if (rarityRoll < cumulativeProb) {
            rarity = r;
            break;
        }
    }

    // Generate item based on category
    let item;
    if (g.type === 'weapon') {
        // Random weapon type
        const weaponTypes = ['sword', 'axe', 'staff'];
        const wType = weaponTypes[rand(0, weaponTypes.length - 1)];
        item = generateItem(itemLevel, wType, rarity);
    } else if (g.type === 'armor') {
        // Random armor type (exclude weapon/accessory)
        const armorTypes = ['helmet', 'armor', 'shield', 'boots'];
        const aType = armorTypes[rand(0, armorTypes.length - 1)];
        item = generateItem(itemLevel, aType, rarity);
    } else {
        // Ring or Amulet
        item = generateItem(itemLevel, g.type, rarity);
    }

    player.inventory.push(item);
    const rarityColor = RARITY[rarity] ? RARITY[rarity].color : '#ffaa00';
    addLog(`🎲 ギャンブル結果: ${item.name} (${RARITY[rarity].name})`, rarityColor);
    emitParticles(player.x, player.y, rarityColor, 15, 60, 0.5, 3, -20);
    sfxPowerup();
    renderGambleUI();
};

let smithTab = 'enhance'; // 'enhance' or 'socket'
let socketTargetSource = null; // {source, key} for selected socket target

function openBlacksmithUI(npc) {
    G.townUIMode = 'blacksmith';
    smithTab = 'enhance';
    socketTargetSource = null;
    const panel = document.getElementById('blacksmithPanel');
    if (!panel) return;
    panel.style.display = 'block';
    renderBlacksmithUI();
}
function renderBlacksmithUI() {
    const panel = document.getElementById('blacksmithPanel');
    if (!panel) return;
    let html = `<div class="panel-header">⚒ ${G.activeNPC ? G.activeNPC.name : '鍛冶屋'} <span style="float:right;color:#ffd700">💰 ${G.gold}G</span></div>`;
    // Tabs
    html += `<div style="display:flex;gap:4px;margin:4px 0">`;
    html += `<button class="town-btn" style="flex:1;${smithTab === 'enhance' ? 'background:#555' : ''}" onclick="switchSmithTab('enhance')">⚒ 強化</button>`;
    html += `<button class="town-btn" style="flex:1;${smithTab === 'socket' ? 'background:#555' : ''}" onclick="switchSmithTab('socket')">🔶 ルーン装着</button>`;
    html += `</div>`;

    if (smithTab === 'enhance') {
        html += `<p style="font-size:11px;color:#aaa;margin:4px 0">装備を選んで強化（50%でアフィックス追加 / 50%で既存+20%）</p>`;
        html += '<div class="shop-grid">';
        const allEquip = [];
        for (const [slot, item] of Object.entries(player.equipment)) {
            if (item && !isRune(item)) allEquip.push({ item, source: 'equip', slot });
        }
        for (let i = 0; i < player.inventory.length; i++) {
            const item = player.inventory[i];
            if (!isPotion(item) && !isRune(item)) allEquip.push({ item, source: 'inv', idx: i });
        }
        for (const eq of allEquip) {
            const cost = calculateSmithCost(eq.item);
            const canAfford = G.gold >= cost;
            html += `<div class="shop-item ${canAfford ? '' : 'disabled'}" onclick="smithItem('${eq.source}','${eq.source === 'equip' ? eq.slot : eq.idx}')" title="${escapeHtml(eq.item.name)}">
                <span style="font-size:18px">${eq.item.icon}</span>
                <span style="color:${eq.item.rarity.color};font-size:11px">${escapeHtml(eq.item.name)}</span>
                <span style="color:#ffd700;font-size:10px">${cost}G</span>
            </div>`;
        }
        html += '</div>';
    } else {
        // Socket / Rune insertion tab
        html += renderSocketTab();
    }
    html += `<button class="town-btn" onclick="closeTownUI()" style="margin-top:8px">閉じる</button>`;
    panel.innerHTML = html;
}

function renderSocketTab() {
    let html = '';
    if (!socketTargetSource) {
        // Step 1: Select a socketed item
        html += `<p style="font-size:11px;color:#daa520;margin:4px 0">🔶 ルーンを装着する装備を選択：</p>`;
        html += '<div class="shop-grid">';
        const socketable = [];
        for (const [slot, item] of Object.entries(player.equipment)) {
            if (item && item.sockets > 0) socketable.push({ item, source: 'equip', slot });
        }
        for (let i = 0; i < player.inventory.length; i++) {
            const item = player.inventory[i];
            if (item.sockets > 0) socketable.push({ item, source: 'inv', idx: i });
        }
        if (socketable.length === 0) {
            html += `<div style="color:#888;padding:12px;text-align:center">ソケット付きの装備がありません</div>`;
        }
        for (const eq of socketable) {
            const filled = eq.item.socketedRunes ? eq.item.socketedRunes.length : 0;
            const total = eq.item.sockets;
            const full = filled >= total || eq.item.runeword;
            const socketStr = eq.item.runeword ? `★ ${eq.item.runeword}` :
                Array.from({length: total}, (_, i) => i < filled ? '🔶' : '◇').join('');
            html += `<div class="shop-item ${full ? 'disabled' : ''}" onclick="selectSocketTarget('${eq.source}','${eq.source === 'equip' ? eq.slot : eq.idx}')" title="${escapeHtml(eq.item.name)}">
                <span style="font-size:18px">${eq.item.icon}</span>
                <span style="color:${eq.item.rarity.color};font-size:11px">${escapeHtml(eq.item.name)}</span>
                <span style="font-size:10px;color:#daa520">${socketStr}</span>
            </div>`;
        }
        html += '</div>';
        // Show runeword recipes hint
        html += `<div style="border-top:1px solid #444;margin-top:8px;padding-top:6px">`;
        html += `<p style="font-size:10px;color:#daa520;margin:2px 0">📜 ルーンワード一覧（順序通りに装着で発動）：</p>`;
        for (const rw of RUNEWORD_DEFS) {
            const runeNames = rw.runes.map(id => RUNE_DEFS[id].name).join(' + ');
            const types = rw.validTypes.map(t => ITEM_TYPES[t].name).join('/');
            html += `<div style="font-size:9px;color:#888;margin:1px 0"><span style="color:#daa520">${rw.nameJP}【${rw.name}】</span> = ${runeNames} (${rw.sockets}穴 ${types})</div>`;
        }
        html += `</div>`;
    } else {
        // Step 2: Select a rune from inventory
        const item = socketTargetSource.source === 'equip'
            ? player.equipment[socketTargetSource.key]
            : player.inventory[parseInt(socketTargetSource.key)];
        if (!item) { socketTargetSource = null; return renderSocketTab(); }
        const filled = item.socketedRunes ? item.socketedRunes.length : 0;
        const total = item.sockets;
        const socketStr = Array.from({length: total}, (_, i) => {
            if (i < filled) return `<span style="color:#daa520">${RUNE_DEFS[item.socketedRunes[i].runeId].name}</span>`;
            return '<span style="color:#555">空</span>';
        }).join(' ');
        html += `<p style="font-size:11px;color:${item.rarity.color};margin:4px 0">${item.icon} ${item.name} [${socketStr}] (${filled}/${total})</p>`;
        html += `<p style="font-size:11px;color:#aaa;margin:2px 0">装着するルーンを選択（⚠ 一度装着すると外せません）：</p>`;
        html += '<div class="shop-grid">';
        const runes = [];
        for (let i = 0; i < player.inventory.length; i++) {
            if (isRune(player.inventory[i])) runes.push({ rune: player.inventory[i], idx: i });
        }
        if (runes.length === 0) {
            html += `<div style="color:#888;padding:12px;text-align:center">ルーンを持っていません</div>`;
        }
        for (const r of runes) {
            const rd = r.rune.runeDef || RUNE_DEFS[r.rune.runeId];
            html += `<div class="shop-item" onclick="insertRuneUI(${r.idx})" title="${rd.desc}">
                <span style="font-size:16px;color:${rd.color}">🔶 ${rd.name}</span>
                <span style="font-size:10px;color:#aaa">${rd.desc}</span>
            </div>`;
        }
        html += '</div>';
        html += `<button class="town-btn" onclick="selectSocketTarget(null)" style="margin-top:4px;font-size:11px">← 戻る</button>`;
    }
    return html;
}
window.smithItem = function(source, key) {
    let item;
    if (source === 'equip') item = player.equipment[key];
    else item = player.inventory[parseInt(key)];
    if (!item) return;
    const cost = calculateSmithCost(item);
    if (G.gold < cost) { addLog('ゴールドが足りない', '#ff4444'); return; }
    G.gold -= cost;
    // Prevent enhancing runeword items (their affixes are fixed)
    if (item.runeword) {
        addLog('ルーンワードアイテムは強化できません', '#ff8844');
        return;
    }
    if (Math.random() < 0.5 && item.affixes) {
        // Add random affix (exclude rune/runeword affix slots)
        const pool = AFFIXES.filter(a => !item.affixes.some(af => af.stat === a.stat));
        if (pool.length > 0) {
            const a = pool[rand(0, pool.length - 1)];
            const floorMult = 1 + (G.floor - 1) * 0.15;
            const v = Math.round(rand(a.min, a.max) * floorMult);
            item.affixes.push({ stat: a.stat, value: v, text: a.fmt.replace('{v}', v) });
            addLog(`鍛冶成功！${a.fmt.replace('{v}', v)} が追加された`, '#88ff88');
        }
    } else if (item.affixes && item.affixes.length > 0) {
        // Boost existing affix by 20% (skip rune-source affixes)
        const boostable = item.affixes.filter(a => !a.runeSource && !a.runewordSource);
        if (boostable.length === 0) { addLog('強化可能なアフィックスがない', '#ff8844'); return; }
        const af = boostable[rand(0, boostable.length - 1)];
        const boost = Math.max(1, Math.round(af.value * 0.2));
        af.value += boost;
        af.text = af.text.replace(/\d+/, af.value);
        addLog(`鍛冶成功！${af.text} が強化された`, '#88ff88');
    } else {
        addLog('鍛冶に失敗...何も起きなかった', '#ff8844');
    }
    player.recalcStats();
    renderBlacksmithUI();
};
window.switchSmithTab = function(tab) {
    smithTab = tab;
    socketTargetSource = null;
    renderBlacksmithUI();
};
window.selectSocketTarget = function(source, key) {
    if (source === null) { socketTargetSource = null; }
    else { socketTargetSource = { source, key }; }
    renderBlacksmithUI();
};
window.insertRuneUI = function(runeIdx) {
    if (!socketTargetSource) return;
    const item = socketTargetSource.source === 'equip'
        ? player.equipment[socketTargetSource.key]
        : player.inventory[parseInt(socketTargetSource.key)];
    const runeItem = player.inventory[runeIdx];
    if (!item || !runeItem || !isRune(runeItem)) return;
    if (!item.sockets || !item.socketedRunes) { addLog('この装備にはソケットがない', '#ff4444'); return; }
    if (item.socketedRunes.length >= item.sockets) { addLog('ソケットが一杯です', '#ff4444'); return; }
    if (item.runeword) { addLog('ルーンワードが既に完成しています', '#ff4444'); return; }
    const success = insertRuneIntoItem(item, runeItem);
    if (success) {
        const rd = runeItem.runeDef || RUNE_DEFS[runeItem.runeId];
        addLog(`${rd.name}のルーンを${item.name}に装着！`, '#daa520');
        player.inventory.splice(runeIdx, 1);
        player.recalcStats();
    }
    renderBlacksmithUI();
};

// ========== MERCENARY UI ==========
function openMercenaryUI(npc) {
    G.townUIMode = 'mercenary';
    const panel = document.getElementById('mercenaryPanel');
    if (!panel) return;
    panel.style.display = 'block';
    renderMercenaryUI();
}
function renderMercenaryUI() {
    const panel = document.getElementById('mercenaryPanel');
    if (!panel) return;
    let html = `<div class="panel-header">⚔ ${G.activeNPC ? escapeHtml(G.activeNPC.name) : '傭兵ギルド'} <span style="float:right;color:#ffd700">💰 ${G.gold}G</span></div>`;

    if (mercenary) {
        // Current mercenary info
        const def = mercenary.def;
        html += `<div style="border:1px solid ${def.color};border-radius:6px;padding:8px;margin:6px 0;background:rgba(0,0,0,0.4)">`;
        html += `<div style="color:${def.color};font-size:13px;font-weight:bold">${def.icon} ${escapeHtml(mercenary.name)} (${def.nameJP}) Lv.${mercenary.level}</div>`;
        if (mercenary.alive) {
            html += `<div style="color:#ccc;font-size:11px;margin:4px 0">HP: ${mercenary.hp}/${mercenary.maxHP} | 攻撃: ${mercenary.getAttackDmg()} | 防御: ${mercenary.getDefense()}</div>`;
            html += `<div style="color:#aa88ff;font-size:10px;margin:2px 0">XP: ${mercenary.xp || 0}/${mercenary.xpToNext || '?'}</div>`;
            html += `<div style="color:#aaa;font-size:10px">タイプ: ${def.attackType === 'melee' ? '近接' : def.attackType === 'ranged' ? '遠隔' : '魔法'} | 射程: ${def.attackRange}</div>`;
            // Equipment
            const wName = mercenary.equipment.weapon ? escapeHtml(mercenary.equipment.weapon.name) : '(なし)';
            const aName = mercenary.equipment.armor ? escapeHtml(mercenary.equipment.armor.name) : '(なし)';
            const wCol = mercenary.equipment.weapon ? mercenary.equipment.weapon.rarity.color : '#888';
            const aCol = mercenary.equipment.armor ? mercenary.equipment.armor.rarity.color : '#888';
            html += `<div style="margin:6px 0;font-size:11px">`;
            html += `<div>🗡 武器: <span style="color:${wCol}">${wName}</span> ${mercenary.equipment.weapon ? '<button class="sn-btn" onclick="mercUnequip(\'weapon\')">外す</button>' : ''}</div>`;
            html += `<div>🛡 防具: <span style="color:${aCol}">${aName}</span> ${mercenary.equipment.armor ? '<button class="sn-btn" onclick="mercUnequip(\'armor\')">外す</button>' : ''}</div>`;
            html += `</div>`;
            // Give equipment from inventory
            html += `<div style="color:#aaa;font-size:10px;margin:4px 0">インベントリから装備を渡す：</div>`;
            html += `<div class="shop-grid">`;
            for (let i = 0; i < player.inventory.length; i++) {
                const item = player.inventory[i];
                if (!item.typeKey) continue;
                const slot = (item.typeInfo && (item.typeInfo.slot === 'weapon' || item.typeInfo.slot === 'offhand')) ? 'weapon' : ((item.typeInfo && (item.typeInfo.slot === 'body' || item.typeInfo.slot === 'head')) ? 'armor' : null);
                if (!slot) continue;
                html += `<div class="shop-item" onclick="mercEquip(${i},'${slot}')"><span style="font-size:16px">${item.icon}</span><span style="color:${item.rarity.color};font-size:10px">${escapeHtml(item.name)}</span></div>`;
            }
            html += `</div>`;
            html += `<button class="town-btn" style="background:#664444;margin-top:6px" onclick="dismissMerc()">解雇する</button>`;
        } else {
            // Dead: revive option
            const cost = getMercReviveCost();
            const canRevive = G.gold >= cost;
            html += `<div style="color:#ff4444;font-size:12px;margin:6px 0">☠ ${escapeHtml(mercenary.name)}は倒れている</div>`;
            html += `<button class="town-btn ${canRevive ? '' : 'disabled'}" onclick="reviveMerc()" style="margin:4px 0">${canRevive ? `復活させる (${cost}G)` : `ゴールド不足 (${cost}G必要)`}</button>`;
        }
        html += `</div>`;
    } else {
        // Hire new mercenary
        html += `<div style="color:#ccc;font-size:12px;margin:6px 0">傭兵を雇おう。ダンジョンで一緒に戦ってくれる。</div>`;
        html += `<div class="shop-grid">`;
        for (const [key, def] of Object.entries(MERCENARY_DEFS)) {
            const cost = getMercHireCost(key);
            const canHire = G.gold >= cost;
            const stats = calcMercStats(def, player.level);
            html += `<div class="shop-item ${canHire ? '' : 'disabled'}" onclick="hireMerc('${key}')" style="border-color:${def.color}">
                <div style="font-size:20px">${def.icon}</div>
                <div style="color:${def.color};font-size:12px;font-weight:bold">${def.nameJP}</div>
                <div style="color:#aaa;font-size:9px">${def.attackType === 'melee' ? '近接' : def.attackType === 'ranged' ? '遠隔' : '魔法'}攻撃</div>
                <div style="color:#ccc;font-size:9px">HP:${stats.maxHP} 攻:${stats.baseDmg} 防:${stats.defense}</div>
                <div style="color:#ffd700;font-size:10px">${cost}G</div>
            </div>`;
        }
        html += `</div>`;
    }
    html += `<button class="town-btn" onclick="closeTownUI()" style="margin-top:8px">閉じる</button>`;
    panel.innerHTML = html;
}
window.hireMerc = function(typeKey) {
    const cost = getMercHireCost(typeKey);
    if (G.gold < cost) { addLog('ゴールドが足りない', '#ff4444'); return; }
    G.gold -= cost;
    mercenary = new Mercenary(typeKey, player.x + 40, player.y);
    addLog(`${mercenary.name}を雇った！`, mercenary.def.color);
    renderMercenaryUI();
};
window.reviveMerc = function() {
    if (!mercenary) return;
    const cost = getMercReviveCost();
    if (G.gold < cost) { addLog('ゴールドが足りない', '#ff4444'); return; }
    G.gold -= cost;
    mercenary.alive = true;
    mercenary.recalcStats(true);
    mercenary.x = player.x + 40; mercenary.y = player.y;
    addLog(`${mercenary.name}が復活した！`, mercenary.def.color);
    renderMercenaryUI();
};
window.dismissMerc = function() {
    if (!mercenary) return;
    // Return equipment to player inventory
    for (const slot of ['weapon', 'armor']) {
        if (mercenary.equipment[slot]) {
            if (player.inventory.length < player.maxInv) {
                player.inventory.push(mercenary.equipment[slot]);
            } else {
                groundItems.push({ x: player.x, y: player.y, item: mercenary.equipment[slot] });
            }
        }
    }
    addLog(`${mercenary.name}を解雇した`, '#888');
    mercenary = null;
    renderMercenaryUI();
};
window.mercEquip = function(invIdx, slot) {
    if (!mercenary || !mercenary.alive) return;
    const item = player.inventory[invIdx];
    if (!item) return;
    // Return old equipment
    if (mercenary.equipment[slot]) {
        player.inventory.push(mercenary.equipment[slot]);
    }
    mercenary.equipment[slot] = item;
    player.inventory.splice(invIdx, 1);
    mercenary.recalcStats(false);
    addLog(`${escapeHtml(item.name)}を${mercenary.name}に装備させた`, item.rarity.color);
    renderMercenaryUI();
};
window.mercUnequip = function(slot) {
    if (!mercenary) return;
    const item = mercenary.equipment[slot];
    if (!item) return;
    if (player.inventory.length >= player.maxInv) { addLog('インベントリが一杯', '#ff4444'); return; }
    player.inventory.push(item);
    mercenary.equipment[slot] = null;
    mercenary.recalcStats(false);
    addLog(`${escapeHtml(item.name)}を取り戻した`, '#aaa');
    renderMercenaryUI();
};

// ========== GAMBLING UI ==========
function generateGambleItems() {
    const items = [];
    const globalF = getGlobalFloor(G.act, 1, G.cycle);
    for (let i = 0; i < 10; i++) {
        const item = generateItem(globalF);
        // Hide true identity - show as unidentified
        item._gambleHidden = true;
        item._realName = item.name;
        item._realRarity = item.rarity;
        item._realRarityKey = item.rarityKey;
        item._realAffixes = item.affixes;
        item._realIcon = item.icon;
        // Mask display
        item.name = '？？？ ' + item.typeInfo.name;
        item.rarity = { name: '未鑑定', color: '#888888' };
        item.rarityKey = 'common';
        item.affixes = [];
        items.push(item);
    }
    return items;
}
function getGambleCost() {
    return Math.round(player.level * 100 * (1 + (G.cycle || 0) * 0.5));
}
function openGamblingUI(npc) {
    G.townUIMode = 'gamble';
    if (!G.gambleItems || G.gambleItems.length === 0) {
        G.gambleItems = generateGambleItems();
    }
    const panel = document.getElementById('gamblingPanel');
    if (!panel) return;
    panel.style.display = 'block';
    renderGamblingUI();
}
function renderGamblingUI() {
    const panel = document.getElementById('gamblingPanel');
    if (!panel) return;
    const cost = getGambleCost();
    let html = `<div class="panel-header">🎰 ${G.activeNPC ? escapeHtml(G.activeNPC.name) : '賭博師'} <span style="float:right;color:#ffd700">💰 ${G.gold}G</span></div>`;
    html += `<div style="color:#aaa;font-size:11px;margin:4px 0">1回 ${cost}G — アイテムを選ぶとレアリティが判明！</div>`;
    html += '<div class="shop-grid">';
    for (let i = 0; i < G.gambleItems.length; i++) {
        const item = G.gambleItems[i];
        const canBuy = G.gold >= cost;
        html += `<div class="shop-item ${canBuy ? '' : 'disabled'}" onclick="gambleBuy(${i})" title="${escapeHtml(item.name)}">
            <span style="font-size:18px">${item._gambleHidden ? '❓' : (item._realIcon || item.icon)}</span>
            <span style="color:${item._gambleHidden ? '#888' : item._realRarity.color};font-size:11px">${escapeHtml(item._gambleHidden ? item.name : item._realName)}</span>
            <span style="color:#ffd700;font-size:10px">${cost}G</span>
        </div>`;
    }
    html += '</div>';
    html += `<div style="display:flex;gap:8px;margin-top:8px">`;
    html += `<button class="town-btn" onclick="gambleRefresh()">品替え</button>`;
    html += `<button class="town-btn" onclick="closeTownUI()">閉じる</button>`;
    html += `</div>`;
    panel.innerHTML = html;
}
window.gambleBuy = function(idx) {
    const item = G.gambleItems[idx];
    if (!item) return;
    const cost = getGambleCost();
    if (G.gold < cost) { addLog('ゴールドが足りない', '#ff4444'); return; }
    if (player.inventory.length >= player.maxInv) { addLog('インベントリが一杯', '#ff4444'); return; }
    G.gold -= cost;
    // D2-style rarity reroll
    const r = Math.random();
    let finalRarityKey;
    if (r < 0.001) finalRarityKey = 'unique';
    else if (r < 0.011) finalRarityKey = 'legendary';
    else if (r < 0.111) finalRarityKey = 'rare';
    else finalRarityKey = 'magic';
    // Generate proper item of the SAME type with rolled rarity
    const globalF = getGlobalFloor(G.act, 1, G.cycle);
    const rarity = RARITY[finalRarityKey];
    const floorMult = 1 + (globalF - 1) * 0.15;
    const typeKey = item.typeKey;
    const typeInfo = item.typeInfo;
    const revealed = {
        typeKey, typeInfo, rarityKey: finalRarityKey, rarity,
        icon: typeInfo.icon, affixes: [],
        baseDmg: typeInfo.baseDmg ? [Math.round(typeInfo.baseDmg[0] * rarity.mult * floorMult), Math.round(typeInfo.baseDmg[1] * rarity.mult * floorMult)] : null,
        baseDef: typeInfo.baseDef ? Math.round((typeInfo.baseDef[0] + rand(0, typeInfo.baseDef[1] - typeInfo.baseDef[0])) * rarity.mult * floorMult) : null,
    };
    const areaLevel = getMonsterLevel(G.act, G.actFloor);
    revealed.itemLevel = areaLevel;
    const baseReq = Math.max(1, Math.ceil(areaLevel / 2));
    revealed.requiredLevel = finalRarityKey === 'unique' ? baseReq + 4 : finalRarityKey === 'legendary' ? baseReq + 2 : baseReq;
    // Name
    if (finalRarityKey === 'unique' && UNIQUE_NAMES[typeKey]) {
        const names = UNIQUE_NAMES[typeKey];
        revealed.name = names[rand(0, names.length - 1)];
    } else {
        const prefixes = ['呪われし', '聖なる', '古代の', '鍛えられし', '朽ちた', '輝く', '血染めの', '影の', '蒼き', '灼熱の'];
        const prefix = finalRarityKey !== 'common' ? prefixes[rand(0, prefixes.length-1)] + ' ' : '';
        revealed.name = prefix + typeInfo.name;
    }
    // Affixes
    const affixCount = getAffixCount(rarity);
    const pool = [...AFFIXES];
    for (let i = 0; i < affixCount && pool.length > 0; i++) {
        const ai = rand(0, pool.length - 1);
        const a = pool.splice(ai, 1)[0];
        const v = Math.round(rand(a.min, a.max) * floorMult);
        revealed.affixes.push({ stat: a.stat, value: v, text: a.fmt.replace('{v}', v) });
    }
    // Sockets
    const sockCount = rollSockets(typeKey, finalRarityKey);
    if (sockCount > 0) { revealed.sockets = sockCount; revealed.socketedRunes = []; }
    player.inventory.push(revealed);
    G.gambleItems.splice(idx, 1);
    addLog(`ギャンブル成功！ ${revealed.name} [${revealed.rarity.name}]`, revealed.rarity.color);
    renderGamblingUI();
};
window.gambleRefresh = function() {
    G.gambleItems = generateGambleItems();
    renderGamblingUI();
};

// D2-style skill reset (quest reward)
window.resetSkills = function() {
    if (!player.skillResetAvailable) {
        addLog('スキルリセット権がありません', '#ff4444');
        return;
    }
    const totalPoints = Object.values(player.skillLevels || {}).reduce((a, b) => a + b, 0);
    player.skillLevels = {};
    player.skills = [
        { id: null, cooldown: 0 },
        { id: null, cooldown: 0 },
        { id: null, cooldown: 0 },
        { id: null, cooldown: 0 }
    ];
    player.skillPoints = (player.skillPoints || 0) + totalPoints;
    player.skillResetAvailable = false;
    recalcPassives();
    player.recalcStats();
    addLog(`スキルをリセットしました（+${totalPoints} スキルポイント）`, '#ff88ff');
    sfxLevelUp();
    emitParticles(player.x, player.y, '#ff88ff', 20, 80, 0.6, 4, -30);
};

function openStashUI(npc) {
    G.townUIMode = 'stash';
    const panel = document.getElementById('stashPanel');
    if (!panel) return;
    panel.style.display = 'block';
    renderStashUI();
}
function renderStashUI() {
    const panel = document.getElementById('stashPanel');
    if (!panel) return;
    let html = `<div class="panel-header">📦 倉庫 (${G.stash.length}/${G.maxStash})</div>`;
    html += `<div style="display:flex;gap:8px">`;
    // Inventory side
    html += `<div style="flex:1"><div style="color:#aaa;font-size:11px;margin:4px 0">インベントリ → 倉庫</div><div class="shop-grid">`;
    for (let i = 0; i < player.inventory.length; i++) {
        const item = player.inventory[i];
        html += `<div class="shop-item" onclick="stashDeposit(${i})"
            onmouseenter="showInvTooltip(event,${i})" onmouseleave="hideTooltip()">
            <span style="font-size:16px">${item.icon}</span>
            <span style="color:${item.rarity.color};font-size:10px">${escapeHtml(item.name)}</span>
        </div>`;
    }
    html += `</div></div>`;
    // Stash side
    html += `<div style="flex:1"><div style="color:#aaa;font-size:11px;margin:4px 0">倉庫 → インベントリ</div><div class="shop-grid">`;
    for (let i = 0; i < G.stash.length; i++) {
        const item = G.stash[i];
        html += `<div class="shop-item" onclick="stashWithdraw(${i})"
            onmouseenter="showStashTooltip(event,${i})" onmouseleave="hideTooltip()">
            <span style="font-size:16px">${item.icon}</span>
            <span style="color:${item.rarity.color};font-size:10px">${escapeHtml(item.name)}</span>
        </div>`;
    }
    html += `</div></div></div>`;
    html += `<button class="town-btn" onclick="closeTownUI()" style="margin-top:8px">閉じる</button>`;
    panel.innerHTML = html;
}
window.stashDeposit = function(idx) {
    if (G.stash.length >= G.maxStash) { addLog('倉庫が一杯', '#ff4444'); return; }
    G.stash.push(player.inventory.splice(idx, 1)[0]);
    renderStashUI();
};
window.stashWithdraw = function(idx) {
    if (player.inventory.length >= 20) { addLog('インベントリが一杯', '#ff4444'); return; }
    player.inventory.push(G.stash.splice(idx, 1)[0]);
    renderStashUI();
};

function openWaypointUI(npc) {
    G.townUIMode = 'waypoint';
    const panel = document.getElementById('waypointPanel');
    if (!panel) return;
    panel.style.display = 'block';
    renderWaypointUI();
}
function renderWaypointUI() {
    const panel = document.getElementById('waypointPanel');
    if (!panel) return;
    let html = `<div class="panel-header"><img src="${getWaypointIconDataURL(20)}" width="20" height="20" style="vertical-align:middle"> ウェイポイント</div>`;
    html += '<div style="display:flex;flex-direction:column;gap:4px">';
    for (let a = 1; a <= 5; a++) {
        const discovered = G.waypoints.includes(a);
        const current = G.act === a && G.inTown;
        html += `<button class="town-btn ${current ? 'active' : ''} ${discovered ? '' : 'disabled'}"
            onclick="${discovered && !current ? 'travelToAct(' + a + ')' : ''}"
            ${discovered ? '' : 'disabled'}>
            ACT${a}: ${ACT_DEFS[a].townName} ${current ? '(現在地)' : ''} ${discovered ? '' : '(未発見)'}
        </button>`;
    }
    html += '</div>';
    html += `<button class="town-btn" onclick="closeTownUI()" style="margin-top:8px">閉じる</button>`;
    panel.innerHTML = html;
}
window.travelToAct = travelToAct;

function openQuestUI(npc) {
    G.townUIMode = 'quest';
    const panel = document.getElementById('questPanel');
    if (!panel) return;
    panel.style.display = 'block';
    renderQuestUI();
}
function renderQuestUI() {
    const panel = document.getElementById('questPanel');
    if (!panel) return;
    let html = `<div class="panel-header">📜 クエスト</div>`;

    // Available quests for current ACT
    const actQuests = Object.entries(QUEST_DEFS).filter(([_, q]) => q.act === G.act);
    for (const [qid, qdef] of actQuests) {
        const state = G.quests[qid];
        if (state && state.status === 'rewarded') {
            html += `<div class="quest-item rewarded"><span style="color:#888">✅ ${qdef.name} (完了)</span></div>`;
        } else if (state && state.status === 'complete') {
            html += `<div class="quest-item complete" onclick="turnInQuest('${qid}');renderQuestUI()">
                <span style="color:#ffd700">★ ${qdef.name} - 報告可能！クリックで報告</span>
            </div>`;
        } else if (state && state.status === 'active') {
            const prog = qdef.type === 'kill_count' ? ` (${state.progress || 0}/${qdef.target})` : '';
            html += `<div class="quest-item active"><span style="color:#4488ff">📌 ${qdef.name}${prog}</span><br><span style="color:#888;font-size:10px">${qdef.desc}</span></div>`;
        } else if (canAcceptQuest(qid)) {
            html += `<div class="quest-item available" onclick="acceptQuest('${qid}');renderQuestUI()">
                <span style="color:#88ff88">❓ ${qdef.name} - クリックで受諾</span><br><span style="color:#888;font-size:10px">${qdef.desc}</span>
            </div>`;
        } else {
            html += `<div class="quest-item locked"><span style="color:#555">🔒 ${qdef.name} (前提未達成)</span></div>`;
        }
    }

    // Skill reset button (if available)
    if (player.skillResetAvailable) {
        html += `<div style="margin-top:12px;padding:8px;background:rgba(255,136,255,0.1);border:1px solid #ff88ff;border-radius:4px">
            <div style="color:#ff88ff;font-size:12px;margin-bottom:4px">✨ スキルリセット権利あり</div>
            <button class="town-btn" onclick="resetSkills();renderQuestUI()" style="background:#ff88ff;color:#000">スキルをリセットする</button>
        </div>`;
    }

    html += `<button class="town-btn" onclick="closeTownUI()" style="margin-top:8px">閉じる</button>`;
    panel.innerHTML = html;
}
window.turnInQuest = turnInQuest;
window.acceptQuest = acceptQuest;
window.closeTownUI = closeTownUI;

// ========== UBER PORTAL UI ==========
function openUberPortalUI(npc) {
    G.townUIMode = 'uber';
    const panel = document.getElementById('uberPanel');
    if (!panel) return;
    panel.style.display = 'block';
    renderUberPortalUI();
}
function renderUberPortalUI() {
    const panel = document.getElementById('uberPanel');
    if (!panel) return;
    // Count keys in questItems
    const keyCount = {};
    for (const keyId of Object.keys(UBER_KEY_DEFS)) keyCount[keyId] = 0;
    for (const item of G.questItems) {
        if (item.uberKeyId && keyCount[item.uberKeyId] !== undefined) keyCount[item.uberKeyId]++;
    }
    const hasAllKeys = Object.values(keyCount).every(c => c >= 1);
    let html = `<div class="panel-header">🌀 パンデモニウムの門</div>`;
    html += `<div style="color:#aaa;font-size:11px;margin:6px 0">3つの鍵を集めて門を開け。その先にはパンデモニウムのウーバーボスが待ち受ける。</div>`;
    html += '<div style="display:flex;flex-direction:column;gap:4px;margin:8px 0">';
    for (const [keyId, keyDef] of Object.entries(UBER_KEY_DEFS)) {
        const count = keyCount[keyId];
        const found = count > 0;
        html += `<div style="padding:4px 8px;background:${found ? '#1a2a1a' : '#1a1a1a'};border:1px solid ${found ? keyDef.color : '#333'};border-radius:4px">
            <span style="font-size:14px">${keyDef.icon}</span>
            <span style="color:${found ? keyDef.color : '#555'}">${keyDef.name}</span>
            <span style="float:right;color:${found ? '#88ff88' : '#555'}">${found ? '✓ 所持' : '✗ 未入手'}</span>
        </div>`;
    }
    html += '</div>';
    if (hasAllKeys) {
        html += `<button class="town-btn" onclick="enterUberTristram()" style="background:#442200;border-color:#ff6600;color:#ff8844;margin-top:8px">🌀 パンデモニウムへ突入</button>`;
    } else {
        html += `<div style="color:#666;font-size:10px;margin-top:8px">ACTボスをナイトメア/ヘル難易度で倒すと鍵をドロップする</div>`;
    }
    html += `<button class="town-btn" onclick="closeTownUI()" style="margin-top:4px">閉じる</button>`;
    panel.innerHTML = html;
}

function enterUberTristram() {
    // Consume one of each key from questItems
    for (const keyId of Object.keys(UBER_KEY_DEFS)) {
        let consumed = false;
        for (let i = 0; i < G.questItems.length && !consumed; i++) {
            if (G.questItems[i].uberKeyId === keyId) {
                G.questItems.splice(i, 1);
                consumed = true;
            }
        }
        if (!consumed) { addLog('鍵が足りない！', '#ff4444'); return; }
    }
    closeTownUI();
    // Reset uber boss tracking
    G.uberBossesDefeated = {};
    G.inUber = true;
    // Set act/floor for proper XP/loot scaling and lighting
    G.act = 5;
    G.actFloor = ACT_DEFS[5].floors;
    // Generate uber floor using ACT4 theme (hell/pandemonium)
    G.floor = 99;
    G.inTown = false;
    const actDef = ACT_DEFS[4];
    generateTileTextures(actDef.tileTheme); tileTexturesReady = true;
    G.dungeonSeed = (Math.random() * 0x7FFFFFFF) | 0;
    seedRng(G.dungeonSeed);
    dungeon = new Dungeon(99);
    dungeon._tileTheme = actDef.tileTheme || 'hell';
    // Clear arrays
    projectiles.length = 0; enemyProjectiles.length = 0;
    particles.length = 0; bloodPools.length = 0; ambientParticles.length = 0;
    monsters.length = 0; groundItems.length = 0;
    G.traps = []; G.consecrations = []; G.minions = []; G.spawnTimer = 0;
    // Place player at start
    const startRoom = dungeon.rooms[0];
    player.x = startRoom.cx * TILE + TILE/2;
    player.y = startRoom.cy * TILE + TILE/2;
    player.targetX = player.x; player.targetY = player.y;
    player.moving = false; player.attacking = false;
    // Spawn 3 uber bosses in different rooms
    const uberKeys = Object.keys(UBER_BOSS_DEFS);
    for (let i = 0; i < uberKeys.length; i++) {
        const uKey = uberKeys[i];
        const uDef = UBER_BOSS_DEFS[uKey];
        // Use rooms 2, 4, 6 (or last available) for spacing
        const roomIdx = Math.min(2 + i * 2, dungeon.rooms.length - 1);
        const room = dungeon.rooms[roomIdx];
        const bm = new Monster(room.cx * TILE + TILE/2, room.cy * TILE + TILE/2, 'demon', 99, uKey);
        // Override with uber stats
        bm.maxHP = Math.round(uDef.hp * getCycleMult());
        bm.hp = bm.maxHP;
        bm.dmg = Math.round(uDef.dmg * getCycleMult());
        bm.spd = uDef.spd;
        bm.r = uDef.r;
        bm.defense = Math.round(uDef.defense * getCycleMult());
        bm.def = { name: uDef.name, icon: uDef.icon, xp: uDef.xp, loot: 1.0, color: uDef.color };
        bm.bossPhase = 0; bm.bossCD = {}; bm.bossState = 'idle'; bm.bossBurrowT = 0;
        bm.drawScale = 2.5; bm.aggroRange = 500;
        bm.isUber = true;
        bm.immunities = uDef.immunities || {};
        monsters.push(bm);
    }
    // Also spawn elite demon guards
    for (let i = 0; i < 15; i++) {
        const room = dungeon.rooms[rand(1, dungeon.rooms.length - 1)];
        const m = new Monster(
            room.cx * TILE + TILE/2 + randf(-60, 60),
            room.cy * TILE + TILE/2 + randf(-60, 60),
            'demon', 99
        );
        m.makeChampion();
        monsters.push(m);
    }
    unseedRng();
    showActTransition('パンデモニウム', 'Pandemonium Tristram');
    addLog('⚠ パンデモニウムに突入した！ウーバーボスが3体待ち受ける！', '#ff0000');
    if (audioCtx && SETTINGS.sound) startBGM(4);
}
window.enterUberTristram = enterUberTristram;

