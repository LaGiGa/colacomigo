import MercadoPagoConfig from 'mercadopago'

/** Instância única do SDK do Mercado Pago configurada com o access token */
const mercadopago = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
    options: {
        timeout: 5000,
    },
})

export default mercadopago
