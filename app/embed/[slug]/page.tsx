import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ theme?: string }>;
}

export default async function EmbedRedirect({ params, searchParams }: Props) {
  const { slug } = await params;
  const { theme } = await searchParams;
  const query = theme ? `?theme=${theme}` : "";
  redirect(`/api/embed/${slug}${query}`);
}
