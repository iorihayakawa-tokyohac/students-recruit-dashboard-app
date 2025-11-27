import React, { useState, useEffect } from 'react';
import { Calendar, Building2, FileText, CheckSquare, ChevronLeft, ChevronRight, Check, Save, AlertCircle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const ResearchFormPage = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({
    companyName: '',
    q1: '', q2: '', q3: '',
    q4: '', q5: '', q6: '',
    q7: '', q8: '', q9: '',
    q10: '', q11: '', q12: '',
    q13: '', q14: ''
  });
  const [savedTime, setSavedTime] = useState(null);
  const userName = "田中";

  const sections = [
    {
      id: 0,
      title: "A：企業概要",
      description: "事業内容やビジネスモデルを整理しよう 🏢",
      tip: "簡単なメモ感覚でOKです！",
      questions: [
        {
          id: 'q1',
          label: 'この企業は何をやっている企業か？',
          placeholder: '主要事業や提供サービスを簡潔に\n例：クラウドサービスの開発・提供',
          required: true
        },
        {
          id: 'q2',
          label: 'ビジネスモデルは？',
          placeholder: '誰に・何を・どうやって届けているか\n例：中小企業向けに、業務効率化ツールをサブスクで提供',
          required: false
        },
        {
          id: 'q3',
          label: '同業他社と比べた特徴・強みは？',
          placeholder: '技術力・顧客基盤・スピード感など\n例：UI/UXの使いやすさ、手厚いサポート体制',
          required: false
        }
      ]
    },
    {
      id: 1,
      title: "B：ポジション・働き方",
      description: "自分がどんな役割で貢献できるか明確にしよう 💼",
      tip: "完璧じゃなくても、今のイメージで大丈夫！",
      questions: [
        {
          id: 'q4',
          label: '希望するポジションはどこか？',
          placeholder: '例：エンジニア / コンサル / 営業 / マーケティング',
          required: true
        },
        {
          id: 'q5',
          label: 'そのポジションで想定する業務は？',
          placeholder: '担当業務や役割を具体的に\n例：新規サービスの企画立案、顧客ヒアリング',
          required: false
        },
        {
          id: 'q6',
          label: 'そのポジションで活かせる自分の強みは？',
          placeholder: '経験・スキル・価値観\n例：チームでのプロジェクト経験、課題発見力',
          required: false
        }
      ]
    },
    {
      id: 2,
      title: "C：選考プロセス",
      description: "選考の段取りを明確にして、準備漏れを防ごう 📝",
      tip: "わかる範囲でメモしておくと安心です",
      questions: [
        {
          id: 'q7',
          label: '選考フロー（回数・順番）は？',
          placeholder: '例：ES → Webテスト → 1次面接 → 2次面接 → 最終面接',
          required: false
        },
        {
          id: 'q8',
          label: '面接は何回あるか？',
          placeholder: '回数や形式をメモ\n例：3回（1次：人事、2次：現場、最終：役員）',
          required: true
        },
        {
          id: 'q9',
          label: '想定される質問・評価ポイントは？',
          placeholder: '頻出質問や評価軸\n例：志望動機、学生時代の経験、論理的思考力',
          required: false
        }
      ]
    },
    {
      id: 3,
      title: "D：志望理由・フィット感",
      description: "なぜこの会社で働きたいのか整理しよう ✨",
      tip: "自分の言葉で、素直に書いてみましょう",
      questions: [
        {
          id: 'q10',
          label: 'なぜこの企業に興味を持ったのか？',
          placeholder: '出会いのきっかけや魅力\n例：説明会で社員の方の熱意に感動した',
          required: false
        },
        {
          id: 'q11',
          label: '他社ではなくこの企業でなければならない理由は？',
          placeholder: '唯一性・決め手\n例：若手にも裁量があり、新規事業にチャレンジできる',
          required: false
        },
        {
          id: 'q12',
          label: '価値観やキャリアプランと一致する点は？',
          placeholder: '文化・ミッションとのフィット\n例：「社会課題を解決する」というビジョンに共感',
          required: false
        }
      ]
    },
    {
      id: 4,
      title: "E：リスク・懸念点",
      description: "不安を先に整理して、解消プランを考えよう 💡",
      tip: "不安は誰にでもあります。可視化することが大事！",
      questions: [
        {
          id: 'q13',
          label: '不安に思っている点・確認したい点は？',
          placeholder: '働き方・事業リスクなど\n例：残業時間、転勤の可能性、育成制度',
          required: false
        },
        {
          id: 'q14',
          label: 'それをどのように解消・確認する予定か？',
          placeholder: '面接で聞く・OB訪問など\n例：最終面接で働き方について質問する、OB訪問で実態を聞く',
          required: false
        }
      ]
    }
  ];

  const currentSectionData = sections[currentSection];
  const progress = ((currentSection + 1) / sections.length) * 100;

  // 自動保存（30秒ごと）
  useEffect(() => {
    const timer = setInterval(() => {
      if (formData.companyName) {
        setSavedTime(new Date());
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [formData]);

  const handleInputChange = (questionId, value) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const canGoNext = () => {
    const requiredQuestions = currentSectionData.questions.filter(q => q.required);
    return requiredQuestions.every(q => formData[q.id]?.trim());
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSave = () => {
    setSavedTime(new Date());
    alert('企業研究を保存しました！');
  };

  const isFormValid = () => {
    return formData.companyName && formData.q1 && formData.q4 && formData.q8;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30">
      {/* サイドバー */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800">就活ノート</h1>
          <p className="text-xs text-slate-500 mt-1">✨ あなたらしい未来を描こう</p>
        </div>
        
        <nav className="p-3 space-y-1">
          <NavItem icon={<Calendar />} label="ホーム" />
          <NavItem icon={<Building2 />} label="企業一覧" />
          <NavItem icon={<FileText />} label="企業研究ノート" active />
          <NavItem icon={<CheckSquare />} label="やることリスト" />
          <NavItem icon={<Calendar />} label="説明会・選考日程" />
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-200 bg-gradient-to-t from-blue-50/50 to-transparent">
          <div className="flex items-center space-x-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-sm font-medium shadow-sm">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{userName}さん</p>
              <p className="text-xs text-slate-500">2026年卒</p>
            </div>
          </div>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="ml-56 p-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">企業研究を作成</h2>
              <p className="text-sm text-slate-600">質問に答えて、企業への理解を深めよう 📝</p>
            </div>
            {savedTime && (
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                保存済み {savedTime.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* 企業名入力 */}
          <Card className="border-slate-200 bg-white/80 backdrop-blur mb-6">
            <CardContent className="p-5">
              <label className="block text-sm font-medium text-slate-800 mb-2">
                企業名 <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="例：〇〇株式会社"
                className="text-lg border-slate-200"
              />
            </CardContent>
          </Card>

          {/* 進捗バー */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                進捗: {currentSection + 1} / {sections.length}
              </span>
              <span className="text-sm text-slate-500">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* セクション表示 */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {sections.map((section, idx) => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  idx === currentSection
                    ? 'bg-slate-800 text-white'
                    : idx < currentSection
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {idx < currentSection && <Check className="w-3 h-3 inline mr-1" />}
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* セクション内容 */}
        <div className="max-w-3xl">
          <Card className="border-slate-200 bg-white/80 backdrop-blur mb-4">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-800">
                {currentSectionData.title}
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">{currentSectionData.description}</p>
            </CardHeader>
            <CardContent className="p-6">
              {/* ヒント */}
              <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 mb-1">ヒント 💡</p>
                    <p className="text-sm text-slate-600">{currentSectionData.tip}</p>
                  </div>
                </div>
              </div>

              {/* 質問カード */}
              <div className="space-y-6">
                {currentSectionData.questions.map((question, idx) => (
                  <div key={question.id}>
                    <label className="block text-sm font-medium text-slate-800 mb-2">
                      Q{currentSection * 3 + idx + 1}. {question.label}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <Textarea
                      value={formData[question.id]}
                      onChange={(e) => handleInputChange(question.id, e.target.value)}
                      placeholder={question.placeholder}
                      rows={5}
                      className="border-slate-200 resize-none"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 必須項目の案内 */}
          {!canGoNext() && (
            <Card className="mb-4 border-amber-200 bg-amber-50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-900">
                  必須項目（<span className="text-red-500">*</span>マーク）を入力してください
                </p>
              </CardContent>
            </Card>
          )}

          {/* ナビゲーションボタン */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentSection === 0}
              className="border-slate-300"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              前へ
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSave}
                className="border-slate-300"
              >
                <Save className="w-4 h-4 mr-2" />
                下書き保存
              </Button>

              {currentSection < sections.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext()}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  次へ
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={!isFormValid()}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  完了して保存
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }) => (
  <button
    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-slate-800 text-white font-medium'
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <span className="w-4 h-4">{icon}</span>
    <span>{label}</span>
  </button>
);

export default ResearchFormPage;