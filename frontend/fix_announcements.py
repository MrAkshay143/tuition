import re

with open('src/features/admin/AdminAnnouncementsPage.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix buttons
text = text.replace('size="lg"\n                    loading={createMutation.isPending}\n                    className="flex-1 justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3', 'size="sm"\n                    loading={createMutation.isPending}\n                    className="flex-1 justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2')
text = text.replace('size="lg"\n                    onClick={() => {\n                      reset()', 'size="sm"\n                    onClick={() => {\n                      reset()')

# Wrap cards
pieces = text.split('{/* Quick Templates Card */}')
if len(pieces) == 2:
    part1, part2 = pieces
    
    last_card_idx = part2.rfind('</Card>')
    if last_card_idx != -1:
        insertion_point = last_card_idx + len('</Card>')
        part2 = part2[:insertion_point] + '\n            </div>' + part2[insertion_point:]
        
        text = part1 + '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">\n            {/* Quick Templates Card */}' + part2

with open('src/features/admin/AdminAnnouncementsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Done AdminAnnouncementsPage!')
