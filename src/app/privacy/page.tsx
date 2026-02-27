"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FEFCF7] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/auth" className="inline-flex items-center gap-1.5 text-sm text-[#505A4A] hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <img src="/images/sophia_logo_nuevo.jpeg" alt="Sophia" className="w-10 h-10 rounded-full" />
          <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'Cinzel, serif' }}>
            Política de Privacidad
          </h1>
        </div>

        <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-600 text-sm leading-relaxed">
          <p className="text-xs text-gray-400">Última actualización: Febrero 2026</p>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">1. Responsable del Tratamiento</h2>
            <p>El responsable del tratamiento de tus datos personales es Sophia Cosmética Botánica. Puedes contactarnos en chavesophia1994@gmail.com para cualquier consulta relacionada con la privacidad.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">2. Datos que Recopilamos</h2>
            <p>Recopilamos los siguientes datos personales cuando te registras y utilizas nuestra plataforma:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Nombre completo</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Dirección de envío (al realizar un pedido)</li>
              <li>Zona de trabajo (para gestores/distribuidores)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">3. Finalidad del Tratamiento</h2>
            <p>Utilizamos tus datos personales para:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Gestionar tu cuenta de usuario</li>
              <li>Procesar y enviar tus pedidos</li>
              <li>Comunicarnos contigo sobre tus pedidos y consultas</li>
              <li>Aplicar precios especiales según tu tipo de cuenta</li>
              <li>Mejorar nuestros productos y servicios</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">4. Base Legal</h2>
            <p>El tratamiento de tus datos se basa en tu consentimiento al registrarte en la plataforma y en la ejecución del contrato de compraventa cuando realizas un pedido, conforme al Reglamento General de Protección de Datos (RGPD).</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">5. Almacenamiento y Seguridad</h2>
            <p>Tus datos se almacenan de forma segura en servidores de Google Firebase, que cumple con los estándares de seguridad y protección de datos de la Unión Europea. Implementamos medidas técnicas y organizativas para proteger tus datos contra accesos no autorizados.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">6. Compartición de Datos</h2>
            <p>No vendemos ni compartimos tus datos personales con terceros, excepto en los siguientes casos:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Servicios de autenticación (Google Firebase)</li>
              <li>Cuando sea requerido por ley o autoridad competente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">7. Tus Derechos</h2>
            <p>De acuerdo con el RGPD, tienes derecho a:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li><strong>Acceso:</strong> solicitar una copia de tus datos personales</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de tus datos</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado</li>
              <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos</li>
              <li><strong>Limitación:</strong> solicitar la restricción del tratamiento</li>
            </ul>
            <p className="mt-2">Para ejercer cualquiera de estos derechos, contacta con nosotros en chavesophia1994@gmail.com.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">8. Cookies</h2>
            <p>Nuestra plataforma utiliza cookies técnicas necesarias para el funcionamiento del servicio, como la gestión de sesión y preferencias de tema. No utilizamos cookies de seguimiento ni publicitarias.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">9. Retención de Datos</h2>
            <p>Conservamos tus datos mientras mantengas tu cuenta activa. Si solicitas la eliminación de tu cuenta, procederemos a eliminar tus datos en un plazo máximo de 30 días.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">10. Modificaciones</h2>
            <p>Nos reservamos el derecho de actualizar esta política de privacidad. Te notificaremos de cualquier cambio significativo a través del correo electrónico registrado en tu cuenta.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">11. Contacto</h2>
            <p>Para cualquier consulta sobre privacidad:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Email: chavesophia1994@gmail.com</li>
              <li>WhatsApp: +34 642 633 982</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
