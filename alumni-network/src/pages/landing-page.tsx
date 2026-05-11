import { Link } from "wouter";
import { ArrowRight, BookOpen, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur py-4 px-6 sm:px-12 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="AlumniConnect Logo" className="h-6 w-6 dark:invert" />
          <span className="font-semibold tracking-tight text-lg">AlumniConnect</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-sm font-medium">Log in</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="text-sm font-medium">Join Network</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-48 px-6 sm:px-12 flex flex-col items-center text-center">
          <div className="max-w-3xl space-y-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Where students and alumni stay connected.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Share experiences, build careers, and help the next generation grow. A quiet, focused space for professional development and meaningful connections.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 h-12 gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-12">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section className="w-full py-24 bg-muted/30 px-6 sm:px-12 border-y border-border/40">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Share Knowledge</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Post insights, ask questions, and share experiences. Our journal-style feed ensures high-quality discussions without the noise.
                </p>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Find Mentors</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Connect directly with alumni in your field. Use our structured directory to find people who can guide your career path.
                </p>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Advance Careers</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Access exclusive job postings and share your resume with recruiters looking specifically for talent from your institution.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-8 px-6 sm:px-12 border-t border-border/40 bg-background text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} AlumniConnect. All rights reserved.
        </p>
      </footer>
    </div>
  );
}