import { notFound } from "next/navigation";
import { getSessionByCode } from "@/lib/diagnostic";
import DiagnosticClient from "./DiagnosticClient";

type Props = {
  params: Promise<{ accessCode: string }>;
};

export default async function DiagnosticPage({ params }: Props) {
  const { accessCode } = await params;
  const session = await getSessionByCode(accessCode, { internal: true });

  if (!session || !session.isActive) notFound();

  return <DiagnosticClient session={session} />;
}
