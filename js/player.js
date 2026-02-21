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

window.doPromotion = function(newClass) {
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
            <div style="display:flex;align-items:center;justify-content:center;width:20px;height:20px">${sk ? `<img src="${getSkillIconDataURL(sk,20)}" width="20" height="20">` : '□'}</div>
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
                <div style="display:flex;align-items:center;justify-content:center;width:18px;height:18px"><img src="${getSkillIconDataURL(sk,18)}" width="18" height="18"></div>
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
window.pickSlot = function(slot) {
    selectOrSwapSkillSlot(slot);
};

	    window.assignSkill = function(skillId) {
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

window.removeSkillSlot = function(slot) {
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
window.removeSkillById = function(skillId) {
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
window.beginTreeSwap = function(skillId) {
    const slot = findSlotBySkillId(skillId);
    if (!slot) {
        addLog('このスキルはショートカットにありません', '#ffaa44');
        return;
    }
    treeSwapFromSlot = slot;
    updateSkillTreeUI();
};
window.cancelTreeSwap = function() {
    treeSwapFromSlot = 0;
    treeSwapFromSkillId = '';
    updateSkillTreeUI();
};
window.treeSwapTo = function(targetSlot) {
    if (!treeSwapFromSlot || treeSwapFromSlot === targetSlot) return;
    swapSkillSlots(treeSwapFromSlot, targetSlot);
    treeSwapFromSlot = 0;
    updateSkillTreeUI();
    addLog('ショートカットを入れ替えました', '#66ff66');
};
window.treeSwapWithSkill = undefined;

window.closeSkillSelect = function() {
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
window.setSkillEditMode = function(mode) {
    skillEditMode = mode === 'swap' ? 'swap' : 'assign';
    skillSwapFrom = 0;
    showSkillSelectUI();
};
window.beginSwap = function(slot) {
    skillEditMode = 'swap';
    skillSwapFrom = slot;
    skillSelectSlot = slot;
    showSkillSelectUI();
};
window.forceSwapSlots = function(targetSlot) {
    if (!skillSwapFrom || skillSwapFrom === targetSlot) return;
    swapSkillSlots(skillSwapFrom, targetSlot);
    skillSwapFrom = 0;
    skillSelectSlot = targetSlot;
    showSkillSelectUI();
};
	    window.quickAssignSkill = function(skillId) {
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
window.onSkillSlotDragStart = function(e, slot) {
    if (!e || !e.dataTransfer) return;
    e.dataTransfer.setData('text/plain', String(slot));
    e.dataTransfer.effectAllowed = 'move';
};
window.onSkillSlotDragOver = function(e) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
};
window.onSkillSlotDrop = function(e, slot) {
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
            ? `Lv.${meta.level} / ${meta.act ? 'ACT' + meta.act : 'B' + meta.floor + 'F'}${meta.cycle ? ' (' + (meta.cycle+1) + '周目)' : ''} / ${meta.className}`
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

window.startNewGame = function(slot) {
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
    passiveBonuses: { critChance:0, damagePercent:0, defensePercent:0, attackSpeed:0, moveSpeed:0, manaRegen:0, maxHP:0, maxMP:0, lifeSteal:0, dodgeChance:0 },

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
                addLog(`狂戦士モード！(${Math.round(dur*10)/10}秒)`, '#ff4400');
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
                addLog(`鉄壁発動！(${Math.round(dur*10)/10}秒)`, '#aaaaff');
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
                addLog(`回避モード！(${Math.round(dur*10)/10}秒)`, '#aaffaa');
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
                addLog(`マナシールド発動！(${Math.round(dur*10)/10}秒)`, '#4488ff');
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
                addLog(`見切り発動！(${Math.round(dur*10)/10}秒)`, '#ffcc44');
                break;
            }
            case 'buff_speed': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.speedBuffT = dur;
                this.speedBuffBonus = getSkillValue(skDef, 'bonus', lvl);
                playSound(600, 'sine', 0.12, 0.05);
                emitParticles(this.x, this.y, '#88ffaa', 10, 50, 0.4, 2, -30, 'arcane', lvl);
                addLog(`移動速度UP！(${Math.round(dur*10)/10}秒)`, '#88ffaa');
                break;
            }
            case 'buff_poison': {
                const dur = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                this.poisonBuffT = dur;
                this.poisonDps = getSkillValue(skDef, 'dps', lvl) * (1 + synDmg);
                playSound(300, 'sawtooth', 0.1, 0.06);
                emitParticles(this.x, this.y, '#88ff44', 10, 40, 0.4, 2, -30, 'nature', lvl);
                addLog(`毒塗り！攻撃に毒付与(${Math.round(dur*10)/10}秒)`, '#88ff44');
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
                addLog(`攻撃速度UP！(${Math.round(dur*10)/10}秒)`, '#ffaa88');
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
                addLog(`フレンジー！(${Math.round(dur*10)/10}秒)`, '#ff6644');
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
                addLog(`血の刃！(${Math.round(dur*10)/10}秒)`, '#ff4466');
                break;
            }
            case 'buff_undying': {
                this.undyingT = getSkillValue(skDef, 'duration', lvl) * (1 + synDur);
                playSound(200, 'square', 0.15, 0.1);
                emitParticles(this.x, this.y, '#ffd700', 20, 60, 0.8, 4, -40, 'holy', lvl);
                addLog(`不死身発動！(${Math.round(this.undyingT*10)/10}秒)`, '#ffd700');
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
                addLog(`鷹の目！クリティカル率+${Math.round(this.critBuffBonus)}%(${Math.round(dur*10)/10}秒)`, '#ffdd44');
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
                addLog(`守護のオーラ発動！(${Math.round(dur*10)/10}秒)`, '#ffdd88');
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
                emitParticles(G.meteorX + randf(-50,50), G.meteorY + randf(-50,50), '#ff4400', 1, 10, 0.3, 2, -20);
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
        const barX = sx - barW/2;
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
            if (!drawHiResSpr(classKey, animName, dirIdx, G.time, -hiDrawSize/2, hiDy, hiDrawSize, hiDrawSize)) {
                // Fallback: pixel art sprite
                if (!drawSpr(spriteKey, -drawSize/2, -drawSize + gy, drawSize, drawSize, flipX)) {
                    ctx.fillStyle = '#888'; ctx.fillRect(-drawSize/4, -drawSize/4, drawSize/2, drawSize/2);
                }
            }
        } else {
            // Fallback: original pixel art sprite
            if (!drawSpr(spriteKey, -drawSize/2, -drawSize + gy, drawSize, drawSize, flipX)) {
                ctx.fillStyle = '#888'; ctx.fillRect(-drawSize/4, -drawSize/4, drawSize/2, drawSize/2);
            }
        }
        ctx.restore();

        // Attack slash arc effect (8-dir aware when using hi-res sprites)
        if (this.attacking) {
            const atkPhase = clamp(this.attackTimer * 4, 0, 1);
            // dirAngles: S=π/2, SW=3π/4, W=π, NW=-3π/4, N=-π/2, NE=-π/4, E=0, SE=π/4
            const dirAngles8 = [Math.PI/2, Math.PI*3/4, Math.PI, -Math.PI*3/4, -Math.PI/2, -Math.PI/4, 0, Math.PI/4];
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
            const colors = {paladin:'#ffd700',berserker:'#ff4400',assassin:'#8800ff',ranger:'#44ff44',pyromancer:'#ff6600',cryomancer:'#44ccff'};
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
        if (!drawSpr('knight', -TILE/2, -TILE/2, TILE, TILE, flipX)) {
            ctx.fillStyle = '#888'; ctx.fillRect(-TILE/4, -TILE/4, TILE/2, TILE/2);
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
        if (!drawSpr('rogueChar', -TILE/2, -TILE/2, TILE, TILE, flipX)) {
            ctx.fillStyle = '#6a6'; ctx.fillRect(-TILE/4, -TILE/4, TILE/2, TILE/2);
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
        if (!drawSpr('wizardM', -TILE/2, -TILE/2, TILE, TILE, flipX)) {
            ctx.fillStyle = '#66a'; ctx.fillRect(-TILE/4, -TILE/4, TILE/2, TILE/2);
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
    rogue:     { name:'Rogue',     nameJP:'弓兵',   baseHP:120, baseStr:10, baseDex:18, baseInt:8,  baseDef:8,  attackType:'ranged', attackRange:180, baseSpeed:160, icon:'🏹', color:'#c98b6b', hpPerLevel:12, dmgPerLevel:2, defPerLevel:1.2, hireCost:400, reviveCostBase:200 },
    fighter:   { name:'Fighter',   nameJP:'戦士',   baseHP:220, baseStr:18, baseDex:8,  baseInt:6,  baseDef:18, attackType:'melee',  attackRange:45,  baseSpeed:140, icon:'🛡', color:'#6c8aa6', hpPerLevel:20, dmgPerLevel:3, defPerLevel:2.0, hireCost:600, reviveCostBase:300 },
    mage:      { name:'Mage',      nameJP:'魔法使い', baseHP:90,  baseStr:6,  baseDex:10, baseInt:22, baseDef:6,  attackType:'magic',  attackRange:160, baseSpeed:150, icon:'🧙', color:'#9a6bd6', hpPerLevel:9,  dmgPerLevel:4, defPerLevel:0.8, hireCost:700, reviveCostBase:350 },
    priestess: { name:'Priestess', nameJP:'聖女',   baseHP:140, baseStr:8,  baseDex:12, baseInt:18, baseDef:10, attackType:'magic',  attackRange:120, baseSpeed:150, icon:'✨', color:'#e6c36a', hpPerLevel:13, dmgPerLevel:2, defPerLevel:1.1, hireCost:650, reviveCostBase:325 }
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

