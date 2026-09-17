import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EventFlyer } from "./EventFlyer";

describe("EventFlyer", () => {
  it("renders the flyer image with a descriptive alt", () => {
    render(<EventFlyer />);
    const image = screen.getByRole("img");
    expect(image.getAttribute("alt")).toContain("bautizo y cumpleaños de Sebastián León");
  });

  it("renders a link to the church Maps location", () => {
    render(<EventFlyer />);
    const link = screen.getByRole("link", { name: "Ver ubicación de la iglesia en Google Maps" });
    expect(link).toHaveAttribute("href", "https://maps.app.goo.gl/YmkX9tMLW1qTpe8S7");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders a link to the reception Maps location", () => {
    render(<EventFlyer />);
    const link = screen.getByRole("link", { name: "Ver ubicación de la recepción en Google Maps" });
    expect(link).toHaveAttribute("href", "https://maps.app.goo.gl/Ks5CrTZNgYBN41hj6");
  });

  it("renders a WhatsApp confirmation link", () => {
    render(<EventFlyer />);
    const link = screen.getByRole("link", { name: "Confirmar asistencia por WhatsApp" });
    expect(link.getAttribute("href")).toContain("https://wa.me/50557253871?text=");
  });

  it("renders exactly 3 hotspot links", () => {
    render(<EventFlyer />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
});
