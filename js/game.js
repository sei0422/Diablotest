// ========================================
// 黒焔の迷宮 - Diablo Style Hack & Slash
// ========================================
'use strict';

// --- Audio System (Web Audio API with Dungeon Reverb) ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx, reverbNode, masterGain, reverbSend, dryGain;
let bgmNodes = null;

// --- Sprite Sheet Loading ---
const SPRITES = {};
let spritesLoaded = false;
function loadSprites() {
    const sheets = {
        tiles: 'asset/32rogues/tiles.png',
        monsters: 'asset/32rogues/monsters.png',
        rogues: 'asset/32rogues/rogues.png',
        items: 'asset/32rogues/items.png',
        animTiles: 'asset/32rogues/animated-tiles.png'
    };
    let loaded = 0;
    const total = Object.keys(sheets).length;
    function onAllLoaded() {
        spritesLoaded = true;
        console.log('All sprites loaded:', Object.keys(SPRITES).join(', '));
        try {
            if (typeof generateTileTextures === 'function') {
                generateTileTextures();
                tileTexturesReady = true;
                console.log('Tile textures regenerated with sprites');
            }
        } catch (e) { console.warn('Sprite texture override deferred:', e); }
    }
    function loadOne(key, src, retries) {
        const img = new Image();
        img.onload = () => {
            // Use original sprite without pixel processing
            SPRITES[key] = img;
            console.log('Sprite loaded:', key, img.width + 'x' + img.height);
            if (++loaded === total) onAllLoaded();
        };
        img.onerror = () => {
            if (retries > 0) {
                console.warn('Sprite retry:', src, 'remaining:', retries);
                setTimeout(() => loadOne(key, src, retries - 1), 500);
            } else {
                console.warn('Sprite FAIL:', src);
                if (++loaded === total) onAllLoaded();
            }
        };
        img.src = src + '?v=' + Date.now();
    }
    for (const [key, src] of Object.entries(sheets)) {
        loadOne(key, src, 3);
    }
}
loadSprites();

const SP = 32; // sprite pixel size in sprite sheet
const ATLAS = {
    // tiles.png (544x832, 32px grid)
    wallTop: ['tiles', 0, 64], wallSide1: ['tiles', 32, 64], wallSide2: ['tiles', 64, 64],
    deepWall: ['tiles', 0, 96], catWallSide: ['tiles', 32, 160],
    floorBlank: ['tiles', 0, 192], floor1: ['tiles', 32, 192],
    floor2: ['tiles', 64, 192], floor3: ['tiles', 96, 192],
    stairsDown: ['tiles', 224, 512], chestClosed: ['tiles', 0, 544], chestOpen: ['tiles', 32, 544],
    blood1: ['tiles', 0, 704], blood2: ['tiles', 32, 704],
    corpse1: ['tiles', 0, 672], corpse2: ['tiles', 32, 672],
    // monsters.png (384x416, 32px grid)
    skeleton: ['monsters', 0, 128], skelArcher: ['monsters', 32, 128],
    lich: ['monsters', 64, 128], deathKnight: ['monsters', 96, 128],
    zombie: ['monsters', 128, 128], ghoul: ['monsters', 160, 128],
    banshee: ['monsters', 0, 160], wraith: ['monsters', 64, 160],
    imp: ['monsters', 32, 352], minotaur: ['monsters', 224, 224],
    // rogues.png (224x224, 32px grid)
    knight: ['rogues', 0, 32], fighter: ['rogues', 32, 32],
    ranger: ['rogues', 64, 0], rogueChar: ['rogues', 96, 0],
    wizardF: ['rogues', 0, 128], wizardM: ['rogues', 32, 128],
    // items.png (352x832, 32px grid)
    iSword: ['items', 96, 0], iAxe: ['items', 32, 96], iStaff: ['items', 0, 320],
    iShield: ['items', 32, 352], iHelmet: ['items', 128, 480], iArmor: ['items', 96, 384],
    iRing: ['items', 0, 544], iAmulet: ['items', 0, 512], iBoots: ['items', 32, 448],
    iPotion: ['items', 32, 608], iGold: ['items', 0, 768],
    // animated-tiles.png torch lit frames (row 5, y=160)
    torch0: ['animTiles', 0, 160], torch1: ['animTiles', 32, 160],
    torch2: ['animTiles', 64, 160], torch3: ['animTiles', 96, 160],
    torch4: ['animTiles', 128, 160], torch5: ['animTiles', 160, 160],
    // === Promoted class sprites (rogues.png) ===
    paladin: ['rogues', 128, 32],    // shield knight
    berserker: ['rogues', 0, 96],    // male barbarian
    assassin: ['rogues', 128, 0],    // bandit
    rangerCls: ['rogues', 64, 0],    // ranger
    pyromancer: ['rogues', 0, 128],  // female wizard
    cryomancer: ['rogues', 64, 128], // druid (ice-themed)
    monk: ['rogues', 0, 64],         // monk
    templar: ['rogues', 128, 64],    // templar
    warlock: ['rogues', 160, 128],   // warlock (6th col row5)
    fencer: ['rogues', 128, 96],     // fencer
    priest: ['rogues', 32, 64],      // priest
    // === Town NPC sprites (rogues.png rows 6-7) ===
    npcFarmerWheat: ['rogues', 0, 160],   // farmer (wheat thresher)
    npcFarmerScythe: ['rogues', 32, 160], // farmer (scythe)
    npcFarmerFork: ['rogues', 64, 160],   // farmer (pitchfork)
    npcBaker: ['rogues', 96, 160],        // baker
    npcBlacksmith: ['rogues', 128, 160],  // blacksmith
    npcScholar: ['rogues', 160, 160],     // scholar
    npcPeasant1: ['rogues', 0, 192],      // peasant / coalburner
    npcPeasant2: ['rogues', 32, 192],     // peasant
    npcShopkeep: ['rogues', 64, 192],     // shopkeep
    npcElderlyW: ['rogues', 96, 192],     // elderly woman
    npcElderlyM: ['rogues', 128, 192],    // elderly man
    npcDesertSage: ['rogues', 96, 128],   // desert sage
    npcWarClericF: ['rogues', 64, 64],    // female war cleric
    npcWarClericM: ['rogues', 96, 64],    // male war cleric
};

// --- Hi-Res Animated Sprite System (FLARE-based 8-dir multi-frame) ---
const HIRES_SPRITES = {};
let hiresSpritesLoaded = false;
const HIRES_SP = 128; // pixel size per cell
const HIRES_DIR_ORDER = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
// Class → sprite sheet prefix mapping
const HIRES_CLASS_MAP = {
    warrior: 'warrior', paladin: 'warrior', berserker: 'warrior',
    rogue: 'rogue', assassin: 'rogue', ranger: 'rogue',
    sorcerer: 'mage', pyromancer: 'mage', cryomancer: 'mage',
};
// Animation configs: frames per animation, fps
const HIRES_ANIM_CONFIG = {
    run: { frames: 8, fps: 15 },
    stance: { frames: 4, fps: 5 },
    swing: { frames: 4, fps: 10 },
    cast: { frames: 4, fps: 10 },
    shoot: { frames: 4, fps: 10 },
};

function loadHiResSprites() {
    const classes = ['warrior', 'mage', 'rogue', 'base'];
    const anims = ['run', 'stance', 'swing', 'cast', 'shoot'];
    const toLoad = [];
    for (const cls of classes) {
        for (const anim of anims) {
            toLoad.push(`hero_${cls}_${anim}`);
        }
    }
    let loaded = 0;
    const total = toLoad.length;
    for (const key of toLoad) {
        const img = new Image();
        img.onload = () => {
            HIRES_SPRITES[key] = img;
            if (++loaded === total) {
                hiresSpritesLoaded = true;
                console.log('Hi-res animated sprites loaded:', Object.keys(HIRES_SPRITES).length);
            }
        };
        img.onerror = () => {
            if (++loaded === total) { hiresSpritesLoaded = true; }
        };
        img.src = `asset/sprite_sheets/${key}.png?v=${Date.now()}`;
    }
}
loadHiResSprites();

// --- OpenGameArt (OGA) Asset Loading ---
const OGA = {};
let ogaLoaded = false;
const OGA_CREATURE_SP = 256; // creature sprite frame size (2048/8)
const OGA_PROJ_SP = 64;      // projectile sprite frame size (512/8)
// Map game monster types to OGA creature sprite files
const OGA_CREATURE_MAP = {
    skeleton: 'skeleton', skelArcher: 'skeleton',
    zombie: 'zombie', frost_zombie: 'zombie', ghoul: 'zombie',
    imp: 'goblin', goblin: 'goblin',
    lich: 'magician', magician: 'magician',
    minotaur: 'minotaur', ogre: 'ogre', sand_golem: 'ogre',
    slime: 'slime', poison_spider: 'slime',
    werewolf: 'werewolf', hellhound: 'werewolf',
    banshee: 'elemental', wraith: 'elemental', ice_wraith: 'elemental',
    ghost: 'elemental', elemental: 'elemental',
    deathKnight: 'skeleton', demon: 'demon',
    mummy: 'zombie', scarab: 'slime',
    treeant: 'ogre', jungle_shaman: 'magician',
    demonlord: 'demon',
};
// Map skill elements to projectile sprite + sparks row
// Game uses 'cold' internally but assets are named 'ice' - include both
const OGA_PROJ_MAP = {
    fire: { sprite: 'proj_fireball', sparksRow: 2 },
    ice: { sprite: 'proj_icicle', sparksRow: 4 },
    cold: { sprite: 'proj_icicle', sparksRow: 4 },
    lightning: { sprite: 'proj_fireball', sparksRow: 0 },
    poison: { sprite: 'proj_icicle', sparksRow: 2 },
};
function loadOGASprites() {
    const assets = {
        // Creatures (2048x2048, 256px cells, 8 dirs × 8 frames)
        creature_skeleton: 'asset/opengameart/creatures/skeleton.png',
        creature_zombie: 'asset/opengameart/creatures/zombie.png',
        creature_elemental: 'asset/opengameart/creatures/elemental.png',
        creature_goblin: 'asset/opengameart/creatures/goblin.png',
        creature_ogre: 'asset/opengameart/creatures/ogre.png',
        creature_slime: 'asset/opengameart/creatures/slime.png',
        creature_werewolf: 'asset/opengameart/creatures/werewolf.png',
        creature_magician: 'asset/opengameart/creatures/magician.png',
        // Projectiles (512x512, 64px cells, 8 dirs × 8 frames)
        proj_fireball: 'asset/opengameart/fireball_0.png',
        proj_icicle: 'asset/opengameart/icicle_0.png',
        // Impact sparks (256x384, 64px cells, 4 frames × 6 rows)
        fx_sparks: 'asset/opengameart/sparks.png',
        // Health Orb UI
        ui_health_panel: 'asset/opengameart/health_orb/HealthPanel.png',
        ui_mana_panel: 'asset/opengameart/health_orb/ManaPanel.png',
        ui_orb_border: 'asset/opengameart/health_orb/DarkOrbBorder.png',
        ui_spell_slot: 'asset/opengameart/health_orb/52x52 SpellSlotBorder.png',
        // Dark Fantasy UI
        ui_hpbar: 'asset/opengameart/dark_fantasy_ui/Dark Fantasy UI Pack (CC-BY 4.0 - Of Far Different Nature)/OFDN UI Pack - Health Bar D1.png',
        ui_hpbar_empty: 'asset/opengameart/dark_fantasy_ui/Dark Fantasy UI Pack (CC-BY 4.0 - Of Far Different Nature)/OFDN UI Pack - Health Bar D2.png',
        // Armor & Item icons
        ui_armor_icons: 'asset/opengameart/armor_icons.png',
        // RPG Item Icons (individual PNGs for ground loot)
        icon_sword: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/metal sword.png',
        icon_armor: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/metal chest plate.png',
        icon_cloak: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Cloak_02.png',
        icon_potion_red: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Small Potion_00.png',
        icon_potion_blue: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Small Potion_03.png',
        icon_gems: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Gems_01.png',
        icon_necklace: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Necklace_02.png',
        icon_ring: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Ornament_02.png',
        icon_book: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Book_00.png',
        icon_crystal: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Crystal Ball_02.png',
        icon_rune: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Ruin Stone_01.png',
        icon_shirt: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Shirt_00.png',
        icon_wood: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Wood_00.png',
        icon_coin: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Coin_03.png',
        icon_essence: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Essence_03.png',
        // Props
        props_1x1: 'asset/opengameart/props/props_1x1.png',
        // Animated Coins (256x32 each = 8 frames of 32x32)
        coin_gold: 'asset/opengameart/coins/coin_gold.png',
        coin_silver: 'asset/opengameart/coins/coin_silver.png',
        coin_copper: 'asset/opengameart/coins/coin_copper.png',
        // Experience Bar (itsmars - 4 layers)
        ui_exp_back: 'asset/opengameart/ui/exp_bar/itsmars Experience Bar/itsmars_exp_back.png',
        ui_exp_fill: 'asset/opengameart/ui/exp_bar/itsmars Experience Bar/itsmars_exp_fill.png',
        ui_exp_highlight: 'asset/opengameart/ui/exp_bar/itsmars Experience Bar/itsmars_exp_highlight.png',
        ui_exp_shadow: 'asset/opengameart/ui/exp_bar/itsmars Experience Bar/itsmars_exp_shadow.png',
        // VFX Impact (16-frame strips, 2048x512 = 128px cells)
        vfx_impact_blood: 'asset/opengameart/vfx/rpg_vfx_pack/16_frames/vfx_sequence_x16_blood.png',
        vfx_impact_earth: 'asset/opengameart/vfx/rpg_vfx_pack/16_frames/vfx_sequence_x16_earth.png',
        // VFX Balls (8-frame, 1024x1024)
        vfx_ball_set: 'asset/opengameart/vfx/rpg_vfx_pack/8_frames/vfx_sequence_x8_ball_set_1.png',
        // Spell animations
        spell_fireball: 'asset/opengameart/spell_anims/fireball.png',
        spell_flash_freeze: 'asset/opengameart/spell_anims/flash_freeze.png',
        spell_flash_heal: 'asset/opengameart/spell_anims/flash_heal.png',
        // Kenney Isometric dungeon props
        kenney_stairs: 'asset/opengameart/kenney_dungeon/Isometric/stairs_S.png',
        // 2D Pixel Dungeon tileset (16px grid, 10×10 cells, dark pixel art dungeon)
        pixel_dungeon_ts: 'asset/2D Pixel Dungeon Asset Pack/character and tileset/Dungeon_Tileset.png',
        // --- New Creature Sprites (Phase 1) ---
        creature_demon: 'asset/opengameart/creatures/demon.png',
        creature_minotaur: 'asset/opengameart/creatures/minotaur.png',
        // --- Spell VFX (Phase 2) ---
        spell_fire_green: 'asset/opengameart/spell_anims/fire_green.png',
        spell_fire_purple: 'asset/opengameart/spell_anims/fire_purple.png',
        spell_fire_yellow: 'asset/opengameart/spell_anims/fire_yellow.png',
        spell_fireball_blue: 'asset/opengameart/spell_anims/fireball_blue.png',
        // --- Spell Effects (Unused pack → now used as Diablo2-ish impact GIFs) ---
        fx_sign_of_fire: 'asset/opengameart/spell_effects/fx4_sign_of_fire.gif',
        fx_black_explosion: 'asset/opengameart/spell_effects/fx10_blackExplosion.gif',
        fx_rain_ground: 'asset/opengameart/spell_effects/fx9_rainOnGround.gif',
        fx_energy_ball: 'asset/opengameart/spell_effects/fx7_energyBall.gif',
        spell_sphere_blue: 'asset/opengameart/spell_anims/sphere_blue.png',
        spell_sphere_purple: 'asset/opengameart/spell_anims/sphere_purple.png',
        spell_sphere_yellow: 'asset/opengameart/spell_anims/sphere_yellow.png',
        spell_skull_smoke_green: 'asset/opengameart/spell_anims/skull_smoke_green.png',
        spell_skull_smoke_purple: 'asset/opengameart/spell_anims/skull_smoke_purple.png',
        spell_arrows_green: 'asset/opengameart/spell_anims/arrows_green.png',
        spell_arrows_yellow: 'asset/opengameart/spell_anims/arrows_yellow.png',
        vfx_impact_air: 'asset/opengameart/vfx/rpg_vfx_pack/16_frames/vfx_sequence_x16_air.png',
        vfx_impact_water: 'asset/opengameart/vfx/rpg_vfx_pack/16_frames/vfx_sequence_x16_impact_water_1.png',
        vfx_impact_divine: 'asset/opengameart/vfx/rpg_vfx_pack/16_frames/vfx_sequence_x16_impact_divine_1.png',
        vfx_impact_chaos: 'asset/opengameart/vfx/rpg_vfx_pack/16_frames/vfx_sequence_x16_chaos.png',
        vfx_swing: 'asset/opengameart/vfx/rpg_vfx_pack/8_frames/vfx_sequence_x8_swing_set_1.png',
        vfx_impact_set2: 'asset/opengameart/vfx/rpg_vfx_pack/8_frames/vfx_sequence_x8_impact_set_2.png',
        // --- Item Icons (Phase 3) ---
        icon_berry: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Berry_02.png',
        icon_berry2: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Berry_03.png',
        icon_book2: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Book_03.png',
        icon_cloak2: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Cloak_03.png',
        icon_crystal2: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Crystal Ball_03.png',
        icon_flower: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Flower Bunch_03.png',
        icon_gems2: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Gems_03.png',
        icon_case: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Metal Case_00.png',
        icon_case2: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Metal Case_01.png',
        icon_necklace2: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Necklace_03.png',
        icon_ring2: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Ornament_03.png',
        icon_parchment: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Parchment_02.png',
        icon_rune2: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Ruin Stone_02.png',
        icon_shirt2: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Shirt_01.png',
        icon_wood2: 'asset/opengameart/rpg_item_icons/Basic RPG Item Free/Wood_01.png',
        // 32rogues tileset (top-down pixel art dungeon tiles, 32x32 grid)
        rogues_tiles: 'asset/32rogues/tiles.png',
        rogues_animated: 'asset/32rogues/animated-tiles.png',
        rogues_items: 'asset/32rogues/items.png',
        // Dungeon Tileset (pre-rendered 3D stone tiles, 450x392px)
        dt_tile1: 'asset/opengameart/dungeon_tileset/Tiles/tile1.png',
        dt_tile2: 'asset/opengameart/dungeon_tileset/Tiles/tile2.png',
        dt_tile3: 'asset/opengameart/dungeon_tileset/Tiles/tile3.png',
        dt_tile4: 'asset/opengameart/dungeon_tileset/Tiles/tile4.png',
        dt_tile5: 'asset/opengameart/dungeon_tileset/Tiles/tile5.png',
        dt_tile6: 'asset/opengameart/dungeon_tileset/Tiles/tile6.png',
        dt_tile7: 'asset/opengameart/dungeon_tileset/Tiles/tile7.png',
        dt_chest_closed: 'asset/opengameart/dungeon_tileset/Tiles/chest1.png',
        dt_chest_open: 'asset/opengameart/dungeon_tileset/Tiles/chest1-open.png',
        dt_crate1: 'asset/opengameart/dungeon_tileset/Tiles/crate1.png',
        dt_crate2: 'asset/opengameart/dungeon_tileset/Tiles/crate2.png',
        dt_door_closed: 'asset/opengameart/dungeon_tileset/Tiles/tiledoor.png',
        dt_door_open: 'asset/opengameart/dungeon_tileset/Tiles/tiledoor-open.png',
        // Kenney Isometric props (256x512px, _S = south view)
        kenney_barrel: 'asset/opengameart/kenney_dungeon/Isometric/barrel_S.png',
        kenney_barrels: 'asset/opengameart/kenney_dungeon/Isometric/barrels_S.png',
        kenney_barrels_stacked: 'asset/opengameart/kenney_dungeon/Isometric/barrelsStacked_S.png',
        kenney_chair: 'asset/opengameart/kenney_dungeon/Isometric/chair_S.png',
        kenney_chest_closed: 'asset/opengameart/kenney_dungeon/Isometric/chestClosed_S.png',
        kenney_table_round: 'asset/opengameart/kenney_dungeon/Isometric/tableRound_S.png',
        kenney_table_short: 'asset/opengameart/kenney_dungeon/Isometric/tableShort_S.png',
        kenney_crate: 'asset/opengameart/kenney_dungeon/Isometric/woodenCrate_S.png',
        kenney_crates: 'asset/opengameart/kenney_dungeon/Isometric/woodenCrates_S.png',
        kenney_woodpile: 'asset/opengameart/kenney_dungeon/Isometric/woodenPile_S.png',
        kenney_stone_floor: 'asset/opengameart/kenney_dungeon/Isometric/stone_S.png',
        kenney_wall: 'asset/opengameart/kenney_dungeon/Isometric/stoneWall_S.png',
        kenney_wall_aged: 'asset/opengameart/kenney_dungeon/Isometric/stoneWallAged_S.png',
        kenney_column: 'asset/opengameart/kenney_dungeon/Isometric/stoneColumn_S.png',
        // --- Dark Fantasy UI (Phase 5) ---
        ui_hpbar_a1: 'asset/opengameart/dark_fantasy_ui/Dark Fantasy UI Pack (CC-BY 4.0 - Of Far Different Nature)/OFDN UI Pack - Health Bar A1.png',
        ui_hpbar_a2: 'asset/opengameart/dark_fantasy_ui/Dark Fantasy UI Pack (CC-BY 4.0 - Of Far Different Nature)/OFDN UI PACK - Health Bar A2.png',
        ui_hpbar_b1: 'asset/opengameart/dark_fantasy_ui/Dark Fantasy UI Pack (CC-BY 4.0 - Of Far Different Nature)/OFDN UI Pack - Health Bar B1.png',
        ui_hpbar_b2: 'asset/opengameart/dark_fantasy_ui/Dark Fantasy UI Pack (CC-BY 4.0 - Of Far Different Nature)/OFDN UI Pack - Health Bar B2.png',
        ui_inventory_a: 'asset/opengameart/dark_fantasy_ui/Dark Fantasy UI Pack (CC-BY 4.0 - Of Far Different Nature)/OFDN UI Pack - Inventory A.png',
    };
    let loaded = 0;
    const total = Object.keys(assets).length;
    for (const [key, src] of Object.entries(assets)) {
        const img = new Image();
        img.onload = () => {
            OGA[key] = img;
            if (++loaded === total) {
                ogaLoaded = true;
                console.log('OGA sprites loaded:', Object.keys(OGA).length, 'assets');
            }
        };
        img.onerror = () => {
            console.warn('OGA sprite FAIL:', key);
            if (++loaded === total) { ogaLoaded = true; }
        };
        img.src = src + '?v=' + Date.now();
    }
}
loadOGASprites();

// FLARE engine source (Avatar.cpp + StatBlock.cpp) defines sprite row screen dirs:
// row0=W, row1=NW, row2=N, row3=NE, row4=E, row5=SE, row6=S, row7=SW
// getFacingDir8 returns: 0=S, 1=SW, 2=W, 3=NW, 4=N, 5=NE, 6=E, 7=SE
// Remap: game dir → sprite row for that screen direction
const OGA_DIR_REMAP = [6, 7, 0, 1, 2, 3, 4, 5];
// Projectile sheets direction order (see fireball_0.png / icicle_0.png): E,SE,S,SW,W,NW,N,NE
// Game dir: S(0),SW(1),W(2),NW(3),N(4),NE(5),E(6),SE(7)
const OGA_PROJ_DIR_REMAP = [2, 3, 4, 5, 6, 7, 0, 1];


// Draw OGA creature sprite (8-dir, animated walk cycle)
function drawOGACreature(monsterType, dirIdx, time, dx, dy, dw, dh) {
    const creatureKey = OGA_CREATURE_MAP[monsterType];
    if (!creatureKey) return false;
    const img = OGA['creature_' + creatureKey];
    if (!img) return false;
    const cellSz = (img.width / 8) | 0;
    // Walk cycle: cols 0-3 (stance + 3 walk frames), 8fps
    const row = OGA_DIR_REMAP[dirIdx] ?? 0;
    const frameIdx = Math.floor((time * 8) % 4);
    const sx = frameIdx * cellSz;
    const sy = row * cellSz;
    ctx.drawImage(img, sx, sy, cellSz, cellSz, dx, dy, dw, dh);
    return true;
}

// Draw OGA projectile sprite (8-dir, animated with per-projectile offset)
function drawOGAProjectile(projType, dirIdx, time, spawnOffset, dx, dy, dw, dh) {
    const info = OGA_PROJ_MAP[projType];
    if (!info) return false;
    const img = OGA[info.sprite];
    if (!img) return false;
    const cellSz = (img.width / 8) | 0;
    const numFrames = (img.width / cellSz) | 0;
    // Per-projectile desync; use projectile-specific direction remap
    const frameIdx = Math.floor(((time + spawnOffset) * 12) % numFrames);
    const row = OGA_PROJ_DIR_REMAP[dirIdx] ?? 0;
    const sx = frameIdx * cellSz;
    const sy = row * cellSz;
    ctx.drawImage(img, sx, sy, cellSz, cellSz, dx, dy, dw, dh);
    return true;
}

// Draw OGA impact sparks (uses OGA_PROJ_MAP.sparksRow for correct element mapping)
function drawOGASparks(element, time, dx, dy, dw, dh) {
    const img = OGA['fx_sparks'];
    if (!img) return false;
    // Normalize element names: game uses 'cold' but assets use 'ice'
    const norm = element === 'cold' ? 'ice' : element;
    const info = OGA_PROJ_MAP[norm];
    const row = info ? info.sparksRow : 4; // fallback to row 4
    const frameIdx = Math.floor((time * 10) % 4);
    ctx.drawImage(img, frameIdx * 64, row * 64, 64, 64, dx, dy, dw, dh);
    return true;
}

// Map item types to OGA RPG item icon keys for ground loot rendering
const OGA_ITEM_ICON_MAP = {
    sword: 'icon_sword', axe: 'icon_sword', dagger: 'icon_sword',
    staff: 'icon_wood', wand: 'icon_wood2',
    bow: 'icon_wood2', crossbow: 'icon_wood2',
    armor: 'icon_armor', shield: 'icon_case2',
    helmet: 'icon_case', boots: 'icon_shirt2',
    ring: 'icon_ring', amulet: 'icon_necklace',
    hp1: 'icon_potion_red', hp2: 'icon_potion_red', hp3: 'icon_potion_red',
    hp4: 'icon_potion_red', hp5: 'icon_potion_red',
    mp1: 'icon_potion_blue', mp2: 'icon_potion_blue', mp3: 'icon_potion_blue',
    manaPotion: 'icon_potion_blue', potion: 'icon_potion_red',
    rejuv: 'icon_flower', fullrejuv: 'icon_flower',
    rune: 'icon_rune',
    smallCharm: 'icon_gems', mediumCharm: 'icon_gems2', grandCharm: 'icon_crystal2',
    scroll: 'icon_parchment', tome: 'icon_book2',
    berry: 'icon_berry', berry2: 'icon_berry2',
    cloak: 'icon_cloak2',
};
// Rarity-based icon overrides (rare+ items get alternate icon variants)
function getItemIconKey(typeKey, rarity) {
    if (rarity >= 3) { // rare or better
        const rareOverrides = {
            ring: 'icon_ring2', amulet: 'icon_necklace2', rune: 'icon_rune2',
            shield: 'icon_case', helmet: 'icon_case2', grandCharm: 'icon_crystal'
        };
        if (rareOverrides[typeKey]) return rareOverrides[typeKey];
    }
    return OGA_ITEM_ICON_MAP[typeKey] || null;
}
// Draw an OGA RPG item icon for ground loot
function drawOGAItemIcon(typeKey, dx, dy, dw, dh, rarity) {
    const iconKey = (rarity != null) ? getItemIconKey(typeKey, rarity) : OGA_ITEM_ICON_MAP[typeKey];
    if (!iconKey) return false;
    const img = OGA[iconKey];
    if (!img) return false;
    ctx.drawImage(img, dx, dy, dw, dh);
    return true;
}
// Map equip slots to armor_icons.png grid positions (64px cells, 5x5)
const OGA_ARMOR_SLOT_MAP = {
    weapon: { col: 0, row: 0 }, offhand: { col: 1, row: 0 },
    head: { col: 2, row: 0 }, body: { col: 3, row: 0 },
    ring: { col: 4, row: 0 }, amulet: { col: 0, row: 1 }, feet: { col: 1, row: 1 },
};

// Get monster facing direction (toward player when aggroed)
function getMonsterFacingDir(m) {
    if (m.aggroed && typeof player !== 'undefined' && player) {
        return getFacingDir8(player.x - m.x, player.y - m.y);
    }
    return 0; // default South
}

// Get 8-directional facing index from movement angle
function getFacingDir8(dx, dy) {
    if (dx === 0 && dy === 0) return 0; // default S
    const angle = Math.atan2(dy, dx); // -PI to PI
    // Map angle to 8 directions: S=down(+Y), etc.
    // In game: +Y is down on screen, +X is right
    // atan2(dy,dx): right=0, down=PI/2, left=PI, up=-PI/2
    // Our sprite order: S(0), SW(1), W(2), NW(3), N(4), NE(5), E(6), SE(7)
    // S = down = PI/2, SW = 3PI/4, W = PI, NW = -3PI/4, N = -PI/2, NE = -PI/4, E = 0, SE = PI/4
    const dirAngles = [Math.PI / 2, Math.PI * 3 / 4, Math.PI, -Math.PI * 3 / 4, -Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4];
    let bestIdx = 0, bestDist = Infinity;
    for (let i = 0; i < 8; i++) {
        let diff = Math.abs(angle - dirAngles[i]);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        if (diff < bestDist) { bestDist = diff; bestIdx = i; }
    }
    return bestIdx;
}

// Resolve which hi-res sprite class prefix to use
function getHiResClassKey(player) {
    const cls = player.classKey || 'warrior';
    return HIRES_CLASS_MAP[cls] || 'warrior';
}

// Determine current animation state
function getHiResAnimState(player) {
    if (player.attacking) {
        const cls = HIRES_CLASS_MAP[player.classKey] || 'warrior';
        if (cls === 'mage') return 'cast';
        if (cls === 'rogue') return 'shoot';
        return 'swing';
    }
    if (player.moving || player._kbMoving) return 'run';
    return 'stance';
}

// Draw hi-res animated sprite (grid format: rows=directions, cols=frames)
// Uses OGA_DIR_REMAP (same direction order as creature sprites)
function drawHiResSpr(classKey, animName, dirIdx, time, dx, dy, dw, dh) {
    const row = OGA_DIR_REMAP[dirIdx] ?? 0;
    const sheetKey = `hero_${classKey}_${animName}`;
    const img = HIRES_SPRITES[sheetKey];
    if (!img) {
        // Fallback to base class
        const fallbackKey = `hero_base_${animName}`;
        const fallbackImg = HIRES_SPRITES[fallbackKey];
        if (!fallbackImg) return false;
        const cfg = HIRES_ANIM_CONFIG[animName] || { frames: 4, fps: 8 };
        const frameIdx = Math.floor((time * cfg.fps) % cfg.frames);
        const sx = frameIdx * HIRES_SP;
        const sy = row * HIRES_SP;
        ctx.drawImage(fallbackImg, sx, sy, HIRES_SP, HIRES_SP, dx, dy, dw, dh);
        return true;
    }
    const cfg = HIRES_ANIM_CONFIG[animName] || { frames: 4, fps: 8 };
    const frameIdx = Math.floor((time * cfg.fps) % cfg.frames);
    const sx = frameIdx * HIRES_SP;
    const sy = row * HIRES_SP;
    ctx.drawImage(img, sx, sy, HIRES_SP, HIRES_SP, dx, dy, dw, dh);
    return true;
}

function drawSpr(key, dx, dy, dw, dh, flipX, dropShadow) {
    const a = ATLAS[key];
    if (!a || !SPRITES[a[0]]) return false;
    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    // Drop shadow for character/monster sprites
    if (dropShadow) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(dx + dw / 2, dy + dh - 2, dw * 0.35, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    if (flipX) {
        ctx.save(); ctx.translate(dx + dw, dy); ctx.scale(-1, 1);
        ctx.drawImage(SPRITES[a[0]], a[1], a[2], SP, SP, 0, 0, dw, dh);
        ctx.restore();
    } else {
        ctx.drawImage(SPRITES[a[0]], a[1], a[2], SP, SP, dx, dy, dw, dh);
    }
    ctx.imageSmoothingEnabled = prevSmooth;
    return true;
}

function drawKenneyDungeonProp(key, tileSx, tileSy, scale = 1) {
    const img = OGA[key];
    if (!img) return false;
    const drawW = Math.round(TILE * scale);
    const drawH = Math.round(drawW * (img.height / img.width));
    const dx = tileSx + (TILE - drawW) / 2;
    const dy = tileSy + TILE - drawH;
    // Soft contact shadow to anchor props on floor
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(tileSx + TILE / 2, tileSy + TILE - 4, drawW * 0.28, Math.max(2, drawW * 0.08), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(img, dx, dy, drawW, drawH);
    return true;
}

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
        () => { const f = 1500 + Math.random() * 1000; playSound(f, 'sine', 0.06, 0.025); setTimeout(() => playSound(f * 0.7, 'sine', 0.05, 0.015), 100 + Math.random() * 80); },
        () => { for (let i = 0; i < 3; i++) setTimeout(() => playNoise(0.02, 0.015, 4000 + Math.random() * 2000), i * 60); },
        () => { playSweep(60, 40, 0.3, 'sawtooth', 0.008); },
        () => { playSweep(200, 150, 0.6, 'sine', 0.01); setTimeout(() => playSweep(170, 130, 0.4, 'sine', 0.006), 300); }
    ],
    2: [ // Desert: wind, sand, distant rumble
        () => { playNoise(1.0, 0.015, 600); playSweep(300, 100, 0.8, 'sine', 0.004); },
        () => { playNoise(0.3, 0.01, 1200); },
        () => { playNoise(0.5, 0.015, 250); playSound(30, 'sine', 0.4, 0.008); },
        () => { playSweep(800, 400, 0.5, 'sine', 0.003); }
    ],
    3: [ // Jungle: insects, birds, rain, frogs
        () => { for (let i = 0; i < 5; i++) setTimeout(() => playSound(3000 + Math.random() * 2000, 'sine', 0.02, 0.008), i * 40); },
        () => { playSweep(2000, 1500, 0.3, 'sine', 0.006); setTimeout(() => playSweep(1800, 1200, 0.25, 'sine', 0.004), 200); },
        () => { for (let i = 0; i < 8; i++) setTimeout(() => playNoise(0.01, 0.004, 6000), i * 30 + Math.random() * 20); },
        () => { playSound(150, 'square', 0.1, 0.008); setTimeout(() => playSound(120, 'square', 0.08, 0.006), 200); }
    ],
    4: [ // Hell: fire, screams, explosions, lava
        () => { playNoise(0.8, 0.02, 200); playSound(25, 'sawtooth', 0.6, 0.01); },
        () => { playSweep(400, 100, 0.5, 'sawtooth', 0.012); },
        () => { playNoise(0.2, 0.025, 150); playSound(40, 'sine', 0.3, 0.015); },
        () => { playSweep(600, 200, 0.4, 'sine', 0.008); setTimeout(() => playSweep(500, 150, 0.3, 'sine', 0.005), 150); }
    ],
    5: [ // Ice: wind, cracking ice, crystals, howl
        () => { playNoise(1.2, 0.012, 1000); playSweep(500, 300, 0.8, 'sine', 0.003); },
        () => { playSound(2500, 'sine', 0.03, 0.015); setTimeout(() => playSound(3000, 'sine', 0.02, 0.01), 100); },
        () => { for (let i = 0; i < 3; i++) setTimeout(() => playSound(4000 + Math.random() * 1000, 'sine', 0.01, 0.006), i * 80); },
        () => { playSweep(300, 150, 0.8, 'sine', 0.008); }
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

// --- Constants ---
const TILE = 40;
const MAP_W = 60, MAP_H = 60;

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
    gameClearScreen: document.getElementById('gameClearScreen'),
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
window.setSaveSlot = function (slot) {
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

// ========== ACT / CHAPTER DEFINITIONS ==========
const ACT_DEFS = {
    1: {
        name: '地下聖堂', nameEn: 'Cathedral', floors: 5, tileTheme: 'cathedral',
        floorColors: { base: [24, 22, 20], wall: '#3d3228', mortar: '#1e1610' },
        wallColors: { primary: '#44382c', secondary: '#403428', tertiary: '#3e3226' },
        lightTint: { warm: 'rgba(255,160,64,', cold: 'rgba(0,0,5,' },
        monsterTypes: ['skeleton', 'zombie'], bossType: 'skeleton_king', bossFloor: 5,
        townName: '修道院の村', townBG: '#1a140e',
        areas: [
            { name: '聖堂入口', floors: [1, 2], density: 'low' },
            { name: '地下墓地', floors: [3, 4], density: 'medium' },
            { name: '骸骨王の間', floors: [5], density: 'boss' }
        ],
        monsterPool: { common: ['skeleton', 'zombie'], elite: [], boss: ['skeleton_king'] }
    },
    2: {
        name: '砂漠遺跡', nameEn: 'Desert Ruins', floors: 5, tileTheme: 'desert',
        floorColors: { base: [38, 32, 22], wall: '#5a4830', mortar: '#2a2018' },
        wallColors: { primary: '#6a5838', secondary: '#5e4e30', tertiary: '#524428' },
        lightTint: { warm: 'rgba(255,180,80,', cold: 'rgba(10,5,0,' },
        monsterTypes: ['mummy', 'scarab', 'sand_golem'], bossType: 'sand_worm', bossFloor: 5,
        townName: '砂漠のオアシス', townBG: '#1e1a10',
        areas: [
            { name: '砂漠の門', floors: [1, 2], density: 'low' },
            { name: '古代墓地', floors: [3, 4], density: 'medium' },
            { name: '砂虫の巣', floors: [5], density: 'boss' }
        ],
        monsterPool: { common: ['mummy', 'scarab', 'sand_golem'], elite: [], boss: ['sand_worm'] }
    },
    3: {
        name: '密林神殿', nameEn: 'Jungle Temple', floors: 5, tileTheme: 'jungle',
        floorColors: { base: [18, 28, 16], wall: '#2a3a22', mortar: '#162010' },
        wallColors: { primary: '#304828', secondary: '#2a4022', tertiary: '#263a1e' },
        lightTint: { warm: 'rgba(180,220,100,', cold: 'rgba(0,10,5,' },
        monsterTypes: ['treeant', 'poison_spider', 'jungle_shaman'], bossType: 'archmage', bossFloor: 5,
        townName: 'クラスト港', townBG: '#0e1a0e',
        areas: [
            { name: '密林の入口', floors: [1, 2], density: 'low' },
            { name: '蜘蛛の洞窟', floors: [3, 4], density: 'medium' },
            { name: '大魔導師の間', floors: [5], density: 'boss' }
        ],
        monsterPool: { common: ['treeant', 'poison_spider', 'jungle_shaman'], elite: [], boss: ['archmage'] }
    },
    4: {
        name: '地獄', nameEn: 'Hell', floors: 3, tileTheme: 'hell',
        floorColors: { base: [30, 10, 8], wall: '#4a1a10', mortar: '#280e08' },
        wallColors: { primary: '#5a2018', secondary: '#4e1a12', tertiary: '#42160e' },
        lightTint: { warm: 'rgba(255,80,30,', cold: 'rgba(20,0,0,' },
        monsterTypes: ['demon', 'hellhound', 'imp'], bossType: 'demon_lord', bossFloor: 3,
        townName: '要塞', townBG: '#1a0808',
        areas: [
            { name: '地獄の門', floors: [1], density: 'medium' },
            { name: '炎獄', floors: [2], density: 'high' },
            { name: '魔王の間', floors: [3], density: 'boss' }
        ],
        monsterPool: { common: ['demon', 'hellhound', 'imp'], elite: [], boss: ['demon_lord'] }
    },
    5: {
        name: '氷の山', nameEn: 'Frozen Mountain', floors: 5, tileTheme: 'ice',
        floorColors: { base: [18, 22, 30], wall: '#283848', mortar: '#1a2430' },
        wallColors: { primary: '#304050', secondary: '#283848', tertiary: '#223040' },
        lightTint: { warm: 'rgba(100,150,255,', cold: 'rgba(0,0,20,' },
        monsterTypes: ['frost_zombie', 'ice_wraith', 'yeti'], bossType: 'ice_queen', bossFloor: 5,
        townName: 'ハログス', townBG: '#0a1020',
        areas: [
            { name: '氷の入口', floors: [1, 2], density: 'low' },
            { name: '凍てつく洞窟', floors: [3, 4], density: 'medium' },
            { name: '氷の女王の間', floors: [5], density: 'boss' }
        ],
        monsterPool: { common: ['frost_zombie', 'ice_wraith', 'yeti'], elite: [], boss: ['ice_queen'] }
    }
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
    normal: { name: 'ノーマル', color: '#cccccc', mult: 1.0, xpMult: 1.0, dropBonus: 0, respenalty: 0 },
    nightmare: { name: 'ナイトメア', color: '#ffaa44', mult: 1.7, xpMult: 1.5, dropBonus: 0.15, respenalty: 40 },
    hell: { name: 'ヘル', color: '#ff4444', mult: 2.8, xpMult: 2.0, dropBonus: 0.30, respenalty: 100 }
};
function getDifficultyMult() { return DIFFICULTY_DEFS[G.difficulty || 'normal'].mult; }
function getCycleMult() { return (1 + G.cycle * 0.6) * getDifficultyMult(); }
function isBossFloor() { return G.actFloor === getCurrentActDef().bossFloor; }

// ========== BOSS DEFINITIONS ==========
const BOSS_DEFS = {
    skeleton_king: {
        name: '骸骨王', icon: '👑💀', hp: 1024, dmg: 40, spd: 55, r: 22, xp: 1000, defense: 25,
        color: '#d4a44a', phases: [
            { hpPct: 1.0, type: 'melee' },
            { hpPct: 0.6, type: 'summon', count: 4, summonType: 'skeleton', cd: 8 },
            { hpPct: 0.3, type: 'nova', count: 12, cd: 5, projSpd: 200, projDmg: 25, projColor: '#ffffaa' }
        ]
    },
    sand_worm: {
        name: '砂蟲', icon: '🐛', hp: 2000, dmg: 50, spd: 50, r: 24, xp: 1500, defense: 90,
        color: '#aa8833', phases: [
            { hpPct: 1.0, type: 'burrow', cd: 6 },
            { hpPct: 0.6, type: 'poison_spray', cd: 4, count: 5, projSpd: 180, projDmg: 20, projColor: '#44cc00' },
            { hpPct: 0.3, type: 'quake', cd: 5, dmg: 30, radius: 150 }
        ]
    },
    archmage: {
        name: '大魔導師', icon: '🧙', hp: 3000, dmg: 55, spd: 65, r: 18, xp: 2000, defense: 70,
        color: '#6644cc', phases: [
            { hpPct: 1.0, type: 'teleport_attack', cd: 3 },
            { hpPct: 0.6, type: 'nova', count: 8, cd: 4, projSpd: 220, projDmg: 30, projColor: '#aa44ff' },
            { hpPct: 0.3, type: 'summon', count: 3, summonType: 'jungle_shaman', cd: 10 }
        ]
    },
    demon_lord: {
        name: '魔王', icon: '👿🔥', hp: 5000, dmg: 70, spd: 60, r: 26, xp: 3000, defense: 120,
        color: '#cc2200', phases: [
            { hpPct: 1.0, type: 'melee' },
            { hpPct: 0.75, type: 'fire_breath', cd: 5, count: 7, projSpd: 200, projDmg: 35, projColor: '#ff6600' },
            { hpPct: 0.5, type: 'summon', count: 3, summonType: 'demon', cd: 10 },
            { hpPct: 0.25, type: 'meteor', cd: 8, count: 5, dmg: 50, radius: 80 }
        ]
    },
    ice_queen: {
        name: '氷の女王', icon: '👸❄', hp: 8000, dmg: 80, spd: 60, r: 20, xp: 4000, defense: 150,
        color: '#88ccff', phases: [
            { hpPct: 1.0, type: 'nova', count: 6, cd: 3, projSpd: 200, projDmg: 25, projColor: '#aaddff' },
            { hpPct: 0.5, type: 'freeze_aura', cd: 6, radius: 120, dmg: 15 },
            { hpPct: 0.25, type: 'blizzard', cd: 8, count: 12, dmg: 35, radius: 200 }
        ]
    }
};

// ========== UBER BOSS SYSTEM ==========
// 3 Uber Keys drop from Act bosses on Nightmare/Hell difficulty
// Combine all 3 keys at the Uber NPC to open a portal to the Uber Tristram
const UBER_KEY_DEFS = {
    key_terror: { name: '恐怖の鍵', icon: '🗝', color: '#ff4444', desc: '混沌の門を開く鍵の1つ', fromBoss: 'demon_lord' },
    key_hate: { name: '憎悪の鍵', icon: '🗝', color: '#44ff44', desc: '混沌の門を開く鍵の1つ', fromBoss: 'archmage' },
    key_destruction: { name: '破壊の鍵', icon: '🗝', color: '#4488ff', desc: '混沌の門を開く鍵の1つ', fromBoss: 'ice_queen' }
};
const UBER_BOSS_DEFS = {
    uber_diablo: {
        name: 'パンデモニウム・ディアブロ', icon: '👿🔥', hp: 30000, dmg: 180, spd: 70, r: 30, xp: 15000, defense: 400,
        color: '#ff2200', immunities: { fire: 100, lightning: 50 }, phases: [
            { hpPct: 1.0, type: 'melee' },
            { hpPct: 0.75, type: 'fire_breath', cd: 4, count: 10, projSpd: 250, projDmg: 80, projColor: '#ff4400' },
            { hpPct: 0.5, type: 'nova', count: 16, cd: 3, projSpd: 220, projDmg: 60, projColor: '#ff6600' },
            { hpPct: 0.25, type: 'meteor', cd: 6, count: 8, dmg: 100, radius: 120 }
        ]
    },
    uber_mephisto: {
        name: 'パンデモニウム・メフィスト', icon: '🧙‍♂️💀', hp: 22000, dmg: 150, spd: 80, r: 24, xp: 12000, defense: 350,
        color: '#6644cc', immunities: { cold: 100, poison: 50 }, phases: [
            { hpPct: 1.0, type: 'teleport_attack', cd: 2 },
            { hpPct: 0.6, type: 'nova', count: 12, cd: 3, projSpd: 240, projDmg: 70, projColor: '#aa44ff' },
            { hpPct: 0.3, type: 'summon', count: 4, summonType: 'demon', cd: 8 }
        ]
    },
    uber_baal: {
        name: 'パンデモニウム・バール', icon: '👁🌀', hp: 40000, dmg: 200, spd: 65, r: 32, xp: 20000, defense: 500,
        color: '#88ccff', immunities: { cold: 100, fire: 50 }, phases: [
            { hpPct: 1.0, type: 'nova', count: 8, cd: 4, projSpd: 200, projDmg: 50, projColor: '#aaddff' },
            { hpPct: 0.7, type: 'freeze_aura', cd: 5, radius: 150, dmg: 30 },
            { hpPct: 0.4, type: 'summon', count: 5, summonType: 'frost_zombie', cd: 7 },
            { hpPct: 0.2, type: 'blizzard', cd: 6, count: 16, dmg: 70, radius: 250 }
        ]
    }
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
    q_act1_den: {
        act: 1, name: '悪の巣窟', type: 'kill_count', target: 30,
        desc: '地下聖堂の悪しき力を浄化せよ', rewards: { xp: 300, gold: 200, skillReset: true }
    },
    q_act1_main: {
        act: 1, name: '骸骨王の討伐', type: 'kill_boss', target: 'skeleton_king',
        desc: '地下聖堂の最深部に巣くう骸骨王を倒せ', rewards: { xp: 1000, gold: 500, item: 'rare' }
    },
    q_act1_clear: {
        act: 1, name: '聖堂の浄化', type: 'kill_count', target: 50,
        desc: '地下聖堂のモンスターを50体倒せ', rewards: { xp: 500, gold: 300 }
    },
    q_act2_main: {
        act: 2, name: '砂蟲の退治', type: 'kill_boss', target: 'sand_worm', prereq: 'q_act1_main',
        desc: '砂漠の地下に潜む巨大砂蟲を倒せ', rewards: { xp: 1500, gold: 800, item: 'rare' }
    },
    q_act2_clear: {
        act: 2, name: '遺跡の調査', type: 'kill_count', target: 60,
        desc: '砂漠遺跡のモンスターを60体倒せ', rewards: { xp: 800, gold: 400 }
    },
    q_act3_main: {
        act: 3, name: '大魔導師の打倒', type: 'kill_boss', target: 'archmage', prereq: 'q_act2_main',
        desc: '密林神殿の大魔導師を倒せ', rewards: { xp: 2000, gold: 1200, item: 'legendary' }
    },
    q_act3_clear: {
        act: 3, name: '密林の制圧', type: 'kill_count', target: 70,
        desc: '密林神殿のモンスターを70体倒せ', rewards: { xp: 1000, gold: 500 }
    },
    q_act4_main: {
        act: 4, name: '魔王の討滅', type: 'kill_boss', target: 'demon_lord', prereq: 'q_act3_main',
        desc: '地獄の奥底に君臨する魔王を倒せ', rewards: { xp: 3000, gold: 2000, item: 'legendary' }
    },
    q_act4_clear: {
        act: 4, name: '地獄の鎮圧', type: 'kill_count', target: 50,
        desc: '地獄のモンスターを50体倒せ', rewards: { xp: 1500, gold: 800 }
    },
    q_act5_main: {
        act: 5, name: '氷の女王の討伐', type: 'kill_boss', target: 'ice_queen', prereq: 'q_act4_main',
        desc: '氷の山頂に住む氷の女王を倒せ', rewards: { xp: 4000, gold: 3000, item: 'unique' }
    },
    q_act5_clear: {
        act: 5, name: '氷山の掃討', type: 'kill_count', target: 80,
        desc: '氷の山のモンスターを80体倒せ', rewards: { xp: 2000, gold: 1000 }
    }
};

// ========== TOWN NPC DEFINITIONS ==========
const TOWN_NPC_DEFS = {
    1: [
        { id: 'merchant_1', name: '商人マーロ', icon: '🧑‍💼', sprite: 'npcShopkeep', hiresClass: 'rogue', type: 'shop', dialog: ['品物を見ていくかい？何でも揃ってるよ。', '良い防具があれば命を救うぞ。'] },
        { id: 'smith_1', name: '鍛冶屋グリスウォルド', icon: '⚒', sprite: 'npcBlacksmith', hiresClass: 'warrior', type: 'blacksmith', dialog: ['武器を鍛えてやろう。', '良い鉄を使えば、切れ味が違う。'] },
        { id: 'stash_1', name: '倉庫番カイン', icon: '📦', sprite: 'npcScholar', hiresClass: 'base', type: 'stash', dialog: ['預かり物はここに置いていけ。', '倉庫はいつでも使えるぞ。'] },
        { id: 'quest_1', name: '長老アカラ', icon: '👵', sprite: 'npcElderlyW', hiresClass: 'mage', type: 'quest', dialog: ['勇者よ、地下聖堂の魔物を退治してくれ。', '骸骨王が復活したのだ...'] },
        { id: 'wp_1', name: 'ウェイポイント', icon: '🌀', type: 'waypoint', dialog: [] },
        { id: 'merc_1', name: '傭兵ギルド長カシア', icon: '⚔', sprite: 'npcWarClericF', hiresClass: 'warrior', type: 'mercenary', dialog: ['傭兵を雇いたいか？腕利きが揃ってるよ。'] },
        { id: 'gamble_1', name: '賭博師ガイード', icon: '🎰', sprite: 'npcPeasant1', hiresClass: 'rogue', type: 'gamble', dialog: ['運試しはどうだい？何が出るかは開けてのお楽しみさ。'] }
    ],
    2: [
        { id: 'merchant_2', name: '商人エルジクス', icon: '🧑‍💼', sprite: 'npcShopkeep', hiresClass: 'rogue', type: 'shop', dialog: ['砂漠の品は珍しいぞ。', '水よりも価値のある物がある。'] },
        { id: 'smith_2', name: '鍛冶屋ファーラ', icon: '⚒', sprite: 'npcBlacksmith', hiresClass: 'warrior', type: 'blacksmith', dialog: ['砂漠の鉄は硬いが...鍛えがいがある。'] },
        { id: 'stash_2', name: '倉庫番メシフ', icon: '📦', sprite: 'npcPeasant1', hiresClass: 'base', type: 'stash', dialog: ['荷物はここに預けろ。'] },
        { id: 'quest_2', name: '賢者ドロガン', icon: '🧔', sprite: 'npcDesertSage', hiresClass: 'mage', type: 'quest', dialog: ['砂漠の地下に巨大な蟲がいる...退治してくれ。'] },
        { id: 'wp_2', name: 'ウェイポイント', icon: '🌀', type: 'waypoint', dialog: [] },
        { id: 'merc_2', name: '傭兵隊長グレイズ', icon: '⚔', sprite: 'npcWarClericM', hiresClass: 'warrior', type: 'mercenary', dialog: ['砂漠で鍛えた兵がいる。雇うか？'] },
        { id: 'gamble_2', name: '賭博師アルール', icon: '🎰', sprite: 'npcPeasant1', hiresClass: 'rogue', type: 'gamble', dialog: ['砂漠の宝石が入ってるかもよ？'] }
    ],
    3: [
        { id: 'merchant_3', name: '商人アシェラ', icon: '🧑‍💼', sprite: 'npcShopkeep', hiresClass: 'rogue', type: 'shop', dialog: ['密林の収穫品だ、見てくれ。'] },
        { id: 'smith_3', name: '鍛冶屋ヘファスト', icon: '⚒', sprite: 'npcBlacksmith', hiresClass: 'warrior', type: 'blacksmith', dialog: ['神殿の金属は特殊だ...鍛え直してやろう。'] },
        { id: 'stash_3', name: '倉庫番ナタリヤ', icon: '📦', sprite: 'npcWarClericF', hiresClass: 'base', type: 'stash', dialog: ['安全に保管してあるわ。'] },
        { id: 'quest_3', name: '巫女オーマス', icon: '🧙‍♀', sprite: 'npcWarClericM', hiresClass: 'mage', type: 'quest', dialog: ['大魔導師が神殿を支配している...倒してくれ。'] },
        { id: 'wp_3', name: 'ウェイポイント', icon: '🌀', type: 'waypoint', dialog: [] },
        { id: 'merc_3', name: '傭兵長アシェラ', icon: '⚔', sprite: 'npcWarClericF', hiresClass: 'warrior', type: 'mercenary', dialog: ['密林の戦士を紹介しよう。'] },
        { id: 'gamble_3', name: '賭博師リア', icon: '🎰', sprite: 'npcElderlyW', hiresClass: 'rogue', type: 'gamble', dialog: ['密林には隠された宝がある...賭けてみるかい？'] }
    ],
    4: [
        { id: 'merchant_4', name: '商人ジャメラ', icon: '🧑‍💼', sprite: 'npcShopkeep', hiresClass: 'rogue', type: 'shop', dialog: ['地獄でも商売は続く...'] },
        { id: 'smith_4', name: '鍛冶屋ハルバ', icon: '⚒', sprite: 'npcBlacksmith', hiresClass: 'warrior', type: 'blacksmith', dialog: ['地獄の炎で鍛えた武器は一味違う。'] },
        { id: 'stash_4', name: '倉庫番ティラエル', icon: '📦', sprite: 'templar', hiresClass: 'base', type: 'stash', dialog: ['ここなら安全だ。'] },
        { id: 'quest_4', name: '天使ハラティ', icon: '👼', sprite: 'priest', hiresClass: 'mage', type: 'quest', dialog: ['魔王を倒さねば世界が滅ぶ...頼む。'] },
        { id: 'wp_4', name: 'ウェイポイント', icon: '🌀', type: 'waypoint', dialog: [] },
        { id: 'merc_4', name: '傭兵ギルド長ティリエル', icon: '⚔', sprite: 'templar', hiresClass: 'warrior', type: 'mercenary', dialog: ['地獄でも戦える兵士がいる。'] },
        { id: 'gamble_4', name: '賭博師ジャム', icon: '🎰', sprite: 'npcDesertSage', hiresClass: 'rogue', type: 'gamble', dialog: ['地獄の品を賭けてみるか？命を賭ける価値はあるぞ。'] }
    ],
    5: [
        { id: 'merchant_5', name: '商人アーニャ', icon: '🧑‍💼', sprite: 'npcShopkeep', hiresClass: 'rogue', type: 'shop', dialog: ['氷の品は貴重よ。'] },
        { id: 'smith_5', name: '鍛冶屋ラーズク', icon: '⚒', sprite: 'npcBlacksmith', hiresClass: 'warrior', type: 'blacksmith', dialog: ['凍てつく金属...だが鍛えられる。'] },
        { id: 'stash_5', name: '倉庫番ニーラサック', icon: '📦', sprite: 'npcElderlyM', hiresClass: 'base', type: 'stash', dialog: ['預かるぞ。'] },
        { id: 'quest_5', name: '賢者マラス', icon: '🧓', sprite: 'npcElderlyM', hiresClass: 'mage', type: 'quest', dialog: ['氷の女王が山を支配している...最後の戦いだ。'] },
        { id: 'wp_5', name: 'ウェイポイント', icon: '🌀', type: 'waypoint', dialog: [] },
        { id: 'uber_5', name: '闘技場の門番', icon: '🌀', sprite: 'npcScholar', hiresClass: 'mage', type: 'uber_portal', dialog: ['3つの鍵を集めたか？パンデモニウムへの門を開こう...'], requireDifficulty: true },
        { id: 'merc_5', name: '傭兵長ラーズク', icon: '⚔', sprite: 'npcWarClericM', hiresClass: 'warrior', type: 'mercenary', dialog: ['氷の戦士を紹介しよう。'] },
        { id: 'gamble_5', name: '賭博師ニーラ', icon: '🎰', sprite: 'npcElderlyW', hiresClass: 'rogue', type: 'gamble', dialog: ['氷の中に眠る宝...引き当てられるかしら？'] }
    ]
};

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
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
            x + randf(-4, 4),
            y + randf(-4, 4),
            Math.cos(a) * s,
            Math.sin(a) * s,
            color,
            randf(life * 0.5, life),
            randf(size * 0.5, size * 1.5),
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
                    particles.push(new Particle(x, y, randf(-20, 20), randf(-20, 20), color, 0.2, 1, 0, attribute, skillLevel));
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

// ========== TILE TEXTURE SYSTEM (Offscreen Canvas) ==========
// Pre-render tile textures for much better visual quality
const TILE_TEXTURES = {};

function generateTileTextures(theme) {
    theme = theme || 'cathedral';
    const actDef = Object.values(ACT_DEFS).find(a => a.tileTheme === theme) || ACT_DEFS[1];
    const themeColors = actDef.floorColors || { base: [24, 22, 20] };
    const themeWall = actDef.wallColors || {};

    // Helper: create noise pattern on a canvas
    function addNoise(tctx, w, h, intensity, r, g, b) {
        const id = tctx.getImageData(0, 0, w, h);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
            const n = (Math.random() - 0.5) * intensity;
            d[i] = clamp(d[i] + n * r, 0, 255);
            d[i + 1] = clamp(d[i + 1] + n * g, 0, 255);
            d[i + 2] = clamp(d[i + 2] + n * b, 0, 255);
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
    wc2.fillRect(2, thirdH * 2 + 1, TILE * 2 / 3 - 3, thirdH - 3);
    wc2.fillStyle = '#403428';
    wc2.fillRect(TILE * 2 / 3 + 1, thirdH * 2 + 1, TILE / 3 - 3, thirdH - 3);
    wc2.strokeStyle = '#1e1610';
    wc2.lineWidth = 1;
    wc2.beginPath();
    wc2.moveTo(0, thirdH); wc2.lineTo(TILE, thirdH); wc2.stroke();
    wc2.beginPath();
    wc2.moveTo(0, thirdH * 2); wc2.lineTo(TILE, thirdH * 2); wc2.stroke();
    wc2.beginPath();
    wc2.moveTo(TILE / 2, 0); wc2.lineTo(TILE / 2, thirdH); wc2.stroke();
    wc2.beginPath();
    wc2.moveTo(TILE * 2 / 3, thirdH * 2); wc2.lineTo(TILE * 2 / 3, TILE); wc2.stroke();
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
        gdata[i] = gdata[i + 1] = gdata[i + 2] = v;
        gdata[i + 3] = 25;
    }
    gctx.putImageData(gid, 0, 0);
    TILE_TEXTURES['grain'] = grainC;

    // Override tile textures with sprite sheet if loaded
    if (spritesLoaded && SPRITES.tiles) {
        const overrides = {
            wall: 'wallTop', wall2: 'wallSide1', deep_wall: 'deepWall',
            floor_0: 'floorBlank', floor_1: 'floor1', floor_2: 'floor2', floor_3: 'floor3',
            blood_0: 'blood1', blood_1: 'blood2', blood_2: 'corpse1'
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
    const DT_TILES = ['dt_tile1', 'dt_tile2', 'dt_tile3', 'dt_tile4', 'dt_tile5', 'dt_tile6', 'dt_tile7'];
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
            [1, 1], [2, 1], [3, 1],
            [1, 2], [2, 2], [3, 2],
            [1, 3], [2, 3], [3, 3],
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
    const darkenKeys = ['floor_0', 'floor_1', 'floor_2', 'floor_3', 'floor_4', 'floor_5', 'floor_6', 'floor_7', 'floor_8', 'wall', 'wall2'];
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
                const isExposed = this.walkable(x, y + 1) || this.walkable(x + 1, y) || this.walkable(x - 1, y) || this.walkable(x, y - 1);
                if (isExposed && (x * 7 + y * 13) % 29 === 0) {
                    this.torchPositions.push({ wx: x * TILE + TILE / 2, wy: y * TILE + TILE / 2 - 4, seed: x * 3 + y * 5 });
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

            this.rooms.push({ x: rx, y: ry, w, h, cx: rx + (w >> 1), cy: ry + (h >> 1) });

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
                    if (dx * dx + dy * dy <= tr * tr) {
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
                        const outerG = ctx.createRadialGradient(sx + TILE / 2, sy + TILE / 2 - 4, 0, sx + TILE / 2, sy + TILE / 2 - 4, outerR);
                        outerG.addColorStop(0, 'rgba(255,160,64,0.15)');
                        outerG.addColorStop(0.4, 'rgba(255,96,16,0.06)');
                        outerG.addColorStop(1, 'rgba(255,80,10,0)');
                        ctx.fillStyle = outerG;
                        ctx.fillRect(sx + TILE / 2 - outerR, sy + TILE / 2 - 4 - outerR, outerR * 2, outerR * 2);
                        drawSpr('torch' + torchFrame, sx, sy, TILE, TILE);
                        // Inner core glow (small, bright)
                        const innerR = 12 + fl;
                        const innerG = ctx.createRadialGradient(sx + TILE / 2, sy + TILE / 2 - 8, 0, sx + TILE / 2, sy + TILE / 2 - 8, innerR);
                        innerG.addColorStop(0, 'rgba(255,220,140,0.3)');
                        innerG.addColorStop(0.5, 'rgba(255,160,64,0.12)');
                        innerG.addColorStop(1, 'rgba(255,128,32,0)');
                        ctx.fillStyle = innerG;
                        ctx.fillRect(sx + TILE / 2 - innerR, sy + TILE / 2 - 8 - innerR, innerR * 2, innerR * 2);
                    }

                    // Pillar detection (isolated wall surrounded by floor on 3+ sides)
                    if (isExposed) {
                        const floorCount = (hasFloorBelow ? 1 : 0) + (this.walkable(x + 1, y) ? 1 : 0) + (this.walkable(x - 1, y) ? 1 : 0) + (this.walkable(x, y - 1) ? 1 : 0);
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
                            const glow = ctx.createRadialGradient(sx + TILE / 2, sy + TILE / 2, 0, sx + TILE / 2, sy + TILE / 2, glowRadius);
                            glow.addColorStop(0, highlightColor);
                            glow.addColorStop(0.5, 'rgba(255,200,80,0.15)');
                            glow.addColorStop(1, 'rgba(255,180,60,0)');
                            ctx.fillStyle = glow;
                            ctx.fillRect(sx - glowRadius / 2, sy - glowRadius / 2, glowRadius * 1.5, glowRadius * 1.5);
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
                    const sg = ctx.createRadialGradient(sx + TILE / 2, sy + TILE / 2, 0, sx + TILE / 2, sy + TILE / 2, TILE * 1.3);
                    sg.addColorStop(0, `rgba(200,170,80,${0.3 + glowPulse})`);
                    sg.addColorStop(0.3, `rgba(180,140,50,${0.15 + glowPulse})`);
                    sg.addColorStop(0.6, 'rgba(160,120,40,0.05)');
                    sg.addColorStop(1, 'rgba(140,100,30,0)');
                    ctx.fillStyle = sg;
                    ctx.fillRect(sx - TILE / 2, sy - TILE / 2, TILE * 2, TILE * 2);

                    // Gold sparkles
                    for (let i = 0; i < 4; i++) {
                        const sa = G.time * 2 + i * 1.57;
                        const spx = sx + TILE / 2 + Math.cos(sa) * 14;
                        const spy = sy + TILE / 2 + Math.sin(sa * 1.3) * 10 - 4;
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
                    ctx.arc(sx + TILE / 2, sy + TILE / 2, TILE * 0.6, 0, Math.PI * 2);
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

// ========== ITEM SYSTEM ==========
const ITEM_TYPES = {
    sword: { name: '剣', icon: '⚔', slot: 'weapon', baseDmg: [5, 12] },
    axe: { name: '戦斧', icon: '🪓', slot: 'weapon', baseDmg: [8, 16] },
    staff: { name: '杖', icon: '🔮', slot: 'weapon', baseDmg: [5, 12] },
    shield: { name: '盾', icon: '🛡', slot: 'offhand', baseDef: [3, 8] },
    helmet: { name: '兜', icon: '⛑', slot: 'head', baseDef: [2, 5] },
    armor: { name: '鎧', icon: '🦺', slot: 'body', baseDef: [4, 10] },
    ring: { name: '指輪', icon: '💍', slot: 'ring', baseDef: [0, 1] },
    amulet: { name: '護符', icon: '📿', slot: 'amulet', baseDef: [0, 1] },
    boots: { name: '靴', icon: '👢', slot: 'feet', baseDef: [1, 4] },
    rune: { name: 'ルーン', icon: '🔶', slot: null },
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
    smallCharm: { name: '小チャーム', icon: '🔹', slot: null, charmSize: 1 },
    mediumCharm: { name: '中チャーム', icon: '🔷', slot: null, charmSize: 2 },
    grandCharm: { name: '大チャーム', icon: '💠', slot: null, charmSize: 3 },
    // Legacy aliases (backward compat for old saves)
    potion: { name: 'HP回復薬', icon: '🧪', slot: null, potionType: 'hp', tier: 1, heal: 45, healDur: 7 },
    manaPotion: { name: 'MP回復薬', icon: '💧', slot: null, potionType: 'mp', tier: 1, healMP: 30, healDur: 5 }
};

const RARITY = {
    common: { name: 'コモン', color: '#cccccc', affixes: 0, mult: 1 },
    magic: { name: 'マジック', color: '#6688ff', affixes: [1, 2], mult: 1.3 },
    rare: { name: 'レア', color: '#ffdd44', affixes: [2, 3], mult: 1.6 },
    legendary: { name: 'レジェンダリー', color: '#ff8800', affixes: [3, 4], mult: 2.0 },
    unique: { name: 'ユニーク', color: '#00dd66', affixes: [4, 5], mult: 2.5 }
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
    { id: 0, name: 'El', icon: '᚛', color: '#cccccc', tier: 1, effect: { stat: 'def', value: 2 }, desc: '+2 防御' },
    { id: 1, name: 'Eld', icon: '᚜', color: '#cccccc', tier: 1, effect: { stat: 'dmgPct', value: 5 }, desc: '+5% ダメージ' },
    { id: 2, name: 'Tir', icon: '᚝', color: '#cccccc', tier: 1, effect: { stat: 'mp', value: 10 }, desc: '+10 MP' },
    { id: 3, name: 'Nef', icon: '᚞', color: '#cccccc', tier: 1, effect: { stat: 'def', value: 5 }, desc: '+5 防御' },
    { id: 4, name: 'Ith', icon: '᚟', color: '#6688ff', tier: 2, effect: { stat: 'dmgPct', value: 8 }, desc: '+8% ダメージ' },
    { id: 5, name: 'Ral', icon: 'ᚠ', color: '#ff6633', tier: 2, effect: { stat: 'fireRes', value: 10 }, desc: '+10% 火炎耐性' },
    { id: 6, name: 'Ort', icon: 'ᚡ', color: '#ffdd44', tier: 2, effect: { stat: 'lightRes', value: 10 }, desc: '+10% 雷耐性' },
    { id: 7, name: 'Thul', icon: 'ᚢ', color: '#66ccff', tier: 2, effect: { stat: 'coldRes', value: 10 }, desc: '+10% 冷気耐性' },
    { id: 8, name: 'Amn', icon: 'ᚣ', color: '#ff8800', tier: 2, effect: { stat: 'lifesteal', value: 3 }, desc: '+3% ライフスティール' },
    { id: 9, name: 'Sol', icon: 'ᚤ', color: '#ff8800', tier: 2, effect: { stat: 'hp', value: 20 }, desc: '+20 HP' },
    { id: 10, name: 'Um', icon: 'ᚥ', color: '#ff8800', tier: 3, effect: { stat: 'allRes', value: 8 }, desc: '+8% 全耐性' },
    { id: 11, name: 'Mal', icon: 'ᚦ', color: '#ff4444', tier: 3, effect: { stat: 'critChance', value: 3 }, desc: '+3% クリティカル率' },
    { id: 12, name: 'Ist', icon: 'ᚧ', color: '#ff4444', tier: 3, effect: { stat: 'magicFind', value: 15 }, desc: '+15% マジックファインド' },
    { id: 13, name: 'Lo', icon: 'ᚨ', color: '#ff4444', tier: 3, effect: { stat: 'critDmg', value: 10 }, desc: '+10% クリティカルダメージ' },
    { id: 14, name: 'Zod', icon: 'ᚩ', color: '#00dd66', tier: 3, effect: { stat: 'skillBonus', value: 1 }, desc: '+1 全スキルレベル' }
];

const MAX_SOCKETS = { sword: 4, axe: 4, staff: 4, shield: 3, helmet: 3, armor: 4 };

const RUNEWORD_DEFS = [
    {
        name: 'Spirit', nameJP: '精霊',
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
        name: 'Insight', nameJP: '洞察',
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
        name: 'Stealth', nameJP: '隠密',
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
        name: 'Lore', nameJP: '知識',
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
        name: 'Rhyme', nameJP: '韻律',
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
        name: 'Enigma', nameJP: '謎',
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
        name: 'Fury', nameJP: '憤怒',
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
        name: 'Silence', nameJP: '静寂',
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
        name: 'Ancients Pledge', nameJP: '古の誓い',
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
        name: 'Venom', nameJP: '猛毒',
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
            const prefix = rarityKey !== 'common' ? prefixes[rand(0, prefixes.length - 1)] + ' ' : '';
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
const HP_POTION_TYPES = ['hp1', 'hp2', 'hp3', 'hp4', 'hp5'];
const MP_POTION_TYPES = ['mp1', 'mp2', 'mp3'];
const REJUV_TYPES = ['rejuv', 'fullrejuv'];
const ALL_POTION_TYPES = [...HP_POTION_TYPES, ...MP_POTION_TYPES, ...REJUV_TYPES, 'potion', 'manaPotion'];
// Which potion tier drops/sells per act
const HP_POTION_TIER_BY_ACT = { 1: 'hp1', 2: 'hp2', 3: 'hp3', 4: 'hp4', 5: 'hp5' };
const MP_POTION_TIER_BY_ACT = { 1: 'mp1', 2: 'mp2', 3: 'mp3', 4: 'mp3', 5: 'mp3' };

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
    return {
        typeKey: typeKey, typeInfo: ti, rarityKey: 'common', rarity: RARITY.common,
        icon: ti.icon, name: ti.name, affixes: [], baseDmg: null, baseDef: null, qty: 1
    };
}

// Charm affix pool (subset of AFFIXES with charm-appropriate ranges)
const CHARM_AFFIXES = [
    { stat: 'str', fmt: '+{v} 筋力', ranges: { 1: [1, 3], 2: [2, 5], 3: [3, 8] } },
    { stat: 'dex', fmt: '+{v} 敏捷', ranges: { 1: [1, 3], 2: [2, 5], 3: [3, 8] } },
    { stat: 'vit', fmt: '+{v} 体力', ranges: { 1: [1, 3], 2: [2, 5], 3: [3, 8] } },
    { stat: 'int', fmt: '+{v} 知力', ranges: { 1: [1, 3], 2: [2, 5], 3: [3, 8] } },
    { stat: 'hp', fmt: '+{v} HP', ranges: { 1: [5, 15], 2: [10, 30], 3: [20, 50] } },
    { stat: 'mp', fmt: '+{v} MP', ranges: { 1: [5, 10], 2: [8, 20], 3: [15, 40] } },
    { stat: 'def', fmt: '+{v} 防御', ranges: { 1: [1, 4], 2: [3, 8], 3: [5, 12] } },
    { stat: 'dmgPct', fmt: '+{v}% ダメージ', ranges: { 1: [2, 5], 2: [4, 10], 3: [6, 15] } },
    { stat: 'critChance', fmt: '+{v}% クリティカル率', ranges: { 1: [1, 2], 2: [2, 4], 3: [3, 6] } },
    { stat: 'fireRes', fmt: '+{v}% 火炎耐性', ranges: { 1: [3, 8], 2: [5, 12], 3: [8, 18] } },
    { stat: 'coldRes', fmt: '+{v}% 冷気耐性', ranges: { 1: [3, 8], 2: [5, 12], 3: [8, 18] } },
    { stat: 'lightRes', fmt: '+{v}% 雷耐性', ranges: { 1: [3, 8], 2: [5, 12], 3: [8, 18] } },
    { stat: 'poisonRes', fmt: '+{v}% 毒耐性', ranges: { 1: [3, 8], 2: [5, 12], 3: [8, 18] } },
    { stat: 'allRes', fmt: '+{v}% 全耐性', ranges: { 1: [1, 3], 2: [2, 5], 3: [3, 8] } },
    { stat: 'magicFind', fmt: '+{v}% MF', ranges: { 1: [3, 7], 2: [5, 12], 3: [8, 20] } },
    { stat: 'moveSpd', fmt: '+{v}% 移動速度', ranges: { 1: [2, 4], 2: [3, 6], 3: [5, 10] } },
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

// ========== CLASS DEFINITIONS ==========
const CLASS_DEFS = {
    warrior: {
        name: 'バーバリアン',
        icon: '⚔',
        engName: 'Barbarian',
        tier: 0,
        sprite: 'knight',
        baseStr: 20,
        baseDex: 10,
        baseVit: 20,
        baseInt: 5,
        branches: ['コンバットスキル', 'ウォークライ', 'マスタリー'],
        promotions: ['paladin', 'berserker'],
        skills: [
            // Branch 0: コンバットスキル
            { id: 'w_bash', name: 'バッシュ', icon: '💥', mp: 8, cd: 0.8, branch: 0, desc: '強力な一撃を叩き込む', prereq: null, effect: 'melee_burst', baseMult: [1.8, 2.1, 2.5, 3.0, 3.6], range: 60, reqLevel: 1, skillType: 'active', synergies: [{ from: 'w_doubleswing', bonus: 0.08, type: 'damage' }] },
            { id: 'w_doubleswing', name: 'ダブルスイング', icon: '⚔', mp: 14, cd: 1.5, branch: 0, desc: '二刀で同時に斬りつける', prereq: 'w_bash', effect: 'whirlwind', baseMult: [1.4, 1.8, 2.2, 2.8, 3.4], range: 80, reqLevel: 1, skillType: 'active', synergies: [{ from: 'w_bash', bonus: 0.08, type: 'damage' }] },
            { id: 'w_stun', name: 'スタン', icon: '🔨', mp: 12, cd: 2.0, branch: 0, desc: '周囲の敵を気絶させる', prereq: 'w_bash', effect: 'stun_aoe', duration: [1.2, 1.6, 2.0, 2.5, 3.0], range: 70, reqLevel: 6, skillType: 'active', synergies: [{ from: 'w_bash', bonus: 0.08, type: 'duration' }] },
            { id: 'w_swordmastery_p', name: '剣の極意', icon: '🗡', mp: 0, cd: 0, branch: 0, desc: 'クリティカル率を常時上昇', prereq: 'w_bash', reqLevel: 1, skillType: 'passive', passiveEffect: { stat: 'critChance', baseBonus: 2, perLevel: 1.5 }, synergies: [{ from: 'w_concentrate', bonus: 0.04, type: 'damage' }, { from: 'w_whirlwind', bonus: 0.03, type: 'damage' }] },
            { id: 'w_concentrate', name: 'コンセントレイト', icon: '🎯', mp: 18, cd: 2.0, branch: 0, desc: '集中して強烈な一撃を放つ', prereq: 'w_doubleswing', effect: 'melee_burst', baseMult: [2.2, 2.8, 3.5, 4.2, 5.0], range: 55, reqLevel: 12, skillType: 'active', synergies: [{ from: 'w_bash', bonus: 0.06, type: 'damage' }, { from: 'w_doubleswing', bonus: 0.06, type: 'damage' }] },
            { id: 'w_whirlwind', name: 'ワールウィンド', icon: '🌀', mp: 30, cd: 3.0, branch: 0, desc: '回転しながら周囲を斬る', prereq: 'w_concentrate', effect: 'whirlwind', baseMult: [1.6, 2.0, 2.6, 3.2, 4.0], range: 120, reqLevel: 18, skillType: 'active', synergies: [{ from: 'w_doubleswing', bonus: 0.08, type: 'damage' }, { from: 'w_concentrate', bonus: 0.08, type: 'damage' }] },
            { id: 'w_cleave', name: 'クリーブ', icon: '🪓', mp: 35, cd: 4.0, branch: 0, desc: '広範囲を薙ぎ払う', prereq: 'w_whirlwind', effect: 'whirlwind', baseMult: [2.0, 2.6, 3.2, 4.0, 5.0], range: 140, reqLevel: 24, skillType: 'active', synergies: [{ from: 'w_whirlwind', bonus: 0.10, type: 'damage' }] },
            { id: 'w_warfrenzy', name: 'ウォーフレンジー', icon: '😤', mp: 42, cd: 8.0, branch: 0, desc: '狂乱状態で攻撃力と速度上昇', prereq: 'w_cleave', effect: 'buff_frenzy', duration: [6, 8, 10, 12, 15], atkBonus: [0.4, 0.5, 0.6, 0.8, 1.0], spdBonus: [0.2, 0.3, 0.4, 0.5, 0.6], reqLevel: 30, skillType: 'active', synergies: [{ from: 'w_doubleswing', bonus: 0.06, type: 'duration' }, { from: 'w_concentrate', bonus: 0.06, type: 'duration' }] },
            { id: 'w_furyslash', name: 'フューリースラッシュ', icon: '💀', mp: 55, cd: 10.0, branch: 0, desc: '致命的な処刑の一撃', prereq: 'w_warfrenzy', effect: 'execute', baseMult: [4.0, 5.0, 6.5, 8.0, 10.0], threshold: [0.35, 0.45, 0.50, 0.55, 0.60], range: 70, reqLevel: 30, skillType: 'active', synergies: [{ from: 'w_concentrate', bonus: 0.10, type: 'damage' }, { from: 'w_whirlwind', bonus: 0.10, type: 'damage' }] },
            // Branch 1: ウォークライ
            { id: 'w_howl', name: 'ハウル', icon: '📯', mp: 10, cd: 4.0, branch: 1, desc: '雄叫びで敵を怯ませる', prereq: null, effect: 'stun_aoe', duration: [1.2, 1.6, 2.0, 2.5, 3.0], range: 120, reqLevel: 1, skillType: 'active', synergies: [{ from: 'w_taunt', bonus: 0.06, type: 'duration' }, { from: 'w_grimward', bonus: 0.08, type: 'duration' }] },
            { id: 'w_taunt', name: 'タウント', icon: '😡', mp: 12, cd: 5.0, branch: 1, desc: '敵を挑発し防御力を低下', prereq: 'w_howl', effect: 'debuff_defense', duration: [3, 4, 5, 6, 8], reduction: [0.2, 0.3, 0.4, 0.5, 0.6], range: 130, reqLevel: 6, skillType: 'active', synergies: [{ from: 'w_howl', bonus: 0.06, type: 'duration' }] },
            { id: 'w_ironskin_p', name: '鉄の肌', icon: '🔰', mp: 0, cd: 0, branch: 1, desc: '防御力を常時上昇', prereq: 'w_howl', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'defensePercent', baseBonus: 2, perLevel: 2 }, synergies: [{ from: 'w_shout', bonus: 0.03, type: 'damage' }, { from: 'w_ironskin', bonus: 0.04, type: 'damage' }] },
            { id: 'w_shout', name: 'シャウト', icon: '🛡', mp: 18, cd: 6.0, branch: 1, desc: '味方の防御力を上昇させる', prereq: 'w_howl', effect: 'buff_defense', duration: [5, 7, 9, 11, 14], reduction: [0.3, 0.4, 0.5, 0.6, 0.7], reqLevel: 6, skillType: 'active', synergies: [{ from: 'w_ironskin_p', bonus: 0.03, type: 'duration' }] },
            { id: 'w_finditem', name: 'ファインドアイテム', icon: '💎', mp: 15, cd: 8.0, branch: 1, desc: 'クリティカル率を一時上昇', prereq: 'w_taunt', effect: 'buff_crit', duration: [5, 7, 9, 12, 15], bonus: [10, 15, 20, 30, 40], reqLevel: 12, skillType: 'active', synergies: [{ from: 'w_taunt', bonus: 0.06, type: 'duration' }] },
            { id: 'w_battleorders', name: 'バトルオーダー', icon: '⚜', mp: 35, cd: 12.0, branch: 1, desc: '戦闘命令で全能力を強化', prereq: 'w_shout', effect: 'battle_orders', duration: [8, 12, 15, 18, 22], bonus: [0.12, 0.18, 0.24, 0.30, 0.36], reqLevel: 18, skillType: 'active', synergies: [{ from: 'w_shout', bonus: 0.05, type: 'duration' }] },
            { id: 'w_naturalres_p', name: '自然耐性', icon: '💪', mp: 0, cd: 0, branch: 1, desc: '最大HPを常時上昇', prereq: 'w_shout', reqLevel: 12, skillType: 'passive', passiveEffect: { stat: 'maxHP', baseBonus: 5, perLevel: 5 }, synergies: [{ from: 'w_shout', bonus: 0.04, type: 'damage' }, { from: 'w_battleorders', bonus: 0.04, type: 'damage' }] },
            { id: 'w_grimward', name: 'グリムウォード', icon: '☠', mp: 40, cd: 10.0, branch: 1, desc: '恐怖の叫びで敵を長時間気絶', prereq: 'w_battleorders', effect: 'stun_aoe', duration: [2.0, 2.5, 3.0, 3.5, 4.5], range: 160, reqLevel: 24, skillType: 'active', synergies: [{ from: 'w_howl', bonus: 0.08, type: 'duration' }, { from: 'w_taunt', bonus: 0.06, type: 'duration' }] },
            { id: 'w_warcrylv2', name: 'ウォークライII', icon: '📣', mp: 48, cd: 12.0, branch: 1, desc: '強化された戦いの雄叫び', prereq: 'w_grimward', effect: 'stun_aoe', duration: [2.5, 3.0, 3.5, 4.0, 5.0], range: 180, reqLevel: 30, skillType: 'active', synergies: [{ from: 'w_grimward', bonus: 0.10, type: 'duration' }, { from: 'w_howl', bonus: 0.06, type: 'duration' }] },
            { id: 'w_naturalorder', name: 'ナチュラルオーダー', icon: '⚜', mp: 55, cd: 18.0, branch: 1, desc: '究極の戦闘命令で大幅強化', prereq: 'w_warcrylv2', effect: 'battle_orders', duration: [12, 16, 20, 25, 30], bonus: [0.18, 0.25, 0.32, 0.40, 0.50], reqLevel: 30, skillType: 'active', synergies: [{ from: 'w_battleorders', bonus: 0.08, type: 'duration' }] },
            // Branch 2: マスタリー
            { id: 'w_leap', name: 'リープアタック', icon: '🦘', mp: 12, cd: 3.0, branch: 2, desc: '敵に跳躍して突撃する', prereq: null, effect: 'charge', baseMult: [1.8, 2.2, 2.8, 3.5, 4.2], range: 200, reqLevel: 1, skillType: 'active', synergies: [{ from: 'w_stomp', bonus: 0.08, type: 'damage' }, { from: 'w_ironfist', bonus: 0.10, type: 'damage' }] },
            { id: 'w_stomp', name: 'ストンプ', icon: '👢', mp: 15, cd: 4.0, branch: 2, desc: '地面を踏み鳴らし敵を減速', prereq: 'w_leap', effect: 'ground_slam', baseMult: [1.5, 2.0, 2.5, 3.0, 3.8], range: 100, slow: [0.5, 0.45, 0.4, 0.35, 0.3], reqLevel: 6, skillType: 'active', synergies: [{ from: 'w_leap', bonus: 0.08, type: 'damage' }] },
            { id: 'w_ironskin', name: 'アイアンスキン', icon: '🔰', mp: 22, cd: 10.0, branch: 2, desc: '鉄の防御で被ダメージ軽減', prereq: 'w_leap', effect: 'buff_defense', duration: [6, 8, 10, 12, 15], reduction: [0.4, 0.5, 0.55, 0.6, 0.7], reqLevel: 6, skillType: 'active', synergies: [{ from: 'w_ironskin_p', bonus: 0.03, type: 'duration' }, { from: 'w_naturalres', bonus: 0.06, type: 'duration' }] },
            { id: 'w_naturalres', name: 'ナチュラルレジスタンス', icon: '💪', mp: 25, cd: 12.0, branch: 2, desc: '自然の力で防御力を強化', prereq: 'w_ironskin', effect: 'buff_defense', duration: [8, 10, 12, 14, 18], reduction: [0.45, 0.55, 0.6, 0.65, 0.75], reqLevel: 12, skillType: 'active', synergies: [{ from: 'w_ironskin', bonus: 0.08, type: 'duration' }, { from: 'w_naturalres_p', bonus: 0.04, type: 'duration' }] },
            { id: 'w_berserk', name: 'バーサーク', icon: '👹', mp: 35, cd: 10.0, branch: 2, desc: '狂戦士化し攻撃力大幅上昇', prereq: 'w_naturalres', effect: 'buff_berserk', duration: [6, 8, 10, 12, 16], reqLevel: 18, skillType: 'active', synergies: [{ from: 'w_warfrenzy', bonus: 0.08, type: 'duration' }] },
            { id: 'w_increasedspeed', name: 'インクリースドスピード', icon: '💨', mp: 28, cd: 10.0, branch: 2, desc: '移動速度を大幅に上昇', prereq: 'w_stomp', effect: 'buff_speed', duration: [6, 8, 10, 12, 15], bonus: [0.3, 0.4, 0.5, 0.6, 0.8], reqLevel: 12, skillType: 'active', synergies: [{ from: 'w_stomp', bonus: 0.06, type: 'duration' }] },
            { id: 'w_swordmastery', name: 'ソードマスタリー', icon: '⚔', mp: 35, cd: 12.0, branch: 2, desc: '攻撃速度を大幅に上昇', prereq: 'w_increasedspeed', effect: 'buff_atkspd', duration: [6, 8, 10, 12, 16], bonus: [0.4, 0.5, 0.6, 0.8, 1.0], reqLevel: 24, skillType: 'active', synergies: [{ from: 'w_increasedspeed', bonus: 0.08, type: 'duration' }, { from: 'w_swordmastery_p', bonus: 0.03, type: 'duration' }] },
            { id: 'w_ironfist', name: 'アイアンフィスト', icon: '🤜', mp: 55, cd: 12.0, branch: 2, desc: '究極の拳で粉砕する', prereq: 'w_swordmastery', effect: 'melee_burst', baseMult: [5.0, 6.5, 8.0, 10.0, 13.0], range: 65, reqLevel: 30, skillType: 'active', synergies: [{ from: 'w_stomp', bonus: 0.10, type: 'damage' }, { from: 'w_swordmastery_p', bonus: 0.05, type: 'damage' }] }
        ]
    },
    rogue: {
        name: 'アマゾン',
        icon: '🏹',
        engName: 'Rogue',
        tier: 0,
        sprite: 'rogueChar',
        baseStr: 10,
        baseDex: 20,
        baseVit: 15,
        baseInt: 10,
        branches: ['弓スキル', 'ジャベリン', 'パッシブ'],
        promotions: ['assassin', 'ranger'],
        skills: [
            // Branch 0: 弓スキル
            { id: 'r_firearrow', name: 'ファイアアロー', icon: '🔥', mp: 8, cd: 0.8, branch: 0, desc: '炎を纏った矢を放つ', prereq: null, effect: 'projectile_fire', iconEff: 'arrow_fire', baseMult: [1.6, 1.9, 2.2, 2.6, 3.2], speed: 400, reqLevel: 1, skillType: 'active', synergies: [{ from: 'r_coldarrow', bonus: 0.06, type: 'damage' }] },
            { id: 'r_coldarrow', name: 'コールドアロー', icon: '❄', mp: 10, cd: 1.2, branch: 0, desc: '冷気を纏った矢を放つ', prereq: 'r_firearrow', effect: 'projectile_fire', iconEff: 'arrow_cold', baseMult: [1.4, 1.7, 2.0, 2.4, 3.0], speed: 380, reqLevel: 1, skillType: 'active', synergies: [{ from: 'r_firearrow', bonus: 0.06, type: 'damage' }] },
            { id: 'r_multishot', name: 'マルチプルショット', icon: '🌟', mp: 22, cd: 2.5, branch: 0, desc: '複数の矢を同時に放つ', prereq: 'r_coldarrow', effect: 'multi_shot', arrows: [3, 4, 5, 6, 8], baseMult: [1.0, 1.3, 1.6, 2.0, 2.5], reqLevel: 12, skillType: 'active', synergies: [{ from: 'r_firearrow', bonus: 0.05, type: 'damage' }, { from: 'r_guidedarrow', bonus: 0.05, type: 'damage' }] },
            { id: 'r_guidedarrow', name: 'ガイデッドアロー', icon: '🎯', mp: 18, cd: 1.5, branch: 0, desc: '敵を追尾する矢を放つ', prereq: 'r_firearrow', effect: 'projectile_fire', iconEff: 'arrow_magic', baseMult: [2.2, 2.8, 3.5, 4.2, 5.0], speed: 500, reqLevel: 6, skillType: 'active', synergies: [{ from: 'r_firearrow', bonus: 0.08, type: 'damage' }] },
            { id: 'r_strafe', name: 'ストレイフ', icon: '🏹', mp: 35, cd: 5.0, branch: 0, desc: '矢の連射で敵を制圧する', prereq: 'r_multishot', effect: 'arrow_rain', baseMult: [2.0, 2.6, 3.2, 4.0, 5.0], range: 100, reqLevel: 18, skillType: 'active', synergies: [{ from: 'r_multishot', bonus: 0.08, type: 'damage' }] },
            { id: 'r_immolation', name: 'イモレーションアロー', icon: '🔥', mp: 40, cd: 6.0, branch: 0, desc: '炎の雨を降らせる', prereq: 'r_strafe', effect: 'arrow_rain', baseMult: [2.5, 3.2, 4.0, 5.0, 6.5], range: 110, reqLevel: 24, skillType: 'active', synergies: [{ from: 'r_firearrow', bonus: 0.10, type: 'damage' }] },
            { id: 'r_freezingarrow', name: 'フリージングアロー', icon: '🧊', mp: 45, cd: 7.0, branch: 0, desc: '周囲を凍結させる矢を放つ', prereq: 'r_immolation', effect: 'frost_nova', baseMult: [2.0, 2.8, 3.5, 4.5, 6.0], freeze: [2, 3, 4, 5, 6], reqLevel: 30, skillType: 'active', synergies: [{ from: 'r_coldarrow', bonus: 0.08, type: 'freeze' }] },
            { id: 'r_magicarrow', name: 'マジックアロー', icon: '✨', mp: 55, cd: 8.0, branch: 0, desc: '魔力を凝縮した究極の矢', prereq: 'r_freezingarrow', effect: 'projectile_fire', iconEff: 'arrow_magic', baseMult: [4.0, 5.0, 6.5, 8.0, 10.0], speed: 550, reqLevel: 30, skillType: 'active', synergies: [{ from: 'r_guidedarrow', bonus: 0.10, type: 'damage' }, { from: 'r_multishot', bonus: 0.08, type: 'damage' }] },
            // Branch 1: ジャベリン
            { id: 'r_jab', name: 'ジャブ', icon: '🔱', mp: 8, cd: 1.0, branch: 1, desc: '素早い連続突き', prereq: null, effect: 'melee_burst', baseMult: [1.8, 2.1, 2.5, 3.0, 3.6], range: 55, reqLevel: 1, skillType: 'active', synergies: [{ from: 'r_powerstrike', bonus: 0.08, type: 'damage' }, { from: 'r_chargedstrike', bonus: 0.06, type: 'damage' }] },
            { id: 'r_poisonjav', name: 'ポイズンジャベリン', icon: '☠', mp: 14, cd: 3.0, branch: 1, desc: '毒を塗った投槍を投げる', prereq: 'r_jab', effect: 'buff_poison', duration: [4, 5, 6, 8, 10], dps: [5, 8, 12, 18, 25], reqLevel: 6, skillType: 'active', synergies: [{ from: 'r_jab', bonus: 0.06, type: 'damage' }] },
            { id: 'r_powerstrike', name: 'パワーストライク', icon: '⚡', mp: 18, cd: 2.5, branch: 1, desc: '雷を帯びた強打', prereq: 'r_jab', effect: 'melee_burst', baseMult: [2.5, 3.0, 3.8, 4.5, 5.5], range: 60, reqLevel: 6, skillType: 'active', synergies: [{ from: 'r_jab', bonus: 0.08, type: 'damage' }] },
            { id: 'r_chargedstrike', name: 'チャージドストライク', icon: '🌩', mp: 25, cd: 3.0, branch: 1, desc: '帯電した連鎖攻撃', prereq: 'r_powerstrike', effect: 'chain_lightning', bounces: [2, 3, 4, 5, 6], baseMult: [1.8, 2.2, 2.8, 3.5, 4.5], reqLevel: 12, skillType: 'active', synergies: [{ from: 'r_powerstrike', bonus: 0.08, type: 'damage' }] },
            { id: 'r_plaguejav', name: 'プレイグジャベリン', icon: '💚', mp: 30, cd: 5.0, branch: 1, desc: '疫病の毒雲を発生させる', prereq: 'r_poisonjav', effect: 'consecrate', baseMult: [0.6, 0.8, 1.0, 1.3, 1.6], range: 90, duration: [4, 5, 6, 8, 10], reqLevel: 12, skillType: 'active', synergies: [{ from: 'r_poisonjav', bonus: 0.10, type: 'damage' }] },
            { id: 'r_fend', name: 'フェンド', icon: '🔱', mp: 35, cd: 4.0, branch: 1, desc: '槍で周囲を薙ぎ払う', prereq: 'r_chargedstrike', effect: 'whirlwind', baseMult: [1.6, 2.0, 2.5, 3.2, 4.0], range: 85, reqLevel: 18, skillType: 'active', synergies: [{ from: 'r_jab', bonus: 0.06, type: 'damage' }] },
            { id: 'r_ltfury', name: 'ライトニングフューリー', icon: '🌩', mp: 45, cd: 6.0, branch: 1, desc: '稲妻の怒りを解き放つ', prereq: 'r_fend', effect: 'chain_lightning', bounces: [3, 4, 5, 6, 8], baseMult: [2.0, 2.8, 3.5, 4.5, 6.0], reqLevel: 24, skillType: 'active', synergies: [{ from: 'r_chargedstrike', bonus: 0.10, type: 'damage' }] },
            { id: 'r_lightningstrike', name: 'ライトニングストライク', icon: '⚡', mp: 55, cd: 8.0, branch: 1, desc: '雷の力で粉砕する一撃', prereq: 'r_ltfury', effect: 'melee_burst', baseMult: [4.0, 5.5, 7.0, 9.0, 12.0], range: 65, reqLevel: 30, skillType: 'active', synergies: [{ from: 'r_ltfury', bonus: 0.12, type: 'damage' }] },
            // Branch 2: パッシブ
            { id: 'r_critstrike_p', name: '会心の一撃', icon: '💎', mp: 0, cd: 0, branch: 2, desc: 'クリティカル率を常時上昇', prereq: null, reqLevel: 1, skillType: 'passive', passiveEffect: { stat: 'critChance', baseBonus: 2, perLevel: 2 } },
            { id: 'r_innersight', name: 'インナーサイト', icon: '👁', mp: 12, cd: 6.0, branch: 2, desc: '敵の防御力を暴く', prereq: null, effect: 'debuff_defense', duration: [4, 5, 6, 8, 10], reduction: [0.2, 0.3, 0.4, 0.5, 0.6], range: 150, reqLevel: 1, skillType: 'active', synergies: [{ from: 'r_slowmissiles', bonus: 0.06, type: 'duration' }, { from: 'r_penetrate', bonus: 0.06, type: 'duration' }] },
            { id: 'r_dodge_p', name: '回避術', icon: '💨', mp: 0, cd: 0, branch: 2, desc: '回避率を常時上昇', prereq: 'r_critstrike_p', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'dodgeChance', baseBonus: 1.5, perLevel: 1.5 } },
            { id: 'r_slowmissiles', name: 'スローミサイル', icon: '🕸', mp: 15, cd: 6.0, branch: 2, desc: '周囲の敵を減速させる', prereq: 'r_innersight', effect: 'stun_aoe', duration: [1.5, 2.0, 2.5, 3.0, 4.0], range: 130, reqLevel: 6, skillType: 'active', synergies: [{ from: 'r_innersight', bonus: 0.08, type: 'duration' }] },
            { id: 'r_dodge', name: 'ドッジ', icon: '💨', mp: 18, cd: 10.0, branch: 2, desc: '回避行動で攻撃をかわす', prereq: 'r_innersight', effect: 'buff_dodge', duration: [5, 7, 9, 12, 15], chance: [30, 40, 50, 60, 75], reqLevel: 6, skillType: 'active', synergies: [{ from: 'r_dodge_p', bonus: 0.03, type: 'duration' }, { from: 'r_avoid', bonus: 0.06, type: 'duration' }] },
            { id: 'r_penetrate_p', name: '貫通', icon: '🎯', mp: 0, cd: 0, branch: 2, desc: 'ダメージを常時上昇', prereq: 'r_dodge_p', reqLevel: 12, skillType: 'passive', passiveEffect: { stat: 'damagePercent', baseBonus: 3, perLevel: 3 } },
            { id: 'r_avoid', name: 'アヴォイド', icon: '🌀', mp: 22, cd: 10.0, branch: 2, desc: '高度な回避術を発動', prereq: 'r_dodge', effect: 'buff_dodge', duration: [6, 8, 10, 13, 16], chance: [35, 45, 55, 65, 80], reqLevel: 12, skillType: 'active', synergies: [{ from: 'r_dodge', bonus: 0.08, type: 'duration' }, { from: 'r_dodge_p', bonus: 0.03, type: 'duration' }] },
            { id: 'r_critstrike', name: 'クリティカルストライク', icon: '💎', mp: 20, cd: 10.0, branch: 2, desc: 'クリティカル率を一時強化', prereq: 'r_slowmissiles', effect: 'buff_crit', duration: [5, 7, 9, 12, 15], bonus: [15, 22, 30, 40, 55], reqLevel: 12, skillType: 'active' },
            { id: 'r_evade', name: 'イヴェイド', icon: '🌊', mp: 28, cd: 12.0, branch: 2, desc: '素早い身のこなしで回避', prereq: 'r_avoid', effect: 'buff_speed', duration: [5, 7, 9, 12, 15], bonus: [0.3, 0.4, 0.5, 0.6, 0.8], reqLevel: 18, skillType: 'active', synergies: [{ from: 'r_avoid', bonus: 0.08, type: 'duration' }, { from: 'r_dodge', bonus: 0.06, type: 'duration' }] },
            { id: 'r_penetrate', name: 'ペネトレイト', icon: '🎯', mp: 30, cd: 12.0, branch: 2, desc: '敵の装甲を貫通する', prereq: 'r_critstrike', effect: 'buff_crit', duration: [6, 8, 10, 14, 18], bonus: [20, 30, 40, 55, 70], reqLevel: 24, skillType: 'active' },
            { id: 'r_valkyrie', name: 'ヴァルキリー', icon: '🛡', mp: 55, cd: 20.0, branch: 2, desc: '戦乙女を召喚する', prereq: 'r_penetrate', effect: 'summon_minion', duration: [10, 14, 18, 22, 28], minionHP: [150, 250, 350, 500, 700], minionDmg: [12, 20, 30, 42, 60], reqLevel: 30, skillType: 'active', synergies: [{ from: 'r_penetrate_p', bonus: 0.04, type: 'damage' }, { from: 'r_dodge_p', bonus: 0.04, type: 'duration' }] }
        ]
    },
    sorcerer: {
        name: 'ソーサレス',
        icon: '✨',
        engName: 'Sorcerer',
        tier: 0,
        sprite: 'wizardM',
        baseStr: 5,
        baseDex: 13,
        baseVit: 12,
        baseInt: 25,
        branches: ['ファイアスペル', 'ライトニング', 'コールドスペル'],
        promotions: ['pyromancer', 'cryomancer'],
        skills: [
            // Branch 0: ファイアスペル
            { id: 's_firebolt', name: 'ファイアボルト', icon: '🔥', mp: 6, cd: 0.5, branch: 0, desc: '火炎の弾を撃ち出す', prereq: null, effect: 'projectile_fire', iconEff: 'bolt_fire', baseMult: [1.4, 1.7, 2.0, 2.4, 3.0], speed: 350, reqLevel: 1, skillType: 'active', synergies: [{ from: 's_fireball', bonus: 0.06, type: 'damage' }, { from: 's_firemastery_p', bonus: 0.04, type: 'damage' }] },
            { id: 's_warmth_p', name: '暖気', icon: '🌡', mp: 0, cd: 0, branch: 0, desc: 'マナ自然回復を常時上昇', prereq: 's_firebolt', reqLevel: 1, skillType: 'passive', passiveEffect: { stat: 'manaRegen', baseBonus: 1, perLevel: 1 } },
            { id: 's_fireball', name: 'ファイアボール', icon: '☀', mp: 18, cd: 1.5, branch: 0, desc: '爆発する火球を放つ', prereq: 's_firebolt', effect: 'projectile_fire', iconEff: 'bolt_fire', baseMult: [2.2, 2.8, 3.5, 4.2, 5.5], speed: 320, reqLevel: 6, skillType: 'active', synergies: [{ from: 's_firebolt', bonus: 0.14, type: 'damage' }, { from: 's_firemastery_p', bonus: 0.04, type: 'damage' }] },
            { id: 's_warmth', name: 'ウォームス', icon: '🌡', mp: 12, cd: 10.0, branch: 0, desc: 'マナ回復のオーラを展開', prereq: 's_firebolt', effect: 'buff_aura', duration: [8, 10, 12, 15, 20], regen: [3, 5, 8, 12, 16], reduction: [0.1, 0.15, 0.2, 0.25, 0.3], reqLevel: 6, skillType: 'active', synergies: [{ from: 's_warmth_p', bonus: 0.07, type: 'duration' }] },
            { id: 's_firewall', name: 'ファイアウォール', icon: '🧱', mp: 25, cd: 5.0, branch: 0, desc: '炎の壁を展開する', prereq: 's_fireball', effect: 'consecrate', baseMult: [0.6, 0.8, 1.0, 1.3, 1.6], range: 80, duration: [3, 4, 5, 6, 8], reqLevel: 12, skillType: 'active', synergies: [{ from: 's_firebolt', bonus: 0.08, type: 'damage' }, { from: 's_firemastery_p', bonus: 0.04, type: 'damage' }] },
            { id: 's_firemastery_p', name: '火炎の極意', icon: '🔥', mp: 0, cd: 0, branch: 0, desc: '火炎ダメージを常時上昇', prereq: 's_fireball', reqLevel: 12, skillType: 'passive', passiveEffect: { stat: 'damagePercent', baseBonus: 3, perLevel: 3 } },
            { id: 's_enchant', name: 'エンチャント', icon: '✨', mp: 28, cd: 12.0, branch: 0, desc: '武器に炎を付与し攻撃力上昇', prereq: 's_warmth', effect: 'buff_berserk', duration: [6, 8, 10, 12, 16], reqLevel: 12, skillType: 'active', synergies: [{ from: 's_warmth_p', bonus: 0.07, type: 'duration' }] },
            { id: 's_inferno', name: 'インフェルノ', icon: '🔥', mp: 32, cd: 4.0, branch: 0, desc: '近距離に火炎を放射する', prereq: 's_firewall', effect: 'whirlwind', baseMult: [1.8, 2.3, 2.8, 3.5, 4.5], range: 100, reqLevel: 18, skillType: 'active', synergies: [{ from: 's_firebolt', bonus: 0.10, type: 'damage' }, { from: 's_fireball', bonus: 0.10, type: 'damage' }, { from: 's_firemastery_p', bonus: 0.04, type: 'damage' }] },
            { id: 's_meteor', name: 'メテオ', icon: '☄', mp: 45, cd: 8.0, branch: 0, desc: '空から巨大な隕石を落とす', prereq: 's_inferno', effect: 'meteor', baseMult: [3.0, 4.0, 5.0, 6.5, 8.5], range: 110, reqLevel: 24, skillType: 'active', synergies: [{ from: 's_firebolt', bonus: 0.14, type: 'damage' }, { from: 's_fireball', bonus: 0.14, type: 'damage' }, { from: 's_firemastery_p', bonus: 0.05, type: 'damage' }] },
            { id: 's_hydra', name: 'ヒドラ', icon: '🐍', mp: 50, cd: 8.0, branch: 0, desc: 'ヒドラを召喚し火炎を放射', prereq: 's_enchant', effect: 'consecrate', baseMult: [0.8, 1.0, 1.3, 1.6, 2.0], range: 100, duration: [5, 7, 9, 12, 15], reqLevel: 24, skillType: 'active', synergies: [{ from: 's_firemastery_p', bonus: 0.04, type: 'damage' }] },
            { id: 's_firemastery', name: 'ファイアマスタリー', icon: '🔥', mp: 55, cd: 15.0, branch: 0, desc: '火炎の力を極限まで高める', prereq: 's_meteor', effect: 'buff_atkspd', duration: [8, 10, 12, 15, 20], bonus: [0.4, 0.5, 0.6, 0.8, 1.0], reqLevel: 30, skillType: 'active' },
            // Branch 1: ライトニング
            { id: 's_chargedbolt', name: 'チャージドボルト', icon: '⚡', mp: 8, cd: 1.0, branch: 1, desc: '電撃の弾を複数放つ', prereq: null, effect: 'multi_shot', arrows: [3, 3, 4, 5, 6], baseMult: [1.0, 1.3, 1.6, 2.0, 2.5], reqLevel: 1, skillType: 'active', synergies: [{ from: 's_ltgmastery_p', bonus: 0.04, type: 'damage' }] },
            { id: 's_staticfield', name: 'スタティックフィールド', icon: '🔵', mp: 14, cd: 4.0, branch: 1, desc: '周囲の敵の防御力を低下', prereq: 's_chargedbolt', effect: 'debuff_defense', duration: [3, 4, 5, 6, 8], reduction: [0.2, 0.3, 0.35, 0.4, 0.5], range: 120, reqLevel: 6, skillType: 'active' },
            { id: 's_teleport', name: 'テレポート', icon: '🌀', mp: 16, cd: 2.5, branch: 1, desc: '瞬間移動する', prereq: 's_chargedbolt', effect: 'teleport', range: [180, 220, 260, 320, 400], reqLevel: 6, skillType: 'active' },
            { id: 's_ltgmastery_p', name: '雷の極意', icon: '⚡', mp: 0, cd: 0, branch: 1, desc: '雷ダメージを常時上昇', prereq: 's_chargedbolt', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'damagePercent', baseBonus: 3, perLevel: 3 } },
            { id: 's_lightning', name: 'ライトニング', icon: '🌩', mp: 22, cd: 2.0, branch: 1, desc: '稲妻を放ち連鎖する', prereq: 's_staticfield', effect: 'chain_lightning', bounces: [2, 3, 3, 4, 5], baseMult: [1.6, 2.0, 2.5, 3.2, 4.2], reqLevel: 12, skillType: 'active', synergies: [{ from: 's_chargedbolt', bonus: 0.10, type: 'damage' }, { from: 's_ltgmastery_p', bonus: 0.04, type: 'damage' }] },
            { id: 's_nova', name: 'ノヴァ', icon: '💫', mp: 30, cd: 4.0, branch: 1, desc: '全方向に電撃を放射する', prereq: 's_lightning', effect: 'frost_nova', baseMult: [1.5, 2.0, 2.5, 3.2, 4.0], freeze: [1, 1, 2, 2, 3], reqLevel: 18, skillType: 'active', synergies: [{ from: 's_lightning', bonus: 0.08, type: 'damage' }, { from: 's_ltgmastery_p', bonus: 0.04, type: 'damage' }] },
            { id: 's_energyshield', name: 'エナジーシールド', icon: '🔷', mp: 35, cd: 12.0, branch: 1, desc: 'マナで被ダメージを吸収', prereq: 's_teleport', effect: 'mana_shield', duration: [5, 7, 9, 12, 16], absorb: [0.4, 0.5, 0.6, 0.7, 0.8], reqLevel: 18, skillType: 'active' },
            { id: 's_ltgmastery', name: 'ライトニングマスタリー', icon: '⚡', mp: 40, cd: 12.0, branch: 1, desc: '雷の力を極限まで高める', prereq: 's_nova', effect: 'buff_atkspd', duration: [6, 8, 10, 14, 18], bonus: [0.3, 0.4, 0.5, 0.6, 0.8], reqLevel: 24, skillType: 'active' },
            { id: 's_thunderstorm', name: 'サンダーストーム', icon: '⛈', mp: 55, cd: 10.0, branch: 1, desc: '雷雲を召喚し敵を打つ', prereq: 's_ltgmastery', effect: 'consecrate', baseMult: [1.0, 1.4, 1.8, 2.4, 3.2], range: 120, duration: [6, 8, 10, 13, 16], reqLevel: 30, skillType: 'active', synergies: [{ from: 's_lightning', bonus: 0.10, type: 'damage' }, { from: 's_nova', bonus: 0.10, type: 'damage' }] },
            // Branch 2: コールドスペル
            { id: 's_icebolt', name: 'アイスボルト', icon: '🔷', mp: 6, cd: 0.8, branch: 2, desc: '氷の弾を撃ち出す', prereq: null, effect: 'projectile_fire', iconEff: 'bolt_cold', baseMult: [1.2, 1.5, 1.8, 2.2, 2.8], speed: 380, reqLevel: 1, skillType: 'active', synergies: [{ from: 's_frostnova', bonus: 0.06, type: 'damage' }] },
            { id: 's_frozenarmor', name: 'フローズンアーマー', icon: '🛡', mp: 15, cd: 10.0, branch: 2, desc: '氷の鎧で被ダメージ軽減', prereq: 's_icebolt', effect: 'buff_defense', duration: [6, 8, 10, 12, 16], reduction: [0.3, 0.4, 0.45, 0.5, 0.6], reqLevel: 6, skillType: 'active' },
            { id: 's_frostnova', name: 'フロストノヴァ', icon: '❄', mp: 18, cd: 4.0, branch: 2, desc: '冷気の波動で周囲を凍結', prereq: 's_icebolt', effect: 'frost_nova', baseMult: [0.8, 1.0, 1.4, 1.8, 2.4], freeze: [2, 2, 3, 4, 5], reqLevel: 6, skillType: 'active', synergies: [{ from: 's_icebolt', bonus: 0.10, type: 'damage' }, { from: 's_icebolt', bonus: 0.05, type: 'freeze' }] },
            { id: 's_glacialspike', name: 'グレイシャルスパイク', icon: '🧊', mp: 22, cd: 3.0, branch: 2, desc: '氷の棘で敵を凍らせる', prereq: 's_frostnova', effect: 'frost_nova', baseMult: [1.5, 2.0, 2.5, 3.2, 4.0], freeze: [2, 3, 3, 4, 5], reqLevel: 12, skillType: 'active', synergies: [{ from: 's_frostnova', bonus: 0.10, type: 'damage' }, { from: 's_icebolt', bonus: 0.06, type: 'freeze' }] },
            { id: 's_shiverarmor', name: 'シヴァーアーマー', icon: '🪞', mp: 25, cd: 8.0, branch: 2, desc: '反射の氷鎧を纏う', prereq: 's_frozenarmor', effect: 'buff_counter', duration: [5, 7, 9, 11, 14], reflect: [0.3, 0.4, 0.5, 0.6, 0.8], reqLevel: 12, skillType: 'active' },
            { id: 's_blizzard', name: 'ブリザード', icon: '🌨', mp: 40, cd: 7.0, branch: 2, desc: '氷の嵐を降らせる', prereq: 's_glacialspike', effect: 'arrow_rain', baseMult: [2.2, 2.8, 3.5, 4.5, 6.0], range: 120, reqLevel: 18, skillType: 'active', synergies: [{ from: 's_glacialspike', bonus: 0.10, type: 'damage' }, { from: 's_frostnova', bonus: 0.08, type: 'damage' }] },
            { id: 's_coldmastery', name: 'コールドマスタリー', icon: '🥶', mp: 35, cd: 10.0, branch: 2, desc: '冷気の力で敵を弱体化', prereq: 's_blizzard', effect: 'debuff_defense', duration: [4, 6, 8, 10, 13], reduction: [0.3, 0.4, 0.5, 0.6, 0.7], range: 140, reqLevel: 24, skillType: 'active' },
            { id: 's_frozenorb', name: 'フローズンオーブ', icon: '🌐', mp: 55, cd: 8.0, branch: 2, desc: '氷の球体から氷片を放射', prereq: 's_coldmastery', effect: 'frozen_orb', baseMult: [2.5, 3.5, 4.5, 6.0, 8.0], speed: 200, shardCount: [5, 6, 8, 10, 12], reqLevel: 30, skillType: 'active', synergies: [{ from: 's_blizzard', bonus: 0.12, type: 'damage' }, { from: 's_glacialspike', bonus: 0.08, type: 'freeze' }] }
        ]
    },
    paladin: {
        name: 'パラディン',
        icon: '✝',
        engName: 'Paladin',
        tier: 1,
        baseClass: 'warrior',
        sprite: 'paladin',
        baseStr: 22,
        baseDex: 10,
        baseVit: 25,
        baseInt: 8,
        branches: ['コンバット', 'オフェンスオーラ', 'ディフェンスオーラ'],
        promotions: [],
        skills: [
            // Branch 0: コンバット
            { id: 'p_sacrifice', name: 'サクリファイス', icon: '💉', mp: 8, cd: 1.0, branch: 0, desc: '自身のHPを犠牲に強力な一撃', prereq: null, effect: 'melee_burst', baseMult: [2.0, 2.5, 3.0, 3.8, 4.5], range: 55, reqLevel: 1, skillType: 'active', synergies: [{ from: 'p_blessedaim_p', bonus: 0.03, type: 'damage' }] },
            { id: 'p_smite', name: 'スマイト', icon: '✝', mp: 12, cd: 1.5, branch: 0, desc: '盾で打ち据え気絶させる', prereq: 'p_sacrifice', effect: 'melee_burst', baseMult: [2.2, 2.8, 3.5, 4.2, 5.0], range: 60, reqLevel: 6, skillType: 'active', synergies: [{ from: 'p_sacrifice', bonus: 0.08, type: 'damage' }] },
            { id: 'p_charge', name: 'チャージ', icon: '🐎', mp: 15, cd: 3.0, branch: 0, desc: '敵に突進して体当たり', prereq: 'p_sacrifice', effect: 'charge', baseMult: [2.0, 2.5, 3.2, 4.0, 5.0], range: 250, reqLevel: 6, skillType: 'active' },
            { id: 'p_blessedaim_p', name: '祝福の照準', icon: '🎯', mp: 0, cd: 0, branch: 0, desc: '命中精度とクリティカル率を常時上昇', prereq: 'p_sacrifice', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'critChance', baseBonus: 2, perLevel: 1.5 } },
            { id: 'p_zeal', name: 'ジール', icon: '⚔', mp: 22, cd: 6.0, branch: 0, desc: '素早い連続攻撃を繰り出す', prereq: 'p_smite', effect: 'buff_atkspd', duration: [4, 6, 8, 10, 13], bonus: [0.4, 0.5, 0.6, 0.8, 1.0], reqLevel: 12, skillType: 'active', synergies: [{ from: 'p_sacrifice', bonus: 0.06, type: 'damage' }] },
            { id: 'p_vengeance', name: 'ヴェンジェンス', icon: '🗡', mp: 28, cd: 3.0, branch: 0, desc: '属性ダメージを付与した一撃', prereq: 'p_zeal', effect: 'melee_burst', baseMult: [3.0, 3.8, 4.5, 5.5, 7.0], range: 60, reqLevel: 18, skillType: 'active', synergies: [{ from: 'p_smite', bonus: 0.10, type: 'damage' }, { from: 'p_blessedaim_p', bonus: 0.03, type: 'damage' }] },
            { id: 'p_conversion', name: 'コンバージョン', icon: '🙏', mp: 35, cd: 8.0, branch: 0, desc: 'ダメージの一部をHPに変換', prereq: 'p_vengeance', effect: 'self_heal_pct', pct: [0.12, 0.16, 0.20, 0.24, 0.30], reqLevel: 18, skillType: 'active', synergies: [{ from: 'p_prayer', bonus: 0.06, type: 'heal' }] },
            { id: 'p_blessedhammer', name: 'ブレスドハンマー', icon: '🔨', mp: 42, cd: 4.0, branch: 0, desc: '聖なるハンマーを回転させる', prereq: 'p_conversion', effect: 'holy_burst', baseMult: [2.5, 3.2, 4.0, 5.0, 6.5], range: 140, reqLevel: 24, skillType: 'active', synergies: [{ from: 'p_smite', bonus: 0.10, type: 'damage' }, { from: 'p_vengeance', bonus: 0.10, type: 'damage' }] },
            { id: 'p_fistofheavens', name: 'フィストオブヘヴン', icon: '🌟', mp: 55, cd: 8.0, branch: 0, desc: '天から聖なる雷を落とす', prereq: 'p_blessedhammer', effect: 'meteor', baseMult: [4.0, 5.0, 6.5, 8.0, 10.5], range: 130, reqLevel: 30, skillType: 'active', synergies: [{ from: 'p_blessedhammer', bonus: 0.12, type: 'damage' }, { from: 'p_holyshock', bonus: 0.08, type: 'damage' }] },
            // Branch 1: オフェンスオーラ
            { id: 'p_might', name: 'マイト', icon: '💪', mp: 12, cd: 8.0, branch: 1, desc: '攻撃力上昇のオーラ', prereq: null, effect: 'buff_berserk', duration: [6, 8, 10, 12, 16], reqLevel: 1, skillType: 'active' },
            { id: 'p_holyfire', name: 'ホーリーファイア', icon: '🔥', mp: 18, cd: 6.0, branch: 1, desc: '炎の聖域を展開する', prereq: 'p_might', effect: 'consecrate', baseMult: [0.5, 0.7, 0.9, 1.2, 1.5], range: 90, duration: [3, 4, 5, 6, 8], reqLevel: 6, skillType: 'active', synergies: [{ from: 'p_might', bonus: 0.06, type: 'damage' }] },
            { id: 'p_thorns', name: 'ソーンズ', icon: '🌹', mp: 20, cd: 8.0, branch: 1, desc: '反撃ダメージのオーラ', prereq: 'p_might', effect: 'buff_counter', duration: [5, 7, 9, 11, 14], reflect: [0.3, 0.4, 0.5, 0.6, 0.8], reqLevel: 6, skillType: 'active', synergies: [{ from: 'p_might', bonus: 0.06, type: 'damage' }] },
            { id: 'p_holyshock', name: 'ホーリーショック', icon: '⚡', mp: 25, cd: 5.0, branch: 1, desc: '雷の聖域を展開する', prereq: 'p_holyfire', effect: 'chain_lightning', bounces: [2, 3, 3, 4, 5], baseMult: [1.5, 2.0, 2.5, 3.2, 4.0], reqLevel: 12, skillType: 'active', synergies: [{ from: 'p_holyfire', bonus: 0.10, type: 'damage' }] },
            { id: 'p_sanctuary', name: 'サンクチュアリ', icon: '🏛', mp: 30, cd: 6.0, branch: 1, desc: '周囲の敵を弱体化する聖域', prereq: 'p_holyshock', effect: 'holy_burst', baseMult: [1.8, 2.2, 2.8, 3.5, 4.5], range: 120, reqLevel: 18, skillType: 'active', synergies: [{ from: 'p_holyshock', bonus: 0.08, type: 'damage' }, { from: 'p_holyfire', bonus: 0.06, type: 'damage' }] },
            { id: 'p_conviction', name: 'コンヴィクション', icon: '👁', mp: 35, cd: 10.0, branch: 1, desc: '敵の防御力を低下させる', prereq: 'p_sanctuary', effect: 'debuff_defense', duration: [5, 7, 9, 12, 15], reduction: [0.3, 0.4, 0.5, 0.6, 0.7], range: 160, reqLevel: 18, skillType: 'active', synergies: [{ from: 'p_sanctuary', bonus: 0.08, type: 'duration' }] },
            { id: 'p_fanaticism', name: 'ファナティシズム', icon: '🔱', mp: 42, cd: 12.0, branch: 1, desc: '攻撃速度と攻撃力を強化', prereq: 'p_conviction', effect: 'buff_frenzy', duration: [6, 8, 10, 13, 16], atkBonus: [0.4, 0.5, 0.6, 0.8, 1.0], spdBonus: [0.2, 0.3, 0.4, 0.5, 0.6], reqLevel: 24, skillType: 'active', synergies: [{ from: 'p_might', bonus: 0.06, type: 'duration' }, { from: 'p_conviction', bonus: 0.06, type: 'duration' }] },
            { id: 'p_holyfreeze', name: 'ホーリーフリーズ', icon: '❄', mp: 50, cd: 8.0, branch: 1, desc: '冷気の聖域で敵を凍結', prereq: 'p_fanaticism', effect: 'frost_nova', baseMult: [2.0, 2.8, 3.5, 4.5, 6.0], freeze: [2, 3, 4, 5, 6], reqLevel: 30, skillType: 'active', synergies: [{ from: 'p_sanctuary', bonus: 0.10, type: 'damage' }, { from: 'p_holyshock', bonus: 0.08, type: 'freeze' }] },
            // Branch 2: ディフェンスオーラ
            { id: 'p_prayer', name: 'プレイヤー', icon: '💚', mp: 12, cd: 8.0, branch: 2, desc: 'HPを徐々に回復する祈り', prereq: null, effect: 'self_heal_pct', pct: [0.10, 0.14, 0.18, 0.22, 0.28], reqLevel: 1, skillType: 'active', synergies: [{ from: 'p_cleansing', bonus: 0.06, type: 'heal' }, { from: 'p_redemption', bonus: 0.08, type: 'heal' }] },
            { id: 'p_cleansing', name: 'クレンジング', icon: '💧', mp: 15, cd: 8.0, branch: 2, desc: '状態異常を浄化する', prereq: 'p_prayer', effect: 'self_heal_pct', pct: [0.12, 0.16, 0.20, 0.24, 0.30], reqLevel: 6, skillType: 'active', synergies: [{ from: 'p_prayer', bonus: 0.08, type: 'heal' }] },
            { id: 'p_defiance', name: 'ディファイアンス', icon: '🛡', mp: 18, cd: 8.0, branch: 2, desc: '防御力上昇のオーラ', prereq: 'p_prayer', effect: 'buff_defense', duration: [5, 7, 9, 12, 15], reduction: [0.20, 0.25, 0.30, 0.35, 0.45], reqLevel: 6, skillType: 'active', synergies: [{ from: 'p_holyshield_p', bonus: 0.03, type: 'duration' }, { from: 'p_resist', bonus: 0.06, type: 'duration' }] },
            { id: 'p_holyshield_p', name: '聖盾', icon: '🛡', mp: 0, cd: 0, branch: 2, desc: '防御力を常時上昇', prereq: 'p_defiance', reqLevel: 12, skillType: 'passive', passiveEffect: { stat: 'defensePercent', baseBonus: 2, perLevel: 2 }, synergies: [{ from: 'p_defiance', bonus: 0.04, type: 'damage' }, { from: 'p_resist', bonus: 0.04, type: 'damage' }] },
            { id: 'p_vigor', name: 'ヴィガー', icon: '🏃', mp: 20, cd: 10.0, branch: 2, desc: '移動速度上昇のオーラ', prereq: 'p_cleansing', effect: 'buff_speed', duration: [6, 8, 10, 12, 16], bonus: [0.3, 0.4, 0.5, 0.6, 0.8], reqLevel: 12, skillType: 'active', synergies: [{ from: 'p_meditation', bonus: 0.06, type: 'duration' }] },
            { id: 'p_meditation', name: 'メディテーション', icon: '🧘', mp: 25, cd: 10.0, branch: 2, desc: 'マナを大幅に回復する瞑想', prereq: 'p_vigor', effect: 'buff_aura', duration: [6, 8, 10, 14, 18], regen: [4, 6, 8, 12, 16], reduction: [0.15, 0.2, 0.25, 0.3, 0.4], reqLevel: 18, skillType: 'active' },
            { id: 'p_meditmastery_p', name: '瞑想の極意', icon: '🧘', mp: 0, cd: 0, branch: 2, desc: 'マナ自然回復を常時上昇', prereq: 'p_meditation', reqLevel: 18, skillType: 'passive', passiveEffect: { stat: 'manaRegen', baseBonus: 1, perLevel: 1 }, synergies: [{ from: 'p_meditation', bonus: 0.04, type: 'damage' }] },
            { id: 'p_redemption', name: 'リデンプション', icon: '🌟', mp: 30, cd: 12.0, branch: 2, desc: '周囲のHPとMPを回復', prereq: 'p_meditation', effect: 'self_heal_pct', pct: [0.18, 0.22, 0.26, 0.30, 0.36], reqLevel: 18, skillType: 'active', synergies: [{ from: 'p_prayer', bonus: 0.10, type: 'heal' }, { from: 'p_cleansing', bonus: 0.06, type: 'heal' }] },
            { id: 'p_resist', name: 'レジスト', icon: '🔰', mp: 35, cd: 12.0, branch: 2, desc: '全耐性を上昇させる', prereq: 'p_defiance', effect: 'buff_defense', duration: [8, 10, 12, 16, 20], reduction: [0.25, 0.30, 0.35, 0.40, 0.50], reqLevel: 24, skillType: 'active', synergies: [{ from: 'p_defiance', bonus: 0.08, type: 'duration' }, { from: 'p_holyshield_p', bonus: 0.03, type: 'damage' }] },
            { id: 'p_salvation', name: 'サルベーション', icon: '✨', mp: 50, cd: 18.0, branch: 2, desc: '究極の防御オーラを展開', prereq: 'p_resist', effect: 'buff_aura', duration: [10, 12, 15, 20, 25], regen: [5, 8, 12, 16, 22], reduction: [0.20, 0.25, 0.30, 0.35, 0.40], reqLevel: 30, skillType: 'active', synergies: [{ from: 'p_meditation', bonus: 0.10, type: 'duration' }, { from: 'p_redemption', bonus: 0.08, type: 'heal' }] }
        ]
    },
    berserker: {
        name: 'バーサーカー',
        icon: '⚔',
        engName: 'Berserker',
        tier: 1,
        baseClass: 'warrior',
        sprite: 'berserker',
        baseStr: 28,
        baseDex: 12,
        baseVit: 18,
        baseInt: 3,
        branches: ['フレンジー', 'ウォークライ', 'マスタリー'],
        promotions: [],
        skills: [
            // Branch 0: フレンジー
            { id: 'b_frenzy', name: 'フレンジー', icon: '😤', mp: 14, cd: 6.0, branch: 0, desc: '狂乱の連続攻撃', prereq: null, effect: 'buff_frenzy', duration: [5, 7, 9, 11, 14], atkBonus: [0.4, 0.5, 0.6, 0.7, 0.9], spdBonus: [0.2, 0.3, 0.4, 0.5, 0.6], reqLevel: 1, skillType: 'active', synergies: [{ from: 'b_warfrenzy', bonus: 0.08, type: 'duration' }, { from: 'b_berserk', bonus: 0.06, type: 'duration' }] },
            { id: 'b_bash', name: 'バッシュ', icon: '💥', mp: 10, cd: 1.0, branch: 0, desc: '力任せに殴りつける', prereq: 'b_frenzy', effect: 'melee_burst', baseMult: [2.0, 2.5, 3.0, 3.8, 4.5], range: 60, reqLevel: 6, skillType: 'active', synergies: [{ from: 'b_weaponmastery_p', bonus: 0.03, type: 'damage' }] },
            { id: 'b_doubleswing', name: 'ダブルスイング', icon: '⚔', mp: 16, cd: 1.5, branch: 0, desc: '二連撃を叩き込む', prereq: 'b_bash', effect: 'whirlwind', baseMult: [1.6, 2.0, 2.5, 3.0, 3.8], range: 85, reqLevel: 6, skillType: 'active', synergies: [{ from: 'b_bash', bonus: 0.08, type: 'damage' }] },
            { id: 'b_concentrate', name: 'コンセントレイト', icon: '🎯', mp: 20, cd: 2.0, branch: 0, desc: '集中した強力な一撃', prereq: 'b_doubleswing', effect: 'melee_burst', baseMult: [2.8, 3.5, 4.2, 5.0, 6.5], range: 55, reqLevel: 12, skillType: 'active', synergies: [{ from: 'b_bash', bonus: 0.10, type: 'damage' }, { from: 'b_doubleswing', bonus: 0.08, type: 'damage' }] },
            { id: 'b_whirlwind', name: 'ワールウィンド', icon: '🌀', mp: 35, cd: 3.0, branch: 0, desc: '回転しながら斬り刻む', prereq: 'b_concentrate', effect: 'whirlwind', baseMult: [2.0, 2.5, 3.2, 4.0, 5.5], range: 150, reqLevel: 18, skillType: 'active', synergies: [{ from: 'b_doubleswing', bonus: 0.10, type: 'damage' }, { from: 'b_concentrate', bonus: 0.08, type: 'damage' }] },
            { id: 'b_cleave', name: 'クリーブ', icon: '🪓', mp: 38, cd: 4.0, branch: 0, desc: '広範囲を豪快に薙ぎ払う', prereq: 'b_whirlwind', effect: 'whirlwind', baseMult: [2.5, 3.2, 4.0, 5.0, 6.5], range: 160, reqLevel: 18, skillType: 'active', synergies: [{ from: 'b_whirlwind', bonus: 0.10, type: 'damage' }] },
            { id: 'b_warfrenzy', name: 'ウォーフレンジー', icon: '🔥', mp: 45, cd: 8.0, branch: 0, desc: '戦闘狂の攻撃力と速度上昇', prereq: 'b_cleave', effect: 'buff_frenzy', duration: [8, 10, 12, 15, 18], atkBonus: [0.6, 0.7, 0.8, 1.0, 1.2], spdBonus: [0.3, 0.4, 0.5, 0.6, 0.8], reqLevel: 24, skillType: 'active', synergies: [{ from: 'b_frenzy', bonus: 0.06, type: 'duration' }] },
            { id: 'b_executioner', name: 'エクセキューショナー', icon: '💀', mp: 55, cd: 10.0, branch: 0, desc: '処刑人の致命的一撃', prereq: 'b_warfrenzy', effect: 'execute', baseMult: [5.0, 6.5, 8.0, 10.0, 13.0], threshold: [0.40, 0.45, 0.50, 0.55, 0.60], range: 70, reqLevel: 30, skillType: 'active', synergies: [{ from: 'b_concentrate', bonus: 0.12, type: 'damage' }, { from: 'b_whirlwind', bonus: 0.08, type: 'damage' }] },
            // Branch 1: ウォークライ
            { id: 'b_warcry', name: 'ウォークライ', icon: '📯', mp: 14, cd: 5.0, branch: 1, desc: '戦いの雄叫びで敵を気絶', prereq: null, effect: 'stun_aoe', duration: [1.5, 2.0, 2.5, 3.0, 3.5], range: 130, reqLevel: 1, skillType: 'active' },
            { id: 'b_taunt', name: 'タウント', icon: '😡', mp: 12, cd: 5.0, branch: 1, desc: '挑発して防御力を低下', prereq: 'b_warcry', effect: 'debuff_defense', duration: [3, 4, 5, 6, 8], reduction: [0.25, 0.35, 0.45, 0.55, 0.65], range: 140, reqLevel: 6, skillType: 'active', synergies: [{ from: 'b_warcry', bonus: 0.06, type: 'duration' }] },
            { id: 'b_howl', name: 'ハウル', icon: '📣', mp: 16, cd: 6.0, branch: 1, desc: '咆哮で敵を怯ませる', prereq: 'b_warcry', effect: 'stun_aoe', duration: [1.8, 2.2, 2.8, 3.5, 4.0], range: 150, reqLevel: 6, skillType: 'active', synergies: [{ from: 'b_warcry', bonus: 0.08, type: 'duration' }] },
            { id: 'b_ironwill_p', name: '鉄の意志', icon: '💪', mp: 0, cd: 0, branch: 1, desc: '最大HPを常時上昇', prereq: 'b_warcry', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'maxHP', baseBonus: 5, perLevel: 5 }, synergies: [{ from: 'b_warcry', bonus: 0.04, type: 'damage' }, { from: 'b_battleorders', bonus: 0.04, type: 'damage' }] },
            { id: 'b_findpotion', name: 'ファインドポーション', icon: '🧪', mp: 15, cd: 8.0, branch: 1, desc: '回復効果を得る', prereq: 'b_taunt', effect: 'self_heal_pct', pct: [0.10, 0.14, 0.18, 0.22, 0.28], reqLevel: 12, skillType: 'active', synergies: [{ from: 'b_taunt', bonus: 0.06, type: 'heal' }] },
            { id: 'b_battlecmd', name: 'バトルコマンド', icon: '🎖', mp: 25, cd: 10.0, branch: 1, desc: '戦闘指揮で味方を強化', prereq: 'b_howl', effect: 'buff_atkspd', duration: [5, 7, 9, 12, 15], bonus: [0.4, 0.5, 0.6, 0.8, 1.0], reqLevel: 12, skillType: 'active', synergies: [{ from: 'b_warcry', bonus: 0.06, type: 'duration' }] },
            { id: 'b_battleorders', name: 'バトルオーダー', icon: '⚜', mp: 40, cd: 15.0, branch: 1, desc: '戦闘命令で全能力を強化', prereq: 'b_battlecmd', effect: 'battle_orders', duration: [10, 14, 18, 22, 28], bonus: [0.15, 0.22, 0.30, 0.38, 0.45], reqLevel: 18, skillType: 'active', synergies: [{ from: 'b_battlecmd', bonus: 0.08, type: 'duration' }, { from: 'b_howl', bonus: 0.06, type: 'duration' }] },
            { id: 'b_grimward', name: 'グリムウォード', icon: '☠', mp: 45, cd: 10.0, branch: 1, desc: '恐怖の呪いで敵を気絶', prereq: 'b_battleorders', effect: 'stun_aoe', duration: [2.5, 3.0, 3.5, 4.0, 5.0], range: 170, reqLevel: 24, skillType: 'active', synergies: [{ from: 'b_warcry', bonus: 0.08, type: 'duration' }] },
            { id: 'b_battlecommand2', name: 'バトルコマンドII', icon: '🏆', mp: 55, cd: 18.0, branch: 1, desc: '究極の戦闘指揮で大幅強化', prereq: 'b_grimward', effect: 'battle_orders', duration: [12, 16, 20, 25, 32], bonus: [0.22, 0.30, 0.38, 0.46, 0.55], reqLevel: 30, skillType: 'active', synergies: [{ from: 'b_battleorders', bonus: 0.10, type: 'duration' }] },
            // Branch 2: マスタリー
            { id: 'b_leap', name: 'リープアタック', icon: '🦘', mp: 14, cd: 3.0, branch: 2, desc: '跳躍して突撃する', prereq: null, effect: 'charge', baseMult: [2.0, 2.5, 3.0, 3.8, 4.5], range: 220, reqLevel: 1, skillType: 'active', synergies: [{ from: 'b_stomp', bonus: 0.08, type: 'damage' }, { from: 'b_ironfist', bonus: 0.10, type: 'damage' }] },
            { id: 'b_stomp', name: 'ストンプ', icon: '👢', mp: 16, cd: 4.0, branch: 2, desc: '地面を叩きつけ敵を減速', prereq: 'b_leap', effect: 'ground_slam', baseMult: [1.8, 2.2, 2.8, 3.5, 4.2], range: 110, slow: [0.5, 0.45, 0.4, 0.35, 0.3], reqLevel: 6, skillType: 'active', synergies: [{ from: 'b_leap', bonus: 0.08, type: 'damage' }] },
            { id: 'b_ironskin', name: 'アイアンスキン', icon: '🔰', mp: 20, cd: 10.0, branch: 2, desc: '鉄の肌で被ダメージ軽減', prereq: 'b_leap', effect: 'buff_defense', duration: [6, 8, 10, 12, 16], reduction: [0.4, 0.5, 0.55, 0.6, 0.7], reqLevel: 6, skillType: 'active', synergies: [{ from: 'b_natres', bonus: 0.08, type: 'duration' }] },
            { id: 'b_weaponmastery_p', name: '武器の極意', icon: '⚔', mp: 0, cd: 0, branch: 2, desc: 'クリティカル率を常時上昇', prereq: 'b_leap', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'critChance', baseBonus: 2, perLevel: 1.5 } },
            { id: 'b_increasedspeed', name: 'インクリースドスピード', icon: '💨', mp: 22, cd: 10.0, branch: 2, desc: '移動速度を大幅に上昇', prereq: 'b_stomp', effect: 'buff_speed', duration: [6, 8, 10, 12, 16], bonus: [0.35, 0.45, 0.55, 0.65, 0.8], reqLevel: 12, skillType: 'active', synergies: [{ from: 'b_stomp', bonus: 0.06, type: 'duration' }] },
            { id: 'b_natres', name: 'ナチュラルレジスタンス', icon: '💪', mp: 28, cd: 12.0, branch: 2, desc: '自然の力で防御力強化', prereq: 'b_ironskin', effect: 'buff_defense', duration: [8, 10, 12, 15, 18], reduction: [0.45, 0.55, 0.6, 0.7, 0.8], reqLevel: 12, skillType: 'active', synergies: [{ from: 'b_ironskin', bonus: 0.08, type: 'duration' }] },
            { id: 'b_swordmastery', name: 'ソードマスタリー', icon: '⚔', mp: 30, cd: 12.0, branch: 2, desc: '攻撃速度を大幅に上昇', prereq: 'b_increasedspeed', effect: 'buff_atkspd', duration: [6, 8, 10, 13, 16], bonus: [0.45, 0.55, 0.65, 0.8, 1.0], reqLevel: 18, skillType: 'active', synergies: [{ from: 'b_increasedspeed', bonus: 0.08, type: 'duration' }, { from: 'b_weaponmastery_p', bonus: 0.03, type: 'duration' }] },
            { id: 'b_bloodlust_p', name: '血の渇望', icon: '🩸', mp: 0, cd: 0, branch: 2, desc: 'ライフスティールを常時上昇', prereq: 'b_natres', reqLevel: 18, skillType: 'passive', passiveEffect: { stat: 'lifeSteal', baseBonus: 1, perLevel: 0.8 }, synergies: [{ from: 'b_berserk', bonus: 0.04, type: 'damage' }] },
            { id: 'b_berserk', name: 'バーサーク', icon: '👹', mp: 40, cd: 8.0, branch: 2, desc: '狂戦士化で攻撃力大幅上昇', prereq: 'b_natres', effect: 'buff_berserk', duration: [6, 8, 10, 13, 16], reqLevel: 24, skillType: 'active', synergies: [{ from: 'b_frenzy', bonus: 0.08, type: 'duration' }] },
            { id: 'b_ironfist', name: 'アイアンフィスト', icon: '🤜', mp: 55, cd: 10.0, branch: 2, desc: '鉄拳で粉砕する究極の一撃', prereq: 'b_berserk', effect: 'execute', baseMult: [4.5, 6.0, 7.5, 9.5, 12.0], threshold: [0.35, 0.45, 0.50, 0.55, 0.60], range: 65, reqLevel: 30, skillType: 'active', synergies: [{ from: 'b_concentrate', bonus: 0.12, type: 'damage' }, { from: 'b_weaponmastery_p', bonus: 0.04, type: 'damage' }] }
        ]
    },
    assassin: {
        name: 'アサシン',
        icon: '🗡',
        engName: 'Assassin',
        tier: 1,
        baseClass: 'rogue',
        sprite: 'assassin',
        baseStr: 14,
        baseDex: 26,
        baseVit: 12,
        baseInt: 12,
        branches: ['マーシャルアーツ', 'シャドウ', 'トラップ'],
        promotions: [],
        skills: [
            // Branch 0: マーシャルアーツ
            { id: 'a_tigerstrike', name: 'タイガーストライク', icon: '🐯', mp: 8, cd: 1.0, branch: 0, desc: '虎の型で強打する', prereq: null, effect: 'melee_burst', baseMult: [2.0, 2.5, 3.0, 3.6, 4.5], range: 55, reqLevel: 1, skillType: 'active', synergies: [{ from: 'a_clawmastery_p', bonus: 0.03, type: 'damage' }] },
            { id: 'a_cobrastrike', name: 'コブラストライク', icon: '🐍', mp: 12, cd: 1.5, branch: 0, desc: '蛇の型で毒打する', prereq: 'a_tigerstrike', effect: 'melee_burst', baseMult: [2.2, 2.8, 3.4, 4.0, 5.0], range: 55, reqLevel: 6, skillType: 'active', synergies: [{ from: 'a_tigerstrike', bonus: 0.10, type: 'damage' }] },
            { id: 'a_clawmastery_p', name: '爪の極意', icon: '🐾', mp: 0, cd: 0, branch: 0, desc: '攻撃速度を常時上昇', prereq: 'a_tigerstrike', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'attackSpeed', baseBonus: 3, perLevel: 2 } },
            { id: 'a_fistsoffire', name: 'フィスツオブファイア', icon: '🔥', mp: 16, cd: 2.0, branch: 0, desc: '炎の拳で殴打する', prereq: 'a_cobrastrike', effect: 'melee_burst', baseMult: [2.5, 3.0, 3.8, 4.5, 5.5], range: 60, reqLevel: 12, skillType: 'active', synergies: [{ from: 'a_cobrastrike', bonus: 0.08, type: 'damage' }, { from: 'a_clawmastery_p', bonus: 0.03, type: 'damage' }] },
            { id: 'a_dragontalon', name: 'ドラゴンタロン', icon: '🐉', mp: 22, cd: 2.5, branch: 0, desc: '龍の爪で引き裂く', prereq: 'a_fistsoffire', effect: 'shadow_strike', baseMult: [3.0, 3.8, 4.5, 5.5, 7.0], reqLevel: 12, skillType: 'active', synergies: [{ from: 'a_tigerstrike', bonus: 0.08, type: 'damage' }, { from: 'a_fistsoffire', bonus: 0.08, type: 'damage' }] },
            { id: 'a_bladesofice', name: 'ブレイズオブアイス', icon: '❄', mp: 28, cd: 3.0, branch: 0, desc: '氷の刃で周囲を凍結', prereq: 'a_dragontalon', effect: 'frost_nova', baseMult: [1.5, 2.0, 2.5, 3.2, 4.0], freeze: [2, 2, 3, 3, 4], reqLevel: 18, skillType: 'active', synergies: [{ from: 'a_dragontalon', bonus: 0.08, type: 'damage' }] },
            { id: 'a_clawsofthunder', name: 'クロウズオブサンダー', icon: '⚡', mp: 35, cd: 4.0, branch: 0, desc: '雷の爪で連鎖攻撃', prereq: 'a_bladesofice', effect: 'chain_lightning', bounces: [2, 3, 4, 5, 6], baseMult: [1.8, 2.2, 2.8, 3.5, 4.5], reqLevel: 18, skillType: 'active', synergies: [{ from: 'a_fistsoffire', bonus: 0.10, type: 'damage' }] },
            { id: 'a_bladesentinel', name: 'ブレードセンチネル', icon: '🗡', mp: 42, cd: 6.0, branch: 0, desc: '刃の衛兵を展開する', prereq: 'a_clawsofthunder', effect: 'arrow_rain', baseMult: [2.0, 2.5, 3.2, 4.0, 5.5], range: 100, reqLevel: 24, skillType: 'active', synergies: [{ from: 'a_clawsofthunder', bonus: 0.08, type: 'damage' }, { from: 'a_bladesofice', bonus: 0.06, type: 'damage' }] },
            { id: 'a_phoenixstrike', name: 'フェニックスストライク', icon: '🔥', mp: 55, cd: 8.0, branch: 0, desc: '不死鳥の一撃で粉砕', prereq: 'a_bladesentinel', effect: 'execute', baseMult: [5.0, 6.5, 8.0, 10.0, 13.0], threshold: [0.40, 0.45, 0.50, 0.55, 0.60], range: 80, reqLevel: 30, skillType: 'active', synergies: [{ from: 'a_dragontalon', bonus: 0.12, type: 'damage' }, { from: 'a_clawsofthunder', bonus: 0.10, type: 'damage' }] },
            // Branch 1: シャドウ
            { id: 'a_burstspeed', name: 'バーストオブスピード', icon: '💨', mp: 12, cd: 8.0, branch: 1, desc: '瞬間的に速度を上昇', prereq: null, effect: 'buff_speed', duration: [5, 7, 9, 12, 15], bonus: [0.3, 0.4, 0.5, 0.6, 0.8], reqLevel: 1, skillType: 'active', synergies: [{ from: 'a_fade', bonus: 0.06, type: 'duration' }] },
            { id: 'a_fade', name: 'フェード', icon: '🌑', mp: 15, cd: 10.0, branch: 1, desc: '闇に溶け被ダメージ軽減', prereq: 'a_burstspeed', effect: 'buff_defense', duration: [6, 8, 10, 12, 16], reduction: [0.3, 0.4, 0.5, 0.55, 0.65], reqLevel: 6, skillType: 'active', synergies: [{ from: 'a_weaponblock', bonus: 0.06, type: 'duration' }] },
            { id: 'a_cloak', name: 'クロークオブシャドウ', icon: '🌑', mp: 20, cd: 12.0, branch: 1, desc: '影の外套で敵の視界を遮る', prereq: 'a_burstspeed', effect: 'smoke_screen', duration: [3, 4, 5, 6, 8], range: 110, evade: [30, 40, 50, 60, 75], reqLevel: 6, skillType: 'active', synergies: [{ from: 'a_mindblast', bonus: 0.08, type: 'duration' }, { from: 'a_shadowdisc_p', bonus: 0.03, type: 'duration' }] },
            { id: 'a_shadowdisc_p', name: '影の修練', icon: '🌑', mp: 0, cd: 0, branch: 1, desc: '回避率を常時上昇', prereq: 'a_burstspeed', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'dodgeChance', baseBonus: 1.5, perLevel: 1.5 }, synergies: [{ from: 'a_weaponblock', bonus: 0.04, type: 'damage' }, { from: 'a_cloak', bonus: 0.03, type: 'damage' }] },
            { id: 'a_weaponblock', name: 'ウェポンブロック', icon: '🛡', mp: 18, cd: 8.0, branch: 1, desc: '武器で攻撃を受け流す', prereq: 'a_fade', effect: 'buff_dodge', duration: [5, 7, 9, 12, 15], chance: [25, 35, 45, 55, 70], reqLevel: 12, skillType: 'active', synergies: [{ from: 'a_fade', bonus: 0.06, type: 'duration' }] },
            { id: 'a_mindblast', name: 'マインドブラスト', icon: '🧠', mp: 25, cd: 5.0, branch: 1, desc: '精神波で敵を気絶させる', prereq: 'a_cloak', effect: 'stun_aoe', duration: [1.5, 2.0, 2.5, 3.0, 4.0], range: 120, reqLevel: 12, skillType: 'active', synergies: [{ from: 'a_cloak', bonus: 0.08, type: 'duration' }] },
            { id: 'a_venom', name: 'ヴェノム', icon: '☠', mp: 28, cd: 10.0, branch: 1, desc: '武器に毒を付与する', prereq: 'a_mindblast', effect: 'buff_poison', duration: [6, 8, 10, 13, 16], dps: [8, 12, 18, 25, 35], reqLevel: 18, skillType: 'active', synergies: [{ from: 'a_mindblast', bonus: 0.08, type: 'duration' }] },
            { id: 'a_shadowwarrior', name: 'シャドウウォリアー', icon: '👤', mp: 40, cd: 15.0, branch: 1, desc: '影の戦士を召喚する', prereq: 'a_weaponblock', effect: 'summon_minion', duration: [10, 14, 18, 22, 28], minionHP: [120, 200, 300, 420, 600], minionDmg: [10, 15, 22, 30, 42], reqLevel: 18, skillType: 'active' },
            { id: 'a_psychichammer', name: 'サイキックハンマー', icon: '🔮', mp: 32, cd: 5.0, branch: 1, desc: '念動力の衝撃波を放つ', prereq: 'a_venom', effect: 'ground_slam', baseMult: [2.0, 2.6, 3.2, 4.0, 5.0], range: 110, slow: [0.4, 0.35, 0.3, 0.25, 0.2], reqLevel: 24, skillType: 'active', synergies: [{ from: 'a_mindblast', bonus: 0.10, type: 'damage' }, { from: 'a_shadowdisc_p', bonus: 0.04, type: 'damage' }] },
            { id: 'a_shadowmaster', name: 'シャドウマスター', icon: '👥', mp: 55, cd: 20.0, branch: 1, desc: '強力な影の達人を召喚', prereq: 'a_shadowwarrior', effect: 'summon_minion', duration: [12, 16, 20, 25, 32], minionHP: [200, 320, 450, 600, 850], minionDmg: [15, 22, 32, 45, 65], reqLevel: 30, skillType: 'active', synergies: [{ from: 'a_shadowwarrior', bonus: 0.10, type: 'duration' }] },
            // Branch 2: トラップ
            { id: 'a_fireblast', name: 'ファイアブラスト', icon: '💣', mp: 10, cd: 3.0, branch: 2, desc: '爆発するトラップを設置', prereq: null, effect: 'place_trap', baseMult: [1.8, 2.2, 2.8, 3.5, 4.2], reqLevel: 1, skillType: 'active', synergies: [{ from: 'a_wakeoffire', bonus: 0.08, type: 'damage' }, { from: 'a_deathsentry', bonus: 0.10, type: 'damage' }] },
            { id: 'a_wakeoffire', name: 'ウェイクオブファイア', icon: '🔥', mp: 16, cd: 4.0, branch: 2, desc: '火炎の罠を展開する', prereq: 'a_fireblast', effect: 'consecrate', baseMult: [0.6, 0.8, 1.0, 1.3, 1.6], range: 80, duration: [3, 4, 5, 6, 8], reqLevel: 6, skillType: 'active', synergies: [{ from: 'a_fireblast', bonus: 0.10, type: 'damage' }] },
            { id: 'a_ltgsentry', name: 'ライトニングセントリー', icon: '⚡', mp: 22, cd: 5.0, branch: 2, desc: '雷のセントリーを設置', prereq: 'a_fireblast', effect: 'consecrate', baseMult: [0.7, 0.9, 1.2, 1.5, 2.0], range: 90, duration: [4, 5, 6, 8, 10], reqLevel: 6, skillType: 'active', synergies: [{ from: 'a_fireblast', bonus: 0.08, type: 'damage' }, { from: 'a_chargedboltsentry', bonus: 0.10, type: 'damage' }] },
            { id: 'a_lethality_p', name: '致命の一撃', icon: '💀', mp: 0, cd: 0, branch: 2, desc: 'クリティカル率を常時上昇', prereq: 'a_fireblast', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'critChance', baseBonus: 2, perLevel: 2 }, synergies: [{ from: 'a_bladefury', bonus: 0.04, type: 'damage' }, { from: 'a_deathsentry', bonus: 0.04, type: 'damage' }] },
            { id: 'a_bladefury', name: 'ブレードフューリー', icon: '🌀', mp: 25, cd: 3.0, branch: 2, desc: '刃を乱射する', prereq: 'a_wakeoffire', effect: 'multi_shot', arrows: [3, 4, 5, 6, 8], baseMult: [1.0, 1.3, 1.6, 2.0, 2.5], reqLevel: 12, skillType: 'active', synergies: [{ from: 'a_wakeoffire', bonus: 0.08, type: 'damage' }] },
            { id: 'a_wakeofinferno', name: 'ウェイクオブインフェルノ', icon: '🌋', mp: 30, cd: 6.0, branch: 2, desc: '業火の罠を展開する', prereq: 'a_ltgsentry', effect: 'consecrate', baseMult: [0.8, 1.0, 1.3, 1.6, 2.2], range: 100, duration: [4, 5, 7, 8, 10], reqLevel: 12, skillType: 'active', synergies: [{ from: 'a_ltgsentry', bonus: 0.10, type: 'damage' }, { from: 'a_fireblast', bonus: 0.06, type: 'damage' }] },
            { id: 'a_chargedboltsentry', name: 'チャージドボルトセントリー', icon: '🔵', mp: 35, cd: 6.0, branch: 2, desc: '電撃弾のセントリーを設置', prereq: 'a_wakeofinferno', effect: 'multi_shot', arrows: [4, 5, 6, 7, 9], baseMult: [1.2, 1.5, 1.8, 2.2, 2.8], reqLevel: 18, skillType: 'active', synergies: [{ from: 'a_ltgsentry', bonus: 0.08, type: 'damage' }] },
            { id: 'a_deathsentry', name: 'デスセントリー', icon: '💀', mp: 42, cd: 8.0, branch: 2, desc: '死の罠を設置する', prereq: 'a_chargedboltsentry', effect: 'arrow_rain', baseMult: [2.5, 3.2, 4.0, 5.0, 6.5], range: 120, reqLevel: 24, skillType: 'active', synergies: [{ from: 'a_chargedboltsentry', bonus: 0.10, type: 'damage' }, { from: 'a_wakeoffire', bonus: 0.06, type: 'damage' }] },
            { id: 'a_bladeshield', name: 'ブレードシールド', icon: '🛡', mp: 55, cd: 12.0, branch: 2, desc: '回転する刃の盾を展開', prereq: 'a_deathsentry', effect: 'buff_counter', duration: [6, 8, 10, 13, 16], reflect: [0.4, 0.5, 0.6, 0.8, 1.0], reqLevel: 30, skillType: 'active', synergies: [{ from: 'a_lethality_p', bonus: 0.04, type: 'damage' }] }
        ]
    },
    ranger: {
        name: 'レンジャー',
        icon: '🏹',
        engName: 'Ranger',
        tier: 1,
        baseClass: 'rogue',
        sprite: 'rangerCls',
        baseStr: 12,
        baseDex: 24,
        baseVit: 16,
        baseInt: 12,
        branches: ['アーチェリー', 'スピアスキル', 'パッシブ'],
        promotions: [],
        skills: [
            // Branch 0: アーチェリー
            { id: 'rg_guided', name: 'ガイデッドアロー', icon: '🎯', mp: 10, cd: 0.8, branch: 0, desc: '追尾する矢を放つ', prereq: null, effect: 'projectile_fire', iconEff: 'arrow_magic', baseMult: [1.8, 2.2, 2.6, 3.2, 4.0], speed: 500, reqLevel: 1, skillType: 'active', synergies: [{ from: 'rg_multishot', bonus: 0.08, type: 'damage' }, { from: 'rg_magicarrow', bonus: 0.10, type: 'damage' }] },
            { id: 'rg_coldarrow', name: 'コールドアロー', icon: '❄', mp: 12, cd: 1.2, branch: 0, desc: '冷気の矢で敵を減速', prereq: 'rg_guided', effect: 'projectile_fire', iconEff: 'arrow_cold', baseMult: [1.6, 2.0, 2.4, 3.0, 3.8], speed: 420, reqLevel: 6, skillType: 'active', synergies: [{ from: 'rg_guided', bonus: 0.08, type: 'damage' }] },
            { id: 'rg_multishot', name: 'マルチプルショット', icon: '🌟', mp: 20, cd: 2.0, branch: 0, desc: '複数の矢を同時に放つ', prereq: 'rg_guided', effect: 'multi_shot', arrows: [3, 4, 5, 6, 8], baseMult: [1.0, 1.3, 1.6, 2.0, 2.5], reqLevel: 6, skillType: 'active', synergies: [{ from: 'rg_guided', bonus: 0.06, type: 'damage' }, { from: 'rg_hawkeye_p', bonus: 0.03, type: 'damage' }] },
            { id: 'rg_hawkeye_p', name: '鷹の目', icon: '🦅', mp: 0, cd: 0, branch: 0, desc: 'ダメージを常時上昇', prereq: 'rg_guided', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'damagePercent', baseBonus: 3, perLevel: 3 } },
            { id: 'rg_strafe', name: 'ストレイフ', icon: '🏹', mp: 25, cd: 2.5, branch: 0, desc: '矢の嵐で敵を制圧する', prereq: 'rg_multishot', effect: 'multi_shot', arrows: [4, 5, 6, 8, 10], baseMult: [1.2, 1.5, 1.8, 2.2, 2.8], reqLevel: 12, skillType: 'active', synergies: [{ from: 'rg_multishot', bonus: 0.10, type: 'damage' }] },
            { id: 'rg_explodingarrow', name: 'エクスプローディングアロー', icon: '💥', mp: 28, cd: 4.0, branch: 0, desc: '爆発する矢を放つ', prereq: 'rg_coldarrow', effect: 'arrow_rain', baseMult: [2.0, 2.5, 3.2, 4.0, 5.0], range: 90, reqLevel: 12, skillType: 'active', synergies: [{ from: 'rg_coldarrow', bonus: 0.08, type: 'damage' }] },
            { id: 'rg_immolation', name: 'イモレーションアロー', icon: '🔥', mp: 35, cd: 6.0, branch: 0, desc: '炎の雨を降らせる矢', prereq: 'rg_explodingarrow', effect: 'arrow_rain', baseMult: [2.5, 3.2, 4.0, 5.0, 6.5], range: 100, reqLevel: 18, skillType: 'active', synergies: [{ from: 'rg_explodingarrow', bonus: 0.10, type: 'damage' }] },
            { id: 'rg_freezingarrow', name: 'フリージングアロー', icon: '🧊', mp: 42, cd: 6.0, branch: 0, desc: '周囲を凍結させる氷の矢', prereq: 'rg_immolation', effect: 'frost_nova', baseMult: [2.0, 2.5, 3.2, 4.0, 5.5], freeze: [2, 3, 3, 4, 5], reqLevel: 24, skillType: 'active', synergies: [{ from: 'rg_coldarrow', bonus: 0.10, type: 'freeze' }, { from: 'rg_immolation', bonus: 0.08, type: 'damage' }] },
            { id: 'rg_magicarrow', name: 'マジックアロー', icon: '✨', mp: 55, cd: 8.0, branch: 0, desc: '魔力を凝縮した究極の矢', prereq: 'rg_freezingarrow', effect: 'projectile_fire', iconEff: 'arrow_magic', baseMult: [4.0, 5.0, 6.5, 8.0, 10.5], speed: 550, reqLevel: 30, skillType: 'active', synergies: [{ from: 'rg_guided', bonus: 0.12, type: 'damage' }, { from: 'rg_hawkeye_p', bonus: 0.04, type: 'damage' }] },
            // Branch 1: スピアスキル
            { id: 'rg_jab', name: 'ジャブ', icon: '🔱', mp: 8, cd: 1.0, branch: 1, desc: '素早い連続突き', prereq: null, effect: 'melee_burst', baseMult: [1.8, 2.2, 2.6, 3.2, 4.0], range: 58, reqLevel: 1, skillType: 'active', synergies: [{ from: 'rg_chargedstrike', bonus: 0.08, type: 'damage' }, { from: 'rg_powerstrike', bonus: 0.06, type: 'damage' }] },
            { id: 'rg_chargedstrike', name: 'チャージドストライク', icon: '⚡', mp: 14, cd: 2.0, branch: 1, desc: '帯電した連撃', prereq: 'rg_jab', effect: 'melee_burst', baseMult: [2.0, 2.5, 3.2, 4.0, 5.0], range: 60, reqLevel: 6, skillType: 'active', synergies: [{ from: 'rg_jab', bonus: 0.08, type: 'damage' }] },
            { id: 'rg_innersight_p', name: '心眼', icon: '👁', mp: 0, cd: 0, branch: 1, desc: 'クリティカル率を常時上昇', prereq: 'rg_jab', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'critChance', baseBonus: 2, perLevel: 1.5 }, synergies: [{ from: 'rg_chargedstrike', bonus: 0.04, type: 'damage' }, { from: 'rg_ltfury', bonus: 0.04, type: 'damage' }] },
            { id: 'rg_powerstrike', name: 'パワーストライク', icon: '💪', mp: 18, cd: 2.5, branch: 1, desc: '渾身の一撃を叩き込む', prereq: 'rg_chargedstrike', effect: 'melee_burst', baseMult: [2.5, 3.0, 3.8, 4.5, 5.8], range: 62, reqLevel: 12, skillType: 'active', synergies: [{ from: 'rg_chargedstrike', bonus: 0.08, type: 'damage' }, { from: 'rg_jab', bonus: 0.06, type: 'damage' }] },
            { id: 'rg_fend', name: 'フェンド', icon: '🔱', mp: 22, cd: 3.5, branch: 1, desc: '槍で周囲を薙ぎ払う', prereq: 'rg_powerstrike', effect: 'whirlwind', baseMult: [1.6, 2.0, 2.5, 3.2, 4.0], range: 85, reqLevel: 12, skillType: 'active', synergies: [{ from: 'rg_powerstrike', bonus: 0.10, type: 'damage' }] },
            { id: 'rg_poisonjav', name: 'ポイズンジャベリン', icon: '☠', mp: 25, cd: 4.0, branch: 1, desc: '毒の投槍を投げる', prereq: 'rg_fend', effect: 'buff_poison', duration: [4, 5, 6, 8, 10], dps: [6, 10, 15, 22, 30], reqLevel: 18, skillType: 'active' },
            { id: 'rg_plaguejav', name: 'プレイグジャベリン', icon: '💚', mp: 30, cd: 5.0, branch: 1, desc: '疫病の毒雲を発生させる', prereq: 'rg_poisonjav', effect: 'consecrate', baseMult: [0.6, 0.8, 1.0, 1.3, 1.6], range: 90, duration: [4, 5, 6, 8, 10], reqLevel: 18, skillType: 'active', synergies: [{ from: 'rg_poisonjav', bonus: 0.10, type: 'duration' }] },
            { id: 'rg_ltfury', name: 'ライトニングフューリー', icon: '🌩', mp: 42, cd: 6.0, branch: 1, desc: '稲妻の怒りを解き放つ', prereq: 'rg_plaguejav', effect: 'chain_lightning', bounces: [3, 4, 5, 6, 8], baseMult: [2.0, 2.5, 3.2, 4.0, 5.5], reqLevel: 24, skillType: 'active', synergies: [{ from: 'rg_chargedstrike', bonus: 0.10, type: 'damage' }, { from: 'rg_powerstrike', bonus: 0.08, type: 'damage' }] },
            { id: 'rg_lightningstrike', name: 'ライトニングストライク', icon: '⚡', mp: 55, cd: 8.0, branch: 1, desc: '雷撃で粉砕する一撃', prereq: 'rg_ltfury', effect: 'chain_lightning', bounces: [4, 5, 6, 7, 9], baseMult: [2.8, 3.5, 4.5, 5.5, 7.5], reqLevel: 30, skillType: 'active', synergies: [{ from: 'rg_ltfury', bonus: 0.12, type: 'damage' }, { from: 'rg_innersight_p', bonus: 0.04, type: 'damage' }] },
            // Branch 2: パッシブ
            { id: 'rg_penetrate', name: 'ペネトレイト', icon: '🎯', mp: 12, cd: 10.0, branch: 2, desc: '攻撃の貫通力を上昇', prereq: null, effect: 'buff_crit', duration: [5, 7, 9, 12, 15], bonus: [15, 22, 30, 55], reqLevel: 1, skillType: 'active', synergies: [{ from: 'rg_critmastery', bonus: 0.08, type: 'duration' }, { from: 'rg_pierce', bonus: 0.06, type: 'duration' }] },
            { id: 'rg_dodge', name: 'ドッジ', icon: '💨', mp: 15, cd: 10.0, branch: 2, desc: '攻撃を回避する', prereq: 'rg_penetrate', effect: 'buff_dodge', duration: [5, 7, 9, 12, 15], chance: [25, 35, 45, 55, 70], reqLevel: 6, skillType: 'active', synergies: [{ from: 'rg_avoid', bonus: 0.08, type: 'duration' }, { from: 'rg_evade', bonus: 0.06, type: 'duration' }] },
            { id: 'rg_avoid', name: 'アヴォイド', icon: '🌀', mp: 18, cd: 10.0, branch: 2, desc: '高度な回避術を発動', prereq: 'rg_dodge', effect: 'buff_dodge', duration: [6, 8, 10, 13, 16], chance: [30, 40, 50, 60, 75], reqLevel: 6, skillType: 'active', synergies: [{ from: 'rg_dodge', bonus: 0.06, type: 'duration' }] },
            { id: 'rg_valkyrie_p', name: 'ヴァルキリーの魂', icon: '👼', mp: 0, cd: 0, branch: 2, desc: '最大HPを常時上昇', prereq: 'rg_penetrate', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'maxHP', baseBonus: 5, perLevel: 5 }, synergies: [{ from: 'rg_decoy', bonus: 0.04, type: 'damage' }] },
            { id: 'rg_evade', name: 'イヴェイド', icon: '🌊', mp: 22, cd: 10.0, branch: 2, desc: '素早い身のこなしで回避', prereq: 'rg_avoid', effect: 'buff_speed', duration: [5, 7, 9, 12, 16], bonus: [0.3, 0.4, 0.5, 0.6, 0.8], reqLevel: 12, skillType: 'active', synergies: [{ from: 'rg_avoid', bonus: 0.08, type: 'duration' }] },
            { id: 'rg_slowmissiles', name: 'スローミサイル', icon: '🕸', mp: 20, cd: 6.0, branch: 2, desc: '敵の動きを遅くする', prereq: 'rg_penetrate', effect: 'stun_aoe', duration: [1.5, 2.0, 2.5, 3.0, 4.0], range: 120, reqLevel: 12, skillType: 'active', synergies: [{ from: 'rg_penetrate', bonus: 0.06, type: 'duration' }] },
            { id: 'rg_critmastery', name: 'クリティカルマスタリー', icon: '⚔', mp: 30, cd: 12.0, branch: 2, desc: 'クリティカル率を大幅強化', prereq: 'rg_evade', effect: 'buff_crit', duration: [6, 8, 10, 14, 18], bonus: [25, 35, 45, 60, 80], reqLevel: 18, skillType: 'active', synergies: [{ from: 'rg_penetrate', bonus: 0.08, type: 'duration' }] },
            { id: 'rg_pierce', name: 'ピアース', icon: '🏹', mp: 35, cd: 10.0, branch: 2, desc: '敵の装甲を貫通する', prereq: 'rg_slowmissiles', effect: 'buff_atkspd', duration: [6, 8, 10, 12, 16], bonus: [0.4, 0.5, 0.6, 0.8, 1.0], reqLevel: 24, skillType: 'active', synergies: [{ from: 'rg_penetrate', bonus: 0.08, type: 'duration' }] },
            { id: 'rg_decoy', name: 'デコイ', icon: '👤', mp: 50, cd: 15.0, branch: 2, desc: '囮を設置して敵を惑わす', prereq: 'rg_critmastery', effect: 'summon_minion', duration: [8, 12, 16, 20, 25], minionHP: [100, 160, 240, 340, 480], minionDmg: [8, 12, 18, 25, 35], reqLevel: 30, skillType: 'active', synergies: [{ from: 'rg_valkyrie_p', bonus: 0.04, type: 'duration' }] }
        ]
    },
    pyromancer: {
        name: 'ファイアソーサレス',
        icon: '🔥',
        engName: 'Pyromancer',
        tier: 1,
        baseClass: 'sorcerer',
        sprite: 'pyromancer',
        baseStr: 5,
        baseDex: 10,
        baseVit: 12,
        baseInt: 30,
        branches: ['ファイアスペル', 'エンチャント', 'インフェルノ'],
        promotions: [],
        skills: [
            // Branch 0: ファイアスペル
            { id: 'py_firebolt', name: 'ファイアボルト', icon: '🔥', mp: 6, cd: 0.5, branch: 0, desc: '火炎の弾を撃ち出す', prereq: null, effect: 'projectile_fire', iconEff: 'bolt_fire', baseMult: [1.8, 2.2, 2.6, 3.2, 4.0], speed: 360, reqLevel: 1, skillType: 'active', synergies: [{ from: 'py_flameheart_p', bonus: 0.04, type: 'damage' }] },
            { id: 'py_fireball', name: 'ファイアボール', icon: '☀', mp: 14, cd: 0.8, branch: 0, desc: '爆発する火球を放つ', prereq: 'py_firebolt', effect: 'projectile_fire', iconEff: 'bolt_fire', baseMult: [2.5, 3.0, 3.8, 4.5, 5.5], speed: 380, reqLevel: 6, skillType: 'active', synergies: [{ from: 'py_firebolt', bonus: 0.12, type: 'damage' }, { from: 'py_flameheart_p', bonus: 0.04, type: 'damage' }] },
            { id: 'py_flameheart_p', name: '炎の心臓', icon: '❤‍🔥', mp: 0, cd: 0, branch: 0, desc: '火炎ダメージを常時上昇', prereq: 'py_firebolt', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'damagePercent', baseBonus: 3, perLevel: 3 } },
            { id: 'py_firewall', name: 'ファイアウォール', icon: '🧱', mp: 22, cd: 4.0, branch: 0, desc: '炎の壁を展開する', prereq: 'py_fireball', effect: 'consecrate', baseMult: [0.7, 0.9, 1.2, 1.5, 2.0], range: 80, duration: [3, 4, 5, 7, 9], reqLevel: 12, skillType: 'active', synergies: [{ from: 'py_fireball', bonus: 0.08, type: 'damage' }] },
            { id: 'py_combustion', name: 'コンバッション', icon: '💥', mp: 28, cd: 5.0, branch: 0, desc: '爆発で周囲を焼き尽くす', prereq: 'py_firewall', effect: 'meteor', baseMult: [2.5, 3.2, 4.0, 5.0, 6.5], range: 90, reqLevel: 12, skillType: 'active', synergies: [{ from: 'py_firebolt', bonus: 0.10, type: 'damage' }, { from: 'py_fireball', bonus: 0.10, type: 'damage' }] },
            { id: 'py_meteor', name: 'メテオ', icon: '☄', mp: 40, cd: 7.0, branch: 0, desc: '空から隕石を落とす', prereq: 'py_combustion', effect: 'meteor', baseMult: [3.5, 4.5, 5.5, 7.0, 9.0], range: 120, reqLevel: 18, skillType: 'active', synergies: [{ from: 'py_combustion', bonus: 0.12, type: 'damage' }, { from: 'py_fireball', bonus: 0.08, type: 'damage' }] },
            { id: 'py_armageddon', name: 'アルマゲドン', icon: '🌠', mp: 50, cd: 10.0, branch: 0, desc: '天から炎の雨を降らせる', prereq: 'py_meteor', effect: 'arrow_rain', baseMult: [3.0, 4.0, 5.0, 6.5, 8.5], range: 150, reqLevel: 24, skillType: 'active', synergies: [{ from: 'py_meteor', bonus: 0.10, type: 'damage' }, { from: 'py_flameheart_p', bonus: 0.04, type: 'damage' }] },
            { id: 'py_firemastery2', name: 'ファイアマスタリー', icon: '🔥', mp: 45, cd: 12.0, branch: 0, desc: '火炎の力を極限まで高める', prereq: 'py_armageddon', effect: 'buff_atkspd', duration: [6, 8, 10, 14, 18], bonus: [0.4, 0.5, 0.6, 0.8, 1.0], reqLevel: 24, skillType: 'active' },
            { id: 'py_meteorstorm', name: 'メテオストーム', icon: '🌋', mp: 65, cd: 12.0, branch: 0, desc: '連続隕石で大地を焼く', prereq: 'py_firemastery2', effect: 'meteor', baseMult: [4.5, 6.0, 8.0, 10.0, 12.0], range: 160, reqLevel: 30, skillType: 'active', synergies: [{ from: 'py_meteor', bonus: 0.14, type: 'damage' }, { from: 'py_armageddon', bonus: 0.10, type: 'damage' }] },
            // Branch 1: エンチャント
            { id: 'py_warmth', name: 'ウォームス', icon: '🌡', mp: 10, cd: 8.0, branch: 1, desc: 'マナ回復のオーラを展開', prereq: null, effect: 'buff_aura', duration: [6, 8, 10, 12, 16], regen: [3, 5, 7, 10, 14], reduction: [0.1, 0.15, 0.2, 0.25, 0.3], reqLevel: 1, skillType: 'active', synergies: [{ from: 'py_enchant', bonus: 0.06, type: 'duration' }, { from: 'py_pyroregen_p', bonus: 0.04, type: 'duration' }] },
            { id: 'py_enchant', name: 'エンチャント', icon: '✨', mp: 18, cd: 10.0, branch: 1, desc: '武器に炎を付与する', prereq: 'py_warmth', effect: 'buff_berserk', duration: [6, 8, 10, 12, 16], reqLevel: 6, skillType: 'active', synergies: [{ from: 'py_warmth', bonus: 0.06, type: 'duration' }] },
            { id: 'py_pyroregen_p', name: '炎の回復', icon: '🌡', mp: 0, cd: 0, branch: 1, desc: 'マナ自然回復を常時上昇', prereq: 'py_warmth', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'manaRegen', baseBonus: 1, perLevel: 1 }, synergies: [{ from: 'py_warmth', bonus: 0.04, type: 'damage' }] },
            { id: 'py_blazingaura', name: 'ブレイジングオーラ', icon: '🔆', mp: 22, cd: 8.0, branch: 1, desc: '灼熱のオーラを展開', prereq: 'py_enchant', effect: 'consecrate', baseMult: [0.5, 0.7, 0.9, 1.2, 1.5], range: 70, duration: [4, 5, 6, 8, 10], reqLevel: 12, skillType: 'active', synergies: [{ from: 'py_enchant', bonus: 0.08, type: 'duration' }] },
            { id: 'py_infernalguard', name: 'インファーナルガード', icon: '🔰', mp: 25, cd: 10.0, branch: 1, desc: '業火の障壁で身を守る', prereq: 'py_blazingaura', effect: 'buff_counter', duration: [5, 7, 9, 12, 15], reflect: [0.3, 0.4, 0.5, 0.6, 0.8], reqLevel: 12, skillType: 'active', synergies: [{ from: 'py_flamebarrier', bonus: 0.08, type: 'damage' }] },
            { id: 'py_moltenarmor', name: 'モルテンアーマー', icon: '🛡', mp: 28, cd: 10.0, branch: 1, desc: '溶岩の鎧を纏う', prereq: 'py_infernalguard', effect: 'buff_defense', duration: [6, 8, 10, 13, 16], reduction: [0.35, 0.45, 0.55, 0.6, 0.7], reqLevel: 18, skillType: 'active', synergies: [{ from: 'py_infernalguard', bonus: 0.06, type: 'duration' }] },
            { id: 'py_flamebarrier', name: 'フレイムバリア', icon: '🔥', mp: 32, cd: 8.0, branch: 1, desc: '炎の障壁で反撃する', prereq: 'py_moltenarmor', effect: 'buff_counter', duration: [6, 8, 10, 12, 16], reflect: [0.4, 0.5, 0.6, 0.8, 1.0], reqLevel: 18, skillType: 'active', synergies: [{ from: 'py_infernalguard', bonus: 0.08, type: 'damage' }] },
            { id: 'py_hydra', name: 'ヒドラ', icon: '🐍', mp: 40, cd: 8.0, branch: 1, desc: 'ヒドラを召喚する', prereq: 'py_flamebarrier', effect: 'consecrate', baseMult: [0.8, 1.0, 1.3, 1.6, 2.2], range: 100, duration: [5, 7, 9, 12, 15], reqLevel: 24, skillType: 'active', synergies: [{ from: 'py_blazingaura', bonus: 0.10, type: 'damage' }, { from: 'py_flameheart_p', bonus: 0.04, type: 'damage' }] },
            { id: 'py_innerflame', name: 'インナーフレイム', icon: '💛', mp: 55, cd: 15.0, branch: 1, desc: '内なる炎で全能力強化', prereq: 'py_hydra', effect: 'buff_frenzy', duration: [8, 10, 12, 16, 20], atkBonus: [0.5, 0.6, 0.7, 0.9, 1.2], spdBonus: [0.2, 0.3, 0.4, 0.5, 0.6], reqLevel: 30, skillType: 'active', synergies: [{ from: 'py_enchant', bonus: 0.08, type: 'duration' }] },
            // Branch 2: インフェルノ
            { id: 'py_inferno', name: 'インフェルノ', icon: '🌋', mp: 12, cd: 2.0, branch: 2, desc: '近距離に火炎を放射する', prereq: null, effect: 'ground_slam', baseMult: [1.5, 1.8, 2.2, 2.8, 3.5], range: 80, slow: [0.5, 0.45, 0.4, 0.35, 0.3], reqLevel: 1, skillType: 'active', synergies: [{ from: 'py_firestorm', bonus: 0.08, type: 'damage' }, { from: 'py_pyromania', bonus: 0.10, type: 'damage' }] },
            { id: 'py_firestorm', name: 'ファイアストーム', icon: '🔥', mp: 16, cd: 3.0, branch: 2, desc: '火炎の嵐を巻き起こす', prereq: 'py_inferno', effect: 'arrow_rain', baseMult: [1.5, 2.0, 2.5, 3.0, 4.0], range: 90, reqLevel: 6, skillType: 'active', synergies: [{ from: 'py_inferno', bonus: 0.08, type: 'damage' }] },
            { id: 'py_burnsoul_p', name: '燃え盛る魂', icon: '💜', mp: 0, cd: 0, branch: 2, desc: '最大MPを常時上昇', prereq: 'py_inferno', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'maxMP', baseBonus: 5, perLevel: 4 }, synergies: [{ from: 'py_inferno', bonus: 0.04, type: 'damage' }, { from: 'py_pyromania', bonus: 0.04, type: 'damage' }] },
            { id: 'py_blaze', name: 'ブレイズ', icon: '💥', mp: 20, cd: 3.5, branch: 2, desc: '通った跡に炎を残す', prereq: 'py_firestorm', effect: 'chain_lightning', bounces: [2, 3, 4, 5, 6], baseMult: [1.5, 2.0, 2.5, 3.2, 4.0], reqLevel: 12, skillType: 'active', synergies: [{ from: 'py_firestorm', bonus: 0.08, type: 'damage' }] },
            { id: 'py_lavawalk', name: 'ラヴァウォーク', icon: '🟠', mp: 25, cd: 5.0, branch: 2, desc: '溶岩の道を歩む', prereq: 'py_blaze', effect: 'consecrate', baseMult: [0.7, 0.9, 1.2, 1.5, 2.0], range: 70, duration: [3, 4, 5, 7, 9], reqLevel: 12, skillType: 'active', synergies: [{ from: 'py_blaze', bonus: 0.06, type: 'damage' }] },
            { id: 'py_pyromania', name: 'パイロマニア', icon: '🔥', mp: 30, cd: 6.0, branch: 2, desc: '火炎で全てを焼き尽くす', prereq: 'py_lavawalk', effect: 'meteor', baseMult: [2.5, 3.2, 4.0, 5.0, 6.5], range: 100, reqLevel: 18, skillType: 'active', synergies: [{ from: 'py_inferno', bonus: 0.10, type: 'damage' }, { from: 'py_firestorm', bonus: 0.08, type: 'damage' }] },
            { id: 'py_combustion2', name: 'コンバッションII', icon: '💥', mp: 38, cd: 7.0, branch: 2, desc: '強化された爆発で壊滅させる', prereq: 'py_pyromania', effect: 'meteor', baseMult: [3.0, 4.0, 5.0, 6.5, 8.0], range: 110, reqLevel: 18, skillType: 'active', synergies: [{ from: 'py_pyromania', bonus: 0.10, type: 'damage' }] },
            { id: 'py_hellfire', name: 'ヘルファイア', icon: '🔥', mp: 48, cd: 8.0, branch: 2, desc: '地獄の業火を召喚する', prereq: 'py_combustion2', effect: 'arrow_rain', baseMult: [3.0, 4.0, 5.0, 6.5, 8.5], range: 140, reqLevel: 24, skillType: 'active', synergies: [{ from: 'py_combustion2', bonus: 0.10, type: 'damage' }, { from: 'py_flameheart_p', bonus: 0.04, type: 'damage' }] },
            { id: 'py_armageddon2', name: 'ファイナルフレア', icon: '🌠', mp: 60, cd: 12.0, branch: 2, desc: '究極の炎で全てを焼却', prereq: 'py_hellfire', effect: 'meteor', baseMult: [4.5, 6.0, 8.0, 10.0, 12.0], range: 170, reqLevel: 30, skillType: 'active', synergies: [{ from: 'py_hellfire', bonus: 0.12, type: 'damage' }, { from: 'py_pyromania', bonus: 0.10, type: 'damage' }] }
        ]
    },
    cryomancer: {
        name: 'アイスソーサレス',
        icon: '❄',
        engName: 'Cryomancer',
        tier: 1,
        baseClass: 'sorcerer',
        sprite: 'cryomancer',
        baseStr: 5,
        baseDex: 12,
        baseVit: 14,
        baseInt: 28,
        branches: ['コールドスペル', 'フロストディフェンス', 'アイスマスタリー'],
        promotions: [],
        skills: [
            // Branch 0: コールドスペル
            { id: 'cy_icebolt', name: 'アイスボルト', icon: '🔷', mp: 6, cd: 0.5, branch: 0, desc: '氷の弾を撃ち出す', prereq: null, effect: 'projectile_fire', iconEff: 'bolt_cold', baseMult: [1.4, 1.7, 2.0, 2.4, 3.0], speed: 380, reqLevel: 1, skillType: 'active' },
            { id: 'cy_iceblast', name: 'アイスブラスト', icon: '💎', mp: 12, cd: 0.8, branch: 0, desc: '氷の衝撃波を放つ', prereq: 'cy_icebolt', effect: 'projectile_fire', iconEff: 'bolt_cold', baseMult: [1.8, 2.2, 2.6, 3.2, 4.0], speed: 400, reqLevel: 6, skillType: 'active', synergies: [{ from: 'cy_icebolt', bonus: 0.10, type: 'damage' }] },
            { id: 'cy_frostbolt', name: 'フロストボルト', icon: '🔵', mp: 16, cd: 1.5, branch: 0, desc: '冷気の弾を放つ', prereq: 'cy_iceblast', effect: 'projectile_fire', iconEff: 'bolt_cold', baseMult: [2.2, 2.8, 3.5, 4.2, 5.2], speed: 360, reqLevel: 6, skillType: 'active', synergies: [{ from: 'cy_iceblast', bonus: 0.08, type: 'damage' }] },
            { id: 'cy_glacialspike', name: 'グレイシャルスパイク', icon: '❄', mp: 22, cd: 3.0, branch: 0, desc: '氷の棘で敵を凍らせる', prereq: 'cy_frostbolt', effect: 'frost_nova', baseMult: [1.5, 2.0, 2.5, 3.2, 4.2], freeze: [2, 3, 3, 4, 5], reqLevel: 12, skillType: 'active', synergies: [{ from: 'cy_frostbolt', bonus: 0.10, type: 'damage' }, { from: 'cy_icebolt', bonus: 0.06, type: 'freeze' }] },
            { id: 'cy_blizzard', name: 'ブリザード', icon: '🌨', mp: 38, cd: 6.0, branch: 0, desc: '氷の嵐を降らせる', prereq: 'cy_glacialspike', effect: 'arrow_rain', baseMult: [2.5, 3.2, 4.0, 5.0, 6.5], range: 130, reqLevel: 18, skillType: 'active', synergies: [{ from: 'cy_glacialspike', bonus: 0.10, type: 'damage' }, { from: 'cy_frostbolt', bonus: 0.08, type: 'damage' }] },
            { id: 'cy_iceorb', name: 'アイスオーブ', icon: '🌐', mp: 42, cd: 7.0, branch: 0, desc: '氷の球体を放つ', prereq: 'cy_blizzard', effect: 'frozen_orb', baseMult: [2.5, 3.2, 4.0, 5.0, 6.5], speed: 180, shardCount: [5, 6, 8, 10, 12], reqLevel: 24, skillType: 'active', synergies: [{ from: 'cy_blizzard', bonus: 0.10, type: 'damage' }, { from: 'cy_permafrostmastery_p', bonus: 0.04, type: 'damage' }] },
            { id: 'cy_absolutezero', name: 'アブソリュートゼロ', icon: '❄', mp: 50, cd: 8.0, branch: 0, desc: '絶対零度で全てを凍結', prereq: 'cy_iceorb', effect: 'frost_nova', baseMult: [3.0, 4.0, 5.0, 6.5, 8.5], freeze: [3, 4, 5, 6, 8], reqLevel: 24, skillType: 'active', synergies: [{ from: 'cy_glacialspike', bonus: 0.10, type: 'freeze' }, { from: 'cy_frostnova', bonus: 0.08, type: 'freeze' }] },
            { id: 'cy_permafrost', name: 'パーマフロスト', icon: '🧊', mp: 60, cd: 10.0, branch: 0, desc: '永久凍土で敵を封じる', prereq: 'cy_absolutezero', effect: 'arrow_rain', baseMult: [4.0, 5.0, 6.5, 8.0, 10.5], range: 150, reqLevel: 30, skillType: 'active', synergies: [{ from: 'cy_blizzard', bonus: 0.12, type: 'damage' }, { from: 'cy_iceorb', bonus: 0.10, type: 'damage' }] },
            // Branch 1: フロストディフェンス
            { id: 'cy_frozenarmor', name: 'フローズンアーマー', icon: '🛡', mp: 12, cd: 8.0, branch: 1, desc: '氷の鎧で被ダメージ軽減', prereq: null, effect: 'buff_defense', duration: [5, 7, 9, 12, 15], reduction: [0.3, 0.4, 0.5, 0.55, 0.65], reqLevel: 1, skillType: 'active', synergies: [{ from: 'cy_chillingarmor', bonus: 0.06, type: 'duration' }, { from: 'cy_icebarrier', bonus: 0.08, type: 'duration' }] },
            { id: 'cy_chillingarmor', name: 'チリングアーマー', icon: '🧊', mp: 16, cd: 8.0, branch: 1, desc: '冷気の鎧で反撃する', prereq: 'cy_frozenarmor', effect: 'buff_defense', duration: [6, 8, 10, 13, 16], reduction: [0.35, 0.45, 0.55, 0.6, 0.7], reqLevel: 6, skillType: 'active', synergies: [{ from: 'cy_frozenarmor', bonus: 0.06, type: 'duration' }] },
            { id: 'cy_coldres_p', name: '氷の耐性', icon: '🛡', mp: 0, cd: 0, branch: 1, desc: '防御力を常時上昇', prereq: 'cy_frozenarmor', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'defensePercent', baseBonus: 2, perLevel: 2 }, synergies: [{ from: 'cy_frozenarmor', bonus: 0.02, type: 'damage' }, { from: 'cy_chillingarmor', bonus: 0.03, type: 'damage' }, { from: 'cy_shiverarmor', bonus: 0.04, type: 'damage' }] },
            { id: 'cy_shiverarmor', name: 'シヴァーアーマー', icon: '🪞', mp: 20, cd: 8.0, branch: 1, desc: '反射の氷鎧を纏う', prereq: 'cy_chillingarmor', effect: 'buff_counter', duration: [5, 7, 9, 11, 14], reflect: [0.3, 0.4, 0.5, 0.6, 0.8], reqLevel: 12, skillType: 'active', synergies: [{ from: 'cy_chillingarmor', bonus: 0.08, type: 'duration' }] },
            { id: 'cy_frostwall', name: 'フロストウォール', icon: '🧱', mp: 25, cd: 6.0, branch: 1, desc: '氷の壁で敵を阻む', prereq: 'cy_shiverarmor', effect: 'stun_aoe', duration: [1.5, 2.0, 2.5, 3.0, 4.0], range: 100, reqLevel: 12, skillType: 'active', synergies: [{ from: 'cy_frostnova', bonus: 0.08, type: 'duration' }, { from: 'cy_freezingpulse', bonus: 0.10, type: 'freeze' }] },
            { id: 'cy_glacialshield', name: 'グレイシャルシールド', icon: '💠', mp: 28, cd: 10.0, branch: 1, desc: '氷の盾で身を守る', prereq: 'cy_frostwall', effect: 'mana_shield', duration: [5, 7, 9, 12, 15], absorb: [0.4, 0.5, 0.6, 0.7, 0.8], reqLevel: 18, skillType: 'active' },
            { id: 'cy_icevein_p', name: '氷の血脈', icon: '🔷', mp: 0, cd: 0, branch: 1, desc: '最大MPを常時上昇', prereq: 'cy_glacialshield', reqLevel: 18, skillType: 'passive', passiveEffect: { stat: 'maxMP', baseBonus: 5, perLevel: 4 }, synergies: [{ from: 'cy_glacialshield', bonus: 0.04, type: 'damage' }, { from: 'cy_energyshield', bonus: 0.05, type: 'damage' }] },
            { id: 'cy_energyshield', name: 'エナジーシールド', icon: '🔷', mp: 35, cd: 12.0, branch: 1, desc: 'マナで被ダメージを吸収', prereq: 'cy_glacialshield', effect: 'mana_shield', duration: [6, 8, 10, 14, 18], absorb: [0.5, 0.6, 0.7, 0.75, 0.85], reqLevel: 18, skillType: 'active', synergies: [{ from: 'cy_glacialshield', bonus: 0.08, type: 'duration' }] },
            { id: 'cy_icebarrier', name: 'アイスバリア', icon: '🏔', mp: 40, cd: 12.0, branch: 1, desc: '氷の障壁を展開する', prereq: 'cy_energyshield', effect: 'buff_defense', duration: [8, 10, 12, 16, 20], reduction: [0.5, 0.6, 0.65, 0.7, 0.8], reqLevel: 24, skillType: 'active', synergies: [{ from: 'cy_shiverarmor', bonus: 0.08, type: 'duration' }, { from: 'cy_coldres_p', bonus: 0.03, type: 'damage' }] },
            { id: 'cy_arcticsurge', name: 'アークティックサージ', icon: '🌊', mp: 55, cd: 15.0, branch: 1, desc: '極寒の力で周囲を凍結', prereq: 'cy_icebarrier', effect: 'buff_aura', duration: [8, 10, 14, 18, 22], regen: [4, 6, 8, 12, 16], reduction: [0.2, 0.3, 0.35, 0.4, 0.5], reqLevel: 30, skillType: 'active', synergies: [{ from: 'cy_icebarrier', bonus: 0.08, type: 'duration' }] },
            // Branch 2: アイスマスタリー
            { id: 'cy_frostnova', name: 'フロストノヴァ', icon: '💠', mp: 14, cd: 3.0, branch: 2, desc: '冷気の波動で周囲を凍結', prereq: null, effect: 'frost_nova', baseMult: [1.0, 1.3, 1.6, 2.0, 2.5], freeze: [1, 2, 2, 3, 4], reqLevel: 1, skillType: 'active', synergies: [{ from: 'cy_iceshards', bonus: 0.08, type: 'damage' }, { from: 'cy_freezingpulse', bonus: 0.10, type: 'freeze' }, { from: 'cy_wintersfury', bonus: 0.08, type: 'freeze' }] },
            { id: 'cy_iceshards', name: 'アイスシャード', icon: '🔹', mp: 16, cd: 2.0, branch: 2, desc: '氷の破片を乱射する', prereq: 'cy_frostnova', effect: 'multi_shot', arrows: [3, 3, 4, 5, 6], baseMult: [1.0, 1.3, 1.6, 2.0, 2.5], reqLevel: 6, skillType: 'active', synergies: [{ from: 'cy_frostnova', bonus: 0.08, type: 'damage' }] },
            { id: 'cy_permafrostmastery_p', name: '永久凍土の極意', icon: '🧊', mp: 0, cd: 0, branch: 2, desc: '氷ダメージを常時上昇', prereq: 'cy_frostnova', reqLevel: 6, skillType: 'passive', passiveEffect: { stat: 'damagePercent', baseBonus: 3, perLevel: 3 }, synergies: [{ from: 'cy_iceshards', bonus: 0.03, type: 'damage' }, { from: 'cy_freezingpulse', bonus: 0.04, type: 'damage' }, { from: 'cy_glacialstorm', bonus: 0.05, type: 'damage' }, { from: 'cy_blizzardmastery', bonus: 0.06, type: 'damage' }] },
            { id: 'cy_freezingpulse', name: 'フリージングパルス', icon: '❄', mp: 20, cd: 3.5, branch: 2, desc: '凍結の衝撃波を放つ', prereq: 'cy_iceshards', effect: 'frost_nova', baseMult: [1.5, 2.0, 2.5, 3.0, 4.0], freeze: [2, 2, 3, 4, 5], reqLevel: 12, skillType: 'active', synergies: [{ from: 'cy_frostnova', bonus: 0.10, type: 'freeze' }, { from: 'cy_iceshards', bonus: 0.08, type: 'damage' }] },
            { id: 'cy_coldmastery', name: 'コールドマスタリー', icon: '🥶', mp: 22, cd: 8.0, branch: 2, desc: '冷気で敵を弱体化する', prereq: 'cy_freezingpulse', effect: 'debuff_defense', duration: [4, 6, 8, 10, 13], reduction: [0.3, 0.4, 0.5, 0.6, 0.7], range: 140, reqLevel: 12, skillType: 'active', synergies: [{ from: 'cy_frostnova', bonus: 0.06, type: 'duration' }, { from: 'cy_freezingpulse', bonus: 0.08, type: 'duration' }] },
            { id: 'cy_glacialstorm', name: 'グレイシャルストーム', icon: '🌨', mp: 30, cd: 6.0, branch: 2, desc: '氷の嵐で敵を制圧する', prereq: 'cy_coldmastery', effect: 'arrow_rain', baseMult: [2.0, 2.5, 3.2, 4.0, 5.5], range: 120, reqLevel: 18, skillType: 'active', synergies: [{ from: 'cy_freezingpulse', bonus: 0.10, type: 'damage' }, { from: 'cy_permafrostmastery_p', bonus: 0.04, type: 'damage' }] },
            { id: 'cy_wintersfury', name: 'ウインターズフューリー', icon: '❄', mp: 38, cd: 7.0, branch: 2, desc: '冬の怒りを解き放つ', prereq: 'cy_glacialstorm', effect: 'frost_nova', baseMult: [2.5, 3.2, 4.0, 5.0, 6.5], freeze: [3, 4, 5, 6, 7], reqLevel: 18, skillType: 'active', synergies: [{ from: 'cy_glacialstorm', bonus: 0.10, type: 'damage' }, { from: 'cy_frostnova', bonus: 0.08, type: 'freeze' }] },
            { id: 'cy_frozenorb', name: 'フローズンオーブ', icon: '🌐', mp: 48, cd: 8.0, branch: 2, desc: '氷片を放射する球体を放つ', prereq: 'cy_wintersfury', effect: 'frozen_orb', baseMult: [3.0, 4.0, 5.0, 6.5, 8.5], speed: 200, shardCount: [6, 8, 10, 12, 14], reqLevel: 24, skillType: 'active', synergies: [{ from: 'cy_wintersfury', bonus: 0.12, type: 'damage' }, { from: 'cy_glacialstorm', bonus: 0.08, type: 'freeze' }] },
            { id: 'cy_blizzardmastery', name: 'ブリザードマスタリー', icon: '🌀', mp: 60, cd: 12.0, branch: 2, desc: '究極のブリザードを放つ', prereq: 'cy_frozenorb', effect: 'arrow_rain', baseMult: [4.5, 5.5, 7.0, 9.0, 12.0], range: 160, reqLevel: 30, skillType: 'active', synergies: [{ from: 'cy_frozenorb', bonus: 0.14, type: 'damage' }, { from: 'cy_blizzard', bonus: 0.10, type: 'damage' }] }
        ]
    }
};

// ========== CLASS CHANGE SYSTEM ==========
const CLASS_PROMOTIONS = {
    warrior: [
        { key: 'paladin', name: '聖騎士', icon: '⛨', desc: '聖なる力で味方を守り敵を浄化する騎士。防御と回復に優れる。' },
        { key: 'berserker', name: '狂戦士', icon: '🪓', desc: '怒りの力で圧倒的な火力を叩き出す戦士。攻撃に全振り。' }
    ],
    rogue: [
        { key: 'assassin', name: '暗殺者', icon: '🗡', desc: '影に潜み急所を突く暗殺のプロ。単体火力と回避に特化。' },
        { key: 'ranger', name: '狩人', icon: '🏹', desc: '遠距離からの精密射撃と罠で戦場を支配する。' }
    ],
    sorcerer: [
        { key: 'pyromancer', name: '炎術師', icon: '🔥', desc: '炎と爆発の魔法で殲滅する。圧倒的な範囲火力。' },
        { key: 'cryomancer', name: '氷術師', icon: '❄', desc: '凍結と氷の防壁で戦場を制御する。CC特化型。' }
    ]
};

// Promotion is a major power spike; gate it behind an early milestone (Act1 boss) so it doesn't happen too soon.
const PROMOTION_LEVEL = 12;
let promotionPending = false;

function checkPromotion() {
    const act1BossDefeated = !!(G.bossesDefeated && G.bossesDefeated.skeleton_king);
    if (player.level >= PROMOTION_LEVEL && act1BossDefeated && !promotionPending) {
        const classDef = CLASS_DEFS[G.playerClass];
        if (classDef.tier === 0 && classDef.promotions && classDef.promotions.length > 0) {
            promotionPending = true;
            setPaused(true);
            showPromotionUI();
        }
    }
}

function showPromotionUI() {
    const promos = CLASS_PROMOTIONS[G.playerClass];
    if (!promos) return;
    const overlay = DOM.promotionOverlay;
    const content = DOM.promotionContent;
    let html = `<div style="text-align:center;margin-bottom:15px"><span style="color:#ffd700;font-size:22px;font-weight:bold;text-shadow:0 0 10px #ffd700">クラスチェンジ</span><br><span style="color:#aaa;font-size:12px">Lv.${PROMOTION_LEVEL} かつ 骸骨王討伐達成！上位クラスを選択してください</span></div>`;
    for (const p of promos) {
        const cd = CLASS_DEFS[p.key];
        html += `<div class="promo-card" onclick="doPromotion('${p.key}')">
            <div style="font-size:28px;margin-bottom:5px">${p.icon}</div>
            <div style="color:#ffd700;font-size:16px;font-weight:bold">${p.name}</div>
            <div style="color:#aaa;font-size:10px;margin-bottom:6px">${cd.engName}</div>
            <div style="color:#ccc;font-size:11px;margin-bottom:8px">${p.desc}</div>
            <div style="color:#888;font-size:10px">STR:${cd.baseStr} DEX:${cd.baseDex} VIT:${cd.baseVit} INT:${cd.baseInt}</div>
            <div style="color:#66aaff;font-size:10px;margin-top:4px">スキルブランチ: ${cd.branches.join(' / ')}</div>
        </div>`;
    }
    content.innerHTML = html;
    overlay.style.display = 'flex';
    DOM.pauseOverlay.style.display = 'none';
}

window.doPromotion = function (newClass) {
    const newDef = CLASS_DEFS[newClass];
    if (!newDef) return;
    G.playerClass = newClass;
    player.classKey = newClass;
    player.className = newDef.name;
    // Apply stat bonuses (keep allocated stats, update base)
    const oldDef = CLASS_DEFS[newDef.baseClass];
    player.str += newDef.baseStr - oldDef.baseStr;
    player.dex += newDef.baseDex - oldDef.baseDex;
    player.vit += newDef.baseVit - oldDef.baseVit;
    player.int += newDef.baseInt - oldDef.baseInt;
    // Keep old skill levels, add new skills with level 0
    for (const sk of newDef.skills) {
        if (!(sk.id in player.skillLevels)) {
            player.skillLevels[sk.id] = 0;
        }
    }
    // Do NOT auto-unlock promoted skills: keep base-class skills relevant and let the player choose point allocation.
    // Give a small one-time point bonus (still a power bump, but not an instant "swap everything" moment).
    player.skillPoints = (player.skillPoints || 0) + 2;
    // Keep skill bar as-is (player may be in combat). The new skills can be assigned manually.
    player.recalcStats();
    player.hp = player.maxHP;
    player.mp = player.maxMP;
    promotionPending = false;
    setPaused(false);
    DOM.promotionOverlay.style.display = 'none';
    preRenderSkillIcons(); // Re-cache for new class skills
    addLog(`${newDef.name}にクラスチェンジ！`, '#ffd700');
    sfxLevelUp();
    emitParticles(player.x, player.y, '#ffd700', 30, 100, 1.0, 5, -40);
};

// ========== SKILL BAR MANAGEMENT ==========
function rebuildSkillBar() {
    // スキルスロットは空のまま - プレイヤーが自分で設定する
    player.skills = {};
}

function getAllAvailableSkills() {
    const classDef = CLASS_DEFS[G.playerClass];
    const result = [...classDef.skills];
    // Also include base class skills if promoted
    if (classDef.baseClass && CLASS_DEFS[classDef.baseClass]) {
        for (const sk of CLASS_DEFS[classDef.baseClass].skills) {
            if (!result.find(s => s.id === sk.id)) {
                result.push(sk);
            }
        }
    }
    return result;
}

// ========== SKILL VALUE HELPERS (Diablo 2 Style) ==========
const SKILL_MAX_LEVEL = 20;
const LEGACY_SKILL_TUNING = {
    // Keep base-class (tier0) skills relevant after promotion.
    // Goal: base skills stay as reliable, cheap, low-CD staples; promoted skills become higher-ceiling point sinks.
    baseSkillDmgMultAtPromo: 1.18,
    baseSkillDmgMultPerLevelAfterPromo: 0.02,
    baseSkillDmgMultCap: 0.32, // +32% max on top of baseSkillDmgMultAtPromo
    baseSkillMpCostMult: 0.85,
    baseSkillCdMult: 0.90
};

function _isPromotedClass() {
    const cd = CLASS_DEFS[G.playerClass];
    return !!(cd && cd.tier > 0 && cd.baseClass && CLASS_DEFS[cd.baseClass]);
}
function _isBaseClassSkillId(skillId) {
    if (!_isPromotedClass()) return false;
    const cd = CLASS_DEFS[G.playerClass];
    const base = CLASS_DEFS[cd.baseClass];
    if (!base || !base.skills) return false;
    return base.skills.some(s => s.id === skillId);
}
function getLegacySkillTuning(skDef) {
    if (!skDef || !_isBaseClassSkillId(skDef.id)) return { dmgMult: 1, mpCostMult: 1, cdMult: 1 };
    const over = Math.max(0, (player.level || 1) - PROMOTION_LEVEL);
    const extra = Math.min(LEGACY_SKILL_TUNING.baseSkillDmgMultCap, over * LEGACY_SKILL_TUNING.baseSkillDmgMultPerLevelAfterPromo);
    const dmgMult = LEGACY_SKILL_TUNING.baseSkillDmgMultAtPromo + extra;
    return {
        dmgMult,
        mpCostMult: LEGACY_SKILL_TUNING.baseSkillMpCostMult,
        cdMult: LEGACY_SKILL_TUNING.baseSkillCdMult
    };
}

// Get a skill property value at given level, supporting both arrays and formula params
function getSkillValue(skDef, prop, level) {
    const val = skDef[prop];
    if (val == null) return 0;
    // Legacy: 5-element array - interpolate/extrapolate for levels 1-20
    if (Array.isArray(val)) {
        if (level <= 0) return val[0];
        const li = level - 1;
        if (li < val.length) return val[li];
        // Extrapolate beyond array: use last two elements to determine growth rate
        const last = val[val.length - 1];
        const prev = val[val.length - 2];
        const growth = last - prev;
        return last + growth * (li - val.length + 1);
    }
    // Formula-based: baseProp + perLevelProp * (level - 1)
    const base = val;
    const perLevel = skDef[prop + 'PerLevel'] || 0;
    return base + perLevel * (level - 1);
}

// Get cooldown at skill level (diminishing reduction: Lv20 = -40%)
function getSkillCooldown(skDef, level) {
    const baseCD = skDef.cd || 0;
    // Diminishing returns: reduction = 1 - 1/(1 + level * 0.035)
    // At Lv1: ~3.4%, Lv5: ~15%, Lv10: ~26%, Lv15: ~34%, Lv20: ~41%
    const reduction = 1 - 1 / (1 + level * 0.035);
    return baseCD * (1 - reduction);
}

// Get MP cost at skill level (increasing: Lv20 = +60%)
function getSkillMPCost(skDef, level) {
    const baseMP = skDef.mp || 0;
    // Linear increase: +3.16% per level beyond 1
    const increase = 1 + (level - 1) * 0.0316;
    return Math.round(baseMP * increase);
}

// Derive element from skill definition for immunity checks
function getSkillElement(skDef) {
    if (!skDef || !skDef.id) return null;
    const id = skDef.id;
    // Fire skills
    if (id.includes('fire') || id.includes('immolation') || id.includes('inferno') ||
        id.includes('meteor') || id.includes('combustion') || id.includes('py_') ||
        id.includes('blaze') || id.includes('armageddon') || id.includes('hellfire') ||
        id.includes('flare') || id.includes('pyro')) return 'fire';
    // Cold skills
    if (id.includes('frost') || id.includes('ice') || id.includes('cold') ||
        id.includes('glacial') || id.includes('blizzard') || id.includes('freez') ||
        id.includes('winter') || id.includes('absolutezero') || id.includes('cy_')) return 'cold';
    // Lightning skills
    if (id.includes('lightning') || id.includes('ltfury') || id.includes('thunder') ||
        id.includes('charged') || id === 's_nova') return 'lightning';
    // Poison skills
    if (id.includes('poison') || id.includes('plague') || id.includes('venom')) return 'poison';
    // Physical/Holy = null (bypasses immunity)
    return null;
}

// ========== SYNERGY ENGINE ==========
function calculateSynergyBonus(skDef, bonusType) {
    if (!skDef.synergies || !Array.isArray(skDef.synergies)) return 0;
    let total = 0;
    for (const syn of skDef.synergies) {
        if (syn.type === bonusType) {
            const fromLevel = player.skillLevels[syn.from] || 0;
            total += fromLevel * syn.bonus;
        }
    }
    return total;
}

// ========== PASSIVE SKILL SYSTEM ==========
function recalcPassives() {
    const bonuses = {
        critChance: 0,
        damagePercent: 0,
        defensePercent: 0,
        attackSpeed: 0,
        moveSpeed: 0,
        manaRegen: 0,
        maxHP: 0,
        maxMP: 0,
        lifeSteal: 0,
        dodgeChance: 0
    };
    const allSkills = getAllAvailableSkills();
    for (const sk of allSkills) {
        if (sk.skillType !== 'passive' || !sk.passiveEffect) continue;
        const lvl = player.skillLevels[sk.id] || 0;
        if (lvl <= 0) continue;
        const pe = sk.passiveEffect;
        const val = pe.baseBonus + pe.perLevel * (lvl - 1);
        if (pe.stat in bonuses) {
            bonuses[pe.stat] += val;
        }
    }
    player.passiveBonuses = bonuses;
}

let skillSelectOpen = false;
let skillSelectSlot = 0;
let skillSwapFrom = 0;
let skillEditMode = 'assign'; // 'assign' | 'swap'
let treeSwapFromSlot = 0;
let skillTreeViewMode = 'tree'; // 'tree' | 'list'

function showSkillSelectUI() {
    skillSelectOpen = true;
    const overlay = DOM.skillSelectOverlay;
    const content = DOM.skillSelectContent;
    const allSkills = getAllAvailableSkills();
    const swapLabel = skillSwapFrom ? `入れ替え: スロット${skillSwapFrom} → 相手を選択` : '入れ替え: 先にスロットを選ぶ';
    const modeLabel = skillEditMode === 'swap' ? '入れ替えモード' : '設定モード';
    let html = '<div style="text-align:center;margin-bottom:12px"><span style="color:#ffd700;font-size:18px;font-weight:bold">スキルセット編集</span><br><span style="color:#aaa;font-size:11px">クリック or 1~6 でスロット選択 / A:設定 / W:入替 / X:外す / R:閉じる</span>';
    html += `<div style="margin-top:6px">
        <button class="toggle-btn ${skillEditMode === 'assign' ? '' : 'off'}" onclick="setSkillEditMode('assign')">設定</button>
        <button class="toggle-btn ${skillEditMode === 'swap' ? '' : 'off'}" onclick="setSkillEditMode('swap')">入れ替え</button>
        <button class="toggle-btn" style="background:#884444;margin-left:6px" onclick="removeSkillSlot()">外す</button>
        <span style="color:#66ccff;font-size:10px;margin-left:6px">${modeLabel}${skillEditMode === 'swap' ? ' / ' + swapLabel : ''}</span>
    </div></div>`;

    // Current slots (icons)
    html += '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:6px">';
    for (let i = 1; i <= 6; i++) {
        const sk = player.skills[i];
        const sel = skillSelectSlot === i;
        const swapFrom = skillSwapFrom === i;
        html += `<div class="skill-slot-pick ${sel ? 'selected' : ''} ${swapFrom ? 'swap-from' : ''}" onclick="pickSlot(${i})" draggable="true"
            ondragstart="onSkillSlotDragStart(event,${i})" ondragover="onSkillSlotDragOver(event)" ondrop="onSkillSlotDrop(event,${i})">
            <div style="display:flex;align-items:center;justify-content:center;width:20px;height:20px">${sk ? `<img src="${getSkillIconDataURL(sk, 20)}" width="20" height="20">` : '□'}</div>
            <div style="font-size:8px;color:#aaa">${i}</div>
        </div>`;
    }
    html += '</div>';
    html += `<div style="text-align:center;margin-bottom:8px;color:#aaa;font-size:11px">選択スロット: ${skillSelectSlot || '-'}</div>`;

    // Slot controls (explicit buttons)
    html += '<div style="display:grid;grid-template-columns:1fr;gap:4px;margin-bottom:8px">';
    for (let i = 1; i <= 6; i++) {
        const sk = player.skills[i];
        const name = sk ? sk.name : '空';
        const swapBtn = skillSwapFrom && skillSwapFrom !== i
            ? `<button class="toggle-btn" onclick="forceSwapSlots(${i})">ここに入替</button>`
            : `<button class="toggle-btn" onclick="beginSwap(${i})">入替開始</button>`;
        html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
            <div style="font-size:11px;color:#bbb">スロット${i}: ${name}</div>
            <div style="display:flex;gap:4px">
                <button class="toggle-btn" onclick="pickSlot(${i})">選択</button>
                <button class="toggle-btn" style="background:#884444" onclick="removeSkillSlot(${i})">外す</button>
                ${swapBtn}
            </div>
        </div>`;
    }
    html += '</div>';

    // Available skills grid
    if (skillSelectSlot > 0) {
        html += `<div style="color:#ffd700;font-size:12px;margin-bottom:8px;text-align:center">スロット${skillSelectSlot}に設定するスキル:</div>`;
        html += '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">';
        for (const sk of allSkills) {
            if (sk.skillType === 'passive') continue; // Passive skills cannot be assigned
            const lvl = player.skillLevels[sk.id] || 0;
            const locked = lvl < 1;
            const displayMP = lvl > 0 ? getSkillMPCost(sk, lvl) : sk.mp;
            html += `<div class="skill-pick-item ${locked ? 'locked' : ''}" onclick="${locked ? '' : `assignSkill('${sk.id}')`}" onmouseenter="showSkillTooltip(event,'${sk.id}')" onmouseleave="hideTooltip()">
                <div style="display:flex;align-items:center;justify-content:center;width:18px;height:18px"><img src="${getSkillIconDataURL(sk, 18)}" width="18" height="18"></div>
                <div style="font-size:9px;color:${locked ? '#666' : '#ffd700'}">${sk.name}</div>
                <div style="font-size:8px;color:${locked ? '#444' : '#88f'}">Lv.${lvl} MP:${displayMP}</div>
            </div>`;
        }
        html += '</div>';
    }

    html += '<div style="text-align:center;margin-top:12px"><button class="close-btn" onclick="closeSkillSelect()">閉じる (R)</button></div>';
    content.innerHTML = html;
    overlay.style.display = 'flex';
}

function swapSkillSlots(a, b) {
    // より確実な入れ替え（deepコピー）
    const tmpA = player.skills[a] ? { ...player.skills[a] } : null;
    const tmpB = player.skills[b] ? { ...player.skills[b] } : null;
    if (tmpB) {
        player.skills[a] = { ...tmpB };
    } else {
        delete player.skills[a];
    }
    if (tmpA) {
        player.skills[b] = { ...tmpA };
    } else {
        delete player.skills[b];
    }
}
function selectOrSwapSkillSlot(slot) {
    const shiftSwap = !!(keysDown['shift'] || keysDown['ShiftLeft'] || keysDown['ShiftRight']);
    if (skillEditMode === 'assign' && !shiftSwap) {
        skillSelectSlot = slot;
        skillSwapFrom = 0;
        showSkillSelectUI();
        return;
    }
    if (!skillSwapFrom) {
        skillSwapFrom = slot;
        skillSelectSlot = slot;
        showSkillSelectUI();
        return;
    }
    if (skillSwapFrom === slot) {
        skillSwapFrom = 0;
        skillSelectSlot = slot;
        showSkillSelectUI();
        return;
    }
    swapSkillSlots(skillSwapFrom, slot);
    skillSwapFrom = 0;
    skillSelectSlot = slot;
    showSkillSelectUI();
}
window.pickSlot = function (slot) {
    selectOrSwapSkillSlot(slot);
};

window.assignSkill = function (skillId) {
    if (skillSelectSlot < 1 || skillSelectSlot > 6) {
        addLog('先にスロットを選択してください', '#ffaa44');
        return;
    }
    const allSkills = getAllAvailableSkills();
    const sk = allSkills.find(s => s.id === skillId);
    if (!sk) return;
    if ((player.skillLevels[sk.id] || 0) < 1) return;
    if (sk.skillType === 'passive') {
        addLog('パッシブスキルはスロットに配置できません', '#ff8844');
        return;
    }
    const slvl = player.skillLevels[sk.id] || 1;
    player.skills[skillSelectSlot] = {
        id: sk.id, name: sk.name, icon: sk.icon, effect: sk.effect, iconEff: sk.iconEff,
        mp: getSkillMPCost(sk, slvl), cooldown: 0, maxCD: getSkillCooldown(sk, slvl), desc: sk.desc
    };
    showSkillSelectUI();
};

window.removeSkillSlot = function (slot) {
    const s = slot || skillSelectSlot;
    if (!s || s < 1 || s > 6) {
        addLog('先にスロットを選択してください', '#ffaa44');
        return;
    }
    if (player.skills[s]) {
        const skillName = player.skills[s].name || 'スキル';
        delete player.skills[s];
        addLog(`スロット${s}から${skillName}を削除`, '#ff8844');
        showSkillSelectUI();
    } else {
        addLog(`スロット${s}は空です`, '#888');
    }
};
window.removeSkillById = function (skillId) {
    let removed = false;
    for (let i = 1; i <= 6; i++) {
        if (player.skills[i] && player.skills[i].id === skillId) {
            delete player.skills[i];
            removed = true;
        }
    }
    if (removed) addLog('ショートカットから外しました', '#ff8844');
    else addLog('ショートカットにありません', '#888');
};
function findSlotBySkillId(skillId) {
    for (let i = 1; i <= 6; i++) {
        if (player.skills[i] && player.skills[i].id === skillId) return i;
    }
    return 0;
}
window.beginTreeSwap = function (skillId) {
    const slot = findSlotBySkillId(skillId);
    if (!slot) {
        addLog('このスキルはショートカットにありません', '#ffaa44');
        return;
    }
    treeSwapFromSlot = slot;
    updateSkillTreeUI();
};
window.cancelTreeSwap = function () {
    treeSwapFromSlot = 0;
    treeSwapFromSkillId = '';
    updateSkillTreeUI();
};
window.treeSwapTo = function (targetSlot) {
    if (!treeSwapFromSlot || treeSwapFromSlot === targetSlot) return;
    swapSkillSlots(treeSwapFromSlot, targetSlot);
    treeSwapFromSlot = 0;
    updateSkillTreeUI();
    addLog('ショートカットを入れ替えました', '#66ff66');
};
window.treeSwapWithSkill = undefined;

window.closeSkillSelect = function () {
    skillSelectOpen = false;
    skillSwapFrom = 0;
    skillEditMode = 'assign';
    DOM.skillSelectOverlay.style.display = 'none';
};
function openSkillEdit() {
    console.log('[openSkillEdit] Called! G.dead:', G.dead, 'G.started:', G.started);
    if (!G.started) {
        console.log('[openSkillEdit] BLOCKED: Game not started');
        return;
    }
    console.log('[openSkillEdit] Opening skill UI...');
    skillSelectSlot = 1;
    skillSwapFrom = 0;
    skillEditMode = 'assign';
    showSkillSelectUI();
}
window.setSkillEditMode = function (mode) {
    skillEditMode = mode === 'swap' ? 'swap' : 'assign';
    skillSwapFrom = 0;
    showSkillSelectUI();
};
window.beginSwap = function (slot) {
    skillEditMode = 'swap';
    skillSwapFrom = slot;
    skillSelectSlot = slot;
    showSkillSelectUI();
};
window.forceSwapSlots = function (targetSlot) {
    if (!skillSwapFrom || skillSwapFrom === targetSlot) return;
    swapSkillSlots(skillSwapFrom, targetSlot);
    skillSwapFrom = 0;
    skillSelectSlot = targetSlot;
    showSkillSelectUI();
};
window.quickAssignSkill = function (skillId) {
    // スキルツリーから直接スロットに割り当て
    const allSkills = getAllAvailableSkills();
    const sk = allSkills.find(s => s.id === skillId);
    if (!sk || (player.skillLevels[sk.id] || 0) < 1) return;
    // Passive skills cannot be assigned to slots
    if (sk.skillType === 'passive') {
        addLog('パッシブスキルはスロットに配置できません（常時発動）', '#ff8844');
        return;
    }

    // 空いているスロットを探す
    let emptySlot = 0;
    for (let i = 1; i <= 6; i++) {
        if (!player.skills[i] || !player.skills[i].id) {
            emptySlot = i;
            break;
        }
    }

    if (emptySlot > 0) {
        // 空きスロットに自動割り当て
        const slvl = player.skillLevels[sk.id] || 1;
        player.skills[emptySlot] = {
            id: sk.id, name: sk.name, icon: sk.icon, effect: sk.effect, iconEff: sk.iconEff,
            mp: getSkillMPCost(sk, slvl), cooldown: 0, maxCD: getSkillCooldown(sk, slvl), desc: sk.desc
        };
        addLog(`${sk.name} をスロット${emptySlot}に設定！`, '#66ff66');
    } else {
        // 空きがない場合はスロット選択画面を開く
        addLog('スロットが満杯です。入れ替えてください', '#ffaa44');
        skillSelectSlot = 1;
        skillSwapFrom = 0;
        skillEditMode = 'assign';
        showSkillSelectUI();
    }
};
window.onSkillSlotDragStart = function (e, slot) {
    if (!e || !e.dataTransfer) return;
    e.dataTransfer.setData('text/plain', String(slot));
    e.dataTransfer.effectAllowed = 'move';
};
window.onSkillSlotDragOver = function (e) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
};
window.onSkillSlotDrop = function (e, slot) {
    e.preventDefault();
    if (!e || !e.dataTransfer) return;
    const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!from || from === slot) return;
    swapSkillSlots(from, slot);
    skillSwapFrom = 0;
    skillSelectSlot = slot;
    showSkillSelectUI();
};

function renderTitleSaveMenu() {
    if (!DOM.titleSaveContent) return;
    let html = '';
    for (let i = 1; i <= SAVE_SLOT_COUNT; i++) {
        const meta = getSaveMeta(i);
        const active = G.saveSlot === i;
        const info = meta
            ? `Lv.${meta.level} / ${meta.act ? 'ACT' + meta.act : 'B' + meta.floor + 'F'}${meta.cycle ? ' (' + (meta.cycle + 1) + '周目)' : ''} / ${meta.className}`
            : '空';
        const time = meta && meta.timestamp
            ? new Date(meta.timestamp).toLocaleString('ja-JP')
            : '';
        html += `<div class="title-save-row">
            <div>
                <div style="color:#ddb27a;font-size:12px">スロット${i}${active ? ' ★' : ''}</div>
                <div class="title-save-info">${info}${time ? ' / ' + time : ''}</div>
            </div>
            <div class="title-save-actions">
                <button class="toggle-btn ${active ? '' : 'off'}" onclick="setSaveSlot(${i})">選択</button>
                ${meta ? `<button class="toggle-btn" onclick="loadGame(${i})">ロード</button>` : ''}
                <button class="toggle-btn" onclick="startNewGame(${i})">新規</button>
            </div>
        </div>`;
    }
    DOM.titleSaveContent.innerHTML = html;
}

window.startNewGame = function (slot) {
    setSaveSlot(slot);
    if (hasSaveData(slot)) {
        const ok = confirm(`スロット${slot}にはセーブがあります。新規開始しますか？`);
        if (!ok) return;
    }
    showClassSelect();
};


// ========== COLLISION HELPER ==========
// Check if a circle at (px, py) with radius r can stand on walkable tiles
function canWalk(px, py, r) {
    // Check the 4 cardinal edge points + center
    const points = [
        [px, py],
        [px - r, py], [px + r, py],
        [px, py - r], [px, py + r]
    ];
    for (const [x, y] of points) {
        const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
        if (!dungeon.walkable(tx, ty)) return false;
    }
    return true;
}

// ========== PATHFINDING (A*) ==========
// Click-to-move feels "Diablo-like" only when characters can route around walls smoothly.
// We path on the dungeon tile grid and drive movement via waypoint centers in world pixels.
function _isTileWalkable(tx, ty) {
    return dungeon && typeof dungeon.walkable === 'function' ? dungeon.walkable(tx, ty) : false;
}
function _findNearestWalkableTile(tx, ty, maxR = 6) {
    if (_isTileWalkable(tx, ty)) return { tx, ty };
    for (let r = 1; r <= maxR; r++) {
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // ring only
                const nx = tx + dx, ny = ty + dy;
                if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
                if (_isTileWalkable(nx, ny)) return { tx: nx, ty: ny };
            }
        }
    }
    return null;
}
function _aStarPath(startTx, startTy, goalTx, goalTy, maxExpanded = 3500) {
    // 4-way movement (D2-ish grid routing).
    const start = _findNearestWalkableTile(startTx, startTy, 2);
    const goal = _findNearestWalkableTile(goalTx, goalTy, 6);
    if (!start || !goal) return null;
    if (start.tx === goal.tx && start.ty === goal.ty) return [{ tx: start.tx, ty: start.ty }];

    const idx = (x, y) => y * MAP_W + x;
    const h = (x, y) => Math.abs(x - goal.tx) + Math.abs(y - goal.ty);

    const open = [];
    const cameFrom = new Int32Array(MAP_W * MAP_H);
    cameFrom.fill(-1);
    const gScore = new Float32Array(MAP_W * MAP_H);
    gScore.fill(Infinity);
    const fScore = new Float32Array(MAP_W * MAP_H);
    fScore.fill(Infinity);
    const inOpen = new Uint8Array(MAP_W * MAP_H);

    const sI = idx(start.tx, start.ty);
    gScore[sI] = 0;
    fScore[sI] = h(start.tx, start.ty);
    open.push({ x: start.tx, y: start.ty, f: fScore[sI] });
    inOpen[sI] = 1;

    let expanded = 0;
    while (open.length > 0 && expanded < maxExpanded) {
        // Pick best f (small grid; linear scan is fine).
        let best = 0;
        for (let i = 1; i < open.length; i++) if (open[i].f < open[best].f) best = i;
        const cur = open[best];
        open[best] = open[open.length - 1];
        open.pop();
        inOpen[idx(cur.x, cur.y)] = 0;
        expanded++;

        if (cur.x === goal.tx && cur.y === goal.ty) {
            // Reconstruct
            const path = [];
            let ci = idx(cur.x, cur.y);
            while (ci !== -1) {
                const x = ci % MAP_W;
                const y = (ci / MAP_W) | 0;
                path.push({ tx: x, ty: y });
                ci = cameFrom[ci];
            }
            path.reverse();
            return path;
        }

        const curI = idx(cur.x, cur.y);
        const baseG = gScore[curI];
        const nbs = [
            [cur.x + 1, cur.y],
            [cur.x - 1, cur.y],
            [cur.x, cur.y + 1],
            [cur.x, cur.y - 1]
        ];
        for (const [nx, ny] of nbs) {
            if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
            if (!_isTileWalkable(nx, ny)) continue;
            const ni = idx(nx, ny);
            const tentativeG = baseG + 1;
            if (tentativeG >= gScore[ni]) continue;
            cameFrom[ni] = curI;
            gScore[ni] = tentativeG;
            fScore[ni] = tentativeG + h(nx, ny);
            if (!inOpen[ni]) {
                inOpen[ni] = 1;
                open.push({ x: nx, y: ny, f: fScore[ni] });
            }
        }
    }
    return null;
}

// ========== GROUND ITEMS ==========
const groundItems = [];
class GroundItem {
    constructor(x, y, item) {
        this.x = x; this.y = y;
        this.item = item;
        this.bobT = randf(0, Math.PI * 2);
    }
}
function dropItem(x, y, item) {
    groundItems.push(new GroundItem(x + randf(-15, 15), y + randf(-15, 15), item));
}

// ========== PLAYER ==========
const player = {
    x: 0, y: 0,
    targetX: 0, targetY: 0,
    radius: 14,
    speed: 160,
    vx: 0, vy: 0, // 現在の速度ベクトル（慣性用）
    acceleration: 2500, // 加速度（ハクスラ用に高速）
    deceleration: 3000, // 減速度（キビキビ感）
    moving: false,
    // Click-move path (tile-based A*). Waypoints are in world pixels.
    path: null, // [{x,y}, ...]
    pathIdx: 0,
    _pathGoalX: 0,
    _pathGoalY: 0,
    _stuckT: 0,
    _attackRepathT: 0,
    targetBreakProp: null, // {tx, ty}
    attacking: false,
    attackTarget: null,
    attackCooldown: 0,
    attackAnimT: 0,
    whirlwindT: 0,

    // Stats
    level: 1,
    xp: 0,
    xpToNext: 100,
    statPoints: 0,
    str: 10, dex: 10, vit: 10, int: 10,

    hp: 100, maxHP: 100,
    mp: 50, maxMP: 50,
    defense: 2,
    critChance: 5,

    // Equipment
    equipment: { weapon: null, offhand: null, head: null, body: null, ring: null, amulet: null, feet: null },
    inventory: [], // 装備タブ max 20
    potionInv: [], // ポーションタブ max 16
    charmInv: [], // チャームタブ max 12 (パッシブ効果)
    maxInv: 20,
    maxPotionInv: 16,
    maxCharmInv: 12,
    invTab: 0, // 0=装備, 1=ポーション, 2=チャーム

    // Passive bonuses (recalculated by recalcPassives)
    passiveBonuses: { critChance: 0, damagePercent: 0, defensePercent: 0, attackSpeed: 0, moveSpeed: 0, manaRegen: 0, maxHP: 0, maxMP: 0, lifeSteal: 0, dodgeChance: 0 },

    // Skills
    selectedSkill: 1,
    freezeT: 0, // freeze nova effect timer
    shieldT: 0, // magic shield timer
    meteorT: 0, // meteor delay
    berserkT: 0,
    dodgeT: 0,
    dodgeChance: 0,
    manaShieldT: 0,
    manaShieldAbsorb: 0,
    shieldReduction: 0.5,
    counterT: 0, counterReflect: 0,
    speedBuffT: 0, speedBuffBonus: 0,
    poisonBuffT: 0, poisonDps: 0,
    atkSpdBuffT: 0, atkSpdBonus: 0,
    lifestealBuffT: 0, lifestealBuffPct: 0,
    undyingT: 0,
    potionHealT: 0, potionHealPerSec: 0,
    potionManaT: 0, potionManaPerSec: 0,
    stealthT: 0,
    critBuffT: 0, critBuffBonus: 0,
    auraT: 0, auraRegen: 0, auraReduction: 0,
    attackTimer: 0,
    battleOrdersT: 0, battleOrdersHP: 0, battleOrdersMP: 0,
    skillPoints: 0,
    skillLevels: {},
    classKey: 'warrior',
    className: '戦士',
    skills: {
        // 初期は空 - プレイヤーが自分で設定する
    },

    setMoveTarget(wx, wy) {
        this._pathGoalX = wx;
        this._pathGoalY = wy;
        const stx = Math.floor(this.x / TILE), sty = Math.floor(this.y / TILE);
        const gtx = Math.floor(wx / TILE), gty = Math.floor(wy / TILE);
        const tiles = _aStarPath(stx, sty, gtx, gty);
        if (tiles && tiles.length > 0) {
            const pts = [];
            for (const t of tiles) {
                pts.push({ x: t.tx * TILE + TILE / 2, y: t.ty * TILE + TILE / 2 });
            }
            this.path = pts;
            this.pathIdx = 0;
        } else {
            // Fallback: direct target (might get stuck; player can re-click).
            this.path = null;
            this.pathIdx = 0;
        }
        this.targetX = wx;
        this.targetY = wy;
        this.moving = true;
    },

    getWeaponReach() {
        const w = this.equipment.weapon;
        const t = w ? w.typeKey : null;
        if (t === 'staff') return 62;
        if (t === 'axe') return 54;
        if (t === 'sword') return 52;
        return 50;
    },

    getAttackDmg() {
        const totalInt = this.getTotalStat('int');
        const totalStr = this.getTotalStat('str');
        let base = Math.max(totalStr * 0.8, totalInt * 0.6) + 5;
        const w = this.equipment.weapon;
        if (w && w.baseDmg) base += rand(w.baseDmg[0], w.baseDmg[1]);
        // Affix bonuses
        let dmgPct = 0;
        for (const slot of Object.values(this.equipment)) {
            if (!slot) continue;
            for (const a of slot.affixes) {
                if (a.stat === 'dmgPct') dmgPct += a.value;
            }
        }
        // Set bonus damage
        dmgPct += (this.setBonuses && this.setBonuses.dmgPct) || 0;
        // Charm damage bonuses
        for (const charm of this.charmInv) {
            for (const a of (charm.affixes || [])) {
                if (a.stat === 'dmgPct') dmgPct += a.value;
            }
        }
        let finalDmg = Math.round(base * (1 + dmgPct / 100));
        if (this.berserkT > 0) finalDmg = Math.round(finalDmg * 1.5);
        return finalDmg;
    },

    getDefense() {
        let def = this.defense;
        for (const slot of Object.values(this.equipment)) {
            if (!slot) continue;
            if (slot.baseDef) def += slot.baseDef;
            for (const a of slot.affixes) {
                if (a.stat === 'def') def += a.value;
            }
        }
        // Charm defense bonuses
        for (const charm of this.charmInv) {
            if (!charm || !charm.affixes) continue;
            for (const a of charm.affixes) { if (a.stat === 'def') def += a.value; }
        }
        // Set bonus defense
        def += (this.setBonuses && this.setBonuses.def) || 0;
        const defPct = (this.passiveBonuses && this.passiveBonuses.defensePercent) || 0;
        if (defPct > 0) def = Math.round(def * (1 + defPct / 100));
        return def;
    },

    getTotalStat(stat) {
        let val = this[stat];
        for (const slot of Object.values(this.equipment)) {
            if (!slot) continue;
            for (const a of slot.affixes) {
                if (a.stat === stat) val += a.value;
            }
        }
        // Charm stat bonuses
        for (const charm of this.charmInv) {
            for (const a of (charm.affixes || [])) {
                if (a.stat === stat) val += a.value;
            }
        }
        return val;
    },

    getCritChance() {
        let c = this.critChance + this.getTotalStat('dex') * 0.3;
        const inStealth = this.stealthT > 0;
        if (inStealth) c = 100;
        if (this.critBuffT > 0) c += (this.critBuffBonus || 0);
        for (const slot of Object.values(this.equipment)) {
            if (!slot) continue;
            for (const a of slot.affixes) {
                if (a.stat === 'critChance') c += a.value;
            }
        }
        // Passive bonus
        c += (this.passiveBonuses && this.passiveBonuses.critChance) || 0;
        // Set bonus
        c += (this.setBonuses && this.setBonuses.critChance) || 0;
        // Charm crit bonuses
        for (const charm of this.charmInv) {
            for (const a of (charm.affixes || [])) {
                if (a.stat === 'critChance') c += a.value;
            }
        }
        return inStealth ? 100 : Math.min(c, 80); // Stealth guarantees 100%, otherwise cap at 80%
    },

    getCritDamage() {
        let cd = 150; // Base 150% (1.5x)
        for (const slot of Object.values(this.equipment)) {
            if (!slot) continue;
            for (const a of slot.affixes) {
                if (a.stat === 'critDmg') cd += a.value;
            }
        }
        cd += (this.passiveBonuses && this.passiveBonuses.critDamage) || 0;
        return cd;
    },

    getLifesteal() {
        let ls = 0;
        for (const slot of Object.values(this.equipment)) {
            if (!slot) continue;
            for (const a of slot.affixes) {
                if (a.stat === 'lifesteal') ls += a.value;
            }
        }
        // Passive bonus
        ls += (this.passiveBonuses && this.passiveBonuses.lifeSteal) || 0;
        // Set bonus
        ls += (this.setBonuses && this.setBonuses.lifesteal) || 0;
        return ls;
    },

    getResistance(element) {
        let res = 0;
        const resMap = { fire: 'fireRes', cold: 'coldRes', lightning: 'lightRes', poison: 'poisonRes' };
        const statKey = resMap[element];
        if (!statKey) return 0;
        for (const slot of Object.values(this.equipment)) {
            if (!slot) continue;
            for (const a of slot.affixes) {
                if (a.stat === statKey) res += a.value;
                if (a.stat === 'allRes') res += a.value;
            }
        }
        // Set bonus allRes
        res += (this.setBonuses && this.setBonuses.allRes) || 0;
        // Charm resistance bonuses
        for (const charm of this.charmInv) {
            for (const a of (charm.affixes || [])) {
                if (a.stat === statKey) res += a.value;
                if (a.stat === 'allRes') res += a.value;
            }
        }
        // Difficulty penalty (Nightmare: -20, Hell: -50)
        res -= (DIFFICULTY_DEFS[G.difficulty || 'normal'].respenalty || 0);
        return Math.min(Math.max(res, -100), 75); // Cap at 75%, can go negative
    },

    getBlockChance() {
        const shield = this.equipment.offhand;
        if (!shield || shield.typeKey !== 'shield') return 0;
        let block = 15; // Base shield block chance
        for (const a of shield.affixes) {
            if (a.stat === 'blockChance') block += a.value;
        }
        // DEX bonus: +0.1% per dex
        block += this.getTotalStat('dex') * 0.1;
        // Set bonus
        block += (this.setBonuses && this.setBonuses.blockChance) || 0;
        return Math.min(block, 75); // Cap at 75%
    },

    getMagicFind() {
        let mf = 0;
        for (const slot of Object.values(this.equipment)) {
            if (!slot) continue;
            for (const a of slot.affixes) {
                if (a.stat === 'magicFind') mf += a.value;
            }
        }
        for (const charm of this.charmInv) {
            if (!charm || !charm.affixes) continue;
            for (const a of charm.affixes) {
                if (a.stat === 'magicFind') mf += a.value;
            }
        }
        return mf;
    },

    getSkillBonus() {
        let sb = 0;
        for (const slot of Object.values(this.equipment)) {
            if (!slot) continue;
            for (const a of slot.affixes) {
                if (a.stat === 'skillBonus') sb += a.value;
            }
        }
        return sb;
    },

    recalcStats() {
        // Clear Battle Orders boost before recalc to prevent corruption
        if (this.battleOrdersHP > 0) {
            this.battleOrdersHP = 0;
            this.battleOrdersMP = 0;
            this.battleOrdersT = 0;
        }
        // Recalculate passive bonuses first
        recalcPassives();
        const pb = this.passiveBonuses || {};

        let bonusHP = 0, bonusMP = 0, bonusSpd = 0;
        for (const slot of Object.values(this.equipment)) {
            if (!slot) continue;
            for (const a of slot.affixes) {
                if (a.stat === 'hp') bonusHP += a.value;
                if (a.stat === 'mp') bonusMP += a.value;
                if (a.stat === 'vit') bonusHP += a.value * 5;
                if (a.stat === 'int') bonusMP += a.value * 3;
                if (a.stat === 'moveSpd') bonusSpd += a.value;
            }
        }
        // Charm inventory passive bonuses
        for (const charm of this.charmInv) {
            if (!charm || !charm.affixes) continue;
            for (const a of charm.affixes) {
                if (a.stat === 'hp') bonusHP += a.value;
                if (a.stat === 'mp') bonusMP += a.value;
                if (a.stat === 'vit') bonusHP += a.value * 5;
                if (a.stat === 'int') bonusMP += a.value * 3;
                if (a.stat === 'moveSpd') bonusSpd += a.value;
            }
        }
        // Apply set bonuses
        const setBonuses = getActiveSetBonuses();
        bonusHP += (setBonuses.hp || 0);
        bonusMP += (setBonuses.mp || 0);
        bonusSpd += (setBonuses.moveSpd || 0);

        this.maxHP = 80 + this.vit * 5 + this.level * 10 + bonusHP + (pb.maxHP || 0);
        this.maxMP = 30 + this.int * 3 + this.level * 5 + bonusMP + (pb.maxMP || 0);
        this.speed = 160 * (1 + bonusSpd / 100) * (1 + (this.speedBuffBonus || 0)) * (1 + (pb.moveSpeed || 0) / 100);
        this.hp = Math.min(this.hp, this.maxHP);
        this.mp = Math.min(this.mp, this.maxMP);
        this.setBonuses = setBonuses; // Cache for display
    },

    addXP(amount) {
        // Difficulty XP multiplier
        amount = Math.round(amount * (DIFFICULTY_DEFS[G.difficulty || 'normal'].xpMult || 1));
        this.xp += amount;
        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            this.statPoints += 5;
            this.skillPoints = (this.skillPoints || 0) + 1;
            this.xpToNext = getXPForLevel(this.level);
            this.recalcStats();
            this.hp = this.maxHP;
            this.mp = this.maxMP;
            sfxLevelUp();
            showLevelUp();
            addLog(`レベル ${this.level} に上がった！`, '#ffd700');
            checkPromotion();
        }
    },

    takeDamage(raw, element, attackerLevel, attackerAR) {
        // D2-style hit check (monster attacking player) - only for melee/physical
        if (attackerLevel && attackerAR) {
            const pDef = this.getDefense();
            // Player defense already reduces damage in this game; still, allow it to matter for hit checks too.
            // (We compensate by keeping monster AR fairly modest at low levels.)
            const hitChance = calcHitChance(attackerLevel, attackerAR, this.level, pDef, 1.0);
            if (Math.random() * 100 >= hitChance) {
                addFloatingText(this.x, this.y - 20, 'MISS', '#888888');
                return;
            }
        }
        const def = this.getDefense();
        let dmg = Math.max(1, Math.round(raw * (100 / (100 + def))));
        // Elemental resistance reduction
        if (element) {
            const res = this.getResistance(element);
            if (res > 0) {
                dmg = Math.max(1, Math.round(dmg * (1 - res / 100)));
            }
        }
        // Shield block check
        const blockChance = this.getBlockChance();
        if (blockChance > 0 && Math.random() * 100 < blockChance) {
            addFloatingText(this.x, this.y - 20, 'BLOCK!', '#88aaff');
            emitParticles(this.x, this.y, '#88aaff', 6, 40, 0.2, 2, -30);
            sfxPlayerHit();
            return;
        }
        // Dodge check
        const totalDodge = (this.dodgeT > 0 ? (this.dodgeChance || 0) : 0) + ((this.passiveBonuses && this.passiveBonuses.dodgeChance) || 0);
        if (totalDodge > 0 && Math.random() * 100 < totalDodge) {
            addFloatingText(this.x, this.y - 20, 'DODGE!', '#aaffaa');
            emitParticles(this.x, this.y, '#aaffaa', 5, 40, 0.2, 2, -30);
            return;
        }
        // Berserk increases damage taken
        if (this.berserkT > 0) dmg = Math.round(dmg * 1.3);
        // Magic Shield reduces damage (uses skill-based reduction)
        if (this.shieldT > 0) {
            dmg = Math.max(1, Math.round(dmg * (1 - (this.shieldReduction || 0.35))));
            emitParticles(this.x, this.y, '#8888ff', 4, 40, 0.2, 2, -30);
        }
        // Mana Shield - absorb damage with MP
        if (this.manaShieldT > 0 && this.mp > 0) {
            const absorbed = Math.round(dmg * (this.manaShieldAbsorb || 0.5));
            const mpCost = absorbed;
            if (this.mp >= mpCost) {
                this.mp -= mpCost;
                dmg -= absorbed;
                emitParticles(this.x, this.y, '#4488ff', 4, 40, 0.2, 2, -30);
            }
        }
        this.hp -= dmg;
        addFloatingText(this.x, this.y - 20, dmg, '#ff4444');
        emitParticles(this.x, this.y, '#ff0000', 8, 80, 0.4, 3);
        emitParticles(this.x, this.y, '#880000', 4, 40, 0.3, 2, 100);
        G.shakeT = 0.2; G.shakeAmt = 10; // Diablo風：2倍
        G.dmgFlashT = 0.35; // Screen blood flash
        // Cancel town portal on hit
        if (G.portalCasting) { G.portalCasting = false; G.portalTimer = 0; addLog('帰還が中断された！', '#ff4444'); }
        // Counter-attack
        if (this.counterT > 0 && this.counterReflect > 0) {
            const reflectDmg = Math.round(raw * this.counterReflect);
            // Find nearest monster
            let nearest = null, nearD = 100;
            for (const m of monsters) {
                if (!m.alive) continue;
                const d = dist(this.x, this.y, m.x, m.y);
                if (d < nearD) { nearD = d; nearest = m; }
            }
            if (nearest) {
                monsterTakeDmg(nearest, reflectDmg, false);
                addFloatingText(nearest.x, nearest.y - 20, '反撃!' + reflectDmg, '#ffcc44');
                emitParticles(nearest.x, nearest.y, '#ffcc44', 6, 40, 0.3, 2, 0);
            }
        }
        sfxPlayerHit();
        if (this.hp <= 0) {
            if (this.undyingT > 0) {
                this.hp = 1;
                this.undyingT = 0;
                addFloatingText(this.x, this.y - 30, '不死身！', '#ffd700');
                emitParticles(this.x, this.y, '#ffd700', 20, 80, 0.6, 4, -40);
            } else {
                this.hp = 0;
                G.dead = true;
                sfxDeath();
                DOM.deathScreen.style.display = 'flex';
            }
        }
    },

    pickupNearby() {
        for (let i = groundItems.length - 1; i >= 0; i--) {
            const gi = groundItems[i];
            if (dist(this.x, this.y, gi.x, gi.y) < 50) {
                if (isPotion(gi.item)) {
                    // Potions go to potionInv
                    const stackIdx = findPotionStack(this.potionInv, gi.item.typeKey);
                    if (stackIdx !== -1) {
                        this.potionInv[stackIdx].qty = (this.potionInv[stackIdx].qty || 1) + 1;
                    } else if (this.potionInv.length < this.maxPotionInv) {
                        gi.item.qty = 1;
                        this.potionInv.push(gi.item);
                    } else {
                        addLog('ポーション欄が一杯です！', '#ff4444'); return;
                    }
                    sfxPickup();
                    addLog(`${gi.item.name} を拾った`, '#88ff88');
                } else if (isCharm(gi.item)) {
                    // Charms go to charmInv
                    if (this.charmInv.length < this.maxCharmInv) {
                        this.charmInv.push(gi.item);
                        sfxPickup();
                        addLog(`${gi.item.name} を拾った`, '#88ff88');
                        this.recalcStats();
                    } else {
                        addLog('チャーム欄が一杯です！', '#ff4444'); return;
                    }
                } else if (gi.item.uberKeyId) {
                    // Quest keys go to separate storage, not inventory
                    G.questItems.push(gi.item);
                    sfxPickup(); sfxLegendary();
                    addLog(`★ ${gi.item.name} を獲得！（キーアイテム欄）`, gi.item.rarity.color);
                } else if (this.inventory.length < this.maxInv) {
                    this.inventory.push(gi.item);
                    sfxPickup();
                    if (gi.item.rarityKey === 'legendary' || gi.item.rarityKey === 'unique' || gi.item.rarityKey === 'runeword') sfxLegendary();
                    addLog(`${gi.item.name} を拾った`, gi.item.rarity.color);
                } else {
                    addLog('インベントリが一杯です！', '#ff4444');
                    return;
                }
                groundItems.splice(i, 1);
            }
        }
    },

    equipItem(invIdx) {
        const item = this.inventory[invIdx];
        if (!item || !item.typeInfo.slot) return;
        // Item level requirement check
        if (item.requiredLevel && this.level < item.requiredLevel) {
            addLog(`レベル ${item.requiredLevel} 以上が必要です！`, '#ff4444');
            return;
        }
        const slot = item.typeInfo.slot;
        const prev = this.equipment[slot];
        this.equipment[slot] = item;
        this.inventory.splice(invIdx, 1);
        if (prev) this.inventory.push(prev);
        this.recalcStats();
        addLog(`${item.name} を装備した`, item.rarity.color);
    },

    unequipSlot(slot) {
        if (!this.equipment[slot]) return;
        if (this.inventory.length >= this.maxInv) { addLog('インベントリが一杯！', '#ff4444'); return; }
        const item = this.equipment[slot];
        this.inventory.push(item);
        this.equipment[slot] = null;
        this.recalcStats();
        addLog(`${item.name} を外した`, '#aaa');
    },

    useHPPotion() {
        // Search potionInv for best HP potion: prefer rejuv, then highest tier
        let idx = this.potionInv.findIndex(it => isRejuvPotion(it));
        if (idx === -1) {
            for (const tk of [...HP_POTION_TYPES].reverse().concat(['potion'])) {
                idx = this.potionInv.findIndex(it => it.typeKey === tk);
                if (idx !== -1) break;
            }
        }
        if (idx === -1) { addLog('HP回復薬がない', '#ff4444'); return; }
        if (this.hp >= this.maxHP) { addLog('HPは満タン', '#888'); return; }
        const item = this.potionInv[idx];
        if (isRejuvPotion(item)) {
            // Rejuvenation: instant
            const pct = item.typeInfo.rejuvPct || 0.35;
            const heal = Math.round(this.maxHP * pct);
            const mana = Math.round(this.maxMP * pct);
            this.hp = Math.min(this.maxHP, this.hp + heal);
            this.mp = Math.min(this.maxMP, this.mp + mana);
            addFloatingText(this.x, this.y - 20, `+${heal} HP +${mana} MP`, '#dd44ff');
            emitParticles(this.x, this.y, '#dd44ff', 10, 50, 0.5, 3, -50);
            sfxHeal();
            addLog(`${item.name}を使った (+${heal} HP +${mana} MP)`, '#dd44ff');
        } else {
            // Over-time HP heal (D2-style)
            const heal = item.typeInfo.heal || 45;
            const dur = item.typeInfo.healDur || 7;
            this.potionHealT = dur;
            this.potionHealPerSec = heal / dur;
            addFloatingText(this.x, this.y - 20, `HP回復中...`, '#00ff00');
            emitParticles(this.x, this.y, '#00ff00', 6, 40, 0.4, 2, -50);
            sfxHeal();
            addLog(`${item.name}を使った (${heal} HP / ${dur}秒)`, '#00ff00');
        }
        item.qty = (item.qty || 1) - 1;
        if (item.qty <= 0) this.potionInv.splice(idx, 1);
    },

    useMPPotion() {
        // Search potionInv for best MP potion
        let idx = this.potionInv.findIndex(it => isRejuvPotion(it));
        if (idx === -1) {
            for (const tk of [...MP_POTION_TYPES].reverse().concat(['manaPotion'])) {
                idx = this.potionInv.findIndex(it => it.typeKey === tk);
                if (idx !== -1) break;
            }
        }
        if (idx === -1) { addLog('MP回復薬がない', '#ff4444'); return; }
        if (this.mp >= this.maxMP) { addLog('MPは満タン', '#888'); return; }
        const item = this.potionInv[idx];
        if (isRejuvPotion(item)) {
            const pct = item.typeInfo.rejuvPct || 0.35;
            const heal = Math.round(this.maxHP * pct);
            const mana = Math.round(this.maxMP * pct);
            this.hp = Math.min(this.maxHP, this.hp + heal);
            this.mp = Math.min(this.maxMP, this.mp + mana);
            addFloatingText(this.x, this.y - 20, `+${heal} HP +${mana} MP`, '#dd44ff');
            emitParticles(this.x, this.y, '#dd44ff', 10, 50, 0.5, 3, -50);
            sfxHeal();
            addLog(`${item.name}を使った (+${heal} HP +${mana} MP)`, '#dd44ff');
        } else {
            const heal = item.typeInfo.healMP || 30;
            const dur = item.typeInfo.healDur || 5;
            this.potionManaT = dur;
            this.potionManaPerSec = heal / dur;
            addFloatingText(this.x, this.y - 20, `MP回復中...`, '#4488ff');
            emitParticles(this.x, this.y, '#4488ff', 6, 40, 0.4, 2, -50);
            sfxHeal();
            addLog(`${item.name}を使った (${heal} MP / ${dur}秒)`, '#4488ff');
        }
        item.qty = (item.qty || 1) - 1;
        if (item.qty <= 0) this.potionInv.splice(idx, 1);
    },

    useSkill(mx, my) {
        const sk = this.skills[this.selectedSkill];
        if (!sk || sk.cooldown > 0) return;
        const allAvail = getAllAvailableSkills();
        const skDef = allAvail.find(s => s.id === sk.id);
        if (!skDef) return;
        let lvl = this.skillLevels[sk.id] || 0;
        if (lvl < 1) { addLog('スキル未習得！(Tでスキルツリーを開く)', '#ff4444'); return; }
        // Apply +skill bonus from equipment
        const itemSkillBonus = this.getSkillBonus() + ((this.setBonuses && this.setBonuses.skillBonus) || 0);
        lvl = Math.min(20, lvl + itemSkillBonus);
        // Base-class (tier0) skills get a small "legacy mastery" boost after promotion so they stay relevant.
        const legacy = getLegacySkillTuning(skDef);
        // Use scaled MP cost
        const mpCost = Math.round(getSkillMPCost(skDef, lvl) * legacy.mpCostMult);
        if (this.mp < mpCost) return;

        this.mp -= mpCost;
        sk.cooldown = getSkillCooldown(skDef, lvl) * legacy.cdMult;

        const wp = screenToWorld(mx, my);
        const wx = wp.x, wy = wp.y;
        let dmg = this.getAttackDmg();
        dmg *= legacy.dmgMult;
        // Apply passive damage bonus
        const pb = this.passiveBonuses || {};
        dmg *= (1 + (pb.damagePercent || 0) / 100);
        // Synergy damage bonus for this skill
        const synDmg = calculateSynergyBonus(skDef, 'damage');
        const synDur = calculateSynergyBonus(skDef, 'duration');
        const synRange = calculateSynergyBonus(skDef, 'range');
        const synFreeze = calculateSynergyBonus(skDef, 'freeze');
        const synHeal = calculateSynergyBonus(skDef, 'heal');

        switch (skDef.effect) {
            case 'melee_burst': {
                const mult = getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                sfxHit();
                let hitMonster = false;
                for (const m of monsters) {
                    if (m.alive && dist(this.x, this.y, m.x, m.y) < skDef.range) {
                        const isCrit = Math.random() * 100 < this.getCritChance();
                        const d = dmg * mult * (isCrit ? this.getCritDamage() / 100 : 1);
                        monsterTakeDmg(m, d, isCrit);
                        hitMonster = true;
                        break; // Single target
                    }
                }
                if (!hitMonster) tryBreakNearbyDungeonProps(this.x, this.y, skDef.range || 60, 1);
                this.attackAnimT = 0.3;
                emitParticles(this.x, this.y, '#ffaa44', 10, 80, 0.4, 4, 0, 'physical', lvl);
                break;
            }
            case 'whirlwind': {
                this.whirlwindT = 0.6;
                sfxWhirlwind();
                const mult = getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                let hitCount = 0;
                for (const m of monsters) {
                    if (m.alive && dist(this.x, this.y, m.x, m.y) < skDef.range) {
                        const isCrit = Math.random() * 100 < this.getCritChance();
                        monsterTakeDmg(m, dmg * mult * (isCrit ? player.getCritDamage() / 100 : 1), isCrit);
                        hitCount++;
                    }
                }
                if (hitCount === 0) tryBreakNearbyDungeonProps(this.x, this.y, skDef.range || 100, 2);
                emitParticles(this.x, this.y, '#88aaff', 20, 100, 0.5, 4, 0, 'physical', lvl);
                break;
            }
            case 'buff_berserk': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.berserkT = dur;
                playSound(200, 'sawtooth', 0.3, 0.1);
                emitParticles(this.x, this.y, '#ff4400', 20, 80, 0.6, 4, -30, 'fire', lvl);
                addLog(`狂戦士モード！(${Math.round(dur * 10) / 10}秒)`, '#ff4400');
                break;
            }
            case 'stun_aoe': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                playSound(150, 'square', 0.2, 0.1);
                const stunRange = (skDef.range || 120) * (1 + synRange);
                for (const m of monsters) {
                    if (m.alive && dist(this.x, this.y, m.x, m.y) < stunRange) {
                        m.frozenT = Math.max(m.frozenT || 0, dur);
                        m.spd = 0;
                    }
                }
                emitParticles(this.x, this.y, '#ffdd88', 15, 130, 0.4, 3, 0, 'physical', lvl);
                addLog('雄叫び！敵が怯んだ！', '#ffdd88');
                break;
            }
            case 'buff_defense': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.shieldT = dur;
                this.shieldReduction = getSkillValue(skDef, 'reduction', lvl);
                sfxShield();
                emitParticles(this.x, this.y, '#aaaaff', 12, 50, 0.5, 3, -40, 'arcane', lvl);
                addLog(`鉄壁発動！(${Math.round(dur * 10) / 10}秒)`, '#aaaaff');
                break;
            }
            case 'charge': {
                const angle = Math.atan2(wy - this.y, wx - this.x);
                const chargeDist = Math.min(dist(this.x, this.y, wx, wy), skDef.range);
                const nx = this.x + Math.cos(angle) * chargeDist;
                const ny = this.y + Math.sin(angle) * chargeDist;
                if (canWalk(nx, ny, 10)) { this.x = nx; this.y = ny; }
                sfxHit();
                const mult = getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                for (const m of monsters) {
                    if (m.alive && dist(this.x, this.y, m.x, m.y) < 60) {
                        monsterTakeDmg(m, dmg * mult, false);
                    }
                }
                emitParticles(this.x, this.y, '#ffcc44', 15, 100, 0.4, 3, 0, 'physical', lvl);
                G.shakeT = 0.15; G.shakeAmt = 8; // Diablo風：2倍
                break;
            }
            case 'projectile_fire': {
                sfxFireball();
                const mult = getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                const spd = skDef.speed || 350;
                // Determine attribute from skill ID
                let attr = null;
                if (skDef.id && (skDef.id.includes('fire') || skDef.id.includes('immolation'))) attr = 'fire';
                else if (skDef.id && (skDef.id.includes('cold') || skDef.id.includes('ice') || skDef.id.includes('frost'))) attr = 'ice';
                else if (skDef.id && skDef.id.includes('lightning')) attr = 'lightning';
                else attr = 'arcane'; // Default to arcane for other projectiles
                projectiles.push(new Projectile(this.x, this.y, wx, wy, dmg * mult, '#ff4400', spd, 8, attr));
                emitParticles(this.x, this.y, '#ff6600', 6, 50, 0.3, 3, 0, attr, lvl);
                break;
            }
            case 'multi_shot': {
                sfxFireball();
                const numArrows = Math.round(getSkillValue(skDef, 'arrows', lvl));
                const mult = getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                const baseAngle = Math.atan2(wy - this.y, wx - this.x);
                const spread = 0.4;
                // Determine attribute from skill ID
                let attr = null;
                if (skDef.id && (skDef.id.includes('fire') || skDef.id.includes('immolation'))) attr = 'fire';
                else if (skDef.id && (skDef.id.includes('cold') || skDef.id.includes('ice') || skDef.id.includes('frost'))) attr = 'ice';
                else if (skDef.id && skDef.id.includes('lightning')) attr = 'lightning';
                else attr = 'physical'; // Default to physical for arrows
                for (let i = 0; i < numArrows; i++) {
                    const a = baseAngle - spread / 2 + spread * i / Math.max(1, numArrows - 1);
                    const tx = this.x + Math.cos(a) * 400;
                    const ty = this.y + Math.sin(a) * 400;
                    projectiles.push(new Projectile(this.x, this.y, tx, ty, dmg * mult, '#ffaa00', 380, 5, attr));
                }
                emitParticles(this.x, this.y, '#ffaa00', 8, 60, 0.3, 3, 0, attr, lvl);
                break;
            }
            case 'arrow_rain': {
                sfxMeteorCast();
                this.meteorT = 0.6;
                G.meteorX = wx; G.meteorY = wy;
                G.meteorDmg = dmg * getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                G.meteorColor = '#ffaa44';
                for (let a = 0; a < Math.PI * 2; a += 0.4) {
                    emitParticles(wx + Math.cos(a) * skDef.range, wy + Math.sin(a) * skDef.range, '#ffaa44', 2, 20, 0.6, 2, 0, 'physical', lvl);
                }
                addLog('矢の雨！', '#ffaa44');
                break;
            }
            case 'place_trap': {
                playSound(400, 'triangle', 0.1, 0.06);
                const trap = { x: this.x, y: this.y, dmg: dmg * getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg), life: 10, r: 50, triggered: false };
                if (!G.traps) G.traps = [];
                G.traps.push(trap);
                emitParticles(this.x, this.y, '#ff6600', 5, 30, 0.3, 2, 0, 'nature', lvl);
                addLog('トラップを設置！', '#ff8844');
                break;
            }
            case 'buff_dodge': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.dodgeT = dur;
                this.dodgeChance = getSkillValue(skDef, 'chance', lvl);
                playSound(600, 'sine', 0.15, 0.06);
                emitParticles(this.x, this.y, '#aaffaa', 10, 50, 0.4, 2, -30, 'arcane', lvl);
                addLog(`回避モード！(${Math.round(dur * 10) / 10}秒)`, '#aaffaa');
                break;
            }
            case 'shadow_strike': {
                // Teleport to nearest enemy and strike
                let closest = null, closestD = 300;
                for (const m of monsters) {
                    if (!m.alive) continue;
                    const d = dist(this.x, this.y, m.x, m.y);
                    if (d < closestD) { closestD = d; closest = m; }
                }
                if (closest) {
                    const angle = Math.atan2(this.y - closest.y, this.x - closest.x);
                    this.x = closest.x + Math.cos(angle) * 30;
                    this.y = closest.y + Math.sin(angle) * 30;
                    monsterTakeDmg(closest, dmg * getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg), true);
                    sfxHit();
                    emitParticles(closest.x, closest.y, '#aa44ff', 15, 80, 0.4, 3, 0, 'arcane', lvl);
                }
                break;
            }
            case 'chain_lightning': {
                playSweep(1000, 200, 0.2, 'sawtooth', 0.08);
                playNoise(0.1, 0.05, 3000);
                const mult = getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                const maxBounces = Math.round(getSkillValue(skDef, 'bounces', lvl));
                let lastX = this.x, lastY = this.y;
                const hit = new Set();
                for (let b = 0; b <= maxBounces; b++) {
                    let best = null, bestD = 200;
                    for (const m of monsters) {
                        if (!m.alive || hit.has(m)) continue;
                        const d = dist(lastX, lastY, m.x, m.y);
                        if (d < bestD) { bestD = d; best = m; }
                    }
                    if (!best) break;
                    hit.add(best);
                    // Draw lightning line as particles
                    const steps = 5;
                    for (let s = 0; s < steps; s++) {
                        const t = s / steps;
                        emitParticles(
                            lerp(lastX, best.x, t) + randf(-8, 8),
                            lerp(lastY, best.y, t) + randf(-8, 8),
                            '#88ccff', 1, 20, 0.3, 2, 0, 'lightning', lvl
                        );
                    }
                    monsterTakeDmg(best, dmg * mult * (b === 0 ? 1 : 0.7), false, 'lightning');
                    lastX = best.x; lastY = best.y;
                }
                break;
            }
            case 'meteor': {
                sfxMeteorCast();
                this.meteorT = 0.8;
                G.meteorX = wx; G.meteorY = wy;
                G.meteorDmg = dmg * getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                G.meteorElement = getSkillElement(skDef) || 'fire';
                G.meteorColor = '#ff4400';
                for (let a = 0; a < Math.PI * 2; a += 0.3) {
                    emitParticles(wx + Math.cos(a) * skDef.range, wy + Math.sin(a) * skDef.range, '#ff6600', 2, 20, 0.8, 2, 0, 'fire', lvl);
                }
                addLog('メテオ詠唱中...', '#ff8800');
                break;
            }
            case 'frost_nova': {
                sfxFrostNova();
                this.freezeT = 0.5;
                const mult = getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                const freezeDur = getSkillValue(skDef, 'freeze', lvl) * (1 + synFreeze);
                const frostElem = getSkillElement(skDef);
                for (const m of monsters) {
                    if (m.alive && dist(this.x, this.y, m.x, m.y) < 130) {
                        monsterTakeDmg(m, dmg * mult, false, frostElem);
                        m.frozenT = Math.max(m.frozenT || 0, freezeDur);
                        m.spd = (m.origSpd || MONSTER_DEFS[m.type].spd) * 0.2;
                    }
                }
                emitParticles(this.x, this.y, '#88ddff', 30, 130, 0.9, 4, 0, 'ice', lvl); // 寿命1.5倍
                emitParticles(this.x, this.y, '#ffffff', 15, 80, 0.6, 2, -30, 'ice', lvl); // 寿命1.5倍
                addLog('フロストノヴァ！', '#88ddff');
                break;
            }
            case 'teleport': {
                const maxRange = getSkillValue(skDef, 'range', lvl);
                const d = dist(this.x, this.y, wx, wy);
                const tdist = Math.min(d, maxRange);
                const angle = Math.atan2(wy - this.y, wx - this.x);
                const nx = this.x + Math.cos(angle) * tdist;
                const ny = this.y + Math.sin(angle) * tdist;
                emitParticles(this.x, this.y, '#aa88ff', 15, 60, 0.3, 3, 0, 'arcane', lvl);
                if (canWalk(nx, ny, 10)) { this.x = nx; this.y = ny; }
                playSweep(800, 1600, 0.1, 'sine', 0.06);
                emitParticles(this.x, this.y, '#aa88ff', 15, 60, 0.3, 3, 0, 'arcane', lvl);
                break;
            }
            case 'mana_shield': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.manaShieldT = dur;
                this.manaShieldAbsorb = getSkillValue(skDef, 'absorb', lvl);
                sfxShield();
                emitParticles(this.x, this.y, '#4488ff', 15, 50, 0.5, 3, -40, 'arcane', lvl);
                addLog(`マナシールド発動！(${Math.round(dur * 10) / 10}秒)`, '#4488ff');
                break;
            }

            case 'self_heal_pct': {
                const healAmt = Math.round(player.maxHP * getSkillValue(skDef, 'pct', lvl) * (1 + synHeal));
                player.hp = Math.min(player.maxHP, player.hp + healAmt);
                addFloatingText(player.x, player.y - 20, '+' + healAmt + ' HP', '#00ff00');
                emitParticles(player.x, player.y, '#00ff00', 12, 50, 0.5, 3, -40, 'holy', lvl);
                sfxHeal();
                addLog(`HP回復 (+${healAmt})`, '#00ff00');
                break;
            }
            case 'ground_slam': {
                sfxHit();
                G.shakeT = 0.25; G.shakeAmt = 12;
                const mult = getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                const slowFactor = skDef.slow ? getSkillValue(skDef, 'slow', lvl) : 0.5;
                for (const m of monsters) {
                    if (m.alive && dist(this.x, this.y, m.x, m.y) < skDef.range) {
                        monsterTakeDmg(m, dmg * mult, false);
                        m.spd = (m.origSpd || MONSTER_DEFS[m.type].spd) * slowFactor;
                        m.frozenT = Math.max(m.frozenT || 0, 2);
                    }
                }
                emitParticles(this.x, this.y, '#aa8844', 20, skDef.range, 0.5, 4, 0, 'physical', lvl);
                break;
            }
            case 'buff_counter': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.counterT = dur;
                this.counterReflect = getSkillValue(skDef, 'reflect', lvl);
                playSound(400, 'triangle', 0.15, 0.08);
                emitParticles(this.x, this.y, '#ffcc44', 10, 40, 0.4, 3, -30, 'arcane', lvl);
                addLog(`見切り発動！(${Math.round(dur * 10) / 10}秒)`, '#ffcc44');
                break;
            }
            case 'buff_speed': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.speedBuffT = dur;
                this.speedBuffBonus = getSkillValue(skDef, 'bonus', lvl);
                playSound(600, 'sine', 0.12, 0.05);
                emitParticles(this.x, this.y, '#88ffaa', 10, 50, 0.4, 2, -30, 'arcane', lvl);
                addLog(`移動速度UP！(${Math.round(dur * 10) / 10}秒)`, '#88ffaa');
                break;
            }
            case 'buff_poison': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.poisonBuffT = dur;
                this.poisonDps = getSkillValue(skDef, 'dps', lvl) * (1 + synDmg);
                playSound(300, 'sawtooth', 0.1, 0.06);
                emitParticles(this.x, this.y, '#88ff44', 10, 40, 0.4, 2, -30, 'nature', lvl);
                addLog(`毒塗り！攻撃に毒付与(${Math.round(dur * 10) / 10}秒)`, '#88ff44');
                break;
            }
            case 'smoke_screen': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.dodgeT = dur;
                this.dodgeChance = getSkillValue(skDef, 'evade', lvl);
                playSound(200, 'sine', 0.08, 0.06);
                emitParticles(this.x, this.y, '#999999', 25, skDef.range, 0.6, 5, -20, 'arcane', lvl);
                addLog(`煙幕！回避率UP(${dur}秒)`, '#999');
                break;
            }
            case 'holy_burst': {
                sfxHit();
                const mult = getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                for (const m of monsters) {
                    if (m.alive && dist(this.x, this.y, m.x, m.y) < skDef.range) {
                        monsterTakeDmg(m, dmg * mult, false);
                    }
                }
                emitParticles(this.x, this.y, '#ffdd88', 25, skDef.range, 0.5, 4, 0, 'holy', lvl);
                break;
            }
            case 'consecrate': {
                if (!G.consecrations) G.consecrations = [];
                const consDur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                G.consecrations.push({
                    x: this.x, y: this.y,
                    dmg: dmg * getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg),
                    range: (skDef.range || 80) * (1 + synRange),
                    life: consDur,
                    maxLife: consDur,
                    tickCD: 0
                });
                playSound(350, 'sine', 0.1, 0.08);
                emitParticles(this.x, this.y, '#ffcc44', 15, skDef.range * 0.5, 0.5, 3, 0, 'holy', lvl);
                addLog('聖域を展開！', '#ffcc44');
                break;
            }
            case 'buff_atkspd': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.atkSpdBuffT = dur;
                this.atkSpdBonus = getSkillValue(skDef, 'bonus', lvl);
                playSound(500, 'triangle', 0.1, 0.05);
                emitParticles(this.x, this.y, '#ffaa88', 10, 40, 0.3, 2, -30, 'fire', lvl);
                addLog(`攻撃速度UP！(${Math.round(dur * 10) / 10}秒)`, '#ffaa88');
                break;
            }
            case 'buff_frenzy': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.speedBuffT = dur;
                this.speedBuffBonus = getSkillValue(skDef, 'spdBonus', lvl);
                this.atkSpdBuffT = dur;
                this.atkSpdBonus = getSkillValue(skDef, 'atkBonus', lvl);
                playSound(250, 'sawtooth', 0.2, 0.1);
                emitParticles(this.x, this.y, '#ff6644', 20, 80, 0.6, 4, -30, 'fire', lvl);
                addLog(`フレンジー！(${Math.round(dur * 10) / 10}秒)`, '#ff6644');
                break;
            }
            case 'execute': {
                sfxHit();
                const mult = getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                const thresh = getSkillValue(skDef, 'threshold', lvl);
                let hit = false;
                for (const m of monsters) {
                    if (m.alive && dist(this.x, this.y, m.x, m.y) < (skDef.range || 70)) {
                        const hpRatio = m.hp / m.maxHP;
                        const finalMult = hpRatio <= thresh ? mult * 1.25 : mult;
                        monsterTakeDmg(m, dmg * finalMult, hpRatio <= thresh);
                        hit = true;
                        break;
                    }
                }
                if (hit) {
                    this.attackAnimT = 0.3;
                    emitParticles(this.x, this.y, '#ff4444', 15, 80, 0.4, 4, 0, 'physical', lvl);
                    G.shakeT = 0.2; G.shakeAmt = 10; // Diablo風：2倍
                }
                break;
            }
            case 'buff_lifesteal': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.lifestealBuffT = dur;
                this.lifestealBuffPct = getSkillValue(skDef, 'pct', lvl);
                playSound(350, 'sine', 0.12, 0.06);
                emitParticles(this.x, this.y, '#ff4466', 10, 40, 0.4, 3, -30, 'arcane', lvl);
                addLog(`血の刃！(${Math.round(dur * 10) / 10}秒)`, '#ff4466');
                break;
            }
            case 'buff_undying': {
                this.undyingT = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                playSound(200, 'square', 0.15, 0.1);
                emitParticles(this.x, this.y, '#ffd700', 20, 60, 0.8, 4, -40, 'holy', lvl);
                addLog(`不死身発動！(${Math.round(this.undyingT * 10) / 10}秒)`, '#ffd700');
                break;
            }
            case 'buff_stealth': {
                this.stealthT = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                playSound(800, 'sine', 0.06, 0.04);
                emitParticles(this.x, this.y, '#aa88ff', 15, 50, 0.5, 3, -30, 'arcane', lvl);
                addLog(`消失！次の攻撃はクリティカル確定`, '#aa88ff');
                break;
            }
            case 'buff_crit': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.critBuffT = dur;
                this.critBuffBonus = getSkillValue(skDef, 'bonus', lvl);
                playSound(700, 'triangle', 0.1, 0.05);
                emitParticles(this.x, this.y, '#ffdd44', 10, 40, 0.4, 2, -30, 'arcane', lvl);
                addLog(`鷹の目！クリティカル率+${Math.round(this.critBuffBonus)}%(${Math.round(dur * 10) / 10}秒)`, '#ffdd44');
                break;
            }
            case 'buff_aura': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.auraT = dur;
                this.auraRegen = getSkillValue(skDef, 'regen', lvl);
                this.auraReduction = getSkillValue(skDef, 'reduction', lvl);
                this.shieldT = dur;
                this.shieldReduction = this.auraReduction;
                sfxShield();
                emitParticles(this.x, this.y, '#ffdd88', 15, 60, 0.6, 4, -30, 'holy', lvl);
                addLog(`守護のオーラ発動！(${Math.round(dur * 10) / 10}秒)`, '#ffdd88');
                break;
            }
            case 'mana_drain': {
                sfxHit();
                const mult = getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                const mpSteal = getSkillValue(skDef, 'mpSteal', lvl);
                for (const m of monsters) {
                    if (m.alive && dist(this.x, this.y, m.x, m.y) < 80) {
                        monsterTakeDmg(m, dmg * mult, false);
                        this.mp = Math.min(this.maxMP, this.mp + mpSteal);
                        addFloatingText(this.x, this.y - 30, '+' + mpSteal + ' MP', '#8844ff');
                        emitParticles(m.x, m.y, '#8844ff', 6, 40, 0.3, 2, -20, 'arcane', lvl);
                        break;
                    }
                }
                break;
            }
            case 'debuff_defense': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                const red = getSkillValue(skDef, 'reduction', lvl);
                playSound(250, 'sawtooth', 0.1, 0.06);
                for (const m of monsters) {
                    if (m.alive && dist(this.x, this.y, m.x, m.y) < skDef.range) {
                        m.cursedT = dur;
                        m.curseDmgMult = 1 + red;
                    }
                }
                emitParticles(this.x, this.y, '#8844aa', 15, skDef.range * 0.5, 0.4, 3, 0, 'arcane', lvl);
                addLog(`呪縛！敵の被ダメ増加(${dur}秒)`, '#8844aa');
                break;
            }
            case 'dark_orb': {
                playSound(300, 'sine', 0.15, 0.08);
                const mult = getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                const spd = skDef.speed || 250;
                const p = new Projectile(this.x, this.y, wx, wy, dmg * mult, '#8800ff', spd, 10, 'arcane');
                p.pierce = true;
                projectiles.push(p);
                emitParticles(this.x, this.y, '#8800ff', 8, 40, 0.3, 3, 0, 'arcane', lvl);
                break;
            }

            case 'battle_orders': {
                const boBonus = getSkillValue(skDef, 'bonus', lvl);
                const boDur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                // 既存ブーストを除去してから再計算（重複防止）
                if (player.battleOrdersHP > 0) {
                    player.maxHP -= player.battleOrdersHP;
                    player.maxMP -= player.battleOrdersMP;
                    player.hp = Math.min(player.hp, player.maxHP);
                    player.mp = Math.min(player.mp, player.maxMP);
                }
                const hpBoost = Math.round(player.maxHP * boBonus);
                const mpBoost = Math.round(player.maxMP * boBonus);
                player.maxHP += hpBoost;
                player.maxMP += mpBoost;
                player.hp = Math.min(player.maxHP, player.hp + hpBoost);
                player.mp = Math.min(player.maxMP, player.mp + mpBoost);
                player.battleOrdersT = boDur;
                player.battleOrdersHP = hpBoost;
                player.battleOrdersMP = mpBoost;
                playSound(250, 'triangle', 0.2, 0.1);
                emitParticles(this.x, this.y, '#ffd700', 20, 80, 0.6, 4, -30, 'arcane', lvl);
                addLog(`バトルオーダー！HP+${hpBoost} MP+${mpBoost} (${boDur}秒)`, '#ffd700');
                break;
            }
            case 'summon_minion': {
                const sDur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                const sHP = getSkillValue(skDef, 'minionHP', lvl);
                const sDmg = getSkillValue(skDef, 'minionDmg', lvl) * (1 + synDmg);
                if (!G.minions) G.minions = [];
                G.minions = G.minions.filter(m => m.life > 0);
                if (G.minions.length < 2) {
                    G.minions.push({
                        x: this.x + randf(-30, 30), y: this.y + randf(-30, 30),
                        hp: sHP, maxHP: sHP, dmg: sDmg, life: sDur,
                        attackCD: 0, r: 12
                    });
                }
                playSound(500, 'sine', 0.15, 0.08);
                emitParticles(this.x, this.y, '#88ddff', 15, 60, 0.5, 3, -30, 'arcane', lvl);
                addLog(`召喚！(HP:${sHP} ATK:${sDmg} ${sDur}秒)`, '#88ddff');
                break;
            }
            case 'frozen_orb': {
                playSound(600, 'sine', 0.12, 0.06);
                const orbMult = getSkillValue(skDef, 'baseMult', lvl) * (1 + synDmg);
                const orbSpd = skDef.speed || 200;
                const shards = Math.round(skDef.shardCount ? getSkillValue(skDef, 'shardCount', lvl) : 8);
                const orbP = new Projectile(this.x, this.y, wx, wy, dmg * orbMult * 0.5, '#88ccff', orbSpd, 12, 'ice');
                orbP.pierce = true;
                orbP.frozen_orb = true;
                orbP.shardDmg = dmg * orbMult * 0.3;
                orbP.shardCount = shards;
                orbP.shardTimer = 0;
                projectiles.push(orbP);
                emitParticles(this.x, this.y, '#88ddff', 10, 50, 0.3, 3, 0, 'ice', lvl);
                break;
            }
        }

        // Enhanced effects at skill level milestones (5, 10, 15, 20)
        const isMilestone = lvl >= 5 && lvl % 5 === 0;
        if (isMilestone) {
            // Determine attribute from effect type
            let attr = 'arcane';
            if (['melee_burst', 'whirlwind', 'stun_aoe', 'charge', 'arrow_rain', 'ground_slam', 'execute'].includes(skDef.effect)) attr = 'physical';
            else if (['projectile_fire', 'meteor', 'buff_berserk', 'buff_frenzy', 'buff_atkspd'].includes(skDef.effect)) attr = 'fire';
            else if (['frost_nova', 'frozen_orb'].includes(skDef.effect)) attr = 'ice';
            else if (['chain_lightning'].includes(skDef.effect)) attr = 'lightning';
            else if (['holy_burst', 'consecrate', 'self_heal_pct', 'buff_aura', 'buff_undying'].includes(skDef.effect)) attr = 'holy';
            else if (['place_trap', 'buff_poison'].includes(skDef.effect)) attr = 'nature';

            const milestoneScale = Math.floor(lvl / 5); // 1-4 scale

            // Screen flash (stronger at higher milestones)
            G.flashT = 0.1 + milestoneScale * 0.05;
            G.flashColor = skDef.color || '#ffffff';
            G.flashAlpha = 0.2 + milestoneScale * 0.05;

            // Enhanced shake
            G.shakeT = Math.max(G.shakeT || 0, 0.2 + milestoneScale * 0.05);
            G.shakeAmt = Math.max(G.shakeAmt || 0, 10 + milestoneScale * 3);

            // Lv15+ trail particles
            if (lvl >= 15) {
                emitTrailParticles(this.x, this.y, skDef.color || '#ffffff', attr, lvl);
            }

            // Lv20: extra flash + stronger shake
            if (lvl >= 20) {
                G.flashAlpha = 0.5;
                G.shakeAmt = Math.max(G.shakeAmt, 20);
                emitTrailParticles(this.x, this.y, skDef.color || '#ffffff', attr, lvl);
            }
        }
    },

    update(dt) {
        // Regen
        this.mp = Math.min(this.maxMP, this.mp + (1 + this.int * 0.05 + ((this.passiveBonuses && this.passiveBonuses.manaRegen) || 0)) * dt);
        // Battle Orders timer
        if (this.battleOrdersT > 0) {
            this.battleOrdersT -= dt;
            if (this.battleOrdersT <= 0) {
                this.maxHP -= this.battleOrdersHP;
                this.maxMP -= this.battleOrdersMP;
                this.hp = Math.min(this.maxHP, this.hp);
                this.mp = Math.min(this.maxMP, this.mp);
                this.battleOrdersHP = 0;
                this.battleOrdersMP = 0;
                addLog('バトルオーダーの効果が切れた', '#888');
            }
        }
        this.hp = Math.min(this.maxHP, this.hp + (0.5 + this.vit * 0.02) * dt);

        // Potion over-time healing (D2-style)
        if (this.potionHealT > 0) {
            this.hp = Math.min(this.maxHP, this.hp + (this.potionHealPerSec || 0) * dt);
            this.potionHealT -= dt;
            if (this.potionHealT <= 0) { this.potionHealT = 0; this.potionHealPerSec = 0; }
        }
        if (this.potionManaT > 0) {
            this.mp = Math.min(this.maxMP, this.mp + (this.potionManaPerSec || 0) * dt);
            this.potionManaT -= dt;
            if (this.potionManaT <= 0) { this.potionManaT = 0; this.potionManaPerSec = 0; }
        }

        // Skill cooldowns
        for (const sk of Object.values(this.skills)) {
            if (sk.cooldown > 0) sk.cooldown = Math.max(0, sk.cooldown - dt);
        }

        // Whirlwind anim
        if (this.whirlwindT > 0) this.whirlwindT -= dt;

        // Frost Nova timer
        if (this.freezeT > 0) this.freezeT -= dt;

        // Magic Shield timer
        if (this.shieldT > 0) this.shieldT -= dt;

        // Berserk timer
        if (this.berserkT > 0) this.berserkT -= dt;
        // Dodge timer
        if (this.dodgeT > 0) this.dodgeT -= dt;
        // Mana Shield timer
        if (this.manaShieldT > 0) this.manaShieldT -= dt;

        // Counter timer
        if (this.counterT > 0) this.counterT -= dt;
        // Speed buff timer
        if (this.speedBuffT > 0) {
            this.speedBuffT -= dt;
            if (this.speedBuffT <= 0) this.speedBuffBonus = 0;
        }
        // Poison buff timer
        if (this.poisonBuffT > 0) this.poisonBuffT -= dt;
        // Attack speed buff timer
        if (this.atkSpdBuffT > 0) this.atkSpdBuffT -= dt;
        // Lifesteal buff timer
        if (this.lifestealBuffT > 0) this.lifestealBuffT -= dt;
        // Undying timer
        if (this.undyingT > 0) this.undyingT -= dt;
        // Stealth timer
        if (this.stealthT > 0) this.stealthT -= dt;
        // Crit buff timer
        if (this.critBuffT > 0) this.critBuffT -= dt;
        // Aura timer
        if (this.auraT > 0) {
            this.auraT -= dt;
            this.hp = Math.min(this.maxHP, this.hp + (this.auraRegen || 0) * dt);
        }
        // Consecrations
        if (G.consecrations) {
            for (let ci = G.consecrations.length - 1; ci >= 0; ci--) {
                const con = G.consecrations[ci];
                con.life -= dt;
                con.tickCD -= dt;
                if (con.tickCD <= 0) {
                    con.tickCD = 0.5;
                    for (const m of monsters) {
                        if (m.alive && dist(con.x, con.y, m.x, m.y) < con.range) {
                            monsterTakeDmg(m, con.dmg * 0.2, false);
                        }
                    }
                }
                if (con.life <= 0) { G.consecrations[ci] = G.consecrations[G.consecrations.length - 1]; G.consecrations.pop(); }
            }
        }
        // Meteor timer - explode when ready
        if (this.meteorT > 0) {
            this.meteorT -= dt;
            // Warning particles
            if (G.meteorX) {
                emitParticles(G.meteorX + randf(-50, 50), G.meteorY + randf(-50, 50), '#ff4400', 1, 10, 0.3, 2, -20);
            }
            if (this.meteorT <= 0 && G.meteorX) {
                // BOOM
                const mx = G.meteorX, my = G.meteorY;
                sfxMeteorImpact();
                G.shakeT = 0.5; G.shakeAmt = 16; // Diablo風：2倍
                emitParticles(mx, my, '#ff4400', 40, 150, 1.2, 5, 50); // 寿命1.5倍
                emitParticles(mx, my, '#ffaa00', 25, 100, 0.9, 4, 30); // 寿命1.5倍
                emitParticles(mx, my, '#ffffff', 10, 60, 0.45, 2, 0); // 寿命1.5倍
                for (const m of monsters) {
                    if (m.alive && dist(mx, my, m.x, m.y) < 100) {
                        const isCrit = Math.random() * 100 < this.getCritChance();
                        const d = isCrit ? G.meteorDmg * 2 : G.meteorDmg;
                        monsterTakeDmg(m, d, isCrit, G.meteorElement || 'fire');
                    }
                }
                addLog('メテオ着弾！', '#ff4400');
                G.meteorX = null; G.meteorY = null;
            }
        }

        // Attack cooldown
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.attackAnimT > 0) this.attackAnimT -= dt;
        if (this._attackRepathT > 0) this._attackRepathT -= dt;

        // Attack target
        if (this.attacking && this.attackTarget && this.attackTarget.alive) {
            const d = dist(this.x, this.y, this.attackTarget.x, this.attackTarget.y);
            const reach = this.getWeaponReach();
            if (d < reach) {
                if (this.attackCooldown <= 0) {
                    const dmg = this.getAttackDmg();
                    const isCrit = Math.random() * 100 < this.getCritChance();
                    const finalDmg = isCrit ? dmg * this.getCritDamage() / 100 : dmg;
                    monsterTakeDmg(this.attackTarget, finalDmg, isCrit);
                    if (this.attackTarget.hp <= 0 || !this.attackTarget.alive) {
                        tryBreakNearbyDungeonProps(this.x, this.y, 52, 1);
                    }
                    let atkSpdPct = (this.passiveBonuses && this.passiveBonuses.attackSpeed) || 0;
                    for (const slot of Object.values(this.equipment)) {
                        if (!slot) continue;
                        for (const a of slot.affixes) {
                            if (a.stat === 'atkSpd') atkSpdPct += a.value;
                        }
                    }
                    if (this.atkSpdBuffT > 0) atkSpdPct += this.atkSpdBonus || 0;
                    this.attackCooldown = 0.5 / (1 + atkSpdPct / 100);
                    this.attackAnimT = 0.2;
                    sfxHit();

                    // Lifesteal
                    const ls = this.getLifesteal();
                    if (ls > 0) {
                        const heal = Math.round(finalDmg * ls / 100);
                        this.hp = Math.min(this.maxHP, this.hp + heal);
                    }
                }
                this.moving = false;
                this.path = null;
                this.pathIdx = 0;
            } else {
                // Re-path occasionally so we can route around walls while chasing.
                const goalTx = Math.floor(this.attackTarget.x / TILE);
                const goalTy = Math.floor(this.attackTarget.y / TILE);
                const curGoalTx = Math.floor((this._pathGoalX || 0) / TILE);
                const curGoalTy = Math.floor((this._pathGoalY || 0) / TILE);
                if (!this.path || this._attackRepathT <= 0 || goalTx !== curGoalTx || goalTy !== curGoalTy) {
                    this.setMoveTarget(this.attackTarget.x, this.attackTarget.y);
                    this._attackRepathT = 0.25;
                } else {
                    this.moving = true;
                }
            }
        }

        // Arrow key movement with inertia (WASD reserved for combat actions)
        let kbMoveX = 0, kbMoveY = 0;
        if (keysDown['arrowup']) kbMoveY = -1;
        if (keysDown['arrowdown']) kbMoveY = 1;
        if (keysDown['arrowleft']) kbMoveX = -1;
        if (keysDown['arrowright']) kbMoveX = 1;

        // 目標速度を計算
        let targetVx = 0, targetVy = 0;
        if (kbMoveX !== 0 || kbMoveY !== 0) {
            // Normalize diagonal
            const kbLen = Math.hypot(kbMoveX, kbMoveY) || 1;
            targetVx = (kbMoveX / kbLen) * this.speed;
            targetVy = (kbMoveY / kbLen) * this.speed;
        }

        // 慣性システム：現在の速度を目標速度に向けて加速/減速
        const inputMag = Math.hypot(targetVx, targetVy);
        if (inputMag > 0) {
            // 加速
            const t = Math.min(this.acceleration * dt / this.speed, 1);
            this.vx = lerp(this.vx, targetVx, t);
            this.vy = lerp(this.vy, targetVy, t);
        } else {
            // 減速（摩擦）
            const currentSpeed = Math.hypot(this.vx, this.vy);
            if (currentSpeed > 0.1) {
                const decelAmount = this.deceleration * dt;
                const friction = Math.max(0, currentSpeed - decelAmount) / currentSpeed;
                this.vx *= friction;
                this.vy *= friction;
            } else {
                this.vx = 0;
                this.vy = 0;
            }
        }

        // 速度ベクトルに基づいて位置を更新
        const actualSpeed = Math.hypot(this.vx, this.vy);
        if (actualSpeed > 0.1) {
            const nx = this.x + this.vx * dt;
            const ny = this.y + this.vy * dt;
            const cr = 10;
            const canBoth = canWalk(nx, ny, cr);
            const canX = canWalk(this.x + this.vx * dt, this.y, cr);
            const canY = canWalk(this.x, this.y + this.vy * dt, cr);
            if (canBoth) {
                this.x = nx;
                this.y = ny;
            } else if (canX) {
                this.x += this.vx * dt;
                this.vy *= 0.5; // 壁に当たったら反対方向の速度を減衰
            } else if (canY) {
                this.y += this.vy * dt;
                this.vx *= 0.5; // 壁に当たったら反対方向の速度を減衰
            } else {
                // 完全に行き詰まり
                this.vx *= 0.3;
                this.vy *= 0.3;
            }
            this.moving = false; // Cancel click-move
            this.attacking = false;
            this._kbMoving = true; // Flag for sprite animation
            sfxFootstep();
        } else {
            this._kbMoving = false;
        }

        // Movement with proper circle collision
        if (this.moving) {
            sfxFootstep();
            // If we have a path, drive target from waypoints.
            if (this.path && this.pathIdx < this.path.length) {
                const wp = this.path[this.pathIdx];
                this.targetX = wp.x;
                this.targetY = wp.y;
            }
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const d = Math.hypot(dx, dy);
            if (d > 3) {
                const mx = dx / d, my = dy / d;
                const step = this.speed * dt;
                const nx = this.x + mx * step;
                const ny = this.y + my * step;

                // Check circle collision: test 4 edge points of the circle
                const cr = 10; // collision radius
                const canMoveX = canWalk(this.x + mx * step, this.y, cr);
                const canMoveY = canWalk(this.x, this.y + my * step, cr);
                const canMoveBoth = canWalk(nx, ny, cr);

                if (canMoveBoth) {
                    this.x = nx; this.y = ny;
                    this._stuckT = 0;
                } else if (canMoveX) {
                    this.x += mx * step;
                    this._stuckT = 0;
                } else if (canMoveY) {
                    this.y += my * step;
                    this._stuckT = 0;
                } else {
                    // Stuck: try to re-path toward the goal after a short delay.
                    this._stuckT = (this._stuckT || 0) + dt;
                    if (this._stuckT > 0.35) {
                        this._stuckT = 0;
                        // Re-plan only for click-move paths (not while actively attacking).
                        if (!this.attacking) this.setMoveTarget(this._pathGoalX, this._pathGoalY);
                    }
                }
                // else: stuck, don't move
            } else {
                // Advance waypoint, or stop if done.
                if (this.path && this.pathIdx < this.path.length - 1) {
                    this.pathIdx++;
                } else {
                    this.moving = false;
                    this.path = null;
                    this.pathIdx = 0;
                }
            }
        }

        if (this.targetBreakProp) {
            const tb = this.targetBreakProp;
            const prop = resolveDungeonPropAtTile(dungeon, tb.tx, tb.ty);
            if (!prop || isDungeonPropBroken(dungeon, tb.tx, tb.ty)) {
                this.targetBreakProp = null;
            } else {
                const px = tb.tx * TILE + TILE / 2;
                const py = tb.ty * TILE + TILE / 2;
                if (dist(this.x, this.y, px, py) <= 56) {
                    breakDungeonProp(tb.tx, tb.ty, prop);
                    this.targetBreakProp = null;
                    this.moving = false;
                }
            }
        }
    },

    draw(cx, cy) {
        // Ignore `cx/cy` in iso mode; we project from world to screen instead.
        const sp = worldToScreen(this.x, this.y);
        const sx = sp.x, sy = sp.y;
        const gy = groundYOffset();

        // Magic Shield aura
        if (this.shieldT > 0) {
            const pulse = 0.6 + Math.sin(G.time * 6) * 0.15;
            ctx.strokeStyle = `rgba(120,120,255,${pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, 22, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = `rgba(80,80,255,${pulse * 0.15})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 21, 0, Math.PI * 2);
            ctx.fill();
        }

        // Frost Nova ring effect
        if (this.freezeT > 0) {
            const r = 130 * (1 - this.freezeT / 0.5);
            ctx.strokeStyle = `rgba(100,220,255,${this.freezeT})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Whirlwind effect
        if (this.whirlwindT > 0) {
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(G.time * 15);
            for (let i = 0; i < 4; i++) {
                const a = this.whirlwindT / 0.6;
                ctx.strokeStyle = `rgba(100,150,255,${a * 0.5})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 35 + i * 12, i * 1.5, i * 1.5 + 2.5);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Shadow is drawn inside _drawGenericSprite (with walk sway)

        // Walking animation phase
        const walkPhase = this.moving ? Math.sin(G.time * 10) * 2 : 0;

        // Render character based on class
        if (this.classKey === 'warrior' || this.classKey === 'paladin' || this.classKey === 'berserker') this._drawGenericSprite(sx, sy, walkPhase, CLASS_DEFS[this.classKey].sprite);
        else if (this.classKey === 'rogue' || this.classKey === 'assassin' || this.classKey === 'ranger') this._drawGenericSprite(sx, sy, walkPhase, CLASS_DEFS[this.classKey].sprite);
        else if (this.classKey === 'sorcerer' || this.classKey === 'pyromancer' || this.classKey === 'cryomancer') this._drawGenericSprite(sx, sy, walkPhase, CLASS_DEFS[this.classKey].sprite);

        // HP/MP bars over head (gradient + border) - adjusted for scale
        const hpFrac = this.hp / this.maxHP;
        const mpFrac = this.mp / this.maxMP;
        const barW = 36;
        const barX = sx - barW / 2;
        const pBarY = sy + gy + 4;
        // HP bar background
        ctx.fillStyle = '#1a0000';
        ctx.fillRect(barX, pBarY, barW, 4);
        // HP bar fill with gradient
        if (hpFrac > 0) {
            const hpBarG = ctx.createLinearGradient(barX, pBarY, barX, pBarY + 4);
            hpBarG.addColorStop(0, hpFrac > 0.3 ? '#ee3333' : '#ff6644');
            hpBarG.addColorStop(1, hpFrac > 0.3 ? '#881111' : '#cc2222');
            ctx.fillStyle = hpBarG;
            ctx.fillRect(barX, pBarY, barW * hpFrac, 4);
        }
        // HP bar border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX, pBarY, barW, 4);
        // MP bar background
        ctx.fillStyle = '#00001a';
        ctx.fillRect(barX, pBarY + 5, barW, 3);
        // MP bar fill with gradient
        if (mpFrac > 0) {
            const mpBarG = ctx.createLinearGradient(barX, pBarY + 5, barX, pBarY + 8);
            mpBarG.addColorStop(0, '#5555dd');
            mpBarG.addColorStop(1, '#222288');
            ctx.fillStyle = mpBarG;
            ctx.fillRect(barX, pBarY + 5, barW * mpFrac, 3);
        }
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX, pBarY + 5, barW, 3);
        // Level badge - above scaled sprite
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#daa520';
        ctx.fillText('Lv' + this.level, sx, sy - TILE * PLAYER_DRAW_SCALE / 2 - 6);

        // Berserk aura (only sorcerer shows mana shield glow)
        if (this.manaShieldT > 0) {
            const manaGlow = 0.5 + Math.sin(G.time * 8) * 0.2;
            ctx.fillStyle = `rgba(100, 100, 255, ${manaGlow * 0.2})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    _drawGenericSprite(sx, sy, walkPhase, spriteKey) {
        const S = PLAYER_DRAW_SCALE;
        const drawSize = TILE * S;
        const flipX = this.targetX < this.x - 2;
        const gy = groundYOffset();

        // Minimal procedural transforms (real animation is in sprite frames now)
        let bounce = 0, tilt = 0, scaleX = 1, scaleY = 1;
        if (!this.moving && !this._kbMoving && !this.attacking) {
            // Subtle idle breathing
            bounce = Math.sin(G.time * 2) * 1.5;
            scaleY = 1 + Math.sin(G.time * 2) * 0.01;
        }
        if (this.attacking && !hiresSpritesLoaded) {
            // Tilt only for fallback pixel art (hi-res has its own attack anim)
            const atkP = this.attackTimer * Math.PI * 4;
            tilt = Math.sin(atkP) * 0.15;
            bounce = Math.sin(atkP * 0.5) * -2;
        }

        // Drop shadow
        const shadowRx = drawSize * 0.28, shadowRy = 5;
        const shG = ctx.createRadialGradient(sx, sy + gy, 0, sx, sy + gy, shadowRx);
        shG.addColorStop(0, 'rgba(0,0,0,0.4)');
        shG.addColorStop(0.6, 'rgba(0,0,0,0.15)');
        shG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shG;
        ctx.beginPath();
        ctx.ellipse(sx, sy + gy, shadowRx, shadowRy, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(sx, sy - bounce);
        if (tilt) ctx.rotate(tilt);
        ctx.scale(scaleX, scaleY);

        // Try hi-res animated sprite first
        if (hiresSpritesLoaded) {
            const classKey = getHiResClassKey(this);
            const animName = getHiResAnimState(this);
            // Direction: prefer velocity vector (keyboard), then target delta (click-move)
            let dirIdx = this._lastDirIdx || 0;
            if (this._kbMoving && Math.hypot(this.vx, this.vy) > 5) {
                dirIdx = getFacingDir8(this.vx, this.vy);
                this._lastDirIdx = dirIdx;
            } else if (this.moving || this.attacking) {
                const mdx = this.targetX - this.x;
                const mdy = this.targetY - this.y;
                if (Math.hypot(mdx, mdy) > 8) {
                    dirIdx = getFacingDir8(mdx, mdy);
                    this._lastDirIdx = dirIdx;
                }
            }
            const hiDrawSize = drawSize * 2.0;
            // FLARE sprites: feet at 75% of cell height. Align feet with shadow (at TILE/2)
            const hiDy = gy - hiDrawSize * 0.75;
            if (!drawHiResSpr(classKey, animName, dirIdx, G.time, -hiDrawSize / 2, hiDy, hiDrawSize, hiDrawSize)) {
                // Fallback: pixel art sprite
                if (!drawSpr(spriteKey, -drawSize / 2, -drawSize + gy, drawSize, drawSize, flipX)) {
                    ctx.fillStyle = '#888'; ctx.fillRect(-drawSize / 4, -drawSize / 4, drawSize / 2, drawSize / 2);
                }
            }
        } else {
            // Fallback: original pixel art sprite
            if (!drawSpr(spriteKey, -drawSize / 2, -drawSize + gy, drawSize, drawSize, flipX)) {
                ctx.fillStyle = '#888'; ctx.fillRect(-drawSize / 4, -drawSize / 4, drawSize / 2, drawSize / 2);
            }
        }
        ctx.restore();

        // Attack slash arc effect (8-dir aware when using hi-res sprites)
        if (this.attacking) {
            const atkPhase = clamp(this.attackTimer * 4, 0, 1);
            // dirAngles: S=π/2, SW=3π/4, W=π, NW=-3π/4, N=-π/2, NE=-π/4, E=0, SE=π/4
            const dirAngles8 = [Math.PI / 2, Math.PI * 3 / 4, Math.PI, -Math.PI * 3 / 4, -Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4];
            const curDir = this._lastDirIdx || 0;
            const baseAngle = hiresSpritesLoaded ? dirAngles8[curDir] : (flipX ? Math.PI : 0);
            const arcR = drawSize * 0.55;
            ctx.save();
            ctx.translate(sx, sy - drawSize * 0.2);
            for (let t = 0; t < 5; t++) {
                const trailP = clamp(atkPhase - t * 0.06, 0, 1);
                const sweep = Math.PI * 0.5;
                const segStart = baseAngle - sweep * (trailP - 0.15);
                const segEnd = baseAngle - sweep * trailP;
                ctx.globalAlpha = (1 - t * 0.18) * 0.6 * (1 - atkPhase * 0.5);
                ctx.strokeStyle = t === 0 ? '#ffffff' : `rgba(255,${180 - t * 30},${80 - t * 15},1)`;
                ctx.lineWidth = 3 - t * 0.5;
                ctx.beginPath();
                ctx.arc(0, 0, arcR - t * 2, segStart, segEnd);
                ctx.stroke();
            }
            ctx.restore();
            ctx.globalAlpha = 1;
        }

        // Aura effects for promoted classes
        const classDef = CLASS_DEFS[this.classKey];
        if (classDef && classDef.tier > 0) {
            const colors = { paladin: '#ffd700', berserker: '#ff4400', assassin: '#8800ff', ranger: '#44ff44', pyromancer: '#ff6600', cryomancer: '#44ccff' };
            const c = colors[this.classKey] || '#ffffff';
            ctx.globalAlpha = 0.08 + Math.sin(G.time * 3) * 0.04;
            ctx.fillStyle = c;
            ctx.beginPath(); ctx.arc(sx, sy, drawSize * 0.35, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }
    },
    _drawWarrior(sx, sy, walkPhase) {
        const bounce = this.moving ? Math.sin(walkPhase * 10) * 2 : 0;
        const flipX = this.targetX < this.x - 2;
        const atkTilt = this.attacking ? Math.sin(this.attackTimer * Math.PI * 6) * 0.15 : 0;
        ctx.save();
        ctx.translate(sx, sy + bounce);
        if (atkTilt) ctx.rotate(atkTilt);
        if (!drawSpr('knight', -TILE / 2, -TILE / 2, TILE, TILE, flipX)) {
            ctx.fillStyle = '#888'; ctx.fillRect(-TILE / 4, -TILE / 4, TILE / 2, TILE / 2);
        }
        ctx.restore();
        if (this.attacking) {
            ctx.globalAlpha = 0.25 * Math.abs(Math.sin(this.attackTimer * Math.PI * 4));
            ctx.fillStyle = '#ffaa44';
            ctx.beginPath(); ctx.arc(sx, sy, TILE * 0.6, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }
    },
    _drawRogue(sx, sy, walkPhase) {
        const bounce = this.moving ? Math.sin(walkPhase * 10) * 2 : 0;
        const flipX = this.targetX < this.x - 2;
        const atkTilt = this.attacking ? Math.sin(this.attackTimer * Math.PI * 6) * 0.1 : 0;
        ctx.save();
        ctx.translate(sx, sy + bounce);
        if (atkTilt) ctx.rotate(atkTilt);
        if (!drawSpr('rogueChar', -TILE / 2, -TILE / 2, TILE, TILE, flipX)) {
            ctx.fillStyle = '#6a6'; ctx.fillRect(-TILE / 4, -TILE / 4, TILE / 2, TILE / 2);
        }
        ctx.restore();
        if (this.attacking) {
            ctx.globalAlpha = 0.2 * Math.abs(Math.sin(this.attackTimer * Math.PI * 4));
            ctx.fillStyle = '#88ff88';
            ctx.beginPath(); ctx.arc(sx, sy, TILE * 0.5, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }
    },
    _drawSorcerer(sx, sy, walkPhase) {
        const bounce = this.moving ? Math.sin(walkPhase * 10) * 1.5 : 0;
        const flipX = this.targetX < this.x - 2;
        const magicGlow = 0.08 + Math.sin(G.time * 3) * 0.04;
        ctx.save();
        ctx.translate(sx, sy + bounce);
        if (!drawSpr('wizardM', -TILE / 2, -TILE / 2, TILE, TILE, flipX)) {
            ctx.fillStyle = '#66a'; ctx.fillRect(-TILE / 4, -TILE / 4, TILE / 2, TILE / 2);
        }
        ctx.restore();
        ctx.globalAlpha = magicGlow;
        ctx.fillStyle = '#6644ff';
        ctx.beginPath(); ctx.arc(sx, sy, TILE * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        if (this.attacking) {
            ctx.globalAlpha = 0.3 * Math.abs(Math.sin(this.attackTimer * Math.PI * 4));
            ctx.fillStyle = '#4488ff';
            ctx.beginPath(); ctx.arc(sx, sy, TILE * 0.6, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

};

// ========== MERCENARY SYSTEM (D2-style) ==========
const MERCENARY_DEFS = {
    rogue: { name: 'Rogue', nameJP: '弓兵', baseHP: 120, baseStr: 10, baseDex: 18, baseInt: 8, baseDef: 8, attackType: 'ranged', attackRange: 180, baseSpeed: 160, icon: '🏹', color: '#c98b6b', hpPerLevel: 12, dmgPerLevel: 2, defPerLevel: 1.2, hireCost: 400, reviveCostBase: 200 },
    fighter: { name: 'Fighter', nameJP: '戦士', baseHP: 220, baseStr: 18, baseDex: 8, baseInt: 6, baseDef: 18, attackType: 'melee', attackRange: 45, baseSpeed: 140, icon: '🛡', color: '#6c8aa6', hpPerLevel: 20, dmgPerLevel: 3, defPerLevel: 2.0, hireCost: 600, reviveCostBase: 300 },
    mage: { name: 'Mage', nameJP: '魔法使い', baseHP: 90, baseStr: 6, baseDex: 10, baseInt: 22, baseDef: 6, attackType: 'magic', attackRange: 160, baseSpeed: 150, icon: '🧙', color: '#9a6bd6', hpPerLevel: 9, dmgPerLevel: 4, defPerLevel: 0.8, hireCost: 700, reviveCostBase: 350 },
    priestess: { name: 'Priestess', nameJP: '聖女', baseHP: 140, baseStr: 8, baseDex: 12, baseInt: 18, baseDef: 10, attackType: 'magic', attackRange: 120, baseSpeed: 150, icon: '✨', color: '#e6c36a', hpPerLevel: 13, dmgPerLevel: 2, defPerLevel: 1.1, hireCost: 650, reviveCostBase: 325 }
};
const MERC_ACT_MULT = [0, 1.0, 1.3, 1.6, 2.0, 2.5];
function getMercHireCost(typeKey) { return Math.round((MERCENARY_DEFS[typeKey]?.hireCost || 500) * (MERC_ACT_MULT[G.act] || 1)); }
function getMercReviveCost() { return mercenary ? Math.round(getMercHireCost(mercenary.type) * 0.5) : 0; }

function calcMercStats(def, level) {
    const lvl = Math.max(1, level);
    return {
        maxHP: Math.round(def.baseHP + def.hpPerLevel * (lvl - 1)),
        str: Math.round(def.baseStr + (lvl - 1) * 2),
        dex: Math.round(def.baseDex + (lvl - 1) * 2),
        int: Math.round(def.baseInt + (lvl - 1) * 2),
        defense: Math.round(def.baseDef + def.defPerLevel * (lvl - 1)),
        baseDmg: Math.round((def.baseStr * 0.55 + def.baseDex * 0.35 + def.baseInt * 0.45) + def.dmgPerLevel * (lvl - 1))
    };
}

const mercProjectiles = [];
class MercProjectile {
    constructor(x, y, tx, ty, dmg, color, spd, r, element) {
        this.x = x; this.y = y; this.dmg = dmg; this.color = color; this.r = r || 5;
        this.element = element || null; this.life = 2.5;
        const d = Math.hypot(tx - x, ty - y) || 1;
        this.vx = (tx - x) / d * spd; this.vy = (ty - y) / d * spd;
    }
    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; emitParticles(this.x, this.y, this.color, 1, 18, 0.2, 2, 0); }
    draw(cx, cy) {
        const sp = worldToScreen(this.x, this.y);
        const sx = sp.x, sy = sp.y;
        if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) return;
        ctx.globalAlpha = 0.9; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(sx, sy, this.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, sy, this.r * 0.45, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

let mercenary = null;

class Mercenary {
    constructor(typeKey, x, y) {
        this.type = typeKey;
        this.def = MERCENARY_DEFS[typeKey];
        this.name = this.def.nameJP;
        this.level = player.level;
        this.xp = 0;
        this.xpToNext = Math.round(80 * Math.pow(1.25, this.level - 1));
        this.x = x; this.y = y;
        this.radius = 12;
        this.alive = true;
        this.target = null;
        this.attackCooldown = 0;
        this.healCD = 0; this.buffCD = 0;
        this.equipment = { weapon: null, armor: null };
        this.hp = 1; this.maxHP = 1;
        this.str = 0; this.dex = 0; this.int = 0; this.defense = 0; this.baseDmg = 1;
        this.recalcStats(true);
    }
    addXP(amount) {
        if (!this.alive) return;
        this.xp += amount;
        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            this.xpToNext = getXPForLevel(this.level);
            this.recalcStats(false);
            this.hp = this.maxHP; // Full heal on level up
            addLog(`${this.name}がLv.${this.level}に上がった！`, '#e6c36a');
        }
    }
    recalcStats(resetHP) {
        const prevPct = this.maxHP > 0 ? this.hp / this.maxHP : 1;
        const s = calcMercStats(this.def, this.level);
        this.maxHP = s.maxHP; this.str = s.str; this.dex = s.dex; this.int = s.int;
        this.defense = s.defense; this.baseDmg = s.baseDmg;
        // Equipment stat bonuses
        for (const eq of Object.values(this.equipment)) {
            if (!eq) continue;
            for (const a of (eq.affixes || [])) {
                if (a.stat === 'str') this.str += a.value;
                if (a.stat === 'dex') this.dex += a.value;
                if (a.stat === 'int') this.int += a.value;
                if (a.stat === 'hp') this.maxHP += a.value;
                if (a.stat === 'def') this.defense += a.value;
            }
        }
        this.hp = resetHP ? this.maxHP : Math.min(this.maxHP, Math.max(1, Math.round(this.maxHP * prevPct)));
    }
    getAttackDmg() {
        let dmg = this.baseDmg;
        const w = this.equipment.weapon;
        if (w && w.baseDmg) dmg += rand(w.baseDmg[0], w.baseDmg[1]);
        return Math.max(1, Math.round(dmg));
    }
    getDefense() {
        let def = this.defense;
        const a = this.equipment.armor;
        if (a && a.baseDef) def += a.baseDef;
        return Math.max(0, def);
    }
    takeDmg(raw) {
        const def = this.getDefense();
        const dmg = Math.max(1, Math.round(raw * (100 / (100 + def))));
        this.hp -= dmg;
        addFloatingText(this.x, this.y - 20, dmg, '#ff6666');
        emitParticles(this.x, this.y, '#ff0000', 6, 60, 0.4, 3);
        if (this.hp <= 0) {
            this.hp = 0; this.alive = false;
            emitParticles(this.x, this.y, '#888', 12, 60, 0.5, 3, -20);
            addLog(`${this.name}が倒れた！町で復活させよう`, '#ff4444');
        }
    }
    _moveToward(tx, ty, speed, dt) {
        const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
        if (d < 1) return;
        const mx = dx / d, my = dy / d, step = speed * dt;
        const nx = this.x + mx * step, ny = this.y + my * step;
        if (canWalk(nx, ny, 10)) { this.x = nx; this.y = ny; }
        else if (canWalk(this.x + mx * step, this.y, 10)) { this.x += mx * step; }
        else if (canWalk(this.x, this.y + my * step, 10)) { this.y += my * step; }
    }
    _findTarget() {
        // Prioritize player's attack target (nearby enemy closest to player's facing)
        let best = null, bestD = 1e9;
        for (const m of monsters) {
            if (!m.alive) continue;
            const dm = dist(this.x, this.y, m.x, m.y);
            const dp = dist(player.x, player.y, m.x, m.y);
            // Prefer enemies near player (within 250px) and aggro'd
            const priority = m.aggroed ? dp * 0.7 : dp;
            if (dm < 250 && priority < bestD) { bestD = priority; best = m; }
        }
        this.target = best;
    }
    update(dt) {
        if (!this.alive) return;
        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        if (this.target && !this.target.alive) this.target = null;
        if (!this.target) this._findTarget();
        // Low HP: retreat toward player at boosted speed
        if (this.hp < this.maxHP * 0.3) {
            const pd = dist(this.x, this.y, player.x, player.y);
            if (pd > 40) this._moveToward(player.x, player.y, this.def.baseSpeed * 1.4, dt);
            this.target = null;
            this._tryHealBuff(dt);
            return;
        }
        // Combat
        if (this.target) {
            const t = this.target, d = dist(this.x, this.y, t.x, t.y);
            const range = this.def.attackRange;
            if (this.def.attackType === 'melee') {
                // Fighter: position between player and enemy
                if (d > range) {
                    const midX = (player.x + t.x) / 2, midY = (player.y + t.y) / 2;
                    const toEnemy = dist(midX, midY, t.x, t.y);
                    if (toEnemy > range * 0.5) {
                        this._moveToward(t.x, t.y, this.def.baseSpeed, dt);
                    } else {
                        this._moveToward(midX, midY, this.def.baseSpeed, dt);
                    }
                }
            } else {
                // Ranged/magic: stay behind player relative to enemy
                const dx = player.x - t.x, dy = player.y - t.y;
                const dd = Math.hypot(dx, dy) || 1;
                const idealX = player.x + (dx / dd) * 60;
                const idealY = player.y + (dy / dd) * 60;
                if (d < range * 0.5) {
                    // Too close, retreat behind player
                    this._moveToward(idealX, idealY, this.def.baseSpeed, dt);
                } else if (d > range * 1.1) {
                    this._moveToward(t.x, t.y, this.def.baseSpeed, dt);
                } else if (dist(this.x, this.y, idealX, idealY) > 50) {
                    // Reposition to ideal spot
                    this._moveToward(idealX, idealY, this.def.baseSpeed * 0.6, dt);
                }
            }
            if (d <= range && this.attackCooldown <= 0) {
                const dmg = this.getAttackDmg();
                const isCrit = Math.random() * 100 < (5 + this.dex * 0.05);
                const finalDmg = isCrit ? Math.round(dmg * 1.5) : dmg;
                if (this.def.attackType === 'melee') {
                    monsterTakeDmg(t, finalDmg, isCrit);
                    this.attackCooldown = 0.8; sfxHit();
                    emitParticles(t.x, t.y, '#ffcc88', 4, 40, 0.2, 2, 0);
                } else {
                    const elem = this.type === 'mage' ? 'lightning' : null;
                    mercProjectiles.push(new MercProjectile(this.x, this.y, t.x, t.y, finalDmg, this.def.color, 320, 5, elem));
                    this.attackCooldown = this.type === 'mage' ? 1.3 : 1.1;
                    emitParticles(this.x, this.y, this.def.color, 3, 30, 0.2, 2, 0);
                }
            }
        } else {
            // Follow player (keep ~80px distance)
            const pd = dist(this.x, this.y, player.x, player.y);
            if (pd > 100) this._moveToward(player.x, player.y, this.def.baseSpeed, dt);
            this._tryHealBuff(dt);
        }
    }
    _tryHealBuff(dt) {
        if (this.type !== 'priestess') return;
        this.healCD = Math.max(0, this.healCD - dt);
        this.buffCD = Math.max(0, this.buffCD - dt);
        const pd = dist(this.x, this.y, player.x, player.y);
        if (pd < 120 && this.healCD <= 0 && player.hp < player.maxHP) {
            const heal = Math.round(player.maxHP * (0.05 + this.level * 0.001));
            player.hp = Math.min(player.maxHP, player.hp + heal);
            addFloatingText(player.x, player.y - 24, '+' + heal, '#00ff88');
            emitParticles(player.x, player.y, '#88ffcc', 10, 50, 0.4, 3, -20);
            sfxHeal(); this.healCD = 3.0;
        }
    }
    draw(cx, cy) {
        if (!this.alive) return;
        const sp = worldToScreen(this.x, this.y);
        const sx = sp.x, sy = sp.y;
        if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) return;
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(sx, sy + 10, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
        // Body circle
        ctx.fillStyle = this.def.color;
        ctx.beginPath(); ctx.arc(sx, sy, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(sx, sy, this.radius, 0, Math.PI * 2); ctx.stroke();
        // Icon
        ctx.font = `16px ${FONT_EMOJI}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.def.icon, sx, sy - 1);
        // Name + level
        ctx.font = `bold 9px ${FONT_UI}`;
        ctx.fillStyle = this.def.color;
        ctx.fillText(`${this.name} Lv.${this.level}`, sx, sy - this.radius - 14);
        // HP bar
        const bw = 30, bh = 4;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(sx - bw / 2, sy - this.radius - 10, bw, bh);
        ctx.fillStyle = (this.hp / this.maxHP > 0.3) ? '#00aa00' : '#dd3300';
        ctx.fillRect(sx - bw / 2, sy - this.radius - 10, bw * (this.hp / this.maxHP), bh);
    }
}

// ========== MONSTERS ==========
// ========== MONSTER IMMUNITY SYSTEM ==========
// Immunities: 100% = immune (0 damage), 50-99% = resistant, <50% = normal
// Nightmare: some monsters gain resistances. Hell: some gain full immunity.
const MONSTER_IMMUNITIES = {
    // ACT1: undead = cold resistant, physical normal
    skeleton: { hell: { cold: 100 }, nightmare: { cold: 50 } },
    zombie: { hell: { cold: 100, poison: 75 }, nightmare: { cold: 50 } },
    // ACT2: desert = fire resistant
    mummy: { hell: { fire: 100 }, nightmare: { fire: 50 } },
    scarab: { hell: { poison: 100 }, nightmare: { poison: 50 } },
    sand_golem: { hell: { fire: 100, lightning: 75 }, nightmare: { fire: 50 } },
    // ACT3: jungle = poison resistant
    treeant: { hell: { fire: 100 }, nightmare: { fire: 50 } },
    poison_spider: { hell: { poison: 100 }, nightmare: { poison: 50 } },
    jungle_shaman: { hell: { lightning: 100 }, nightmare: { lightning: 50 } },
    // ACT4: hell = fire resistant
    demon: { hell: { fire: 100 }, nightmare: { fire: 50 } },
    hellhound: { hell: { fire: 100, cold: 75 }, nightmare: { fire: 50 } },
    imp: { hell: { fire: 100 }, nightmare: { fire: 50 } },
    // ACT5: ice = cold resistant
    frost_zombie: { hell: { cold: 100 }, nightmare: { cold: 50 } },
    ice_wraith: { hell: { cold: 100, lightning: 75 }, nightmare: { cold: 50 } },
    yeti: { hell: { cold: 100 }, nightmare: { cold: 50 } }
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
    zombie: { name: 'ゾンビ', r: 14, hp: 70, dmg: 12, spd: 40, xp: 35, color: '#3a4a25', loot: 0.45, icon: '🧟', defense: 10 },
    imp: { name: 'インプ', r: 10, hp: 30, dmg: 15, spd: 100, xp: 45, color: '#8a2a2a', loot: 0.5, icon: '👹', defense: 10, ranged: true, projSpd: 200, projColor: '#ff4422', preferredRange: 150, projCd: 1.8, element: 'fire' },
    ghost: { name: 'ゴースト', r: 11, hp: 25, dmg: 10, spd: 110, xp: 55, color: '#555588', loot: 0.55, icon: '👻', defense: 10 },
    demonlord: { name: 'デーモンロード', r: 22, hp: 300, dmg: 30, spd: 70, xp: 300, color: '#8a1515', loot: 1.0, icon: '👿', defense: 10 },
    // ACT2 monsters
    mummy: { name: 'マミー', r: 14, hp: 80, dmg: 14, spd: 45, xp: 40, color: '#a89060', loot: 0.45, icon: '🧟', defense: 25 },
    scarab: { name: 'スカラベ', r: 9, hp: 35, dmg: 18, spd: 120, xp: 50, color: '#44662a', loot: 0.4, icon: '🪲', defense: 25 },
    sand_golem: { name: 'サンドゴーレム', r: 18, hp: 120, dmg: 20, spd: 50, xp: 60, color: '#b8a060', loot: 0.5, icon: '🗿', defense: 25 },
    // ACT3 monsters
    treeant: { name: 'トレアント', r: 18, hp: 100, dmg: 16, spd: 40, xp: 55, color: '#2a5a1a', loot: 0.5, icon: '🌳', defense: 50 },
    poison_spider: { name: '毒蜘蛛', r: 8, hp: 28, dmg: 20, spd: 130, xp: 55, color: '#44aa22', loot: 0.45, icon: '🕷', defense: 50, ranged: true, projSpd: 180, projColor: '#44cc22', preferredRange: 120, projCd: 1.5, element: 'poison' },
    jungle_shaman: { name: 'ジャングルシャーマン', r: 12, hp: 50, dmg: 22, spd: 70, xp: 65, color: '#558844', loot: 0.55, icon: '🧙', defense: 50, ranged: true, projSpd: 160, projColor: '#88ff44', preferredRange: 180, projCd: 2.0, element: 'poison' },
    // ACT4 monsters
    demon: { name: 'デーモン', r: 16, hp: 130, dmg: 25, spd: 80, xp: 150, color: '#aa2020', loot: 0.55, icon: '👹', defense: 80 },
    hellhound: { name: 'ヘルハウンド', r: 12, hp: 70, dmg: 22, spd: 140, xp: 130, color: '#cc4400', loot: 0.50, icon: '🐕', defense: 80 },
    // ACT5 monsters
    frost_zombie: { name: 'フロストゾンビ', r: 14, hp: 140, dmg: 28, spd: 50, xp: 100, color: '#5588aa', loot: 0.45, icon: '🧟', defense: 120 },
    ice_wraith: { name: 'アイスレイス', r: 11, hp: 65, dmg: 24, spd: 110, xp: 110, color: '#88bbdd', loot: 0.5, icon: '👻', defense: 120, ranged: true, projSpd: 220, projColor: '#88ddff', preferredRange: 160, projCd: 1.6, element: 'cold' },
    yeti: { name: 'イエティ', r: 20, hp: 220, dmg: 35, spd: 60, xp: 140, color: '#aaccdd', loot: 0.55, icon: '🦍', defense: 120 }
};

// Champion/Unique monster affix system (D2-style)
const CHAMPION_AFFIXES = {
    extra_strong: { name: '剛力', color: '#ff6644', dmgMult: 1.5, hpMult: 1.0 },
    extra_fast: { name: '俊足', color: '#44ddff', spdMult: 1.5, hpMult: 1.0 },
    fire_enchanted: { name: '火炎', color: '#ff4400', hpMult: 1.2, element: 'fire', auraDmg: 3, auraColor: '#ff4400' },
    cold_enchanted: { name: '冷気', color: '#88ddff', hpMult: 1.2, element: 'cold', auraDmg: 2, auraColor: '#88ddff', slowOnHit: 0.4 },
    lightning_enchanted: { name: '雷光', color: '#ffff44', hpMult: 1.2, element: 'lightning', auraDmg: 4, auraColor: '#ffff44' },
    stone_skin: { name: '石肌', color: '#888888', defMult: 3.0, hpMult: 1.3 },
    cursed: { name: '呪い', color: '#aa44aa', hpMult: 1.1, curseDmg: 1.25 },
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
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
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
            _drewOGA = drawOGACreature(this.type, _dirIdx, G.time, sx - _drawSize / 2, sy + _mFeetY - _drawSize * 0.68, _drawSize, _drawSize);
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
                ctx.drawImage(hpEmpty, sx - bw / 2, hpY, bw, barH);
                if (mHpRatio > 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(sx - bw / 2, hpY, bw * mHpRatio, barH);
                    ctx.clip();
                    ctx.drawImage(hpFilled, sx - bw / 2, hpY, bw, barH);
                    ctx.restore();
                }
            } else {
                const hpY = sy - mScaledR - 10;
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(sx - bw / 2, hpY, bw, 4);
                const hpColor = this.isUnique ? '#ffd700' : this.isChampion ? '#6666ff' :
                    (mHpRatio > 0.3 ? '#00aa00' : '#dd3300');
                ctx.fillStyle = hpColor;
                ctx.fillRect(sx - bw / 2, hpY, bw * mHpRatio, 4);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(sx - bw / 2, hpY, bw, 4);
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
                        ctx.fillText(IMMUNITY_ICONS[ik] || '?', sx - totalW / 2 + ii * 12 + 6, hpY - 2);
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
            impG.addColorStop(0.4, color + Math.round(flashIntensity * 60).toString(16).padStart(2, '0'));
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
        drawSpr('skeleton', sx - dw / 2, sy - dh / 2, dw, dh, flipX, true);
        this._drawHitFlash(sx, sy, alphaFlash, this.r, '#ff4400');
    }

    _drawZombie(sx, sy, alphaFlash) {
        const flipX = player.x < this.x;
        const s = this.drawScale || 1;
        const dw = TILE * s, dh = TILE * s;
        drawSpr('zombie', sx - dw / 2, sy - dh / 2, dw, dh, flipX, true);
        this._drawHitFlash(sx, sy, alphaFlash, this.r, '#ff4400');
    }

    _drawImp(sx, sy, alphaFlash) {
        const flipX = player.x < this.x;
        const s = this.drawScale || 1;
        const dw = TILE * s, dh = TILE * s;
        drawSpr('imp', sx - dw / 2, sy - dh / 2, dw, dh, flipX, true);
        this._drawHitFlash(sx, sy, alphaFlash, this.r, '#ff4400');
    }

    _drawGhost(sx, sy, alphaFlash) {
        const flipX = player.x < this.x;
        const s = this.drawScale || 1;
        const dw = TILE * s, dh = TILE * s;
        ctx.globalAlpha = 0.55 + Math.sin(G.time * 3) * 0.15;
        drawSpr('banshee', sx - dw / 2, sy - dh / 2, dw, dh, flipX, true);
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

        drawSpr('deathKnight', sx - bw / 2, sy - bh / 2, bw, bh, flipX);

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
        const rr = parseInt(color.slice(1, 3), 16), gg = parseInt(color.slice(3, 5), 16), bb = parseInt(color.slice(5, 7), 16);
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
            ctx.drawImage(bossHpEmpty, sx - barW / 2, barY, barW, barH);
            if (hpPct > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(sx - barW / 2, barY, barW * hpPct, barH);
                ctx.clip();
                ctx.drawImage(bossHpFilled, sx - barW / 2, barY, barW, barH);
                ctx.restore();
            }
        } else {
            const barH = 5;
            ctx.fillStyle = '#333'; ctx.fillRect(sx - barW / 2, sy - this.r - 14, barW, barH);
            ctx.fillStyle = hpPct > 0.3 ? '#cc0000' : '#ff4400';
            ctx.fillRect(sx - barW / 2, sy - this.r - 14, barW * hpPct, barH);
            ctx.strokeStyle = '#666'; ctx.lineWidth = 0.5;
            ctx.strokeRect(sx - barW / 2, sy - this.r - 14, barW, barH);
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
            if (m.bossKey === 'skeleton_king') {
                setTimeout(() => {
                    if (DOM.gameClearScreen) {
                        DOM.gameClearScreen.style.display = 'flex';
                        setPaused(true);
                    }
                }, 1500);
            }
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
    const base = { common: 100, magic: 250, rare: 500, legendary: 1000, unique: 2000, runeword: 2500 };
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
            if (drawOGAProjectile(this.attribute, _dirIdx, G.time, _spawnOff, px - _sprSize / 2, py - _sprSize / 2, _sprSize, _sprSize)) {
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
                            px - _bSz / 2, py - _bSz / 2, _bSz, _bSz);
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
                        const a0 = worldToScreen(this.trail[i - 1].x, this.trail[i - 1].y);
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
                const a0 = worldToScreen(this.trail[i - 1].x, this.trail[i - 1].y);
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
        player.x = r0.cx * TILE + TILE / 2;
        player.y = r0.cy * TILE + TILE / 2;
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
                case 'low': count = 10 + G.actFloor * 5; break;
                case 'medium': count = 15 + G.actFloor * 8; break;
                case 'high': count = 20 + G.actFloor * 12; break;
                case 'boss': count = 5 + G.actFloor * 2; break; // fewer normal monsters on boss floors
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
            const bm = new Monster(bossRoom.cx * TILE + TILE / 2, bossRoom.cy * TILE + TILE / 2,
                actDef.monsterTypes[0], G.floor, actDef.bossType);
            monsters.push(bm);
            const bd = BOSS_DEFS[actDef.bossType];
            addLog(`⚠ ${bd ? bd.name : 'ボス'}が現れた！`, '#ff0000');
        }

        // D2-style area name in log
        const areaName = currentArea ? ` [${currentArea.name}]` : '';
        addLog(`ACT${G.act} ${actDef.name} - 第${G.actFloor}層${areaName}${G.cycle > 0 ? ' (' + (G.cycle + 1) + '周目)' : ''}`, '#aaaaff');
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
        this.rooms.push({ x: px, y: py, w: pw, h: ph, cx: px + pw / 2, cy: py + ph / 2 });

        // NPC alcoves around plaza
        const alcovePositions = [
            { x: px - 6, y: py + 2 }, { x: px + pw + 1, y: py + 2 },
            { x: px - 6, y: py + ph - 6 }, { x: px + pw + 1, y: py + ph - 6 },
            { x: px + pw / 2 - 2, y: py - 6 },
            { x: px + pw / 2 - 8, y: py + ph + 1 }, { x: px + pw / 2 + 4, y: py + ph + 1 },
            { x: px + pw / 2 + 7, y: py - 6 }
        ];
        for (const ap of alcovePositions) {
            for (let y = ap.y; y < ap.y + 5; y++)
                for (let x = ap.x; x < ap.x + 5; x++) this.set(x, y, 1);
            this.rooms.push({ x: ap.x, y: ap.y, w: 5, h: 5, cx: ap.x + 2, cy: ap.y + 2 });
            // Corridor to plaza
            const cx = ap.x + 2, cy = ap.y + 2;
            const pcx = px + pw / 2, pcy = py + ph / 2;
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
        this.stairsX = px + pw / 2;
        this.stairsY = py + ph - 2;
        this.set(this.stairsX, this.stairsY, 2);
    }
    _cacheTorchPositions() {
        this.torchPositions = [];
        for (let y = 0; y < MAP_H; y++) {
            for (let x = 0; x < MAP_W; x++) {
                if (this.get(x, y) !== 0) continue;
                const isExposed = this.walkable(x, y + 1) || this.walkable(x + 1, y) || this.walkable(x - 1, y) || this.walkable(x, y - 1);
                if (isExposed && (x * 7 + y * 13) % 19 === 0) {
                    this.torchPositions.push({ wx: x * TILE + TILE / 2, wy: y * TILE + TILE / 2 - 4, seed: x * 3 + y * 5 });
                }
            }
        }
    }
    idx(x, y) { return y * MAP_W + x; }
    get(x, y) { if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return 0; return this.tiles[this.idx(x, y)]; }
    set(x, y, v) { if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) this.tiles[this.idx(x, y)] = v; }
    walkable(x, y) { const t = this.get(x, y); return t === 1 || t === 2; }
    reveal() { } // Town is always explored
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
    player.x = r0.cx * TILE + TILE / 2;
    player.y = r0.cy * TILE + TILE / 2;
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
            x: room.cx * TILE + TILE / 2,
            y: room.cy * TILE + TILE / 2,
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
    const panels = ['dialogPanel', 'shopPanel', 'blacksmithPanel', 'gamblePanel', 'stashPanel', 'waypointPanel', 'questPanel', 'uberPanel', 'mercenaryPanel'];
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
window.buyItem = function (idx) {
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
window.sellItem = function (idx) {
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
window.gambleItem = function (idx) {
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
                Array.from({ length: total }, (_, i) => i < filled ? '🔶' : '◇').join('');
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
        const socketStr = Array.from({ length: total }, (_, i) => {
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
window.smithItem = function (source, key) {
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
window.switchSmithTab = function (tab) {
    smithTab = tab;
    socketTargetSource = null;
    renderBlacksmithUI();
};
window.selectSocketTarget = function (source, key) {
    if (source === null) { socketTargetSource = null; }
    else { socketTargetSource = { source, key }; }
    renderBlacksmithUI();
};
window.insertRuneUI = function (runeIdx) {
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
window.hireMerc = function (typeKey) {
    const cost = getMercHireCost(typeKey);
    if (G.gold < cost) { addLog('ゴールドが足りない', '#ff4444'); return; }
    G.gold -= cost;
    mercenary = new Mercenary(typeKey, player.x + 40, player.y);
    addLog(`${mercenary.name}を雇った！`, mercenary.def.color);
    renderMercenaryUI();
};
window.reviveMerc = function () {
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
window.dismissMerc = function () {
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
window.mercEquip = function (invIdx, slot) {
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
window.mercUnequip = function (slot) {
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
window.gambleBuy = function (idx) {
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
        const prefix = finalRarityKey !== 'common' ? prefixes[rand(0, prefixes.length - 1)] + ' ' : '';
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
window.gambleRefresh = function () {
    G.gambleItems = generateGambleItems();
    renderGamblingUI();
};

// D2-style skill reset (quest reward)
window.resetSkills = function () {
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
window.stashDeposit = function (idx) {
    if (G.stash.length >= G.maxStash) { addLog('倉庫が一杯', '#ff4444'); return; }
    G.stash.push(player.inventory.splice(idx, 1)[0]);
    renderStashUI();
};
window.stashWithdraw = function (idx) {
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
    player.x = startRoom.cx * TILE + TILE / 2;
    player.y = startRoom.cy * TILE + TILE / 2;
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
        const bm = new Monster(room.cx * TILE + TILE / 2, room.cy * TILE + TILE / 2, 'demon', 99, uKey);
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
            room.cx * TILE + TILE / 2 + randf(-60, 60),
            room.cy * TILE + TILE / 2 + randf(-60, 60),
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

// ========== LEVEL UP NOTICE ==========
let levelUpTimer = 0;
function showLevelUp() {
    levelUpTimer = 2;
    DOM.levelUpNotice.style.display = 'block';
}

// ========== UI UPDATES ==========
function updateStatsPanel() {
    const el = DOM.statsContent;
    if (!isPanelVisible(DOM.statsPanel)) return;
    const btn = (stat) => player.statPoints > 0 ? `<button class="stat-btn" onclick="allocStat('${stat}')">+</button>` : '';
    const hpPct = Math.round(player.hp / player.maxHP * 100);
    const mpPct = Math.round(player.mp / player.maxMP * 100);
    const xpPct = Math.round(player.xp / player.xpToNext * 100);
    const shieldOn = player.shieldT > 0 ? '<span style="color:#88f"> [シールド中]</span>' : '';
    const killCount = G.totalKills || 0;

    el.innerHTML = `
        <div style="text-align:center;margin-bottom:8px">
            <span style="color:#ffd700;font-size:18px;font-weight:bold">Lv.${player.level}</span>
            <span style="color:#888;font-size:11px;margin-left:8px">勇者</span>
        </div>
        <div style="background:#1a1020;border:1px solid #333;padding:6px;margin-bottom:8px;border-radius:3px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="color:#ff6666">HP ${Math.round(player.hp)}/${player.maxHP}</span>
                <span style="color:#ff6666;font-size:10px">${hpPct}%</span>
            </div>
            <div style="background:#300;height:8px;border-radius:4px;overflow:hidden;margin-bottom:6px">
                <div style="background:linear-gradient(90deg,#cc0000,#ff4444);height:100%;width:${hpPct}%;border-radius:4px;transition:width 0.3s"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="color:#6688ff">MP ${Math.round(player.mp)}/${player.maxMP}</span>
                <span style="color:#6688ff;font-size:10px">${mpPct}%</span>
            </div>
            <div style="background:#003;height:8px;border-radius:4px;overflow:hidden;margin-bottom:6px">
                <div style="background:linear-gradient(90deg,#0044cc,#4488ff);height:100%;width:${mpPct}%;border-radius:4px;transition:width 0.3s"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="color:#aa66ff">XP ${player.xp}/${player.xpToNext}</span>
                <span style="color:#aa66ff;font-size:10px">${xpPct}%</span>
            </div>
            <div style="background:#201030;height:6px;border-radius:3px;overflow:hidden">
                <div style="background:linear-gradient(90deg,#6622cc,#aa66ff);height:100%;width:${xpPct}%;border-radius:3px;transition:width 0.3s"></div>
            </div>
        </div>
        <div style="color:#ffcc44;font-size:11px;margin-bottom:4px">ステータスポイント: <span style="color:#ff8;font-weight:bold">${player.statPoints}</span></div>
        <hr style="border-color:#333;margin:6px 0">
        <div class="stat-row"><span class="stat-label">⚔ 筋力 (STR)</span><span class="stat-value">${player.getTotalStat('str')} ${btn('str')}</span></div>
        <div style="font-size:9px;color:#666;margin:-2px 0 4px 18px">物理ダメージ増加</div>
        <div class="stat-row"><span class="stat-label">🏹 敏捷 (DEX)</span><span class="stat-value">${player.getTotalStat('dex')} ${btn('dex')}</span></div>
        <div style="font-size:9px;color:#666;margin:-2px 0 4px 18px">クリティカル率増加</div>
        <div class="stat-row"><span class="stat-label">❤ 体力 (VIT)</span><span class="stat-value">${player.getTotalStat('vit')} ${btn('vit')}</span></div>
        <div style="font-size:9px;color:#666;margin:-2px 0 4px 18px">最大HP +5/pt</div>
        <div class="stat-row"><span class="stat-label">✨ 知力 (INT)</span><span class="stat-value">${player.getTotalStat('int')} ${btn('int')}</span></div>
        <div style="font-size:9px;color:#666;margin:-2px 0 4px 18px">最大MP +3/pt、回復量増加</div>
        <hr style="border-color:#333;margin:6px 0">
        <div style="color:#ccc;font-size:11px;margin-bottom:4px">⚔ 戦闘ステータス</div>
        <div class="stat-row"><span class="stat-label">攻撃力</span><span class="stat-value" style="color:#ff8866">${player.getAttackDmg()}</span></div>
        <div class="stat-row"><span class="stat-label">防御力</span><span class="stat-value" style="color:#88aaff">${player.getDefense()}${shieldOn}</span></div>
        <div class="stat-row"><span class="stat-label">クリティカル率</span><span class="stat-value" style="color:#ffcc44">${player.getCritChance().toFixed(1)}%</span></div>
        <div class="stat-row"><span class="stat-label">クリティカルダメージ</span><span class="stat-value" style="color:#ffaa22">${player.getCritDamage()}%</span></div>
        <div class="stat-row"><span class="stat-label">ライフスティール</span><span class="stat-value" style="color:#44ff88">${player.getLifesteal()}%</span></div>
        <div class="stat-row"><span class="stat-label">攻撃速度</span><span class="stat-value" style="color:#66ccff">+${((player.passiveBonuses && player.passiveBonuses.attackSpeed) || 0) + ((player.setBonuses && player.setBonuses.atkSpd) || 0)}%</span></div>
        <div class="stat-row"><span class="stat-label">回避率</span><span class="stat-value" style="color:#88ff88">${((player.passiveBonuses && player.passiveBonuses.dodgeChance) || 0).toFixed(1)}%</span></div>
        <div class="stat-row"><span class="stat-label">移動速度</span><span class="stat-value">${Math.round(player.speed)}</span></div>
        <div class="stat-row"><span class="stat-label">ブロック率</span><span class="stat-value" style="color:#88aaff">${player.getBlockChance().toFixed(1)}%</span></div>
        <div class="stat-row"><span class="stat-label">マジックファインド</span><span class="stat-value" style="color:#00dd66">${player.getMagicFind()}%</span></div>
        ${player.getSkillBonus() > 0 ? `<div class="stat-row"><span class="stat-label">全スキル</span><span class="stat-value" style="color:#ffaa44">+${player.getSkillBonus()}</span></div>` : ''}
        <hr style="border-color:#333;margin:6px 0">
        <div style="color:#ccc;font-size:11px;margin-bottom:4px">🛡 属性耐性</div>
        <div class="stat-row"><span class="stat-label">🔥 火炎耐性</span><span class="stat-value" style="color:#ff4400">${player.getResistance('fire')}%</span></div>
        <div class="stat-row"><span class="stat-label">❄ 冷気耐性</span><span class="stat-value" style="color:#88ddff">${player.getResistance('cold')}%</span></div>
        <div class="stat-row"><span class="stat-label">⚡ 雷耐性</span><span class="stat-value" style="color:#ffff44">${player.getResistance('lightning')}%</span></div>
        <div class="stat-row"><span class="stat-label">☠ 毒耐性</span><span class="stat-value" style="color:#44cc22">${player.getResistance('poison')}%</span></div>
        <hr style="border-color:#333;margin:6px 0">
        <div style="color:#ccc;font-size:11px;margin-bottom:4px">🗺 探索情報</div>
        <div class="stat-row"><span class="stat-label">難易度</span><span class="stat-value" style="color:${DIFFICULTY_DEFS[G.difficulty || 'normal'].color}">${DIFFICULTY_DEFS[G.difficulty || 'normal'].name}</span></div>
        <div class="stat-row"><span class="stat-label">現在地</span><span class="stat-value" style="color:${G.inUber ? '#ff4400' : '#aa88ff'}">${G.inUber ? 'パンデモニウム' : 'ACT' + G.act + ' ' + (G.inTown ? '町' : '第' + G.actFloor + '層')}${G.cycle > 0 ? ' (' + (G.cycle + 1) + '周目)' : ''}</span></div>
        <div class="stat-row"><span class="stat-label">ゴールド</span><span class="stat-value" style="color:#ffd700">${G.gold}G</span></div>
        <div class="stat-row"><span class="stat-label">残り敵数</span><span class="stat-value" style="color:#ff6666">${monsters.reduce((n, m) => n + (m.alive ? 1 : 0), 0)}</span></div>
        <div class="stat-row"><span class="stat-label">装備品</span><span class="stat-value">${player.inventory.length}/${player.maxInv}</span></div>
        <div class="stat-row"><span class="stat-label">ポーション</span><span class="stat-value">${player.potionInv.length}/${player.maxPotionInv}</span></div>
        <div class="stat-row"><span class="stat-label">チャーム</span><span class="stat-value">${player.charmInv.length}/${player.maxCharmInv}</span></div>
        <div class="stat-row"><span class="stat-label">総キル数</span><span class="stat-value" style="color:#ff6666">${G.totalKills || 0}</span></div>
    `;
}

let helpActiveTab = 'basics';
window.setHelpTab = function (tab) { helpActiveTab = tab; renderHelpUI(); };

function renderHelpUI() {
    const tabsEl = document.getElementById('helpTabs');
    const contentEl = document.getElementById('helpContent');
    if (!tabsEl || !contentEl) return;

    const tabs = [
        { id: 'basics', label: '基本操作' },
        { id: 'combat', label: '戦闘' },
        { id: 'skills', label: 'スキル' },
        { id: 'items', label: '装備・アイテム' },
        { id: 'dungeon', label: 'ダンジョン' },
        { id: 'growth', label: 'クラス・成長' },
        { id: 'keys', label: 'キー一覧' },
    ];

    tabsEl.innerHTML = tabs.map(t =>
        `<button class="help-tab${helpActiveTab === t.id ? ' active' : ''}" onclick="setHelpTab('${t.id}')">${t.label}</button>`
    ).join('');

    let h = '';

    // Unspent skill points banner (always shown)
    if (player.skillPoints > 0) {
        h += `<div style="background:rgba(170,85,34,0.5);border:1px solid #ffd700;padding:6px 10px;margin-bottom:8px;border-radius:3px;font-size:11px;text-align:center">
            ⚡ 未使用のスキルポイントが <span style="color:#ffd700;font-weight:bold">${player.skillPoints}</span> ポイントあります！ <span class="help-key">T</span> でスキルツリーを開こう
        </div>`;
    }

    switch (helpActiveTab) {

        case 'basics':
            h += `<div class="help-section-title">基本操作</div>`;
            h += `<div class="help-sub-title">移動</div>`;
            h += `<div class="help-row"><span class="help-key">左クリック</span> 地面をクリックして移動</div>`;
            h += `<div class="help-row"><span class="help-key">←↑→↓</span> 矢印キーでも移動可能</div>`;
            h += `<div class="help-tip">移動は慣性があります。敵の攻撃を避けながら戦いましょう。</div>`;

            h += `<div class="help-sub-title">攻撃</div>`;
            h += `<div class="help-row"><span class="help-key">左クリック</span> 敵をクリックして通常攻撃（自動で近づく）</div>`;
            h += `<div class="help-row"><span class="help-key">A</span> 最も近い敵に自動で攻撃</div>`;
            h += `<div class="help-tip help-tip-good">Aキーを連打するだけで最寄りの敵を攻撃できます。初心者におすすめ。</div>`;

            h += `<div class="help-sub-title">スキル発動</div>`;
            h += `<div class="help-row"><span class="help-key">右クリック</span> マウス方向にスキル発動</div>`;
            h += `<div class="help-row"><span class="help-key">S</span> 選択中スキルを最寄りの敵に発動</div>`;
            h += `<div class="help-row"><span class="help-key">1</span>〜<span class="help-key">6</span> スキルスロットを選択して即発動</div>`;
            h += `<div class="help-tip">スキルにはMP消費とクールダウンがあります。画面下部のスキルバーで確認。</div>`;

            h += `<div class="help-sub-title">アイテム拾得</div>`;
            h += `<div class="help-row"><span class="help-key">Space</span> 近くのアイテムを拾う / 階段を降りる</div>`;
            h += `<div class="help-row"><span class="help-key">G</span> 自動拾い ON/OFF</div>`;
            h += `<div class="help-row"><span class="help-key">P</span> 自動拾いフィルタ切替（レアリティ）</div>`;
            h += `<div class="help-tip">ポーションは拾うと即座にHP+50回復。装備はインベントリに入ります。</div>`;

            h += `<div class="help-sub-title">画面・メニュー</div>`;
            h += `<div class="help-row"><span class="help-key">I</span> インベントリ（装備管理）</div>`;
            h += `<div class="help-row"><span class="help-key">C</span> キャラクターステータス</div>`;
            h += `<div class="help-row"><span class="help-key">T</span> スキルツリー</div>`;
            h += `<div class="help-row"><span class="help-key">R</span> スキルショートカット編集</div>`;
            h += `<div class="help-row"><span class="help-key">H</span> この手引書</div>`;
            h += `<div class="help-row"><span class="help-key">O</span> 設定画面</div>`;
            h += `<div class="help-row"><span class="help-key">Esc</span> 一時停止</div>`;

            h += `<div class="help-sub-title">セーブ / ロード</div>`;
            h += `<div class="help-row"><span class="help-key">F5</span> ゲームをセーブ</div>`;
            h += `<div class="help-row"><span class="help-key">F8</span> セーブデータをロード</div>`;
            h += `<div class="help-tip help-tip-warn">ブラウザのローカルストレージに保存されます。キャッシュ削除で消える可能性があります。</div>`;
            break;

        case 'combat':
            h += `<div class="help-section-title">戦闘システム</div>`;

            h += `<div class="help-sub-title">通常攻撃</div>`;
            h += `<div class="help-row">敵を左クリックまたは<span class="help-key">A</span>キーで通常攻撃</div>`;
            h += `<div style="color:#aaa;font-size:11px;margin:4px 0">ダメージ = STR(力) × 武器倍率 − 敵の防御力</div>`;
            h += `<div style="color:#aaa;font-size:11px;margin:4px 0">クリティカル率は DEX(技) に依存</div>`;

            h += `<div class="help-sub-title">スキル攻撃</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">スキルは通常攻撃より高い倍率で強力。レベルアップで倍率が上昇。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">アクティブスキルはスロット<span class="help-key">1</span>〜<span class="help-key">6</span>に配置して使用。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">パッシブスキルは習得するだけで常時効果を発揮。スロット不要。</div>`;
            h += `<div class="help-tip">スキルレベルが上がるとMP消費は微増、クールダウンは減少します。</div>`;

            h += `<div class="help-sub-title">スキルの種類</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:2px 0"><span style="color:#ff8844">近接攻撃</span> ─ バッシュ、ジール等。射程が短いが高倍率</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:2px 0"><span style="color:#ff8844">範囲攻撃</span> ─ ワールウィンド、フロストノヴァ等。周囲を一掃</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:2px 0"><span style="color:#ff8844">遠距離攻撃</span> ─ ファイアアロー等。安全な距離から攻撃</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:2px 0"><span style="color:#4488ff">バフ</span> ─ シャウト等。一定時間ステータスを強化</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:2px 0"><span style="color:#ff4444">デバフ</span> ─ タウント等。敵を弱体化</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:2px 0"><span style="color:#66aaff">パッシブ</span> ─ 剣の極意等。常時発動のステータス上昇</div>`;

            h += `<div class="help-sub-title">回復</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">敵がドロップするポーションでHP回復（+50）。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">一部スキル（ヒール系）やライフスティール装備でも回復可能。</div>`;

            h += `<div class="help-sub-title">死亡と復活</div>`;
            h += `<div class="help-tip help-tip-warn">HPが0になると死亡。クリックまたはSpaceで同じ階の入口から復活します。装備やスキルは失われません。</div>`;

            h += `<div class="help-sub-title">ボスモンスター</div>`;
            h += `<div style="color:#ff4444;font-size:11px;margin:4px 0">5階ごとにデーモンロードが出現。高HPで強力ですが、倒すと大量のレアアイテムをドロップ。</div>`;
            break;

        case 'skills':
            h += `<div class="help-section-title">スキルシステム</div>`;

            h += `<div class="help-sub-title">スキルツリー <span class="help-key">T</span></div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">各クラスは3つのブランチ（系統）を持ち、各ブランチにスキルが配置されています。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">ツリー表示では依存関係が線で表示されます：</div>`;
            h += `<div style="color:#b8943d;font-size:11px;margin:2px 0 2px 12px">━ 金色の実線 = 前提条件（上のスキルを先に習得する必要あり）</div>`;
            h += `<div style="color:#55cc77;font-size:11px;margin:2px 0 2px 12px">╌ 緑色の破線 = シナジー（他スキルのLvでボーナス）</div>`;
            h += `<div class="help-tip">ツリー上でスキルにホバーすると、関連する線がハイライトされます。</div>`;

            h += `<div class="help-sub-title">スキルの習得</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">レベルアップ時にスキルポイントを獲得。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">スキルツリー画面で左クリックして習得（最大Lv.${SKILL_MAX_LEVEL}）。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">一部のスキルはキャラクターレベルの制限あり（Lv.1/6/12/18/24/30）。</div>`;

            h += `<div class="help-sub-title">スキルスロット <span class="help-key">R</span></div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">習得したアクティブスキルをスロット1〜6に配置して使用。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">ツリー画面で右クリック → 空きスロットに自動配置。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0"><span class="help-key">R</span>キーでスキル編集画面を開き、細かく入替可能。</div>`;

            h += `<div class="help-sub-title">シナジー</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">一部のスキルは別のスキルからシナジーボーナスを受けます。</div>`;
            h += `<div class="help-tip help-tip-good">例：ワールウィンドはダブルスイングとコンセントレイトのLvごとに+8%ダメージ。関連スキルを幅広く育てるのが効果的。</div>`;

            // Show current skill slots
            h += `<div class="help-sub-title">現在のスキルスロット</div>`;
            for (let i = 1; i <= 6; i++) {
                const sk = player.skills[i];
                if (sk && sk.id) {
                    const lvl = player.skillLevels[sk.id] || 0;
                    h += `<div style="margin:2px 0;color:#ccc;font-size:11px;display:flex;align-items:center;gap:4px"><span class="help-key">${i}</span> <img src="${getSkillIconDataURL(sk, 18)}" width="18" height="18" style="vertical-align:middle"> ${sk.name} Lv.${lvl} <span style="color:#4488ff">${sk.mp}MP</span></div>`;
                } else {
                    h += `<div style="margin:2px 0;color:#666;font-size:11px"><span class="help-key">${i}</span> 未設定</div>`;
                }
            }
            break;

        case 'items':
            h += `<div class="help-section-title">装備・アイテム</div>`;

            h += `<div class="help-sub-title">アイテムの拾得</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">敵を倒すと装備やポーションをドロップ。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0"><span class="help-key">Space</span>で手動拾得、または<span class="help-key">G</span>で自動拾いON。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0"><span class="help-key">P</span>で自動拾いフィルタを変更（コモン以上/マジック以上/...）。</div>`;

            h += `<div class="help-sub-title">レアリティ</div>`;
            h += `<div style="margin:6px 0;font-size:12px;line-height:2">`;
            h += `<span style="color:#ccc;background:#333;padding:2px 8px;border-radius:3px">コモン</span> `;
            h += `<span style="color:#6688ff;background:#1a1a3e;padding:2px 8px;border-radius:3px">マジック</span> `;
            h += `<span style="color:#ffdd44;background:#3a2e10;padding:2px 8px;border-radius:3px">レア</span> `;
            h += `<span style="color:#ff8800;background:#3a1a00;padding:2px 8px;border-radius:3px">レジェンダリー</span> `;
            h += `<span style="color:#00dd66;background:#0a2a1a;padding:2px 8px;border-radius:3px">ユニーク</span>`;
            h += `</div>`;
            h += `<div class="help-tip">高レアリティほど多くのランダムプロパティが付与。深い階層ほど出現確率UP。</div>`;

            h += `<div class="help-sub-title">装備スロット</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">武器 / 盾（オフハンド） / 頭 / 体 / リング / アミュレット / 足</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0"><span class="help-key">I</span>でインベントリを開き、アイテムをクリックして装備。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">装備中のアイテムをクリックすると外してインベントリに戻ります。</div>`;

            h += `<div class="help-sub-title">ランダムプロパティ</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">装備には攻撃力・防御力のほか、ランダムな追加効果が付くことがあります：</div>`;
            h += `<div style="color:#aaa;font-size:10px;margin:2px 0 2px 12px">+STR, +DEX, +VIT, +INT / +クリティカル率 / +攻撃速度 / +ライフスティール / +移動速度 など</div>`;

            h += `<div class="help-sub-title">ポーション</div>`;
            h += `<div style="color:#00ff00;font-size:11px;margin:4px 0">赤いポーションを拾うとHP+50即時回復。インベントリには入りません。</div>`;
            break;

        case 'dungeon':
            h += `<div class="help-section-title">ダンジョン探索</div>`;

            h += `<div class="help-sub-title">階層構造</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">ダンジョンは地下へ進むほど難易度が上昇。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">各階はランダム生成され、敵・宝箱・階段が配置されます。</div>`;

            h += `<div class="help-sub-title">階段の使い方</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">紫色に光る階段に近づき <span class="help-key">Space</span> または <span class="help-key">E</span> キーで次の階へ。</div>`;
            h += `<div class="help-tip help-tip-warn">階段付近の敵を倒す必要があります（全滅は不要）。階段の周囲200px以内に敵がいると使用できません。</div>`;
            h += `<div class="help-tip help-tip-good">階段の近く（300px以内）には新しい敵がスポーンしません。敵を倒しながら近づけば安全に降りられます。</div>`;

            h += `<div class="help-sub-title">宝箱</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">宝箱の上に乗ると自動的に開きます。装備やポーションを獲得。</div>`;

            h += `<div class="help-sub-title">敵の出現</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">ダンジョン内では一定間隔で敵が追加出現します（最大数あり）。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">深い階層ではより強力なモンスターが登場：</div>`;
            h += `<div style="color:#aaa;font-size:10px;margin:2px 0 2px 12px">1〜2F: スケルトン、ゾンビ</div>`;
            h += `<div style="color:#aaa;font-size:10px;margin:2px 0 2px 12px">3〜4F: + インプ</div>`;
            h += `<div style="color:#aaa;font-size:10px;margin:2px 0 2px 12px">5〜6F: + ゴースト</div>`;
            h += `<div style="color:#aaa;font-size:10px;margin:2px 0 2px 12px">7F〜 : インプ、ゴースト</div>`;
            h += `<div style="color:#ff4444;font-size:11px;margin:6px 0">5階ごとにボス「デーモンロード」が出現！</div>`;
            break;

        case 'growth':
            h += `<div class="help-section-title">クラス・成長システム</div>`;

            h += `<div class="help-sub-title">レベルアップ</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">敵を倒してXPを獲得。一定量でレベルアップ。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">レベルアップ報酬：</div>`;
            h += `<div style="color:#aaa;font-size:10px;margin:2px 0 2px 12px">ステータスポイント +5 → <span class="help-key">C</span>画面で STR/DEX/VIT/INT に振り分け</div>`;
            h += `<div style="color:#aaa;font-size:10px;margin:2px 0 2px 12px">スキルポイント +1 → <span class="help-key">T</span>画面でスキル習得/強化</div>`;

            h += `<div class="help-sub-title">ステータス</div>`;
            h += `<div style="color:#ff8844;font-size:11px;margin:2px 0"><b>STR（力）</b> ─ 物理攻撃力に直結</div>`;
            h += `<div style="color:#44dd44;font-size:11px;margin:2px 0"><b>DEX（技）</b> ─ クリティカル率・命中に影響</div>`;
            h += `<div style="color:#ff4444;font-size:11px;margin:2px 0"><b>VIT（体力）</b> ─ 最大HPを増加</div>`;
            h += `<div style="color:#4488ff;font-size:11px;margin:2px 0"><b>INT（知力）</b> ─ 最大MPを増加</div>`;

            h += `<div class="help-sub-title">クラス昇格（転職）</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">Lv.${PROMOTION_LEVEL} かつ Act1ボス（骸骨王）討伐で上位クラスに昇格可能。</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:4px 0">各基本クラスは2つの上位クラスから選択できます。</div>`;
            h += `<div class="help-tip">上位クラスは基本クラスのスキルに加え、新しいスキルツリーを獲得。両方のスキルを使用可能。</div>`;

            // Current class info
            if (G.playerClass && CLASS_DEFS[G.playerClass]) {
                const cd = CLASS_DEFS[G.playerClass];
                h += `<div class="help-sub-title">現在のクラス</div>`;
                h += `<div style="color:#ffd700;font-size:13px;margin:4px 0">${cd.icon} ${cd.name} (${cd.engName})</div>`;
                if (cd.tier === 1 && cd.baseClass) {
                    const base = CLASS_DEFS[cd.baseClass];
                    h += `<div style="color:#88ff88;font-size:11px">✓ 上位クラス昇格済 (${base.icon} ${base.name} → ${cd.icon} ${cd.name})</div>`;
                } else if (cd.tier === 0) {
                    const promos = CLASS_PROMOTIONS[G.playerClass] || [];
                    if (promos.length > 0) {
                        const act1BossDefeated = !!(G.bossesDefeated && G.bossesDefeated.skeleton_king);
                        const canPromote = (player.level >= PROMOTION_LEVEL) && act1BossDefeated;
                        const why = !act1BossDefeated ? '骸骨王討伐が必要' : `Lv.${PROMOTION_LEVEL} (あと${PROMOTION_LEVEL - player.level})`;
                        h += `<div style="color:${canPromote ? '#ffaa44' : '#888'};font-size:11px;margin:4px 0">${canPromote ? '⚡ 昇格可能！' : `昇格条件: ${why}`}</div>`;
                        h += `<div style="font-size:11px;color:#ccc;margin:4px 0">昇格先：</div>`;
                        for (const p of promos) {
                            const pDef = CLASS_DEFS[p.key];
                            if (pDef) {
                                h += `<div style="font-size:11px;color:#ffd700;margin:2px 0 2px 12px">${pDef.icon} ${pDef.name} ─ <span style="color:#aaa">${pDef.branches.join(' / ')}</span></div>`;
                            }
                        }
                    }
                }
            }

            h += `<div class="help-sub-title">基本クラス</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:2px 0">⚔ バーバリアン ─ 近接物理。高HP・高火力</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:2px 0">🏹 アマゾン ─ 遠距離・ジャベリン。高DEX</div>`;
            h += `<div style="color:#ccc;font-size:11px;margin:2px 0">✨ ソーサレス ─ 魔法攻撃。高INT・範囲火力</div>`;
            break;

        case 'keys':
            h += `<div class="help-section-title">キーバインド一覧</div>`;
            const keys = [
                ['操作', [
                    ['左クリック', '移動 / 敵を攻撃'],
                    ['右クリック', '選択中スキルをマウス方向に発動'],
                    ['←↑→↓', 'キーボード移動'],
                    ['A', '最寄りの敵を自動攻撃'],
                    ['S', '選択中スキルを最寄り敵に発動'],
                    ['1〜6', 'スキルスロット選択＆即発動'],
                    ['Q', 'HP回復薬を使う'],
                    ['W', 'MP回復薬を使う'],
                    ['Space', 'アイテムを拾う / 階段を降りる'],
                ]],
                ['メニュー', [
                    ['I', 'インベントリ（装備管理）'],
                    ['C', 'キャラクターステータス'],
                    ['T', 'スキルツリー'],
                    ['R', 'スキルショートカット編集'],
                    ['H', 'この手引書'],
                    ['O', '設定画面'],
                    ['Esc', '一時停止 / メニュー閉じ'],
                ]],
                ['ダンジョン', [
                    ['Space', 'アイテム拾い ＆ 階段を降りる'],
                    ['E', '階段を降りる（専用キー）'],
                    ['V', 'タウンポータル（帰還）'],
                    ['TAB', 'オーバーレイマップ表示/非表示'],
                ]],
                ['アイテム', [
                    ['G', '自動拾いの ON / OFF'],
                    ['P', '自動拾いフィルタ切替'],
                ]],
                ['システム', [
                    ['F5', 'ゲームをセーブ'],
                    ['F8', 'セーブデータをロード'],
                ]],
            ];
            for (const [category, bindings] of keys) {
                h += `<div class="help-sub-title">${category}</div>`;
                for (const [key, desc] of bindings) {
                    h += `<div class="help-row"><span class="help-key">${key}</span> ${desc}</div>`;
                }
            }

            h += `<div class="help-sub-title">スキルツリー内操作</div>`;
            h += `<div class="help-row"><span class="help-key">左クリック</span> スキル習得 (+1)</div>`;
            h += `<div class="help-row"><span class="help-key">右クリック</span> スロットに配置</div>`;
            h += `<div class="help-row">ホバー ─ 詳細ツールチップ表示</div>`;

            h += `<div class="help-sub-title">スキル編集画面 (R) 内</div>`;
            h += `<div class="help-row"><span class="help-key">1〜6</span> スロット選択</div>`;
            h += `<div class="help-row"><span class="help-key">A</span> 配置モード</div>`;
            h += `<div class="help-row"><span class="help-key">W</span> 入替モード</div>`;
            h += `<div class="help-row"><span class="help-key">X</span> スロットからスキルを外す</div>`;
            break;
    }

    contentEl.innerHTML = h;
}

window.allocStat = function (stat) {
    if (player.statPoints <= 0) return;
    player[stat]++;
    player.statPoints--;
    player.recalcStats();
    updateStatsPanel();
};

function updateInventoryPanel() {
    const el = DOM.inventoryContent;
    if (!isPanelVisible(DOM.inventoryPanel)) return;
    // Apply Dark Fantasy UI inventory background
    if (ogaLoaded && OGA.ui_inventory_a && !DOM.inventoryPanel._bgApplied) {
        DOM.inventoryPanel.style.backgroundImage = `url(${OGA.ui_inventory_a.src})`;
        DOM.inventoryPanel.style.backgroundSize = 'cover';
        DOM.inventoryPanel.style.backgroundPosition = 'center';
        DOM.inventoryPanel.style.backgroundBlendMode = 'overlay';
        DOM.inventoryPanel._bgApplied = true;
    }
    const tab = player.invTab || 0;

    let html = '<div style="color:#aaa;font-size:11px;margin-bottom:6px">装備スロット (クリックで外す)</div>';
    html += '<div class="equip-slots">';
    const slotNames = { weapon: '武器', offhand: '盾', head: '頭', body: '胴', ring: '指', amulet: '首', feet: '足' };
    for (const [slot, label] of Object.entries(slotNames)) {
        const item = player.equipment[slot];
        const filled = item ? 'filled' : '';
        let style = item ? `border-color:${item.rarity.color}` : '';
        // OGA armor icon hint for empty slots (uses canvas to clip sprite cell)
        let slotIconHtml = '';
        if (!item && ogaLoaded && OGA.ui_armor_icons) {
            const slotPos = OGA_ARMOR_SLOT_MAP[slot];
            if (slotPos) {
                // Scale 64px cells to fit 40px slot height; 5 cells = 200px total
                const cellSz = 40;
                const bgSz = cellSz * 5;
                const bgX = -(slotPos.col * cellSz);
                const bgY = -(slotPos.row * cellSz);
                slotIconHtml = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none"><div style="width:${cellSz}px;height:${cellSz}px;background:url(asset/opengameart/armor_icons.png) ${bgX}px ${bgY}px / ${bgSz}px ${bgSz}px;opacity:0.3"></div></div>`;
            }
        }
        html += `<div class="equip-slot ${filled}" style="${style}" onclick="unequipSlot('${slot}')"
            onmouseenter="showEquipTooltip(event,'${slot}')" onmouseleave="hideTooltip()">
            ${item ? item.icon : slotIconHtml}
            <div class="slot-label">${label}</div>
        </div>`;
    }
    html += '</div>';

    // Tab buttons
    const tabNames = ['⚔ 装備', '🧪 ポーション', '🔷 チャーム'];
    html += '<div style="display:flex;gap:2px;margin:8px 0 4px">';
    for (let t = 0; t < 3; t++) {
        const active = tab === t;
        html += `<button onclick="switchInvTab(${t})" style="flex:1;padding:4px 2px;font-size:10px;border:1px solid ${active ? '#ffd700' : '#555'};background:${active ? '#332800' : '#1a1a1a'};color:${active ? '#ffd700' : '#888'};cursor:pointer;border-radius:3px">${tabNames[t]}</button>`;
    }
    html += '</div>';

    if (tab === 0) {
        // Equipment/general inventory tab
        const inv = player.inventory;
        html += `<div style="color:#aaa;font-size:11px;margin:4px 0">装備品 ${inv.length}/${player.maxInv} (右クリック:売却 / ダブルクリック:装備)</div>`;
        html += `<div style="margin-bottom:4px;display:flex;gap:4px"><button class="toggle-btn" onclick="sortInventory('rarity')" style="font-size:10px;padding:2px 6px">レア度順</button><button class="toggle-btn" onclick="sortInventory('type')" style="font-size:10px;padding:2px 6px">種類順</button><button class="toggle-btn" onclick="sortInventory('name')" style="font-size:10px;padding:2px 6px">名前順</button></div>`;
        html += '<div class="inv-grid">';
        for (let i = 0; i < player.maxInv; i++) {
            const item = inv[i];
            if (item) {
                const sel = (window._selectedInvIdx === i) ? ' selected' : '';
                const qtyBadge = (item.qty || 1) > 1 ? `<div style="position:absolute;bottom:1px;right:2px;background:rgba(0,0,0,0.8);padding:0 3px;font-size:9px;color:#fff;border-radius:2px">x${item.qty}</div>` : '';
                html += `<div class="inv-cell${sel}" style="border-color:${item.rarity.color}40;position:relative"
                    onclick="selectInvItem(${i})" ondblclick="equipInvItem(${i})"
                    oncontextmenu="showInvContextMenu(event,${i})"
                    onmouseenter="showInvTooltip(event,${i})" onmouseleave="hideTooltip()">
                    ${item.icon}${qtyBadge}
                </div>`;
            } else {
                html += '<div class="inv-cell"></div>';
            }
        }
        html += '</div>';
    } else if (tab === 1) {
        // Potion tab
        const inv = player.potionInv;
        html += `<div style="color:#aaa;font-size:11px;margin:4px 0">ポーション ${inv.length}/${player.maxPotionInv} (Q:HP / W:MP)</div>`;
        html += '<div class="inv-grid">';
        for (let i = 0; i < player.maxPotionInv; i++) {
            const item = inv[i];
            if (item) {
                const qtyBadge = (item.qty || 1) > 1 ? `<div style="position:absolute;bottom:1px;right:2px;background:rgba(0,0,0,0.8);padding:0 3px;font-size:9px;color:#fff;border-radius:2px">x${item.qty}</div>` : '';
                html += `<div class="inv-cell" style="border-color:${isRejuvPotion(item) ? '#dd44ff40' : isHPPotion(item) ? '#00ff0040' : '#4488ff40'};position:relative"
                    oncontextmenu="showPotionContextMenu(event,${i})"
                    onmouseenter="showPotionTooltip(event,${i})" onmouseleave="hideTooltip()">
                    ${item.icon}${qtyBadge}
                </div>`;
            } else {
                html += '<div class="inv-cell"></div>';
            }
        }
        html += '</div>';
    } else if (tab === 2) {
        // Charm tab
        const inv = player.charmInv;
        html += `<div style="color:#aaa;font-size:11px;margin:4px 0">チャーム ${inv.length}/${player.maxCharmInv} (所持でパッシブ発動)</div>`;
        html += '<div class="inv-grid">';
        for (let i = 0; i < player.maxCharmInv; i++) {
            const item = inv[i];
            if (item) {
                html += `<div class="inv-cell" style="border-color:${item.rarity.color}40;position:relative"
                    oncontextmenu="showCharmContextMenu(event,${i})"
                    onmouseenter="showCharmTooltip(event,${i})" onmouseleave="hideTooltip()">
                    ${item.icon}
                </div>`;
            } else {
                html += '<div class="inv-cell"></div>';
            }
        }
        html += '</div>';
    }

    // Quest items section
    if (G.questItems.length > 0) {
        html += `<div style="color:#daa520;font-size:11px;margin:8px 0 4px">🗝 キーアイテム</div>`;
        html += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
        for (const qi of G.questItems) {
            const kd = UBER_KEY_DEFS[qi.uberKeyId];
            const col = kd ? kd.color : '#ffd700';
            html += `<div style="padding:3px 8px;background:#1a1a10;border:1px solid ${col};border-radius:4px;font-size:11px;color:${col}">${qi.icon} ${escapeHtml(qi.name)}</div>`;
        }
        html += '</div>';
    }
    el.innerHTML = html;
}

window._selectedInvIdx = -1;
window.switchInvTab = function (t) { player.invTab = t; window._selectedInvIdx = -1; updateInventoryPanel(); };
window.unequipSlot = function (slot) { player.unequipSlot(slot); updateInventoryPanel(); };
window.selectInvItem = function (i) {
    window._selectedInvIdx = (window._selectedInvIdx === i) ? -1 : i;
    updateInventoryPanel();
};
window.equipInvItem = function (i) {
    window._selectedInvIdx = -1;
    player.equipItem(i);
    updateInventoryPanel();
};
window.showInvContextMenu = function (e, i) {
    e.preventDefault();
    closeInvContextMenu();
    const item = player.inventory[i];
    if (!item) return;
    const menu = document.createElement('div');
    menu.className = 'inv-context-menu';
    menu.id = 'inv-context-menu';
    let menuHTML = `<div style="color:#ffd700;font-size:11px;padding:4px 14px;cursor:default">${escapeHtml(item.name)}${(item.qty || 1) > 1 ? ' x' + item.qty : ''}</div>`;
    // Sell option (available anywhere, not just in town)
    if (!item.uberKeyId) {
        const sellPrice = calculateSellPrice(item);
        const totalSellPrice = isPotion(item) ? sellPrice * (item.qty || 1) : sellPrice;
        menuHTML += `<div onclick="sellInvItem(${i})" style="color:#ffd700">売却 (+${totalSellPrice}G)</div>`;
    }
    if (isPotion(item) && (item.qty || 1) > 1) {
        menuHTML += `<div onclick="dropOnePotionInv(${i})">1つ捨てる</div>`;
        menuHTML += `<div onclick="confirmDropInvItem(${i})">全て捨てる</div>`;
    } else {
        menuHTML += `<div onclick="confirmDropInvItem(${i})">捨てる</div>`;
    }
    menuHTML += `<div onclick="closeInvContextMenu()">キャンセル</div>`;
    menu.innerHTML = menuHTML;
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', closeInvContextMenu, { once: true }), 0);
};
window.closeInvContextMenu = function () {
    const m = document.getElementById('inv-context-menu');
    if (m) m.remove();
};
window.confirmDropInvItem = function (i) {
    closeInvContextMenu();
    const item = player.inventory[i];
    if (item) {
        dropItem(player.x, player.y, item);
        player.inventory.splice(i, 1);
        addLog(`${item.name} を捨てた`, '#888');
        window._selectedInvIdx = -1;
        updateInventoryPanel();
    }
};

window.sortInventory = function (mode) {
    const rarityOrder = ['common', 'magic', 'rare', 'legendary', 'unique', 'runeword'];
    if (mode === 'rarity') {
        player.inventory.sort((a, b) => rarityOrder.indexOf(b.rarityKey) - rarityOrder.indexOf(a.rarityKey));
    } else if (mode === 'type') {
        player.inventory.sort((a, b) => a.typeKey.localeCompare(b.typeKey));
    } else if (mode === 'name') {
        player.inventory.sort((a, b) => a.name.localeCompare(b.name));
    }
    window._selectedInvIdx = -1;
    updateInventoryPanel();
};

// Potion tab tooltip & context menu
window.showPotionTooltip = function (e, i) {
    const item = player.potionInv[i];
    if (!item) return;
    const tt = DOM.tooltip;
    tt.innerHTML = buildTooltipHTML(item, false);
    tt.style.display = 'block';
    tt.style.left = (e.clientX + 15) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
};
window.showPotionContextMenu = function (e, i) {
    e.preventDefault();
    closeInvContextMenu();
    const item = player.potionInv[i];
    if (!item) return;
    const menu = document.createElement('div');
    menu.className = 'inv-context-menu';
    menu.id = 'inv-context-menu';
    let menuHTML = `<div style="color:#ffd700;font-size:11px;padding:4px 14px;cursor:default">${escapeHtml(item.name)}${(item.qty || 1) > 1 ? ' x' + item.qty : ''}</div>`;
    const sellPrice = calculateSellPrice(item);
    menuHTML += `<div onclick="sellPotionItem(${i})" style="color:#ffd700">売却 (+${sellPrice * (item.qty || 1)}G)</div>`;
    if ((item.qty || 1) > 1) menuHTML += `<div onclick="dropOnePotionTab(${i})">1つ捨てる</div>`;
    menuHTML += `<div onclick="dropPotionItem(${i})">全て捨てる</div>`;
    menuHTML += `<div onclick="closeInvContextMenu()">キャンセル</div>`;
    menu.innerHTML = menuHTML;
    menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px';
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', closeInvContextMenu, { once: true }), 0);
};
window.sellPotionItem = function (i) {
    closeInvContextMenu();
    const item = player.potionInv[i];
    if (!item) return;
    const price = calculateSellPrice(item) * (item.qty || 1);
    G.gold += price;
    addLog(`${item.name} を売却 (+${price}G)`, '#ffd700');
    player.potionInv.splice(i, 1);
    updateInventoryPanel();
};
window.dropOnePotionTab = function (i) {
    closeInvContextMenu();
    const item = player.potionInv[i];
    if (!item || !isPotion(item)) return;
    dropItem(player.x, player.y, generatePotion(item.typeKey));
    item.qty = (item.qty || 1) - 1;
    if (item.qty <= 0) player.potionInv.splice(i, 1);
    addLog(`${item.name} を1つ捨てた`, '#888');
    updateInventoryPanel();
};
window.dropPotionItem = function (i) {
    closeInvContextMenu();
    const item = player.potionInv[i];
    if (!item) return;
    dropItem(player.x, player.y, item);
    player.potionInv.splice(i, 1);
    addLog(`${item.name} を捨てた`, '#888');
    updateInventoryPanel();
};
// Charm tab tooltip & context menu
window.showCharmTooltip = function (e, i) {
    const item = player.charmInv[i];
    if (!item) return;
    const tt = DOM.tooltip;
    tt.innerHTML = buildTooltipHTML(item, false);
    tt.style.display = 'block';
    tt.style.left = (e.clientX + 15) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
};
window.showCharmContextMenu = function (e, i) {
    e.preventDefault();
    closeInvContextMenu();
    const item = player.charmInv[i];
    if (!item) return;
    const menu = document.createElement('div');
    menu.className = 'inv-context-menu';
    menu.id = 'inv-context-menu';
    let menuHTML = `<div style="color:#ffd700;font-size:11px;padding:4px 14px;cursor:default">${escapeHtml(item.name)}</div>`;
    const sellPrice = calculateSellPrice(item);
    menuHTML += `<div onclick="sellCharmItem(${i})" style="color:#ffd700">売却 (+${sellPrice}G)</div>`;
    menuHTML += `<div onclick="dropCharmItem(${i})">捨てる</div>`;
    menuHTML += `<div onclick="closeInvContextMenu()">キャンセル</div>`;
    menu.innerHTML = menuHTML;
    menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px';
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', closeInvContextMenu, { once: true }), 0);
};
window.sellCharmItem = function (i) {
    closeInvContextMenu();
    const item = player.charmInv[i];
    if (!item) return;
    G.gold += calculateSellPrice(item);
    addLog(`${item.name} を売却 (+${calculateSellPrice(item)}G)`, '#ffd700');
    player.charmInv.splice(i, 1);
    player.recalcStats();
    updateInventoryPanel();
};
window.dropCharmItem = function (i) {
    closeInvContextMenu();
    const item = player.charmInv[i];
    if (!item) return;
    dropItem(player.x, player.y, item);
    player.charmInv.splice(i, 1);
    player.recalcStats();
    addLog(`${item.name} を捨てた`, '#888');
    updateInventoryPanel();
};

window.dropOnePotionInv = function (i) {
    closeInvContextMenu();
    const item = player.inventory[i];
    if (!item || !isPotion(item)) return;
    const dropped = generatePotion(item.typeKey);
    dropItem(player.x, player.y, dropped);
    item.qty = (item.qty || 1) - 1;
    if (item.qty <= 0) player.inventory.splice(i, 1);
    addLog(`${item.name} を1つ捨てた`, '#888');
    window._selectedInvIdx = -1;
    updateInventoryPanel();
};
window.sellInvItem = function (i) {
    closeInvContextMenu();
    const item = player.inventory[i];
    if (!item || item.uberKeyId) return;
    const price = calculateSellPrice(item);
    const totalPrice = isPotion(item) ? price * (item.qty || 1) : price;
    G.gold += totalPrice;
    player.inventory.splice(i, 1);
    addLog(`${item.name}${isPotion(item) && (item.qty || 1) > 1 ? ' x' + (item.qty || 1) : ''} を売却 (+${totalPrice}G)`, '#ffd700');
    window._selectedInvIdx = -1;
    updateInventoryPanel();
};

function compareItems(newItem, equippedItem) {
    const avgDmg = (it) => it && it.baseDmg ? (it.baseDmg[0] + it.baseDmg[1]) / 2 : 0;
    const dmgDiff = avgDmg(newItem) - avgDmg(equippedItem);
    const defDiff = (newItem.baseDef || 0) - (equippedItem ? equippedItem.baseDef || 0 : 0);
    const statKeys = ['str', 'dex', 'vit', 'int', 'dmgPct', 'hp', 'mp', 'lifesteal', 'atkSpd', 'def', 'critChance', 'moveSpd'];
    const sumStats = (it) => {
        const m = {};
        if (it) for (const a of it.affixes) m[a.stat] = (m[a.stat] || 0) + a.value;
        return m;
    };
    const nStats = sumStats(newItem), eStats = sumStats(equippedItem);
    const affixDiffs = {};
    for (const k of statKeys) {
        const d = (nStats[k] || 0) - (eStats[k] || 0);
        if (d !== 0) affixDiffs[k] = d;
    }
    return { dmgDiff, defDiff, affixDiffs };
}

function buildTooltipHTML(item, showComparison) {
    if (!item) return '';
    // Rune tooltip
    if (isRune(item)) {
        const rd = item.runeDef || RUNE_DEFS[item.runeId];
        let html = `<div class="tt-name" style="color:${rd.color}">🔶 ${rd.name}のルーン</div>`;
        html += `<div class="tt-type" style="color:#daa520">ルーン (Tier ${rd.tier})</div>`;
        html += `<div style="color:#aaa;margin:4px 0;font-size:11px">装着効果: <span style="color:#0f0">${rd.desc}</span></div>`;
        // Show runewords this rune is part of
        const rws = RUNEWORD_DEFS.filter(rw => rw.runes.includes(rd.id));
        if (rws.length > 0) {
            html += `<div style="border-top:1px solid #444;margin:6px 0;padding-top:4px;font-size:10px;color:#daa520">使用ルーンワード:</div>`;
            for (const rw of rws) {
                const names = rw.runes.map(id => RUNE_DEFS[id].name).join('+');
                html += `<div style="font-size:9px;color:#888">${rw.nameJP}【${rw.name}】= ${names}</div>`;
            }
        }
        html += `<div style="color:#888;font-size:10px;margin-top:4px">鍛冶屋でソケット装備に装着 | 右クリックで捨てる</div>`;
        return html;
    }
    // Uber key tooltip
    if (item.uberKeyId) {
        const kd = UBER_KEY_DEFS[item.uberKeyId];
        let html = `<div class="tt-name" style="color:${kd ? kd.color : '#ffd700'}">${kd ? kd.icon : '🗝'} ${escapeHtml(item.name)}</div>`;
        html += `<div class="tt-type" style="color:#daa520">クエストアイテム</div>`;
        html += `<div style="color:#aaa;margin:4px 0;font-size:11px">${item.desc || ''}</div>`;
        html += `<div style="color:#888;font-size:10px;margin-top:4px">ACT5の闇商人に持っていけ</div>`;
        return html;
    }
    if (isCharm(item)) {
        let html = `<div class="tt-name" style="color:${item.rarity.color}">${escapeHtml(item.name)}</div>`;
        html += `<div class="tt-type">${item.typeInfo.name} — ${item.rarity.name}</div>`;
        for (const a of (item.affixes || [])) {
            html += `<div style="color:#8888ff;margin:2px 0">${a.text}</div>`;
        }
        html += `<div style="color:#aaa;font-size:10px;margin-top:4px">チャーム欄に入れるとパッシブ発動</div>`;
        return html;
    }
    if (isPotion(item)) {
        const ti = item.typeInfo || ITEM_TYPES[item.typeKey];
        let html = `<div class="tt-name" style="color:${isRejuvPotion(item) ? '#dd44ff' : '#cccccc'}">${escapeHtml(item.name)}</div>`;
        if ((item.qty || 1) > 1) html += `<div style="color:#aaa;font-size:11px">所持数: ${item.qty}</div>`;
        if (isRejuvPotion(item)) {
            const pct = Math.round((ti.rejuvPct || 0.35) * 100);
            html += `<div style="color:#dd44ff;margin:4px 0">HP・MP ${pct}% 即時回復</div>`;
            html += `<div style="color:#888;font-size:10px;margin-top:4px">Q/Wキーで使用 | 右クリックで捨てる</div>`;
        } else if (isHPPotion(item)) {
            const heal = ti.heal || 45;
            const dur = ti.healDur || 7;
            html += `<div style="color:#00ff00;margin:4px 0">HP +${heal} (${dur}秒間)</div>`;
            html += `<div style="color:#888;font-size:10px;margin-top:4px">Qキーで使用 | 右クリックで捨てる</div>`;
        } else if (isMPPotion(item)) {
            const heal = ti.healMP || 30;
            const dur = ti.healDur || 5;
            html += `<div style="color:#4488ff;margin:4px 0">MP +${heal} (${dur}秒間)</div>`;
            html += `<div style="color:#888;font-size:10px;margin-top:4px">Wキーで使用 | 右クリックで捨てる</div>`;
        }
        return html;
    }
    const slot = item.typeInfo.slot;
    let cmp = null;
    if (showComparison && slot) {
        const equipped = player.equipment[slot];
        cmp = compareItems(item, equipped);
    }
    const diffSpan = (val, unit) => {
        if (!val) return '';
        const c = val > 0 ? '#0f0' : '#f44';
        const arrow = val > 0 ? '▲' : '▼';
        const sign = val > 0 ? '+' : '';
        const v = Number.isInteger(val) ? val : val.toFixed(1);
        return ` <span style="color:${c};font-size:11px">${arrow} ${sign}${v}${unit}</span>`;
    };
    let html = `<div class="tt-name" style="color:${item.rarity.color}">${escapeHtml(item.name)}</div>`;
    html += `<div class="tt-type">${item.typeInfo.name} — ${item.rarity.name}</div>`;
    if (item.baseDmg) {
        html += `<div style="color:#fff;margin:4px 0">ダメージ: ${item.baseDmg[0]}-${item.baseDmg[1]}${cmp ? diffSpan(cmp.dmgDiff, '') : ''}</div>`;
        let atkSpdPct = (player.passiveBonuses && player.passiveBonuses.attackSpeed) || 0;
        for (const s of Object.values(player.equipment)) { if (s) for (const a of s.affixes) if (a.stat === 'atkSpd') atkSpdPct += a.value; }
        const atkPerSec = (1 + atkSpdPct / 100) / 0.5;
        const avgDmg = (item.baseDmg[0] + item.baseDmg[1]) / 2;
        const cc = Math.min(player.getCritChance(), 80) / 100;
        const cd = player.getCritDamage() / 100;
        const dps = (avgDmg * atkPerSec * (1 + cc * (cd - 1))).toFixed(1);
        html += `<div style="color:#ffaa00;font-size:11px;margin:2px 0">DPS: ${dps}</div>`;
    }
    if (item.baseDef) html += `<div style="color:#fff;margin:4px 0">防御: +${item.baseDef}${cmp ? diffSpan(cmp.defDiff, '') : ''}</div>`;
    // Socket display
    if (item.sockets > 0) {
        const filled = item.socketedRunes ? item.socketedRunes.length : 0;
        let sockHtml = `<div style="color:#daa520;margin:4px 0;font-size:11px">ソケット [${filled}/${item.sockets}]: `;
        for (let i = 0; i < item.sockets; i++) {
            if (i < filled) {
                const rn = item.socketedRunes[i];
                sockHtml += `<span style="color:#daa520">🔶${RUNE_DEFS[rn.runeId].name}</span> `;
            } else {
                sockHtml += `<span style="color:#555">◇空</span> `;
            }
        }
        sockHtml += `</div>`;
        html += sockHtml;
    }
    // Affixes: separate regular, rune, and runeword
    const regularAffixes = item.affixes.filter(a => !a.runeSource && !a.runewordSource);
    const runeAffixes = item.affixes.filter(a => a.runeSource);
    const rwAffixes = item.affixes.filter(a => a.runewordSource);
    for (const a of regularAffixes) html += `<div class="tt-affix">${escapeHtml(a.text)}</div>`;
    if (runeAffixes.length > 0) {
        for (const a of runeAffixes) html += `<div class="tt-affix" style="color:#daa520">${escapeHtml(a.text)} (${escapeHtml(a.runeSource)})</div>`;
    }
    if (rwAffixes.length > 0) {
        html += `<div style="border-top:1px solid #daa520;margin:4px 0;padding-top:4px;color:#daa520;font-weight:bold">★ ルーンワード: ${escapeHtml(item.runeword)}</div>`;
        for (const a of rwAffixes) html += `<div class="tt-affix" style="color:#daa520">${escapeHtml(a.text)}</div>`;
    }
    // Required level
    if (item.requiredLevel) {
        const canEquip = player.level >= item.requiredLevel;
        html += `<div style="color:${canEquip ? '#888' : '#ff4444'};font-size:10px;margin:4px 0">必要レベル: ${item.requiredLevel}${canEquip ? '' : ' (不足)'}</div>`;
    }
    // Set item info
    if (item.setKey && ITEM_SETS[item.setKey]) {
        const setDef = ITEM_SETS[item.setKey];
        const equipped = countEquippedSetPieces(item.setKey);
        html += `<div style="border-top:1px solid ${setDef.color};margin:6px 0;padding-top:6px;color:${setDef.color};font-weight:bold">⚙ ${setDef.name}</div>`;
        for (const typeKey of Object.keys(setDef.pieces)) {
            const pName = setDef.pieces[typeKey];
            const have = Object.values(player.equipment).some(e => e && e.setKey === item.setKey && e.name === pName);
            html += `<div style="color:${have ? '#0f0' : '#666'};font-size:10px">${have ? '✓' : '○'} ${pName}</div>`;
        }
        for (const [reqCount, bonus] of Object.entries(setDef.bonuses)) {
            const active = equipped >= parseInt(reqCount);
            html += `<div style="color:${active ? '#0f0' : '#888'};font-size:10px;margin-top:2px">(${reqCount}個) ${bonus.desc}</div>`;
        }
    }
    if (cmp) {
        const statNames = { str: '筋力', dex: '敏捷', vit: '体力', int: '知力', dmgPct: '% ダメージ', hp: 'HP', mp: 'MP', lifesteal: '% ライフスティール', atkSpd: '% 攻撃速度', def: '防御', critChance: '% クリティカル率', critDmg: '% クリティカルダメージ', moveSpd: '% 移動速度', fireRes: '% 火炎耐性', coldRes: '% 冷気耐性', lightRes: '% 雷耐性', poisonRes: '% 毒耐性', allRes: '% 全耐性', blockChance: '% ブロック率', magicFind: '% MF', skillBonus: ' 全スキル' };
        const diffs = Object.entries(cmp.affixDiffs);
        if (diffs.length > 0) {
            html += `<div style="border-top:1px solid #555;margin:4px 0;padding-top:4px">`;
            for (const [k, v] of diffs) {
                const c = v > 0 ? '#0f0' : '#f44';
                const arrow = v > 0 ? '▲' : '▼';
                const sign = v > 0 ? '+' : '';
                html += `<div style="color:${c};font-size:11px">${arrow} ${sign}${v} ${statNames[k] || k}</div>`;
            }
            html += `</div>`;
        }
        const eqName = player.equipment[slot] ? player.equipment[slot].name : 'なし';
        html += `<div style="color:#888;font-size:10px;margin-top:4px">現在: ${eqName}</div>`;
    }
    if (item.typeInfo.slot) html += `<div class="tt-equip">ダブルクリックで装備</div>`;
    return html;
}

function effectDesc(sk) {
    if (!sk) return '';
    // Handle passive skills
    if (sk.skillType === 'passive' && sk.passiveEffect) {
        const pe = sk.passiveEffect;
        const statNames = { critChance: 'クリティカル率', damagePercent: 'ダメージ', defensePercent: '防御力', attackSpeed: '攻撃速度', moveSpeed: '移動速度', manaRegen: 'マナ回復', maxHP: '最大HP', maxMP: '最大MP', lifeSteal: 'ライフスティール', dodgeChance: '回避率' };
        return `パッシブ: ${statNames[pe.stat] || pe.stat} +${pe.baseBonus}/Lv (Lv20で+${(pe.baseBonus + pe.perLevel * 19).toFixed(0)})`;
    }
    const range = (arr) => Array.isArray(arr) ? `${arr[0]}-${arr[arr.length - 1]}` : (typeof arr === 'number' ? `${arr}` : '');
    const mult = (arr) => Array.isArray(arr) ? `x${arr[0]}〜x${arr[arr.length - 1]}` : (typeof arr === 'number' ? `x${arr}` : '');
    const dur = (arr) => Array.isArray(arr) ? `${arr[0]}〜${arr[arr.length - 1]}秒` : (typeof arr === 'number' ? `${arr}秒` : '');
    const pct = (arr) => Array.isArray(arr) ? `${Math.round(arr[0] * 100)}〜${Math.round(arr[arr.length - 1] * 100)}%` : (typeof arr === 'number' ? `${Math.round(arr * 100)}%` : '');
    switch (sk.effect) {
        case 'melee_burst': return `近接単体に強打。倍率 ${mult(sk.baseMult)} / 射程 ${sk.range || '-'}。`;
        case 'whirlwind': return `近接範囲攻撃。倍率 ${mult(sk.baseMult)} / 半径 ${sk.range || '-'}。`;
        case 'stun_aoe': return `範囲スタン。持続 ${dur(sk.duration)} / 半径 ${sk.range || '-'}。`;
        case 'buff_frenzy': return `攻撃速度/移動速度を強化。持続 ${dur(sk.duration)}。`;
        case 'execute': return `HPが低い敵に強烈な一撃。倍率 ${mult(sk.baseMult)} / しきい値 ${pct(sk.threshold)}。`;
        case 'debuff_defense': return `防御低下。持続 ${dur(sk.duration)} / 低下 ${pct(sk.reduction)} / 半径 ${sk.range || '-'}。`;
        case 'buff_defense': return `被ダメ軽減。持続 ${dur(sk.duration)} / 軽減 ${pct(sk.reduction)}。`;
        case 'buff_crit': return `クリティカル上昇。持続 ${dur(sk.duration)} / +${range(sk.bonus)}%。`;
        case 'battle_orders': return `最大HP/MPを強化。持続 ${dur(sk.duration)} / +${pct(sk.bonus)}。`;
        case 'charge': return `指定位置へ突進して攻撃。倍率 ${mult(sk.baseMult)} / 距離 ${sk.range || '-'}。`;
        case 'ground_slam': return `地面衝撃で範囲攻撃。倍率 ${mult(sk.baseMult)} / 減速 ${pct(sk.slow)}。`;
        case 'buff_berserk': return `攻撃力強化状態。持続 ${dur(sk.duration)}。`;
        case 'buff_speed': return `移動速度上昇。持続 ${dur(sk.duration)} / +${pct(sk.bonus)}。`;
        case 'buff_atkspd': return `攻撃速度上昇。持続 ${dur(sk.duration)} / +${pct(sk.bonus)}。`;
        case 'buff_poison': return `毒付与。持続 ${dur(sk.duration)} / 毒DPS ${range(sk.dps)}。`;
        case 'chain_lightning': return `連鎖稲妻。倍率 ${mult(sk.baseMult)} / 連鎖 ${range(sk.bounces)}回。`;
        case 'consecrate': return `範囲持続ダメージ。倍率 ${mult(sk.baseMult)} / 半径 ${sk.range || '-'} / 持続 ${dur(sk.duration)}。`;
        case 'multi_shot': return `複数弾を発射。倍率 ${mult(sk.baseMult)} / 本数 ${range(sk.arrows)}。`;
        case 'projectile_fire': return `弾を発射。倍率 ${mult(sk.baseMult)} / 速度 ${sk.speed || '-'}。`;
        case 'arrow_rain': return `矢の雨。倍率 ${mult(sk.baseMult)} / 半径 ${sk.range || '-'}。`;
        case 'frost_nova': return `冷気爆発で凍結。倍率 ${mult(sk.baseMult)} / 凍結 ${range(sk.freeze)}秒。`;
        case 'summon_minion': return `ミニオン召喚。持続 ${dur(sk.duration)} / HP ${range(sk.minionHP)} / ATK ${range(sk.minionDmg)}。`;
        case 'buff_dodge': return `回避率上昇。持続 ${dur(sk.duration)} / ${range(sk.chance)}%。`;
        case 'teleport': return `短距離テレポート。距離 ${range(sk.range)}。`;
        case 'mana_shield': return `被ダメをMPで吸収。持続 ${dur(sk.duration)} / 吸収 ${pct(sk.absorb)}。`;
        case 'buff_counter': return `被弾時に反射。持続 ${dur(sk.duration)} / 反射 ${pct(sk.reflect)}。`;
        case 'buff_aura': return `回復オーラ。持続 ${dur(sk.duration)} / 回復 ${range(sk.regen)} / 被ダメ軽減 ${pct(sk.reduction)}。`;
        case 'frozen_orb': return `氷のオーブが破片を撒く。倍率 ${mult(sk.baseMult)} / 破片 ${range(sk.shardCount)}。`;
        case 'meteor': return `隕石落下。倍率 ${mult(sk.baseMult)} / 半径 ${sk.range || '-'}。`;
        case 'holy_burst': return `聖属性の範囲攻撃。倍率 ${mult(sk.baseMult)} / 半径 ${sk.range || '-'}。`;
        case 'place_trap': return `罠を設置。ダメージ ${mult(sk.baseMult)}。`;
        case 'self_heal_pct': return `自分のHP回復。回復量 ${pct(sk.pct)}。`;
        case 'shadow_strike': return `影から急襲。倍率 ${mult(sk.baseMult)} / 射程 ${sk.range || '-'}。`;
        case 'smoke_screen': return `煙幕で無敵/回避強化。持続 ${dur(sk.duration)}。`;
        default: return sk.desc || '';
    }
}

function buildSkillTooltipHTML(sk, slot) {
    if (!sk) return '';
    const isPassive = sk.skillType === 'passive';
    const nameColor = isPassive ? '#66aaff' : '#ffd700';
    const typeLabel = isPassive ? '◆パッシブ' : '';
    const name = `<img src="${getSkillIconDataURL(sk, 20)}" width="20" height="20" style="vertical-align:middle"> ${sk.name || ''}`.trim();
    const lvl = player.skillLevels[sk.id] || 0;

    // Show scaled MP/CD for current level
    let mp = '', cd = '';
    if (!isPassive) {
        mp = lvl > 0 ? `MP: ${getSkillMPCost(sk, lvl)}` : (sk.mp != null ? `MP: ${sk.mp}` : '');
        cd = lvl > 0 ? `CD: ${getSkillCooldown(sk, lvl).toFixed(1)}s` : (sk.cd != null ? `CD: ${sk.cd}s` : (sk.maxCD != null ? `CD: ${sk.maxCD}s` : ''));
    }
    const key = slot ? `キー: ${slot}` : '';
    const meta = [key, mp, cd].filter(Boolean).join(' | ');
    const levelInfo = `Lv.${lvl}/${SKILL_MAX_LEVEL}`;

    // Passive effect info
    let passiveInfo = '';
    if (isPassive && sk.passiveEffect) {
        const pe = sk.passiveEffect;
        const statNames = { critChance: 'クリティカル率', damagePercent: 'ダメージ%', defensePercent: '防御力%', attackSpeed: '攻撃速度', moveSpeed: '移動速度', manaRegen: 'マナ回復/秒', maxHP: '最大HP', maxMP: '最大MP', lifeSteal: 'ライフスティール%', dodgeChance: '回避率%' };
        const curVal = lvl > 0 ? (pe.baseBonus + pe.perLevel * (lvl - 1)).toFixed(1) : pe.baseBonus.toFixed(1);
        const nextVal = lvl < SKILL_MAX_LEVEL ? (pe.baseBonus + pe.perLevel * lvl).toFixed(1) : '-';
        passiveInfo = `<div style="color:#88ccff;margin-top:4px;font-size:10px">
            ${statNames[pe.stat] || pe.stat}: +${curVal}${lvl < SKILL_MAX_LEVEL ? ` → 次: +${nextVal}` : ' (最大)'}
            <br>Lv毎: +${pe.perLevel}
        </div>`;
    }

    // Synergy info
    let synergyInfo = '';
    if (sk.synergies && sk.synergies.length > 0) {
        const allAvail = getAllAvailableSkills();
        synergyInfo = '<div style="color:#aaffaa;margin-top:4px;font-size:10px;border-top:1px solid #333;padding-top:3px">シナジー:</div>';
        for (const syn of sk.synergies) {
            const fromLvl = player.skillLevels[syn.from] || 0;
            const fromName = allAvail.find(s => s.id === syn.from)?.name || syn.from;
            const curBonus = Math.round(fromLvl * syn.bonus * 100);
            const typeNames = { damage: 'ダメージ', duration: '持続', range: '範囲', freeze: '凍結', heal: '回復' };
            synergyInfo += `<div style="color:#aaffaa;font-size:9px">+${Math.round(syn.bonus * 100)}% ${typeNames[syn.type] || syn.type}/${fromName}のポイント (現在: +${curBonus}%)</div>`;
        }
    }

    // reqLevel info
    const reqLevelInfo = sk.reqLevel && player.level < sk.reqLevel
        ? `<div style="color:#ff4444;font-size:10px">必要レベル: ${sk.reqLevel}</div>` : '';

    return `<div class="tt-name" style="color:${nameColor}">${name} ${typeLabel}</div>
        <div class="tt-type" style="font-size:10px">${levelInfo} ${meta ? '| ' + meta : ''}</div>
        <div style="color:#ccc;margin-top:4px;font-size:11px">${effectDesc(sk)}</div>
        ${passiveInfo}${synergyInfo}${reqLevelInfo}`;
}

window.showInvTooltip = function (e, i) {
    const item = player.inventory[i];
    if (!item) return;
    const tt = DOM.tooltip;
    tt.innerHTML = buildTooltipHTML(item, true);
    tt.style.display = 'block';
    tt.style.left = (e.clientX + 15) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
};
window.showStashTooltip = function (e, i) {
    const item = G.stash[i];
    if (!item) return;
    const tt = DOM.tooltip;
    tt.innerHTML = buildTooltipHTML(item, false);
    tt.style.display = 'block';
    tt.style.left = (e.clientX + 15) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
};
window.showEquipTooltip = function (e, slot) {
    const item = player.equipment[slot];
    if (!item) return;
    const tt = DOM.tooltip;
    tt.innerHTML = buildTooltipHTML(item);
    tt.style.display = 'block';
    tt.style.left = (e.clientX + 15) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
};
window.showSkillTooltip = function (e, skillId) {
    const allAvail = getAllAvailableSkills();
    const sk = allAvail.find(s => s.id === skillId);
    if (!sk) return;
    const tt = DOM.tooltip;
    tt.innerHTML = buildSkillTooltipHTML(sk);
    tt.style.display = 'block';
    tt.style.left = (e.clientX + 15) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
};
window.hideTooltip = function () { DOM.tooltip.style.display = 'none'; };

window.toggleSkillTreeView = function () {
    skillTreeViewMode = skillTreeViewMode === 'tree' ? 'list' : 'tree';
    updateSkillTreeUI();
};

function updateSkillTreeUI() {
    const el = DOM.skillTreeContent;
    if (!G.playerClass) return;
    const classDef = CLASS_DEFS[G.playerClass];
    const baseClassDef = classDef.baseClass ? CLASS_DEFS[classDef.baseClass] : null;
    let html = `<div style="text-align:center;margin-bottom:10px">
        <span style="font-size:20px">${classDef.icon}</span>
        <span style="color:#ffd700;font-size:16px;font-weight:bold;margin-left:8px">${classDef.name}</span>
        <span style="color:#888;font-size:12px;margin-left:8px">(${classDef.engName})</span>
        ${classDef.tier > 0 ? '<span style="color:#ff8800;font-size:10px;margin-left:6px">★上位クラス</span>' : ''}
        <div style="color:#ffcc44;font-size:12px;margin-top:6px">スキルポイント: <span style="color:#ff8;font-weight:bold">${player.skillPoints}</span></div>
    </div>`;
    html += `<div style="text-align:center;margin-bottom:8px">
        <span style="color:#aaa;font-size:11px">ショートカット操作:</span>
        <button class="toggle-btn" onclick="setSkillEditMode('assign')">編集画面 (R)</button>
        <button class="toggle-btn" style="margin-left:6px" onclick="toggleSkillTreeView()">${skillTreeViewMode === 'tree' ? '📋 リスト表示' : '🌳 ツリー表示'}</button>
        ${treeSwapFromSlot ? `<button class="toggle-btn" style="margin-left:6px" onclick="cancelTreeSwap()">入替キャンセル</button>
        <span style="color:#66ccff;font-size:11px;margin-left:6px">入替中 (元スロット: ${treeSwapFromSlot})</span>` : ''}
    </div>`;
    if (treeSwapFromSlot) {
        html += `<div style="text-align:center;margin-bottom:10px">
            <span style="color:#888;font-size:11px">入替先 (ショートカット側):</span>
            ${[1, 2, 3, 4, 5, 6].map(n => {
            const sk = player.skills[n];
            const label = sk ? `${n}:<img src="${getSkillIconDataURL(sk, 18)}" width="18" height="18" style="vertical-align:middle"> ${sk.name || ''}` : `${n}:空`;
            return `<button class="toggle-btn" style="margin-left:4px" onclick="treeSwapTo(${n})">${label}</button>`;
        }).join('')}
        </div>`;
    }

    if (skillTreeViewMode === 'tree') {
        html += renderBranchesTree(classDef, null);
        if (baseClassDef) {
            html += renderBranchesTree(baseClassDef, '--- ' + baseClassDef.name + 'スキル ---');
        }
    } else {
        html += renderBranchesList(classDef, null);
        if (baseClassDef) {
            html += renderBranchesList(baseClassDef, '--- ' + baseClassDef.name + 'スキル ---');
        }
    }
    el.innerHTML = html;

    if (skillTreeViewMode === 'tree') {
        requestAnimationFrame(() => drawSkillTreeConnections());
    }
}

// ===== LIST VIEW (original) =====
function renderBranchesList(cDef, label) {
    let h = '';
    const allAvail = getAllAvailableSkills();
    if (label) h += `<div style="color:#aa88ff;font-size:12px;text-align:center;margin:8px 0 4px;border-top:1px solid #333;padding-top:6px">${label}</div>`;
    for (let b = 0; b < cDef.branches.length; b++) {
        const branchSkills = cDef.skills.filter(s => s.branch === b);
        h += '<div class="skill-branch"><div class="skill-branch-title">' + cDef.branches[b] + '</div>';
        h += '<div class="skill-grid">';
        for (const sk of branchSkills) {
            const lvl = player.skillLevels[sk.id] || 0;
            const maxLvl = SKILL_MAX_LEVEL;
            const isPassive = sk.skillType === 'passive';
            const meetsPrereq = checkPrereqs(sk);
            const meetsLevel = !sk.reqLevel || player.level >= sk.reqLevel;
            const canLearn = lvl < maxLvl && player.skillPoints > 0 && meetsPrereq && meetsLevel;
            let stateClass = lvl >= maxLvl ? 'maxed' : lvl > 0 ? 'unlocked' : canLearn ? '' : 'locked';
            if (isPassive) stateClass += ' passive';

            const pct = Math.round((lvl / maxLvl) * 100);
            const barClass = isPassive ? 'passive' : 'active';
            const progressBar = `<div class="skill-progress"><div class="skill-progress-bar ${barClass}" style="width:${pct}%"></div></div>`;

            const btnHtml = canLearn ? '<button class="sn-btn" onclick="learnSkill(\'' + sk.id + '\')">習得 (+1)</button>' : '';
            const assignBtn = (lvl > 0 && !isPassive) ? '<button class="sn-btn" style="background:#4a6a4a;margin-left:4px" onclick="quickAssignSkill(\'' + sk.id + '\')">スロットに設定</button>' : '';
            const shortcutBtns = (lvl > 0 && !isPassive)
                ? `<div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">
                    <button class="sn-btn" onclick="removeSkillById('${sk.id}')">外す</button>
                    <button class="sn-btn" onclick="beginTreeSwap('${sk.id}')">入替</button>
                   </div>`
                : '';

            let prereqDisplay = '';
            if (sk.prereq) {
                const prereqs = Array.isArray(sk.prereq) ? sk.prereq : [sk.prereq];
                const names = prereqs.map(pid => allAvail.find(s => s.id === pid)?.name || pid).join(', ');
                prereqDisplay = '<div style="color:#885;font-size:9px">必要: ' + names + '</div>';
            }

            const levelGate = (sk.reqLevel && player.level < sk.reqLevel)
                ? `<div style="color:#ff4444;font-size:9px">必要レベル: ${sk.reqLevel}</div>`
                : '';

            const passiveLabel = isPassive ? '<div style="color:#66aaff;font-size:9px">◆ パッシブ: 常時発動</div>' : '';

            let passiveInfo = '';
            if (isPassive && sk.passiveEffect && lvl > 0) {
                const pe = sk.passiveEffect;
                const curVal = (pe.baseBonus + pe.perLevel * (lvl - 1)).toFixed(1);
                const statNames = { critChance: 'クリティカル率', damagePercent: 'ダメージ', defensePercent: '防御力', attackSpeed: '攻撃速度', moveSpeed: '移動速度', manaRegen: 'マナ回復', maxHP: '最大HP', maxMP: '最大MP', lifeSteal: 'ライフスティール', dodgeChance: '回避率' };
                passiveInfo = `<div style="color:#88ccff;font-size:9px">効果: ${statNames[pe.stat] || pe.stat} +${curVal}</div>`;
            }

            let synergyInfo = '';
            if (sk.synergies && sk.synergies.length > 0) {
                const synParts = sk.synergies.map(syn => {
                    const fromLvl = player.skillLevels[syn.from] || 0;
                    const fromName = allAvail.find(s => s.id === syn.from)?.name || syn.from;
                    const curBonus = Math.round(fromLvl * syn.bonus * 100);
                    return `+${Math.round(syn.bonus * 100)}%/${fromName} (現在:+${curBonus}%)`;
                });
                synergyInfo = `<div style="color:#aaffaa;font-size:8px;margin-top:2px">シナジー: ${synParts.join(', ')}</div>`;
            }

            const mpDisplay = isPassive ? '' : `MP:${lvl > 0 ? getSkillMPCost(sk, lvl) : sk.mp}`;
            const cdDisplay = isPassive ? '' : `CD:${lvl > 0 ? getSkillCooldown(sk, lvl).toFixed(1) : sk.cd}s`;
            const mpCdHtml = isPassive ? '' : `<div style="color:#4488ff;font-size:9px;margin-top:2px">${mpDisplay} ${cdDisplay}</div>`;

            h += '<div class="skill-node ' + stateClass + '" onmouseenter="showSkillTooltip(event,\'' + sk.id + '\')" onmouseleave="hideTooltip()">' +
                '<div class="sn-icon">' + (isPassive ? '◆' : '') + '<img src="' + getSkillIconDataURL(sk, 20) + '" width="20" height="20">' + '</div>' +
                '<div class="sn-name">' + sk.name + '</div>' +
                '<div class="sn-level">Lv.' + lvl + '/' + maxLvl + '</div>' +
                progressBar +
                passiveLabel +
                '<div class="sn-desc">' + effectDesc(sk) + '</div>' +
                passiveInfo +
                mpCdHtml +
                prereqDisplay +
                levelGate +
                synergyInfo +
                '<div style="margin-top:4px">' + btnHtml + assignBtn + '</div>' +
                shortcutBtns +
                '</div>';
        }
        h += '</div></div>';
    }
    return h;
}

// ===== TREE VIEW (new Diablo 2-style) =====
function renderBranchesTree(cDef, label) {
    let h = '';
    const allAvail = getAllAvailableSkills();
    if (label) h += `<div style="color:#aa88ff;font-size:12px;text-align:center;margin:8px 0 4px;border-top:1px solid #333;padding-top:6px">${label}</div>`;

    const treeId = 'stree-' + cDef.engName.replace(/\s+/g, '');
    h += `<div class="skill-tree-branches" id="${treeId}">`;
    h += `<svg class="skill-tree-svg" id="${treeId}-svg"></svg>`;

    // Collect all tier levels used in this class
    const tierSet = new Set();
    cDef.skills.forEach(s => tierSet.add(s.reqLevel || 1));
    const tiers = [...tierSet].sort((a, b) => a - b);

    for (let b = 0; b < cDef.branches.length; b++) {
        const branchSkills = cDef.skills.filter(s => s.branch === b);
        h += `<div class="skill-branch-col">`;
        h += `<div class="skill-branch-col-title">${cDef.branches[b]}</div>`;

        for (const tier of tiers) {
            const tierSkills = branchSkills.filter(s => (s.reqLevel || 1) === tier);
            if (tierSkills.length === 0) {
                // Empty placeholder to maintain vertical alignment
                h += `<div class="skill-tier-row" style="visibility:hidden"><div class="skill-node-tree" style="visibility:hidden"><div class="snt-icon">-</div><div class="snt-name">-</div><div class="snt-level">-</div></div></div>`;
                continue;
            }
            h += `<div class="skill-tier-label">Lv.${tier}</div>`;
            h += `<div class="skill-tier-row">`;
            for (const sk of tierSkills) {
                const lvl = player.skillLevels[sk.id] || 0;
                const maxLvl = SKILL_MAX_LEVEL;
                const isPassive = sk.skillType === 'passive';
                const meetsPrereq = checkPrereqs(sk);
                const meetsLevel = !sk.reqLevel || player.level >= sk.reqLevel;
                const canLearn = lvl < maxLvl && player.skillPoints > 0 && meetsPrereq && meetsLevel;
                let stateClass = lvl >= maxLvl ? 'maxed' : lvl > 0 ? 'unlocked' : canLearn ? '' : 'locked';
                if (isPassive) stateClass += ' passive';

                const pct = Math.round((lvl / maxLvl) * 100);
                const barClass = isPassive ? 'passive' : 'active';

                // Build prereq list for data attribute
                let prereqIds = '';
                if (sk.prereq) {
                    prereqIds = Array.isArray(sk.prereq) ? sk.prereq.join(',') : sk.prereq;
                }
                // Build synergy-from list for data attribute
                let synergyFromIds = '';
                if (sk.synergies && sk.synergies.length > 0) {
                    synergyFromIds = sk.synergies.map(syn => syn.from).join(',');
                }

                h += `<div class="skill-node-tree ${stateClass}" data-skill-id="${sk.id}" data-prereqs="${prereqIds}" data-synergy-from="${synergyFromIds}" data-tree-id="${treeId}"` +
                    ` onmouseenter="onTreeNodeHover(event,'${sk.id}','${treeId}')" onmouseleave="onTreeNodeLeave('${treeId}')"` +
                    ` onclick="onTreeNodeClick(event,'${sk.id}')" oncontextmenu="onTreeNodeRightClick(event,'${sk.id}')">` +
                    `<div class="snt-icon">${isPassive ? '◆' : ''}<img src="${getSkillIconDataURL(sk, 28)}" width="28" height="28"></div>` +
                    `<div class="snt-name">${sk.name}</div>` +
                    `<div class="snt-level">Lv.${lvl}/${maxLvl}</div>` +
                    `<div class="snt-progress"><div class="snt-progress-bar ${barClass}" style="width:${pct}%"></div></div>` +
                    `</div>`;
            }
            h += `</div>`;
        }
        h += `</div>`;
    }
    h += `</div>`;
    // Hint
    h += `<div style="text-align:center;color:#666;font-size:9px;margin-top:4px">左クリック: 習得 / 右クリック: スロットに設定 / ホバー: 詳細</div>`;
    return h;
}

// ===== SVG Connection Drawing (Diablo 2 style) =====
function drawSkillTreeConnections() {
    const containers = document.querySelectorAll('.skill-tree-branches');
    containers.forEach(container => {
        const svg = container.querySelector('.skill-tree-svg');
        if (!svg) return;
        svg.innerHTML = '';
        const containerRect = container.getBoundingClientRect();

        // Collect all nodes in this container
        const nodes = container.querySelectorAll('.skill-node-tree[data-skill-id]');
        const nodeMap = {};
        nodes.forEach(n => {
            const id = n.getAttribute('data-skill-id');
            const r = n.getBoundingClientRect();
            nodeMap[id] = {
                el: n,
                cx: r.left + r.width / 2 - containerRect.left,
                top: r.top - containerRect.top,
                bottom: r.bottom - containerRect.top,
                left: r.left - containerRect.left,
                right: r.right - containerRect.left,
                w: r.width,
                h: r.height
            };
        });

        // Set SVG size
        svg.setAttribute('width', container.scrollWidth);
        svg.setAttribute('height', container.scrollHeight);
        svg.setAttribute('viewBox', `0 0 ${container.scrollWidth} ${container.scrollHeight}`);

        // Helper: build bezier path between two nodes
        function buildPath(parentN, childN, offsetX) {
            const x1 = parentN.cx + (offsetX || 0);
            const y1 = parentN.bottom;
            const x2 = childN.cx + (offsetX || 0);
            const y2 = childN.top;
            const dx = Math.abs(x2 - x1);
            const dy = Math.abs(y2 - y1);

            if (dx > 80) {
                // Cross-branch: S-curve routing around nodes
                const cpOff = Math.min(dy * 0.5, 40);
                return `M${x1},${y1} C${x1},${y1 + cpOff} ${x2},${y2 - cpOff} ${x2},${y2}`;
            }
            // Same column or nearby: smooth vertical curve
            return `M${x1},${y1} C${x1},${y1 + dy * 0.45} ${x2},${y2 - dy * 0.45} ${x2},${y2}`;
        }

        // --- Pass 1: Prereq glow layers (drawn first, behind everything) ---
        nodes.forEach(n => {
            const id = n.getAttribute('data-skill-id');
            const prereqs = n.getAttribute('data-prereqs');
            if (!prereqs) return;
            prereqs.split(',').filter(Boolean).forEach(pid => {
                const parentNode = nodeMap[pid];
                const childNode = nodeMap[id];
                if (!parentNode || !childNode) return;
                const d = buildPath(parentNode, childNode, 0);
                const glow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                glow.setAttribute('d', d);
                glow.setAttribute('class', 'prereq-line-glow');
                glow.setAttribute('data-from', pid);
                glow.setAttribute('data-to', id);
                svg.appendChild(glow);
            });
        });

        // --- Pass 2: Prereq solid lines ---
        nodes.forEach(n => {
            const id = n.getAttribute('data-skill-id');
            const prereqs = n.getAttribute('data-prereqs');
            if (!prereqs) return;
            prereqs.split(',').filter(Boolean).forEach(pid => {
                const parentNode = nodeMap[pid];
                const childNode = nodeMap[id];
                if (!parentNode || !childNode) return;
                const d = buildPath(parentNode, childNode, 0);
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', d);
                path.setAttribute('class', 'prereq-line');
                path.setAttribute('data-from', pid);
                path.setAttribute('data-to', id);
                svg.appendChild(path);
            });
        });

        // --- Pass 3: Synergy lines (dashed, with arrows) ---
        nodes.forEach(n => {
            const id = n.getAttribute('data-skill-id');
            const synergyFrom = n.getAttribute('data-synergy-from');
            if (!synergyFrom) return;
            synergyFrom.split(',').filter(Boolean).forEach(fromId => {
                const fromNode = nodeMap[fromId];
                const toNode = nodeMap[id];
                if (!fromNode || !toNode) return;

                // Offset to avoid overlapping prereq lines
                const sameColumn = Math.abs(fromNode.cx - toNode.cx) < 50;
                const offsetX = sameColumn ? 10 : 0;
                const d = buildPath(fromNode, toNode, offsetX);

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', d);
                path.setAttribute('class', 'synergy-line');
                path.setAttribute('data-from', fromId);
                path.setAttribute('data-to', id);
                svg.appendChild(path);

                // Arrow at target end
                const arrowSize = 6;
                const ax = toNode.cx + offsetX;
                const ay = toNode.top;
                const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                arrow.setAttribute('points',
                    `${ax},${ay} ${ax - arrowSize},${ay - arrowSize * 1.5} ${ax + arrowSize},${ay - arrowSize * 1.5}`);
                arrow.setAttribute('class', 'synergy-arrow');
                arrow.setAttribute('data-from', fromId);
                arrow.setAttribute('data-to', id);
                svg.appendChild(arrow);
            });
        });
    });
}

// ===== Hover Highlight =====
window.onTreeNodeHover = function (e, skillId, treeId) {
    showSkillTooltip(e, skillId);
    const container = document.getElementById(treeId);
    if (!container) return;
    const svg = container.querySelector('.skill-tree-svg');
    if (!svg) return;

    // Dim all, then highlight related
    svg.classList.add('dimmed');

    // Find all related skill IDs (prereqs, synergies, and chains)
    const relatedIds = new Set([skillId]);
    const node = container.querySelector(`[data-skill-id="${skillId}"]`);
    if (node) {
        const prereqs = node.getAttribute('data-prereqs');
        if (prereqs) prereqs.split(',').filter(Boolean).forEach(id => relatedIds.add(id));
        const synFrom = node.getAttribute('data-synergy-from');
        if (synFrom) synFrom.split(',').filter(Boolean).forEach(id => relatedIds.add(id));
    }
    // Also find skills that depend on this one (children)
    container.querySelectorAll('.skill-node-tree[data-skill-id]').forEach(n => {
        const prereqs = n.getAttribute('data-prereqs');
        if (prereqs && prereqs.split(',').includes(skillId)) {
            relatedIds.add(n.getAttribute('data-skill-id'));
        }
        const synFrom = n.getAttribute('data-synergy-from');
        if (synFrom && synFrom.split(',').includes(skillId)) {
            relatedIds.add(n.getAttribute('data-skill-id'));
        }
    });

    // Highlight related lines (including glow layers)
    svg.querySelectorAll('.prereq-line, .prereq-line-glow, .synergy-line, .synergy-arrow').forEach(el => {
        const from = el.getAttribute('data-from');
        const to = el.getAttribute('data-to');
        if (relatedIds.has(from) && relatedIds.has(to)) {
            el.classList.add('highlight');
        }
    });

    // Highlight/dim nodes
    container.querySelectorAll('.skill-node-tree[data-skill-id]').forEach(n => {
        const id = n.getAttribute('data-skill-id');
        if (relatedIds.has(id)) {
            n.classList.add('highlight-node');
        } else {
            n.classList.add('dim-node');
        }
    });
};

window.onTreeNodeLeave = function (treeId) {
    hideTooltip();
    const container = document.getElementById(treeId);
    if (!container) return;
    const svg = container.querySelector('.skill-tree-svg');
    if (svg) {
        svg.classList.remove('dimmed');
        svg.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
    }
    container.querySelectorAll('.skill-node-tree').forEach(n => {
        n.classList.remove('highlight-node');
        n.classList.remove('dim-node');
    });
};

// ===== Tree Node Click Handlers =====
window.onTreeNodeClick = function (e, skillId) {
    e.preventDefault();
    learnSkill(skillId);
};

window.onTreeNodeRightClick = function (e, skillId) {
    e.preventDefault();
    quickAssignSkill(skillId);
};

// Check if prereq conditions are met (supports string or array)
function checkPrereqs(sk) {
    if (!sk.prereq) return true;
    if (Array.isArray(sk.prereq)) {
        return sk.prereq.every(pid => (player.skillLevels[pid] || 0) >= 1);
    }
    return (player.skillLevels[sk.prereq] || 0) >= 1;
}

window.learnSkill = function (skillId) {
    if (player.skillPoints <= 0) return;
    const allAvail = getAllAvailableSkills();
    const sk = allAvail.find(s => s.id === skillId);
    if (!sk) return;
    const lvl = player.skillLevels[skillId] || 0;
    if (lvl >= SKILL_MAX_LEVEL) return;
    // Prereq check (supports array)
    if (!checkPrereqs(sk)) return;
    // Character level gate check
    if (sk.reqLevel && player.level < sk.reqLevel) {
        addLog(`必要レベル: ${sk.reqLevel} (現在: ${player.level})`, '#ff4444');
        return;
    }
    player.skillLevels[skillId] = lvl + 1;
    player.skillPoints--;
    // Update skill slot cooldown/MP data using new formulas
    const newLvl = player.skillLevels[skillId];
    for (let si = 1; si <= 6; si++) {
        if (player.skills[si] && player.skills[si].id === skillId) {
            player.skills[si].maxCD = getSkillCooldown(sk, newLvl);
            player.skills[si].mp = getSkillMPCost(sk, newLvl);
        }
    }
    // Recalculate passives if this is a passive skill
    if (sk.skillType === 'passive') {
        player.recalcStats();
    }
    updateSkillTreeUI();
    addLog(`${sk.name} をLv.${newLvl}に強化！`, '#ffd700');
};

function renderSettingsUI() {
    const rows = [
        { key: 'sound', label: 'サウンド', value: SETTINGS.sound },
        { key: 'screenShake', label: '画面揺れ', value: SETTINGS.screenShake },
        { key: 'reducedParticles', label: 'パーティクル削減', value: SETTINGS.reducedParticles },
        { key: 'filmGrain', label: 'フィルムグレイン', value: SETTINGS.filmGrain },
        { key: 'showFPS', label: 'FPS 表示', value: SETTINGS.showFPS },
        { key: 'showDamageNumbers', label: 'ダメージ数値', value: SETTINGS.showDamageNumbers }
    ];
    let html = '<div style="color:#ccb38a;font-size:11px;margin-bottom:8px">ゲームの演出や負荷を調整できます。</div>';
    for (const r of rows) {
        const on = r.value ? 'ON' : 'OFF';
        const cls = r.value ? '' : 'off';
        html += `<div class="setting-row">
            <div class="setting-label">${r.label}</div>
            <button class="toggle-btn ${cls}" onclick="toggleSetting('${r.key}')">${on}</button>
        </div>`;
    }
    html += `<div class="setting-row">
        <div class="setting-label">自動拾い</div>
        <button class="toggle-btn ${G.autoPickup ? '' : 'off'}" onclick="toggleAutoPickup()">${G.autoPickup ? 'ON' : 'OFF'}</button>
    </div>`;
    html += `<div class="setting-row">
        <div class="setting-label">拾いフィルタ</div>
        <button class="toggle-btn" onclick="cyclePickupFilter()">${getPickupFilterLabel()}</button>
    </div>`;
    html += `<div style="color:#ccb38a;font-size:11px;margin:10px 0 4px">セーブスロット</div>`;
    for (let i = 1; i <= SAVE_SLOT_COUNT; i++) {
        const meta = getSaveMeta(i);
        const active = G.saveSlot === i;
        const info = meta
            ? `Lv.${meta.level} / ${meta.act ? 'ACT' + meta.act : 'B' + meta.floor + 'F'}${meta.cycle ? ' (' + (meta.cycle + 1) + '周目)' : ''} / ${meta.className}`
            : '空';
        const time = meta && meta.timestamp
            ? new Date(meta.timestamp).toLocaleString('ja-JP')
            : '';
        html += `<div class="setting-row">
            <div class="setting-label">スロット${i}${active ? ' ★' : ''}<div style="font-size:10px;color:#888">${info}${time ? ' / ' + time : ''}</div></div>
            <div class="setting-actions">
                <button class="toggle-btn ${active ? '' : 'off'}" onclick="setSaveSlot(${i})">選択</button>
                <button class="toggle-btn" onclick="saveGame(${i})">セーブ</button>
                <button class="toggle-btn" onclick="loadGame(${i})">ロード</button>
            </div>
        </div>`;
    }
    DOM.settingsContent.innerHTML = html;
}

window.toggleSetting = function (key) {
    if (!(key in SETTINGS)) return;
    if (key === 'sound') {
        setSoundEnabled(!SETTINGS.sound);
    } else {
        SETTINGS[key] = !SETTINGS[key];
        saveSettings();
    }
    renderSettingsUI();
};
window.toggleAutoPickup = function () {
    G.autoPickup = !G.autoPickup;
    addLog(G.autoPickup ? '自動拾い: ON' : '自動拾い: OFF', '#ffdd44');
    renderSettingsUI();
};
function getPickupFilterLabel() {
    const names = ['ノーマル以上', 'マジック以上', 'レア以上', 'レジェンダリー以上'];
    const rarities = ['normal', 'magic', 'rare', 'legendary'];
    const idx = rarities.indexOf(G.autoPickupRarity);
    return names[idx] || names[0];
}
window.cyclePickupFilter = function () {
    const rarities = ['normal', 'magic', 'rare', 'legendary'];
    const idx = rarities.indexOf(G.autoPickupRarity);
    const next = (idx + 1) % rarities.length;
    G.autoPickupRarity = rarities[next];
    addLog('自動拾いフィルタ: ' + getPickupFilterLabel(), '#ffdd44');
    renderSettingsUI();
};

function isPanelVisible(panel) {
    return getComputedStyle(panel).display !== 'none';
}
function setPanelVisible(panel, visible) {
    panel.style.display = visible ? 'block' : 'none';
}
function togglePanel(panel) {
    const visible = isPanelVisible(panel);
    panel.style.display = visible ? 'none' : 'block';
    return !visible;
}

function setPaused(paused) {
    G.paused = paused;
    DOM.pauseOverlay.style.display = paused ? 'flex' : 'none';
    if (paused) DOM.tooltip.style.display = 'none';
    if (paused) {
        for (const k of Object.keys(keysDown)) keysDown[k] = false;
    }
}

// ========== INPUT ==========
let mouse = { x: 0, y: 0 };
let hoveredProp = null; // {tx, ty} - currently hovered breakable prop
let keysDown = {};
function getCanvasMousePos(e) {
    // Use canvas-local coordinates; clientX/Y breaks aiming if canvas isn't at (0,0) or is CSS-scaled.
    const r = canvas.getBoundingClientRect();
    const sx = (e.clientX - r.left) * (canvas.width / r.width);
    const sy = (e.clientY - r.top) * (canvas.height / r.height);
    return {
        x: Math.max(0, Math.min(W, sx)),
        y: Math.max(0, Math.min(H, sy))
    };
}
function getSkillBarSlotAt(mx, my) {
    const skillW = 48, skillH = 48, skillGap = 5;
    const numSkills = 6;
    const skillTotalW = numSkills * skillW + (numSkills - 1) * skillGap;
    const skillStartX = W / 2 - skillTotalW / 2;
    const skillY = H - 62;
    if (my < skillY || my > skillY + skillH) return 0;
    if (mx < skillStartX || mx > skillStartX + skillTotalW) return 0;
    const idx = Math.floor((mx - skillStartX) / (skillW + skillGap)) + 1;
    const slotX = skillStartX + (idx - 1) * (skillW + skillGap);
    if (mx > slotX + skillW) return 0; // gap
    return idx >= 1 && idx <= numSkills ? idx : 0;
}

canvas.addEventListener('mousemove', e => {
    const p = getCanvasMousePos(e);
    mouse.x = p.x; mouse.y = p.y;

    // Detect hovered breakable prop (dungeon only)
    if (G.started && !G.inTown && !G.paused && !isPanelVisible(DOM.settingsPanel)) {
        const wp = screenToWorld(mouse.x, mouse.y);
        const clickedProp = getClickableDungeonPropAtWorld(wp.x, wp.y);
        if (clickedProp) {
            hoveredProp = { tx: clickedProp.tx, ty: clickedProp.ty };
            canvas.style.cursor = 'pointer';
        } else {
            hoveredProp = null;
            canvas.style.cursor = 'default';
        }
    } else {
        hoveredProp = null;
        canvas.style.cursor = 'default';
    }
}, { passive: true });

canvas.addEventListener('contextmenu', e => { e.preventDefault(); });

canvas.addEventListener('mousedown', e => {
    if (G.dead || !G.started || G.paused || isPanelVisible(DOM.settingsPanel) || skillSelectOpen) return;
    e.preventDefault();
    const p = getCanvasMousePos(e);
    mouse.x = p.x; mouse.y = p.y;

    if (e.button === 2) {
        // Right click - use skill
        player.useSkill(mouse.x, mouse.y);
        return;
    }

    if (e.button === 0) {
        const skillSlot = getSkillBarSlotAt(mouse.x, mouse.y);
        if (skillSlot) {
            player.selectedSkill = skillSlot;
            return;
        }
        const wp = screenToWorld(mouse.x, mouse.y);
        const wx = wp.x, wy = wp.y;

        // Check if clicking a monster
        let clickedMonster = null;
        for (const m of monsters) {
            if (m.alive && dist(wx, wy, m.x, m.y) < m.r + 10) {
                clickedMonster = m;
                break;
            }
        }

        if (clickedMonster) {
            player.targetBreakProp = null;
            player.attacking = true;
            player.attackTarget = clickedMonster;
            player.setMoveTarget(clickedMonster.x, clickedMonster.y);
        } else {
            const clickedProp = getClickableDungeonPropAtWorld(wx, wy);
            if (clickedProp) {
                player.attacking = false;
                player.attackTarget = null;
                player.targetBreakProp = { tx: clickedProp.tx, ty: clickedProp.ty };
                if (dist(player.x, player.y, clickedProp.px, clickedProp.py) <= 56) {
                    breakDungeonProp(clickedProp.tx, clickedProp.ty, clickedProp.prop);
                    player.targetBreakProp = null;
                    player.moving = false;
                } else {
                    player.setMoveTarget(clickedProp.px, clickedProp.py);
                }
                return;
            }
            // Check ground items first
            let clickedItem = false;
            for (let i = groundItems.length - 1; i >= 0; i--) {
                const gi = groundItems[i];
                if (dist(wx, wy, gi.x, gi.y) < 25) {
                    // Move to item then pick up
                    player.setMoveTarget(gi.x, gi.y);
                    player.attacking = false;
                    player.attackTarget = null;
                    player.targetBreakProp = null;
                    clickedItem = true;
                    break;
                }
            }
            if (!clickedItem) {
                player.setMoveTarget(wx, wy);
                player.attacking = false;
                player.attackTarget = null;
                player.targetBreakProp = null;
            }
        }
    }
});

window.addEventListener('keydown', e => {
    keysDown[e.key.toLowerCase()] = true;
    if (e.code) keysDown[e.code] = true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();

    // --- Title screen keyboard navigation ---
    if (!G.started) {
        if (G.titlePhase === 'start') {
            if (e.key === 'Enter' || e.code === 'Space') {
                e.preventDefault();
                if (hasSaveData(G.saveSlot)) {
                    initAudio();
                    loadGame(G.saveSlot);
                } else {
                    showClassSelect();
                }
                return;
            }
        } else if (G.titlePhase === 'classSelect') {
            if (e.key === 'ArrowLeft') {
                G.selectedClassIdx = (G.selectedClassIdx + 2) % 3;
                updateClassHighlight();
                return;
            }
            if (e.key === 'ArrowRight') {
                G.selectedClassIdx = (G.selectedClassIdx + 1) % 3;
                updateClassHighlight();
                return;
            }
            if (e.key === 'Enter' || e.code === 'Space') {
                e.preventDefault();
                confirmClassSelect();
                return;
            }
        }
        return; // Don't process game keys when on title
    }

    // --- Game Clear keyboard ---
    if (DOM.gameClearScreen && DOM.gameClearScreen.style.display === 'flex') {
        if (e.key === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            location.reload();
            return;
        }
        return;
    }

    // --- Death screen keyboard ---
    if (G.dead) {
        if (e.key === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            location.reload();
            return;
        }
        // 死亡時もRキーでスキル編集を許可
        if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
            console.log('[KeyR] Pressed while dead - allowing skill edit');
            e.preventDefault();
            if (skillSelectOpen) closeSkillSelect();
            else openSkillEdit();
            return;
        }
        return; // 死亡時のその他のキーは無視
    }

    if (promotionPending) return;

    // Overlay Map toggle
    if (e.code === 'Tab') { e.preventDefault(); G.showOverlayMap = !G.showOverlayMap; return; }

    // Save/Load
    if (e.code === 'F5') { e.preventDefault(); saveGame(); return; }
    if (e.code === 'F8') { e.preventDefault(); loadGame(); return; }

    // View toggle (experimental): pseudo-isometric projection
    if (e.code === 'F7') {
        e.preventDefault();
        SETTINGS.isometricView = !SETTINGS.isometricView;
        saveSettings();
        if (SETTINGS.isometricView) {
            G.camWX = player.x; G.camWY = player.y;
        } else {
            G.camX = player.x - W / 2;
            G.camY = player.y - H / 2;
        }
        addLog(`視点: ${SETTINGS.isometricView ? 'ISO' : 'TOP'} (F7で切替)`, '#88bbff');
        return;
    }

    if (skillSelectOpen) {
        if (e.code === 'Escape' || e.code === 'KeyR') {
            e.preventDefault();
            closeSkillSelect();
            return;
        }
        if (e.code && e.code.startsWith('Digit')) {
            const n = parseInt(e.code.replace('Digit', ''), 10);
            if (n >= 1 && n <= 6) {
                e.preventDefault();
                selectOrSwapSkillSlot(n);
                return;
            }
        }
        if (e.code === 'KeyX') { // remove selected slot
            e.preventDefault();
            removeSkillSlot();
            return;
        }
        if (e.code === 'KeyA') { // assign mode
            e.preventDefault();
            setSkillEditMode('assign');
            return;
        }
        if (e.code === 'KeyW') { // swap mode
            e.preventDefault();
            setSkillEditMode('swap');
            return;
        }
        return;
    }

    // Pause / Settings
    if (e.code === 'Escape') {
        e.preventDefault();
        // Close town UI first
        if (G.townUIMode) { closeTownUI(); return; }
        if (isPanelVisible(DOM.settingsPanel)) {
            setPanelVisible(DOM.settingsPanel, false);
            setPaused(false);
        } else {
            setPaused(!G.paused);
        }
        return;
    }
    if (e.code === 'KeyO') {
        e.preventDefault();
        const opened = togglePanel(DOM.settingsPanel);
        if (opened) {
            renderSettingsUI();
            setPaused(true);
            DOM.pauseOverlay.style.display = 'none';
        } else {
            setPaused(false);
        }
        return;
    }

    if (G.paused) return;

    if (e.code === 'KeyQ') { e.preventDefault(); player.useHPPotion(); return; }
    if (e.code === 'KeyW') { e.preventDefault(); player.useMPPotion(); return; }

    // --- A key: Attack nearest enemy (use e.code for IME compatibility) ---
    if (e.code === 'KeyA') {
        e.preventDefault();
        let nearest = null, nearestD = 300;
        for (const m of monsters) {
            if (!m.alive) continue;
            const d = dist(player.x, player.y, m.x, m.y);
            if (d < nearestD) { nearestD = d; nearest = m; }
        }
        if (nearest) {
            player.attacking = true;
            player.attackTarget = nearest;
            player.moving = true;
            player.targetX = nearest.x;
            player.targetY = nearest.y;
        }
        return;
    }

    // --- S key: Use selected skill (use e.code for IME compatibility) ---
    if (e.code === 'KeyS') {
        e.preventDefault();
        // Use skill toward nearest enemy, or toward mouse if no enemy nearby
        let tx = mouse.x, ty = mouse.y;
        let nearest = null, nearestD = 400;
        for (const m of monsters) {
            if (!m.alive) continue;
            const d = dist(player.x, player.y, m.x, m.y);
            if (d < nearestD) { nearestD = d; nearest = m; }
        }
        if (nearest) {
            const sp = worldToScreen(nearest.x, nearest.y);
            tx = sp.x;
            ty = sp.y;
        }
        player.useSkill(tx, ty);
        return;
    }

    if (e.code === 'KeyC') {
        e.preventDefault();
        const p = DOM.statsPanel;
        togglePanel(p);
        updateStatsPanel();
    }
    if (e.code === 'KeyI') {
        e.preventDefault();
        const p = DOM.inventoryPanel;
        togglePanel(p);
        updateInventoryPanel();
    }
    if (e.code === 'KeyH') {
        e.preventDefault();
        const p = DOM.helpOverlay;
        const opened = togglePanel(p);
        if (opened) renderHelpUI();
    }
    if (e.code === 'KeyG') {
        toggleAutoPickup();
    }
    if (e.code === 'KeyP') {
        cyclePickupFilter();
    }
    if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
        console.log('[KeyR] Pressed! skillSelectOpen:', skillSelectOpen);
        e.preventDefault();
        if (skillSelectOpen) {
            console.log('[KeyR] Closing skill select');
            closeSkillSelect();
        }
        else {
            console.log('[KeyR] Calling openSkillEdit()');
            openSkillEdit();
        }
    }
    if (e.code === 'KeyE') {
        e.preventDefault();
        if (G.inTown) {
            // Close town UI if open
            if (G.townUIMode) { closeTownUI(); return; }
            // Check portal proximity first
            if (G.portalReturn && G._portalScreenX) {
                const portalD = dist(player.x, player.y, G._portalScreenX, G._portalScreenY);
                if (portalD < 60) {
                    usePortalReturn();
                    return;
                }
            }
            // Check NPC proximity
            let nearestNPC = null, nearestD = 999;
            for (const npc of townNPCs) {
                const d = dist(player.x, player.y, npc.x, npc.y);
                if (d < npc.interactRadius && d < nearestD) { nearestD = d; nearestNPC = npc; }
            }
            if (nearestNPC) {
                openNPCInteraction(nearestNPC);
            } else {
                tryUseStairs(true);
            }
        } else {
            tryUseStairs(true);
        }
    }
    if (e.code === 'KeyT') {
        e.preventDefault();
        const p = DOM.skillTreePanel;
        const opened = togglePanel(p);
        if (opened) updateSkillTreeUI();
    }
    // Town Portal (V key)
    if (e.code === 'KeyV') {
        e.preventDefault();
        if (!G.inTown && !G.portalCasting) {
            G.portalCasting = true;
            G.portalTimer = 2.0; // 2秒キャスト
            addLog('帰還の巻物を使用中...', '#8888ff');
        }
    }
    // Number keys (1-6) select AND activate skills
    if (e.code === 'Digit1' || e.key === '1') {
        player.selectedSkill = 1;
        // Auto-target nearest enemy, or use mouse position
        let tx = mouse.x, ty = mouse.y;
        let nearest = null, nearestD = 400;
        for (const m of monsters) {
            if (!m.alive) continue;
            const d = dist(player.x, player.y, m.x, m.y);
            if (d < nearestD) { nearestD = d; nearest = m; }
        }
        if (nearest) {
            const sp = worldToScreen(nearest.x, nearest.y);
            tx = sp.x;
            ty = sp.y;
        }
        player.useSkill(tx, ty);
    }
    if (e.code === 'Digit2' || e.key === '2') {
        player.selectedSkill = 2;
        let tx = mouse.x, ty = mouse.y;
        let nearest = null, nearestD = 400;
        for (const m of monsters) {
            if (!m.alive) continue;
            const d = dist(player.x, player.y, m.x, m.y);
            if (d < nearestD) { nearestD = d; nearest = m; }
        }
        if (nearest) {
            const sp = worldToScreen(nearest.x, nearest.y);
            tx = sp.x;
            ty = sp.y;
        }
        player.useSkill(tx, ty);
    }
    if (e.code === 'Digit3' || e.key === '3') {
        player.selectedSkill = 3;
        let tx = mouse.x, ty = mouse.y;
        let nearest = null, nearestD = 400;
        for (const m of monsters) {
            if (!m.alive) continue;
            const d = dist(player.x, player.y, m.x, m.y);
            if (d < nearestD) { nearestD = d; nearest = m; }
        }
        if (nearest) {
            const sp = worldToScreen(nearest.x, nearest.y);
            tx = sp.x;
            ty = sp.y;
        }
        player.useSkill(tx, ty);
    }
    if (e.code === 'Digit4' || e.key === '4') {
        player.selectedSkill = 4;
        let tx = mouse.x, ty = mouse.y;
        let nearest = null, nearestD = 400;
        for (const m of monsters) {
            if (!m.alive) continue;
            const d = dist(player.x, player.y, m.x, m.y);
            if (d < nearestD) { nearestD = d; nearest = m; }
        }
        if (nearest) {
            const sp = worldToScreen(nearest.x, nearest.y);
            tx = sp.x;
            ty = sp.y;
        }
        player.useSkill(tx, ty);
    }
    if (e.code === 'Digit5' || e.key === '5') {
        player.selectedSkill = 5;
        let tx = mouse.x, ty = mouse.y;
        let nearest = null, nearestD = 400;
        for (const m of monsters) {
            if (!m.alive) continue;
            const d = dist(player.x, player.y, m.x, m.y);
            if (d < nearestD) { nearestD = d; nearest = m; }
        }
        if (nearest) {
            const sp = worldToScreen(nearest.x, nearest.y);
            tx = sp.x;
            ty = sp.y;
        }
        player.useSkill(tx, ty);
    }
    if (e.code === 'Digit6' || e.key === '6') {
        player.selectedSkill = 6;
        let tx = mouse.x, ty = mouse.y;
        let nearest = null, nearestD = 400;
        for (const m of monsters) {
            if (!m.alive) continue;
            const d = dist(player.x, player.y, m.x, m.y);
            if (d < nearestD) { nearestD = d; nearest = m; }
        }
        if (nearest) {
            const sp = worldToScreen(nearest.x, nearest.y);
            tx = sp.x;
            ty = sp.y;
        }
        player.useSkill(tx, ty);
    }
    if (e.code === 'Space') { e.preventDefault(); player.pickupNearby(); tryUseStairs(true); }
});
window.addEventListener('keyup', e => {
    keysDown[e.key.toLowerCase()] = false;
    if (e.code) keysDown[e.code] = false;
});

// ========== TITLE SCREEN ==========
const CLASS_KEYS = ['warrior', 'rogue', 'sorcerer'];

function showClassSelect() {
    initAudio();
    G.titlePhase = 'classSelect';
    G.selectedClassIdx = 0;
    DOM.titleStartText.style.display = 'none';
    if (DOM.titleSaveMenu) DOM.titleSaveMenu.style.display = 'none';
    DOM.classSelect.style.display = 'block';
    updateClassHighlight();
}

function updateClassHighlight() {
    const cards = document.querySelectorAll('.class-card');
    cards.forEach((c, i) => {
        if (i === G.selectedClassIdx) {
            c.style.borderColor = '#ffd700';
            c.style.boxShadow = '0 0 20px rgba(218,165,32,0.4)';
            c.style.transform = 'translateY(-5px)';
        } else {
            c.style.borderColor = '#5a4a3a';
            c.style.boxShadow = 'none';
            c.style.transform = 'none';
        }
    });
}

function confirmClassSelect() {
    // Show difficulty selection after class is chosen
    G.titlePhase = 'difficultySelect';
    DOM.classSelect.style.display = 'none';
    showDifficultySelect();
}

let _classSelectOriginalHTML = null;
function showDifficultySelect() {
    // Save class select DOM before overwriting
    _classSelectOriginalHTML = DOM.classSelect.innerHTML;
    let html = `<div style="text-align:center;color:#ffd700;font-size:20px;margin-bottom:20px;font-family:serif">⚔ 難易度を選択 ⚔</div>`;
    html += `<div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">`;
    for (const [key, def] of Object.entries(DIFFICULTY_DEFS)) {
        const desc = key === 'normal' ? '初心者向け。標準的な難易度。' :
            key === 'nightmare' ? '敵が強化。報酬も増加。耐性-20。' :
                '最高難度。敵が極めて強い。耐性-50。';
        html += `<div onclick="window.selectDifficulty('${key}')" style="cursor:pointer;padding:16px 24px;border:2px solid ${def.color};border-radius:8px;background:rgba(0,0,0,0.7);min-width:140px;transition:all 0.2s" onmouseover="this.style.boxShadow='0 0 20px ${def.color}40';this.style.transform='translateY(-3px)'" onmouseout="this.style.boxShadow='none';this.style.transform='none'">
            <div style="color:${def.color};font-size:16px;font-weight:bold;margin-bottom:6px">${def.name}</div>
            <div style="color:#aaa;font-size:11px">${desc}</div>
            <div style="color:#888;font-size:10px;margin-top:6px">敵x${def.mult} / XPx${def.xpMult}</div>
        </div>`;
    }
    html += `</div>`;
    DOM.classSelect.innerHTML = html;
    DOM.classSelect.style.display = 'block';
}

window.selectDifficulty = function (diff) {
    G.difficulty = diff;
    // Restore class select DOM
    if (_classSelectOriginalHTML) {
        DOM.classSelect.innerHTML = _classSelectOriginalHTML;
        _classSelectOriginalHTML = null;
    }
    DOM.classSelect.style.display = 'none';
    selectClass(CLASS_KEYS[G.selectedClassIdx]);
};

// Click handlers still work
DOM.titleStartText.addEventListener('click', (e) => {
    e.stopPropagation();
    if (hasSaveData(G.saveSlot)) {
        initAudio();
        loadGame(G.saveSlot);
    } else {
        showClassSelect();
    }
});

window.selectClass = function (cls) {
    G.playerClass = cls;
    const classDef = CLASS_DEFS[cls];
    player.className = classDef.name;
    player.classKey = cls;
    player.str = classDef.baseStr;
    player.dex = classDef.baseDex;
    player.vit = classDef.baseVit;
    player.int = classDef.baseInt;
    player.skillPoints = 0;
    player.skillLevels = {};
    // Initialize skill levels to 0
    for (const sk of classDef.skills) {
        player.skillLevels[sk.id] = 0;
    }
    // Unlock starting skills (first skill in each branch, level 1)
    player.skillLevels[classDef.skills[0].id] = 1;
    player.skillLevels[classDef.skills[3].id] = 1;
    // Set active skill slots from class skills (pick first 6)
    rebuildSkillBar();
    DOM.titleScreen.style.display = 'none';
    setPaused(false);
    setPanelVisible(DOM.settingsPanel, false);
    G.started = true;
    G.hintTimer = 8;
    G.act = 1; G.actFloor = 1; G.cycle = 0;
    G.gold = 0; G.quests = {}; G.questKillCounts = {};
    G.waypoints = [1]; G.stash = []; G.bossesDefeated = {};
    player.recalcStats();
    player.hp = player.maxHP;
    player.mp = player.maxMP;
    // Pre-render skill icons now that class is chosen
    preRenderSkillIcons();
    // Start in ACT1 town
    enterTown(1);
};

DOM.deathScreen.addEventListener('click', () => {
    location.reload();
});
if (DOM.gameClearScreen) {
    DOM.gameClearScreen.addEventListener('click', () => {
        location.reload();
    });
}
if (DOM.skillEditBtn) {
    DOM.skillEditBtn.addEventListener('click', () => {
        if (skillSelectOpen) closeSkillSelect();
        else openSkillEdit();
    });
}

// ========== DRAWING HELPERS ==========
function drawLighting() {
    if (typeof dungeon.reveal === 'function') dungeon.reveal(player.x, player.y, 300);
    const psp = worldToScreen(player.x, player.y);
    const px = psp.x, py = psp.y;
    const flicker = Math.sin(G.time * 4.7) * 8 + Math.sin(G.time * 7.3) * 4;

    // Town: gentle ambient darkness (no offscreen needed)
    if (G.inTown) {
        const lightR = 700 + flicker;
        const lg = ctx.createRadialGradient(px, py, lightR * 0.4, px, py, lightR);
        lg.addColorStop(0, 'rgba(0,0,5,0)');
        lg.addColorStop(0.6, 'rgba(0,0,5,0.08)');
        lg.addColorStop(1, 'rgba(0,0,5,0.25)');
        ctx.fillStyle = lg;
        ctx.fillRect(0, 0, W, H);
        return;
    }

    // ============================================================
    //  D2-STYLE DUNGEON LIGHTING — Offscreen Canvas approach
    //  All destination-out ops happen on a separate darkness mask
    //  canvas, so game art on the main canvas is never destroyed.
    //  (Codex + Claude joint design)
    // ============================================================

    // Create/resize offscreen lighting canvas
    if (!G._lightCanvas || G._lightCanvas.width !== W || G._lightCanvas.height !== H) {
        G._lightCanvas = document.createElement('canvas');
        G._lightCanvas.width = W;
        G._lightCanvas.height = H;
        G._lightCtx = G._lightCanvas.getContext('2d');
    }
    const lctx = G._lightCtx;
    const lightR = 360 + flicker;

    // STEP 1: Fill offscreen canvas with near-total darkness
    lctx.globalCompositeOperation = 'source-over';
    lctx.globalAlpha = 1;
    lctx.clearRect(0, 0, W, H);
    lctx.fillStyle = 'rgba(4,3,1,0.96)';
    lctx.fillRect(0, 0, W, H);

    // STEP 2: Punch player light hole on offscreen canvas (safe!)
    lctx.globalCompositeOperation = 'destination-out';
    const plg = lctx.createRadialGradient(px, py, 0, px, py, lightR);
    plg.addColorStop(0, 'rgba(0,0,0,1)');
    plg.addColorStop(0.42, 'rgba(0,0,0,1)');    // bright core stays fully clear
    plg.addColorStop(0.62, 'rgba(0,0,0,0.92)'); // still mostly clear
    plg.addColorStop(0.76, 'rgba(0,0,0,0.50)'); // quick drop
    plg.addColorStop(0.90, 'rgba(0,0,0,0.12)'); // nearly black
    plg.addColorStop(1, 'rgba(0,0,0,0)');        // fully dark at edge
    lctx.fillStyle = plg;
    lctx.beginPath();
    lctx.arc(px, py, lightR, 0, Math.PI * 2);
    lctx.fill();

    // STEP 3: Punch torch light holes on offscreen canvas
    const torchMaxDist = 800;
    const visibleTorches = [];
    for (const t of dungeon.torchPositions) {
        const dx = t.wx - player.x, dy = t.wy - player.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > torchMaxDist) continue;
        const tsp = worldToScreen(t.wx, t.wy);
        if (tsp.x < -160 || tsp.x > W + 160 || tsp.y < -160 || tsp.y > H + 160) continue;
        visibleTorches.push({ sx: tsp.x, sy: tsp.y, d, seed: t.seed });
        if (visibleTorches.length >= 24) break;
    }

    // Cached torch hole gradient (created once)
    if (!G._torchHoleCacheV3) {
        const sz = 128, r = sz / 2;
        const c1 = document.createElement('canvas'); c1.width = sz; c1.height = sz;
        const x1 = c1.getContext('2d');
        const g1 = x1.createRadialGradient(r, r, 0, r, r, r);
        g1.addColorStop(0, 'rgba(0,0,0,0.85)');
        g1.addColorStop(0.3, 'rgba(0,0,0,0.7)');
        g1.addColorStop(0.6, 'rgba(0,0,0,0.25)');
        g1.addColorStop(1, 'rgba(0,0,0,0)');
        x1.fillStyle = g1; x1.fillRect(0, 0, sz, sz);
        G._torchHoleCacheV3 = c1;
    }

    for (const torch of visibleTorches) {
        const tFlicker = Math.sin(G.time * 8.3 + torch.seed) * 8 + Math.sin(G.time * 13.7 + torch.seed * 2) * 4;
        const tRadius = 110 + tFlicker;
        const fade = clamp(1 - torch.d / torchMaxDist, 0, 1);
        lctx.globalAlpha = fade;
        const drawSz = tRadius * 2;
        lctx.drawImage(G._torchHoleCacheV3, torch.sx - tRadius, torch.sy - tRadius, drawSz, drawSz);
    }
    lctx.globalAlpha = 1;

    // STEP 4: Composite darkness mask onto main canvas
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(G._lightCanvas, 0, 0);

    // STEP 5: Warm amber player glow (lighter = additive, safe for game art)
    ctx.globalCompositeOperation = 'lighter';
    const warmR = lightR * 0.55;
    const warmGr = ctx.createRadialGradient(px, py, 0, px, py, warmR);
    warmGr.addColorStop(0, 'rgba(255,170,70,0.18)');
    warmGr.addColorStop(0.25, 'rgba(255,140,40,0.10)');
    warmGr.addColorStop(0.6, 'rgba(255,100,20,0.04)');
    warmGr.addColorStop(1, 'rgba(255,80,10,0)');
    ctx.fillStyle = warmGr;
    ctx.beginPath();
    ctx.arc(px, py, warmR, 0, Math.PI * 2);
    ctx.fill();

    // STEP 6: Warm torch glow (cached gradient, lighter blend)
    if (!G._torchWarmCacheV3) {
        const sz = 128, r = sz / 2;
        const c2 = document.createElement('canvas'); c2.width = sz; c2.height = sz;
        const x2 = c2.getContext('2d');
        const g2 = x2.createRadialGradient(r, r, 0, r, r, r);
        g2.addColorStop(0, 'rgba(255,160,64,0.18)');
        g2.addColorStop(0.3, 'rgba(255,100,20,0.08)');
        g2.addColorStop(0.6, 'rgba(255,80,10,0.02)');
        g2.addColorStop(1, 'rgba(255,60,5,0)');
        x2.fillStyle = g2; x2.fillRect(0, 0, sz, sz);
        G._torchWarmCacheV3 = c2;
    }
    for (const torch of visibleTorches) {
        const tFlicker = Math.sin(G.time * 6.1 + torch.seed * 1.3) * 5;
        const tRadius = 100 + tFlicker;
        const fade = clamp(1 - torch.d / torchMaxDist, 0, 1);
        ctx.globalAlpha = fade;
        const drawSz = tRadius * 2;
        ctx.drawImage(G._torchWarmCacheV3, torch.sx - tRadius, torch.sy - tRadius, drawSz, drawSz);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // STEP 7: Subtle warm color grade (D2 amber tone)
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#331800';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    // Damage flash - red vignette + white flash peak
    if (G.dmgFlashT > 0) {
        const flashA = clamp(G.dmgFlashT / 0.35, 0, 1);
        if (flashA > 0.8) {
            ctx.globalAlpha = (flashA - 0.8) * 2.5 * 0.15;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 1;
        }
        const redA = flashA * 0.5;
        const dmgVig = ctx.createRadialGradient(W / 2, H / 2, W * 0.05, W / 2, H / 2, W * 0.55);
        dmgVig.addColorStop(0, `rgba(120,0,0,0)`);
        dmgVig.addColorStop(0.4, `rgba(160,0,0,${redA * 0.3})`);
        dmgVig.addColorStop(0.7, `rgba(200,10,0,${redA * 0.6})`);
        dmgVig.addColorStop(1, `rgba(220,20,0,${redA})`);
        ctx.fillStyle = dmgVig;
        ctx.fillRect(0, 0, W, H);
    }
}

function drawGroundItems() {
    const TYPE_SPR = { sword: 'iSword', axe: 'iAxe', staff: 'iStaff', shield: 'iShield', helmet: 'iHelmet', armor: 'iArmor', ring: 'iRing', amulet: 'iAmulet', boots: 'iBoots', potion: 'iPotion', hp1: 'iPotion', hp2: 'iPotion', hp3: 'iPotion', hp4: 'iPotion', hp5: 'iPotion', mp1: 'iPotion', mp2: 'iPotion', mp3: 'iPotion', rejuv: 'iPotion', fullrejuv: 'iPotion', manaPotion: 'iPotion', smallCharm: 'iRing', mediumCharm: 'iRing', grandCharm: 'iRing' };
    const beamRarities = { rare: true, legendary: true, unique: true, runeword: true };
    for (const gi of groundItems) {
        gi.bobT += 0.02;
        const sp = worldToScreen(gi.x, gi.y);
        const sx = sp.x, sy = sp.y + Math.sin(gi.bobT) * 3;
        if (sx < -30 || sx > W + 30 || sy < -60 || sy > H + 30) continue;

        const c = gi.item.rarity.color;
        const rk = gi.item.rarityKey;

        // Ground glow + light beam for rare+ items
        if (beamRarities[rk]) {
            const glowR = 25 + Math.sin(gi.bobT * 2) * 5;
            const glow = ctx.createRadialGradient(sx, sy + 5, 0, sx, sy + 5, glowR);
            glow.addColorStop(0, c + '55');
            glow.addColorStop(0.5, c + '22');
            glow.addColorStop(1, c + '00');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(sx, sy + 5, glowR, 0, Math.PI * 2); ctx.fill();
            const beamH = 60 + Math.sin(gi.bobT * 2) * 8;
            const beamG = ctx.createLinearGradient(sx, sy, sx, sy - beamH);
            beamG.addColorStop(0, c + '44');
            beamG.addColorStop(0.5, c + '18');
            beamG.addColorStop(1, c + '00');
            ctx.fillStyle = beamG;
            ctx.fillRect(sx - 2, sy - beamH, 4, beamH);
        }

        // Pulsing rarity glow ring
        const pulseA = 0.2 + Math.sin(gi.bobT * 3) * 0.1;
        ctx.globalAlpha = pulseA;
        ctx.strokeStyle = c;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(sx, sy, 15 + Math.sin(gi.bobT * 2) * 2, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(sx, sy, 13, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(sx, sy + 12, 10, 3, 0, 0, Math.PI * 2); ctx.fill();

        // Sprite icon (try animated coin → atlas sprite → OGA RPG icon → emoji fallback)
        let drawn = false;
        // Animated gold/silver/copper coins for gold-like items
        if (ogaLoaded && gi.item.icon === '💰' && OGA.coin_gold) {
            const coinImg = OGA.coin_gold;
            const coinCellSz = coinImg.height; // 32px
            const coinFrames = (coinImg.width / coinCellSz) | 0; // 8
            const coinFrame = Math.floor((gi.bobT * 8) % coinFrames);
            ctx.drawImage(coinImg, coinFrame * coinCellSz, 0, coinCellSz, coinCellSz, sx - 16, sy - 16, 32, 32);
            drawn = true;
        }
        if (!drawn) {
            let sprKey = null;
            let typeKey = null;
            for (const [tKey, tInfo] of Object.entries(ITEM_TYPES)) {
                if (tInfo.icon === gi.item.icon) { sprKey = TYPE_SPR[tKey]; typeKey = tKey; break; }
            }
            drawn = sprKey && drawSpr(sprKey, sx - 14, sy - 14, 28, 28);
            if (!drawn && ogaLoaded && typeKey) {
                drawn = drawOGAItemIcon(typeKey, sx - 14, sy - 14, 28, 28, gi.item.rarity || 0);
            }
        }
        if (!drawn) {
            ctx.font = `14px ${FONT_UI}`;
            ctx.textAlign = 'center';
            ctx.fillText(gi.item.icon, sx, sy + 5);
        }

        // Label with outline
        ctx.font = `10px ${FONT_UI}`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(gi.item.name, sx, sy - 16);
        ctx.fillStyle = c;
        ctx.fillText(gi.item.name, sx, sy - 16);
    }
}

function drawActorsDepthSorted() {
    // Core D2 "feel" relies heavily on correct overlap. Sort by depth so entities
    // in front/behind each other read properly.
    const entries = [];
    for (const m of monsters) {
        if (!m) continue;
        entries.push({ k: depthKey(m.x, m.y), draw: () => m.draw(G.camX, G.camY) });
    }
    if (mercenary && mercenary.alive) {
        entries.push({ k: depthKey(mercenary.x, mercenary.y), draw: () => mercenary.draw(G.camX, G.camY) });
    }
    if (G.minions) {
        for (const mn of G.minions) {
            if (!mn) continue;
            entries.push({
                k: depthKey(mn.x, mn.y),
                draw: () => {
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
            });
        }
    }
    entries.push({ k: depthKey(player.x, player.y), draw: () => player.draw(G.camX, G.camY) });

    entries.sort((a, b) => a.k - b.k);
    for (const e of entries) e.draw();
}

// D2-style globe frame helper
function drawGlobeFrame(cx, cy, r) {
    // Outer dark ring
    ctx.strokeStyle = '#1a1208';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2); ctx.stroke();
    // Metal gradient ring
    const metalG = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    metalG.addColorStop(0, '#c4a44a');
    metalG.addColorStop(0.3, '#8b6914');
    metalG.addColorStop(0.6, '#ddc070');
    metalG.addColorStop(1, '#8b6914');
    ctx.strokeStyle = metalG;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    // Inner highlight arc (top-left)
    ctx.strokeStyle = 'rgba(255,240,200,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r - 1, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke();
    // Inner shadow arc (bottom-right)
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r - 1, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
    // 4-direction rivets
    const rivetR = 2.5;
    const rivetPositions = [
        [cx, cy - r - 1], [cx, cy + r + 1],
        [cx - r - 1, cy], [cx + r + 1, cy]
    ];
    for (const [rx, ry] of rivetPositions) {
        const rg = ctx.createRadialGradient(rx - 0.5, ry - 0.5, 0, rx, ry, rivetR);
        rg.addColorStop(0, '#ddc070');
        rg.addColorStop(0.5, '#8b6914');
        rg.addColorStop(1, '#654321');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(rx, ry, rivetR, 0, Math.PI * 2); ctx.fill();
    }
}

// Canvas-drawn skill icon shapes (pixel-art style, replaces emoji)
// Draws icon centered at origin (caller must translate). eff = effect string, size = icon diameter.
function _drawSkillIconShape(ctx, eff, size) {
    const half = size / 2;
    // --- Specific effect matches first ---
    if (eff === 'chain_lightning') {
        ctx.strokeStyle = '#ffdd44'; ctx.lineWidth = Math.max(1.5, size / 10); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-half * 0.2, -half * 0.8);
        ctx.lineTo(half * 0.15, -half * 0.2);
        ctx.lineTo(-half * 0.1, -half * 0.05);
        ctx.lineTo(half * 0.25, half * 0.7);
        ctx.stroke();
        ctx.strokeStyle = '#fff8cc'; ctx.lineWidth = Math.max(0.8, size / 18);
        ctx.beginPath();
        ctx.moveTo(-half * 0.15, -half * 0.7);
        ctx.lineTo(half * 0.1, -half * 0.15);
        ctx.lineTo(-half * 0.05, 0);
        ctx.lineTo(half * 0.2, half * 0.6);
        ctx.stroke();
    } else if (eff === 'frost_nova') {
        ctx.strokeStyle = '#88ddff'; ctx.lineWidth = Math.max(1.2, size / 12);
        ctx.beginPath(); ctx.arc(0, 0, half * 0.45, 0, Math.PI * 2); ctx.stroke();
        for (let a = 0; a < 8; a++) {
            const ang = a * Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * half * 0.45, Math.sin(ang) * half * 0.45);
            ctx.lineTo(Math.cos(ang) * half * 0.85, Math.sin(ang) * half * 0.85);
            ctx.stroke();
        }
        ctx.fillStyle = '#ccf0ff'; ctx.beginPath(); ctx.arc(0, 0, half * 0.15, 0, Math.PI * 2); ctx.fill();
    } else if (eff === 'frozen_orb') {
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, half * 0.4);
        grad.addColorStop(0, '#ddeeff'); grad.addColorStop(1, '#66aacc');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, half * 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#aaeeff'; ctx.lineWidth = Math.max(1, size / 14);
        for (let a = 0; a < 6; a++) {
            const ang = a * Math.PI / 3 + Math.PI / 6;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * half * 0.4, Math.sin(ang) * half * 0.4);
            ctx.lineTo(Math.cos(ang) * half * 0.8, Math.sin(ang) * half * 0.8);
            ctx.stroke();
            ctx.fillStyle = '#ccf0ff';
            ctx.beginPath(); ctx.arc(Math.cos(ang) * half * 0.8, Math.sin(ang) * half * 0.8, Math.max(1, size / 20), 0, Math.PI * 2); ctx.fill();
        }
    } else if (eff === 'consecrate') {
        ctx.strokeStyle = '#ff8844'; ctx.lineWidth = Math.max(1.5, size / 10);
        ctx.beginPath(); ctx.arc(0, 0, half * 0.65, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(255,136,68,0.25)';
        ctx.beginPath(); ctx.arc(0, 0, half * 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffaa66'; ctx.lineWidth = Math.max(1, size / 14);
        ctx.beginPath(); ctx.moveTo(0, -half * 0.35); ctx.lineTo(0, half * 0.35); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-half * 0.35, 0); ctx.lineTo(half * 0.35, 0); ctx.stroke();
    } else if (eff === 'meteor') {
        ctx.fillStyle = '#ff6622';
        ctx.beginPath(); ctx.arc(half * 0.1, half * 0.15, half * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffcc44';
        ctx.beginPath(); ctx.arc(half * 0.05, half * 0.1, half * 0.18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,100,30,0.5)';
        ctx.beginPath();
        ctx.moveTo(-half * 0.15, -half * 0.05);
        ctx.lineTo(-half * 0.6, -half * 0.7);
        ctx.lineTo(-half * 0.2, -half * 0.5);
        ctx.lineTo(-half * 0.35, -half * 0.8);
        ctx.lineTo(half * 0.05, -half * 0.2);
        ctx.closePath(); ctx.fill();
    } else if (eff === 'teleport') {
        ctx.strokeStyle = '#66aaff'; ctx.lineWidth = Math.max(1.5, size / 10); ctx.lineCap = 'round';
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            const startAng = i * Math.PI;
            for (let t = 0; t <= 1; t += 0.05) {
                const ang = startAng + t * Math.PI * 1.8;
                const r = half * 0.15 + t * half * 0.55;
                const px = Math.cos(ang) * r, py = Math.sin(ang) * r;
                t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
        ctx.fillStyle = '#aaccff'; ctx.beginPath(); ctx.arc(0, 0, half * 0.12, 0, Math.PI * 2); ctx.fill();
    } else if (eff === 'mana_shield') {
        ctx.strokeStyle = '#4488ff'; ctx.lineWidth = Math.max(1.5, size / 10);
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
            const ang = a * Math.PI / 3 - Math.PI / 6;
            const px = Math.cos(ang) * half * 0.65, py = Math.sin(ang) * half * 0.65;
            a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke();
        ctx.fillStyle = 'rgba(68,136,255,0.15)'; ctx.fill();
        ctx.fillStyle = 'rgba(100,170,255,0.3)';
        ctx.beginPath(); ctx.arc(0, 0, half * 0.25, 0, Math.PI * 2); ctx.fill();
    } else if (eff === 'holy_burst') {
        ctx.fillStyle = '#ffdd88';
        ctx.fillRect(-half * 0.12, -half * 0.7, half * 0.24, half * 1.4);
        ctx.fillRect(-half * 0.7, -half * 0.12, half * 1.4, half * 0.24);
        ctx.fillStyle = '#fff8dd';
        ctx.beginPath(); ctx.arc(0, 0, half * 0.2, 0, Math.PI * 2); ctx.fill();
    } else if (eff === 'multi_shot') {
        ctx.strokeStyle = '#ccaa66'; ctx.lineWidth = Math.max(1.2, size / 12); ctx.lineCap = 'round';
        const angles = [-0.35, 0, 0.35];
        for (const da of angles) {
            const ang = -Math.PI / 2 + da;
            ctx.beginPath();
            ctx.moveTo(0, half * 0.3);
            ctx.lineTo(Math.cos(ang) * half * 0.75, Math.sin(ang) * half * 0.75 + half * 0.1);
            ctx.stroke();
            ctx.fillStyle = '#aaaaaa';
            const tx = Math.cos(ang) * half * 0.75, ty = Math.sin(ang) * half * 0.75 + half * 0.1;
            ctx.beginPath(); ctx.arc(tx, ty, Math.max(1.2, size / 16), 0, Math.PI * 2); ctx.fill();
        }
    } else if (eff === 'arrow_rain') {
        ctx.strokeStyle = '#ccaa66'; ctx.lineWidth = Math.max(1, size / 14); ctx.lineCap = 'round';
        const arrows = [[-half * 0.4, -half * 0.3], [0, -half * 0.6], [half * 0.35, -half * 0.15], [-half * 0.15, half * 0.1], [half * 0.15, half * 0.3]];
        for (const [ax, ay] of arrows) {
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + half * 0.08, ay + half * 0.35); ctx.stroke();
            ctx.fillStyle = '#aaaaaa';
            ctx.beginPath();
            ctx.moveTo(ax + half * 0.08, ay + half * 0.35);
            ctx.lineTo(ax + half * 0.15, ay + half * 0.25);
            ctx.lineTo(ax, ay + half * 0.25);
            ctx.fill();
        }
    } else if (eff === 'debuff_defense') {
        ctx.fillStyle = '#ff6644';
        ctx.beginPath(); ctx.moveTo(0, -half * 0.7);
        ctx.lineTo(half * 0.55, -half * 0.35); ctx.lineTo(half * 0.45, half * 0.4);
        ctx.lineTo(0, half * 0.7); ctx.lineTo(-half * 0.45, half * 0.4);
        ctx.lineTo(-half * 0.55, -half * 0.35); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#220000'; ctx.lineWidth = Math.max(1.2, size / 12);
        ctx.beginPath();
        ctx.moveTo(-half * 0.05, -half * 0.5);
        ctx.lineTo(half * 0.1, -half * 0.1);
        ctx.lineTo(-half * 0.1, half * 0.2);
        ctx.lineTo(half * 0.05, half * 0.5);
        ctx.stroke();
    } else if (eff === 'summon_minion') {
        ctx.fillStyle = '#88aacc';
        ctx.beginPath();
        ctx.moveTo(0, -half * 0.7);
        ctx.quadraticCurveTo(half * 0.5, -half * 0.6, half * 0.45, -half * 0.1);
        ctx.lineTo(half * 0.45, half * 0.4);
        ctx.lineTo(half * 0.25, half * 0.25); ctx.lineTo(half * 0.1, half * 0.45);
        ctx.lineTo(-half * 0.1, half * 0.25); ctx.lineTo(-half * 0.25, half * 0.45);
        ctx.lineTo(-half * 0.45, half * 0.3);
        ctx.lineTo(-half * 0.45, -half * 0.1);
        ctx.quadraticCurveTo(-half * 0.5, -half * 0.6, 0, -half * 0.7);
        ctx.fill();
        ctx.fillStyle = '#ccddee';
        ctx.beginPath(); ctx.arc(-half * 0.15, -half * 0.25, half * 0.08, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(half * 0.15, -half * 0.25, half * 0.08, 0, Math.PI * 2); ctx.fill();
    } else if (eff === 'self_heal_pct') {
        ctx.fillStyle = '#44cc44';
        ctx.fillRect(-half * 0.15, -half * 0.6, half * 0.3, half * 1.2);
        ctx.fillRect(-half * 0.6, -half * 0.15, half * 1.2, half * 0.3);
        ctx.fillStyle = '#88ee88';
        ctx.fillRect(-half * 0.08, -half * 0.5, half * 0.16, half * 1.0);
        ctx.fillRect(-half * 0.5, -half * 0.08, half * 1.0, half * 0.16);
    } else if (eff === 'buff_frenzy') {
        ctx.strokeStyle = '#ff4444'; ctx.lineWidth = Math.max(1.5, size / 10); ctx.lineCap = 'round';
        const xs = [-half * 0.3, 0, half * 0.3];
        for (const bx of xs) {
            ctx.beginPath(); ctx.moveTo(bx, half * 0.5); ctx.lineTo(bx, -half * 0.3); ctx.stroke();
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.moveTo(bx, -half * 0.65);
            ctx.lineTo(bx - half * 0.12, -half * 0.3);
            ctx.lineTo(bx + half * 0.12, -half * 0.3);
            ctx.fill();
        }
    } else if (eff === 'buff_berserk') {
        ctx.fillStyle = '#ff6644';
        ctx.beginPath();
        ctx.moveTo(0, -half * 0.8);
        ctx.quadraticCurveTo(half * 0.6, -half * 0.4, half * 0.4, half * 0.1);
        ctx.quadraticCurveTo(half * 0.5, half * 0.5, half * 0.15, half * 0.6);
        ctx.lineTo(0, half * 0.3); ctx.lineTo(-half * 0.15, half * 0.6);
        ctx.quadraticCurveTo(-half * 0.5, half * 0.5, -half * 0.4, half * 0.1);
        ctx.quadraticCurveTo(-half * 0.6, -half * 0.4, 0, -half * 0.8);
        ctx.fill();
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath();
        ctx.moveTo(0, -half * 0.4);
        ctx.quadraticCurveTo(half * 0.25, -half * 0.1, half * 0.15, half * 0.2);
        ctx.lineTo(-half * 0.15, half * 0.2);
        ctx.quadraticCurveTo(-half * 0.25, -half * 0.1, 0, -half * 0.4);
        ctx.fill();
    } else if (eff === 'buff_atkspd') {
        ctx.strokeStyle = '#ffaa44'; ctx.lineWidth = Math.max(1.5, size / 10); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-half * 0.6, -half * 0.4); ctx.lineTo(half * 0.4, -half * 0.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-half * 0.5, 0); ctx.lineTo(half * 0.6, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-half * 0.6, half * 0.4); ctx.lineTo(half * 0.4, half * 0.4); ctx.stroke();
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath();
        ctx.moveTo(half * 0.7, 0);
        ctx.lineTo(half * 0.4, -half * 0.15);
        ctx.lineTo(half * 0.4, half * 0.15);
        ctx.fill();
    } else if (eff === 'buff_crit') {
        ctx.strokeStyle = '#ffdd44'; ctx.lineWidth = Math.max(1.2, size / 12);
        ctx.beginPath(); ctx.arc(0, 0, half * 0.45, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -half * 0.7); ctx.lineTo(0, half * 0.7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-half * 0.7, 0); ctx.lineTo(half * 0.7, 0); ctx.stroke();
        ctx.fillStyle = '#ffdd44';
        ctx.beginPath(); ctx.arc(0, 0, half * 0.12, 0, Math.PI * 2); ctx.fill();
    } else if (eff === 'buff_dodge') {
        ctx.strokeStyle = '#88ccff'; ctx.lineWidth = Math.max(1.2, size / 12); ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-half * 0.6, -half * 0.3);
        ctx.quadraticCurveTo(0, -half * 0.5, half * 0.5, -half * 0.15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-half * 0.5, half * 0.05);
        ctx.quadraticCurveTo(half * 0.1, -half * 0.15, half * 0.6, half * 0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-half * 0.4, half * 0.4);
        ctx.quadraticCurveTo(half * 0.2, half * 0.2, half * 0.5, half * 0.45);
        ctx.stroke();
    } else if (eff === 'buff_speed') {
        ctx.strokeStyle = '#aaddff'; ctx.lineWidth = Math.max(1.2, size / 12); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(-half * 0.15, -half * 0.25, half * 0.3, -Math.PI * 0.8, Math.PI * 0.3); ctx.stroke();
        ctx.beginPath(); ctx.arc(half * 0.15, half * 0.15, half * 0.25, -Math.PI * 0.5, Math.PI * 0.6); ctx.stroke();
        ctx.beginPath(); ctx.arc(-half * 0.3, half * 0.3, half * 0.15, -Math.PI * 0.3, Math.PI * 0.7); ctx.stroke();
    } else if (eff === 'buff_counter') {
        ctx.strokeStyle = '#cc6644'; ctx.lineWidth = Math.max(1.2, size / 12);
        ctx.beginPath(); ctx.arc(0, 0, half * 0.4, 0, Math.PI * 2); ctx.stroke();
        for (let a = 0; a < 8; a++) {
            const ang = a * Math.PI / 4;
            const ix = Math.cos(ang) * half * 0.4, iy = Math.sin(ang) * half * 0.4;
            const ox = Math.cos(ang) * half * 0.75, oy = Math.sin(ang) * half * 0.75;
            ctx.fillStyle = '#cc6644';
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(ix + Math.cos(ang + 0.5) * half * 0.12, iy + Math.sin(ang + 0.5) * half * 0.12);
            ctx.lineTo(ix + Math.cos(ang - 0.5) * half * 0.12, iy + Math.sin(ang - 0.5) * half * 0.12);
            ctx.fill();
        }
    } else if (eff === 'buff_poison') {
        ctx.fillStyle = '#44cc44';
        const drops = [[0, -half * 0.3], [-half * 0.3, half * 0.15], [half * 0.3, half * 0.15]];
        for (const [dx, dy] of drops) {
            ctx.beginPath();
            ctx.moveTo(dx, dy - half * 0.25);
            ctx.quadraticCurveTo(dx + half * 0.18, dy, dx, dy + half * 0.15);
            ctx.quadraticCurveTo(dx - half * 0.18, dy, dx, dy - half * 0.25);
            ctx.fill();
        }
    } else if (eff === 'shadow_strike') {
        ctx.fillStyle = '#8866bb';
        ctx.beginPath();
        ctx.moveTo(half * 0.5, -half * 0.7);
        ctx.lineTo(half * 0.65, -half * 0.5);
        ctx.lineTo(-half * 0.4, half * 0.6);
        ctx.lineTo(-half * 0.55, half * 0.45);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(80,40,120,0.4)';
        ctx.beginPath();
        ctx.moveTo(-half * 0.55, half * 0.45);
        ctx.quadraticCurveTo(-half * 0.7, half * 0.7, -half * 0.3, half * 0.7);
        ctx.lineTo(-half * 0.4, half * 0.6);
        ctx.closePath(); ctx.fill();
    } else if (eff === 'smoke_screen') {
        ctx.fillStyle = 'rgba(136,136,136,0.6)';
        ctx.beginPath(); ctx.arc(-half * 0.2, -half * 0.1, half * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(half * 0.2, 0, half * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-half * 0.05, half * 0.25, half * 0.25, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(170,170,170,0.4)';
        ctx.beginPath(); ctx.arc(0, -half * 0.15, half * 0.2, 0, Math.PI * 2); ctx.fill();
    } else if (eff === 'place_trap') {
        ctx.strokeStyle = '#cc8844'; ctx.lineWidth = Math.max(1.2, size / 12);
        ctx.beginPath(); ctx.arc(0, 0, half * 0.3, 0, Math.PI * 2); ctx.stroke();
        for (let a = 0; a < 8; a++) {
            const ang = a * Math.PI / 4;
            const ix = Math.cos(ang) * half * 0.3, iy = Math.sin(ang) * half * 0.3;
            const ox = Math.cos(ang) * half * 0.55, oy = Math.sin(ang) * half * 0.55;
            ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ox, oy); ctx.stroke();
        }
        ctx.fillStyle = '#cc8844';
        ctx.beginPath(); ctx.arc(0, 0, half * 0.12, 0, Math.PI * 2); ctx.fill();
    } else if (eff.startsWith('arrow_') || eff.startsWith('bolt_')) {
        // Element-tinted projectiles (icons should match the actual skill element even if effect routing is generic).
        const parts = eff.split('_');
        const kind = parts[0] || 'arrow';
        const elem = parts[1] || 'physical';
        const pal = {
            fire: { main: '#ff6622', hi: '#ffcc44' },
            cold: { main: '#88ddff', hi: '#ccf0ff' },
            ice: { main: '#88ddff', hi: '#ccf0ff' },
            lightning: { main: '#ffdd44', hi: '#fff8cc' },
            poison: { main: '#44cc44', hi: '#aaffaa' },
            magic: { main: '#bb88ff', hi: '#e6d0ff' },
            arcane: { main: '#bb88ff', hi: '#e6d0ff' },
            physical: { main: '#ccaa66', hi: '#aaaaaa' }
        }[elem] || { main: '#ccaa66', hi: '#aaaaaa' };

        if (kind === 'bolt') {
            // Bolt: orb + streak.
            ctx.strokeStyle = pal.main; ctx.lineWidth = Math.max(1.5, size / 10); ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-half * 0.6, half * 0.4);
            ctx.lineTo(half * 0.5, -half * 0.5);
            ctx.stroke();
            ctx.fillStyle = pal.main;
            ctx.beginPath(); ctx.arc(half * 0.25, -half * 0.25, half * 0.22, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = pal.hi;
            ctx.beginPath(); ctx.arc(half * 0.2, -half * 0.3, half * 0.11, 0, Math.PI * 2); ctx.fill();
        } else {
            // Arrow: shaft + head.
            ctx.strokeStyle = pal.main; ctx.lineWidth = Math.max(1.6, size / 10); ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-half * 0.55, half * 0.35);
            ctx.lineTo(half * 0.45, -half * 0.45);
            ctx.stroke();
            ctx.fillStyle = pal.hi;
            ctx.beginPath();
            ctx.moveTo(half * 0.45, -half * 0.45);
            ctx.lineTo(half * 0.72, -half * 0.18);
            ctx.lineTo(half * 0.25, -half * 0.18);
            ctx.fill();
            // tiny fletching
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.moveTo(-half * 0.55, half * 0.35);
            ctx.lineTo(-half * 0.75, half * 0.25);
            ctx.lineTo(-half * 0.6, half * 0.1);
            ctx.fill();
        }
        // --- Generic includes-based matches ---
    } else if (eff.includes('fire') || eff.includes('pyro')) {
        ctx.fillStyle = '#ff6622';
        ctx.beginPath();
        ctx.moveTo(0, -half); ctx.quadraticCurveTo(half * 0.7, -half * 0.3, half * 0.5, half * 0.4);
        ctx.lineTo(0, half * 0.1); ctx.lineTo(-half * 0.5, half * 0.4);
        ctx.quadraticCurveTo(-half * 0.7, -half * 0.3, 0, -half); ctx.fill();
        ctx.fillStyle = '#ffcc44';
        ctx.beginPath();
        ctx.moveTo(0, -half * 0.3); ctx.quadraticCurveTo(half * 0.3, 0, half * 0.2, half * 0.3);
        ctx.lineTo(-half * 0.2, half * 0.3);
        ctx.quadraticCurveTo(-half * 0.3, 0, 0, -half * 0.3); ctx.fill();
    } else if (eff.includes('cold') || eff.includes('freeze') || eff.includes('ice') || eff.includes('blizzard')) {
        ctx.strokeStyle = '#88ddff'; ctx.lineWidth = 2;
        for (let a = 0; a < 6; a++) {
            const ang = a * Math.PI / 3;
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ang) * half * 0.8, Math.sin(ang) * half * 0.8); ctx.stroke();
        }
        ctx.fillStyle = '#ccf0ff'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
    } else if (eff.includes('melee') || eff.includes('bash') || eff.includes('execute')) {
        ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-half * 0.6, half * 0.6); ctx.lineTo(half * 0.5, -half * 0.5); ctx.stroke();
        ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.moveTo(half * 0.3, -half * 0.7);
        ctx.lineTo(half * 0.6, -half * 0.4); ctx.lineTo(half * 0.5, -half * 0.5); ctx.fill();
        ctx.fillStyle = '#886633'; ctx.fillRect(-half * 0.7, half * 0.4, half * 0.4, half * 0.3);
    } else if (eff.includes('whirlwind')) {
        ctx.strokeStyle = '#aaddff'; ctx.lineWidth = 2;
        for (let a = 0; a < 3; a++) {
            const ang = a * Math.PI * 2 / 3;
            ctx.beginPath(); ctx.arc(0, 0, half * 0.6, ang, ang + 1.2); ctx.stroke();
        }
    } else if (eff.includes('projectile') || eff.includes('shot') || eff.includes('arrow')) {
        ctx.strokeStyle = '#ccaa66'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-half * 0.6, half * 0.3); ctx.lineTo(half * 0.5, -half * 0.5); ctx.stroke();
        ctx.fillStyle = '#aaaaaa';
        ctx.beginPath(); ctx.moveTo(half * 0.5, -half * 0.5);
        ctx.lineTo(half * 0.7, -half * 0.2); ctx.lineTo(half * 0.2, -half * 0.2); ctx.fill();
    } else if (eff.includes('buff') || eff.includes('battle_orders') || eff.includes('heal')) {
        ctx.fillStyle = '#66aa44';
        ctx.beginPath(); ctx.moveTo(0, -half * 0.7);
        ctx.lineTo(half * 0.6, -half * 0.3); ctx.lineTo(half * 0.5, half * 0.4);
        ctx.lineTo(0, half * 0.7); ctx.lineTo(-half * 0.5, half * 0.4);
        ctx.lineTo(-half * 0.6, -half * 0.3); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#88cc66'; ctx.lineWidth = 1; ctx.stroke();
    } else if (eff.includes('stun') || eff.includes('ground_slam')) {
        ctx.fillStyle = '#ffdd44';
        for (let a = 0; a < 5; a++) {
            const ang = a * Math.PI * 2 / 5 - Math.PI / 2;
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ang) * half * 0.8, Math.sin(ang) * half * 0.8);
            ctx.lineTo(Math.cos(ang + 0.3) * half * 0.3, Math.sin(ang + 0.3) * half * 0.3);
            ctx.fill();
        }
    } else if (eff.includes('charge') || eff.includes('leap')) {
        ctx.strokeStyle = '#ffaa44'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-half * 0.5, half * 0.4);
        ctx.quadraticCurveTo(0, -half * 0.8, half * 0.5, half * 0.4); ctx.stroke();
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath(); ctx.moveTo(half * 0.3, half * 0.1); ctx.lineTo(half * 0.7, half * 0.5);
        ctx.lineTo(half * 0.3, half * 0.6); ctx.fill();
    } else if (eff === '_passive') {
        ctx.strokeStyle = '#8888cc'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, half * 0.6, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#6666aa'; ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.arc(0, 0, half * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    } else {
        // Default: diamond shape
        ctx.fillStyle = '#aaaaaa';
        ctx.beginPath();
        ctx.moveTo(0, -half * 0.6);
        ctx.lineTo(half * 0.45, 0);
        ctx.lineTo(0, half * 0.6);
        ctx.lineTo(-half * 0.45, 0);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#888888'; ctx.lineWidth = 1; ctx.stroke();
    }
}

// data URL cache for skill icons used in HTML panels
const _skillIconDataURLCache = {};
let _skillIconEffById = {};
function getSkillIconDataURL(sk, size) {
    const eff = sk.iconEff || (sk.id ? _skillIconEffById[sk.id] : undefined) || sk.effect || (sk.skillType === 'passive' ? '_passive' : '_default');
    const key = eff + '_' + size;
    if (_skillIconDataURLCache[key]) return _skillIconDataURLCache[key];
    const cvs = document.createElement('canvas');
    cvs.width = size; cvs.height = size;
    const c = cvs.getContext('2d');
    c.translate(size / 2, size / 2);
    _drawSkillIconShape(c, eff, size);
    _skillIconDataURLCache[key] = cvs.toDataURL();
    return _skillIconDataURLCache[key];
}
function preRenderSkillIcons() {
    if (!G.playerClass || !CLASS_DEFS[G.playerClass]) return;
    const skills = getAllAvailableSkills();
    if (!skills || skills.length === 0) return;
    // Cache id -> iconEff to keep UI icons correct even if slot objects were serialized without iconEff.
    _skillIconEffById = {};
    for (const sk of skills) {
        if (sk && sk.id && sk.iconEff) _skillIconEffById[sk.id] = sk.iconEff;
    }
    const sizes = [18, 20, 28, 40];
    const effs = new Set();
    for (const sk of skills) {
        effs.add(sk.iconEff || sk.effect || (sk.skillType === 'passive' ? '_passive' : '_default'));
    }
    for (const eff of effs) {
        for (const sz of sizes) {
            const key = eff + '_' + sz;
            if (_skillIconDataURLCache[key]) continue;
            const cvs = document.createElement('canvas');
            cvs.width = sz; cvs.height = sz;
            const c = cvs.getContext('2d');
            c.translate(sz / 2, sz / 2);
            _drawSkillIconShape(c, eff, sz);
            _skillIconDataURLCache[key] = cvs.toDataURL();
        }
    }
}

// Waypoint icon Canvas drawing (blue swirl portal)
function _drawWaypointIcon(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);
    const half = size / 2;
    const glow = ctx.createRadialGradient(0, 0, half * 0.2, 0, 0, half * 0.9);
    glow.addColorStop(0, 'rgba(100,170,255,0.5)');
    glow.addColorStop(1, 'rgba(100,170,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, half * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#66aaff'; ctx.lineWidth = Math.max(2, size / 10); ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const startAng = i * Math.PI * 2 / 3;
        for (let t = 0; t <= 1; t += 0.04) {
            const ang = startAng + t * Math.PI * 1.6;
            const r = half * 0.1 + t * half * 0.55;
            const px = Math.cos(ang) * r, py = Math.sin(ang) * r;
            t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
    ctx.fillStyle = '#ccddff';
    ctx.beginPath(); ctx.arc(0, 0, half * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}
function getWaypointIconDataURL(size) {
    const key = '_waypoint_' + size;
    if (_skillIconDataURLCache[key]) return _skillIconDataURLCache[key];
    const cvs = document.createElement('canvas');
    cvs.width = size; cvs.height = size;
    const c = cvs.getContext('2d');
    _drawWaypointIcon(c, size / 2, size / 2, size);
    _skillIconDataURLCache[key] = cvs.toDataURL();
    return _skillIconDataURLCache[key];
}

// Canvas-drawn skill icon (uses _drawSkillIconShape, no emoji fallback)
function _drawSkillIcon(ctx, sk, cx, cy, size) {
    const eff = sk.iconEff || sk.effect || (sk.skillType === 'passive' ? '_passive' : '_default');
    ctx.save();
    ctx.translate(cx, cy);
    _drawSkillIconShape(ctx, eff, size);
    ctx.restore();
}

// CanvasRenderingContext2D.roundRect is not supported everywhere; provide a fallback path helper.
function pathRoundRect(c, x, y, w, h, r) {
    if (c.roundRect) { c.roundRect(x, y, w, h, r); return; }
    const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    c.moveTo(x + rr, y);
    c.lineTo(x + w - rr, y);
    c.quadraticCurveTo(x + w, y, x + w, y + rr);
    c.lineTo(x + w, y + h - rr);
    c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    c.lineTo(x + rr, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - rr);
    c.lineTo(x, y + rr);
    c.quadraticCurveTo(x, y, x + rr, y);
}

// ========== OVERLAY MAP (TAB key) ==========
function drawOverlayMap() {
    if (!G.showOverlayMap) return;
    const mapPixW = MAP_W * TILE, mapPixH = MAP_H * TILE;
    // Scale to fit ~70% of screen
    const maxDim = Math.min(W, H) * 0.7;
    const scale = maxDim / Math.max(mapPixW, mapPixH);
    const drawW = mapPixW * scale, drawH = mapPixH * scale;
    const ox = (W - drawW) / 2, oy = (H - drawH) / 2;

    ctx.save();
    ctx.globalAlpha = 0.75;

    // Dark background
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);

    // Draw explored tiles
    const tileW = TILE * scale;
    for (let ty = 0; ty < MAP_H; ty++) {
        for (let tx = 0; tx < MAP_W; tx++) {
            if (!dungeon.explored[dungeon.idx(tx, ty)]) continue;
            const tile = dungeon.get(tx, ty);
            if (tile === 0) continue; // wall
            const dx = ox + tx * tileW, dy = oy + ty * tileW;
            if (tile === 2) {
                ctx.fillStyle = '#aa88ff'; // stairs
            } else if (tile === 3) {
                ctx.fillStyle = '#886622'; // chest
            } else {
                ctx.fillStyle = '#2a2040'; // floor
            }
            ctx.fillRect(dx, dy, Math.ceil(tileW), Math.ceil(tileW));
        }
    }

    // Wall outlines for explored areas (draw walls adjacent to explored floor)
    ctx.fillStyle = '#0d0a15';
    for (let ty = 0; ty < MAP_H; ty++) {
        for (let tx = 0; tx < MAP_W; tx++) {
            if (dungeon.get(tx, ty) !== 0) continue;
            // Check if any neighbor is explored floor
            let adj = false;
            for (let ddy = -1; ddy <= 1 && !adj; ddy++) {
                for (let ddx = -1; ddx <= 1 && !adj; ddx++) {
                    const nx = tx + ddx, ny = ty + ddy;
                    if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H) {
                        if (dungeon.explored[dungeon.idx(nx, ny)] && dungeon.get(nx, ny) >= 1) adj = true;
                    }
                }
            }
            if (adj) {
                ctx.fillRect(ox + tx * tileW, oy + ty * tileW, Math.ceil(tileW), Math.ceil(tileW));
            }
        }
    }

    // Monsters (red dots) - only within vision range
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#ff3333';
    for (const m of monsters) {
        if (m.alive && dist(player.x, player.y, m.x, m.y) < 400) {
            const mx = ox + m.x * scale, my = oy + m.y * scale;
            const r = m.isBoss ? 5 : (m.isChampion || m.isUnique) ? 4 : 2.5;
            ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.fill();
        }
    }

    // Town NPCs (blue dots)
    if (G.inTown) {
        ctx.fillStyle = '#4488ff';
        for (const npc of townNPCs) {
            const nx = ox + npc.x * scale, ny = oy + npc.y * scale;
            ctx.beginPath(); ctx.arc(nx, ny, 4, 0, Math.PI * 2); ctx.fill();
            // NPC name label
            ctx.fillStyle = '#88bbff';
            ctx.font = `9px ${FONT_UI}`;
            ctx.textAlign = 'center';
            ctx.fillText(npc.name, nx, ny - 7);
            ctx.fillStyle = '#4488ff';
        }
    }

    // Stairs icon
    if (dungeon.stairsX && dungeon.stairsY) {
        const sx = ox + dungeon.stairsX * TILE * scale + tileW / 2;
        const sy = oy + dungeon.stairsY * TILE * scale + tileW / 2;
        ctx.fillStyle = '#ffdd44';
        ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Mercenary (green dot)
    if (typeof mercenary !== 'undefined' && mercenary && mercenary.alive) {
        ctx.fillStyle = '#44ff44';
        const mx = ox + mercenary.x * scale, my = oy + mercenary.y * scale;
        ctx.beginPath(); ctx.arc(mx, my, 3, 0, Math.PI * 2); ctx.fill();
    }

    // Player (white pulsing dot)
    ctx.globalAlpha = 1.0;
    const pulse = 3 + Math.sin(G.time * 4) * 1.5;
    const px = ox + player.x * scale, py = oy + player.y * scale;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(px, py, pulse, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Legend
    ctx.globalAlpha = 0.9;
    ctx.textAlign = 'left';
    ctx.font = `11px ${FONT_UI}`;
    const legendX = ox + 6, legendY = oy + drawH + 16;
    const legends = [
        ['#ffffff', '● プレイヤー'],
        ['#ff3333', '● 敵'],
        ['#ffdd44', '● 階段'],
    ];
    if (G.inTown) legends.push(['#4488ff', '● NPC']);
    if (typeof mercenary !== 'undefined' && mercenary && mercenary.alive) legends.push(['#44ff44', '● 傭兵']);
    let lx = legendX;
    for (const [color, text] of legends) {
        ctx.fillStyle = color;
        ctx.fillText(text, lx, legendY);
        lx += ctx.measureText(text).width + 16;
    }

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#daa520';
    ctx.font = `bold 14px ${FONT_UI}`;
    const title = G.inTown ? `${ACT_DEFS[G.act].townName} マップ` : `ACT${G.act} 第${G.actFloor}層`;
    ctx.fillText(title, W / 2, oy - 10);
    ctx.fillStyle = '#888';
    ctx.font = `10px ${FONT_UI}`;
    ctx.fillText('TABで閉じる', W / 2, oy - 26);

    // Border
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - 2, oy - 2, drawW + 4, drawH + 4);

    ctx.restore();
}

function drawHUD() {
    // ===== BOTTOM BAR BACKGROUND (stone texture + metal trim) =====
    const barH = 80;
    const barY = H - barH;
    // Stone texture base
    const stoneG = ctx.createLinearGradient(0, barY, 0, H);
    stoneG.addColorStop(0, 'rgba(22,18,14,0.95)');
    stoneG.addColorStop(0.3, 'rgba(16,12,8,0.95)');
    stoneG.addColorStop(1, 'rgba(8,5,3,0.98)');
    ctx.fillStyle = stoneG;
    ctx.fillRect(0, barY, W, barH);
    // Stone noise overlay
    ctx.globalAlpha = 0.04;
    for (let nx = 0; nx < W; nx += 64) {
        if (TILE_TEXTURES['grain']) ctx.drawImage(TILE_TEXTURES['grain'], nx, barY, 64, barH);
    }
    ctx.globalAlpha = 1;
    // Gold metal trim top line (keep it subtle; strong 1px lines read as "weird line" on some displays)
    const trimG = ctx.createLinearGradient(0, barY - 1, W, barY - 1);
    trimG.addColorStop(0, '#654321');
    trimG.addColorStop(0.2, '#c4a44a');
    trimG.addColorStop(0.5, '#ddc070');
    trimG.addColorStop(0.8, '#c4a44a');
    trimG.addColorStop(1, '#654321');
    ctx.strokeStyle = trimG;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.75;
    ctx.beginPath(); ctx.moveTo(0, barY + 0.5); ctx.lineTo(W, barY + 0.5); ctx.stroke();
    // Secondary dark line below trim
    ctx.strokeStyle = '#1a1208';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(0, barY + 1.5); ctx.lineTo(W, barY + 1.5); ctx.stroke();
    ctx.globalAlpha = 1;

    // Health & Mana Globes
    const globeR = 30;
    const globeY = H - 40;

    // HP Globe (left) - OGA Health Orb integration
    const hpX = 45;
    ctx.save();
    ctx.beginPath();
    ctx.arc(hpX, globeY, globeR, 0, Math.PI * 2);
    ctx.clip();
    // BG
    ctx.fillStyle = '#330000';
    ctx.fillRect(hpX - globeR, globeY - globeR, globeR * 2, globeR * 2);
    // Fill
    const hpPct = clamp(player.hp / player.maxHP, 0, 1);
    const hpFillH = globeR * 2 * hpPct;
    const hpGrad = ctx.createLinearGradient(hpX - globeR, 0, hpX + globeR, 0);
    hpGrad.addColorStop(0, '#aa0000');
    hpGrad.addColorStop(0.4, '#dd1111');
    hpGrad.addColorStop(0.6, '#cc0000');
    hpGrad.addColorStop(1, '#880000');
    ctx.fillStyle = hpGrad;
    ctx.fillRect(hpX - globeR, globeY + globeR - hpFillH, globeR * 2, hpFillH);
    // Bubble animation on liquid surface
    const hpSurfaceY = globeY + globeR - hpFillH;
    for (let b = 0; b < 3; b++) {
        const bx = hpX + Math.sin(G.time * 2.5 + b * 2.1) * (globeR * 0.5);
        const by = hpSurfaceY + Math.sin(G.time * 3.3 + b * 1.7) * 3 + 3;
        ctx.fillStyle = 'rgba(255,120,120,0.3)';
        ctx.beginPath(); ctx.arc(bx, by, 1.5 + Math.sin(G.time * 4 + b) * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    // Wave line on surface
    ctx.strokeStyle = 'rgba(255,80,80,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let wx = hpX - globeR; wx < hpX + globeR; wx += 2) {
        const wy = hpSurfaceY + Math.sin(G.time * 3 + wx * 0.15) * 1.5;
        wx === hpX - globeR ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
    }
    ctx.stroke();
    // Sheen
    const hpSheen = ctx.createRadialGradient(hpX - 8, globeY - 8, 0, hpX, globeY, globeR);
    hpSheen.addColorStop(0, 'rgba(255,100,100,0.3)');
    hpSheen.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hpSheen;
    ctx.fillRect(hpX - globeR, globeY - globeR, globeR * 2, globeR * 2);
    ctx.restore();
    // OGA DarkOrbBorder overlay or fallback to canvas frame
    if (ogaLoaded && OGA.ui_orb_border) {
        const orbSz = globeR * 2 + 10;
        ctx.drawImage(OGA.ui_orb_border, hpX - orbSz / 2, globeY - orbSz / 2, orbSz, orbSz);
    } else {
        drawGlobeFrame(hpX, globeY, globeR);
    }
    // Text
    ctx.fillStyle = '#fff';
    ctx.font = `bold 13px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(player.hp)}`, hpX, globeY + 4);
    ctx.font = `9px ${FONT_UI}`;
    ctx.fillStyle = '#faa';
    ctx.fillText('HP', hpX, globeY + 16);

    // MP Globe (right) - OGA Mana Orb integration
    const mpX = W - 50;
    ctx.save();
    ctx.beginPath();
    ctx.arc(mpX, globeY, globeR, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#000033';
    ctx.fillRect(mpX - globeR, globeY - globeR, globeR * 2, globeR * 2);
    const mpPct = clamp(player.mp / player.maxMP, 0, 1);
    const mpFillH = globeR * 2 * mpPct;
    const mpGrad = ctx.createLinearGradient(mpX - globeR, 0, mpX + globeR, 0);
    mpGrad.addColorStop(0, '#002299');
    mpGrad.addColorStop(0.4, '#0055dd');
    mpGrad.addColorStop(0.6, '#0044cc');
    mpGrad.addColorStop(1, '#001a88');
    ctx.fillStyle = mpGrad;
    ctx.fillRect(mpX - globeR, globeY + globeR - mpFillH, globeR * 2, mpFillH);
    // Bubble animation
    const mpSurfaceY = globeY + globeR - mpFillH;
    for (let b = 0; b < 3; b++) {
        const bx = mpX + Math.sin(G.time * 2.2 + b * 2.3) * (globeR * 0.5);
        const by = mpSurfaceY + Math.sin(G.time * 3.1 + b * 1.5) * 3 + 3;
        ctx.fillStyle = 'rgba(120,120,255,0.3)';
        ctx.beginPath(); ctx.arc(bx, by, 1.5 + Math.sin(G.time * 4.2 + b) * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    // Wave line on surface
    ctx.strokeStyle = 'rgba(80,80,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let wx = mpX - globeR; wx < mpX + globeR; wx += 2) {
        const wy = mpSurfaceY + Math.sin(G.time * 2.8 + wx * 0.15) * 1.5;
        wx === mpX - globeR ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
    }
    ctx.stroke();
    const mpSheen = ctx.createRadialGradient(mpX - 8, globeY - 8, 0, mpX, globeY, globeR);
    mpSheen.addColorStop(0, 'rgba(100,100,255,0.3)');
    mpSheen.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mpSheen;
    ctx.fillRect(mpX - globeR, globeY - globeR, globeR * 2, globeR * 2);
    ctx.restore();
    // OGA DarkOrbBorder overlay or fallback to canvas frame
    if (ogaLoaded && OGA.ui_orb_border) {
        const orbSz = globeR * 2 + 10;
        ctx.drawImage(OGA.ui_orb_border, mpX - orbSz / 2, globeY - orbSz / 2, orbSz, orbSz);
    } else {
        drawGlobeFrame(mpX, globeY, globeR);
    }
    ctx.fillStyle = '#fff';
    ctx.font = `bold 13px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(player.mp)}`, mpX, globeY + 4);
    ctx.font = `9px ${FONT_UI}`;
    ctx.fillStyle = '#aaf';
    ctx.fillText('MP', mpX, globeY + 16);

    // Skill bar - 6 slots
    const skillW = 48, skillH = 48, skillGap = 5;
    const numSkills = 6;
    const skillTotalW = numSkills * skillW + (numSkills - 1) * skillGap;
    const skillStartX = W / 2 - skillTotalW / 2;
    const skillY = H - 62;

    // Skill bar background (stone panel + metal trim double border)
    const skillBgG = ctx.createLinearGradient(skillStartX - 8, skillY - 5, skillStartX - 8, skillY + skillH + 13);
    skillBgG.addColorStop(0, 'rgba(18,14,10,0.92)');
    skillBgG.addColorStop(0.5, 'rgba(12,9,6,0.95)');
    skillBgG.addColorStop(1, 'rgba(8,5,3,0.95)');
    ctx.fillStyle = skillBgG;
    ctx.fillRect(skillStartX - 10, skillY - 7, skillTotalW + 20, skillH + 22);
    // Outer metal trim
    const skillTrimOuter = ctx.createLinearGradient(skillStartX - 10, 0, skillStartX + skillTotalW + 10, 0);
    skillTrimOuter.addColorStop(0, '#654321');
    skillTrimOuter.addColorStop(0.3, '#8b6914');
    skillTrimOuter.addColorStop(0.5, '#c4a44a');
    skillTrimOuter.addColorStop(0.7, '#8b6914');
    skillTrimOuter.addColorStop(1, '#654321');
    ctx.strokeStyle = skillTrimOuter;
    ctx.lineWidth = 2;
    ctx.strokeRect(skillStartX - 10, skillY - 7, skillTotalW + 20, skillH + 22);
    // Inner dark trim
    ctx.strokeStyle = '#1a1208';
    ctx.lineWidth = 1;
    ctx.strokeRect(skillStartX - 8, skillY - 5, skillTotalW + 16, skillH + 18);

    for (let i = 1; i <= numSkills; i++) {
        const sk = player.skills[i];
        const x = skillStartX + (i - 1) * (skillW + skillGap);
        const sel = player.selectedSkill === i;

        // Background
        ctx.fillStyle = sel ? 'rgba(100,80,30,0.9)' : 'rgba(30,25,20,0.8)';
        ctx.fillRect(x, skillY, skillW, skillH);

        // OGA SpellSlotBorder overlay or fallback canvas border
        if (ogaLoaded && OGA.ui_spell_slot) {
            ctx.drawImage(OGA.ui_spell_slot, x - 2, skillY - 2, skillW + 4, skillH + 4);
            if (sel) {
                ctx.save();
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 6;
                ctx.drawImage(OGA.ui_spell_slot, x - 2, skillY - 2, skillW + 4, skillH + 4);
                ctx.restore();
            }
        } else {
            ctx.strokeStyle = sel ? '#ffd700' : '#5a4a3a';
            ctx.lineWidth = sel ? 2 : 1;
            ctx.strokeRect(x, skillY, skillW, skillH);
            if (sel) {
                ctx.save();
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 6;
                ctx.strokeRect(x, skillY, skillW, skillH);
                ctx.restore();
            }
        }

        // Icon (Canvas-drawn)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (sk) {
            const icx = x + skillW / 2, icy = skillY + skillH / 2 - 4;
            _drawSkillIcon(ctx, sk, icx, icy, 16);
        } else {
            ctx.font = `12px ${FONT_UI}`;
            ctx.fillStyle = '#555';
            ctx.fillText('空', x + skillW / 2, skillY + skillH / 2 - 2);
        }

        // Key number
        ctx.textBaseline = 'alphabetic';
        ctx.font = `bold 9px ${FONT_UI}`;
        ctx.fillStyle = sel ? '#ffd700' : '#777';
        ctx.fillText(i, x + skillW / 2, skillY + 40);

        // MP cost
        ctx.font = `7px ${FONT_UI}`;
        ctx.fillStyle = '#4488ff';
        if (sk && sk.mp != null) {
            ctx.fillText(sk.mp + 'MP', x + skillW / 2, skillY + skillH - 2);
        }

        // Cooldown overlay
        if (sk && sk.cooldown > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            const cdPct = sk.cooldown / sk.maxCD;
            ctx.fillRect(x, skillY, skillW, skillH * cdPct);
            ctx.fillStyle = '#fff';
            ctx.font = `bold 13px ${FONT_UI}`;
            ctx.fillText(sk.cooldown.toFixed(1), x + skillW / 2, skillY + 28);
        }
    }

    // Potion Belt (D2-style: 4 slots - 2 HP left, 2 MP right)
    const hpPotCount = getHPPotionCount(player.potionInv);
    const mpPotCount = getMPPotionCount(player.potionInv);
    const beltSlotW = 28, beltSlotH = 28, beltGap = 2;
    const beltY = skillY + 2;

    // HP potion belt (left side)
    const hpBeltX = skillStartX - beltSlotW * 2 - beltGap - 20;
    for (let i = 0; i < 2; i++) {
        const bx = hpBeltX + i * (beltSlotW + beltGap);
        ctx.fillStyle = hpPotCount > i ? 'rgba(0,60,0,0.8)' : 'rgba(20,15,10,0.6)';
        ctx.fillRect(bx, beltY, beltSlotW, beltSlotH);
        ctx.strokeStyle = hpPotCount > i ? '#00aa00' : '#3a3228';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, beltY, beltSlotW, beltSlotH);
        if (hpPotCount > i) {
            // D2-style potion icon (canvas-drawn, matches dark fantasy HUD)
            const pcx = bx + beltSlotW / 2, pcy = beltY + beltSlotH / 2;
            ctx.fillStyle = '#880000'; ctx.beginPath();
            pathRoundRect(ctx, pcx - 4, pcy - 6, 8, 12, 2); ctx.fill();
            ctx.fillStyle = '#cc2200'; ctx.beginPath();
            pathRoundRect(ctx, pcx - 3, pcy - 5, 6, 7, 1); ctx.fill();
            ctx.fillStyle = '#553322'; ctx.fillRect(pcx - 3, pcy - 8, 6, 3);
        }
    }
    ctx.textAlign = 'center';
    ctx.font = `bold 10px ${FONT_UI}`;
    ctx.fillStyle = '#00ff00';
    ctx.fillText(`x${hpPotCount}`, hpBeltX + beltSlotW + beltGap / 2, beltY + beltSlotH + 10);
    ctx.font = `bold 8px ${FONT_UI}`;
    ctx.fillStyle = '#888';
    ctx.fillText('(Q)', hpBeltX + beltSlotW + beltGap / 2, beltY - 6);

    // MP potion belt (right side)
    const mpBeltX = skillStartX + skillTotalW + 20;
    for (let i = 0; i < 2; i++) {
        const bx = mpBeltX + i * (beltSlotW + beltGap);
        ctx.fillStyle = mpPotCount > i ? 'rgba(0,20,60,0.8)' : 'rgba(20,15,10,0.6)';
        ctx.fillRect(bx, beltY, beltSlotW, beltSlotH);
        ctx.strokeStyle = mpPotCount > i ? '#4488ff' : '#3a3228';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, beltY, beltSlotW, beltSlotH);
        if (mpPotCount > i) {
            // D2-style mana potion icon (canvas-drawn, matches dark fantasy HUD)
            const mcx = bx + beltSlotW / 2, mcy = beltY + beltSlotH / 2;
            ctx.fillStyle = '#000088'; ctx.beginPath();
            pathRoundRect(ctx, mcx - 4, mcy - 6, 8, 12, 2); ctx.fill();
            ctx.fillStyle = '#2244cc'; ctx.beginPath();
            pathRoundRect(ctx, mcx - 3, mcy - 5, 6, 7, 1); ctx.fill();
            ctx.fillStyle = '#553322'; ctx.fillRect(mcx - 3, mcy - 8, 6, 3);
        }
    }
    ctx.textAlign = 'center';
    ctx.font = `bold 10px ${FONT_UI}`;
    ctx.fillStyle = '#4488ff';
    ctx.fillText(`x${mpPotCount}`, mpBeltX + beltSlotW + beltGap / 2, beltY + beltSlotH + 10);
    ctx.font = `bold 8px ${FONT_UI}`;
    ctx.fillStyle = '#888';
    ctx.fillText('(W)', mpBeltX + beltSlotW + beltGap / 2, beltY - 6);

    // XP bar (OGA itsmars experience bar or fallback)
    const xpW = skillTotalW + 60;
    const xpH = ogaLoaded && OGA.ui_exp_back ? 10 : 6;
    const xpX = W / 2 - xpW / 2;
    const xpY = skillY - (ogaLoaded && OGA.ui_exp_back ? 14 : 12);
    const xpPctVal = clamp(player.xp / player.xpToNext, 0, 1);
    if (ogaLoaded && OGA.ui_exp_back && OGA.ui_exp_fill) {
        // Layer 1: Shadow
        if (OGA.ui_exp_shadow) ctx.drawImage(OGA.ui_exp_shadow, xpX, xpY + 1, xpW, xpH);
        // Layer 2: Back
        ctx.drawImage(OGA.ui_exp_back, xpX, xpY, xpW, xpH);
        // Layer 3: Fill (clipped to XP%)
        ctx.save();
        ctx.beginPath();
        ctx.rect(xpX, xpY, xpW * xpPctVal, xpH);
        ctx.clip();
        ctx.drawImage(OGA.ui_exp_fill, xpX, xpY + 1, xpW, xpH - 2);
        ctx.restore();
        // Layer 4: Highlight
        if (OGA.ui_exp_highlight) {
            ctx.globalAlpha = 0.5;
            ctx.drawImage(OGA.ui_exp_highlight, xpX, xpY, xpW, xpH);
            ctx.globalAlpha = 1;
        }
    } else {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(xpX, xpY, xpW, xpH);
        ctx.fillStyle = '#8844ff';
        ctx.fillRect(xpX, xpY, xpW * xpPctVal, xpH);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(xpX, xpY, xpW, xpH);
    }
    ctx.fillStyle = '#aaa';
    ctx.font = `9px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.fillText(`Lv.${player.level}  ${player.xp}/${player.xpToNext} XP`, W / 2, xpY - 2);

    // ACT / Floor / Gold info (above minimap)
    const actDef = getCurrentActDef();
    ctx.font = `bold 12px ${FONT_UI}`;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd700';
    const actLabel = G.inTown ? `${ACT_DEFS[G.act].townName}` : `ACT${G.act} ${actDef.name}`;
    ctx.fillText(actLabel, W - 15, 155);
    ctx.font = `10px ${FONT_UI}`;
    ctx.fillStyle = '#aaa';
    if (!G.inTown) {
        ctx.fillText(`第${G.actFloor}層/${actDef.floors}${G.cycle > 0 ? ' (' + (G.cycle + 1) + '周目)' : ''}`, W - 15, 170);
    } else {
        ctx.fillText(`${G.cycle > 0 ? (G.cycle + 1) + '周目' : '拠点'}`, W - 15, 170);
    }
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`💰 ${G.gold}G`, W - 15, 185);

    // Quest tracker (top-left, below shortcuts)
    G._questTrackerH = 0;
    const activeQuests = getActiveQuests();
    if (activeQuests.length > 0) {
        const qtY = 24;
        ctx.textAlign = 'left';
        ctx.font = `bold 11px ${FONT_UI}`;
        let qy = qtY + 10;
        const qtH = Math.min(activeQuests.length, 3) * 28 + 4;
        G._questTrackerH = qtH + 10;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(5, qtY, 200, qtH);
        for (const q of activeQuests.slice(0, 3)) {
            const color = q.status === 'complete' ? '#ffd700' : '#4488ff';
            ctx.fillStyle = color;
            const prog = q.type === 'kill_count' ? ` (${q.progress || 0}/${q.target})` : '';
            const prefix = q.status === 'complete' ? '★ ' : '📌 ';
            ctx.fillText(`${prefix}${q.name}${prog}`, 10, qy);
            qy += 14;
            ctx.font = `9px ${FONT_UI}`;
            ctx.fillStyle = '#888';
            ctx.fillText(q.desc, 10, qy);
            qy += 14;
            ctx.font = `bold 11px ${FONT_UI}`;
        }
    }

    // Minimap (stone frame + corner rivets) - cached via OffscreenCanvas
    const mmSize = 130;
    const mmX = W - mmSize - 10, mmY = 10;
    const mmScale = mmSize / (MAP_W * TILE);

    // Rebuild minimap cache when exploration changes
    if (dungeon.minimapDirty || !dungeon.minimapCache) {
        const mmCanvasW = mmSize + 6;
        if (!dungeon.minimapCache || dungeon.minimapCache.width !== mmCanvasW) {
            dungeon.minimapCache = document.createElement('canvas');
            dungeon.minimapCache.width = mmCanvasW; dungeon.minimapCache.height = mmCanvasW;
        }
        const mmCanvas = dungeon.minimapCache;
        const mc = mmCanvas.getContext('2d');
        mc.clearRect(0, 0, mmCanvasW, mmCanvasW);
        // Stone background
        const mmBgG = mc.createLinearGradient(0, 0, mmCanvasW, mmCanvasW);
        mmBgG.addColorStop(0, 'rgba(8,6,4,0.85)');
        mmBgG.addColorStop(1, 'rgba(4,3,2,0.9)');
        mc.fillStyle = mmBgG;
        mc.fillRect(0, 0, mmCanvasW, mmCanvasW);
        // Outer dark border
        mc.strokeStyle = '#1a1208';
        mc.lineWidth = 3;
        mc.strokeRect(0, 0, mmCanvasW, mmCanvasW);
        // Inner metal trim
        const mmTrimG = mc.createLinearGradient(3, 3, mmSize + 3, 3);
        mmTrimG.addColorStop(0, '#654321');
        mmTrimG.addColorStop(0.3, '#c4a44a');
        mmTrimG.addColorStop(0.5, '#ddc070');
        mmTrimG.addColorStop(0.7, '#c4a44a');
        mmTrimG.addColorStop(1, '#654321');
        mc.strokeStyle = mmTrimG;
        mc.lineWidth = 1.5;
        mc.strokeRect(3, 3, mmSize, mmSize);
        // Corner rivets
        const corners = [[3, 3], [3 + mmSize, 3], [3, 3 + mmSize], [3 + mmSize, 3 + mmSize]];
        for (const [crx, cry] of corners) {
            const crg = mc.createRadialGradient(crx - 0.5, cry - 0.5, 0, crx, cry, 3);
            crg.addColorStop(0, '#ddc070');
            crg.addColorStop(0.5, '#8b6914');
            crg.addColorStop(1, '#654321');
            mc.fillStyle = crg;
            mc.beginPath(); mc.arc(crx, cry, 3, 0, Math.PI * 2); mc.fill();
        }
        // Rooms - only explored ones
        for (const room of dungeon.rooms) {
            const explored = dungeon.explored[dungeon.idx(room.cx, room.cy)];
            if (explored) {
                mc.fillStyle = '#2a2040';
                mc.fillRect(3 + room.x * TILE * mmScale, 3 + room.y * TILE * mmScale, room.w * TILE * mmScale, room.h * TILE * mmScale);
            }
        }
        // Explored corridor tiles (not just rooms)
        mc.fillStyle = '#1a1530';
        for (let ty = 0; ty < MAP_H; ty++) {
            for (let tx = 0; tx < MAP_W; tx++) {
                if (dungeon.explored[dungeon.idx(tx, ty)] && dungeon.get(tx, ty) >= 1) {
                    let inRoom = false;
                    for (const room of dungeon.rooms) {
                        if (dungeon.explored[dungeon.idx(room.cx, room.cy)] &&
                            tx >= room.x && tx < room.x + room.w &&
                            ty >= room.y && ty < room.y + room.h) {
                            inRoom = true; break;
                        }
                    }
                    if (!inRoom) {
                        mc.fillRect(3 + tx * TILE * mmScale, 3 + ty * TILE * mmScale, Math.max(TILE * mmScale, 1.5), Math.max(TILE * mmScale, 1.5));
                    }
                }
            }
        }
        dungeon.minimapDirty = false;
    }
    // Draw cached minimap background
    ctx.drawImage(dungeon.minimapCache, mmX - 3, mmY - 3);

    // Player on minimap
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(mmX + player.x * mmScale, mmY + player.y * mmScale, 3, 0, Math.PI * 2);
    ctx.fill();

    // Monsters on minimap - ONLY show if near player (within aggro/visibility range)
    const visionRange = 300;
    ctx.fillStyle = '#ff3333';
    for (const m of monsters) {
        if (m.alive && dist(player.x, player.y, m.x, m.y) < visionRange) {
            ctx.fillRect(mmX + m.x * mmScale - 1.5, mmY + m.y * mmScale - 1.5, 3, 3);
        }
    }

    // Stairs on minimap - only if explored
    const stairsExplored = dungeon.explored[dungeon.idx(dungeon.stairsX, dungeon.stairsY)];
    if (stairsExplored) {
        ctx.fillStyle = '#aa88ff';
        ctx.fillRect(mmX + dungeon.stairsX * TILE * mmScale - 2, mmY + dungeon.stairsY * TILE * mmScale - 2, 5, 5);
    }

    // Fog-of-war edge softening (radial gradient from player position)
    const mmPx = mmX + player.x * mmScale;
    const mmPy = mmY + player.y * mmScale;
    const fowR = mmSize * 0.55;
    ctx.save();
    ctx.beginPath();
    ctx.rect(mmX, mmY, mmSize, mmSize);
    ctx.clip();
    const fowG = ctx.createRadialGradient(mmPx, mmPy, fowR * 0.4, mmPx, mmPy, fowR);
    fowG.addColorStop(0, 'rgba(0,0,0,0)');
    fowG.addColorStop(0.7, 'rgba(0,0,0,0.3)');
    fowG.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = fowG;
    ctx.fillRect(mmX, mmY, mmSize, mmSize);
    ctx.restore();

    // Enhanced border overlay
    ctx.strokeStyle = '#2a1808';
    ctx.lineWidth = 2;
    ctx.strokeRect(mmX - 1, mmY - 1, mmSize + 2, mmSize + 2);

    // Floor label
    ctx.fillStyle = '#daa520';
    ctx.font = `bold 14px ${FONT_UI}`;
    ctx.textAlign = 'right';
    ctx.fillText(G.inTown ? '町' : `${G.actFloor}F`, mmX - 5, mmY + 16);

    // Area name (D2-style area system)
    if (!G.inTown) {
        const currentArea = getCurrentArea(G.act, G.actFloor);
        if (currentArea) {
            ctx.font = `10px ${FONT_UI}`;
            ctx.fillStyle = '#b8a070';
            ctx.fillText(currentArea.name, mmX - 5, mmY + 28);
        }
    }

    ctx.font = `11px ${FONT_UI}`;
    ctx.fillStyle = '#cc6666';
    ctx.fillText(`敵: ${aliveMonsterCount}`, mmX - 5, mmY + G.inTown ? 32 : 42);

    // Auto-pickup indicator
    if (G.autoPickup) {
        ctx.font = `9px ${FONT_UI}`;
        ctx.fillStyle = '#88ff44';
        ctx.textAlign = 'right';
        ctx.fillText('AUTO拾い:ON', mmX - 5, mmY + 46);
    }

    // Stairs hint
    if (aliveMonsterCount === 0) {
        ctx.fillStyle = '#aaaaff';
        ctx.font = `12px ${FONT_UI}`;
        ctx.textAlign = 'center';
        ctx.fillText('階段へ進め！', W / 2, 30);
    }

    if (SETTINGS.showFPS) {
        ctx.fillStyle = '#c8b18a';
        ctx.font = `10px ${FONT_UI}`;
        ctx.textAlign = 'right';
        ctx.fillText(`FPS ${fps.toFixed(0)}`, mmX - 6, 14);
    }

    // Mercenary HUD (below minimap)
    if (mercenary) {
        const mx = W - 170, my = 110;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = 'rgba(10,8,5,0.8)';
        ctx.fillRect(mx, my, 160, 32);
        ctx.strokeStyle = mercenary.def.color; ctx.lineWidth = 1;
        ctx.strokeRect(mx, my, 160, 32);
        ctx.globalAlpha = 1;
        ctx.font = `bold 10px ${FONT_UI}`;
        ctx.textAlign = 'left';
        ctx.fillStyle = mercenary.def.color;
        ctx.fillText(`${mercenary.def.icon} ${mercenary.name} Lv.${mercenary.level}`, mx + 4, my + 12);
        if (mercenary.alive) {
            const bx = mx + 4, by = my + 18, bw = 152, bh = 8;
            ctx.fillStyle = '#1a1a1a'; ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = (mercenary.hp / mercenary.maxHP > 0.3) ? '#00aa44' : '#dd3300';
            ctx.fillRect(bx, by, bw * (mercenary.hp / mercenary.maxHP), bh);
            ctx.font = `9px ${FONT_UI}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
            ctx.fillText(`${mercenary.hp}/${mercenary.maxHP}`, bx + bw / 2, by + 7);
        } else {
            ctx.font = `9px ${FONT_UI}`; ctx.fillStyle = '#ff4444'; ctx.textAlign = 'center';
            ctx.fillText('☠ 倒れている（町で復活）', mx + 80, my + 24);
        }
        ctx.textAlign = 'left';
    }

}

function drawShortcutHints() {
    ctx.globalAlpha = 0.6;
    ctx.font = `10px ${FONT_UI}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const shortcuts = G.inTown ? [
        ['矢印', '移動'], ['E', 'NPC/階段'], ['Q', 'HP薬'], ['W', 'MP薬'],
        ['I', '装備'], ['C', 'キャラ'], ['T', 'ツリー'], ['H', '手引書'],
        ['TAB', 'マップ'], ['F5', 'セーブ'], ['F8', 'ロード']
    ] : [
        ['矢印', '移動'], ['A/Click', '攻撃'], ['S/RClick', 'スキル'],
        ['Q', 'HP薬'], ['W', 'MP薬'], ['1-6', 'スキル選択'], ['Space', '拾う'],
        ['E', '階段'], ['V', '帰還'], ['R', 'S編集'], ['TAB', 'マップ'],
        ['I', '装備'], ['C', 'キャラ'], ['T', 'ツリー'], ['H', '手引書'], ['Esc', '一時停止']
    ];
    let scX = 8;
    let scY = 14;
    const maxW = W - 16;
    for (const [key, desc] of shortcuts) {
        const kw = ctx.measureText(key).width;
        const dw = ctx.measureText(desc).width;
        const totalW = kw + dw + 8;
        if (scX + totalW > maxW) { scX = 8; scY += 16; }
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(scX - 2, scY - 10, totalW + 4, 14);
        ctx.fillStyle = '#c8a84e';
        ctx.fillText(key, scX, scY);
        ctx.fillStyle = '#998866';
        ctx.fillText(desc, scX + kw + 4, scY);
        scX += totalW + 8;
    }
    ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
    for (const ft of floatingTexts) {
        const elapsed = ft.maxLife - ft.life;
        const sp = worldToScreen(ft.x, ft.y);
        const sx = sp.x + Math.sin(elapsed * 4 + ft.x * 0.1) * 3;
        const sy = sp.y + ft.vy * elapsed;
        const a = clamp(ft.life / ft.maxLife, 0, 1);
        // Critical: scale-down animation (start big, shrink)
        let fontSize = ft.big ? 24 : 16;
        if (ft.big && elapsed < 0.15) {
            fontSize = 40 - elapsed * (40 - 24) / 0.15;
        }
        ctx.globalAlpha = a;
        ctx.font = `bold ${Math.round(fontSize)}px ${FONT_UI}`;
        ctx.textAlign = 'center';
        // Black outline stroke
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeText(ft.text, sx, sy);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, sx, sy);
        ctx.globalAlpha = 1;
    }
}

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
    const sd = dist(player.x, player.y, dungeon.stairsX * TILE + TILE / 2, dungeon.stairsY * TILE + TILE / 2);
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
    const stairCX = dungeon.stairsX * TILE + TILE / 2;
    const stairCY = dungeon.stairsY * TILE + TILE / 2;
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
                    const stairCX = dungeon.stairsX * TILE + TILE / 2;
                    const stairCY = dungeon.stairsY * TILE + TILE / 2;
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
        const rarityOrder = ['normal', 'common', 'magic', 'rare', 'legendary', 'unique', 'runeword'];
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
                const dirHash = npc.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
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
                if (drawHiResSpr(npc.hiresClass, npcAnim, npcDir, G.time * npcTimeScale, nx - npcHiSize / 2, hiDy, npcHiSize, npcHiSize)) {
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
                if (drawSpr(npc.sprite, nx - npcSprSize / 2, ny - npcSprSize + 4 + bob, npcSprSize, npcSprSize, false, true)) {
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
                ? ny + bob + TILE / 2 - npcHiSize * 0.75 - 4
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
        const portalWX = r0.cx * TILE + TILE / 2 + 60;
        const portalWY = r0.cy * TILE + TILE / 2;
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
        ctx.fillRect(W / 2 - 80, H / 2 + 60, 160, 14);
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(W / 2 - 78, H / 2 + 62, 156 * prog, 10);
        ctx.font = `bold 14px ${FONT_UI}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaccff';
        ctx.fillText('帰還中...', W / 2, H / 2 + 55);
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
        ctx.fillText(G.actTransitionText || '', W / 2, H / 2 - 20);
        ctx.font = `18px ${FONT_UI}`;
        ctx.fillStyle = '#aaa';
        ctx.fillText(G.actTransitionText2 || '', W / 2, H / 2 + 20);
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
