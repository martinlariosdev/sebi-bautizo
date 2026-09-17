import { describe, it, expect } from "vitest";
import { eventLinks } from "./links";

describe("eventLinks", () => {
  it("points churchMaps at the provided Google Maps link", () => {
    expect(eventLinks.churchMaps).toBe("https://maps.app.goo.gl/YmkX9tMLW1qTpe8S7");
  });

  it("points receptionMaps at the provided Google Maps link", () => {
    expect(eventLinks.receptionMaps).toBe("https://maps.app.goo.gl/Ks5CrTZNgYBN41hj6");
  });

  it("builds a wa.me URL with the correct number", () => {
    expect(eventLinks.whatsappConfirm.startsWith("https://wa.me/50557253871?text=")).toBe(true);
  });

  it("URL-encodes the prefilled WhatsApp message", () => {
    const url = new URL(eventLinks.whatsappConfirm);
    const text = url.searchParams.get("text");
    expect(text).toBe(
      "Hola soy {Tu_Nombre_Y_Acompañante} y ¡Sí, estaré presente! 🩵. Será un placer acompañarlos y compartir con ustedes ese día tan especial. 🕊️✨"
    );
  });
});
