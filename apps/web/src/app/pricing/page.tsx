import { ComingSoon } from "@/components/coming-soon";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ComingSoon version="0.2.2" />;
}
