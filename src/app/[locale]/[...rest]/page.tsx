import { notFound } from "next/navigation";

// Called while prerendering, so the response keeps the 404 status
export default function Page() {
  notFound();
}
