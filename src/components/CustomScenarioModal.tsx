import React, { useState } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';
import { Scenario, Difficulty, ESPCategory } from '../types';

interface CustomScenarioModalProps {
  userMajor: ESPCategory;
  onClose: () => void;
  onCreate: (newScenario: Scenario) => void;
}

export const CustomScenarioModal: React.FC<CustomScenarioModalProps> = ({
  userMajor,
  onClose,
  onCreate
}) => {
  const [title, setTitle] = useState<string>('');
  const [titleKo, setTitleKo] = useState<string>('');
  const [aiRole, setAiRole] = useState<string>('AI Conversation Partner');
  const [defaultGoal, setDefaultGoal] = useState<string>('');
  const [defaultGoalKo, setDefaultGoalKo] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [espField, setEspField] = useState<ESPCategory>(userMajor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !defaultGoal.trim()) return;

    const newScenario: Scenario = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      titleKo: titleKo.trim() || title.trim(),
      category: 'Custom / Personalized',
      categoryKo: '사용자 맞춤 과업',
      difficulty,
      description: `Custom scenario: ${defaultGoal}`,
      descriptionKo: `맞춤 과업: ${defaultGoalKo || defaultGoal}`,
      iconName: 'Sparkles',
      aiRole: aiRole.trim() || 'Conversation Partner',
      userRole: 'Learner',
      defaultGoal: defaultGoal.trim(),
      defaultGoalKo: defaultGoalKo.trim() || defaultGoal.trim(),
      espField,
      estimatedMinutes: 5
    };

    onCreate(newScenario);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 max-w-2xl mx-auto">
      <div className="bg-white w-full rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-[#bbc9c7]/20 pb-3">
          <h3 className="font-bold text-lg text-[#006a63] flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> 나만의 맞춤 과업 시나리오 생성
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#4fd1c5]/20 text-[#006a63]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#181c1e] mb-1">시나리오 제목 (English)</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI Research Presentation Q&A"
              className="w-full h-10 p-2.5 bg-[#f7fafc] border border-[#bbc9c7]/40 rounded-xl text-xs focus:outline-none focus:border-[#006a63]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#181c1e] mb-1">시나리오 제목 (한국어)</label>
            <input
              type="text"
              value={titleKo}
              onChange={(e) => setTitleKo(e.target.value)}
              placeholder="예: 학회 발표 질의응답 및 토론"
              className="w-full h-10 p-2.5 bg-[#f7fafc] border border-[#bbc9c7]/40 rounded-xl text-xs focus:outline-none focus:border-[#006a63]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#181c1e] mb-1">AI 상대방 역할 (AI Role)</label>
            <input
              type="text"
              value={aiRole}
              onChange={(e) => setAiRole(e.target.value)}
              placeholder="e.g. Conference Session Chair / Senior Engineer"
              className="w-full h-10 p-2.5 bg-[#f7fafc] border border-[#bbc9c7]/40 rounded-xl text-xs focus:outline-none focus:border-[#006a63]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#181c1e] mb-1">달성할 목표 (Goal in English)</label>
            <textarea
              required
              value={defaultGoal}
              onChange={(e) => setDefaultGoal(e.target.value)}
              placeholder="e.g. Explain the model accuracy improvements and answer questions about runtime efficiency."
              className="w-full h-16 p-2.5 bg-[#f7fafc] border border-[#bbc9c7]/40 rounded-xl text-xs focus:outline-none focus:border-[#006a63]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#181c1e] mb-1">난이도</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full h-10 p-2 bg-[#f7fafc] border border-[#bbc9c7]/40 rounded-xl text-xs"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#181c1e] mb-1">ESP 분야</label>
              <select
                value={espField}
                onChange={(e) => setEspField(e.target.value as ESPCategory)}
                className="w-full h-10 p-2 bg-[#f7fafc] border border-[#bbc9c7]/40 rounded-xl text-xs"
              >
                <option value="Engineering">Engineering</option>
                <option value="Business">Business</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Hospitality">Hospitality</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#006a63] text-white rounded-xl font-bold text-xs shadow-md hover:bg-[#005750] active:scale-98 transition-all mt-2"
          >
            시나리오 생성 및 대화 시작하기
          </button>
        </form>
      </div>
    </div>
  );
};
