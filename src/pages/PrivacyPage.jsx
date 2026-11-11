import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { LEGAL } from "@/lib/legal";
import useDocumentTitle from "@/lib/useDocumentTitle";

const Section = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-24 border-t border-line pt-8">
    <h2 className="font-display text-xl font-bold sm:text-2xl">{title}</h2>
    <div className="mt-4 space-y-4 leading-relaxed text-ink/80">{children}</div>
  </section>
);

const Mail = () => (
  <a href={`mailto:${LEGAL.contactEmail}`} className="font-semibold text-accent hover:underline">
    {LEGAL.contactEmail}
  </a>
);

const DATA_ROWS = [
  ["Cuenta", "Email, contraseña (guardada cifrada: nadie puede verla, ni siquiera nosotros), nombre y tipo de cuenta.", "Solo tú."],
  ["Comerciantes", "Nombre del negocio; datos de tus locales (nombre, dirección, ciudad, ubicación en el mapa, descripción, web, Instagram) y de tus eventos (título, descripción, fecha, horario, categoría e imagen).", "Los usuarios registrados. Título, fecha e imagen de los eventos los ve cualquiera."],
  ["Locales que sigues", "Qué locales sigues y desde cuándo.", "Solo tú. El local ve únicamente cuántos seguidores tiene, nunca quiénes."],
  ["Vistas de eventos", "Un contador total por evento.", "El comerciante ve el total. No se guarda quién ha visto qué."],
  ["Datos técnicos", "Dirección IP y datos del navegador en los registros de los servidores.", "Nuestros proveedores, solo para que el servicio funcione y sea seguro."],
];

export default function PrivacyPage() {
  useDocumentTitle("Política de privacidad");

  return (
    <div className="page max-w-3xl pt-10">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft">
          <ShieldCheck className="h-6 w-6 text-accent" />
        </span>
        <div>
          <p className="eyebrow">Legal</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Política de privacidad</h1>
          <p className="mt-2 text-sm text-muted">Última actualización: {LEGAL.lastUpdated}</p>
        </div>
      </div>

      <div className="panel mt-8 bg-accent-soft/40">
        <p className="font-semibold">En resumen</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/80">
          <li>Solo guardamos lo necesario para que la app funcione.</li>
          <li>No vendemos tus datos, no mostramos publicidad y no usamos cookies de seguimiento.</li>
          <li>Tu ubicación solo se usa cuando pulsas «Cerca de mí» y no se guarda en nuestros servidores.</li>
          <li>Puedes pedir una copia de tus datos o borrar tu cuenta escribiendo a <Mail />.</li>
        </ul>
      </div>

      <div className="mt-10 space-y-10">
        <Section id="responsable" title="1. Quién es el responsable">
          <p>
            EventGo es un proyecto personal de <strong>{LEGAL.owner}</strong>, responsable del tratamiento de los datos
            descritos en esta política. Para cualquier cuestión sobre privacidad puedes escribir a <Mail />.
          </p>
        </Section>

        <Section id="datos" title="2. Qué datos tratamos">
          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-canvas text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Qué</th>
                  <th className="px-4 py-3 font-semibold">Datos</th>
                  <th className="px-4 py-3 font-semibold">Quién los ve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line align-top">
                {DATA_ROWS.map(([what, data, who]) => (
                  <tr key={what}>
                    <td className="px-4 py-3 font-semibold text-ink">{what}</td>
                    <td className="px-4 py-3">{data}</td>
                    <td className="px-4 py-3">{who}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="ubicacion" title="3. Tu ubicación">
          <p>
            Solo se usa si pulsas <strong>«Cerca de mí»</strong> y das permiso en tu navegador. Tus coordenadas se usan en
            tu propio dispositivo para calcular a qué distancia están los planes y se envían a OpenStreetMap únicamente para
            saber el nombre de tu ciudad. <strong>No se guardan en nuestros servidores.</strong>
          </p>
          <p>
            Para recordar tu elección, tu navegador guarda la última ubicación o ciudad que elegiste. Puedes cambiarla en
            cualquier momento o retirar el permiso de ubicación desde los ajustes del navegador.
          </p>
          <p>
            Si eres comerciante, la dirección de tu local se consulta en OpenStreetMap para situarlo en el mapa.
          </p>
        </Section>

        <Section id="finalidad" title="4. Para qué los usamos y con qué base legal">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Darte el servicio</strong>: crear tu cuenta, mostrarte planes, publicar locales y eventos, seguir
              locales y recuperar tu contraseña. Base legal: la ejecución de las condiciones de uso que aceptas al
              registrarte (art. 6.1.b RGPD).
            </li>
            <li>
              <strong>Buscar planes cerca de ti</strong>: tu consentimiento, que das con el permiso de ubicación del
              navegador y puedes retirar cuando quieras (art. 6.1.a RGPD).
            </li>
            <li>
              <strong>Mantener la app segura</strong> y evitar abusos: nuestro interés legítimo (art. 6.1.f RGPD).
            </li>
          </ul>
          <p>Solo te enviamos emails necesarios para el servicio (por ejemplo, para cambiar tu contraseña). Nunca publicidad.</p>
        </Section>

        <Section id="proveedores" title="5. Con quién se comparten">
          <p>No vendemos ni cedemos tus datos. Para funcionar, EventGo se apoya en estos proveedores, que solo los tratan siguiendo nuestras instrucciones:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Supabase</strong>: base de datos, cuentas de usuario, imágenes y envío de emails del servicio. Los datos
              se almacenan en la {LEGAL.dataRegion}.
            </li>
            <li>
              <strong>Vercel</strong>: alojamiento de la web. Puede tratar datos técnicos (como la IP) en servidores fuera de
              la UE, con las garantías que exige el RGPD (Marco de Privacidad de Datos UE-EE. UU. o cláusulas contractuales
              tipo).
            </li>
            <li>
              <strong>OpenStreetMap</strong> (servicio Nominatim): convierte direcciones y coordenadas en lugares, como se
              explica en el apartado 3. No recibe ningún dato de tu cuenta.
            </li>
          </ul>
          <p>
            Algunos enlaces te llevan fuera de EventGo (por ejemplo «Cómo llegar» abre Google Maps, o el Instagram y la web
            de un local). A partir de ahí se aplica la política de privacidad de ese servicio.
          </p>
        </Section>

        <Section id="conservacion" title="6. Cuánto tiempo los guardamos">
          <p>
            Mientras tengas tu cuenta. Si nos pides borrarla, eliminamos tu cuenta, tu perfil y los locales que sigues y, si
            eres comerciante, también tus locales, eventos e imágenes. Los registros técnicos de los proveedores se conservan
            durante periodos limitados por motivos de seguridad.
          </p>
        </Section>

        <Section id="navegador" title="7. Lo que se guarda en tu navegador">
          <p>
            EventGo no usa cookies de publicidad ni de analítica. Tu navegador guarda únicamente lo imprescindible para que la
            app funcione:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Tu sesión, para que no tengas que iniciar sesión cada vez.</li>
            <li>La última ubicación o ciudad que elegiste.</li>
            <li>Qué eventos has abierto durante la visita, para no contar dos veces la misma vista.</li>
          </ul>
          <p>Las fuentes y las imágenes de la web se sirven desde la propia EventGo, sin servicios de terceros.</p>
        </Section>

        <Section id="derechos" title="8. Tus derechos">
          <p>
            Puedes <strong>acceder</strong> a tus datos, <strong>corregirlos</strong>, <strong>borrarlos</strong>,
            <strong> oponerte</strong> a su tratamiento o <strong>limitarlo</strong>, y pedir una copia para llevártela a
            otro servicio (<strong>portabilidad</strong>). Escríbenos a <Mail /> desde el email de tu cuenta y te
            responderemos en un plazo máximo de un mes.
          </p>
          <p>
            Si crees que no hemos atendido bien tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos
            en{" "}
            <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">
              www.aepd.es
            </a>
            .
          </p>
        </Section>

        <Section id="seguridad" title="9. Seguridad">
          <p>
            Las contraseñas se guardan cifradas, todas las conexiones van cifradas (HTTPS) y la base de datos tiene reglas que
            impiden que un usuario vea o modifique datos de otro.
          </p>
        </Section>

        <Section id="edad" title="10. Edad mínima">
          <p>
            EventGo está dirigido a personas de <strong>{LEGAL.minimumAge} años o más</strong>, ya que muestra planes de
            ocio nocturno. Si eres menor, no crees una cuenta.
          </p>
        </Section>

        <Section id="cambios" title="11. Cambios en esta política">
          <p>
            Si cambiamos algo importante, lo indicaremos en la app y actualizaremos la fecha de arriba.
          </p>
        </Section>
      </div>

      <p className="mt-12 text-sm text-muted">
        <Link to="/" className="font-semibold text-accent hover:underline">Volver a EventGo</Link>
      </p>
    </div>
  );
}
