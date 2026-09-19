import { ApiError } from "@/shared/api/apiFetch";
import type { SavePropertyProgress } from "../types/types";

export type SaveStep = {
  phase: SavePropertyProgress["phase"];
  title: string;
  weight?: number;
  write?: boolean;
  run: (report: (fraction: number, detail: string, title?: string) => void, acknowledge: (detail: string) => void) => Promise<unknown>;
};

export class PropertySaveError extends Error {
  constructor(message: string, public readonly requiresReview: boolean, public readonly propertyId?: string, public readonly fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "PropertySaveError";
  }
}

export const preparingProgress = (creating: boolean): SavePropertyProgress => ({
  status: "saving", phase: "preparing", percent: 0,
  title: creating ? "Förbereder fastigheten" : "Förbereder ändringarna", detail: "Kontrollerar uppgifterna inför sparning.",
});

// Only completed requests and measured upload bytes advance this weighted plan.
export async function runSaveSteps(steps: SaveStep[], onProgress: ((progress: SavePropertyProgress) => void) | undefined,
  successTitle: string, propertyId: () => string | undefined): Promise<void> {
  const total = steps.reduce((sum, step) => sum + (step.weight ?? 5), 0);
  const completed: string[] = [];
  let done = 0;
  let percent = 0;
  for (const [index, step] of steps.entries()) {
    let detail = "";
    let title = step.title;
    const report = (fraction: number, nextDetail: string, nextTitle = step.title) => {
      detail = [nextDetail, "Steg " + (index + 1) + " av " + steps.length].filter(Boolean).join(" · ");
      title = nextTitle;
      percent = Math.max(percent, Math.min(99, Math.floor(100 * (done + (step.weight ?? 5) * Math.max(0, Math.min(1, fraction))) / total)));
      onProgress?.({ status: "saving", phase: step.phase, percent, title, detail });
    };
    report(0, "");
    try {
      await step.run(report, message => completed.push(message));
      if (step.write !== false) completed.push(step.title);
      done += step.weight ?? 5;
    } catch (error) {
      const status = error instanceof ApiError ? error.status : undefined;
      const uncertain = status === undefined || status >= 500;
      const requiresReview = completed.length > 0 || uncertain;
      const fieldErrors: Record<string, string> = {};
      const labels: Record<string, string> = { title: "Titel", price: "Pris", size: "Areal", caption: "Beskrivning", slug: "Webbadress", publishAt: "Publiceringstid", scheduledStatusAt: "Schemalagd tid", scheduledListingStatus: "Schemalagd status", listingStatus: "Status" };
      const fields: string[] = [];
      if (status === 422 && error instanceof ApiError && typeof error.details === "object" && error.details !== null && "errors" in error.details) {
        const errors = error.details.errors;
        if (typeof errors === "object" && errors !== null) for (const key of Object.keys(errors)) {
          const name = key.replace(/^details\./, "");
          if (labels[name]) { fields.push(labels[name]); fieldErrors[name] = "Kontrollera värdet i detta fält."; }
          else if (key.startsWith("images.")) {
            const imageIndex = key.split(".")[1];
            fields.push(/^\d+$/.test(imageIndex) ? "Bild " + (Number(imageIndex) + 1) + " i bildserien" : "Bilder");
          } else if (key.startsWith("location")) fields.push("Adress och kartpunkter");
          else if (key.startsWith("areas") || key.startsWith("polygon")) fields.push("Kartområden");
          else if (key.startsWith("document")) fields.push("Dokument");
        }
      }
      const fieldDetail = fields.length ? "Kontrollera: " + [...new Set(fields)].join(", ") + "." : "";
      const reason = status === 422 ? "Uppgifterna godkändes inte. Kontrollera uppgifterna för detta steg."
        : status === 413 ? "Bildserien eller filen är för stor. Välj mindre filer."
        : status === 401 || status === 419 ? "Din inloggning har gått ut. Logga in igen."
        : status === 403 ? "Du saknar behörighet att spara dessa uppgifter."
        : status === undefined ? "Anslutningen avbröts eller svaret kunde inte läsas."
        : "Servern kunde inte slutföra steget.";
      const saved = completed.length ? "Bekräftade steg: " + [...new Set(completed)].join(" · ") + ". " : "";
      const guidance = requiresReview
        ? "Öppna det sparade resultatet och kontrollera vad som finns kvar innan du skickar något igen. Ditt utkast finns kvar på denna sida."
        : "Rätta uppgifterna och spara igen.";
      const message = [step.title + ".", detail, reason, fieldDetail, saved, uncertain ? "Det senaste steget kan ha sparats trots att bekräftelsen saknas." : "", guidance].filter(Boolean).join(" ");
      onProgress?.({ status: "error", phase: step.phase, percent,
        title: step.phase === "images" ? "Bildändringarna kunde inte slutföras" : title + " – misslyckades", detail: message });
      throw new PropertySaveError(message, requiresReview, propertyId(), fieldErrors);
    }
  }
  onProgress?.({ status: "success", phase: "finalizing", percent: 100, title: successTitle, detail: "Det sparade resultatet har hämtats och kontrollerats." });
}
