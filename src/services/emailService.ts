import emailjs from '@emailjs/browser';

// 🔑 Configuration EmailJS
const EMAILJS_SERVICE_ID = 'service_raqm49i';
const EMAILJS_TEMPLATE_ID = 'template_ampwosk';
const EMAILJS_PUBLIC_KEY = 'ifnGKGYNSzGIPg56k';

export const EmailService = {
  async sendOrderNotification(order: any): Promise<void> {
    try {
      console.log('📧 Envoi notification email pour commande', order.id);

      const templateParams = {
        order_id: order.id,
        order_date: order.date,
        customer_name: order.customerInfo?.prenom 
          ? `${order.customerInfo.prenom} ${order.customerInfo.nom || ''}`
          : order.customerInfo?.nom || 'Client',
        customer_email: order.customerInfo?.email || 'Non renseigné',
        customer_phone: order.customerInfo?.telephone || 'Non renseigné',
        total: order.total.toFixed(2),
        items_count: order.items.length,
        items_list: order.items.map((item: any) => 
          `• ${item.nom} (${item.marque}) - Quantité: ${item.quantite_achat}x - Prix: ${item.prix_reference}€`
        ).join('\n')
      };

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log('✅ Email envoyé avec succès:', response.status, response.text);
    } catch (error: any) {
      console.error('❌ Erreur envoi email:', error);
      if (error.text) {
        console.error('Détails:', error.text);
      }
    }
  }
};
