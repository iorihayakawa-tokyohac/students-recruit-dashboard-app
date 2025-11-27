import React, { useState } from 'react';
import { Calendar, Building2, FileText, CheckSquare, Search, Plus, ChevronLeft, ChevronRight, MapPin, Clock, Video, Users, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const SchedulePage = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 10, 27)); // 2024年11月27日
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const userName = "田中";

  const events = [
    {
      id: 1,
      title: "会社説明会",
      company: "〇〇商事",
      date: "2024-11-29",
      time: "14:00-16:00",
      type: "説明会",
      typeColor: "bg-blue-100 text-blue-700 border-blue-200",
      location: "オンライン (Zoom)",
      isOnline: true,
      description: "総合職採用説明会。事業内容と選考フローについて",
      participants: 50,
      reminder: true
    },
    {
      id: 2,
      title: "一次面接",
      company: "△△銀行",
      date: "2024-12-02",
      time: "10:00-11:00",
      type: "面接",
      typeColor: "bg-purple-100 text-purple-700 border-purple-200",
      location: "東京本社（大手町）",
      isOnline: false,
      description: "人事面接。志望動機と自己PRを中心に",
      participants: null,
      reminder: true
    },
    {
      id: 3,
      title: "インターン初日",
      company: "××株式会社",
      date: "2024-12-05",
      time: "09:00-18:00",
      type: "インターン",
      typeColor: "bg-green-100 text-green-700 border-green-200",
      location: "渋谷オフィス",
      isOnline: false,
      description: "5日間の就業体験プログラム",
      participants: 10,
      reminder: true
    },
    {
      id: 4,
      title: "OB訪問",
      company: "◇◇コンサル",
      date: "2024-12-03",
      time: "18:00-19:30",
      type: "その他",
      typeColor: "bg-amber-100 text-amber-700 border-amber-200",
      location: "カフェ（新宿）",
      isOnline: false,
      description: "2年目社員の方とお話",
      participants: null,
      reminder: false
    },
    {
      id: 5,
      title: "二次面接",
      company: "□□メーカー",
      date: "2024-12-06",
      time: "15:00-16:30",
      type: "面接",
      typeColor: "bg-purple-100 text-purple-700 border-purple-200",
      location: "オンライン (Teams)",
      isOnline: true,
      description: "現場社員との面接",
      participants: null,
      reminder: true
    },
    {
      id: 6,
      title: "業界研究セミナー",
      company: "☆☆広告",
      date: "2024-11-28",
      time: "13:00-15:00",
      type: "説明会",
      typeColor: "bg-blue-100 text-blue-700 border-blue-200",
      location: "オンライン (Zoom)",
      isOnline: true,
      description: "広告業界の最新トレンド",
      participants: 100,
      reminder: false
    },
    {
      id: 7,
      title: "グループディスカッション",
      company: "◆◆商社",
      date: "2024-12-04",
      time: "10:00-12:00",
      type: "選考",
      typeColor: "bg-pink-100 text-pink-700 border-pink-200",
      location: "東京本社",
      isOnline: false,
      description: "6名1グループでのGD選考",
      participants: 6,
      reminder: true
    },
    {
      id: 8,
      title: "最終面接",
      company: "▽▽IT",
      date: "2024-12-10",
      time: "14:00-15:00",
      type: "面接",
      typeColor: "bg-purple-100 text-purple-700 border-purple-200",
      location: "本社（六本木）",
      isOnline: false,
      description: "役員面接",
      participants: null,
      reminder: true
    },
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return events.filter(event => event.date === dateStr);
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const filteredEvents = sortedEvents.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingEvents = sortedEvents.filter(event => new Date(event.date) >= new Date(2024, 10, 27));
  const thisWeekEvents = upcomingEvents.filter(event => {
    const eventDate = new Date(event.date);
    const weekLater = new Date(2024, 10, 27);
    weekLater.setDate(weekLater.getDate() + 7);
    return eventDate <= weekLater;
  });

  const eventsByType = {
    '説明会': events.filter(e => e.type === '説明会').length,
    '面接': events.filter(e => e.type === '面接').length,
    '選考': events.filter(e => e.type === '選考').length,
    'インターン': events.filter(e => e.type === 'インターン').length,
    'その他': events.filter(e => e.type === 'その他').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30">
      {/* サイドバー */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800">就活ノート</h1>
          <p className="text-xs text-slate-500 mt-1">✨ 今日も頑張ってるね</p>
        </div>
        
        <nav className="p-3 space-y-1">
          <NavItem icon={<Calendar />} label="ホーム" />
          <NavItem icon={<Building2 />} label="企業一覧" />
          <NavItem icon={<FileText />} label="企業研究ノート" />
          <NavItem icon={<CheckSquare />} label="やることリスト" />
          <NavItem icon={<Calendar />} label="説明会・選考日程" active />
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
          <h2 className="text-2xl font-bold text-slate-800 mb-1">説明会・選考日程</h2>
          <p className="text-sm text-slate-600">スケジュールを確認しよう 📅</p>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">📅</span>
                <span className="text-2xl font-bold text-slate-800">{upcomingEvents.length}</span>
              </div>
              <p className="text-xs text-slate-600">今後の予定</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">🎯</span>
                <span className="text-2xl font-bold text-blue-600">{thisWeekEvents.length}</span>
              </div>
              <p className="text-xs text-slate-600">今週の予定</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">📝</span>
                <span className="text-2xl font-bold text-purple-600">{eventsByType['説明会']}</span>
              </div>
              <p className="text-xs text-slate-600">説明会</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">💼</span>
                <span className="text-2xl font-bold text-pink-600">{eventsByType['面接']}</span>
              </div>
              <p className="text-xs text-slate-600">面接</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">🚀</span>
                <span className="text-2xl font-bold text-green-600">{eventsByType['インターン']}</span>
              </div>
              <p className="text-xs text-slate-600">インターン</p>
            </CardContent>
          </Card>
        </div>

        {/* 検索と表示切替 */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="予定を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-200 bg-white/80 backdrop-blur"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              onClick={() => setViewMode('month')}
              className={viewMode === 'month' ? 'bg-slate-800' : ''}
            >
              カレンダー
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-slate-800' : ''}
            >
              リスト
            </Button>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            予定を追加
          </Button>
        </div>

        {/* カレンダー表示 */}
        {viewMode === 'month' && (
          <Card className="border-slate-200 bg-white/80 backdrop-blur mb-6">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-lg font-bold text-slate-800">
                  {year}年 {monthNames[month]}
                </h3>
                <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-slate-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[...Array(startingDayOfWeek)].map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const date = new Date(year, month, day);
                  const dayEvents = getEventsForDate(date);
                  const isToday = date.toDateString() === new Date(2024, 10, 27).toDateString();
                  
                  return (
                    <div
                      key={day}
                      className={`aspect-square border rounded-lg p-2 ${
                        isToday ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200'
                      } hover:shadow-md transition-all cursor-pointer`}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-slate-800'}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs px-1 py-0.5 rounded truncate ${event.typeColor}`}
                          >
                            {event.company}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-slate-500">+{dayEvents.length - 2}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* リスト表示 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {viewMode === 'list' ? '予定一覧' : '今後の予定'}
          </h3>
          {(viewMode === 'list' ? filteredEvents : upcomingEvents.slice(0, 5)).map(event => {
            const eventDate = new Date(event.date);
            const dateStr = `${eventDate.getMonth() + 1}月${eventDate.getDate()}日`;
            const dayOfWeek = dayNames[eventDate.getDay()];
            
            return (
              <Card key={event.id} className="border-slate-200 bg-white/80 backdrop-blur hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-2xl font-bold text-slate-800">{eventDate.getDate()}</div>
                      <div className="text-xs text-slate-500">{eventDate.getMonth() + 1}月</div>
                      <div className="text-xs text-slate-500">({dayOfWeek})</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-800">{event.title}</h3>
                            <Badge className={`${event.typeColor} text-xs border-none`}>
                              {event.type}
                            </Badge>
                            {event.reminder && (
                              <AlertCircle className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{event.company}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-3">{event.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {event.isOnline ? (
                            <>
                              <Video className="w-4 h-4" />
                              <span>{event.location}</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </>
                          )}
                        </div>
                        {event.participants && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{event.participants}名</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredEvents.length === 0 && viewMode === 'list' && (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">該当する予定がありません</p>
            <Button variant="outline" className="border-slate-300">
              <Plus className="w-4 h-4 mr-2" />
              新しい予定を追加
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

export default SchedulePage;