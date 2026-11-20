
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import DetailsPage from "./details";
type PageProps = {
  params: Promise<{
    nomineeId: string;
  }>;
};

// Create a server-side Supabase client for metadata lookup.
// The public anon key is safe to use here; database access is still
// controlled by your Supabase Row Level Security policies.
async function getNomineeName(nomineeId: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing.");
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from("nominees")
    .select("name")
    .eq("id", nomineeId)
    .maybeSingle();

  if (error) {
    console.error("Unable to retrieve nominee metadata:", error.message);
    return null;
  }

  return data?.name ?? null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { nomineeId } = await params;
  const nomineeName = await getNomineeName(nomineeId);

  if (!nomineeName) {
    return {
      title: "Nominee Details | VoteSphere",
      description: "View nominee information, voting results, and comments on VoteSphere.",
    };
  }

  return {
    title: `${nomineeName} | VoteSphere`,
    description: `View ${nomineeName}'s nominee profile, manifesto, voting results, achievements, and voter comments on VoteSphere.`,
    openGraph: {
      title: `${nomineeName} | VoteSphere`,
      description: `Discover ${nomineeName}'s profile and voting results on VoteSphere.`,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${nomineeName} | VoteSphere`,
      description: `View ${nomineeName}'s nominee profile and voting results on VoteSphere.`,
    },
  };
}

export default async function NomineePage({ params }: PageProps) {
  const { nomineeId } = await params;

  return <DetailsPage nomineeId={nomineeId} />;
}
