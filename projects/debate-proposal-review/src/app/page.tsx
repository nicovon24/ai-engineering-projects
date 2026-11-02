import { ReviewApp } from "./review-app";

export default function Home() {
  return <ReviewApp key="chat" mode="chat" providerReady={Boolean(process.env.GROQ_API_KEY)} />;
}
