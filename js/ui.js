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
        <div class="stat-row"><span class="stat-label">難易度</span><span class="stat-value" style="color:${DIFFICULTY_DEFS[G.difficulty||'normal'].color}">${DIFFICULTY_DEFS[G.difficulty||'normal'].name}</span></div>
        <div class="stat-row"><span class="stat-label">現在地</span><span class="stat-value" style="color:${G.inUber ? '#ff4400' : '#aa88ff'}">${G.inUber ? 'パンデモニウム' : 'ACT' + G.act + ' ' + (G.inTown ? '町' : '第' + G.actFloor + '層')}${G.cycle > 0 ? ' (' + (G.cycle+1) + '周目)' : ''}</span></div>
        <div class="stat-row"><span class="stat-label">ゴールド</span><span class="stat-value" style="color:#ffd700">${G.gold}G</span></div>
        <div class="stat-row"><span class="stat-label">残り敵数</span><span class="stat-value" style="color:#ff6666">${monsters.reduce((n,m)=>n+(m.alive?1:0),0)}</span></div>
        <div class="stat-row"><span class="stat-label">装備品</span><span class="stat-value">${player.inventory.length}/${player.maxInv}</span></div>
        <div class="stat-row"><span class="stat-label">ポーション</span><span class="stat-value">${player.potionInv.length}/${player.maxPotionInv}</span></div>
        <div class="stat-row"><span class="stat-label">チャーム</span><span class="stat-value">${player.charmInv.length}/${player.maxCharmInv}</span></div>
        <div class="stat-row"><span class="stat-label">総キル数</span><span class="stat-value" style="color:#ff6666">${G.totalKills || 0}</span></div>
    `;
}

let helpActiveTab = 'basics';
window.setHelpTab = function(tab) { helpActiveTab = tab; renderHelpUI(); };

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
                h += `<div style="margin:2px 0;color:#ccc;font-size:11px;display:flex;align-items:center;gap:4px"><span class="help-key">${i}</span> <img src="${getSkillIconDataURL(sk,18)}" width="18" height="18" style="vertical-align:middle"> ${sk.name} Lv.${lvl} <span style="color:#4488ff">${sk.mp}MP</span></div>`;
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

window.allocStat = function(stat) {
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
window.switchInvTab = function(t) { player.invTab = t; window._selectedInvIdx = -1; updateInventoryPanel(); };
window.unequipSlot = function(slot) { player.unequipSlot(slot); updateInventoryPanel(); };
window.selectInvItem = function(i) {
    window._selectedInvIdx = (window._selectedInvIdx === i) ? -1 : i;
    updateInventoryPanel();
};
window.equipInvItem = function(i) {
    window._selectedInvIdx = -1;
    player.equipItem(i);
    updateInventoryPanel();
};
window.showInvContextMenu = function(e, i) {
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
window.closeInvContextMenu = function() {
    const m = document.getElementById('inv-context-menu');
    if (m) m.remove();
};
window.confirmDropInvItem = function(i) {
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

window.sortInventory = function(mode) {
    const rarityOrder = ['common','magic','rare','legendary','unique','runeword'];
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
window.showPotionTooltip = function(e, i) {
    const item = player.potionInv[i];
    if (!item) return;
    const tt = DOM.tooltip;
    tt.innerHTML = buildTooltipHTML(item, false);
    tt.style.display = 'block';
    tt.style.left = (e.clientX + 15) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
};
window.showPotionContextMenu = function(e, i) {
    e.preventDefault();
    closeInvContextMenu();
    const item = player.potionInv[i];
    if (!item) return;
    const menu = document.createElement('div');
    menu.className = 'inv-context-menu';
    menu.id = 'inv-context-menu';
    let menuHTML = `<div style="color:#ffd700;font-size:11px;padding:4px 14px;cursor:default">${escapeHtml(item.name)}${(item.qty||1)>1?' x'+item.qty:''}</div>`;
    const sellPrice = calculateSellPrice(item);
    menuHTML += `<div onclick="sellPotionItem(${i})" style="color:#ffd700">売却 (+${sellPrice * (item.qty||1)}G)</div>`;
    if ((item.qty||1) > 1) menuHTML += `<div onclick="dropOnePotionTab(${i})">1つ捨てる</div>`;
    menuHTML += `<div onclick="dropPotionItem(${i})">全て捨てる</div>`;
    menuHTML += `<div onclick="closeInvContextMenu()">キャンセル</div>`;
    menu.innerHTML = menuHTML;
    menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px';
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', closeInvContextMenu, { once: true }), 0);
};
window.sellPotionItem = function(i) {
    closeInvContextMenu();
    const item = player.potionInv[i];
    if (!item) return;
    const price = calculateSellPrice(item) * (item.qty || 1);
    G.gold += price;
    addLog(`${item.name} を売却 (+${price}G)`, '#ffd700');
    player.potionInv.splice(i, 1);
    updateInventoryPanel();
};
window.dropOnePotionTab = function(i) {
    closeInvContextMenu();
    const item = player.potionInv[i];
    if (!item || !isPotion(item)) return;
    dropItem(player.x, player.y, generatePotion(item.typeKey));
    item.qty = (item.qty || 1) - 1;
    if (item.qty <= 0) player.potionInv.splice(i, 1);
    addLog(`${item.name} を1つ捨てた`, '#888');
    updateInventoryPanel();
};
window.dropPotionItem = function(i) {
    closeInvContextMenu();
    const item = player.potionInv[i];
    if (!item) return;
    dropItem(player.x, player.y, item);
    player.potionInv.splice(i, 1);
    addLog(`${item.name} を捨てた`, '#888');
    updateInventoryPanel();
};
// Charm tab tooltip & context menu
window.showCharmTooltip = function(e, i) {
    const item = player.charmInv[i];
    if (!item) return;
    const tt = DOM.tooltip;
    tt.innerHTML = buildTooltipHTML(item, false);
    tt.style.display = 'block';
    tt.style.left = (e.clientX + 15) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
};
window.showCharmContextMenu = function(e, i) {
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
window.sellCharmItem = function(i) {
    closeInvContextMenu();
    const item = player.charmInv[i];
    if (!item) return;
    G.gold += calculateSellPrice(item);
    addLog(`${item.name} を売却 (+${calculateSellPrice(item)}G)`, '#ffd700');
    player.charmInv.splice(i, 1);
    player.recalcStats();
    updateInventoryPanel();
};
window.dropCharmItem = function(i) {
    closeInvContextMenu();
    const item = player.charmInv[i];
    if (!item) return;
    dropItem(player.x, player.y, item);
    player.charmInv.splice(i, 1);
    player.recalcStats();
    addLog(`${item.name} を捨てた`, '#888');
    updateInventoryPanel();
};

window.dropOnePotionInv = function(i) {
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
window.sellInvItem = function(i) {
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
    const statKeys = ['str','dex','vit','int','dmgPct','hp','mp','lifesteal','atkSpd','def','critChance','moveSpd'];
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
        const statNames = {str:'筋力',dex:'敏捷',vit:'体力',int:'知力',dmgPct:'% ダメージ',hp:'HP',mp:'MP',lifesteal:'% ライフスティール',atkSpd:'% 攻撃速度',def:'防御',critChance:'% クリティカル率',critDmg:'% クリティカルダメージ',moveSpd:'% 移動速度',fireRes:'% 火炎耐性',coldRes:'% 冷気耐性',lightRes:'% 雷耐性',poisonRes:'% 毒耐性',allRes:'% 全耐性',blockChance:'% ブロック率',magicFind:'% MF',skillBonus:' 全スキル'};
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
        const statNames = {critChance:'クリティカル率',damagePercent:'ダメージ',defensePercent:'防御力',attackSpeed:'攻撃速度',moveSpeed:'移動速度',manaRegen:'マナ回復',maxHP:'最大HP',maxMP:'最大MP',lifeSteal:'ライフスティール',dodgeChance:'回避率'};
        return `パッシブ: ${statNames[pe.stat]||pe.stat} +${pe.baseBonus}/Lv (Lv20で+${(pe.baseBonus + pe.perLevel * 19).toFixed(0)})`;
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
    const name = `<img src="${getSkillIconDataURL(sk,20)}" width="20" height="20" style="vertical-align:middle"> ${sk.name || ''}`.trim();
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
        const statNames = {critChance:'クリティカル率',damagePercent:'ダメージ%',defensePercent:'防御力%',attackSpeed:'攻撃速度',moveSpeed:'移動速度',manaRegen:'マナ回復/秒',maxHP:'最大HP',maxMP:'最大MP',lifeSteal:'ライフスティール%',dodgeChance:'回避率%'};
        const curVal = lvl > 0 ? (pe.baseBonus + pe.perLevel * (lvl - 1)).toFixed(1) : pe.baseBonus.toFixed(1);
        const nextVal = lvl < SKILL_MAX_LEVEL ? (pe.baseBonus + pe.perLevel * lvl).toFixed(1) : '-';
        passiveInfo = `<div style="color:#88ccff;margin-top:4px;font-size:10px">
            ${statNames[pe.stat]||pe.stat}: +${curVal}${lvl < SKILL_MAX_LEVEL ? ` → 次: +${nextVal}` : ' (最大)'}
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
            const fromName = allAvail.find(s=>s.id===syn.from)?.name || syn.from;
            const curBonus = Math.round(fromLvl * syn.bonus * 100);
            const typeNames = {damage:'ダメージ',duration:'持続',range:'範囲',freeze:'凍結',heal:'回復'};
            synergyInfo += `<div style="color:#aaffaa;font-size:9px">+${Math.round(syn.bonus*100)}% ${typeNames[syn.type]||syn.type}/${fromName}のポイント (現在: +${curBonus}%)</div>`;
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

window.showInvTooltip = function(e, i) {
    const item = player.inventory[i];
    if (!item) return;
    const tt = DOM.tooltip;
    tt.innerHTML = buildTooltipHTML(item, true);
    tt.style.display = 'block';
    tt.style.left = (e.clientX + 15) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
};
window.showStashTooltip = function(e, i) {
    const item = G.stash[i];
    if (!item) return;
    const tt = DOM.tooltip;
    tt.innerHTML = buildTooltipHTML(item, false);
    tt.style.display = 'block';
    tt.style.left = (e.clientX + 15) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
};
window.showEquipTooltip = function(e, slot) {
    const item = player.equipment[slot];
    if (!item) return;
    const tt = DOM.tooltip;
    tt.innerHTML = buildTooltipHTML(item);
    tt.style.display = 'block';
    tt.style.left = (e.clientX + 15) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
};
window.showSkillTooltip = function(e, skillId) {
    const allAvail = getAllAvailableSkills();
    const sk = allAvail.find(s => s.id === skillId);
    if (!sk) return;
    const tt = DOM.tooltip;
    tt.innerHTML = buildSkillTooltipHTML(sk);
    tt.style.display = 'block';
    tt.style.left = (e.clientX + 15) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
};
window.hideTooltip = function() { DOM.tooltip.style.display = 'none'; };

window.toggleSkillTreeView = function() {
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
            ${[1,2,3,4,5,6].map(n => {
                const sk = player.skills[n];
                const label = sk ? `${n}:<img src="${getSkillIconDataURL(sk,18)}" width="18" height="18" style="vertical-align:middle"> ${sk.name || ''}` : `${n}:空`;
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
                const names = prereqs.map(pid => allAvail.find(s=>s.id===pid)?.name || pid).join(', ');
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
                const statNames = {critChance:'クリティカル率',damagePercent:'ダメージ',defensePercent:'防御力',attackSpeed:'攻撃速度',moveSpeed:'移動速度',manaRegen:'マナ回復',maxHP:'最大HP',maxMP:'最大MP',lifeSteal:'ライフスティール',dodgeChance:'回避率'};
                passiveInfo = `<div style="color:#88ccff;font-size:9px">効果: ${statNames[pe.stat]||pe.stat} +${curVal}</div>`;
            }

            let synergyInfo = '';
            if (sk.synergies && sk.synergies.length > 0) {
                const synParts = sk.synergies.map(syn => {
                    const fromLvl = player.skillLevels[syn.from] || 0;
                    const fromName = allAvail.find(s=>s.id===syn.from)?.name || syn.from;
                    const curBonus = Math.round(fromLvl * syn.bonus * 100);
                    return `+${Math.round(syn.bonus*100)}%/${fromName} (現在:+${curBonus}%)`;
                });
                synergyInfo = `<div style="color:#aaffaa;font-size:8px;margin-top:2px">シナジー: ${synParts.join(', ')}</div>`;
            }

            const mpDisplay = isPassive ? '' : `MP:${lvl > 0 ? getSkillMPCost(sk, lvl) : sk.mp}`;
            const cdDisplay = isPassive ? '' : `CD:${lvl > 0 ? getSkillCooldown(sk, lvl).toFixed(1) : sk.cd}s`;
            const mpCdHtml = isPassive ? '' : `<div style="color:#4488ff;font-size:9px;margin-top:2px">${mpDisplay} ${cdDisplay}</div>`;

            h += '<div class="skill-node ' + stateClass + '" onmouseenter="showSkillTooltip(event,\'' + sk.id + '\')" onmouseleave="hideTooltip()">' +
                '<div class="sn-icon">' + (isPassive ? '◆' : '') + '<img src="' + getSkillIconDataURL(sk,20) + '" width="20" height="20">' + '</div>' +
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
                    `<div class="snt-icon">${isPassive ? '◆' : ''}<img src="${getSkillIconDataURL(sk,28)}" width="28" height="28"></div>` +
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
window.onTreeNodeHover = function(e, skillId, treeId) {
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

window.onTreeNodeLeave = function(treeId) {
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
window.onTreeNodeClick = function(e, skillId) {
    e.preventDefault();
    learnSkill(skillId);
};

window.onTreeNodeRightClick = function(e, skillId) {
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

window.learnSkill = function(skillId) {
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
            ? `Lv.${meta.level} / ${meta.act ? 'ACT' + meta.act : 'B' + meta.floor + 'F'}${meta.cycle ? ' (' + (meta.cycle+1) + '周目)' : ''} / ${meta.className}`
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

window.toggleSetting = function(key) {
    if (!(key in SETTINGS)) return;
    if (key === 'sound') {
        setSoundEnabled(!SETTINGS.sound);
    } else {
        SETTINGS[key] = !SETTINGS[key];
        saveSettings();
    }
    renderSettingsUI();
};
window.toggleAutoPickup = function() {
    G.autoPickup = !G.autoPickup;
    addLog(G.autoPickup ? '自動拾い: ON' : '自動拾い: OFF', '#ffdd44');
    renderSettingsUI();
};
function getPickupFilterLabel() {
    const names = ['ノーマル以上','マジック以上','レア以上','レジェンダリー以上'];
    const rarities = ['normal','magic','rare','legendary'];
    const idx = rarities.indexOf(G.autoPickupRarity);
    return names[idx] || names[0];
}
window.cyclePickupFilter = function() {
    const rarities = ['normal','magic','rare','legendary'];
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
    if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();

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

    // --- Death screen keyboard ---
    if (G.dead) {
        if (e.key === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            initAudio();
            G.dead = false;
            setPaused(false);
            // Reset buff timers on death
            player.berserkT = 0; player.shieldT = 0; player.manaShieldT = 0;
            player.dodgeT = 0; player.counterT = 0; player.stealthT = 0;
            player.critBuffT = 0; player.auraT = 0; player.speedBuffT = 0;
            player.poisonBuffT = 0; player.atkSpdBuffT = 0; player.lifestealBuffT = 0;
            player.undyingT = 0; player.freezeT = 0; player.meteorT = 0;
            if (player.battleOrdersHP > 0) {
                player.maxHP -= player.battleOrdersHP;
                player.maxMP -= player.battleOrdersMP;
            }
            player.battleOrdersT = 0; player.battleOrdersHP = 0; player.battleOrdersMP = 0;
            player.recalcStats();
            player.hp = player.maxHP;
            player.mp = player.maxMP;
            DOM.deathScreen.style.display = 'none';
            enterTown(G.act);
            addLog('町で復活した...', '#ffaaaa');
            return; // 復活処理後は即座にreturn
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

window.selectDifficulty = function(diff) {
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

window.selectClass = function(cls) {
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
    initAudio();
    G.dead = false;
    setPaused(false);
    // Reset buff timers on death
    player.berserkT = 0; player.shieldT = 0; player.manaShieldT = 0;
    player.dodgeT = 0; player.counterT = 0; player.stealthT = 0;
    player.critBuffT = 0; player.auraT = 0; player.speedBuffT = 0;
    player.poisonBuffT = 0; player.atkSpdBuffT = 0; player.lifestealBuffT = 0;
    player.undyingT = 0; player.freezeT = 0; player.meteorT = 0;
    if (player.battleOrdersHP > 0) {
        player.maxHP -= player.battleOrdersHP;
        player.maxMP -= player.battleOrdersMP;
    }
    player.battleOrdersT = 0; player.battleOrdersHP = 0; player.battleOrdersMP = 0;
    player.recalcStats();
    // Revive in current ACT's town
    player.hp = player.maxHP;
    player.mp = player.maxMP;
    DOM.deathScreen.style.display = 'none';
    enterTown(G.act);
    addLog('町で復活した...', '#ffaaaa');
});
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
        const d = Math.sqrt(dx*dx + dy*dy);
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
        const dmgVig = ctx.createRadialGradient(W/2, H/2, W*0.05, W/2, H/2, W*0.55);
        dmgVig.addColorStop(0, `rgba(120,0,0,0)`);
        dmgVig.addColorStop(0.4, `rgba(160,0,0,${redA * 0.3})`);
        dmgVig.addColorStop(0.7, `rgba(200,10,0,${redA * 0.6})`);
        dmgVig.addColorStop(1, `rgba(220,20,0,${redA})`);
        ctx.fillStyle = dmgVig;
        ctx.fillRect(0, 0, W, H);
    }
}

function drawGroundItems() {
    const TYPE_SPR = {sword:'iSword',axe:'iAxe',staff:'iStaff',shield:'iShield',helmet:'iHelmet',armor:'iArmor',ring:'iRing',amulet:'iAmulet',boots:'iBoots',potion:'iPotion',hp1:'iPotion',hp2:'iPotion',hp3:'iPotion',hp4:'iPotion',hp5:'iPotion',mp1:'iPotion',mp2:'iPotion',mp3:'iPotion',rejuv:'iPotion',fullrejuv:'iPotion',manaPotion:'iPotion',smallCharm:'iRing',mediumCharm:'iRing',grandCharm:'iRing'};
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
        ctx.strokeStyle = '#ffdd44'; ctx.lineWidth = Math.max(1.5, size/10); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-half*0.2, -half*0.8);
        ctx.lineTo(half*0.15, -half*0.2);
        ctx.lineTo(-half*0.1, -half*0.05);
        ctx.lineTo(half*0.25, half*0.7);
        ctx.stroke();
        ctx.strokeStyle = '#fff8cc'; ctx.lineWidth = Math.max(0.8, size/18);
        ctx.beginPath();
        ctx.moveTo(-half*0.15, -half*0.7);
        ctx.lineTo(half*0.1, -half*0.15);
        ctx.lineTo(-half*0.05, 0);
        ctx.lineTo(half*0.2, half*0.6);
        ctx.stroke();
    } else if (eff === 'frost_nova') {
        ctx.strokeStyle = '#88ddff'; ctx.lineWidth = Math.max(1.2, size/12);
        ctx.beginPath(); ctx.arc(0, 0, half*0.45, 0, Math.PI*2); ctx.stroke();
        for (let a = 0; a < 8; a++) {
            const ang = a * Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang)*half*0.45, Math.sin(ang)*half*0.45);
            ctx.lineTo(Math.cos(ang)*half*0.85, Math.sin(ang)*half*0.85);
            ctx.stroke();
        }
        ctx.fillStyle = '#ccf0ff'; ctx.beginPath(); ctx.arc(0, 0, half*0.15, 0, Math.PI*2); ctx.fill();
    } else if (eff === 'frozen_orb') {
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, half*0.4);
        grad.addColorStop(0, '#ddeeff'); grad.addColorStop(1, '#66aacc');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, half*0.4, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#aaeeff'; ctx.lineWidth = Math.max(1, size/14);
        for (let a = 0; a < 6; a++) {
            const ang = a * Math.PI / 3 + Math.PI/6;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang)*half*0.4, Math.sin(ang)*half*0.4);
            ctx.lineTo(Math.cos(ang)*half*0.8, Math.sin(ang)*half*0.8);
            ctx.stroke();
            ctx.fillStyle = '#ccf0ff';
            ctx.beginPath(); ctx.arc(Math.cos(ang)*half*0.8, Math.sin(ang)*half*0.8, Math.max(1,size/20), 0, Math.PI*2); ctx.fill();
        }
    } else if (eff === 'consecrate') {
        ctx.strokeStyle = '#ff8844'; ctx.lineWidth = Math.max(1.5, size/10);
        ctx.beginPath(); ctx.arc(0, 0, half*0.65, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = 'rgba(255,136,68,0.25)';
        ctx.beginPath(); ctx.arc(0, 0, half*0.6, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#ffaa66'; ctx.lineWidth = Math.max(1, size/14);
        ctx.beginPath(); ctx.moveTo(0, -half*0.35); ctx.lineTo(0, half*0.35); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-half*0.35, 0); ctx.lineTo(half*0.35, 0); ctx.stroke();
    } else if (eff === 'meteor') {
        ctx.fillStyle = '#ff6622';
        ctx.beginPath(); ctx.arc(half*0.1, half*0.15, half*0.35, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffcc44';
        ctx.beginPath(); ctx.arc(half*0.05, half*0.1, half*0.18, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,100,30,0.5)';
        ctx.beginPath();
        ctx.moveTo(-half*0.15, -half*0.05);
        ctx.lineTo(-half*0.6, -half*0.7);
        ctx.lineTo(-half*0.2, -half*0.5);
        ctx.lineTo(-half*0.35, -half*0.8);
        ctx.lineTo(half*0.05, -half*0.2);
        ctx.closePath(); ctx.fill();
    } else if (eff === 'teleport') {
        ctx.strokeStyle = '#66aaff'; ctx.lineWidth = Math.max(1.5, size/10); ctx.lineCap = 'round';
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
        ctx.fillStyle = '#aaccff'; ctx.beginPath(); ctx.arc(0, 0, half*0.12, 0, Math.PI*2); ctx.fill();
    } else if (eff === 'mana_shield') {
        ctx.strokeStyle = '#4488ff'; ctx.lineWidth = Math.max(1.5, size/10);
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
            const ang = a * Math.PI / 3 - Math.PI/6;
            const px = Math.cos(ang) * half * 0.65, py = Math.sin(ang) * half * 0.65;
            a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke();
        ctx.fillStyle = 'rgba(68,136,255,0.15)'; ctx.fill();
        ctx.fillStyle = 'rgba(100,170,255,0.3)';
        ctx.beginPath(); ctx.arc(0, 0, half*0.25, 0, Math.PI*2); ctx.fill();
    } else if (eff === 'holy_burst') {
        ctx.fillStyle = '#ffdd88';
        ctx.fillRect(-half*0.12, -half*0.7, half*0.24, half*1.4);
        ctx.fillRect(-half*0.7, -half*0.12, half*1.4, half*0.24);
        ctx.fillStyle = '#fff8dd';
        ctx.beginPath(); ctx.arc(0, 0, half*0.2, 0, Math.PI*2); ctx.fill();
    } else if (eff === 'multi_shot') {
        ctx.strokeStyle = '#ccaa66'; ctx.lineWidth = Math.max(1.2, size/12); ctx.lineCap = 'round';
        const angles = [-0.35, 0, 0.35];
        for (const da of angles) {
            const ang = -Math.PI/2 + da;
            ctx.beginPath();
            ctx.moveTo(0, half*0.3);
            ctx.lineTo(Math.cos(ang)*half*0.75, Math.sin(ang)*half*0.75 + half*0.1);
            ctx.stroke();
            ctx.fillStyle = '#aaaaaa';
            const tx = Math.cos(ang)*half*0.75, ty = Math.sin(ang)*half*0.75 + half*0.1;
            ctx.beginPath(); ctx.arc(tx, ty, Math.max(1.2, size/16), 0, Math.PI*2); ctx.fill();
        }
    } else if (eff === 'arrow_rain') {
        ctx.strokeStyle = '#ccaa66'; ctx.lineWidth = Math.max(1, size/14); ctx.lineCap = 'round';
        const arrows = [[-half*0.4, -half*0.3], [0, -half*0.6], [half*0.35, -half*0.15], [-half*0.15, half*0.1], [half*0.15, half*0.3]];
        for (const [ax, ay] of arrows) {
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + half*0.08, ay + half*0.35); ctx.stroke();
            ctx.fillStyle = '#aaaaaa';
            ctx.beginPath();
            ctx.moveTo(ax + half*0.08, ay + half*0.35);
            ctx.lineTo(ax + half*0.15, ay + half*0.25);
            ctx.lineTo(ax, ay + half*0.25);
            ctx.fill();
        }
    } else if (eff === 'debuff_defense') {
        ctx.fillStyle = '#ff6644';
        ctx.beginPath(); ctx.moveTo(0, -half*0.7);
        ctx.lineTo(half*0.55, -half*0.35); ctx.lineTo(half*0.45, half*0.4);
        ctx.lineTo(0, half*0.7); ctx.lineTo(-half*0.45, half*0.4);
        ctx.lineTo(-half*0.55, -half*0.35); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#220000'; ctx.lineWidth = Math.max(1.2, size/12);
        ctx.beginPath();
        ctx.moveTo(-half*0.05, -half*0.5);
        ctx.lineTo(half*0.1, -half*0.1);
        ctx.lineTo(-half*0.1, half*0.2);
        ctx.lineTo(half*0.05, half*0.5);
        ctx.stroke();
    } else if (eff === 'summon_minion') {
        ctx.fillStyle = '#88aacc';
        ctx.beginPath();
        ctx.moveTo(0, -half*0.7);
        ctx.quadraticCurveTo(half*0.5, -half*0.6, half*0.45, -half*0.1);
        ctx.lineTo(half*0.45, half*0.4);
        ctx.lineTo(half*0.25, half*0.25); ctx.lineTo(half*0.1, half*0.45);
        ctx.lineTo(-half*0.1, half*0.25); ctx.lineTo(-half*0.25, half*0.45);
        ctx.lineTo(-half*0.45, half*0.3);
        ctx.lineTo(-half*0.45, -half*0.1);
        ctx.quadraticCurveTo(-half*0.5, -half*0.6, 0, -half*0.7);
        ctx.fill();
        ctx.fillStyle = '#ccddee';
        ctx.beginPath(); ctx.arc(-half*0.15, -half*0.25, half*0.08, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(half*0.15, -half*0.25, half*0.08, 0, Math.PI*2); ctx.fill();
    } else if (eff === 'self_heal_pct') {
        ctx.fillStyle = '#44cc44';
        ctx.fillRect(-half*0.15, -half*0.6, half*0.3, half*1.2);
        ctx.fillRect(-half*0.6, -half*0.15, half*1.2, half*0.3);
        ctx.fillStyle = '#88ee88';
        ctx.fillRect(-half*0.08, -half*0.5, half*0.16, half*1.0);
        ctx.fillRect(-half*0.5, -half*0.08, half*1.0, half*0.16);
    } else if (eff === 'buff_frenzy') {
        ctx.strokeStyle = '#ff4444'; ctx.lineWidth = Math.max(1.5, size/10); ctx.lineCap = 'round';
        const xs = [-half*0.3, 0, half*0.3];
        for (const bx of xs) {
            ctx.beginPath(); ctx.moveTo(bx, half*0.5); ctx.lineTo(bx, -half*0.3); ctx.stroke();
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.moveTo(bx, -half*0.65);
            ctx.lineTo(bx - half*0.12, -half*0.3);
            ctx.lineTo(bx + half*0.12, -half*0.3);
            ctx.fill();
        }
    } else if (eff === 'buff_berserk') {
        ctx.fillStyle = '#ff6644';
        ctx.beginPath();
        ctx.moveTo(0, -half*0.8);
        ctx.quadraticCurveTo(half*0.6, -half*0.4, half*0.4, half*0.1);
        ctx.quadraticCurveTo(half*0.5, half*0.5, half*0.15, half*0.6);
        ctx.lineTo(0, half*0.3); ctx.lineTo(-half*0.15, half*0.6);
        ctx.quadraticCurveTo(-half*0.5, half*0.5, -half*0.4, half*0.1);
        ctx.quadraticCurveTo(-half*0.6, -half*0.4, 0, -half*0.8);
        ctx.fill();
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath();
        ctx.moveTo(0, -half*0.4);
        ctx.quadraticCurveTo(half*0.25, -half*0.1, half*0.15, half*0.2);
        ctx.lineTo(-half*0.15, half*0.2);
        ctx.quadraticCurveTo(-half*0.25, -half*0.1, 0, -half*0.4);
        ctx.fill();
    } else if (eff === 'buff_atkspd') {
        ctx.strokeStyle = '#ffaa44'; ctx.lineWidth = Math.max(1.5, size/10); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-half*0.6, -half*0.4); ctx.lineTo(half*0.4, -half*0.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-half*0.5, 0); ctx.lineTo(half*0.6, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-half*0.6, half*0.4); ctx.lineTo(half*0.4, half*0.4); ctx.stroke();
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath();
        ctx.moveTo(half*0.7, 0);
        ctx.lineTo(half*0.4, -half*0.15);
        ctx.lineTo(half*0.4, half*0.15);
        ctx.fill();
    } else if (eff === 'buff_crit') {
        ctx.strokeStyle = '#ffdd44'; ctx.lineWidth = Math.max(1.2, size/12);
        ctx.beginPath(); ctx.arc(0, 0, half*0.45, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -half*0.7); ctx.lineTo(0, half*0.7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-half*0.7, 0); ctx.lineTo(half*0.7, 0); ctx.stroke();
        ctx.fillStyle = '#ffdd44';
        ctx.beginPath(); ctx.arc(0, 0, half*0.12, 0, Math.PI*2); ctx.fill();
    } else if (eff === 'buff_dodge') {
        ctx.strokeStyle = '#88ccff'; ctx.lineWidth = Math.max(1.2, size/12); ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-half*0.6, -half*0.3);
        ctx.quadraticCurveTo(0, -half*0.5, half*0.5, -half*0.15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-half*0.5, half*0.05);
        ctx.quadraticCurveTo(half*0.1, -half*0.15, half*0.6, half*0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-half*0.4, half*0.4);
        ctx.quadraticCurveTo(half*0.2, half*0.2, half*0.5, half*0.45);
        ctx.stroke();
    } else if (eff === 'buff_speed') {
        ctx.strokeStyle = '#aaddff'; ctx.lineWidth = Math.max(1.2, size/12); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(-half*0.15, -half*0.25, half*0.3, -Math.PI*0.8, Math.PI*0.3); ctx.stroke();
        ctx.beginPath(); ctx.arc(half*0.15, half*0.15, half*0.25, -Math.PI*0.5, Math.PI*0.6); ctx.stroke();
        ctx.beginPath(); ctx.arc(-half*0.3, half*0.3, half*0.15, -Math.PI*0.3, Math.PI*0.7); ctx.stroke();
    } else if (eff === 'buff_counter') {
        ctx.strokeStyle = '#cc6644'; ctx.lineWidth = Math.max(1.2, size/12);
        ctx.beginPath(); ctx.arc(0, 0, half*0.4, 0, Math.PI*2); ctx.stroke();
        for (let a = 0; a < 8; a++) {
            const ang = a * Math.PI / 4;
            const ix = Math.cos(ang)*half*0.4, iy = Math.sin(ang)*half*0.4;
            const ox = Math.cos(ang)*half*0.75, oy = Math.sin(ang)*half*0.75;
            ctx.fillStyle = '#cc6644';
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(ix + Math.cos(ang+0.5)*half*0.12, iy + Math.sin(ang+0.5)*half*0.12);
            ctx.lineTo(ix + Math.cos(ang-0.5)*half*0.12, iy + Math.sin(ang-0.5)*half*0.12);
            ctx.fill();
        }
    } else if (eff === 'buff_poison') {
        ctx.fillStyle = '#44cc44';
        const drops = [[0, -half*0.3], [-half*0.3, half*0.15], [half*0.3, half*0.15]];
        for (const [dx, dy] of drops) {
            ctx.beginPath();
            ctx.moveTo(dx, dy - half*0.25);
            ctx.quadraticCurveTo(dx + half*0.18, dy, dx, dy + half*0.15);
            ctx.quadraticCurveTo(dx - half*0.18, dy, dx, dy - half*0.25);
            ctx.fill();
        }
    } else if (eff === 'shadow_strike') {
        ctx.fillStyle = '#8866bb';
        ctx.beginPath();
        ctx.moveTo(half*0.5, -half*0.7);
        ctx.lineTo(half*0.65, -half*0.5);
        ctx.lineTo(-half*0.4, half*0.6);
        ctx.lineTo(-half*0.55, half*0.45);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(80,40,120,0.4)';
        ctx.beginPath();
        ctx.moveTo(-half*0.55, half*0.45);
        ctx.quadraticCurveTo(-half*0.7, half*0.7, -half*0.3, half*0.7);
        ctx.lineTo(-half*0.4, half*0.6);
        ctx.closePath(); ctx.fill();
    } else if (eff === 'smoke_screen') {
        ctx.fillStyle = 'rgba(136,136,136,0.6)';
        ctx.beginPath(); ctx.arc(-half*0.2, -half*0.1, half*0.3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(half*0.2, 0, half*0.35, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(-half*0.05, half*0.25, half*0.25, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(170,170,170,0.4)';
        ctx.beginPath(); ctx.arc(0, -half*0.15, half*0.2, 0, Math.PI*2); ctx.fill();
	        } else if (eff === 'place_trap') {
	            ctx.strokeStyle = '#cc8844'; ctx.lineWidth = Math.max(1.2, size/12);
	            ctx.beginPath(); ctx.arc(0, 0, half*0.3, 0, Math.PI*2); ctx.stroke();
	            for (let a = 0; a < 8; a++) {
	                const ang = a * Math.PI / 4;
	                const ix = Math.cos(ang)*half*0.3, iy = Math.sin(ang)*half*0.3;
	                const ox = Math.cos(ang)*half*0.55, oy = Math.sin(ang)*half*0.55;
	                ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ox, oy); ctx.stroke();
	            }
	            ctx.fillStyle = '#cc8844';
	            ctx.beginPath(); ctx.arc(0, 0, half*0.12, 0, Math.PI*2); ctx.fill();
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
	                ctx.strokeStyle = pal.main; ctx.lineWidth = Math.max(1.5, size/10); ctx.lineCap = 'round';
	                ctx.beginPath();
	                ctx.moveTo(-half*0.6, half*0.4);
	                ctx.lineTo(half*0.5, -half*0.5);
	                ctx.stroke();
	                ctx.fillStyle = pal.main;
	                ctx.beginPath(); ctx.arc(half*0.25, -half*0.25, half*0.22, 0, Math.PI*2); ctx.fill();
	                ctx.fillStyle = pal.hi;
	                ctx.beginPath(); ctx.arc(half*0.2, -half*0.3, half*0.11, 0, Math.PI*2); ctx.fill();
	            } else {
	                // Arrow: shaft + head.
	                ctx.strokeStyle = pal.main; ctx.lineWidth = Math.max(1.6, size/10); ctx.lineCap = 'round';
	                ctx.beginPath();
	                ctx.moveTo(-half*0.55, half*0.35);
	                ctx.lineTo(half*0.45, -half*0.45);
	                ctx.stroke();
	                ctx.fillStyle = pal.hi;
	                ctx.beginPath();
	                ctx.moveTo(half*0.45, -half*0.45);
	                ctx.lineTo(half*0.72, -half*0.18);
	                ctx.lineTo(half*0.25, -half*0.18);
	                ctx.fill();
	                // tiny fletching
	                ctx.fillStyle = 'rgba(255,255,255,0.15)';
	                ctx.beginPath();
	                ctx.moveTo(-half*0.55, half*0.35);
	                ctx.lineTo(-half*0.75, half*0.25);
	                ctx.lineTo(-half*0.6, half*0.1);
	                ctx.fill();
	            }
	        // --- Generic includes-based matches ---
	        } else if (eff.includes('fire') || eff.includes('pyro')) {
	            ctx.fillStyle = '#ff6622';
	            ctx.beginPath();
	            ctx.moveTo(0, -half); ctx.quadraticCurveTo(half*0.7, -half*0.3, half*0.5, half*0.4);
        ctx.lineTo(0, half*0.1); ctx.lineTo(-half*0.5, half*0.4);
        ctx.quadraticCurveTo(-half*0.7, -half*0.3, 0, -half); ctx.fill();
        ctx.fillStyle = '#ffcc44';
        ctx.beginPath();
        ctx.moveTo(0, -half*0.3); ctx.quadraticCurveTo(half*0.3, 0, half*0.2, half*0.3);
        ctx.lineTo(-half*0.2, half*0.3);
        ctx.quadraticCurveTo(-half*0.3, 0, 0, -half*0.3); ctx.fill();
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
        ctx.beginPath(); ctx.moveTo(-half*0.6, half*0.6); ctx.lineTo(half*0.5, -half*0.5); ctx.stroke();
        ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.moveTo(half*0.3, -half*0.7);
        ctx.lineTo(half*0.6, -half*0.4); ctx.lineTo(half*0.5, -half*0.5); ctx.fill();
        ctx.fillStyle = '#886633'; ctx.fillRect(-half*0.7, half*0.4, half*0.4, half*0.3);
    } else if (eff.includes('whirlwind')) {
        ctx.strokeStyle = '#aaddff'; ctx.lineWidth = 2;
        for (let a = 0; a < 3; a++) {
            const ang = a * Math.PI * 2 / 3;
            ctx.beginPath(); ctx.arc(0, 0, half * 0.6, ang, ang + 1.2); ctx.stroke();
        }
    } else if (eff.includes('projectile') || eff.includes('shot') || eff.includes('arrow')) {
        ctx.strokeStyle = '#ccaa66'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-half*0.6, half*0.3); ctx.lineTo(half*0.5, -half*0.5); ctx.stroke();
        ctx.fillStyle = '#aaaaaa';
        ctx.beginPath(); ctx.moveTo(half*0.5, -half*0.5);
        ctx.lineTo(half*0.7, -half*0.2); ctx.lineTo(half*0.2, -half*0.2); ctx.fill();
    } else if (eff.includes('buff') || eff.includes('battle_orders') || eff.includes('heal')) {
        ctx.fillStyle = '#66aa44';
        ctx.beginPath(); ctx.moveTo(0, -half*0.7);
        ctx.lineTo(half*0.6, -half*0.3); ctx.lineTo(half*0.5, half*0.4);
        ctx.lineTo(0, half*0.7); ctx.lineTo(-half*0.5, half*0.4);
        ctx.lineTo(-half*0.6, -half*0.3); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#88cc66'; ctx.lineWidth = 1; ctx.stroke();
    } else if (eff.includes('stun') || eff.includes('ground_slam')) {
        ctx.fillStyle = '#ffdd44';
        for (let a = 0; a < 5; a++) {
            const ang = a * Math.PI * 2 / 5 - Math.PI/2;
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ang) * half * 0.8, Math.sin(ang) * half * 0.8);
            ctx.lineTo(Math.cos(ang + 0.3) * half * 0.3, Math.sin(ang + 0.3) * half * 0.3);
            ctx.fill();
        }
    } else if (eff.includes('charge') || eff.includes('leap')) {
        ctx.strokeStyle = '#ffaa44'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-half*0.5, half*0.4);
        ctx.quadraticCurveTo(0, -half*0.8, half*0.5, half*0.4); ctx.stroke();
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath(); ctx.moveTo(half*0.3, half*0.1); ctx.lineTo(half*0.7, half*0.5);
        ctx.lineTo(half*0.3, half*0.6); ctx.fill();
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
        ctx.moveTo(0, -half*0.6);
        ctx.lineTo(half*0.45, 0);
        ctx.lineTo(0, half*0.6);
        ctx.lineTo(-half*0.45, 0);
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
    const glow = ctx.createRadialGradient(0, 0, half*0.2, 0, 0, half*0.9);
    glow.addColorStop(0, 'rgba(100,170,255,0.5)');
    glow.addColorStop(1, 'rgba(100,170,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, half*0.9, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#66aaff'; ctx.lineWidth = Math.max(2, size/10); ctx.lineCap = 'round';
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
    ctx.beginPath(); ctx.arc(0, 0, half*0.12, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}
function getWaypointIconDataURL(size) {
    const key = '_waypoint_' + size;
    if (_skillIconDataURLCache[key]) return _skillIconDataURLCache[key];
    const cvs = document.createElement('canvas');
    cvs.width = size; cvs.height = size;
    const c = cvs.getContext('2d');
    _drawWaypointIcon(c, size/2, size/2, size);
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
        ctx.fillText(`第${G.actFloor}層/${actDef.floors}${G.cycle > 0 ? ' (' + (G.cycle+1) + '周目)' : ''}`, W - 15, 170);
    } else {
        ctx.fillText(`${G.cycle > 0 ? (G.cycle+1) + '周目' : '拠点'}`, W - 15, 170);
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

