import { useMemo, useState } from "react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

type AuthMode = "signin" | "signup";

const copy = {
  signin: {
    title: "ログイン",
    subtitle: "登録済みのメールアドレスとパスワードを入力してください。",
    submit: "ログイン",
    switchQuestion: "アカウントをお持ちでないですか？",
    switchCta: "新規登録はこちら",
    switchHref: "/signup",
  },
  signup: {
    title: "アカウント作成",
    subtitle: "メールアドレスとパスワードで無料登録できます。",
    submit: "アカウントを作成",
    switchQuestion: "すでにアカウントをお持ちですか？",
    switchCta: "ログインはこちら",
    switchHref: "/signin",
  },
} satisfies Record<
  AuthMode,
  {
    title: string;
    subtitle: string;
    submit: string;
    switchQuestion: string;
    switchCta: string;
    switchHref: string;
  }
>;

const tips = [
  "就活の予定と締切をまとめて管理",
  "企業ごとの進捗とタスクがひと目でわかる",
  "志望度やメモもストレスなく保存",
];

type AuthFormState = {
  name: string;
  email: string;
  password: string;
  confirm: string;
};

function AuthPage({ mode }: { mode: AuthMode }) {
  const [form, setForm] = useState<AuthFormState>({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const isSignup = mode === "signup";
  const text = copy[mode];
  const [, setLocation] = useLocation();

  const isDisabled = useMemo(() => {
    if (!form.email || !form.password) return true;
    if (isSignup && (!form.name || form.password !== form.confirm)) return true;
    return status === "submitting";
  }, [form.email, form.password, form.confirm, form.name, isSignup, status]);

  const syncSession = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("サインイン状態を確認できませんでした。");
    }
    const idToken = await currentUser.getIdToken(true);

    const response = await fetch("/api/auth/firebase-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        idToken,
        displayName: currentUser.displayName ?? (isSignup ? form.name : undefined),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error ?? "セッションの作成に失敗しました。");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, form.email, form.password);
        if (auth.currentUser && form.name) {
          await updateProfile(auth.currentUser, { displayName: form.name });
        }
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      }
      await syncSession();
      setStatus("success");
      setLocation("/dashboard");
    } catch (err: any) {
      setStatus("idle");
      let message = err?.message || "エラーが発生しました。";
      if (err?.code === "auth/invalid-email")
        message = "メールアドレスの形式が正しくありません。";
      if (err?.code === "auth/user-disabled")
        message = "このユーザーは無効化されています。";
      if (err?.code === "auth/user-not-found") message = "ユーザーが見つかりません。";
      if (err?.code === "auth/wrong-password") message = "パスワードが間違っています。";
      if (err?.code === "auth/email-already-in-use")
        message = "このメールアドレスは既に使用されています。";
      if (err?.code === "auth/weak-password") message = "パスワードが弱すぎます。";
      if (err?.code === "auth/invalid-credential")
        message = "メールアドレスまたはパスワードが間違っています。";
      
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl grid gap-8 md:grid-cols-2">
        <div className="bg-background rounded-3xl shadow-xl border border-border p-8 md:p-10 space-y-8">
          <div className="flex items-center gap-3">
            <img
              src={APP_LOGO}
              alt={`${APP_TITLE} logo`}
              className="h-12 w-12 rounded-2xl object-cover ring-1 ring-border"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                {isSignup ? "Create account" : "Welcome back"}
              </p>
              <h1 className="text-2xl font-semibold">{APP_TITLE}</h1>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground">{text.title}</h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              {text.subtitle}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  お名前
                </label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="山田 太郎"
                  value={form.name}
                  onChange={event =>
                    setForm(values => ({
                      ...values,
                      name: event.target.value,
                    }))
                  }
                  className="bg-muted/40"
                />
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                メールアドレス
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={event => setForm(values => ({ ...values, email: event.target.value }))}
                className="bg-muted/40"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                パスワード
              </label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                placeholder="8文字以上"
                value={form.password}
                onChange={event =>
                  setForm(values => ({
                    ...values,
                    password: event.target.value,
                  }))
                }
                className="bg-muted/40"
              />
            </div>

            {isSignup && (
              <div className="space-y-2">
                <label htmlFor="confirm" className="text-sm font-medium text-foreground">
                  パスワード（確認）
                </label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="もう一度入力してください"
                  value={form.confirm}
                  onChange={event =>
                    setForm(values => ({
                      ...values,
                      confirm: event.target.value,
                    }))
                  }
                  className="bg-muted/40"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isDisabled}
              className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
            >
              {text.submit}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            {text.switchQuestion}{" "}
            <Link href={text.switchHref}>
              <a className="font-medium text-primary hover:underline">{text.switchCta}</a>
            </Link>
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-white/60 shadow-2xl p-8 md:p-10 flex flex-col justify-between space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              Recruit Dashboard
            </p>
            <h3 className="mt-4 text-3xl font-bold text-foreground">
              就活の情報をすべてここに。
            </h3>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              アカウントを作成すると、企業情報・エントリー状況・タスク・メモをひとつのダッシュボードで管理できます。
            </p>
          </div>
          <ul className="space-y-4">
            {tips.map(tip => (
              <li key={tip} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="text-foreground">{tip}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export const SignInPage = () => <AuthPage mode="signin" />;

export const SignUpPage = () => <AuthPage mode="signup" />;
