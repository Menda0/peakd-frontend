import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-16">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Peakd</CardTitle>
          <CardDescription>
            Sign in to upload and manage your videographer jobs. The API is
            reached through a secure same-origin proxy.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {/* Full page navigation: client <Link> RSC fetch breaks on /auth/* (middleware → Auth0 redirect). */}
          <Button nativeButton={false} render={<a href="/auth/login" />}>
            Log in
          </Button>
          <Button variant="outline" nativeButton={false} render={<a href="/auth/logout" />}>
            Log out
          </Button>
          <Button variant="secondary" nativeButton={false} render={<Link href="/videographer" />}>
            Videographer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
