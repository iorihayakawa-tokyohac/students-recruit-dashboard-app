import React, { useState } from 'react';
import { Calendar, Building2, FileText, CheckSquare, Search, Plus, Filter, Clock, AlertCircle, Check, Circle, ChevronRight, Flag, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const TaskListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('すべて');
  const userName = "田中";

  const statusOptions = ['すべて', '未完了', '完了', '今日', '今週'];

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "〇〇商事のエントリーシート提出",
      company: "〇〇商事",
      deadline: "2024-11-29",
      deadlineText: "明日",
      priority: "高",
      completed: false,
      category: "エントリー",
      description: "志望動機と自己PRを800字で",
      urgent: true
    },
    {
      id: 2,
      title: "△△銀行の適性検査を受ける",
      company: "△△銀行",
      deadline: "2024-11-30",
      deadlineText: "2日後",
      priority: "高",
      completed: false,
      category: "選考",
      description: "オンラインで60分",
      urgent: true
    },
    {
      id: 3,
      title: "企業研究ノート作成",
      company: "××株式会社",
      deadline: "2024-12-03",
      deadlineText: "6日後",
      priority: "中",
      completed: false,
      category: "研究",
      description: "事業内容と強みをまとめる",
      urgent: false
    },
    {
      id: 4,
      title: "OB訪問の日程調整",
      company: "◇◇コンサル",
      deadline: "2024-12-05",
      deadlineText: "1週間後",
      priority: "中",
      completed: false,
      category: "その他",
      description: "メールで候補日を3つ提示",
      urgent: false
    },
    {
      id: 5,
      title: "自己分析シートの見直し",
      company: "全般",
      deadline: "2024-12-07",
      deadlineText: "10日後",
      priority: "低",
      completed: false,
      category: "準備",
      description: "強み・弱みを再整理",
      urgent: false
    },
    {
      id: 6,
      title: "□□メーカーの会社説明会参加",
      company: "□□メーカー",
      deadline: "2024-11-27",
      deadlineText: "今日",
      priority: "高",
      completed: true,
      category: "説明会",
      description: "オンライン 14:00-16:00",
      urgent: false
    },
    {
      id: 7,
      title: "履歴書の写真撮影",
      company: "全般",
      deadline: "2024-11-26",
      deadlineText: "昨日",
      priority: "中",
      completed: true,
      category: "準備",
      description: "スタジオで撮影完了",
      urgent: false
    },
    {
      id: 8,
      title: "☆☆広告の資料請求",
      company: "☆☆広告",
      deadline: "2024-12-01",
      deadlineText: "4日後",
      priority: "低",
      completed: false,
      category: "その他",
      description: "採用ページから請求",
      urgent: false
    },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === '未完了') matchesStatus = !task.completed;
    if (filterStatus === '完了') matchesStatus = task.completed;
    if (filterStatus === '今日') matchesStatus = task.deadlineText === '今日';
    if (filterStatus === '今週') matchesStatus = ['今日', '明日', '2日後', '3日後', '4日後', '5日後', '6日後'].includes(task.deadlineText);
    
    return matchesSearch && matchesStatus;
  });

  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const urgentTasks = tasks.filter(t => !t.completed && t.urgent);
  const todayTasks = tasks.filter(t => !t.completed && t.deadlineText === '今日');

  const priorityColors = {
    '高': 'text-red-600 bg-red-50 border-red-200',
    '中': 'text-amber-600 bg-amber-50 border-amber-200',
    '低': 'text-slate-600 bg-slate-50 border-slate-200',
  };

  const categoryColors = {
    'エントリー': 'bg-blue-100 text-blue-700',
    '選考': 'bg-purple-100 text-purple-700',
    '研究': 'bg-green-100 text-green-700',
    '説明会': 'bg-pink-100 text-pink-700',
    '準備': 'bg-amber-100 text-amber-700',
    'その他': 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30">
      {/* サイドバー */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800">就活ノート</h1>
          <p className="text-xs text-slate-500 mt-1">✨ 焦らず、自分のペースで</p>
        </div>
        
        <nav className="p-3 space-y-1">
          <NavItem icon={<Calendar />} label="ホーム" />
          <NavItem icon={<Building2 />} label="企業一覧" />
          <NavItem icon={<FileText />} label="企業研究ノート" />
          <NavItem icon={<CheckSquare />} label="やることリスト" active />
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
          <h2 className="text-2xl font-bold text-slate-800 mb-1">やることリスト</h2>
          <p className="text-sm text-slate-600">一つずつ、着実に進めていこう ✓</p>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">📋</span>
                <span className="text-2xl font-bold text-slate-800">{incompleteTasks.length}</span>
              </div>
              <p className="text-xs text-slate-600">残りのタスク</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">⚠️</span>
                <span className="text-2xl font-bold text-red-600">{urgentTasks.length}</span>
              </div>
              <p className="text-xs text-slate-600">締切間近</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">📅</span>
                <span className="text-2xl font-bold text-blue-600">{todayTasks.length}</span>
              </div>
              <p className="text-xs text-slate-600">今日やること</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">✓</span>
                <span className="text-2xl font-bold text-green-600">{completedTasks.length}</span>
              </div>
              <p className="text-xs text-slate-600">完了したタスク</p>
            </CardContent>
          </Card>
        </div>

        {/* 検索とフィルター */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="タスクを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-200 bg-white/80 backdrop-blur"
            />
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            タスク追加
          </Button>
        </div>

        {/* ステータスフィルター */}
        <div className="mb-6 flex items-center gap-2">
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
            </button>
          ))}
        </div>

        {/* 励ましメッセージ */}
        {urgentTasks.length > 0 && filterStatus === 'すべて' && (
          <Card className="mb-6 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  締切が近いタスクが{urgentTasks.length}件あります
                </p>
                <p className="text-xs text-red-700 mt-1">
                  焦らなくて大丈夫。一つずつ片付けていきましょう 💪
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {completedTasks.length > 0 && filteredTasks.every(t => t.completed) && filterStatus === '完了' && (
          <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  よく頑張りました！ 🎉
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {completedTasks.length}件のタスクを完了しています。素晴らしいです！
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* タスク一覧 */}
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <Card 
              key={task.id} 
              className={`border-slate-200 bg-white/80 backdrop-blur transition-all cursor-pointer ${
                task.completed ? 'opacity-60' : 'hover:shadow-md'
              } ${task.urgent && !task.completed ? 'ring-2 ring-red-200' : ''}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="w-5 h-5"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                          {task.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">{task.company}</p>
                      </div>
                      <div className={`ml-3 px-3 py-1 rounded-full text-xs font-medium border ${priorityColors[task.priority]}`}>
                        <Flag className="w-3 h-3 inline mr-1" />
                        {task.priority}
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-3">{task.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`${categoryColors[task.category]} text-xs border-none`}>
                          {task.category}
                        </Badge>
                        <div className={`flex items-center gap-1 text-xs ${
                          task.urgent && !task.completed ? 'text-red-600 font-medium' : 'text-slate-500'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{task.deadlineText}</span>
                        </div>
                      </div>
                      {task.completed && (
                        <Badge className="bg-green-100 text-green-700 text-xs border-none">
                          <Check className="w-3 h-3 mr-1" />
                          完了
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-16">
            <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">該当するタスクがありません</p>
            <Button variant="outline" className="border-slate-300">
              <Plus className="w-4 h-4 mr-2" />
              新しいタスクを追加
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

export default TaskListPage;