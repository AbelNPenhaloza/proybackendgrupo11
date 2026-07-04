const { MercadoPagoConfig, Preference } = require('mercadopago');

// Inicializamos el cliente de MP usando la variable de entorno
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const generarPreferenciaMP = async (pago_id, monto_total, descripcion_servicio) => {
    try {
        const preference = new Preference(client);
        
        const response = await preference.create({
            body: {
                items: [
                    {
                        id: pago_id,
                        title: `Ayni Servicios Informáticos - ${descripcion_servicio}`,
                        quantity: 1,
                        unit_price: Number(monto_total),
                        currency_id: 'ARS'
                    }
                ],
                // Estas son las URLs de tu frontend en Angular a donde MP redirigirá al cliente
                back_urls: {
                    success: "http://localhost:4200/pagos/exito",
                    failure: "http://localhost:4200/pagos/error",
                    pending: "http://localhost:4200/pagos/pendiente"
                },
                auto_return: "approved",
                // URL donde MP mandará el POST (webhook) por detrás cuando el pago se apruebe.
                // Nota: MP exige HTTPS, para probar local vas a necesitar ngrok más adelante.
                notification_url: "https://tu-dominio.com/api/pagos/webhook",
                external_reference: pago_id // Mandamos tu ID de pago para que MP te lo devuelva en el webhook
            }
        });

        return response.id; // Este es el famoso mp_preferencia_id
    } catch (error) {
        console.error('Error al generar preferencia en MP:', error);
        throw new Error('No se pudo conectar con MercadoPago');
    }
};

module.exports = {
    generarPreferenciaMP
};