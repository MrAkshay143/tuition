import re

with open('src/features/admin/AdminSecurityPage.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# The container currently is:
#         {/* RIGHT COLUMN: Overview, Recent Security Events & Security Actions (4 Cols) */}
#         <div className="lg:col-span-4 flex flex-col gap-4">
# We want to change it to:
#         {/* RIGHT COLUMN: Overview, Recent Security Events & Security Actions (4 Cols) */}
#         <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 items-start">

old_container = '<div className="lg:col-span-4 flex flex-col gap-4">'
new_container = '<div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 items-start">'

if old_container in text:
    text = text.replace(old_container, new_container)
    with open('src/features/admin/AdminSecurityPage.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Done AdminSecurityPage!')
else:
    print('Container not found!')
