import os
import re

test_dir = r"c:\Dev\Projects\Online Tuition\backend\tests\Feature"

pattern1 = re.compile(r"(\$module\s*=\s*CourseModule::create\(\[.*?\]\);)\s*(?:\$lesson[A-Z0-9_]*\s*=\s*Lesson::create\(\[.*?(?:'chapter_id'|'module_id')\s*=>\s*\$module->id.*?\]\);)", re.DOTALL)

def fix_test_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # manual replace for LearningProgressTest
    content = content.replace("'module_id' => $module->id", "'chapter_id' => $module->id") # This is wrong, needs chapter
    
    # More general approach: find where CourseModule is created, and if the very next statements are Lesson creations using $module->id, inject a chapter.
    
    # Actually, simpler:
    # Just find all Lesson::create(...) and see if they have 'chapter_id' => $module->id or 'module_id' => $module->id
    # We can just define a chapter globally in the test or locally.
    
    # Let's just fix the files specifically mentioned in the error.
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# We will just write a specific script for the broken files.
files_to_fix = [
    "CourseBuilderTest.php",
    "LearningProgressTest.php",
    "StudentLearningTest.php"
]

for file in files_to_fix:
    path = os.path.join(test_dir, file)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Inject Chapter after Module
    # CourseBuilderTest
    if file == "CourseBuilderTest.php":
        content = re.sub(r"(\$moduleId = \$response->json\('data\.id'\);)\s*// 3\. Create Lesson\s*\$response = \$this->actingAs\(\$this->teacher\)->postJson\(\"/api/v1/modules/\{\$moduleId\}/lessons\"", 
                         r"\1\n        $chapter = \\App\\Domains\\Course\\Models\\CourseChapter::create(['module_id' => $moduleId, 'title' => 'Ch1', 'sort_order' => 1]);\n        $chapterId = $chapter->id;\n        // 3. Create Lesson\n        $response = $this->actingAs($this->teacher)->postJson(\"/api/v1/chapters/{$chapterId}/lessons\"", content)
                         
        content = re.sub(r"(\$module = CourseModule::create\(\[\s*'course_id' => \$course->id,\s*'title'\s*=> 'Export Module'\s*\]\);)\s*\$lesson = Lesson::create\(\[\s*'chapter_id' => \$module->id,",
                         r"\1\n        $chapter = \\App\\Domains\\Course\\Models\\CourseChapter::create(['module_id' => $module->id, 'title' => 'Ch1']);\n        $lesson = Lesson::create([\n            'chapter_id' => $chapter->id,", content)
                         
    if file == "LearningProgressTest.php":
        content = re.sub(r"(\$module = CourseModule::create\(\[\s*'course_id'\s*=> \$course->id,\s*'title'\s*=> 'Test Module',\s*'sort_order' => 1\s*\]\);)\s*\$lesson = Lesson::create\(\[\s*'chapter_id' => \$module->id,",
                         r"\1\n        $chapter = \\App\\Domains\\Course\\Models\\CourseChapter::create(['module_id' => $module->id, 'title' => 'Ch1']);\n        $lesson = Lesson::create([\n            'chapter_id' => $chapter->id,", content)

    if file == "StudentLearningTest.php":
        content = re.sub(r"(\$module = CourseModule::create\(\[.*?\]\);)\s*\$lesson = Lesson::create\(\[\s*(?:'chapter_id'|'module_id')\s*=>\s*\$module->id",
                         r"\1\n        $chapter = \\App\\Domains\\Course\\Models\\CourseChapter::create(['module_id' => $module->id, 'title' => 'Ch1']);\n        $lesson = Lesson::create([\n            'chapter_id' => $chapter->id", content, flags=re.DOTALL)
                         
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done")
