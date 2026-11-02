import { ReviewApp } from "../../review-app";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReviewApp key={id} mode="review" id={id} providerReady={Boolean(process.env.GROQ_API_KEY)} />;
}
