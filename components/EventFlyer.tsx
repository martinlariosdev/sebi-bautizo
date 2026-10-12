import Image from "next/image";
import { eventLinks } from "@/lib/links";
import { AudioPlayer } from "./AudioPlayer";

type Hotspot = {
  href: string;
  ariaLabel: string;
  top: string;
  left: string;
  width: string;
  height: string;
};

const hotspots: Hotspot[] = [
  {
    href: eventLinks.churchMaps,
    ariaLabel: "Ver ubicación de la iglesia en Google Maps",
    top: "57.5%",
    left: "16.9%",
    width: "25.3%",
    height: "2.6%",
  },
  {
    href: eventLinks.receptionMaps,
    ariaLabel: "Ver ubicación de la recepción en Google Maps",
    top: "57.5%",
    left: "57.3%",
    width: "25.5%",
    height: "2.6%",
  },
  {
    href: eventLinks.whatsappConfirm,
    ariaLabel: "Confirmar asistencia por WhatsApp",
    top: "87.0%",
    left: "24.6%",
    width: "51.0%",
    height: "3.6%",
  },
];

export function EventFlyer() {
  return (
    <div className="relative w-full max-w-[618px] mx-auto">
      <Image
        src="/flyer.webp"
        alt="Invitación al bautizo y cumpleaños de Sebastián León. Sábado 5 de diciembre de 2026. Hace un año el mundo se volvió más bonito. Ceremonia religiosa en Parroquia San Antonio a las 3:00 pm. Recepción en Casa club Residencial Camino verde. Dress code: cóctel jardín, evitar blanco."
        width={724}
        height={2172}
        preload
        className="block w-full h-auto"
      />
      <AudioPlayer />
      {hotspots.map((hotspot) => (
        <a
          key={hotspot.ariaLabel}
          href={hotspot.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={hotspot.ariaLabel}
          className="absolute rounded-full transition hover:bg-white/10 active:bg-white/20"
          style={{
            top: hotspot.top,
            left: hotspot.left,
            width: hotspot.width,
            height: hotspot.height,
          }}
        />
      ))}
    </div>
  );
}
