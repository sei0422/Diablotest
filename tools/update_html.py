#!/usr/bin/env python3
with open('diablo_game.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_tag = '    <script src="js/game.js"></script>'
new_tags = """    <!-- Data -->
    <script src="js/data.js"></script>
    <script src="js/sprites.js"></script>
    <script src="js/audio.js"></script>
    <!-- Systems -->
    <script src="js/effects.js"></script>
    <script src="js/dungeon.js"></script>
    <script src="js/items.js"></script>
    <script src="js/player.js"></script>
    <script src="js/entities.js"></script>
    <script src="js/town.js"></script>
    <!-- UI & Game -->
    <script src="js/ui.js"></script>
    <script src="js/save.js"></script>
    <script src="js/main.js"></script>"""

html = html.replace(old_tag, new_tags)

with open('diablo_game.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('HTML updated')
