import os
import re

directory = 'src/features/admin'
files = os.listdir(directory)

for file in files:
    if file.endswith('Page.tsx'):
        filepath = os.path.join(directory, file)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace the first matching grid container below the header
        new_content = re.sub(r'className="grid grid-cols-[^"]+gap-[^"]+"', 'className="admin-stats-row"', content, count=1)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Updated {file}')
