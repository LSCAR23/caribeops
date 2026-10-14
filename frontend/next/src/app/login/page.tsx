import LoginForm from "@/components/LoginForm";

// Static page: nothing is fetched server-side, so the build
// never needs Laravel to be up.
export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Log in
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Sign in with your CaribeOps account.
      </p>
      <div className="mt-6 max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
