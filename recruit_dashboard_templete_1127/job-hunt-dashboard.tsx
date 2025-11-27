import React, { useState } from 'react';
import { Calendar, Building2, FileText, CheckSquare, Bell, User, LogOut, TrendingUp, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const JobHuntDashboard = () => {
  const [currentTime] = useState(new Date());
  const userName = "田中";
  
  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "おはよう";
    if (hour < 18) return "こんにちは";
    return "今日もお疲れさま";
  };

  const encouragement = [
    "一歩ずつ、着実に前へ",
    "あなたらしい未来を描こう",
    "今日も頑張ってるね",
    "焦らず、自分のペースで"
  ];
  
  const todayMessage = encouragement[Math.floor(Math.random() * encouragement.length)];

  const upcomingTasks = [
    { id: 1, title: "〇〇商事のエントリーシート提出", deadline: "2日後", company: "〇〇商事", urgent: true },
    { id: 2, title: "△△銀行の適性検査を受ける", deadline: "3日後", company: "△△銀行", urgent: true },
    { id: 3, title: "企業研究ノート作成", deadline: "5日後", company: "××株式会社", urgent: false },
    { id: 4, title: "OB訪問の日程調整", deadline: "1週間後", company: "◇◇コンサル", urgent: false },
  ];

  const upcomingEvents = [
    { id: 1, title: "会社説明会", company: "〇〇商事", date: "11/29", time: "14:00", type: "説明会", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { id: 2, title: "一次面接", company: "△△銀行", date: "12/2", time: "10:00", type: "面接", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { id: 3, title: "インターン初日", company: "××株式会社", date: "12/5", time: "9:00", type: "インターン", color: "bg-green-50 text-green-700 border-green-200" },
  ];

  const recentCompanies = [
    { id: 1, name: "〇〇商事", status: "エントリー済み", updated: "今日" },
    { id: 2, name: "△△銀行", status: "選考中", updated: "昨日" },
    { id: 3, name: "××株式会社", status: "研究中", updated: "3日前" },
    { id: 4, name: "◇◇コンサル", status: "気になる", updated: "1週間前" },
    { id: 5, name: "□□メーカー", status: "研究中", updated: "1週間前" },
    { id: 6, name: "☆☆IT", status: "気になる", updated: "2週間前" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30">
      {/* サイドバー */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800">就活ノート</h1>
          <p className="text-xs text-slate-500 mt-1">✨ {todayMessage}</p>
        </div>
        
        <nav className="p-3 space-y-1">
          <NavItem icon={<Calendar />} label="ホーム" active />
          <NavItem icon={<Building2 />} label="企業一覧" />
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {greeting()}、{userName}さん 👋
          </h2>
          <p className="text-slate-600 text-sm mb-3">
            締切が近いものが2件あります
          </p>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-sm">
            <span className="mr-2">🌱</span>
            <span className="text-slate-700 font-medium">{todayMessage}</span>
          </div>
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">12</div>
                <span className="text-2xl">📝</span>
              </div>
              <div className="text-sm text-slate-600">エントリー済み</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">5</div>
                <span className="text-2xl">🚀</span>
              </div>
              <div className="text-sm text-slate-600">選考中</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">8</div>
                <span className="text-2xl">📅</span>
              </div>
              <div className="text-sm text-slate-600">今週の予定</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">15</div>
                <span className="text-2xl">✓</span>
              </div>
              <div className="text-sm text-slate-600">残りのタスク</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* やることリスト */}
          <div className="col-span-2">
            <Card className="border-slate-200 bg-white/80 backdrop-blur">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-800">やることリスト</CardTitle>
                  <span className="text-xs text-slate-500">頑張ろう！💪</span>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {upcomingTasks.map(task => (
                  <div 
                    key={task.id}
                    className={`p-4 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors ${
                      task.urgent 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-slate-800 text-sm mb-1">{task.title}</div>
                        <div className="text-xs text-slate-500">{task.company}</div>
                      </div>
                      {task.urgent && (
                        <span className="text-xs text-red-600 font-medium ml-3 whitespace-nowrap">{task.deadline}</span>
                      )}
                    </div>
                    {!task.urgent && (
                      <div className="text-xs text-slate-500">{task.deadline}</div>
                    )}
                  </div>
                ))}
                <button className="w-full py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors">
                  すべて見る →
                </button>
              </CardContent>
            </Card>
          </div>

          {/* 近日の説明会・面接 */}
          <div>
            <Card className="border-slate-200 bg-white/80 backdrop-blur">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-800">近日の予定</CardTitle>
                  <span className="text-xs text-slate-500">🌟</span>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {upcomingEvents.map(event => (
                  <div 
                    key={event.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${event.color}`}
                  >
                    <div className="text-xs font-medium mb-1">{event.company}</div>
                    <div className="text-sm font-medium text-slate-800 mb-2">{event.title}</div>
                    <div className="flex items-center text-xs text-slate-600">
                      <span>{event.date}</span>
                      <span className="mx-1">·</span>
                      <span>{event.time}</span>
                    </div>
                  </div>
                ))}
                <button className="w-full py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors">
                  カレンダーを見る →
                </button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 最近チェックした企業 */}
        <Card className="mt-6 border-slate-200 bg-white/80 backdrop-blur">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-800">最近チェックした企業</CardTitle>
              <span className="text-xs text-slate-500">気になる企業を探そう 🔍</span>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-3 gap-4">
              {recentCompanies.map(company => (
                <div 
                  key={company.id}
                  className="p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="font-medium text-slate-800 text-sm mb-1">{company.name}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{company.status}</span>
                    <span className="text-xs text-slate-400">{company.updated}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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

export default JobHuntDashboard;