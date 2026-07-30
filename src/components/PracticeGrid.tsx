import React, { useState } from 'react';
import { Plane, Utensils, Bus, Building, Coffee, ShoppingBag, Briefcase, Users, Plus, ArrowRight, Volume2, MessageSquare, ChevronRight, Sparkles } from 'lucide-react';
import { Scenario, Difficulty, ModeType, ESPCategory } from '../types';

interface PracticeGridProps {
  scenarios: Scenario[];
  preferredMode: ModeType;
  userMajor: ESPCategory;
  onSelectScenario: (scenario: Scenario, mode: ModeType) => void;
  onCreateCustomScenario: () => void;
}

export const PracticeGrid: React.FC<PracticeGridProps> = ({
  scenarios,
  preferredMode,
  userMajor,
  onSelectScenario,
  onCreateCustomScenario
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeMode, setActiveMode] = useState<ModeType>(preferredMode);

  // Helper icon renderer
  const getIcon = (name: string) => {
    switch (name) {
      case 'Plane': return <Plane className="w-6 h-6" />;
      case 'Utensils': return <Utensils className="w-6 h-6" />;
      case 'Bus': return <Bus className="w-6 h-6" />;
      case 'Building': return <Building className="w-6 h-6" />;
      case 'Coffee': return <Coffee className="w-6 h-6" />;
      case 'ShoppingBag': return <ShoppingBag className="w-6 h-6" />;
      case 'Briefcase': return <Briefcase className="w-6 h-6" />;
      case 'Users': return <Users className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  const difficultyBadge = (level: Difficulty) => {
    switch (level) {
      case 'Beginner':
        return <span className="bg-[#dfe0e0] text-[#3c4947] text-[11px] font-semibold px-2 py-0.5 rounded">Beginner</span>;
      case 'Intermediate':
        return <span className="bg-[#6ecdcb]/20 text-[#006a68] text-[11px] font-semibold px-2 py-0.5 rounded-full">Intermediate</span>;
      case 'Advanced':
        return <span className="text-[#006a68] text-[11px] font-bold">Advanced</span>;
    }
  };

  const filteredScenarios = scenarios.filter(s => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'ESP') return s.espField === userMajor;
    return s.difficulty.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="px-5 pt-4 pb-28 space-y-6 max-w-2xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#181c1e] mb-1">상황 선택</h2>
          <p className="text-xs text-[#3c4947]">
            공포심을 버리고 실제 상황처럼 대화를 시작해보세요.
          </p>
        </div>

        {/* Mode Switcher Toggle */}
        <div className="bg-[#ebeef0] p-1 rounded-full flex items-center gap-1 border border-[#bbc9c7]/30 shrink-0">
          <button
            onClick={() => setActiveMode('voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeMode === 'voice'
                ? 'bg-[#006a63] text-white shadow-sm'
                : 'text-[#3c4947] hover:text-[#006a63]'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            음성 전용 모드
          </button>
          <button
            onClick={() => setActiveMode('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeMode === 'text'
                ? 'bg-[#006a63] text-white shadow-sm'
                : 'text-[#3c4947] hover:text-[#006a63]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            지하철/텍스트 모드
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: '전체' },
          { id: 'ESP', label: `내 전공/직무 (${userMajor})` },
          { id: 'Beginner', label: 'Beginner' },
          { id: 'Intermediate', label: 'Intermediate' },
          { id: 'Advanced', label: 'Advanced' }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-[#006a63] text-white shadow-xs'
                : 'bg-white border border-[#bbc9c7]/30 text-[#3c4947] hover:bg-[#f1f4f6]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Bento Grid Layout matching design wireframe */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top Featured Airport Card (Large) */}
        {filteredScenarios.find(s => s.id === 'airport') && (
          <div
            onClick={() => onSelectScenario(filteredScenarios.find(s => s.id === 'airport')!, activeMode)}
            className="col-span-2 bg-white/90 rounded-2xl p-5 flex flex-col justify-between h-48 relative overflow-hidden shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20 cursor-pointer active:scale-[0.98] transition-all hover:border-[#006a63]"
          >
            <div className="absolute -right-4 -top-4 opacity-10 text-[#006a63] pointer-events-none">
              <Plane className="w-32 h-32" />
            </div>

            <div className="z-10">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#6ecdcb]/20 text-[#006a68] text-xs font-semibold mb-2">
                Intermediate
              </span>
              <h3 className="text-xl font-bold text-[#181c1e] mb-0.5">Airport</h3>
              <p className="text-xs text-[#3c4947]">Check-in 및 수하물 위탁</p>
            </div>

            <div className="flex justify-between items-center z-10 mt-4">
              <div className="w-11 h-11 rounded-full bg-[#006a63] flex items-center justify-center text-white shadow-sm">
                <Plane className="w-5 h-5" />
              </div>
              <ArrowRight className="w-5 h-5 text-[#006a63]" />
            </div>
          </div>
        )}

        {/* Restaurant Card */}
        {filteredScenarios.find(s => s.id === 'restaurant') && (
          <div
            onClick={() => onSelectScenario(filteredScenarios.find(s => s.id === 'restaurant')!, activeMode)}
            className="bg-white rounded-2xl p-5 flex flex-col justify-between h-52 shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20 cursor-pointer active:scale-[0.98] transition-all hover:border-[#006a63]"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#4fd1c5]/20 flex items-center justify-center text-[#006a63] mb-3">
                <Utensils className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#181c1e] mb-1">Restaurant</h3>
              {difficultyBadge('Beginner')}
            </div>
            <p className="text-xs text-[#3c4947]">주문하기 및 옵션 요청</p>
          </div>
        )}

        {/* Transport Card */}
        {filteredScenarios.find(s => s.id === 'transport') && (
          <div
            onClick={() => onSelectScenario(filteredScenarios.find(s => s.id === 'transport')!, activeMode)}
            className="bg-white rounded-2xl p-5 flex flex-col justify-between h-52 shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20 cursor-pointer active:scale-[0.98] transition-all hover:border-[#006a63]"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#6ecdcb]/20 flex items-center justify-center text-[#006a68] mb-3">
                <Bus className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#181c1e] mb-1">Transport</h3>
              {difficultyBadge('Beginner')}
            </div>
            <p className="text-xs text-[#3c4947]">길 찾기 및 티켓 구매</p>
          </div>
        )}

        {/* Hotel Card (Wide) */}
        {filteredScenarios.find(s => s.id === 'hotel') && (
          <div
            onClick={() => onSelectScenario(filteredScenarios.find(s => s.id === 'hotel')!, activeMode)}
            className="col-span-2 bg-white rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20 cursor-pointer active:scale-[0.98] transition-all hover:border-[#006a63]"
          >
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#4fd1c5]/20 flex items-center justify-center text-[#006a63]">
              <Building className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-bold text-[#181c1e]">Hotel</h3>
                {difficultyBadge('Advanced')}
              </div>
              <p className="text-xs text-[#3c4947]">체크인 및 컴플레인 해결</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#bbc9c7]" />
          </div>
        )}

        {/* Other Scenarios in 2-column or list */}
        {filteredScenarios
          .filter(s => !['airport', 'restaurant', 'transport', 'hotel'].includes(s.id))
          .map(scenario => (
            <div
              key={scenario.id}
              onClick={() => onSelectScenario(scenario, activeMode)}
              className="bg-white rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20 cursor-pointer active:scale-[0.98] transition-all hover:border-[#006a63]"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#4fd1c5]/15 flex items-center justify-center text-[#006a63] shrink-0">
                  {getIcon(scenario.iconName)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#181c1e]">{scenario.title}</h3>
                  <p className="text-[11px] text-[#3c4947] line-clamp-1">{scenario.titleKo}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#f1f4f6]">
                {difficultyBadge(scenario.difficulty)}
                <span className="text-[10px] text-[#006a63] font-semibold">{scenario.estimatedMinutes}분 코스</span>
              </div>
            </div>
          ))}

        {/* Custom Scenario Creation Card */}
        <div
          onClick={onCreateCustomScenario}
          className="col-span-2 border-2 border-dashed border-[#006a63]/30 bg-[#4fd1c5]/5 rounded-2xl p-5 flex items-center justify-center gap-3 cursor-pointer hover:bg-[#4fd1c5]/10 active:scale-[0.98] transition-all text-[#006a63]"
        >
          <div className="w-10 h-10 rounded-full bg-[#006a63] text-white flex items-center justify-center shadow-sm">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm text-[#006a63]">나만의 맞춤 과업 생성하기</h3>
            <p className="text-xs text-[#3c4947]">전공, 업무, 자유 주제 맞춤 시나리오를 설계하세요</p>
          </div>
        </div>
      </div>
    </div>
  );
};
