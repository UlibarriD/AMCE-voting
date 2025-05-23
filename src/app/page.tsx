import { LoginForm } from "@/components/auth/login-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
