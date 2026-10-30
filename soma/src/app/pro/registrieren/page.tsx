import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowRight, Check } from "lucide-react";
import { DocumentsManager } from "@/components/pro/documents-manager";
import { formatPercent, PROVIDER_STATUS_LABEL, PROVIDER_STATUS_TONE } from "@/components/pro/labels";
import { AvatarUpload } from "@/components/pro/media-upload";
import { AccountStep } from "@/components/pro/onboarding/account-step";
import { STEP_SLUG, WIZARD_STEPS, stepHref, type WizardSlug } from "@/components/pro/onboarding/steps";
import { AreaStep, HoursStep, ProfileStep, StepNav, SubmitForReview, WizardSteps } from "@/components/pro/onboarding/wizard-client";
import { PayoutButton } from "@/components/pro/payout-button";
import { buildRequirements } from "@/components/pro/requirements";
import { ServicesEditor } from "@/components/pro/services-editor";
import { ButtonLink } from "@/components/ui/button";
import { Notice, Status } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/ui/layout";
import { formatDateLong, formatPrice, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import { signOutAction } from "@/server/actions/auth";
import { getSession } from "@/server/auth/guards";
import type { ProOnboardingDTO } from "@/server/dto";
import { listCatalog, listCategories, lookupPostalCode } from "@/server/services/catalog";
import { getOnboardingState, getProProfile, getProSettings, getWeeklyHours, listDocuments, listProServices } from "@/server/services/pro";
import { getProviderTerms } from "@/server/services/pro-ext";

const TIPS: Record<WizardSlug, { title: string; body: ReactNode }> = {
  konto: {
    title: "Was dich erwartet",
    body: "Etwa 15 Minuten. Du kannst jederzeit unterbrechen – jeder Schritt wird gespeichert, und du machst beim nächsten Login dort weiter.",
  },
  profil: {
    title: "Ein Profil, das bucht",
    body: "Schreib so, wie du mit Kundschaft sprichst: wie du arbeitest, was du mitbringst, worauf man sich verlassen kann. Heilversprechen wie „lindert Schmerzen“ sind nicht erlaubt.",
  },
  leistungen: {
    title: "Deine Preise, deine Entscheidung",
    body: "Die Richtwerte zeigen, wo Preise auf SOMA beginnen. Kundschaft sieht immer den Endpreis inklusive Anfahrt – ohne Servicegebühr.",
  },
  einsatzgebiet: {
    title: "Nur so weit, wie du willst",
    body: "Du erscheinst nur in Suchen innerhalb deines Radius. Die Anfahrtspauschale geht vollständig an dich, ohne Provision.",
  },
  verfuegbarkeit: {
    title: "Ehrliche Zeiten zahlen sich aus",
    body: "Kundschaft bucht nur Zeiten, die du hier freigibst. Zwischen Terminen planen wir automatisch deinen Anfahrtspuffer ein.",
  },
  verifizierung: {
    title: "Warum wir prüfen",
    body: "Du arbeitest in privaten Wohnungen, Hotels und Büros. Geprüfte Identität, Gewerbe und Versicherung schützen dich und schaffen das Vertrauen, das Kundschaft die Tür öffnen lässt.",
  },
  auszahlung: {
    title: "Geld, auf das du dich verlassen kannst",
    body: "Die Kundschaft zahlt bei der Buchung per Karte. Dein Anteil ist 48 Stunden nach dem Termin verfügbar und wird über Stripe auf dein Konto überwiesen.",
  },
  pruefen: {
    title: "Was nach dem Einreichen passiert",
    body: "Das SOMA-Team prüft Profil und Dokumente, meist innerhalb von 48 Stunden. Du bekommst eine E-Mail, sobald du freigeschaltet bist.",
  },
};

function firstOpenSlug(onboarding: ProOnboardingDTO): WizardSlug {
  const open = onboarding.steps.find((s) => !s.done && s.key !== "payout");
  if (open) return STEP_SLUG[open.key];
  const payout = onboarding.steps.find((s) => s.key === "payout");
  return payout && !payout.done ? "auszahlung" : "pruefen";
}

export default async function ProRegisterPage({ searchParams }: PageProps<"/pro/registrieren">) {
  const sp = await searchParams;
  const session = await getSession();

  if (!session) {
    return (
      <WizardFrame current={0} title="Werde Profi auf SOMA." lead="Lege dein Konto an. Danach richtest du Profil, Leistungen und Verfügbarkeit ein." tip={TIPS.konto} aside={<AccountAside />}>
        <AccountStep />
      </WizardFrame>
    );
  }

  if (session.role !== "provider") {
    return (
      <Container width="form" className="flex flex-col gap-6 pt-12">
        <h1 className="type-heading-l">Du bist mit einem Kundenkonto angemeldet.</h1>
        <p className="type-body-s text-ink-muted">
          Ein Profi-Konto braucht eine eigene E-Mail-Adresse. Melde dich ab und registriere dich mit einer anderen Adresse als Profi.
        </p>
        <form action={signOutAction}>
          <button type="submit" className="inline-flex h-control items-center rounded-xs bg-ink px-5 type-label text-ink-inverse hover:bg-ink-hover">
            Abmelden
          </button>
        </form>
      </Container>
    );
  }

  const [profile, onboarding] = await Promise.all([getProProfile(session), getOnboardingState(session)]);
  if (profile.status === "approved") redirect(routes.pro.root());
  if (profile.status === "submitted" || profile.status === "in_review" || profile.status === "suspended") {
    const [settings, terms] = await Promise.all([getProSettings(session), getProviderTerms()]);
    return (
      <SubmittedView
        name={profile.displayName}
        onboarding={onboarding}
        payoutsEnabled={settings.payoutsEnabled}
        ownClientRate={terms.commission ? formatPercent(terms.commission.ownClientRate) : null}
      />
    );
  }

  const requested = WIZARD_STEPS.find((s) => s.slug === sp.schritt && s.slug !== "konto")?.slug;
  const slug: WizardSlug = requested ?? firstOpenSlug(onboarding);
  const index = WIZARD_STEPS.findIndex((s) => s.slug === slug);
  const prev = WIZARD_STEPS[index - 1]?.slug;
  const next = WIZARD_STEPS[index + 1]?.slug ?? "pruefen";
  const prevSlug = prev && prev !== "konto" ? prev : undefined;
  const done = (k: keyof typeof STEP_SLUG) => onboarding.steps.find((s) => s.key === k)?.done ?? false;
  const rejectedNote = profile.status === "rejected" ? (
    <Notice kind="warning" title="Bitte überarbeite dein Profil">
      {onboarding.lastDecisionNote ?? "Unser Team hat Rückfragen zu deinem Profil."} Danach kannst du es erneut einreichen.
    </Notice>
  ) : null;

  if (slug === "profil") {
    return (
      <WizardFrame current={index} title="Stell dich vor." lead="So erscheinst du in der Suche und auf deinem Profil." tip={TIPS.profil} notice={rejectedNote}>
        <div className="flex flex-col gap-10">
          <section className="flex flex-col gap-3">
            <h2 className="type-heading-m">Foto</h2>
            <AvatarUpload avatarUrl={profile.avatarUrl} name={profile.displayName} />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="type-heading-m">Über dich</h2>
            <ProfileStep profile={profile} next={next} />
          </section>
        </div>
      </WizardFrame>
    );
  }

  if (slug === "leistungen") {
    const [services, catalog, terms] = await Promise.all([listProServices(session), listCatalog(), getProviderTerms()]);
    const hasActive = services.some((s) => s.isActive);
    return (
      <WizardFrame current={index} title="Leistungen und Preise." lead="Wähle aus dem Katalog, was du anbietest. Dauer und Preis legst du selbst fest." tip={TIPS.leistungen} notice={rejectedNote}>
        <div className="flex flex-col gap-10">
          <ServicesEditor services={services} catalog={catalog} rates={terms.commission} />
          <StepNav back={prevSlug} next={next} canContinue={hasActive} hint="Lege mindestens eine buchbare Leistung an, um fortzufahren." />
        </div>
      </WizardFrame>
    );
  }

  if (slug === "einsatzgebiet") {
    const pc = profile.basePostalCode ? await lookupPostalCode(profile.basePostalCode) : null;
    return (
      <WizardFrame current={index} title="Dein Einsatzgebiet." lead="Von wo du startest, wie weit du fährst und was die Anfahrt kostet." tip={TIPS.einsatzgebiet} notice={rejectedNote}>
        <AreaStep profile={profile} cityLabel={pc?.cityName ?? null} next={next} />
      </WizardFrame>
    );
  }

  if (slug === "verfuegbarkeit") {
    const hours = await getWeeklyHours(session);
    return (
      <WizardFrame current={index} title="Wann du arbeitest." lead="Lege deine regelmäßigen Zeiten fest. Urlaub und freie Tage trägst du später im Kalender ein." tip={TIPS.verfuegbarkeit} notice={rejectedNote}>
        <HoursStep initial={hours} next={next} />
      </WizardFrame>
    );
  }

  if (slug === "verifizierung") {
    const [documents, services, categories, terms] = await Promise.all([listDocuments(session), listProServices(session), listCategories(), getProviderTerms()]);
    const requirements = buildRequirements(terms.baseRequiredDocuments, categories, services, onboarding.missingDocuments);
    return (
      <WizardFrame current={index} title="Verifizierung." lead="Lade die Nachweise hoch. Für manche Kategorien brauchen wir zusätzlich eine Qualifikation." tip={TIPS.verifizierung} notice={rejectedNote}>
        <div className="flex flex-col gap-10">
          <DocumentsManager requirements={requirements} documents={documents} />
          <StepNav back={prevSlug} next={next} canContinue={done("documents")} hint="Sobald alle benötigten Nachweise hochgeladen sind, geht es weiter. Die Prüfung selbst läuft danach." />
        </div>
      </WizardFrame>
    );
  }

  if (slug === "auszahlung") {
    const settings = await getProSettings(session);
    const devPayments = (process.env.PAYMENTS_PROVIDER ?? "dev") !== "stripe";
    return (
      <WizardFrame current={index} title="Auszahlungen einrichten." lead="Verbinde ein Konto, auf das wir deine Einnahmen überweisen." tip={TIPS.auszahlung} notice={rejectedNote}>
        <div className="flex flex-col gap-8">
          {settings.payoutsEnabled ? (
            <Notice kind="success" title="Auszahlungen sind eingerichtet.">
              {devPayments ? "Testmodus: Die Einrichtung wurde simuliert, es wurden keine echten Daten abgefragt." : "Dein Konto bei Stripe ist verbunden."}
            </Notice>
          ) : (
            <div className="flex flex-col gap-5">
              <ul className="flex flex-col gap-3">
                {["Identität bestätigen (Ausweis)", "IBAN für Überweisungen hinterlegen", "Steuerliche Angaben für die gesetzliche Meldung (DAC7)"].map((t) => (
                  <li key={t} className="flex items-start gap-3 type-body-s text-ink">
                    <Icon icon={Check} size={16} className="mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="type-body-s text-ink-muted">
                Das erledigst du sicher direkt bei unserem Zahlungspartner Stripe.{" "}
                {devPayments ? <strong className="font-semibold text-ink">Testmodus: Die Einrichtung wird hier nur simuliert – es werden keine echten Daten abgefragt.</strong> : null}
              </p>
              <PayoutButton label={devPayments ? "Auszahlung simulieren" : "Weiter zu Stripe"} />
            </div>
          )}
          <StepNav back={prevSlug} next={next} nextLabel={settings.payoutsEnabled ? "Weiter" : "Später einrichten"} />
        </div>
      </WizardFrame>
    );
  }

  // pruefen
  const openSteps = onboarding.steps.filter((s) => !s.done && s.key !== "payout").map((s) => s.label);
  const [services, hours, documents, settings] = await Promise.all([listProServices(session), getWeeklyHours(session), listDocuments(session), getProSettings(session)]);
  const activeServices = services.filter((x) => x.isActive);
  const days = new Set(hours.map((h) => h.weekday)).size;
  const meta: Record<keyof typeof STEP_SLUG, string> = {
    profile: [profile.displayName, profile.headline].filter(Boolean).join(" · "),
    services: activeServices.length ? activeServices.map((x) => `${x.serviceName} ${formatPrice(x.priceCents)}`).join(", ") : "Noch keine Leistung",
    area: profile.basePostalCode ? `${profile.basePostalCode} · ${profile.serviceRadiusKm} km Radius` : "Noch kein Standort",
    hours: days ? `${days} ${days === 1 ? "Tag" : "Tage"} pro Woche` : "Noch keine Zeiten",
    documents: `${documents.length} ${documents.length === 1 ? "Dokument" : "Dokumente"} hochgeladen`,
    payout: settings.payoutsEnabled ? "Eingerichtet" : "Noch nicht eingerichtet",
  };
  return (
    <WizardFrame current={index} title="Alles bereit?" lead="Prüf deine Angaben und reiche dein Profil ein." tip={TIPS.pruefen} notice={rejectedNote}>
      <div className="flex flex-col gap-10">
        <ul className="border-y border-line">
          {onboarding.steps.map((s) => (
            <li key={s.key} className="border-b border-line last:border-b-0">
              <Link href={stepHref(STEP_SLUG[s.key])} className="flex min-h-16 items-center gap-4 py-3 pr-1 hover:bg-surface-sunken">
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="type-body-s font-[520] text-ink">{s.label}</span>
                  <span className="line-clamp-2 type-caption text-ink-muted">{meta[s.key]}</span>
                  <Status tone={s.done ? "success" : s.key === "payout" ? "neutral" : "warning"}>
                    {s.done ? "Erledigt" : s.key === "payout" ? "Optional – kann später folgen" : "Offen"}
                  </Status>
                </span>
                <span className="type-label-s text-accent">{s.done ? "Ändern" : "Erledigen"}</span>
              </Link>
            </li>
          ))}
        </ul>
        {onboarding.missingDocuments.length ? (
          <Notice kind="info" title="Noch fehlende Nachweise">
            {onboarding.missingDocuments.map((d) => d.label).join(", ")}
          </Notice>
        ) : null}
        <SubmitForReview canSubmit={onboarding.canSubmit} openSteps={openSteps} />
      </div>
    </WizardFrame>
  );
}

function WizardFrame({
  current,
  title,
  lead,
  tip,
  aside,
  notice,
  children,
}: {
  current: number;
  title: string;
  lead: string;
  tip: { title: string; body: ReactNode };
  aside?: ReactNode;
  notice?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Container width="content" className="flex flex-col gap-8 pt-6 md:gap-10 md:pt-10">
      <WizardSteps current={current} />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-7">
          <header className="flex flex-col gap-2">
            <h1 className="type-heading-l">{title}</h1>
            <p className="type-body-s text-ink-muted">{lead}</p>
          </header>
          {notice}
          {children}
        </div>
        <aside className="flex flex-col gap-8 lg:col-span-4 lg:col-start-9">
          <div className="flex flex-col gap-3 lg:sticky lg:top-8">
            <span aria-hidden className="block h-0.5 w-6 bg-ink" />
            <h2 className="type-heading-s">{tip.title}</h2>
            <p className="type-body-s text-ink-muted">{tip.body}</p>
          </div>
          {aside}
        </aside>
      </div>
    </Container>
  );
}

async function AccountAside() {
  const terms = await getProviderTerms();
  const c = terms.commission;
  const rows = [
    { label: "Neukundschaft über SOMA", value: c ? formatPercent(c.rate) : "—" },
    { label: "Stammkundschaft", value: c ? formatPercent(c.repeatClientRate) : "—" },
    { label: "Eigene Kundschaft über deinen Link", value: c ? formatPercent(c.ownClientRate) : "—" },
    { label: "Anfahrt", value: "0 %" },
  ];
  return (
    <div className="flex flex-col gap-3">
      <h2 className="type-heading-s">Provision statt Grundgebühr</h2>
      <dl className="border-y border-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
            <dt className="type-body-s text-ink-muted">{r.label}</dt>
            <dd className="type-label num">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="type-caption text-ink-muted">Auszahlung {terms.payoutHoldHours} Stunden nach dem Termin. Keine Fixkosten, keine Mindestlaufzeit.</p>
      <Link href={routes.forPros()} className="inline-flex h-touch items-center gap-1.5 self-start type-label-s text-accent underline decoration-1 underline-offset-[0.2em]">
        Mehr über SOMA für Profis
      </Link>
    </div>
  );
}

function SubmittedView({ name, onboarding, payoutsEnabled, ownClientRate }: { name: string; onboarding: ProOnboardingDTO; payoutsEnabled: boolean; ownClientRate: string | null }) {
  const first = name.split(/\s+/)[0];
  const suspended = onboarding.status === "suspended";
  const steps = [
    { title: "Wir prüfen dein Profil", body: "Identität, Gewerbe, Versicherung und Qualifikation – meist innerhalb von 48 Stunden." },
    { title: "Du bekommst Bescheid", body: "Per E-Mail und hier in der App. Falls etwas fehlt, sagen wir dir genau, was." },
    { title: "Du wirst sichtbar", body: "Nach der Freischaltung erscheinst du in der Suche in deinem Einsatzgebiet." },
    { title: "Die erste Anfrage", body: "Du nimmst an oder lehnst ab – mit Countdown, damit niemand lange warten muss." },
  ];
  return (
    <Container width="content" className="flex flex-col gap-10 pt-10 md:pt-16">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-7">
          <div className="flex flex-col gap-4">
            <span aria-hidden className="block h-0.5 w-6 bg-ink" />
            <Status tone={PROVIDER_STATUS_TONE[onboarding.status]}>{PROVIDER_STATUS_LABEL[onboarding.status]}</Status>
            <h1 className="type-display-m">
              {suspended ? (
                "Dein Profil ist pausiert."
              ) : (
                <>
                  Danke, {first}.<br />
                  <em className="italic">Wir prüfen dein Profil.</em>
                </>
              )}
            </h1>
            <p className="type-body text-ink-muted">
              {suspended
                ? onboarding.lastDecisionNote ?? "Bei Fragen hilft dir der SOMA-Support."
                : onboarding.submittedAt
                  ? `Eingereicht am ${formatDateLong(onboarding.submittedAt)} um ${formatTime(onboarding.submittedAt)} Uhr.`
                  : "Dein Profil ist eingereicht."}
            </p>
          </div>
          {!suspended ? (
            <ol className="flex flex-col border-y border-line">
              {steps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-line py-4 last:border-b-0">
                  <span className="type-label num text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex flex-col gap-1">
                    <span className="type-body-s font-[520] text-ink">{s.title}</span>
                    <span className="type-body-s text-ink-muted">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={routes.pro.root()} size="l" iconRight={<Icon icon={ArrowRight} />}>
              Zur Profi-App
            </ButtonLink>
            <ButtonLink href={`${routes.pro.calendar()}?ansicht=abwesenheiten`} size="l" variant="secondary">
              Kalender pflegen
            </ButtonLink>
          </div>
        </div>
        <aside className="flex flex-col gap-6 lg:col-span-4 lg:col-start-9">
          {!payoutsEnabled ? (
            <Notice kind="warning" title="Auszahlungen noch offen">
              Richte dein Auszahlungskonto ein, damit wir dir nach dem ersten Termin dein Geld überweisen können. <Link href={routes.pro.earnings()}>Jetzt einrichten</Link>
            </Notice>
          ) : null}
          {onboarding.missingDocuments.length ? (
            <Notice kind="info" title="Fehlende Nachweise">
              {onboarding.missingDocuments.map((d) => d.label).join(", ")}. <Link href={routes.pro.verification()}>Hochladen</Link>
            </Notice>
          ) : null}
          <div className="flex flex-col gap-2">
            <h2 className="type-heading-s">Bis dahin</h2>
            <p className="type-body-s text-ink-muted">Pflege Portfolio und Abwesenheiten. Sobald du freigeschaltet bist, teilst du deinen Einladungslink mit deiner Stammkundschaft{ownClientRate ? ` – für sie zahlst du nur ${ownClientRate} Provision` : ""}.</p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
