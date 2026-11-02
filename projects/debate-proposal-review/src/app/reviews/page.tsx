import { ReviewApp } from "../review-app";

export default function ReviewsPage() {
  return <ReviewApp key="history" mode="history" providerReady={Boolean(process.env.GROQ_API_KEY)} />;
}
