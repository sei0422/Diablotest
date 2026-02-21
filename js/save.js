// ========== SAVE / LOAD SYSTEM ==========
function saveGame(slot = G.saveSlot) {
    try {
        // Helper to serialize an item including socket/rune data
        const serializeItem = (item) => ({
            name: item.name, typeKey: item.typeKey,
            rarityKey: item.rarityKey, rarity: item.rarity,
            typeInfo: item.typeInfo,
            baseDmg: item.baseDmg, baseDef: item.baseDef,
            affixes: item.affixes || [], desc: item.desc || '',
            icon: item.icon, qty: item.qty || 1,
            setKey: item.setKey || null, setName: item.setName || null,
            requiredLevel: item.requiredLevel || 0, itemLevel: item.itemLevel || 0,
            sockets: item.sockets || 0,
            socketedRunes: Array.isArray(item.socketedRunes) ? [...item.socketedRunes] : (item.sockets > 0 ? [] : null),
            runeword: item.runeword || null,
            runewordJP: item.runewordJP || null,
            runeId: item.runeId != null ? item.runeId : null,
            uberKeyId: item.uberKeyId || null
        });
        const saveData = {
            version: 6,
            timestamp: Date.now(),
            floor: G.floor,
            act: G.act, actFloor: G.actFloor, cycle: G.cycle, inTown: G.inTown, difficulty: G.difficulty || 'normal',
            gold: G.gold, quests: G.quests, questKillCounts: G.questKillCounts,
            waypoints: G.waypoints, bossesDefeated: G.bossesDefeated,
            time: G.time,
            playerClass: G.playerClass,
            dungeonSeed: G.dungeonSeed,
            autoPickup: G.autoPickup,
            autoPickupRarity: G.autoPickupRarity,
            stash: G.stash.map(serializeItem),
            questItems: G.questItems.map(serializeItem),
            player: {
                x: player.x, y: player.y,
                level: player.level, xp: player.xp, xpToNext: player.xpToNext,
                hp: player.hp, maxHP: player.maxHP,
                mp: player.mp, maxMP: player.maxMP,
                str: player.str, dex: player.dex, vit: player.vit, int: player.int,
                statPoints: player.statPoints,
                skillPoints: player.skillPoints,
                classKey: player.classKey,
                className: player.className,
                skillLevels: { ...player.skillLevels },
                defense: player.defense,
                critChance: player.critChance,
                equipment: {},
                inventory: []
            }
        };
        for (const [slot, item] of Object.entries(player.equipment)) {
            saveData.player.equipment[slot] = item ? serializeItem(item) : null;
        }
        for (const item of player.inventory) {
            saveData.player.inventory.push(serializeItem(item));
        }
        saveData.player.potionInv = player.potionInv.map(it => serializeItem(it));
        saveData.player.charmInv = player.charmInv.map(it => serializeItem(it));
	            saveData.player.skills = {};
	            for (let i = 1; i <= 6; i++) {
	                const sk = player.skills[i];
	                if (sk) { // 空スロット対応
	                    saveData.player.skills[i] = {
	                        id: sk.id, name: sk.name, icon: sk.icon, effect: sk.effect, iconEff: sk.iconEff,
	                        mp: sk.mp, maxCD: sk.maxCD, desc: sk.desc
	                    };
	                }
	            }
        // Save only alive monsters (dead ones stay dead on load, skip if in town)
        saveData.monsters = G.inTown ? [] : monsters.filter(m => m.alive).map(m => ({
            x: m.x, y: m.y, type: m.type,
            hp: m.hp, maxHP: m.maxHP, dmg: m.dmg,
            aggroed: m.aggroed,
            isBoss: m.isBoss || false,
            isChampion: m.isChampion || false,
            isUnique: m.isUnique || false,
            defense: m.defense || 0,
            spd: m.spd || 0,
            immunities: Array.isArray(m.immunities) ? [...m.immunities] : [],
            bossKey: m.bossKey != null ? m.bossKey : null
        }));
        // Save ground items
        saveData.groundItems = groundItems.map(gi => ({
            x: gi.x, y: gi.y,
            item: serializeItem(gi.item)
        }));
        // Save mercenary
        if (mercenary) {
            saveData.mercenary = {
                type: mercenary.type, level: mercenary.level,
                xp: mercenary.xp || 0, xpToNext: mercenary.xpToNext || 100,
                hp: mercenary.hp, maxHP: mercenary.maxHP, alive: mercenary.alive,
                weapon: mercenary.equipment.weapon ? serializeItem(mercenary.equipment.weapon) : null,
                armor: mercenary.equipment.armor ? serializeItem(mercenary.equipment.armor) : null
            };
        }
        // Save remaining chest positions (unopened only)
        saveData.remainingChests = [];
        for (let ty = 0; ty < MAP_H; ty++) {
            for (let tx = 0; tx < MAP_W; tx++) {
                if (dungeon.get(tx, ty) === 3) {
                    saveData.remainingChests.push(tx * MAP_H + ty);
                }
            }
        }
        saveData.brokenProps = dungeon && dungeon.brokenProps ? Array.from(dungeon.brokenProps) : [];
        localStorage.setItem(getSaveKey(slot), JSON.stringify(saveData));
        addLog(`ゲームをセーブしました！(スロット${slot})`, '#00ff88');
        addFloatingText(player.x, player.y - 30, 'SAVED!', '#00ff88', false, true);
        emitParticles(player.x, player.y, '#00ff88', 15, 50, 0.5, 3, -40);
        playSound(600, 'sine', 0.1, 0.05);
        if (isPanelVisible(DOM.settingsPanel)) renderSettingsUI();
        return true;
    } catch (e) {
        addLog('セーブに失敗: ' + e.message, '#ff4444');
        return false;
    }
}

function loadGame(slot = G.saveSlot) {
    try {
        const raw = localStorage.getItem(getSaveKey(slot));
        if (!raw) { addLog('セーブデータが見つかりません', '#ff4444'); return false; }
        const save = JSON.parse(raw);
        if (!save || typeof save !== 'object' || !save.player || typeof save.player !== 'object') {
            addLog('セーブデータが壊れています', '#ff4444');
            return false;
        }
        if (!save.version || save.version < 2) {
            addLog('古いセーブデータです。新しくゲームを始めてください', '#ff4444');
            return false;
        }
        // Version 2 saves are compatible - existing skillLevels (1-5) still work

        // Validate classKey before using it
        if (!save.playerClass || !CLASS_DEFS[save.playerClass]) {
            addLog('無効なクラスデータです', '#ff4444');
            return false;
        }

        G.floor = save.floor;
        G.time = save.time || 0;
        G.playerClass = save.playerClass;
        G.dungeonSeed = save.dungeonSeed || 0;
        G.autoPickup = save.autoPickup || false;
        G.autoPickupRarity = save.autoPickupRarity || 'normal';

        // v4: ACT system migration
        if (save.version >= 4) {
            G.act = save.act || 1;
            G.actFloor = save.actFloor || 1;
            G.cycle = save.cycle || 0;
            G.difficulty = save.difficulty || 'normal';
            G.inTown = save.inTown || false;
            G.gold = save.gold || 0;
            G.quests = save.quests || {};
            G.questKillCounts = save.questKillCounts || {};
            G.waypoints = save.waypoints || [1];
            G.bossesDefeated = save.bossesDefeated || {};
            G.stash = (save.stash || []).map(it => { it.qty = it.qty || 1; return it; });
            G.questItems = (save.questItems || []).map(it => { it.qty = it.qty || 1; return it; });
        } else {
            // v2/v3 migration: map old global floor to ACT system
            const mapped = globalFloorToAct(save.floor || 1);
            G.act = mapped.act;
            G.actFloor = mapped.actFloor;
            G.cycle = mapped.cycle;
            G.inTown = false;
            G.gold = 0;
            G.quests = {};
            G.questKillCounts = {};
            G.waypoints = [1];
            for (let a = 1; a <= mapped.act; a++) G.waypoints.push(a);
            G.bossesDefeated = {};
            G.stash = [];
        }

        G.dead = false;
        G.portalReturn = null;
        setPaused(false);
        setPanelVisible(DOM.settingsPanel, false);
        G.started = true;

        const p = save.player;
        player.level = p.level;
        player.xp = p.xp;
        player.xpToNext = p.xpToNext;
        player.str = p.str; player.dex = p.dex;
        player.vit = p.vit; player.int = p.int;
        player.statPoints = p.statPoints || 0;
        player.skillPoints = p.skillPoints || 0;
        player.classKey = p.classKey;
        player.className = p.className;
        player.skillLevels = p.skillLevels || {};

        // Helper to restore rune runtime references and fix socket arrays
        const restoreRuneRefs = (item) => {
            if (!item) return;
            if (item.typeKey === 'rune' && item.runeId != null) {
                item.runeDef = RUNE_DEFS[item.runeId];
                item.typeInfo = ITEM_TYPES.rune;
            }
            // Restore potion typeInfo from ITEM_TYPES (backward compat)
            if (ITEM_TYPES[item.typeKey] && ITEM_TYPES[item.typeKey].potionType) {
                item.typeInfo = ITEM_TYPES[item.typeKey];
            }
            // Ensure socketed items always have an array (fixes Codex P2 bug)
            if (item.sockets > 0 && !Array.isArray(item.socketedRunes)) {
                item.socketedRunes = [];
            }
        };
        for (const [slot, item] of Object.entries(p.equipment)) {
            if (item) restoreRuneRefs(item);
            player.equipment[slot] = item;
        }
        player.inventory = (p.inventory || []).map(it => { it.qty = it.qty || 1; restoreRuneRefs(it); return it; });
        // Migrate potions from inventory to potionInv (backward compat)
        player.potionInv = (p.potionInv || []).map(it => { it.qty = it.qty || 1; restoreRuneRefs(it); return it; });
        player.charmInv = (p.charmInv || []).map(it => { restoreRuneRefs(it); return it; });
        // Backward compat: move any potions/charms stuck in main inventory
        for (let i = player.inventory.length - 1; i >= 0; i--) {
            const it = player.inventory[i];
            if (isPotion(it) && player.potionInv.length < player.maxPotionInv) {
                player.potionInv.push(player.inventory.splice(i, 1)[0]);
            } else if (isCharm(it) && player.charmInv.length < player.maxCharmInv) {
                player.charmInv.push(player.inventory.splice(i, 1)[0]);
            }
        }
        // Restore stash rune refs
        for (const it of G.stash) restoreRuneRefs(it);

        player.recalcStats();
        player.hp = Math.min(p.hp, player.maxHP);
        player.mp = Math.min(p.mp, player.maxMP);

        DOM.titleScreen.style.display = 'none';
        DOM.deathScreen.style.display = 'none';

        // Generate dungeon or town with saved seed
        G.inUber = false; // Uber state is transient, always reset on load
        // Migrate uber keys from inventory/stash to questItems (backward compat)
        G.questItems = G.questItems || [];
        for (const arr of [player.inventory, G.stash]) {
            for (let i = arr.length - 1; i >= 0; i--) {
                if (arr[i].uberKeyId) { G.questItems.push(arr.splice(i, 1)[0]); }
            }
        }
        if (G.inTown) {
            enterTown(G.act);
        } else {
            // Skip entity spawning - we'll restore saved monsters/items
            initFloor({ useSeed: true, skipEntities: true });
        }

        // Restore only alive monsters from save (dead ones are gone)
        monsters.length = 0;
        if (save.monsters && save.monsters.length > 0) {
            for (const sm of save.monsters) {
                const m = new Monster(sm.x, sm.y, sm.type, G.floor);
                m.hp = sm.hp; m.maxHP = sm.maxHP; m.dmg = sm.dmg;
                m.isBoss = !!sm.isBoss;
                m.isChampion = !!sm.isChampion;
                m.isUnique = !!sm.isUnique;
                if (sm.defense != null) m.defense = sm.defense;
                if (sm.spd != null) m.spd = sm.spd;
                m.immunities = Array.isArray(sm.immunities) ? [...sm.immunities] : [];
                if (sm.bossKey != null) m.bossKey = sm.bossKey;
                m.alive = true; m.aggroed = sm.aggroed || false;
                monsters.push(m);
            }
        }
        // Restore ground items from save
        groundItems.length = 0;
        if (save.groundItems && save.groundItems.length > 0) {
            for (const sgi of save.groundItems) {
                sgi.item.qty = sgi.item.qty || 1;
                restoreRuneRefs(sgi.item);
                groundItems.push(new GroundItem(sgi.x, sgi.y, sgi.item));
            }
        }
        // Restore opened chests: remove chests that were opened
        if (save.remainingChests) {
            const remaining = new Set(save.remainingChests);
            for (let ty = 0; ty < MAP_H; ty++) {
                for (let tx = 0; tx < MAP_W; tx++) {
                    if (dungeon.get(tx, ty) === 3) {
                        const key = tx * MAP_H + ty;
                        if (!remaining.has(key)) {
                            dungeon.set(tx, ty, 1); // chest was opened
                        }
                    }
                }
            }
        }
        if (Array.isArray(save.brokenProps)) {
            dungeon.brokenProps = new Set(save.brokenProps);
        }

        // THEN restore player position
        player.x = p.x; player.y = p.y;
        if (!canWalk(player.x, player.y, 10)) {
            for (const room of dungeon.rooms) {
                const rx = room.x * TILE + room.w * TILE / 2;
                const ry = room.y * TILE + room.h * TILE / 2;
                if (canWalk(rx, ry, 10)) { player.x = rx; player.y = ry; break; }
            }
        }
        G.camX = player.x - W / 2;
        G.camY = player.y - H / 2;

        // Restore skills with proper maxCD lookup (using new scaled formulas)
        player.skills = {}; // 他のセーブファイルのスキル汚染を防ぐ
	            if (p.skills) {
	                const allSkills = getAllAvailableSkills();
	                for (let i = 1; i <= 6; i++) {
	                    if (p.skills[i]) {
	                        const skillDef = allSkills.find(sk => sk.id === p.skills[i].id);
	                        if (skillDef && skillDef.skillType === 'passive') continue; // Don't restore passive skills to slots
	                        const slvl = player.skillLevels[p.skills[i].id] || 1;
	                        const maxCD = skillDef ? getSkillCooldown(skillDef, slvl) : (p.skills[i].maxCD || 0);
	                        const mp = skillDef ? getSkillMPCost(skillDef, slvl) : (p.skills[i].mp || 0);
	                        const effect = p.skills[i].effect || (skillDef ? skillDef.effect : undefined);
	                        const iconEff = p.skills[i].iconEff || (skillDef ? skillDef.iconEff : undefined);
	                        player.skills[i] = { ...p.skills[i], cooldown: 0, maxCD: maxCD, mp: mp, effect: effect, iconEff: iconEff };
	                    }
	                }
	            }
        // Recalculate passives on load
        recalcPassives();
        // セーブデータにskillsがない場合も空のまま

        addLog(`ロード完了！ACT${G.act} Lv.${player.level} (スロット${slot})`, '#00ff88');
        addFloatingText(player.x, player.y - 30, 'LOADED!', '#00ff88', false, true);
        emitParticles(player.x, player.y, '#00ff88', 20, 60, 0.5, 4, -40);
        playSound(400, 'sine', 0.12, 0.06);
        const savedDate = new Date(save.timestamp);
        addLog(`セーブ日時: ${savedDate.toLocaleString('ja-JP')}`, '#888');
        if (isPanelVisible(DOM.settingsPanel)) renderSettingsUI();
        // Restore mercenary
        mercenary = null;
        if (save.mercenary && save.mercenary.type && MERCENARY_DEFS[save.mercenary.type]) {
            mercenary = new Mercenary(save.mercenary.type, player.x + 40, player.y);
            mercenary.level = save.mercenary.level || player.level;
            mercenary.xp = save.mercenary.xp || 0;
            mercenary.xpToNext = save.mercenary.xpToNext || Math.round(80 * Math.pow(1.25, mercenary.level - 1));
            mercenary.alive = save.mercenary.alive !== false;
            mercenary.recalcStats(false);
            if (typeof save.mercenary.hp === 'number') mercenary.hp = Math.min(save.mercenary.hp, mercenary.maxHP);
            if (!mercenary.alive) mercenary.hp = 0;
            if (save.mercenary.weapon) mercenary.equipment.weapon = save.mercenary.weapon;
            if (save.mercenary.armor) mercenary.equipment.armor = save.mercenary.armor;
            mercenary.recalcStats(false);
        }
        // Pre-render skill icons now that class is loaded
        preRenderSkillIcons();
        return true;
    } catch (e) {
        addLog('ロードに失敗: ' + e.message, '#ff4444');
        console.error('Load error:', e);
        return false;
    }
}

function hasSaveData(slot = G.saveSlot) {
    try { return !!localStorage.getItem(getSaveKey(slot)); } catch (e) { return false; }
}

function tryUseStairs(showBlocked) {
    if (!dungeon) return false;
    const ptx = Math.floor(player.x / TILE), pty = Math.floor(player.y / TILE);
    const onTile = dungeon.get(ptx, pty) === 2;
    const sd = dist(player.x, player.y, dungeon.stairsX * TILE + TILE/2, dungeon.stairsY * TILE + TILE/2);
    const nearStairs = sd < 45;
    if (!onTile && !nearStairs) return false;

    // Town: enter dungeon (ACT floor 1)
    if (G.inTown) {
        sfxStairs();
        closeTownUI();
        G.portalReturn = null; // close return portal
        G.actFloor = 1;
        G.inTown = false;
        initFloor();
        return true;
    }

    // Uber floor: stairs return to town
    if (G.inUber) {
        sfxStairs();
        G.inUber = false;
        enterTown(5);
        addLog('パンデモニウムから帰還した', '#88ff88');
        return true;
    }

    // Dungeon: check for nearby enemies
    const stairCX = dungeon.stairsX * TILE + TILE/2;
    const stairCY = dungeon.stairsY * TILE + TILE/2;
    const nearbyEnemies = monsters.filter(m => m.alive && dist(m.x, m.y, stairCX, stairCY) < 200);
    if (nearbyEnemies.length > 0) {
        if (showBlocked) addLog(`階段付近に敵が${nearbyEnemies.length}体いる...`, '#ff4444');
        return false;
    }
    sfxStairs();

    const actDef = getCurrentActDef();
    if (G.actFloor >= actDef.floors) {
        // Last floor of ACT: go to next ACT's town
        if (G.act >= 5) {
            // Completed ACT5: start new cycle (NG+)
            G.cycle++;
            showActTransition(`${G.cycle + 1}周目 開始！`, `全ACTの敵が強化されました`);
            enterTown(1);
        } else {
            showActTransition(`ACT ${G.act + 1}: ${ACT_DEFS[G.act + 1].name}`, ACT_DEFS[G.act + 1].nameEn);
            enterTown(G.act + 1);
        }
    } else {
        // Normal floor progression within ACT
        G.actFloor++;
        initFloor();
    }
    return true;
}

function showActTransition(line1, line2) {
    G.actTransitionTimer = 3.0;
    G.actTransitionText = line1;
    G.actTransitionText2 = line2 || '';
}

