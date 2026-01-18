import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Skill-Based Execution Platform
        </h1>
        <p className="text-center mb-8 text-muted-foreground">
          Execution Governance Platform - Skill Verified, Scope Controlled, Accountability Driven
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline">Sign Up</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
