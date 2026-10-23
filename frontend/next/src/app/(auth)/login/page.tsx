import LoginForm from "@/components/LoginForm";
import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import SectionHeading from "@/components/SectionHeading";

// Static page: nothing is fetched server-side, so the build
// never needs Laravel to be up.
export default function LoginPage() {
  return (
    <PageContainer className="max-w-lg">
      <section className="anim-fade-up">
        <SectionHeading as="h1">Log in</SectionHeading>
        <p className="mt-2 text-sm text-ink-500">
          Sign in with your CaribeOps account.
        </p>
      </section>
      <Card className="mt-6">
        <LoginForm />
      </Card>
    </PageContainer>
  );
}
