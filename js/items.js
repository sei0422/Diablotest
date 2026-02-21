// ========== ITEM SYSTEM ==========
const ITEM_TYPES = {
    sword:   { name: '剣', icon: '⚔', slot: 'weapon', baseDmg: [5, 12] },
    axe:     { name: '戦斧', icon: '🪓', slot: 'weapon', baseDmg: [8, 16] },
    staff:   { name: '杖', icon: '🔮', slot: 'weapon', baseDmg: [5, 12] },
    shield:  { name: '盾', icon: '🛡', slot: 'offhand', baseDef: [3, 8] },
    helmet:  { name: '兜', icon: '⛑', slot: 'head', baseDef: [2, 5] },
    armor:   { name: '鎧', icon: '🦺', slot: 'body', baseDef: [4, 10] },
    ring:    { name: '指輪', icon: '💍', slot: 'ring', baseDef: [0, 1] },
    amulet:  { name: '護符', icon: '📿', slot: 'amulet', baseDef: [0, 1] },
    boots:   { name: '靴', icon: '👢', slot: 'feet', baseDef: [1, 4] },
    rune:    { name: 'ルーン', icon: '🔶', slot: null },
    quest_key: { name: '鍵', icon: '🗝', slot: null },
    // Tiered HP potions (D2-style, heal over time)
    hp1: { name: '下級HP薬', icon: '🧪', slot: null, potionType: 'hp', tier: 1, heal: 45, healDur: 7 },
    hp2: { name: 'HP薬', icon: '🧪', slot: null, potionType: 'hp', tier: 2, heal: 90, healDur: 6 },
    hp3: { name: '上級HP薬', icon: '🧪', slot: null, potionType: 'hp', tier: 3, heal: 150, healDur: 5 },
    hp4: { name: '強力HP薬', icon: '🧪', slot: null, potionType: 'hp', tier: 4, heal: 210, healDur: 4.5 },
    hp5: { name: '超HP薬', icon: '🧪', slot: null, potionType: 'hp', tier: 5, heal: 320, healDur: 4 },
    // Tiered MP potions (D2-style, restore over time)
    mp1: { name: '下級MP薬', icon: '💧', slot: null, potionType: 'mp', tier: 1, healMP: 30, healDur: 5 },
    mp2: { name: 'MP薬', icon: '💧', slot: null, potionType: 'mp', tier: 2, healMP: 60, healDur: 5 },
    mp3: { name: '上級MP薬', icon: '💧', slot: null, potionType: 'mp', tier: 3, healMP: 120, healDur: 5 },
    // Rejuvenation potions (instant)
    rejuv: { name: '回復のポーション', icon: '💜', slot: null, potionType: 'rejuv', rejuvPct: 0.35 },
    fullrejuv: { name: '完全回復のポーション', icon: '💎', slot: null, potionType: 'rejuv', rejuvPct: 1.0 },
    // Charms (D2-style: passive bonuses while in charm inventory)
    smallCharm:  { name: '小チャーム', icon: '🔹', slot: null, charmSize: 1 },
    mediumCharm: { name: '中チャーム', icon: '🔷', slot: null, charmSize: 2 },
    grandCharm:  { name: '大チャーム', icon: '💠', slot: null, charmSize: 3 },
    // Legacy aliases (backward compat for old saves)
    potion: { name: 'HP回復薬', icon: '🧪', slot: null, potionType: 'hp', tier: 1, heal: 45, healDur: 7 },
    manaPotion: { name: 'MP回復薬', icon: '💧', slot: null, potionType: 'mp', tier: 1, healMP: 30, healDur: 5 }
};

const RARITY = {
    common:    { name: 'コモン', color: '#cccccc', affixes: 0, mult: 1 },
    magic:     { name: 'マジック', color: '#6688ff', affixes: [1,2], mult: 1.3 },
    rare:      { name: 'レア', color: '#ffdd44', affixes: [2,3], mult: 1.6 },
    legendary: { name: 'レジェンダリー', color: '#ff8800', affixes: [3,4], mult: 2.0 },
    unique:    { name: 'ユニーク', color: '#00dd66', affixes: [4,5], mult: 2.5 }
};

// D2-style diminishing returns for Magic Find per quality tier
function effMF(mf, factor) {
    return (mf * factor) / (mf + factor);
}

// D2-style difficulty-based drop tables
const RARITY_TABLES = {
    normal: { common: 0.70, magic: 0.24, rare: 0.04, legendary: 0.015, unique: 0.005 },
    nightmare: { common: 0.50, magic: 0.32, rare: 0.12, legendary: 0.04, unique: 0.02 },
    hell: { common: 0.30, magic: 0.37, rare: 0.20, legendary: 0.08, unique: 0.05 }
};

// D2-style gambling rarity table (no common items, higher unique chance)
const GAMBLE_RARITY_TABLE = {
    common: 0.0,    // Never get common from gambling
    magic: 0.90,    // 90% magic
    rare: 0.08,     // 8% rare
    legendary: 0.015, // 1.5% legendary
    unique: 0.005   // 0.5% unique
};

// Gambling item categories (D2-style: fixed cost per category)
const GAMBLE_ITEMS = [
    { type: 'ring', name: '指輪', cost: 5000, icon: '💍' },
    { type: 'amulet', name: 'アミュレット', cost: 8000, icon: '📿' },
    { type: 'weapon', name: '武器(ランダム)', cost: 15000, icon: '⚔' },
    { type: 'armor', name: '防具(ランダム)', cost: 20000, icon: '🛡' }
];

// D2-style item pricing system: base prices by item type
const ITEM_BASE_PRICES = {
    // Weapons
    sword: 100,
    axe: 120,
    staff: 200,
    // Armor
    helmet: 80,
    armor: 200,
    shield: 150,
    boots: 60,
    // Accessories
    ring: 300,
    amulet: 500,
    // Special
    rune: 1000,
    potion: 50,
    manaPotion: 80
};

// D2-style rarity price multipliers (sell price = base × rarity × level_factor)
const RARITY_PRICE_MULT = {
    common: 1,
    magic: 3,
    rare: 8,
    legendary: 20,
    unique: 50,
    runeword: 100
};

function pickRarity(baseRoll, mf, diffDrop) {
    const difficulty = G.difficulty || 'normal';
    const table = RARITY_TABLES[difficulty];

    // Apply quality-specific effective MF (D2 formula: diminishing returns)
    // Factors: unique=250, legendary=400, rare=600, magic=full MF
    const applyMF = (effectiveMF) => {
        const boost = 1 + effectiveMF / 100 + diffDrop;
        return baseRoll / boost;
    };

    const uniqueR = applyMF(effMF(mf, 250));
    if (uniqueR >= (1 - table.unique)) return 'unique';

    const legendR = applyMF(effMF(mf, 400));
    if (legendR >= (1 - table.unique - table.legendary)) return 'legendary';

    const rareR = applyMF(effMF(mf, 600));
    if (rareR >= (1 - table.unique - table.legendary - table.rare)) return 'rare';

    const magicR = applyMF(mf);
    if (magicR >= (1 - table.unique - table.legendary - table.rare - table.magic)) return 'magic';

    return 'common';
}
function getAffixCount(rarity) {
    return Array.isArray(rarity.affixes)
        ? rand(rarity.affixes[0], rarity.affixes[1])
        : rarity.affixes;
}

const AFFIXES = [
    { stat: 'str', fmt: '+{v} 筋力', min: 1, max: 8 },
    { stat: 'dex', fmt: '+{v} 敏捷', min: 1, max: 8 },
    { stat: 'vit', fmt: '+{v} 体力', min: 1, max: 8 },
    { stat: 'int', fmt: '+{v} 知力', min: 1, max: 8 },
    { stat: 'dmgPct', fmt: '+{v}% ダメージ', min: 3, max: 25 },
    { stat: 'hp', fmt: '+{v} HP', min: 10, max: 80 },
    { stat: 'mp', fmt: '+{v} MP', min: 10, max: 60 },
    { stat: 'lifesteal', fmt: '{v}% ライフスティール', min: 2, max: 10 },
    { stat: 'atkSpd', fmt: '+{v}% 攻撃速度', min: 5, max: 20 },
    { stat: 'def', fmt: '+{v} 防御', min: 2, max: 12 },
    { stat: 'critChance', fmt: '+{v}% クリティカル率', min: 2, max: 10 },
    { stat: 'critDmg', fmt: '+{v}% クリティカルダメージ', min: 10, max: 30 },
    { stat: 'moveSpd', fmt: '+{v}% 移動速度', min: 3, max: 15 },
    { stat: 'fireRes', fmt: '+{v}% 火炎耐性', min: 5, max: 25 },
    { stat: 'coldRes', fmt: '+{v}% 冷気耐性', min: 5, max: 25 },
    { stat: 'lightRes', fmt: '+{v}% 雷耐性', min: 5, max: 25 },
    { stat: 'poisonRes', fmt: '+{v}% 毒耐性', min: 5, max: 25 },
    { stat: 'allRes', fmt: '+{v}% 全耐性', min: 3, max: 15 },
    { stat: 'blockChance', fmt: '+{v}% ブロック率', min: 5, max: 15 },
    { stat: 'magicFind', fmt: '+{v}% マジックファインド', min: 5, max: 35 },
    { stat: 'skillBonus', fmt: '+{v} 全スキルレベル', min: 1, max: 1 }
];

const UNIQUE_NAMES = {
    sword: ['魔剣ダーンスレイヴ', '炎の断裂', '虚空の牙'],
    axe: ['粉砕者', '血塗れの三日月', '嵐の刃'],
    staff: ['不死鳥の杖', '暗黒の大杖', '星霜の導き'],
    shield: ['不滅の壁', '守護者の誓い'],
    helmet: ['龍王の冠', '深淵の面'],
    armor: ['不屈の鎧', '煉獄の胸当て'],
    ring: ['運命の環', '闇の瞳'],
    amulet: ['魂の首飾り', '永遠の心臓'],
    boots: ['疾風の靴', '影渡りの長靴']
};

// ========== SET ITEMS (D2-style) ==========
const ITEM_SETS = {
    angelic_raiment: {
        name: '天使の衣',
        color: '#44ff88',
        pieces: { amulet: '天使の声', ring: '天使の指輪', armor: '天使の鎧' },
        bonuses: {
            2: { hp: 50, allRes: 10, desc: '+50 HP, +10 全耐性' },
            3: { hp: 100, allRes: 20, dmgPct: 15, desc: '+100 HP, +20 全耐性, +15% ダメージ' }
        }
    },
    berserker_arsenal: {
        name: '狂戦士の武装',
        color: '#ff4444',
        pieces: { sword: '狂戦士の刃', helmet: '狂戦士の兜', boots: '狂戦士の脚甲' },
        bonuses: {
            2: { dmgPct: 20, critChance: 5, desc: '+20% ダメージ, +5% クリ率' },
            3: { dmgPct: 40, critChance: 10, atkSpd: 15, desc: '+40% ダメージ, +10% クリ率, +15% 攻撃速度' }
        }
    },
    arcane_sanctuary: {
        name: '秘術の聖域',
        color: '#8844ff',
        pieces: { staff: '秘術の杖', helmet: '秘術の冠', ring: '秘術の環' },
        bonuses: {
            2: { mp: 80, allRes: 8, desc: '+80 MP, +8 全耐性' },
            3: { mp: 150, allRes: 15, skillBonus: 1, desc: '+150 MP, +15 全耐性, +1 全スキル' }
        }
    },
    death_ward: {
        name: '死の守護',
        color: '#888888',
        pieces: { shield: '死の壁', armor: '死の鎧', boots: '死の靴' },
        bonuses: {
            2: { def: 30, blockChance: 10, desc: '+30 防御, +10% ブロック率' },
            3: { def: 60, blockChance: 20, hp: 80, desc: '+60 防御, +20% ブロック率, +80 HP' }
        }
    },
    shadow_dancer: {
        name: '影踊り',
        color: '#aa66cc',
        pieces: { axe: '影の斧', amulet: '影の護符', boots: '影の靴' },
        bonuses: {
            2: { moveSpd: 15, critChance: 8, desc: '+15% 移動速度, +8% クリ率' },
            3: { moveSpd: 25, critChance: 15, lifesteal: 8, desc: '+25% 移動速度, +15% クリ率, +8% ライフスティール' }
        }
    }
};

function findSetForItem(itemName) {
    for (const [setKey, setDef] of Object.entries(ITEM_SETS)) {
        for (const pieceName of Object.values(setDef.pieces)) {
            if (pieceName === itemName) return setKey;
        }
    }
    return null;
}

function countEquippedSetPieces(setKey) {
    const setDef = ITEM_SETS[setKey];
    if (!setDef) return 0;
    let count = 0;
    for (const slot of Object.values(player.equipment)) {
        if (!slot || !slot.setKey) continue;
        if (slot.setKey === setKey) count++;
    }
    return count;
}

function getActiveSetBonuses() {
    const bonuses = {};
    for (const [setKey, setDef] of Object.entries(ITEM_SETS)) {
        const count = countEquippedSetPieces(setKey);
        if (count >= 2) {
            for (const [reqCount, bonus] of Object.entries(setDef.bonuses)) {
                if (count >= parseInt(reqCount)) {
                    for (const [stat, val] of Object.entries(bonus)) {
                        if (stat === 'desc') continue;
                        bonuses[stat] = (bonuses[stat] || 0) + val;
                    }
                }
            }
        }
    }
    return bonuses;
}

// ========== RUNE & RUNEWORD SYSTEM ==========
const RUNE_DEFS = [
    { id: 0,  name: 'El',   icon: '᚛', color: '#cccccc', tier: 1, effect: { stat: 'def',        value: 2  }, desc: '+2 防御' },
    { id: 1,  name: 'Eld',  icon: '᚜', color: '#cccccc', tier: 1, effect: { stat: 'dmgPct',     value: 5  }, desc: '+5% ダメージ' },
    { id: 2,  name: 'Tir',  icon: '᚝', color: '#cccccc', tier: 1, effect: { stat: 'mp',         value: 10 }, desc: '+10 MP' },
    { id: 3,  name: 'Nef',  icon: '᚞', color: '#cccccc', tier: 1, effect: { stat: 'def',        value: 5  }, desc: '+5 防御' },
    { id: 4,  name: 'Ith',  icon: '᚟', color: '#6688ff', tier: 2, effect: { stat: 'dmgPct',     value: 8  }, desc: '+8% ダメージ' },
    { id: 5,  name: 'Ral',  icon: 'ᚠ', color: '#ff6633', tier: 2, effect: { stat: 'fireRes',    value: 10 }, desc: '+10% 火炎耐性' },
    { id: 6,  name: 'Ort',  icon: 'ᚡ', color: '#ffdd44', tier: 2, effect: { stat: 'lightRes',   value: 10 }, desc: '+10% 雷耐性' },
    { id: 7,  name: 'Thul', icon: 'ᚢ', color: '#66ccff', tier: 2, effect: { stat: 'coldRes',    value: 10 }, desc: '+10% 冷気耐性' },
    { id: 8,  name: 'Amn',  icon: 'ᚣ', color: '#ff8800', tier: 2, effect: { stat: 'lifesteal',  value: 3  }, desc: '+3% ライフスティール' },
    { id: 9,  name: 'Sol',  icon: 'ᚤ', color: '#ff8800', tier: 2, effect: { stat: 'hp',         value: 20 }, desc: '+20 HP' },
    { id: 10, name: 'Um',   icon: 'ᚥ', color: '#ff8800', tier: 3, effect: { stat: 'allRes',     value: 8  }, desc: '+8% 全耐性' },
    { id: 11, name: 'Mal',  icon: 'ᚦ', color: '#ff4444', tier: 3, effect: { stat: 'critChance', value: 3  }, desc: '+3% クリティカル率' },
    { id: 12, name: 'Ist',  icon: 'ᚧ', color: '#ff4444', tier: 3, effect: { stat: 'magicFind',  value: 15 }, desc: '+15% マジックファインド' },
    { id: 13, name: 'Lo',   icon: 'ᚨ', color: '#ff4444', tier: 3, effect: { stat: 'critDmg',    value: 10 }, desc: '+10% クリティカルダメージ' },
    { id: 14, name: 'Zod',  icon: 'ᚩ', color: '#00dd66', tier: 3, effect: { stat: 'skillBonus', value: 1  }, desc: '+1 全スキルレベル' }
];

const MAX_SOCKETS = { sword: 4, axe: 4, staff: 4, shield: 3, helmet: 3, armor: 4 };

const RUNEWORD_DEFS = [
    {
        name: 'Spirit',  nameJP: '精霊',
        runes: [2, 7, 6, 8],  // Tir + Thul + Ort + Amn
        sockets: 4,
        validTypes: ['sword', 'shield'],
        bonuses: [
            { stat: 'skillBonus', value: 2, text: '+2 全スキルレベル' },
            { stat: 'critChance', value: 10, text: '+10% クリティカル率' },
            { stat: 'hp', value: 50, text: '+50 HP' },
            { stat: 'mp', value: 50, text: '+50 MP' }
        ]
    },
    {
        name: 'Insight',  nameJP: '洞察',
        runes: [5, 2, 2, 9],  // Ral + Tir + Tir + Sol
        sockets: 4,
        validTypes: ['staff'],
        bonuses: [
            { stat: 'skillBonus', value: 1, text: '+1 全スキルレベル' },
            { stat: 'mp', value: 200, text: '+200 MP' },
            { stat: 'dmgPct', value: 15, text: '+15% ダメージ' }
        ]
    },
    {
        name: 'Stealth',  nameJP: '隠密',
        runes: [2, 4],  // Tir + Ith
        sockets: 2,
        validTypes: ['armor'],
        bonuses: [
            { stat: 'moveSpd', value: 15, text: '+15% 移動速度' },
            { stat: 'atkSpd', value: 10, text: '+10% 攻撃速度' },
            { stat: 'def', value: 15, text: '+15 防御' }
        ]
    },
    {
        name: 'Lore',  nameJP: '知識',
        runes: [6, 9],  // Ort + Sol
        sockets: 2,
        validTypes: ['helmet'],
        bonuses: [
            { stat: 'skillBonus', value: 1, text: '+1 全スキルレベル' },
            { stat: 'hp', value: 30, text: '+30 HP' },
            { stat: 'lightRes', value: 15, text: '+15% 雷耐性' }
        ]
    },
    {
        name: 'Rhyme',  nameJP: '韻律',
        runes: [8, 10],  // Amn + Um
        sockets: 2,
        validTypes: ['shield'],
        bonuses: [
            { stat: 'blockChance', value: 15, text: '+15% ブロック率' },
            { stat: 'allRes', value: 15, text: '+15% 全耐性' },
            { stat: 'magicFind', value: 15, text: '+15% マジックファインド' }
        ]
    },
    {
        name: 'Enigma',  nameJP: '謎',
        runes: [10, 12, 14],  // Um + Ist + Zod
        sockets: 3,
        validTypes: ['armor'],
        bonuses: [
            { stat: 'skillBonus', value: 2, text: '+2 全スキルレベル' },
            { stat: 'moveSpd', value: 25, text: '+25% 移動速度' },
            { stat: 'hp', value: 80, text: '+80 HP' },
            { stat: 'magicFind', value: 20, text: '+20% マジックファインド' }
        ]
    },
    {
        name: 'Fury',  nameJP: '憤怒',
        runes: [11, 13, 12],  // Mal + Lo + Ist
        sockets: 3,
        validTypes: ['sword', 'axe'],
        bonuses: [
            { stat: 'dmgPct', value: 25, text: '+25% ダメージ' },
            { stat: 'critChance', value: 8, text: '+8% クリティカル率' },
            { stat: 'critDmg', value: 25, text: '+25% クリティカルダメージ' },
            { stat: 'atkSpd', value: 10, text: '+10% 攻撃速度' }
        ]
    },
    {
        name: 'Silence',  nameJP: '静寂',
        runes: [1, 8, 11, 12],  // Eld + Amn + Mal + Ist
        sockets: 4,
        validTypes: ['sword', 'axe', 'staff'],
        bonuses: [
            { stat: 'dmgPct', value: 20, text: '+20% ダメージ' },
            { stat: 'lifesteal', value: 5, text: '+5% ライフスティール' },
            { stat: 'allRes', value: 15, text: '+15% 全耐性' },
            { stat: 'magicFind', value: 15, text: '+15% マジックファインド' }
        ]
    },
    {
        name: 'Ancients Pledge',  nameJP: '古の誓い',
        runes: [5, 6, 7],  // Ral + Ort + Thul
        sockets: 3,
        validTypes: ['shield'],
        bonuses: [
            { stat: 'fireRes', value: 25, text: '+25% 火炎耐性' },
            { stat: 'lightRes', value: 25, text: '+25% 雷耐性' },
            { stat: 'coldRes', value: 25, text: '+25% 冷気耐性' },
            { stat: 'def', value: 20, text: '+20 防御' }
        ]
    },
    {
        name: 'Venom',  nameJP: '猛毒',
        runes: [7, 13, 14],  // Thul + Lo + Zod
        sockets: 3,
        validTypes: ['sword', 'axe'],
        bonuses: [
            { stat: 'dmgPct', value: 30, text: '+30% ダメージ' },
            { stat: 'critDmg', value: 20, text: '+20% クリティカルダメージ' },
            { stat: 'poisonRes', value: 20, text: '+20% 毒耐性' },
            { stat: 'atkSpd', value: 15, text: '+15% 攻撃速度' }
        ]
    }
];

function rollSockets(typeKey, rarityKey) {
    const maxSock = MAX_SOCKETS[typeKey];
    if (!maxSock) return 0;
    const chance = rarityKey === 'common' ? 0.30 :
                   rarityKey === 'magic' ? 0.15 :
                   rarityKey === 'rare' ? 0.10 : 0.05;
    if (Math.random() >= chance) return 0;
    const cap = rarityKey === 'common' ? maxSock :
                rarityKey === 'magic' ? Math.min(2, maxSock) :
                rarityKey === 'rare' ? Math.min(2, maxSock) : 1;
    return rand(1, cap);
}

function generateRune(floor) {
    // Higher floors → higher tier runes possible
    const tierWeights = floor < 5 ? [80, 20, 0] :
                        floor < 10 ? [50, 40, 10] :
                        floor < 15 ? [30, 45, 25] : [15, 40, 45];
    const roll = Math.random() * 100;
    const tier = roll < tierWeights[0] ? 1 : roll < tierWeights[0] + tierWeights[1] ? 2 : 3;
    const pool = RUNE_DEFS.filter(r => r.tier === tier);
    const def = pool[rand(0, pool.length - 1)];
    return {
        typeKey: 'rune', typeInfo: ITEM_TYPES.rune,
        rarityKey: tier === 3 ? 'legendary' : tier === 2 ? 'magic' : 'common',
        rarity: tier === 3 ? { name: '高級ルーン', color: '#ff8800' } :
                tier === 2 ? { name: 'ルーン', color: '#6688ff' } :
                             { name: 'ルーン', color: '#cccccc' },
        name: `${def.name}のルーン`,
        icon: '🔶',
        runeId: def.id,
        runeDef: def,
        affixes: [],
        baseDmg: null, baseDef: null,
        itemLevel: 0, requiredLevel: 0
    };
}

function isRune(item) { return item && item.typeKey === 'rune'; }

function insertRuneIntoItem(item, runeItem) {
    if (!item.sockets || !item.socketedRunes) return false;
    if (item.socketedRunes.length >= item.sockets) return false;
    if (item.runeword) return false; // Already has runeword
    // Push the rune data
    item.socketedRunes.push({ runeId: runeItem.runeId, name: runeItem.runeDef.name });
    // Add rune individual bonus to affixes
    const rd = RUNE_DEFS[runeItem.runeId];
    item.affixes.push({
        stat: rd.effect.stat, value: rd.effect.value,
        text: rd.desc, runeSource: rd.name
    });
    // Check if runeword formed
    checkAndApplyRuneword(item);
    return true;
}

function checkAndApplyRuneword(item) {
    if (!item.socketedRunes || item.socketedRunes.length === 0) return;
    const insertedIds = item.socketedRunes.map(r => r.runeId);
    for (const rw of RUNEWORD_DEFS) {
        if (rw.sockets !== item.sockets) continue;
        if (insertedIds.length !== rw.runes.length) continue;
        if (!rw.validTypes.includes(item.typeKey)) continue;
        // Check exact rune order
        let match = true;
        for (let i = 0; i < rw.runes.length; i++) {
            if (insertedIds[i] !== rw.runes[i]) { match = false; break; }
        }
        if (!match) continue;
        // Runeword formed! Replace individual rune affixes with runeword bonuses
        item.affixes = item.affixes.filter(a => !a.runeSource);
        for (const b of rw.bonuses) {
            item.affixes.push({
                stat: b.stat, value: b.value, text: b.text,
                runewordSource: rw.name
            });
        }
        item.runeword = rw.name;
        item.runewordJP = rw.nameJP;
        // Override name and rarity display
        item.name = `${rw.nameJP}【${rw.name}】`;
        item.rarity = { name: 'ルーンワード', color: '#daa520' };
        item.rarityKey = 'runeword';
        addLog(`★ ルーンワード『${rw.nameJP}【${rw.name}】』が発動！ ★`, '#daa520');
        sfxLegendary();
        return;
    }
}

function generateItem(floor, forceRarity = null) {
    const typeKeys = Object.keys(ITEM_TYPES).filter(k => !ALL_POTION_TYPES.includes(k) && !CHARM_TYPES.includes(k) && k !== 'rune' && k !== 'quest_key');
    const typeKey = typeKeys[rand(0, typeKeys.length - 1)];
    const typeInfo = ITEM_TYPES[typeKey];

    let rarityKey = forceRarity;
    if (!rarityKey) {
        // Magic Find + Difficulty bonus - D2-style diminishing returns per quality tier
        const mf = (player && player.getMagicFind) ? player.getMagicFind() : 0;
        const diffDrop = DIFFICULTY_DEFS[G.difficulty || 'normal'].dropBonus || 0;
        const baseRoll = Math.random();
        rarityKey = pickRarity(baseRoll, mf, diffDrop);
    }
    const rarity = RARITY[rarityKey];

    const floorMult = 1 + (floor - 1) * 0.15;
    const item = {
        typeKey, typeInfo, rarityKey, rarity,
        icon: typeInfo.icon,
        affixes: [],
        baseDmg: typeInfo.baseDmg ? [Math.round(typeInfo.baseDmg[0] * rarity.mult * floorMult), Math.round(typeInfo.baseDmg[1] * rarity.mult * floorMult)] : null,
        baseDef: typeInfo.baseDef ? Math.round((typeInfo.baseDef[0] + rand(0, typeInfo.baseDef[1] - typeInfo.baseDef[0])) * rarity.mult * floorMult) : null,
    };

    // Item level & required level (D2-style: ilvl = area monster level)
    const areaLevel = getMonsterLevel(G.act, G.actFloor);
    item.itemLevel = areaLevel;
    const baseReq = Math.max(1, Math.ceil(areaLevel / 2));
    item.requiredLevel = rarityKey === 'unique' ? baseReq + 4 : rarityKey === 'legendary' ? baseReq + 2 : baseReq;

    // Name & set item detection
    // Check if this typeKey could be a set item (15% chance for legendary+ items)
    let isSetItem = false;
    if ((rarityKey === 'legendary' || rarityKey === 'unique') && Math.random() < 0.15) {
        for (const [setKey, setDef] of Object.entries(ITEM_SETS)) {
            if (setDef.pieces[typeKey]) {
                item.name = setDef.pieces[typeKey];
                item.setKey = setKey;
                item.setName = setDef.name;
                item.rarity = { ...RARITY[rarityKey], color: setDef.color, name: 'セット' };
                isSetItem = true;
                break;
            }
        }
    }
    if (!isSetItem) {
        if (rarityKey === 'unique' && UNIQUE_NAMES[typeKey]) {
            const names = UNIQUE_NAMES[typeKey];
            item.name = names[rand(0, names.length - 1)];
        } else {
            const prefixes = ['呪われし', '聖なる', '古代の', '鍛えられし', '朽ちた', '輝く', '血染めの', '影の', '蒼き', '灼熱の'];
            const prefix = rarityKey !== 'common' ? prefixes[rand(0, prefixes.length-1)] + ' ' : '';
            item.name = prefix + typeInfo.name;
        }
    }

    // Generate affixes
    const affixCount = getAffixCount(rarity);
    const pool = [...AFFIXES];
    for (let i = 0; i < affixCount && pool.length > 0; i++) {
        const idx = rand(0, pool.length - 1);
        const a = pool.splice(idx, 1)[0];
        const v = Math.round(rand(a.min, a.max) * floorMult);
        item.affixes.push({ stat: a.stat, value: v, text: a.fmt.replace('{v}', v) });
    }

    // Roll sockets (only for socketable types)
    const sockCount = rollSockets(typeKey, rarityKey);
    if (sockCount > 0) {
        item.sockets = sockCount;
        item.socketedRunes = [];
    }

    return item;
}

const CHARM_TYPES = ['smallCharm', 'mediumCharm', 'grandCharm'];
function isCharm(item) { return CHARM_TYPES.includes(item.typeKey); }

const MAX_POTION_STACK = 20;
const HP_POTION_TYPES = ['hp1','hp2','hp3','hp4','hp5'];
const MP_POTION_TYPES = ['mp1','mp2','mp3'];
const REJUV_TYPES = ['rejuv','fullrejuv'];
const ALL_POTION_TYPES = [...HP_POTION_TYPES, ...MP_POTION_TYPES, ...REJUV_TYPES, 'potion', 'manaPotion'];
// Which potion tier drops/sells per act
const HP_POTION_TIER_BY_ACT = { 1:'hp1', 2:'hp2', 3:'hp3', 4:'hp4', 5:'hp5' };
const MP_POTION_TIER_BY_ACT = { 1:'mp1', 2:'mp2', 3:'mp3', 4:'mp3', 5:'mp3' };

function isPotion(item) {
    return ALL_POTION_TYPES.includes(item.typeKey);
}
function isHPPotion(item) {
    return HP_POTION_TYPES.includes(item.typeKey) || item.typeKey === 'potion';
}
function isMPPotion(item) {
    return MP_POTION_TYPES.includes(item.typeKey) || item.typeKey === 'manaPotion';
}
function isRejuvPotion(item) {
    return REJUV_TYPES.includes(item.typeKey);
}

function findPotionStack(inventory, typeKey) {
    return inventory.findIndex(it => it.typeKey === typeKey && (it.qty || 1) < MAX_POTION_STACK);
}

function getPotionCount(inventory, typeKey) {
    return inventory.filter(it => it.typeKey === typeKey).reduce((s, it) => s + (it.qty || 1), 0);
}
function getHPPotionCount(inventory) {
    return inventory.filter(it => isHPPotion(it) || isRejuvPotion(it)).reduce((s, it) => s + (it.qty || 1), 0);
}
function getMPPotionCount(inventory) {
    return inventory.filter(it => isMPPotion(it) || isRejuvPotion(it)).reduce((s, it) => s + (it.qty || 1), 0);
}

function generatePotion(potionCategory = 'hp', act = G.act || 1) {
    let typeKey;
    if (potionCategory === 'hp') typeKey = HP_POTION_TIER_BY_ACT[act] || 'hp1';
    else if (potionCategory === 'mp') typeKey = MP_POTION_TIER_BY_ACT[act] || 'mp1';
    else if (potionCategory === 'rejuv') typeKey = 'rejuv';
    else if (potionCategory === 'fullrejuv') typeKey = 'fullrejuv';
    else typeKey = potionCategory; // direct typeKey
    const ti = ITEM_TYPES[typeKey] || ITEM_TYPES.hp1;
    return { typeKey: typeKey, typeInfo: ti, rarityKey: 'common', rarity: RARITY.common,
             icon: ti.icon, name: ti.name, affixes: [], baseDmg: null, baseDef: null, qty: 1 };
}

// Charm affix pool (subset of AFFIXES with charm-appropriate ranges)
const CHARM_AFFIXES = [
    { stat: 'str', fmt: '+{v} 筋力', ranges: { 1: [1,3], 2: [2,5], 3: [3,8] } },
    { stat: 'dex', fmt: '+{v} 敏捷', ranges: { 1: [1,3], 2: [2,5], 3: [3,8] } },
    { stat: 'vit', fmt: '+{v} 体力', ranges: { 1: [1,3], 2: [2,5], 3: [3,8] } },
    { stat: 'int', fmt: '+{v} 知力', ranges: { 1: [1,3], 2: [2,5], 3: [3,8] } },
    { stat: 'hp', fmt: '+{v} HP', ranges: { 1: [5,15], 2: [10,30], 3: [20,50] } },
    { stat: 'mp', fmt: '+{v} MP', ranges: { 1: [5,10], 2: [8,20], 3: [15,40] } },
    { stat: 'def', fmt: '+{v} 防御', ranges: { 1: [1,4], 2: [3,8], 3: [5,12] } },
    { stat: 'dmgPct', fmt: '+{v}% ダメージ', ranges: { 1: [2,5], 2: [4,10], 3: [6,15] } },
    { stat: 'critChance', fmt: '+{v}% クリティカル率', ranges: { 1: [1,2], 2: [2,4], 3: [3,6] } },
    { stat: 'fireRes', fmt: '+{v}% 火炎耐性', ranges: { 1: [3,8], 2: [5,12], 3: [8,18] } },
    { stat: 'coldRes', fmt: '+{v}% 冷気耐性', ranges: { 1: [3,8], 2: [5,12], 3: [8,18] } },
    { stat: 'lightRes', fmt: '+{v}% 雷耐性', ranges: { 1: [3,8], 2: [5,12], 3: [8,18] } },
    { stat: 'poisonRes', fmt: '+{v}% 毒耐性', ranges: { 1: [3,8], 2: [5,12], 3: [8,18] } },
    { stat: 'allRes', fmt: '+{v}% 全耐性', ranges: { 1: [1,3], 2: [2,5], 3: [3,8] } },
    { stat: 'magicFind', fmt: '+{v}% MF', ranges: { 1: [3,7], 2: [5,12], 3: [8,20] } },
    { stat: 'moveSpd', fmt: '+{v}% 移動速度', ranges: { 1: [2,4], 2: [3,6], 3: [5,10] } },
];

function generateCharm(floor) {
    // Size: small(60%), medium(30%), grand(10%)
    const r = Math.random();
    const typeKey = r < 0.60 ? 'smallCharm' : r < 0.90 ? 'mediumCharm' : 'grandCharm';
    const ti = ITEM_TYPES[typeKey];
    const size = ti.charmSize;
    // Rarity: common(50%), magic(35%), rare(12%), legendary(3%)
    const rr = Math.random();
    const rarityKey = rr < 0.50 ? 'common' : rr < 0.85 ? 'magic' : rr < 0.97 ? 'rare' : 'legendary';
    const rarity = RARITY[rarityKey];
    // Affix count: small 1-2, medium 2-3, grand 3-4 (+ rarity bonus)
    const baseCount = size === 1 ? rand(1, 2) : size === 2 ? rand(2, 3) : rand(3, 4);
    const bonusCount = rarityKey === 'rare' ? 1 : rarityKey === 'legendary' ? 2 : 0;
    const affixCount = Math.min(baseCount + bonusCount, 5);
    // Pick random affixes
    const affixes = [];
    const pool = [...CHARM_AFFIXES];
    for (let i = 0; i < affixCount && pool.length > 0; i++) {
        const idx = rand(0, pool.length - 1);
        const af = pool.splice(idx, 1)[0];
        const range = af.ranges[size] || af.ranges[1];
        const value = rand(range[0], range[1]);
        affixes.push({ stat: af.stat, value, text: af.fmt.replace('{v}', value) });
    }
    // Name generation
    const prefixes = { smallCharm: ['小さな', '微かな', '淡い'], mediumCharm: ['輝く', '堅固な', '祝福の'], grandCharm: ['壮大な', '至高の', '伝説の'] };
    const prefix = prefixes[typeKey][rand(0, prefixes[typeKey].length - 1)];
    const name = `${prefix}${ti.name}`;
    return {
        typeKey, typeInfo: ti, rarityKey, rarity,
        icon: ti.icon, name, affixes,
        baseDmg: null, baseDef: null, itemLevel: floor || 1
    };
}

