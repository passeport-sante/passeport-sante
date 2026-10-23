import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("[contact] Variables SMTP manquantes dans .env");
    return NextResponse.json({ error: "Configuration SMTP manquante" }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: (process.env.SMTP_PORT ?? "465") === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${name}" <${process.env.SMTP_USER}>`,
      replyTo: email,
      to: "contact@lepasseportsante.fr",
      subject: `[Contact] Message de ${name}`,
      text: message,
      html: `<p><strong>Prénom :</strong> ${name}</p>
             <p><strong>Email :</strong> ${email}</p>
             <p><strong>Message :</strong><br/>${message.replace(/\n/g, "<br/>")}</p>`,
    });
  } catch (err) {
    console.error("[contact] Erreur SMTP :", err);
    return NextResponse.json({ error: "Échec de l'envoi" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
