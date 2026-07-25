import os
import re

directory = 'src/features'

# We look for grid classes that look like KPI metric rows (usually 4 or 5 columns)
pattern = re.compile(r'className="grid grid-cols-[^"]*?(?:sm|md|lg|xl):grid-cols-[45][^"]*?gap-[^"]+"')

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace the first matching grid container below the header
            new_content = pattern.sub('className="admin-stats-row"', content, count=1)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {filepath}')
