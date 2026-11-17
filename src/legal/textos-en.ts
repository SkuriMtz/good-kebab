import type { DatosLegales } from "@/lib/legal";
import type { Documento } from "./textos-es";

/**
 * Courtesy English translation of the privacy notice and the terms. Same
 * structure and same content as the Spanish version (src/legal/textos-es.ts),
 * which prevails. If one changes, change the other.
 */

const CORTESIA = "This is a courtesy translation. If there is any difference, the Spanish version prevails.";

export function privacyEn(d: DatosLegales): Documento {
  return {
    titulo: "Privacy notice",
    nota: CORTESIA,
    resumen:
      "What data Atendel stores, what it uses it for, who it is shared with, and how you can view, correct or delete yours. No fine print: if something is not listed here, we do not do it.",
    secciones: [
      {
        titulo: "Who is responsible for your data",
        parrafos: [
          `${d.responsable}, located at ${d.domicilio}, is responsible for processing the personal data collected through Atendel (this site and its dashboard), in accordance with Mexico's Federal Law on the Protection of Personal Data Held by Private Parties and its regulations.`,
          `For anything related to this notice, write to us at ${d.correo}.`,
        ],
      },
      {
        titulo: "What data we store",
        parrafos: ["Only what is needed for Atendel to work:"],
        lista: [
          "Your account: your email and, if you sign in with Google, your name.",
          "Your business: what you write in your profile (what you do, services and prices, hours, location, payment methods, policies and tone), your Rules, Processes and Memory, and the documents you upload.",
          "Your conversations with Atendel and what it leaves for you to review (drafts, files, reports).",
          "The apps you connect (for example Gmail, Outlook, Google Calendar or WhatsApp): the permission you give us to use them is stored encrypted (AES-256-GCM) and is only used by the server. From those apps we read only what is needed for what you ask or for what you let Atendel do on its own (new emails, your calendar, messages).",
          "Your settings and preferences (language, notifications, hours), the devices where you turned on notifications and, if you connect it, the WhatsApp number where you want to receive alerts.",
          "Usage and security data: how much AI you use (for your plan's limits) and a log of suspicious activity. From your connection we store only an encrypted summary of the IP address (a hash), never the IP itself.",
          "If you join the waitlist or write to us through the contact form: your email and, if you provide them, your name, your business and your message.",
        ],
      },
      {
        titulo: "Your customers' data",
        parrafos: [
          "When you connect your WhatsApp, your email or your calendar, Atendel sees data about your customers (names, phone numbers, emails, messages and appointments). That data belongs to your business: you are the controller toward your customers, and Atendel only processes it on your behalf, to serve them the way you configure it. It is up to you to tell them how you use their data and, if needed, to ask for their consent.",
          "If your customers send you sensitive data (for example, health data), Atendel processes it only to handle their message and with the same protections. We do not use it for anything else.",
        ],
      },
      {
        titulo: "What we use it for",
        parrafos: ["Purposes necessary to provide the service:"],
        lista: [
          "Create your account and let you sign in without a password (with a code sent to your email or with Google).",
          "Let Atendel reply, organize and do what you ask or what you allowed it to do on its own, using your Rules and your data.",
          "Notify you about what matters (in the dashboard, with notifications or by WhatsApp, as you choose).",
          "Measure your usage to respect your plan's limits.",
          "Keep things secure: detect abuse, stop unusual attempts and protect your account.",
        ],
        despues: [
          "Additional purpose: if you joined the waitlist, to let you know when Atendel is available. You can ask us to stop writing to you at any time.",
          "We do not sell your data, we do not use it for advertising, and we do not share it so that others can contact you.",
        ],
      },
      {
        titulo: "Who we share it with",
        parrafos: [
          "To work, Atendel uses providers that process data on our behalf and only to provide you the service. Some are in the United States, so your data is stored in or passes through that country:",
        ],
        lista: [
          "Supabase: database, files and sign-in (servers in the United States).",
          "Vercel: where the site and the dashboard run.",
          "Anthropic: the artificial intelligence that reads the text needed to reply. Under its business terms, it does not use this data to train its models.",
          "Meta (WhatsApp): to receive and send WhatsApp messages, if you connect your number or turn on WhatsApp alerts.",
          "The notification services of your browser or phone (Google, Apple, Mozilla or Microsoft), if you turn on alerts.",
        ],
        despues: [
          "In addition, when you connect an app (Google, Microsoft, Shopify or others), Atendel communicates with it to do what you ask. What that app does with your data is governed by its own privacy notice.",
          "We would only share data with an authority if the law requires us to.",
        ],
      },
      {
        titulo: "How long we keep it",
        parrafos: [
          "For as long as you have your account. Some technical records are deleted automatically sooner: for example, the mark on already reviewed emails after 14 days, app failure records after 7 days and the security log after 90 days.",
          "If you delete your account, your data and your files are deleted. A copy may remain in our providers' backups for a limited time, until they are overwritten.",
        ],
      },
      {
        titulo: "Your rights (ARCO) and how to exercise them",
        parrafos: [
          "You have the right to know what data we hold (Access), to correct it (Rectification), to ask us to delete it (Cancellation) and to object to a use (Opposition). You can also withdraw your consent or limit the use of your data.",
          "The fastest way is from your dashboard: export your data to a file or delete your account with everything in it (Settings → Privacy), and correct your profile (Your business).",
          `Or write to us at ${d.correo} with your name, your account email and what you are asking for. We will reply within a maximum of 20 business days and, if your request is granted, carry it out within the following 15 business days.`,
          "If you believe we did not handle your request properly, you can go to the personal data protection authority.",
        ],
      },
      {
        titulo: "Cookies and browser storage",
        parrafos: [
          "Atendel uses only what is necessary to work; it does not use advertising cookies or third-party tracking cookies:",
        ],
        lista: [
          "Your session cookie (so you stay signed in).",
          "A cookie that remembers the language you chose.",
          "A cookie that identifies this device with a random code (we store only its hash) to warn you if someone signs in to your account from somewhere else.",
          "A temporary cookie while you connect an app (it lasts 10 minutes).",
          "In your browser's storage: your theme (light or dark) and how you arranged the dashboard.",
        ],
        despues: ["If you block them in your browser, you will not be able to sign in to the dashboard."],
      },
      {
        titulo: "How we protect your data",
        lista: [
          "Everything travels encrypted (HTTPS) and your apps' permissions are stored encrypted.",
          "Each account can only see its own data: the database checks this on every query.",
          "What comes from outside (emails, messages, web pages) is treated as data, never as an order: nothing involving money goes out without your OK.",
          "Attempt limits, a security log and automatic checks on every code change.",
        ],
      },
      {
        titulo: "Minors",
        parrafos: ["Atendel is for businesses and for people over 18 years of age. We do not knowingly collect data from minors."],
      },
      {
        titulo: "Changes to this notice",
        parrafos: [
          "If we change something important, we will publish it here with the new date and let you know in the dashboard or by email before it applies.",
        ],
      },
    ],
  };
}

export function termsEn(d: DatosLegales): Documento {
  return {
    titulo: "Terms of use",
    nota: CORTESIA,
    resumen: "The rules for using Atendel: what it does, what is up to you and what is up to us.",
    secciones: [
      {
        titulo: "Who we are",
        parrafos: [
          `Atendel is a service of ${d.responsable}, located at ${d.domicilio}. By creating your account or using Atendel you accept these terms. If you do not agree, do not use it.`,
        ],
      },
      {
        titulo: "What Atendel is",
        parrafos: [
          "Atendel is an AI assistant for businesses: it answers your WhatsApp and your email, organizes your calendar, prepares documents and alerts you to what matters, following your Rules and using the apps you connect. Four specialists work inside (Lola, Clara, Víctor and Iris), but you only talk to Atendel.",
        ],
      },
      {
        titulo: "Your account",
        lista: [
          "You sign in with a code sent to your email or with Google; there is no password. Protect access to your email: whoever has it can get into your account.",
          "The account is for one business and is managed by a person over 18 who has the authority to use it.",
          "You can sign out on all your devices and delete your account at any time from Settings.",
        ],
      },
      {
        titulo: "Plans and prices",
        parrafos: [
          "The plans and what each one includes are on the Pricing page. The Free plan costs nothing. Today Atendel charges nothing: if a plan ever has a cost, the price will be published beforehand and will only be charged if you accept it. You will be able to cancel at any time.",
          "Each plan has weekly AI usage limits. When you reach the limit, work done on its own pauses until it renews; we warn you beforehand.",
          "You cannot change your plan or your limits on your own beyond what the dashboard offers.",
        ],
      },
      {
        titulo: "The AI can make mistakes",
        parrafos: [
          "Atendel uses artificial intelligence and can make mistakes. Review anything important before sending it to a customer. Anything involving money (charges, payments, discounts, refunds) always asks for your OK.",
          "You decide what it does on its own in «What it does on its own» (Settings). What you allow it to do without asking you, and what you approve, is your decision and your responsibility.",
        ],
      },
      {
        titulo: "Your apps and your customers",
        lista: [
          "When you connect an app you give us permission to use it for what you ask; you can remove it at any time in Your business → Apps. That app has its own terms, which also apply.",
          "You are responsible for your customers' data and for having their permission to contact them (for example, by WhatsApp), in accordance with the law and each platform's policies.",
          "What you upload and what Atendel prepares for you is yours. You give us permission to process it only to provide you the service.",
        ],
      },
      {
        titulo: "What is not allowed",
        lista: [
          "Using Atendel to send unwanted bulk messages (spam), to deceive, to harass or to do anything illegal.",
          "Trying to access other people's accounts or data, bypassing the limits, or attacking, overloading or copying the service.",
          "Using Atendel to give medical, legal or financial diagnoses as if they came from a professional.",
        ],
        despues: ["If any of this happens, we may pause or close the account. When possible, we will warn you beforehand and explain why."],
      },
      {
        titulo: "Availability and liability",
        parrafos: [
          "We work to keep Atendel running at all times, but there may be failures or pauses, including from third-party services (such as WhatsApp, Google, Microsoft or the AI provider). We do not guarantee that it will work without interruption.",
          "To the extent the law allows, we are not liable for indirect losses or for decisions you make based on what the AI suggests without reviewing it. None of this limits the rights the law gives you as a consumer.",
        ],
      },
      {
        titulo: "The brand and the software",
        parrafos: ["Atendel, its name, its characters and its software are ours. Using them does not give you any rights over them."],
      },
      {
        titulo: "Changes",
        parrafos: [
          "If we change these terms, we will publish the new version here with its date and let you know beforehand in the dashboard or by email. If you keep using Atendel after the change, you accept it; if you do not agree, you can delete your account.",
        ],
      },
      {
        titulo: "Law and courts",
        parrafos: [
          `These terms are governed by the laws of Mexico. We try to resolve any disagreement first by talking; if that is not possible, the courts of ${d.jurisdiccion} will resolve it, without prejudice to your rights before the Federal Consumer Protection Agency (Profeco).`,
        ],
      },
      {
        titulo: "Contact",
        parrafos: [`Write to us at ${d.correo}.`],
      },
    ],
  };
}
