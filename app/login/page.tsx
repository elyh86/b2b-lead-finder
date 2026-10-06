import { AuthPage } from "@/components/auth-page";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  return <AuthPage mode="login" next={next} />;
}
