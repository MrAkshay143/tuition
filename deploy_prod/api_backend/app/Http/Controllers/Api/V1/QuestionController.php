<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\Assessment\Models\Question;
use App\Domains\Assessment\Models\Topic;
use App\Domains\Assessment\Models\Difficulty;
use Illuminate\Http\Request;

class QuestionController extends ApiController
{
    public function index(Request $request)
    {
        $query = Question::with(['topic', 'difficulty', 'tags']);
        
        if ($request->has('topic_id')) {
            $query->where('topic_id', $request->topic_id);
        }
        
        if ($request->has('difficulty_id')) {
            $query->where('difficulty_id', $request->difficulty_id);
        }
        
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        
        // Only return active by default
        if ($request->boolean('active', true)) {
            $query->where('is_active', true);
        }
        
        $questions = $query->paginate($request->input('per_page', 50));
        return $this->paginated($questions, 'Questions retrieved successfully');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'topic_id' => 'nullable|exists:topics,id',
            'difficulty_id' => 'nullable|exists:difficulties,id',
            'content' => 'required|string',
            'type' => 'required|in:mcq,subjective,true_false,numerical',
            'options' => 'nullable|array',
            'correct_answer' => 'nullable|string',
            'solution_explanation' => 'nullable|string',
            'default_marks' => 'integer|min:1',
            'default_time_seconds' => 'nullable|integer',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:question_tags,id'
        ]);

        $data['teacher_id'] = $request->user()->id;
        $tags = $data['tags'] ?? [];
        unset($data['tags']);

        $question = Question::create($data);
        
        if (!empty($tags)) {
            $question->tags()->sync($tags);
        }
        
        return $this->success($question->load(['topic', 'difficulty', 'tags']), 'Question created successfully', 201);
    }

    public function show($id)
    {
        $question = Question::with(['topic', 'difficulty', 'tags'])->findOrFail($id);
        return $this->success($question, 'Question details retrieved successfully');
    }

    public function update(Request $request, $id)
    {
        $question = Question::findOrFail($id);
        
        $data = $request->validate([
            'topic_id' => 'nullable|exists:topics,id',
            'difficulty_id' => 'nullable|exists:difficulties,id',
            'content' => 'sometimes|string',
            'type' => 'sometimes|in:mcq,subjective,true_false,numerical',
            'options' => 'nullable|array',
            'correct_answer' => 'nullable|string',
            'solution_explanation' => 'nullable|string',
            'default_marks' => 'integer|min:1',
            'default_time_seconds' => 'nullable|integer',
            'is_active' => 'boolean',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:question_tags,id'
        ]);

        $tags = $data['tags'] ?? null;
        unset($data['tags']);

        $question->update($data);
        
        if (is_array($tags)) {
            $question->tags()->sync($tags);
        }
        
        return $this->success($question->fresh(['topic', 'difficulty', 'tags']), 'Question updated successfully');
    }

    public function destroy($id)
    {
        $question = Question::findOrFail($id);
        $question->delete();
        return $this->success(null, 'Question deleted successfully');
    }

    public function getTopics()
    {
        $topics = Topic::with('subject')->get();
        return $this->success($topics, 'Topics retrieved successfully');
    }

    public function getDifficulties()
    {
        $difficulties = Difficulty::all();
        return $this->success($difficulties, 'Difficulties retrieved successfully');
    }
}
