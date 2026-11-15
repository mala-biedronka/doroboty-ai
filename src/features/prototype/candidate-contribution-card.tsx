import { AlertCircle, ArrowUpRight } from "lucide-react";

export type CandidateContribution = {
  scope: string;
  decisions: string;
  context: string;
  result: string;
  clarify: string;
};

const contributions: Record<string, CandidateContribution> = {
  "candidate-anna": {
    scope:
      "Prowadzenie rozwoju narzędzia dla zespołów operacyjnych — od badań i problem framingu po wdrożenie asystenta do obsługi zgłoszeń.",
    decisions:
      "Samodzielnie ustaliłam priorytety na podstawie badań z 18 użytkownikami, zaprojektowałam eksperyment i uzgodniłam zakres pierwszego wdrożenia z zespołem technicznym.",
    context:
      "Projekt łączył discovery, analitykę i pracę z zespołem inżynieryjnym. Trudność polegała na pogodzeniu potrzeb operacji z ograniczeniami danych i bezpieczeństwa.",
    result: "Skrócenie czasu obsługi zgłoszeń o 30% po wdrożeniu asystenta.",
    clarify:
      "Warto doprecyzować, jaka część efektu wynikała z automatyzacji, a jaka ze zmiany procesu pracy zespołu.",
  },
  "candidate-marek": {
    scope:
      "Rozwój platformy B2B i automatyzacja obsługi zgłoszeń — od warsztatów z użytkownikami po prowadzenie backlogu i wdrożenie.",
    decisions:
      "Prowadziłem warsztaty z użytkownikami, zdecydowałem o kolejności prac w backlogu i koordynowałem zakres wdrożenia z zespołem.",
    context:
      "Projekt dotyczył produktu B2B używanego w codziennej obsłudze klientów. Trudność wynikała z potrzeby usprawnienia procesu bez utraty kontroli po stronie operatorów.",
    result: "Skrócenie czasu odpowiedzi o 25% dzięki automatyzacji obsługi zgłoszeń.",
    clarify:
      "Do doprecyzowania pozostaje zakres decyzji podejmowanych samodzielnie oraz sposób pomiaru rezultatu.",
  },
};

const fallback: CandidateContribution = {
  scope: "Zakres pracy nie został jeszcze opisany.",
  decisions: "Brak informacji o samodzielnych decyzjach.",
  context: "Brak opisu kontekstu i trudności projektu.",
  result: "Brak potwierdzonego rezultatu.",
  clarify: "Uzupełnij kartę własnego wkładu, aby pracodawca mógł lepiej ocenić Twoją rolę.",
};

const items = [
  { key: "scope", label: "Zakres pracy" },
  { key: "decisions", label: "Samodzielne decyzje" },
  { key: "context", label: "Kontekst i trudność" },
  { key: "result", label: "Osiągnięty rezultat" },
] as const;

export function getCandidateContribution(personId: string): CandidateContribution {
  return { ...(contributions[personId] ?? fallback) };
}

export function parseCandidateContribution(sourceNotes: string, personId: string) {
  try {
    const parsed = JSON.parse(sourceNotes) as Partial<CandidateContribution>;
    if (
      Object.keys(fallback).every(
        (key) => typeof parsed[key as keyof CandidateContribution] === "string",
      )
    ) {
      return parsed as CandidateContribution;
    }
  } catch {
    // Older applications do not contain the contribution card yet.
  }
  return getCandidateContribution(personId);
}

export function candidateContributionToText(
  candidateName: string,
  contribution: CandidateContribution,
) {
  return [
    `Karta własnego wkładu kandydata — ${candidateName}`,
    "",
    `Zakres pracy\n${contribution.scope}`,
    `Samodzielne decyzje\n${contribution.decisions}`,
    `Kontekst i trudność\n${contribution.context}`,
    `Osiągnięty rezultat\n${contribution.result}`,
    `Luki lub elementy do doprecyzowania\n${contribution.clarify}`,
  ].join("\n\n");
}

export function CandidateContributionCard({
  value,
  onChange,
  disabled = false,
  readOnly = false,
}: {
  value: CandidateContribution;
  onChange?: (key: keyof CandidateContribution, value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <section
      className="candidate-contribution ph-no-capture"
      data-ph-no-capture="true"
      aria-labelledby="contribution-title"
    >
      <div className="candidate-contribution-header">
        <div>
          <p className="candidate-contribution-kicker">E01 · dowód własnego wkładu</p>
          <h3 id="contribution-title">Karta własnego wkładu</h3>
          <p>
            Pomaga pracodawcy zobaczyć nie tylko efekt projektu, ale też Twoją rolę w jego
            osiągnięciu.
          </p>
        </div>
        <span className="candidate-contribution-signal">
          <span aria-hidden="true" /> Do oceny
        </span>
      </div>

      <div className="candidate-contribution-grid">
        {items.map(({ key, label }) => (
          <div className="candidate-contribution-item" key={key}>
            <div className="candidate-contribution-label">
              <span>{label}</span>
            </div>
            {readOnly ? (
              <p className="candidate-contribution-readonly-value">{value[key]}</p>
            ) : (
              <textarea
                aria-label={label}
                name={`contribution-${key}`}
                value={value[key]}
                disabled={disabled}
                onChange={(event) => onChange?.(key, event.target.value)}
                rows={key === "scope" || key === "context" ? 3 : 4}
              />
            )}
          </div>
        ))}
      </div>

      <div className="candidate-contribution-clarify">
        <AlertCircle aria-hidden="true" />
        <div>
          <strong>Luki lub elementy do doprecyzowania</strong>
          {readOnly ? (
            <p className="candidate-contribution-readonly-value">{value.clarify}</p>
          ) : (
            <textarea
              aria-label="Luki lub elementy do doprecyzowania"
              name="contribution-clarify"
              value={value.clarify}
              disabled={disabled}
              onChange={(event) => onChange?.("clarify", event.target.value)}
              rows={3}
            />
          )}
        </div>
        <ArrowUpRight aria-hidden="true" className="candidate-contribution-arrow" />
      </div>
    </section>
  );
}
