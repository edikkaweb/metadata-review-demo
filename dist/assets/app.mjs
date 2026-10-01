import {
  initialState,
  transition,
  controls,
  stateFromHash,
  presetLink,
  exportSession,
  reviewCSV,
} from "./engine.mjs";
import {
  frameHTML,
  workspaceHTML,
  checksHTML,
  verdictHTML,
  stateHTML,
  historyHTML,
} from "./render.mjs";
let lang = document.documentElement.lang,
  state,
  data,
  blobURL;
const $ = (id) => document.getElementById(id),
  t = (fr, en) => (lang === "en" ? en : fr);
function announce(message) {
  $("live").textContent = message;
}
function clearOutput() {
  if (blobURL) URL.revokeObjectURL(blobURL);
  blobURL = null;
  $("output").hidden = true;
  $("export-value").value = "";
  $("download").removeAttribute("href");
  $("download").hidden = true;
}
function panels() {
  $("checks").innerHTML = checksHTML(state, lang);
  $("verdict").innerHTML = verdictHTML(state, lang);
  $("state-panel").innerHTML = stateHTML(state, lang);
  $("history").innerHTML = historyHTML(state, lang);
  const b = $("lock-action");
  b.dataset.action = state.lock ? "unlock" : "lock";
  b.textContent = state.lock
    ? t("Lever le verrou", "Unlock")
    : t("Verrouiller la valeur", "Lock the value");
  clearOutput();
}
function renderCase() {
  $("workspace").innerHTML = workspaceHTML(state, lang);
  $("workspace").disabled = false;
  clearOutput();
}
function fail(e) {
  const messages = {
    reason_required: t(
      "Ajoutez un motif court avant cette décision.",
      "Add a short reason before this decision.",
    ),
    reason_length: t(
      "Le motif dépasse 800 caractères.",
      "The reason exceeds 800 characters.",
    ),
    text_length: t(
      "Chaque champ est limité à 2 000 caractères.",
      "Each field is limited to 2,000 characters.",
    ),
    deterministic_block: t(
      "Corrigez les champs vides ou les variables non remplacées.",
      "Correct empty fields or unresolved variables.",
    ),
    apply_before_lock: t(
      "Approuvez cette combinaison puis appliquez-la dans la simulation avant de la verrouiller.",
      "Approve this combination, then apply it in the simulation before locking.",
    ),
    share_free_text: t(
      "Le texte libre n’est jamais placé dans un lien. Exportez le JSON, ou choisissez une proposition prédéfinie.",
      "Free text is never placed in a link. Export JSON, or choose a predefined proposal.",
    ),
  };
  $("error").textContent =
    messages[e.message] ||
    t(
      "Cet état n’est pas disponible. Revenez à l’exemple initial.",
      "This state is unavailable. Return to the initial example.",
    );
  $("error").hidden = false;
  if (e.message === "reason_required") $("reason").focus();
}
function dispatch(event, full = false) {
  try {
    $("error").hidden = true;
    state = transition(state, event);
    if (full) renderCase();
    else panels();
    announce(
      t(
        "Simulation mise à jour. Décision et valeur conservée sont indiquées sous les actions.",
        "Simulation updated. Decision and retained value are shown below the actions.",
      ),
    );
  } catch (e) {
    fail(e);
  }
}
function output(value, name, type) {
  clearOutput();
  $("output").hidden = false;
  $("output-label").textContent = name;
  $("export-value").value = value;
  if (type) {
    blobURL = URL.createObjectURL(new Blob([value], { type }));
    $("download").href = blobURL;
    $("download").download = name;
    $("download").hidden = false;
  }
  $("export-value").focus();
}
function bind() {
  document.addEventListener("input", (event) => {
    if (["proposal-title", "proposal-description"].includes(event.target.id))
      dispatch({
        type: "edit",
        title: $("proposal-title").value,
        description: $("proposal-description").value,
      });
  });
  document.addEventListener("change", (event) => {
    if (event.target.id === "source-variant") {
      const id = event.target.value;
      dispatch({ type: "source", id }, true);
      $("source-variant").focus();
    }
  });
  document.addEventListener("click", async (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    if (b.dataset.case) {
      $("error").hidden = true;
      $("recover").hidden = true;
      state = initialState(b.dataset.case, lang);
      renderCase();
      $("workspace").querySelector(`[data-case="${state.scenario}"]`).focus();
      announce(
        t("Nouveau scénario fictif chargé.", "New fictional scenario loaded."),
      );
    } else if (b.dataset.preset) {
      dispatch({ type: "preset", id: b.dataset.preset }, true);
      $("workspace")
        .querySelector(`[data-preset="${b.dataset.preset}"]`)
        .focus();
    } else if (b.dataset.action) {
      const action = b.dataset.action;
      dispatch({ type: action, reason: $("reason").value }, action === "reset");
      if (action === "reset")
        $("workspace").querySelector('[data-action="reset"]').focus();
    } else if (b.id === "language") {
      lang = lang === "fr" ? "en" : "fr";
      document.documentElement.lang = lang;
      document.title = t(
        "Peut-on publier ce titre ? — Edikka",
        "Can we publish this title? — Edikka",
      );
      document.body.innerHTML = frameHTML(state, data, lang);
      $("workspace").disabled = false;
      $("language").focus();
      announce(
        t(
          "Interface en français. Les textes et décisions du scénario sont conservés.",
          "Interface in English. Scenario texts and decisions are preserved.",
        ),
      );
    } else if (b.id === "recover") {
      state = initialState("promise", lang);
      history.replaceState(null, "", location.pathname);
      $("error").hidden = true;
      $("recover").hidden = true;
      renderCase();
      announce(t("Exemple initial rétabli.", "Initial example restored."));
    } else if (b.id === "share-button") {
      try {
        output(
          presetLink(location.href, state),
          t(
            "Lien d’une variante publique, sans décision ni texte libre",
            "Link to a public variant, without decisions or free text",
          ),
        );
        announce(
          t("Lien prédéfini prêt à copier.", "Predefined link ready to copy."),
        );
      } catch (e) {
        fail(e);
      }
    } else if (b.id === "export-json") {
      try {
        const snapshot = structuredClone(state);
        output(
          JSON.stringify(
            await exportSession(snapshot, data.provenance),
            null,
            2,
          ) + "\n",
          `edikka-simulation-${state.scenario}.json`,
          "application/json",
        );
        announce(
          t(
            "Export JSON exact affiché, sélectionnable et téléchargeable.",
            "Exact JSON export displayed, selectable and downloadable.",
          ),
        );
      } catch (e) {
        fail(e);
      }
    } else if (b.id === "export-csv") {
      output(
        reviewCSV(state, data.reviewColumns),
        `edikka-simulation-${state.scenario}.csv`,
        "text/csv;charset=utf-8",
      );
      announce(
        t(
          "CSV de simulation prêt. Les valeurs exactes restent dans le JSON.",
          "Simulation CSV ready. Exact values remain in JSON.",
        ),
      );
    }
  });
}
try {
  const response = await fetch(new URL("../data/corpus.json", import.meta.url));
  if (!response.ok) throw Error("data");
  data = await response.json();
  let invalid = false;
  try {
    state = stateFromHash(location.hash, lang);
  } catch {
    state = initialState("promise", lang);
    invalid = true;
  }
  renderCase();
  bind();
  announce(
    t(
      "Simulation locale prête. Aucun texte envoyé à un serveur.",
      "Local simulation ready. No text is sent to a server.",
    ),
  );
  if (invalid) {
    fail(Error("invalid_link"));
    $("recover").hidden = false;
  }
} catch {
  announce(
    t(
      "Les commandes n’ont pas pu être chargées. Les exemples et les sources restent consultables ci-dessous.",
      "Controls could not load. Examples and sources remain available below.",
    ),
  );
}
