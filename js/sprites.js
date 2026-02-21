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
        } catch(e) { console.warn('Sprite texture override deferred:', e); }
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
    wallTop:['tiles',0,64], wallSide1:['tiles',32,64], wallSide2:['tiles',64,64],
    deepWall:['tiles',0,96], catWallSide:['tiles',32,160],
    floorBlank:['tiles',0,192], floor1:['tiles',32,192],
    floor2:['tiles',64,192], floor3:['tiles',96,192],
    stairsDown:['tiles',224,512], chestClosed:['tiles',0,544], chestOpen:['tiles',32,544],
    blood1:['tiles',0,704], blood2:['tiles',32,704],
    corpse1:['tiles',0,672], corpse2:['tiles',32,672],
    // monsters.png (384x416, 32px grid)
    skeleton:['monsters',0,128], skelArcher:['monsters',32,128],
    lich:['monsters',64,128], deathKnight:['monsters',96,128],
    zombie:['monsters',128,128], ghoul:['monsters',160,128],
    banshee:['monsters',0,160], wraith:['monsters',64,160],
    imp:['monsters',32,352], minotaur:['monsters',224,224],
    // rogues.png (224x224, 32px grid)
    knight:['rogues',0,32], fighter:['rogues',32,32],
    ranger:['rogues',64,0], rogueChar:['rogues',96,0],
    wizardF:['rogues',0,128], wizardM:['rogues',32,128],
    // items.png (352x832, 32px grid)
    iSword:['items',96,0], iAxe:['items',32,96], iStaff:['items',0,320],
    iShield:['items',32,352], iHelmet:['items',128,480], iArmor:['items',96,384],
    iRing:['items',0,544], iAmulet:['items',0,512], iBoots:['items',32,448],
    iPotion:['items',32,608], iGold:['items',0,768],
    // animated-tiles.png torch lit frames (row 5, y=160)
    torch0:['animTiles',0,160], torch1:['animTiles',32,160],
    torch2:['animTiles',64,160], torch3:['animTiles',96,160],
    torch4:['animTiles',128,160], torch5:['animTiles',160,160],
    // === Promoted class sprites (rogues.png) ===
    paladin:['rogues',128,32],    // shield knight
    berserker:['rogues',0,96],    // male barbarian
    assassin:['rogues',128,0],    // bandit
    rangerCls:['rogues',64,0],    // ranger
    pyromancer:['rogues',0,128],  // female wizard
    cryomancer:['rogues',64,128], // druid (ice-themed)
    monk:['rogues',0,64],         // monk
    templar:['rogues',128,64],    // templar
    warlock:['rogues',160,128],   // warlock (6th col row5)
    fencer:['rogues',128,96],     // fencer
    priest:['rogues',32,64],      // priest
    // === Town NPC sprites (rogues.png rows 6-7) ===
    npcFarmerWheat:['rogues',0,160],   // farmer (wheat thresher)
    npcFarmerScythe:['rogues',32,160], // farmer (scythe)
    npcFarmerFork:['rogues',64,160],   // farmer (pitchfork)
    npcBaker:['rogues',96,160],        // baker
    npcBlacksmith:['rogues',128,160],  // blacksmith
    npcScholar:['rogues',160,160],     // scholar
    npcPeasant1:['rogues',0,192],      // peasant / coalburner
    npcPeasant2:['rogues',32,192],     // peasant
    npcShopkeep:['rogues',64,192],     // shopkeep
    npcElderlyW:['rogues',96,192],     // elderly woman
    npcElderlyM:['rogues',128,192],    // elderly man
    npcDesertSage:['rogues',96,128],   // desert sage
    npcWarClericF:['rogues',64,64],    // female war cleric
    npcWarClericM:['rogues',96,64],    // male war cleric
};

// --- Hi-Res Animated Sprite System (FLARE-based 8-dir multi-frame) ---
const HIRES_SPRITES = {};
let hiresSpritesLoaded = false;
const HIRES_SP = 128; // pixel size per cell
const HIRES_DIR_ORDER = ['S','SW','W','NW','N','NE','E','SE'];
// Class → sprite sheet prefix mapping
const HIRES_CLASS_MAP = {
    warrior: 'warrior', paladin: 'warrior', berserker: 'warrior',
    rogue: 'rogue', assassin: 'rogue', ranger: 'rogue',
    sorcerer: 'mage', pyromancer: 'mage', cryomancer: 'mage',
};
// Animation configs: frames per animation, fps
const HIRES_ANIM_CONFIG = {
    run:    { frames: 8, fps: 15 },
    stance: { frames: 4, fps: 5  },
    swing:  { frames: 4, fps: 10 },
    cast:   { frames: 4, fps: 10 },
    shoot:  { frames: 4, fps: 10 },
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
        const rareOverrides = { ring: 'icon_ring2', amulet: 'icon_necklace2', rune: 'icon_rune2',
            shield: 'icon_case', helmet: 'icon_case2', grandCharm: 'icon_crystal' };
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
    const dirAngles = [Math.PI/2, Math.PI*3/4, Math.PI, -Math.PI*3/4, -Math.PI/2, -Math.PI/4, 0, Math.PI/4];
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
        ctx.ellipse(dx + dw/2, dy + dh - 2, dw * 0.35, 3, 0, 0, Math.PI * 2);
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

