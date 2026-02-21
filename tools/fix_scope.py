#!/usr/bin/env python3
"""Convert top-level let/const to var in all JS files to fix TDZ issues."""
import re, glob

for filepath in sorted(glob.glob('js/*.js')):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    changed = 0
    new_lines = []
    
    for line in lines:
        # Match top-level let/const (with possible tab/space indentation at "top level")
        # In the original monolith these were all at the same indent level
        # We convert ANY let/const that's not inside a function body (heuristic: 
        # lines that start with let/const or have only tabs before let/const)
        stripped = line.lstrip()
        indent = line[:len(line) - len(stripped)]
        
        # Only convert declarations that appear to be at module/top level
        # (not deep inside function bodies - those use spaces for indent)
        # Heuristic: if indent is 0, or only tabs (original HTML had 4-space indent
        # which we stripped, so tabs indicate the original top-level sections)
        is_top_level = (
            len(indent) == 0 or 
            indent.replace('\t', '') == '' or  # tabs only
            indent == '    '  # single indent level (some blocks)
        )
        
        if is_top_level and (stripped.startswith('let ') or stripped.startswith('const ')):
            new_line = indent + stripped.replace('let ', 'var ', 1) if stripped.startswith('let ') else indent + stripped.replace('const ', 'var ', 1)
            if new_line != line:
                changed += 1
            new_lines.append(new_line)
        else:
            new_lines.append(line)
    
    if changed > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        print(f'{filepath}: {changed} declarations converted')
    else:
        print(f'{filepath}: no changes')
