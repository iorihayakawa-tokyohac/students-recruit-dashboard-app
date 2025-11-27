import React, { useState } from 'react';
import { Calendar, Building2, FileText, CheckSquare, Search, Plus, Filter, Tag, Clock, BookOpen, Lightbulb, Users, TrendingUp, Heart, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const CompanyResearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('すべて');
  const userName = "田中";

  const tags = [
    { name: 'すべて', color: 'bg-slate-100 text-slate-700', count: 12 },
    { name: '企業分析', color: 'bg-blue-100 text-blue-700', count: 5 },
    { name: '面接対策', color: 'bg-purple-100 text-purple-700', count: 3 },
    { name: '業界研究', color: 'bg-green-100 text-green-700', count: 2 },
    { name: '志望動機', color: 'bg-pink-100 text-pink-700', count: 4 },
    { name: '気づき', color: 'bg-amber-100 text-amber-700', count: 3 },
  ];

  const researchNotes = [
    {
      id: 1,
      company: "〇〇商事",
      title: "企業説明会でのメモ",
      content: "海外展開に力を入れている。特に東南アジア市場。新規事業も積極的に展開。若手にもチャンスが多いと感じた。",
      tags: ['企業分析', '気づき'],
      date: "2024年11月27日",
      time: "14:30",
      emoji: "📝",
      liked: true,
      comments: 2
    },
    {
      id: 2,
      company: "△△銀行",
      title: "なぜ金融業界なのか",
      content: "社会インフラとしての役割に魅力。デジタル化の波で変革期。FinTechとの融合も面白そう。安定性とチャレンジのバランスが良い。",
      tags: ['志望動機', '業界研究'],
      date: "2024年11月26日",
      time: "20:15",
      emoji: "💡",
      liked: true,
      comments: 0
    },
    {
      id: 3,
      company: "××株式会社",
      title: "面接で聞きたいこと",
      content: "・若手の裁量について\n・リモートワークの実態\n・キャリアパスの例\n・社内の雰囲気（実際どう？）\n・新規事業への関わり方",
      tags: ['面接対策'],
      date: "2024年11月25日",
      time: "19:00",
      emoji: "❓",
      liked: false,
      comments: 1
    },
    {
      id: 4,
      company: "◇◇コンサル",
      title: "OB訪問で聞いたこと",
      content: "激務だけどやりがいは大きい。論理的思考力が鍛えられる。3年目くらいで転職する人も多い。でもスキルは確実につく。",
      tags: ['企業分析', '気づき'],
      date: "2024年11月24日",
      time: "16:45",
      emoji: "👔",
      liked: false,
      comments: 3
    },
    {
      id: 5,
      company: "□□メーカー",
      title: "ものづくりへの想い",
      content: "実際に手に取れる製品を作りたい。技術力の高さに感動。工場見学で感じた職人魂。長く働ける環境がありそう。",
      tags: ['志望動機', '気づき'],
      date: "2024年11月23日",
      time: "11:20",
      emoji: "⚙️",
      liked: true,
      comments: 0
    },
    {
      id: 6,
      company: "業界全般",
      title: "IT業界の今後について",
      content: "AIの発展は避けられない。でも人間にしかできないことを考えるのが大事。技術 × 人間力の掛け算。コミュニケーション能力は必須。",
      tags: ['業界研究'],
      date: "2024年11月22日",
      time: "22:00",
      emoji: "💻",
      liked: true,
      comments: 1
    },
    {
      id: 7,
      company: "〇〇商事",
      title: "自己分析：なぜ商社？",
      content: "幅広い業界に関われる。スケールの大きい仕事。グローバルな視点。人と人を繋ぐ仕事。自分の強みを活かせそう。",
      tags: ['志望動機', '企業分析'],
      date: "2024年11月21日",
      time: "15:30",
      emoji: "🌏",
      liked: false,
      comments: 0
    },
    {
      id: 8,
      company: "△△銀行",
      title: "面接対策：よくある質問",
      content: "・志望動機（なぜ金融？なぜ当行？）\n・学生時代頑張ったこと\n・強み・弱み\n・10年後のキャリア\n・最近気になるニュース",
      tags: ['面接対策'],
      date: "2024年11月20日",
      time: "18:00",
      emoji: "📋",
      liked: true,
      comments: 2
    },
  ];

  const filteredNotes = researchNotes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === 'すべて' || note.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const recentActivity = [
    { action: "新しいノートを作成", company: "〇〇商事", time: "2時間前" },
    { action: "ノートを編集", company: "△△銀行", time: "昨日" },
    { action: "タグを追加", company: "××株式会社", time: "3日前" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30">
      {/* サイドバー */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800">就活ノート</h1>
          <p className="text-xs text-slate-500 mt-1">✨ 一歩ずつ、着実に前へ</p>
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
          <h2 className="text-2xl font-bold text-slate-800 mb-1">企業研究ノート</h2>
          <p className="text-sm text-slate-600">気づきや学びを記録しよう 📚</p>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">📝</span>
                <span className="text-2xl font-bold text-slate-800">12</span>
              </div>
              <p className="text-xs text-slate-600">総ノート数</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">🏢</span>
                <span className="text-2xl font-bold text-slate-800">7</span>
              </div>
              <p className="text-xs text-slate-600">研究済み企業</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">💡</span>
                <span className="text-2xl font-bold text-slate-800">28</span>
              </div>
              <p className="text-xs text-slate-600">気づき</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">⭐</span>
                <span className="text-2xl font-bold text-slate-800">5</span>
              </div>
              <p className="text-xs text-slate-600">お気に入り</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* ノート一覧 */}
          <div className="col-span-2">
            {/* 検索とフィルター */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="ノートを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-200 bg-white/80 backdrop-blur"
                />
              </div>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                新規作成
              </Button>
            </div>

            {/* タグフィルター */}
            <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2">
              {tags.map(tag => (
                <button
                  key={tag.name}
                  onClick={() => setFilterTag(tag.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    filterTag === tag.name
                      ? tag.color + ' ring-2 ring-offset-1 ring-slate-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tag.name} ({tag.count})
                </button>
              ))}
            </div>

            {/* ノートカード */}
            <div className="space-y-3">
              {filteredNotes.map(note => (
                <Card key={note.id} className="border-slate-200 bg-white/80 backdrop-blur hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{note.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 mb-1">{note.title}</h3>
                            <p className="text-xs text-slate-500 mb-2">{note.company}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            {note.liked && (
                              <Heart className="w-4 h-4 fill-red-400 text-red-400" />
                            )}
                            {note.comments > 0 && (
                              <div className="flex items-center gap-1 text-slate-400">
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-xs">{note.comments}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{note.content}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {note.tags.map((tag, idx) => {
                              const tagColor = tags.find(t => t.name === tag)?.color || 'bg-slate-100 text-slate-600';
                              return (
                                <Badge key={idx} className={`${tagColor} text-xs border-none`}>
                                  {tag}
                                </Badge>
                              );
                            })}
                          </div>
                          <span className="text-xs text-slate-400">{note.date}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredNotes.length === 0 && (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">該当するノートが見つかりませんでした</p>
                <Button variant="outline" className="border-slate-300">
                  <Plus className="w-4 h-4 mr-2" />
                  新しいノートを作成
                </Button>
              </div>
            )}
          </div>

          {/* サイドバー情報 */}
          <div className="space-y-4">
            {/* 最近の活動 */}
            <Card className="border-slate-200 bg-white/80 backdrop-blur">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-800">最近の活動</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 mb-0.5">{activity.action}</p>
                      <p className="text-xs font-medium text-slate-800">{activity.company}</p>
                      <p className="text-xs text-slate-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* クイックヒント */}
            <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-purple-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">研究のコツ 💡</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      説明会や面接の後、すぐにメモを残そう。新鮮な気づきが一番価値があります。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* タグ一覧 */}
            <Card className="border-slate-200 bg-white/80 backdrop-blur">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-800">タグ一覧</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {tags.filter(t => t.name !== 'すべて').map((tag, idx) => (
                    <Badge key={idx} className={`${tag.color} text-xs border-none cursor-pointer hover:opacity-80`}>
                      {tag.name} ({tag.count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
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

export default CompanyResearchPage;