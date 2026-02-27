"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
            Términos de Servicio
          </h1>
        </div>

        <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-600 text-sm leading-relaxed">
          <p className="text-xs text-gray-400">Última actualización: Febrero 2026</p>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">1. Aceptación de los Términos</h2>
            <p>Al acceder y utilizar la plataforma de Sophia Cosmética Botánica, aceptas cumplir con estos Términos de Servicio. Si no estás de acuerdo con alguno de estos términos, te recomendamos no utilizar nuestros servicios.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">2. Descripción del Servicio</h2>
            <p>Sophia Cosmética Botánica es una plataforma de comercio electrónico dedicada a la venta de productos de cosmética natural y artesanal. Nuestros servicios incluyen:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Catálogo de productos de cosmética natural</li>
              <li>Gestión de pedidos a través de WhatsApp</li>
              <li>Registro de cuentas de cliente y gestor/distribuidor</li>
              <li>Sistema de precios diferenciados para gestores</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">3. Registro de Cuenta</h2>
            <p>Para realizar compras es necesario crear una cuenta proporcionando información veraz y actualizada. Eres responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las actividades que ocurran bajo tu cuenta.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">4. Productos y Precios</h2>
            <p>Los precios mostrados en la plataforma incluyen IVA salvo que se indique lo contrario. Nos reservamos el derecho de modificar precios sin previo aviso. Los gestores/distribuidores tienen acceso a precios especiales según su acuerdo comercial.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">5. Pedidos y Pagos</h2>
            <p>Los pedidos se gestionan a través de WhatsApp. La confirmación del pedido se realizará una vez se acuerde el método de pago y la dirección de envío con nuestro equipo.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">6. Envíos y Devoluciones</h2>
            <p>Los plazos de entrega se comunicarán al confirmar el pedido. Si no estás satisfecho con tu compra, dispones de 14 días naturales desde la recepción para solicitar una devolución, siempre que el producto se encuentre en su estado original sin abrir.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">7. Propiedad Intelectual</h2>
            <p>Todo el contenido de la plataforma, incluyendo textos, imágenes, logos y diseños, es propiedad de Sophia Cosmética Botánica y está protegido por las leyes de propiedad intelectual.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">8. Limitación de Responsabilidad</h2>
            <p>Sophia Cosmética Botánica no será responsable de daños indirectos derivados del uso de la plataforma. Nuestros productos son de uso externo y se recomienda realizar una prueba de alergia antes de su uso completo.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">9. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán efectivos desde su publicación en la plataforma. El uso continuado del servicio implica la aceptación de los términos actualizados.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-2">10. Contacto</h2>
            <p>Para cualquier consulta sobre estos términos, puedes contactarnos a través de:</p>
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
