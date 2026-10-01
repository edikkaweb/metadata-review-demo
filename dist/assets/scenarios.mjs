const L = (fr, en) => ({ fr, en });
export const SCENARIO_VERSION = "1.0.0";
export function scenarios(lang = "fr") {
  const en = lang === "en",
    t = (fr, enText) => (en ? enText : fr);
  const existing = {
    title: t(
      "Audit web : méthode et livrables | Atelier Orbe",
      "Web audit: method and deliverables | Atelier Orbe",
    ),
    description: t(
      "Découvrez le périmètre de l’audit web : analyse technique, rapport et restitution.",
      "Explore the web audit scope: technical analysis, report and review meeting.",
    ),
  };
  const source = (id, text, facts, unknown = [], extra = {}) => ({
    id,
    text,
    facts,
    unknown,
    ...extra,
  });
  const baseText = t(
    "Atelier Orbe réalise un audit web. La prestation comprend une analyse technique, un rapport priorisé et une réunion de restitution.",
    "Atelier Orbe provides a web audit. The service includes a technical analysis, a prioritised report and a review meeting.",
  );
  const base = source("base", baseText, { free: null, deliveryHours: null }, [
    t("Tarif non documenté", "Price not documented"),
    t("Délai non documenté", "Delivery time not documented"),
  ]);
  const free = source(
    "free",
    baseText +
      t(
        " Cet audit est gratuit. Aucun délai de livraison n’est annoncé.",
        " This audit is free. No delivery time is stated.",
      ),
    { free: true, deliveryHours: null },
    [t("Délai non documenté", "Delivery time not documented")],
  );
  const paid = source(
    "paid",
    baseText +
      t(
        " Cet audit est non gratuit : un devis est requis.",
        " This audit is not free: a quote is required.",
      ),
    { free: false, deliveryHours: null },
    [t("Délai non documenté", "Delivery time not documented")],
  );
  const known = (
    title,
    description,
    claims = { title: [], description: [] },
  ) => ({ title, description, claims });
  const neutral = known(existing.title, existing.description);
  const freeOnly = known(
    t("Audit web gratuit | Atelier Orbe", "Free web audit | Atelier Orbe"),
    t(
      "Un audit web gratuit avec analyse technique, rapport priorisé et restitution.",
      "A free web audit with technical analysis, a prioritised report and a review meeting.",
    ),
    {
      title: [{ fact: "free", value: true, term: t("gratuit", "Free") }],
      description: [{ fact: "free", value: true, term: t("gratuit", "free") }],
    },
  );
  const promise = known(
    t(
      "Audit gratuit en 24 h | Atelier Orbe",
      "Free audit in 24 hours | Atelier Orbe",
    ),
    t(
      "Recevez gratuitement votre audit web complet sous 24 h, avec rapport et restitution.",
      "Get your complete web audit free within 24 hours, with a report and review meeting.",
    ),
    {
      title: [
        { fact: "free", value: true, term: t("gratuit", "Free") },
        { fact: "deliveryHours", value: 24, term: t("24 h", "24 hours") },
      ],
      description: [
        { fact: "free", value: true, term: t("gratuitement", "free") },
        { fact: "deliveryHours", value: 24, term: t("24 h", "24 hours") },
      ],
    },
  );
  const common = {
    version: SCENARIO_VERSION,
    locale: lang,
    company: "Atelier Orbe",
    fictional: true,
    url: "https://atelier-orbe.example/audit-web",
    existing,
    sources: { base },
    defaultSource: "base",
    proposals: { initial: neutral, corrected: neutral },
    defaultProposal: "initial",
    initialApproval: false,
    locked: false,
  };
  const make = (id, label, summary, props) => ({
    ...structuredClone(common),
    id,
    label,
    summary,
    ...props,
  });
  const nearTitle = t(
    "Audit web : méthode et livrables | Atelier Orbe Lyon",
    "Web audit: method and deliverables | Atelier Orbe Lyon",
  );
  const pages = (legitimate) => [
    {
      url: "https://atelier-orbe.example/audit-web-lyon",
      title: nearTitle,
      intent: legitimate
        ? t("Audit sur place à Lyon", "On-site audit in Lyon")
        : t(
            "Même audit distant, même public",
            "Same remote audit, same audience",
          ),
      content: legitimate
        ? t(
            "À Lyon, la réunion de restitution a lieu dans les locaux du client. La page nationale présente la prestation à distance.",
            "In Lyon, the review meeting takes place at the client’s office. The national page describes the remote service.",
          )
        : t(
            "La seconde page reprend la même prestation à distance. Aucune différence de public ni de livrable n’est documentée.",
            "The second page repeats the same remote service. No audience or deliverable difference is documented.",
          ),
    },
  ];
  const validText =
    baseText +
    t(
      " Cet audit est gratuit. Le rapport est livré sous 24 heures après réception des accès.",
      " This audit is free. The report is delivered within 24 hours after access is received.",
    );
  const timed = known(
    t(
      "Audit gratuit : rapport sous 24 h après accès | Atelier Orbe",
      "Free audit: report within 24 hours of access | Atelier Orbe",
    ),
    t(
      "Un audit web gratuit ; rapport sous 24 heures après réception des accès, puis réunion de restitution.",
      "A free web audit; report within 24 hours after access is received, followed by a review meeting.",
    ),
    {
      title: [
        { fact: "free", value: true, term: t("gratuit", "Free") },
        {
          fact: "deliveryHours",
          value: 24,
          term: t("24 h après accès", "24 hours of access"),
        },
      ],
      description: [
        { fact: "free", value: true, term: t("gratuit", "free") },
        {
          fact: "deliveryHours",
          value: 24,
          term: t(
            "24 heures après réception des accès",
            "24 hours after access is received",
          ),
        },
      ],
    },
  );
  return [
    make(
      "promise",
      t("Promesse sans preuve", "Unsupported promise"),
      t(
        "« Gratuit » et « 24 h » : que peut-on réellement établir ?",
        "“Free” and “24 hours”: what can we actually establish?",
      ),
      {
        sources: { base, free, paid },
        proposals: { initial: promise, corrected: neutral, free: freeOnly },
        explanation: t(
          "Dans le cas initial, la source ne documente ni le tarif ni le délai. Cela rend la promesse non étayée dans les preuves disponibles, sans prouver qu’elle est fausse. Essayez la correction, puis la variante qui documente la gratuité.",
          "In the initial case, neither price nor delivery time is documented. The claim is unsupported by the available evidence, which does not prove it false. Try the correction, then the source variant documenting the free service.",
        ),
        expected: {
          controls: ["claim_unverified"],
          action: "human_review_required",
        },
      },
    ),
    make(
      "similar",
      t("Titres proches", "Similar titles"),
      t("Même vocabulaire, même intention ?", "Similar wording, same intent?"),
      {
        sources: {
          base: { ...base, otherPages: pages(true) },
          overlap: { ...base, id: "overlap", otherPages: pages(false) },
        },
        proposals: {
          initial: neutral,
          corrected: known(
            t(
              "Audit web à distance : méthode et livrables | Atelier Orbe",
              "Remote web audit: method and deliverables | Atelier Orbe",
            ),
            existing.description,
          ),
        },
        explanation: t(
          "La proximité des titres est calculée. Dans la variante initiale, le mode de restitution distingue les pages ; dans l’autre, cette distinction n’est pas documentée. La similarité seule ne démontre jamais une cannibalisation.",
          "Title similarity is calculated. In the initial variant, the review format distinguishes the pages; in the alternative, this distinction is undocumented. Similarity alone never establishes cannibalisation.",
        ),
        expected: {
          controls: ["title_similarity"],
          action: "human_review_required",
        },
      },
    ),
    make(
      "locked",
      t("Valeur verrouillée", "Locked value"),
      t(
        "Une nouvelle proposition ne remplace pas un verrou.",
        "A new proposal does not override a lock.",
      ),
      {
        locked: true,
        proposals: {
          initial: known(
            t(
              "Audit de votre site web | Atelier Orbe",
              "Your website audit | Atelier Orbe",
            ),
            existing.description,
          ),
          corrected: neutral,
        },
        protectedFixture: true,
        explanation: t(
          "La valeur existante a été validée puis verrouillée dans cette fiction. Le bouton d’application conserve cette valeur. Lever le verrou est une action distincte, motivée ; la proposition demande encore une revue.",
          "The existing value was approved and locked within this fiction. Applying the proposal preserves that value. Unlocking is a separate, reasoned action; the proposal still requires review.",
        ),
        expected: { controls: ["manual_lock"], action: "locked_preserved" },
      },
    ),
    make(
      "changed",
      t("Preuve modifiée", "Changed evidence"),
      t(
        "Une décision est liée à ce qui a été examiné.",
        "A decision is bound to what was reviewed.",
      ),
      {
        existing: { title: timed.title, description: timed.description },
        sources: {
          base: source(
            "base",
            validText,
            { free: true, deliveryHours: 24 },
            [],
            {
              condition: t(
                "Après réception des accès",
                "After access is received",
              ),
            },
          ),
          material: source(
            "material",
            baseText +
              t(
                " L’audit est désormais payant et le rapport est livré sous 72 heures après réception des accès.",
                " The audit now has a fee and the report is delivered within 72 hours after access is received.",
              ),
            { free: false, deliveryHours: 72 },
            [],
            {
              condition: t(
                "Après réception des accès",
                "After access is received",
              ),
            },
          ),
          cosmetic: source(
            "cosmetic",
            validText +
              t(
                " La réunion de restitution est aussi appelée réunion de synthèse.",
                " The review meeting is also called a summary meeting.",
              ),
            { free: true, deliveryHours: 24 },
            [],
            {
              condition: t(
                "Après réception des accès",
                "After access is received",
              ),
            },
          ),
        },
        proposals: { initial: timed, corrected: neutral },
        initialApproval: true,
        explanation: t(
          "L’approbation initiale est une donnée de scénario, sans auteur réel. Une nouvelle empreinte exige un réexamen. La variante matérielle contredit les promesses ; la variante de vocabulaire ne les contredit pas. Dans les deux cas, l’ancienne approbation ne couvre pas les nouvelles preuves.",
          "The initial approval is scenario data with no real reviewer. A new fingerprint requires review. The material variant contradicts the claims; the wording variant does not. In both cases, the old approval does not cover the new evidence.",
        ),
        expected: { controls: [], action: "no_change" },
      },
    ),
    make(
      "unchanged",
      t("Rien à changer", "No change needed"),
      t(
        "Rejouer n’est pas créer une nouvelle version.",
        "Replaying does not create a new version.",
      ),
      {
        initialApproval: true,
        explanation: t(
          "Les preuves, les valeurs et les règles sont inchangées. L’approbation fictive correspond à cette combinaison. Rejouer conserve la valeur et renvoie no_change, sans incrément de version éditoriale.",
          "Evidence, values and rules are unchanged. The fictional approval matches this combination. Replaying preserves the value and returns no_change without incrementing the editorial version.",
        ),
        expected: { controls: [], action: "no_change" },
      },
    ),
  ];
}
export const sourceLabels = {
  base: L("Source initiale", "Initial source"),
  free: L("Gratuité documentée", "Free service documented"),
  paid: L("Source : « non gratuit »", "Source: “not free”"),
  overlap: L(
    "Même intention, différence non documentée",
    "Same intent, no documented distinction",
  ),
  material: L(
    "Changement matériel : payant, 72 h",
    "Material change: fee, 72 hours",
  ),
  cosmetic: L(
    "Changement sans incidence sur les promesses",
    "Change that does not affect the claims",
  ),
};
export const proposalLabels = {
  initial: L("Proposition initiale", "Initial proposal"),
  corrected: L("Correction documentée", "Documented correction"),
  free: L("Promesse de gratuité seule", "Free-service claim only"),
};
