import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { auth0 } from "@/lib/auth0";
import {
  EMPTY_LANDING_PAGE,
  fetchLandingPageData,
} from "@/lib/landing";
import { userSubToPathSegment } from "@/lib/user-sub-path";
import { getVisitorCountryCode } from "@/lib/visitor-country";

export const metadata: Metadata = {
  title: "Peakd — Discover surf session clips",
  description:
    "Discover and claim surf session clips from videographers around the world.",
};

export default async function HomePage() {
  const session = await auth0.getSession();
  if (session?.user?.sub) {
    redirect(`/${userSubToPathSegment(session.user.sub)}`);
  }

  const headerList = await headers();
  const visitorCountry = getVisitorCountryCode(headerList);

  let data = EMPTY_LANDING_PAGE;
  try {
    data = await fetchLandingPageData({
      countryCode: visitorCountry,
      wavesLimit: 8,
      sessionsLimit: 4,
    });
  } catch {
    data = { ...EMPTY_LANDING_PAGE, visitorCountryCode: visitorCountry };
  }

  if (!data.visitorCountryCode && visitorCountry) {
    data = { ...data, visitorCountryCode: visitorCountry };
  }

  return <LandingPage data={data} />;
}
