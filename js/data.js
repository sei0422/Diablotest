// --- Constants ---
const TILE = 40;
const MAP_W = 60, MAP_H = 60;

// ========== ACT / CHAPTER DEFINITIONS ==========
const ACT_DEFS = {
    1: { name:'地下聖堂', nameEn:'Cathedral', floors:5, tileTheme:'cathedral',
         floorColors:{base:[24,22,20], wall:'#3d3228', mortar:'#1e1610'},
         wallColors:{primary:'#44382c',secondary:'#403428',tertiary:'#3e3226'},
         lightTint:{warm:'rgba(255,160,64,',cold:'rgba(0,0,5,'},
         monsterTypes:['skeleton','zombie'], bossType:'skeleton_king', bossFloor:5,
         townName:'修道院の村', townBG:'#1a140e',
         areas:[
             {name:'聖堂入口', floors:[1,2], density:'low'},
             {name:'地下墓地', floors:[3,4], density:'medium'},
             {name:'骸骨王の間', floors:[5], density:'boss'}
         ],
         monsterPool:{common:['skeleton','zombie'], elite:[], boss:['skeleton_king']} },
    2: { name:'砂漠遺跡', nameEn:'Desert Ruins', floors:5, tileTheme:'desert',
         floorColors:{base:[38,32,22], wall:'#5a4830', mortar:'#2a2018'},
         wallColors:{primary:'#6a5838',secondary:'#5e4e30',tertiary:'#524428'},
         lightTint:{warm:'rgba(255,180,80,',cold:'rgba(10,5,0,'},
         monsterTypes:['mummy','scarab','sand_golem'], bossType:'sand_worm', bossFloor:5,
         townName:'砂漠のオアシス', townBG:'#1e1a10',
         areas:[
             {name:'砂漠の門', floors:[1,2], density:'low'},
             {name:'古代墓地', floors:[3,4], density:'medium'},
             {name:'砂虫の巣', floors:[5], density:'boss'}
         ],
         monsterPool:{common:['mummy','scarab','sand_golem'], elite:[], boss:['sand_worm']} },
    3: { name:'密林神殿', nameEn:'Jungle Temple', floors:5, tileTheme:'jungle',
         floorColors:{base:[18,28,16], wall:'#2a3a22', mortar:'#162010'},
         wallColors:{primary:'#304828',secondary:'#2a4022',tertiary:'#263a1e'},
         lightTint:{warm:'rgba(180,220,100,',cold:'rgba(0,10,5,'},
         monsterTypes:['treeant','poison_spider','jungle_shaman'], bossType:'archmage', bossFloor:5,
         townName:'クラスト港', townBG:'#0e1a0e',
         areas:[
             {name:'密林の入口', floors:[1,2], density:'low'},
             {name:'蜘蛛の洞窟', floors:[3,4], density:'medium'},
             {name:'大魔導師の間', floors:[5], density:'boss'}
         ],
         monsterPool:{common:['treeant','poison_spider','jungle_shaman'], elite:[], boss:['archmage']} },
    4: { name:'地獄', nameEn:'Hell', floors:3, tileTheme:'hell',
         floorColors:{base:[30,10,8], wall:'#4a1a10', mortar:'#280e08'},
         wallColors:{primary:'#5a2018',secondary:'#4e1a12',tertiary:'#42160e'},
         lightTint:{warm:'rgba(255,80,30,',cold:'rgba(20,0,0,'},
         monsterTypes:['demon','hellhound','imp'], bossType:'demon_lord', bossFloor:3,
         townName:'要塞', townBG:'#1a0808',
         areas:[
             {name:'地獄の門', floors:[1], density:'medium'},
             {name:'炎獄', floors:[2], density:'high'},
             {name:'魔王の間', floors:[3], density:'boss'}
         ],
         monsterPool:{common:['demon','hellhound','imp'], elite:[], boss:['demon_lord']} },
    5: { name:'氷の山', nameEn:'Frozen Mountain', floors:5, tileTheme:'ice',
         floorColors:{base:[18,22,30], wall:'#283848', mortar:'#1a2430'},
         wallColors:{primary:'#304050',secondary:'#283848',tertiary:'#223040'},
         lightTint:{warm:'rgba(100,150,255,',cold:'rgba(0,0,20,'},
         monsterTypes:['frost_zombie','ice_wraith','yeti'], bossType:'ice_queen', bossFloor:5,
         townName:'ハログス', townBG:'#0a1020',
         areas:[
             {name:'氷の入口', floors:[1,2], density:'low'},
             {name:'凍てつく洞窟', floors:[3,4], density:'medium'},
             {name:'氷の女王の間', floors:[5], density:'boss'}
         ],
         monsterPool:{common:['frost_zombie','ice_wraith','yeti'], elite:[], boss:['ice_queen']} }
};
const TOTAL_ACT_FLOORS = 23; // 5+5+5+3+5

function globalFloorToAct(globalFloor) {
    const cycle = Math.floor((globalFloor - 1) / TOTAL_ACT_FLOORS);
    let rem = (globalFloor - 1) % TOTAL_ACT_FLOORS;
    for (let a = 1; a <= 5; a++) {
        if (rem < ACT_DEFS[a].floors) return { act: a, actFloor: rem + 1, cycle };
        rem -= ACT_DEFS[a].floors;
    }
    return { act: 5, actFloor: ACT_DEFS[5].floors, cycle };
}
function getGlobalFloor(act, actFloor, cycle) {
    let f = cycle * TOTAL_ACT_FLOORS;
    for (let a = 1; a < act; a++) f += ACT_DEFS[a].floors;
    return f + actFloor;
}
// D2-style area system: Get current area for a given act and actFloor
function getCurrentArea(act, actFloor) {
    const actDef = ACT_DEFS[act];
    if (!actDef || !actDef.areas) return null;
    for (const area of actDef.areas) {
        if (area.floors.includes(actFloor)) return area;
    }
    return null;
}
// D2-style monster level table (fixed per area, not scaling)
// NOTE: Act1 is tuned so Floor1 starts at mlvl=1 (like Blood Moor) to avoid L1 "MISS" spam.
const NORMAL_MLVL_TABLE = {
    // Act1 (compressed progression, end ~12)
    1: [1, 3, 6, 9, 12],
    2: [14, 16, 18, 20, 22],
    3: [23, 25, 27, 29, 30],
    4: [32, 36, 40],
    5: [42, 46, 50, 55, 60]
};
// D2-style staged XP curve: linear → exponential → gentle
function getXPForLevel(level) {
    if (level <= 30) {
        // Lv 1-30: Linear (beginner-friendly)
        return Math.round(100 * level * 1.15);
    } else if (level <= 70) {
        // Lv 30-70: Exponential (core gameplay)
        return Math.round(5000 * Math.pow(level - 30, 2.2));
    } else {
        // Lv 70-99: Gentle (endgame grind)
        return Math.round(80000 * Math.pow(level - 70, 1.5) + 500000);
    }
}

function getMonsterLevel(act, actFloor) {
    const floors = NORMAL_MLVL_TABLE[act] || NORMAL_MLVL_TABLE[1];
    const base = floors[Math.max(0, Math.min(actFloor - 1, floors.length - 1))] || floors[floors.length - 1];
    const diff = G.difficulty || 'normal';
    // D2-style: NM = base+40 (cap 70), Hell = base+80 (cap 85)
    if (diff === 'nightmare') return Math.min(70, base + 40);
    if (diff === 'hell') return Math.min(85, base + 80);
    return base;
}
// D2-style XP penalty when player is much higher level than monsters
function getXPPenalty(playerLevel, monsterLevel) {
    const d = playerLevel - monsterLevel;
    if (d <= 5) return 1.0;
    if (d <= 10) return 0.8;
    if (d <= 15) return 0.6;
    if (d <= 20) return 0.4;
    if (d <= 25) return 0.2;
    return 0.1;
}
function getCurrentActDef() { return ACT_DEFS[G.act]; }
const DIFFICULTY_DEFS = {
    normal:    { name: 'ノーマル', color: '#cccccc', mult: 1.0, xpMult: 1.0, dropBonus: 0, respenalty: 0 },
    nightmare: { name: 'ナイトメア', color: '#ffaa44', mult: 1.7, xpMult: 1.5, dropBonus: 0.15, respenalty: 40 },
    hell:      { name: 'ヘル', color: '#ff4444', mult: 2.8, xpMult: 2.0, dropBonus: 0.30, respenalty: 100 }
};
function getDifficultyMult() { return DIFFICULTY_DEFS[G.difficulty || 'normal'].mult; }
function getCycleMult() { return (1 + G.cycle * 0.6) * getDifficultyMult(); }
function isBossFloor() { return G.actFloor === getCurrentActDef().bossFloor; }

// ========== BOSS DEFINITIONS ==========
const BOSS_DEFS = {
    skeleton_king: { name:'骸骨王', icon:'👑💀', hp:1024, dmg:40, spd:55, r:22, xp:1000, defense:25,
        color:'#d4a44a', phases:[
            {hpPct:1.0, type:'melee'},
            {hpPct:0.6, type:'summon', count:4, summonType:'skeleton', cd:8},
            {hpPct:0.3, type:'nova', count:12, cd:5, projSpd:200, projDmg:25, projColor:'#ffffaa'}
        ]},
    sand_worm: { name:'砂蟲', icon:'🐛', hp:2000, dmg:50, spd:50, r:24, xp:1500, defense:90,
        color:'#aa8833', phases:[
            {hpPct:1.0, type:'burrow', cd:6},
            {hpPct:0.6, type:'poison_spray', cd:4, count:5, projSpd:180, projDmg:20, projColor:'#44cc00'},
            {hpPct:0.3, type:'quake', cd:5, dmg:30, radius:150}
        ]},
    archmage: { name:'大魔導師', icon:'🧙', hp:3000, dmg:55, spd:65, r:18, xp:2000, defense:70,
        color:'#6644cc', phases:[
            {hpPct:1.0, type:'teleport_attack', cd:3},
            {hpPct:0.6, type:'nova', count:8, cd:4, projSpd:220, projDmg:30, projColor:'#aa44ff'},
            {hpPct:0.3, type:'summon', count:3, summonType:'jungle_shaman', cd:10}
        ]},
    demon_lord: { name:'魔王', icon:'👿🔥', hp:5000, dmg:70, spd:60, r:26, xp:3000, defense:120,
        color:'#cc2200', phases:[
            {hpPct:1.0, type:'melee'},
            {hpPct:0.75, type:'fire_breath', cd:5, count:7, projSpd:200, projDmg:35, projColor:'#ff6600'},
            {hpPct:0.5, type:'summon', count:3, summonType:'demon', cd:10},
            {hpPct:0.25, type:'meteor', cd:8, count:5, dmg:50, radius:80}
        ]},
    ice_queen: { name:'氷の女王', icon:'👸❄', hp:8000, dmg:80, spd:60, r:20, xp:4000, defense:150,
        color:'#88ccff', phases:[
            {hpPct:1.0, type:'nova', count:6, cd:3, projSpd:200, projDmg:25, projColor:'#aaddff'},
            {hpPct:0.5, type:'freeze_aura', cd:6, radius:120, dmg:15},
            {hpPct:0.25, type:'blizzard', cd:8, count:12, dmg:35, radius:200}
        ]}
};

// ========== UBER BOSS SYSTEM ==========
// 3 Uber Keys drop from Act bosses on Nightmare/Hell difficulty
// Combine all 3 keys at the Uber NPC to open a portal to the Uber Tristram
const UBER_KEY_DEFS = {
    key_terror:   { name: '恐怖の鍵', icon: '🗝', color: '#ff4444', desc: '混沌の門を開く鍵の1つ', fromBoss: 'demon_lord' },
    key_hate:     { name: '憎悪の鍵', icon: '🗝', color: '#44ff44', desc: '混沌の門を開く鍵の1つ', fromBoss: 'archmage' },
    key_destruction: { name: '破壊の鍵', icon: '🗝', color: '#4488ff', desc: '混沌の門を開く鍵の1つ', fromBoss: 'ice_queen' }
};
const UBER_BOSS_DEFS = {
    uber_diablo: { name: 'パンデモニウム・ディアブロ', icon: '👿🔥', hp: 30000, dmg: 180, spd: 70, r: 30, xp: 15000, defense: 400,
        color: '#ff2200', immunities: { fire: 100, lightning: 50 }, phases: [
            { hpPct: 1.0, type: 'melee' },
            { hpPct: 0.75, type: 'fire_breath', cd: 4, count: 10, projSpd: 250, projDmg: 80, projColor: '#ff4400' },
            { hpPct: 0.5, type: 'nova', count: 16, cd: 3, projSpd: 220, projDmg: 60, projColor: '#ff6600' },
            { hpPct: 0.25, type: 'meteor', cd: 6, count: 8, dmg: 100, radius: 120 }
        ]},
    uber_mephisto: { name: 'パンデモニウム・メフィスト', icon: '🧙‍♂️💀', hp: 22000, dmg: 150, spd: 80, r: 24, xp: 12000, defense: 350,
        color: '#6644cc', immunities: { cold: 100, poison: 50 }, phases: [
            { hpPct: 1.0, type: 'teleport_attack', cd: 2 },
            { hpPct: 0.6, type: 'nova', count: 12, cd: 3, projSpd: 240, projDmg: 70, projColor: '#aa44ff' },
            { hpPct: 0.3, type: 'summon', count: 4, summonType: 'demon', cd: 8 }
        ]},
    uber_baal: { name: 'パンデモニウム・バール', icon: '👁🌀', hp: 40000, dmg: 200, spd: 65, r: 32, xp: 20000, defense: 500,
        color: '#88ccff', immunities: { cold: 100, fire: 50 }, phases: [
            { hpPct: 1.0, type: 'nova', count: 8, cd: 4, projSpd: 200, projDmg: 50, projColor: '#aaddff' },
            { hpPct: 0.7, type: 'freeze_aura', cd: 5, radius: 150, dmg: 30 },
            { hpPct: 0.4, type: 'summon', count: 5, summonType: 'frost_zombie', cd: 7 },
            { hpPct: 0.2, type: 'blizzard', cd: 6, count: 16, dmg: 70, radius: 250 }
        ]}
};
// Torch reward for uber completion
const UBER_TORCH_DEF = {
    name: 'ヘルファイアトーチ', icon: '🔥', typeKey: 'amulet',
    rarityKey: 'unique', desc: 'パンデモニウムの戦いの証',
    affixes: [
        { stat: 'allResist', value: 20, desc: '全耐性+20' },
        { stat: 'life', value: 150, desc: 'ライフ+150' },
        { stat: 'exp', value: 10, desc: '経験値+10%' },
        { stat: 'dmg%', value: 15, desc: 'ダメージ+15%' }
    ]
};

// ========== QUEST DEFINITIONS ==========
const QUEST_DEFS = {
    q_act1_den: { act:1, name:'悪の巣窟', type:'kill_count', target:30,
        desc:'地下聖堂の悪しき力を浄化せよ', rewards:{xp:300, gold:200, skillReset:true} },
    q_act1_main: { act:1, name:'骸骨王の討伐', type:'kill_boss', target:'skeleton_king',
        desc:'地下聖堂の最深部に巣くう骸骨王を倒せ', rewards:{xp:1000, gold:500, item:'rare'} },
    q_act1_clear: { act:1, name:'聖堂の浄化', type:'kill_count', target:50,
        desc:'地下聖堂のモンスターを50体倒せ', rewards:{xp:500, gold:300} },
    q_act2_main: { act:2, name:'砂蟲の退治', type:'kill_boss', target:'sand_worm', prereq:'q_act1_main',
        desc:'砂漠の地下に潜む巨大砂蟲を倒せ', rewards:{xp:1500, gold:800, item:'rare'} },
    q_act2_clear: { act:2, name:'遺跡の調査', type:'kill_count', target:60,
        desc:'砂漠遺跡のモンスターを60体倒せ', rewards:{xp:800, gold:400} },
    q_act3_main: { act:3, name:'大魔導師の打倒', type:'kill_boss', target:'archmage', prereq:'q_act2_main',
        desc:'密林神殿の大魔導師を倒せ', rewards:{xp:2000, gold:1200, item:'legendary'} },
    q_act3_clear: { act:3, name:'密林の制圧', type:'kill_count', target:70,
        desc:'密林神殿のモンスターを70体倒せ', rewards:{xp:1000, gold:500} },
    q_act4_main: { act:4, name:'魔王の討滅', type:'kill_boss', target:'demon_lord', prereq:'q_act3_main',
        desc:'地獄の奥底に君臨する魔王を倒せ', rewards:{xp:3000, gold:2000, item:'legendary'} },
    q_act4_clear: { act:4, name:'地獄の鎮圧', type:'kill_count', target:50,
        desc:'地獄のモンスターを50体倒せ', rewards:{xp:1500, gold:800} },
    q_act5_main: { act:5, name:'氷の女王の討伐', type:'kill_boss', target:'ice_queen', prereq:'q_act4_main',
        desc:'氷の山頂に住む氷の女王を倒せ', rewards:{xp:4000, gold:3000, item:'unique'} },
    q_act5_clear: { act:5, name:'氷山の掃討', type:'kill_count', target:80,
        desc:'氷の山のモンスターを80体倒せ', rewards:{xp:2000, gold:1000} }
};

// ========== TOWN NPC DEFINITIONS ==========
const TOWN_NPC_DEFS = {
    1: [
        { id:'merchant_1', name:'商人マーロ', icon:'🧑‍💼', sprite:'npcShopkeep', hiresClass:'rogue', type:'shop', dialog:['品物を見ていくかい？何でも揃ってるよ。','良い防具があれば命を救うぞ。'] },
        { id:'smith_1', name:'鍛冶屋グリスウォルド', icon:'⚒', sprite:'npcBlacksmith', hiresClass:'warrior', type:'blacksmith', dialog:['武器を鍛えてやろう。','良い鉄を使えば、切れ味が違う。'] },
        { id:'stash_1', name:'倉庫番カイン', icon:'📦', sprite:'npcScholar', hiresClass:'base', type:'stash', dialog:['預かり物はここに置いていけ。','倉庫はいつでも使えるぞ。'] },
        { id:'quest_1', name:'長老アカラ', icon:'👵', sprite:'npcElderlyW', hiresClass:'mage', type:'quest', dialog:['勇者よ、地下聖堂の魔物を退治してくれ。','骸骨王が復活したのだ...'] },
        { id:'wp_1', name:'ウェイポイント', icon:'🌀', type:'waypoint', dialog:[] },
        { id:'merc_1', name:'傭兵ギルド長カシア', icon:'⚔', sprite:'npcWarClericF', hiresClass:'warrior', type:'mercenary', dialog:['傭兵を雇いたいか？腕利きが揃ってるよ。'] },
        { id:'gamble_1', name:'賭博師ガイード', icon:'🎰', sprite:'npcPeasant1', hiresClass:'rogue', type:'gamble', dialog:['運試しはどうだい？何が出るかは開けてのお楽しみさ。'] }
    ],
    2: [
        { id:'merchant_2', name:'商人エルジクス', icon:'🧑‍💼', sprite:'npcShopkeep', hiresClass:'rogue', type:'shop', dialog:['砂漠の品は珍しいぞ。','水よりも価値のある物がある。'] },
        { id:'smith_2', name:'鍛冶屋ファーラ', icon:'⚒', sprite:'npcBlacksmith', hiresClass:'warrior', type:'blacksmith', dialog:['砂漠の鉄は硬いが...鍛えがいがある。'] },
        { id:'stash_2', name:'倉庫番メシフ', icon:'📦', sprite:'npcPeasant1', hiresClass:'base', type:'stash', dialog:['荷物はここに預けろ。'] },
        { id:'quest_2', name:'賢者ドロガン', icon:'🧔', sprite:'npcDesertSage', hiresClass:'mage', type:'quest', dialog:['砂漠の地下に巨大な蟲がいる...退治してくれ。'] },
        { id:'wp_2', name:'ウェイポイント', icon:'🌀', type:'waypoint', dialog:[] },
        { id:'merc_2', name:'傭兵隊長グレイズ', icon:'⚔', sprite:'npcWarClericM', hiresClass:'warrior', type:'mercenary', dialog:['砂漠で鍛えた兵がいる。雇うか？'] },
        { id:'gamble_2', name:'賭博師アルール', icon:'🎰', sprite:'npcPeasant1', hiresClass:'rogue', type:'gamble', dialog:['砂漠の宝石が入ってるかもよ？'] }
    ],
    3: [
        { id:'merchant_3', name:'商人アシェラ', icon:'🧑‍💼', sprite:'npcShopkeep', hiresClass:'rogue', type:'shop', dialog:['密林の収穫品だ、見てくれ。'] },
        { id:'smith_3', name:'鍛冶屋ヘファスト', icon:'⚒', sprite:'npcBlacksmith', hiresClass:'warrior', type:'blacksmith', dialog:['神殿の金属は特殊だ...鍛え直してやろう。'] },
        { id:'stash_3', name:'倉庫番ナタリヤ', icon:'📦', sprite:'npcWarClericF', hiresClass:'base', type:'stash', dialog:['安全に保管してあるわ。'] },
        { id:'quest_3', name:'巫女オーマス', icon:'🧙‍♀', sprite:'npcWarClericM', hiresClass:'mage', type:'quest', dialog:['大魔導師が神殿を支配している...倒してくれ。'] },
        { id:'wp_3', name:'ウェイポイント', icon:'🌀', type:'waypoint', dialog:[] },
        { id:'merc_3', name:'傭兵長アシェラ', icon:'⚔', sprite:'npcWarClericF', hiresClass:'warrior', type:'mercenary', dialog:['密林の戦士を紹介しよう。'] },
        { id:'gamble_3', name:'賭博師リア', icon:'🎰', sprite:'npcElderlyW', hiresClass:'rogue', type:'gamble', dialog:['密林には隠された宝がある...賭けてみるかい？'] }
    ],
    4: [
        { id:'merchant_4', name:'商人ジャメラ', icon:'🧑‍💼', sprite:'npcShopkeep', hiresClass:'rogue', type:'shop', dialog:['地獄でも商売は続く...'] },
        { id:'smith_4', name:'鍛冶屋ハルバ', icon:'⚒', sprite:'npcBlacksmith', hiresClass:'warrior', type:'blacksmith', dialog:['地獄の炎で鍛えた武器は一味違う。'] },
        { id:'stash_4', name:'倉庫番ティラエル', icon:'📦', sprite:'templar', hiresClass:'base', type:'stash', dialog:['ここなら安全だ。'] },
        { id:'quest_4', name:'天使ハラティ', icon:'👼', sprite:'priest', hiresClass:'mage', type:'quest', dialog:['魔王を倒さねば世界が滅ぶ...頼む。'] },
        { id:'wp_4', name:'ウェイポイント', icon:'🌀', type:'waypoint', dialog:[] },
        { id:'merc_4', name:'傭兵ギルド長ティリエル', icon:'⚔', sprite:'templar', hiresClass:'warrior', type:'mercenary', dialog:['地獄でも戦える兵士がいる。'] },
        { id:'gamble_4', name:'賭博師ジャム', icon:'🎰', sprite:'npcDesertSage', hiresClass:'rogue', type:'gamble', dialog:['地獄の品を賭けてみるか？命を賭ける価値はあるぞ。'] }
    ],
    5: [
        { id:'merchant_5', name:'商人アーニャ', icon:'🧑‍💼', sprite:'npcShopkeep', hiresClass:'rogue', type:'shop', dialog:['氷の品は貴重よ。'] },
        { id:'smith_5', name:'鍛冶屋ラーズク', icon:'⚒', sprite:'npcBlacksmith', hiresClass:'warrior', type:'blacksmith', dialog:['凍てつく金属...だが鍛えられる。'] },
        { id:'stash_5', name:'倉庫番ニーラサック', icon:'📦', sprite:'npcElderlyM', hiresClass:'base', type:'stash', dialog:['預かるぞ。'] },
        { id:'quest_5', name:'賢者マラス', icon:'🧓', sprite:'npcElderlyM', hiresClass:'mage', type:'quest', dialog:['氷の女王が山を支配している...最後の戦いだ。'] },
        { id:'wp_5', name:'ウェイポイント', icon:'🌀', type:'waypoint', dialog:[] },
        { id:'uber_5', name:'闘技場の門番', icon:'🌀', sprite:'npcScholar', hiresClass:'mage', type:'uber_portal', dialog:['3つの鍵を集めたか？パンデモニウムへの門を開こう...'], requireDifficulty: true },
        { id:'merc_5', name:'傭兵長ラーズク', icon:'⚔', sprite:'npcWarClericM', hiresClass:'warrior', type:'mercenary', dialog:['氷の戦士を紹介しよう。'] },
        { id:'gamble_5', name:'賭博師ニーラ', icon:'🎰', sprite:'npcElderlyW', hiresClass:'rogue', type:'gamble', dialog:['氷の中に眠る宝...引き当てられるかしら？'] }
    ]
};

// ========== ATTRIBUTE BEHAVIORS FOR PARTICLES ==========
const ATTRIBUTE_BEHAVIORS = {
    fire: {
        motion: (p, dt) => {
            // Rising heat effect (exaggerated for visibility)
            p.vy -= 150 * dt;
            // Flickering sideways
            p.vx += Math.sin((p.maxLife - p.life) * 15) * 50 * dt;
        },
        sizeScale: (lifeRatio) => 1 + (1 - lifeRatio) * 0.5, // Expands as it dies
        alphaBoost: 1.2,
        glowColor: '#ffaa00'
    },
    ice: {
        motion: (p, dt) => {
            // Slow down crystallization
            p.vx *= 0.95;
            p.vy *= 0.95;
            // Spinning crystals
            p.rotation = (p.rotation || 0) + dt * 2;
        },
        sizeScale: (lifeRatio) => 1 + lifeRatio * 0.3, // Grows slightly
        alphaBoost: 1.0,
        glowColor: '#eeffff',
        shape: 'diamond' // Special rendering hint
    },
    lightning: {
        motion: (p, dt) => {
            // Jagged, fast motion with sudden direction changes (exaggerated)
            if (Math.random() < 0.3) {
                p.vx += (Math.random() - 0.5) * 350;
                p.vy += (Math.random() - 0.5) * 350;
            }
        },
        sizeScale: (lifeRatio) => lifeRatio > 0.5 ? 1.5 : 0.8, // Flash effect
        alphaBoost: 1.5,
        glowColor: '#ffffaa',
        trail: true // Leave trail particles (handled in emitParticles)
    },
    physical: {
        motion: (p, dt) => {
            // Heavy gravity for debris (exaggerated)
            p.grav = 400;
            // Bounce once
            if (!p.bounced && p.vy > 0 && p.y > p.startY + 20) {
                p.vy *= -0.4;
                p.bounced = true;
            }
        },
        sizeScale: (lifeRatio) => 1 - lifeRatio * 0.3, // Shrinks
        alphaBoost: 0.9,
        glowColor: '#aa7744'
    },
    holy: {
        motion: (p, dt) => {
            // Radial expansion from center
            const angle = Math.atan2(p.y - p.centerY, p.x - p.centerX);
            p.vx += Math.cos(angle) * 20 * dt;
            p.vy += Math.sin(angle) * 20 * dt;
            // Gentle upward drift
            p.vy -= 40 * dt;
        },
        sizeScale: (lifeRatio) => 1 + (1 - lifeRatio) * 0.6, // Expands gently
        alphaBoost: 0.8,
        glowColor: '#ffffdd',
        glow: 'soft' // Diffuse glow
    },
    arcane: {
        motion: (p, dt) => {
            // Swirling, ethereal motion (exaggerated)
            const t = p.maxLife - p.life;
            p.vx += Math.cos(t * 8) * 90 * dt;
            p.vy += Math.sin(t * 8) * 90 * dt;
        },
        sizeScale: (lifeRatio) => 1 + Math.sin(lifeRatio * Math.PI) * 0.4,
        alphaBoost: 1.1,
        glowColor: '#dd88ff',
        ethereal: true // Transparent rendering
    },
    nature: {
        motion: (p, dt) => {
            // Organic drift with sine wave
            p.vx += Math.sin((p.life + p.offset) * 3) * 30 * dt;
            // Slower falloff - lingering effect
            p.vy *= 0.98;
        },
        sizeScale: (lifeRatio) => 1 + (1 - lifeRatio) * 0.2,
        alphaBoost: 0.7,
        glowColor: '#88ff88',
        linger: true // Longer life (handled in constructor)
    }
};

