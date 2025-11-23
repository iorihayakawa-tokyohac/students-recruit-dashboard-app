import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { 
  Building2, 
  CheckSquare, 
  FileText, 
  TrendingUp, 
  Clock, 
  Target,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Building2,
      title: "企業管理",
      description: "応募企業の情報を一元管理。業界、職種、選考ステータスを整理して、全体像を把握できます。"
    },
    {
      icon: CheckSquare,
      title: "タスク管理",
      description: "ES提出や面接準備などのタスクを期限付きで管理。やるべきことを見逃しません。"
    },
    {
      icon: FileText,
      title: "メモ機能",
      description: "面接での質問や企業研究の内容を記録。振り返りに役立つ情報を蓄積できます。"
    },
    {
      icon: TrendingUp,
      title: "進捗可視化",
      description: "ダッシュボードで選考状況を一目で確認。KPIカードで進捗を数値化します。"
    },
    {
      icon: Clock,
      title: "締切管理",
      description: "直近の予定と締切を自動表示。重要な日程を見逃すことがありません。"
    },
    {
      icon: Target,
      title: "志望度管理",
      description: "企業ごとに優先度を設定。本命企業に集中して取り組めます。"
    }
  ];

  const benefits = [
    "Excelやスプレッドシートでの管理から解放",
    "就活情報が散らばらず、一箇所で完結",
    "締切や面接日を見逃すリスクを削減",
    "選考状況を可視化して、戦略的に就活を進められる"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">{APP_TITLE}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <a href={getLoginUrl("login")}>ログイン</a>
              </Button>
              <Button asChild>
                <a href={getLoginUrl("signup")}>
                  無料で始める
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 text-foreground">
              新卒就活生向け
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              就活を、もっとシンプルに。
              <br />
              <span className="text-primary">一元管理で効率化。</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {APP_TITLE}は、複雑化しがちな就職活動の情報を一箇所で管理できるWebアプリケーションです。
              <br />
              企業情報、選考ステータス、タスク、面接メモをシームレスに整理し、効率的に就活を進められます。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href={getLoginUrl("signup")}>
                  今すぐ無料で始める
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">機能を見る</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 機能セクション */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              就活に必要な機能を、すべて
            </h3>
            <p className="text-lg text-muted-foreground">
              就活生が本当に必要とする機能だけを厳選しました
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* メリットセクション */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                こんな悩みを解決します
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                  <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-20 bg-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              今すぐ始めて、就活を効率化しよう
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              無料で今すぐ利用開始できます。クレジットカード不要。
            </p>
            <Button size="lg" asChild>
              <a href={getLoginUrl("signup")}>
                無料で始める
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-border bg-card/50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-bold text-foreground">{APP_TITLE}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  新卒就活生のための企業・タスク管理ツール
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">サービス</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#features" className="hover:text-foreground transition-colors">機能</a></li>
                  <li><a href={getLoginUrl("login")} className="hover:text-foreground transition-colors">ログイン</a></li>
                  <li><a href={getLoginUrl("signup")} className="hover:text-foreground transition-colors">新規登録</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">法的情報</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">利用規約</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">プライバシーポリシー</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
              <p>&copy; 2024 {APP_TITLE}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
