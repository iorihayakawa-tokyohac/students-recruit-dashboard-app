import React, { useState } from 'react';
import { Calendar, Building2, FileText, CheckSquare, Search, Plus, Filter, Star, MapPin, Users, TrendingUp, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const CompanyListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('すべて');
  const userName = "田中";

  const statusOptions = ['すべて', 'エントリー済み', '選考中', '研究中', '気になる', '見送り'];
  
  const companies = [
    { 
      id: 1, 
      name: "〇〇商事", 
      status: "エントリー済み", 
      statusColor: "bg-blue-100 text-blue-700",
      industry: "商社",
      location: "東京",
      employees: "5,000名",
      interest: 5,
      deadline: "12月1日",
      hasDeadline: true,
      note: "総合商社。グローバル展開に強み",
      lastUpdate: "今日"
    },
    { 
      id: 2, 
      name: "△△銀行", 
      status: "選考中", 
      statusColor: "bg-purple-100 text-purple-700",
      industry: "金融",
      location: "大阪",
      employees: "3,200名",
      interest: 4,
      deadline: "11月30日",
      hasDeadline: true,
      note: "一次面接の準備が必要",
      lastUpdate: "昨日"
    },
    { 
      id: 3, 
      name: "××株式会社", 
      status: "研究中", 
      statusColor: "bg-green-100 text-green-700",
      industry: "IT",
      location: "東京",
      employees: "1,800名",
      interest: 5,
      deadline: null,
      hasDeadline: false,
      note: "自社サービス開発。働きやすそう",
      lastUpdate: "3日前"
    },
    { 
      id: 4, 
      name: "◇◇コンサル", 
      status: "気になる", 
      statusColor: "bg-amber-100 text-amber-700",
      industry: "コンサル",
      location: "東京",
      employees: "800名",
      interest: 3,
      deadline: null,
      hasDeadline: false,
      note: "OB訪問してみたい",
      lastUpdate: "1週間前"
    },
    { 
      id: 5, 
      name: "□□メーカー", 
      status: "研究中", 
      statusColor: "bg-green-100 text-green-700",
      industry: "メーカー",
      location: "愛知",
      employees: "12,000名",
      interest: 4,
      deadline: null,
      hasDeadline: false,
      note: "ものづくりに興味あり",
      lastUpdate: "1週間前"
    },
    { 
      id: 6, 
      name: "☆☆広告", 
      status: "気になる", 
      statusColor: "bg-amber-100 text-amber-700",
      industry: "広告",
      location: "東京",
      employees: "2,500名",
      interest: 3,
      deadline: null,
      hasDeadline: false,
      note: "クリエイティブな仕事",
      lastUpdate: "2週間前"
    },
    { 
      id: 7, 
      name: "◆◆物流", 
      status: "見送り", 
      statusColor: "bg-slate-100 text-slate-600",
      industry: "物流",
      location: "千葉",
      employees: "4,500名",
      interest: 2,
      deadline: null,
      hasDeadline: false,
      note: "希望と合わなかった",
      lastUpdate: "2週間前"
    },
    { 
      id: 8, 
      name: "▽▽不動産", 
      status: "研究中", 
      statusColor: "bg-green-100 text-green-700",
      industry: "不動産",
      location: "東京",
      employees: "1,500名",
      interest: 4,
      deadline: null,
      hasDeadline: false,
      note: "都市開発に興味",
      lastUpdate: "3日前"
    },
  ];

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'すべて' || company.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    'すべて': companies.length,
    'エントリー済み': companies.filter(c => c.status === 'エントリー済み').length,
    '選考中': companies.filter(c => c.status === '選考中').length,
    '研究中': companies.filter(c => c.status === '研究中').length,
    '気になる': companies.filter(c => c.status === '気になる').length,
    '見送り': companies.filter(c => c.status === '見送り').length,
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
          <NavItem icon={<Building2 />} label="企業一覧" active />
          <NavItem icon={<FileText />} label="企業研究ノート" />
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
          <h2 className="text-2xl font-bold text-slate-800 mb-1">企業一覧</h2>
          <p className="text-sm text-slate-600">気になる企業を管理しよう 🏢</p>
        </div>

        {/* 検索とフィルター */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="企業名や業界で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-200 bg-white/80 backdrop-blur"
            />
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            企業を追加
          </Button>
        </div>

        {/* ステータスフィルター */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          {statusOptions.map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filterStatus === status
                  ? 'bg-slate-800 text-white'
                  : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {status}
              <span className="ml-2 text-xs opacity-70">({statusCounts[status]})</span>
            </button>
          ))}
        </div>

        {/* 企業カード一覧 */}
        <div className="grid grid-cols-1 gap-4">
          {filteredCompanies.map(company => (
            <Card key={company.id} className="border-slate-200 bg-white/80 backdrop-blur hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl">
                        🏢
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-slate-800">{company.name}</h3>
                          {company.hasDeadline && (
                            <Badge className="bg-red-100 text-red-700 text-xs">
                              締切: {company.deadline}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {company.industry}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {company.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {company.employees}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-slate-600">{company.note}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge className={`${company.statusColor} border-none`}>
                        {company.status}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < company.interest
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 ml-auto">更新: {company.lastUpdate}</span>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">該当する企業が見つかりませんでした</p>
            <Button variant="outline" className="border-slate-300">
              <Plus className="w-4 h-4 mr-2" />
              新しい企業を追加
            </Button>
          </div>
        )}
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

export default CompanyListPage;