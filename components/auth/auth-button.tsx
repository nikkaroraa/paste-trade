import { LogIn, LogOut } from "lucide-react";
import { auth, signIn, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export async function AuthButton() {
  const session = await auth();

  if (!session?.user) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn("github");
        }}
      >
        <Button type="submit" variant="outline" className="border-zinc-700 text-zinc-100">
          <LogIn className="mr-2 size-4" /> Login with GitHub
        </Button>
      </form>
    );
  }

  const initials = (session.user.name ?? session.user.githubHandle ?? "U").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300">
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt={session.user.name ?? "User avatar"} className="size-6 rounded-full" />
        ) : (
          <div className="flex size-6 items-center justify-center rounded-full bg-zinc-800 font-semibold text-zinc-100">{initials}</div>
        )}
        <span className="hidden sm:inline">{session.user.githubHandle ? `@${session.user.githubHandle}` : session.user.name}</span>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <Button type="submit" variant="ghost" className="text-zinc-300 hover:text-zinc-100">
          <LogOut className="mr-2 size-4" /> Logout
        </Button>
      </form>
    </div>
  );
}
