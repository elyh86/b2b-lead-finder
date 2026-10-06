import { AuthPage } from "@/components/auth-page";

type RegisterPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { next } = await searchParams;
  return <AuthPage mode="register" next={next} />;
}
