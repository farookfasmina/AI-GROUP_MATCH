import { useState } from 'react';
import { Save } from 'lucide-react';

export default function PreferenceForm({ initialData = {}, onSubmit }) {
  // If initialData is null or undefined, default to empty strings
  const [subjects, setSubjects] = useState(initialData?.subjects_of_interest || '');
  const [learningStyle, setLearningStyle] = useState(initialData?.learning_style || '');
  const [communication, setCommunication] = useState(initialData?.communication_preference || '');
  const [competency, setCompetency] = useState(initialData?.competency_level || '');
  const [studyType, setStudyType] = useState(initialData?.preferred_study_type || 'Group');
  const [collaborationTendency, setCollaborationTendency] = useState(initialData?.collaboration_tendency || 'Collaborative Peer');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      subjects_of_interest: subjects,
      learning_style: learningStyle,
      communication_preference: communication,
      competency_level: competency,
      preferred_study_type: studyType,
      collaboration_tendency: collaborationTendency
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <div>
        <label htmlFor="subjects" className="block text-sm font-bold text-slate-700 mb-2">
          Subjects of Interest
        </label>
        <div className="relative">
          <input
            type="text"
            id="subjects"
            placeholder="e.g. Machine Learning, Calculus, Data Structures"
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm font-medium transition-shadow outline-none"
          />
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500">Separate subjects by commas.</p>
      </div>

      <div>
        <label htmlFor="style" className="block text-sm font-bold text-slate-700 mb-2">
          Primary Learning Style
        </label>
        <select
          id="style"
          value={learningStyle}
          onChange={(e) => setLearningStyle(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm font-medium outline-none bg-white"
        >
          <option value="">Select a style...</option>
          <option value="Visual">Visual (Images, Diagrams, Spatial)</option>
          <option value="Auditory">Auditory (Listening, Discussing)</option>
          <option value="Reading/Writing">Reading/Writing (Text driven)</option>
          <option value="Kinesthetic">Kinesthetic (Hands-on, Practical)</option>
        </select>
      </div>

      <div>
        <label htmlFor="communication" className="block text-sm font-bold text-slate-700 mb-2">
          Communication Preference
        </label>
        <select
          id="communication"
          value={communication}
          onChange={(e) => setCommunication(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm font-medium outline-none bg-white"
        >
          <option value="">Select a preference...</option>
          <option value="Text">Text (Chat, Forums)</option>
          <option value="Voice">Voice (Audio Calls)</option>
          <option value="Video">Video (Zoom, Discord)</option>
          <option value="In-Person">In-Person (Physical meetups)</option>
        </select>
      </div>

      <div>
        <label htmlFor="competency" className="block text-sm font-bold text-slate-700 mb-2">
          Competency Level
        </label>
        <select
          id="competency"
          value={competency}
          onChange={(e) => setCompetency(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm font-medium outline-none bg-white font-outfit"
        >
          <option value="">Select a level...</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Expert">Expert</option>
        </select>
      </div>

      <div>
        <label htmlFor="studyType" className="block text-sm font-bold text-slate-700 mb-2">
          Preferred Study Format (Research Objective 1)
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setStudyType('Group')}
            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 font-bold text-sm ${studyType === 'Group'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
          >
            Study Group
          </button>
          <button
            type="button"
            onClick={() => setStudyType('Buddy')}
            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 font-bold text-sm ${studyType === 'Buddy'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
          >
            Study Buddy
          </button>
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-400">Do you prefer working in a small team or 1-on-1?</p>
      </div>

      <div>
        <label htmlFor="collaborationTendency" className="block text-sm font-bold text-slate-700 mb-2">
          Collaboration Tendency (Social Preference)
        </label>
        <select
          id="collaborationTendency"
          value={collaborationTendency}
          onChange={(e) => setCollaborationTendency(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm font-medium outline-none bg-white font-outfit"
        >
          <option value="Collaborative Peer">Collaborative Peer (Balanced work)</option>
          <option value="Driven Leader">Driven Leader (Takes initiative)</option>
          <option value="Focused Learner">Focused Learner (Deep-dive contributor)</option>
        </select>
        <p className="mt-2 text-xs font-semibold text-slate-400">How do you usually contribute to a group?</p>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all duration-200 shadow-sm hover:shadow focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 outline-none"
        >
          <Save className="h-4 w-4" />
          Save Preferences
        </button>
      </div>
    </form>
  );
}
