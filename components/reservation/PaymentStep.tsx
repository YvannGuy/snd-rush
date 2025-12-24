
'use client';

import { useState } from 'react';

interface PaymentStepProps {
  language: 'fr' | 'en';
  selectedPack: any;
  personalInfo: any;
  onBack: () => void;
  onClose: () => void;
}

export default function PaymentStep({ language, selectedPack, personalInfo, onBack, onClose }: PaymentStepProps) {
  // Forcer l'acompte uniquement (pas de paiement intégral)
  const [paymentType] = useState<'deposit'>('deposit');
  // La caution sera demandée plus tard, pas maintenant
  const [cautionPayment] = useState<'delivery'>('delivery');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const texts = {
    fr: {
      title: 'Paiement sécurisé',
      subtitle: 'Finalisez votre réservation en toute sécurité',
      orderSummary: 'Récapitulatif de votre commande',
      selectedPack: 'Pack sélectionné',
      personalInfo: 'Informations personnelles',
      paymentOptions: 'Options de paiement',
      fullPayment: 'Paiement intégral',
      depositPayment: 'Acompte uniquement (obligatoire)',
      caution: 'Caution',
      cautionOptions: 'Options de paiement de la caution',
      cautionNow: 'Payer maintenant',
      cautionDelivery: 'Payer à la livraison',
      cautionDescription: 'Remboursée après l\'événement si aucun dommage',
      total: 'Total à payer',
      paymentMethod: 'Méthode de paiement',
      cardNumber: 'Numéro de carte',
      expiryDate: 'Date d\'expiration',
      cvv: 'CVV',
      cardholderName: 'Nom du porteur',
      back: 'Retour',
      confirmPayment: 'Confirmer le paiement',
      processing: 'Traitement...',
      successTitle: 'Paiement confirmé !',
      successMessage: 'Votre réservation a été confirmée. Vous recevrez un email de confirmation.',
      orderNumber: 'Numéro de commande',
      close: 'Fermer',
      remainingAmount: 'Montant restant à payer le jour J',
      cautionRemaining: 'Caution à payer à la livraison',
      securePayment: 'Paiement sécurisé SSL',
      depositRequired: 'L\'acompte est obligatoire pour toute réservation',
      customer: 'Client',
      quoteRequired: 'Devis requis',
      contactForQuote: 'Contactez-nous pour un devis personnalisé',
      contactButton: 'Nous contacter'
    },
    en: {
      title: 'Secure payment',
      subtitle: 'Complete your reservation securely',
      orderSummary: 'Order summary',
      selectedPack: 'Selected pack',
      personalInfo: 'Personal information',
      paymentOptions: 'Payment options',
      fullPayment: 'Full payment',
      depositPayment: 'Deposit only (required)',
      caution: 'Security deposit',
      cautionOptions: 'Security deposit payment options',
      cautionNow: 'Pay now',
      cautionDelivery: 'Pay on delivery',
      cautionDescription: 'Refunded after event if no damage',
      total: 'Total to pay',
      paymentMethod: 'Payment method',
      cardNumber: 'Card number',
      expiryDate: 'Expiry date',
      cvv: 'CVV',
      cardholderName: 'Cardholder name',
      back: 'Back',
      confirmPayment: 'Confirm payment',
      processing: 'Processing...',
      successTitle: 'Payment confirmed!',
      successMessage: 'Your reservation has been confirmed. You will receive a confirmation email.',
      orderNumber: 'Order number',
      close: 'Close',
      remainingAmount: 'Remaining amount to pay on event day',
      cautionRemaining: 'Security deposit to pay on delivery',
      securePayment: 'SSL secure payment',
      depositRequired: 'Deposit is required for all reservations',
      customer: 'Customer',
      quoteRequired: 'Quote required',
      contactForQuote: 'Contact us for a personalized quote',
      contactButton: 'Contact us'
    }
  };

  // Fonction pour extraire le prix numérique
  const extractPrice = (priceString: string) => {
    if (!priceString) return 0;
    
    // Gérer les cas comme "Sur devis", "Quote", etc.
    if (priceString.toLowerCase().includes('devis') || priceString.toLowerCase().includes('quote')) {
      return 0;
    }
    
    // Extraire le nombre du prix
    const match = priceString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const packPrice = extractPrice(selectedPack?.price || '0');
  const isQuoteRequired = packPrice === 0;
  const depositAmount = Math.round(packPrice * 0.3);
  const remainingAmount = packPrice - depositAmount;
  const cautionAmount = packPrice * 3;

  const getPaymentAmount = () => {
    if (isQuoteRequired) return 0;
    
    // Toujours utiliser l'acompte uniquement (30%)
    let amount = depositAmount;
    // La caution sera demandée plus tard, pas maintenant
    // if (cautionPayment === 'now') {
    //   amount += cautionAmount;
    // }
    return amount;
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    } else if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }

    setCardData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulation du traitement du paiement
    await new Promise(resolve => setTimeout(resolve, 3000));

    setIsProcessing(false);
    setIsSuccess(true);
  };

  const handleQuoteRequest = () => {
    // Redirection vers WhatsApp ou téléphone
    window.open('https://wa.me/33651084994?text=Bonjour, je souhaite un devis personnalisé', '_blank');
  };

  const isFormValid = () => {
    if (isQuoteRequired) return true;
    
    return cardData.cardNumber.replace(/\s/g, '').length >= 16 &&
           cardData.expiryDate.length === 5 &&
           cardData.cvv.length === 3 &&
           cardData.name.trim().length > 0;
  };

  // Si c'est un pack sur devis, afficher une interface différente
  if (isQuoteRequired) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-[#F2431E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-file-text-line text-3xl text-[#F2431E]"></i>
        </div>
        <h2 className="text-3xl font-bold text-black mb-4">
          {texts[language].quoteRequired}
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          {texts[language].contactForQuote}
        </p>
        
        <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-md mx-auto">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{texts[language].selectedPack}:</span>
              <span className="font-semibold text-black">{selectedPack?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Prix:</span>
              <span className="font-semibold text-[#F2431E]">{selectedPack?.price}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-black mb-4">
            {texts[language].customer}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Nom:</span>
              <span className="font-medium">{personalInfo?.firstName || ''} {personalInfo?.lastName || ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{personalInfo?.email || ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Téléphone:</span>
              <span className="font-medium">{personalInfo?.phone || ''}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 max-w-md mx-auto">
          <button
            onClick={onBack}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            {texts[language].back}
          </button>
          <button
            onClick={handleQuoteRequest}
            className="flex-1 py-3 bg-[#F2431E] text-white rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors"
          >
            {texts[language].contactButton}
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-check-line text-3xl text-green-600"></i>
        </div>
        <h2 className="text-3xl font-bold text-black mb-4">
          {texts[language].successTitle}
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          {texts[language].successMessage}
        </p>
        <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-md mx-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">{texts[language].orderNumber}:</span>
            <span className="font-bold text-black">#SND{Math.floor(Math.random() * 10000)}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">{selectedPack?.name}:</span>
            <span className="font-bold text-black">{getPaymentAmount()}€</span>
          </div>
          {cautionPayment === 'delivery' && (
            <div className="flex justify-between items-center mb-4 text-orange-600">
              <span>{texts[language].cautionRemaining}:</span>
              <span className="font-bold">{cautionAmount}€</span>
            </div>
          )}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-black">{texts[language].total}:</span>
              <span className="text-xl font-bold text-[#F2431E]">{getPaymentAmount()}€</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="bg-[#F2431E] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors"
        >
          {texts[language].close}
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-black mb-4">
          {texts[language].title}
        </h2>
        <p className="text-gray-600 text-lg">
          {texts[language].subtitle}
        </p>
      </div>

      <form onSubmit={handlePayment} className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* Colonne 1: Récapitulatif et options */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-black mb-4">
                {texts[language].orderSummary}
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{texts[language].selectedPack}:</span>
                  <span className="font-semibold text-black">{selectedPack?.name}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Prix du pack:</span>
                  <span className="font-semibold text-black">{packPrice}€</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{texts[language].caution}:</span>
                  <span className="font-semibold text-black">{cautionAmount}€</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-black">
                      {language === 'fr' ? 'Acompte à payer maintenant' : 'Deposit to pay now'}
                    </span>
                    <span className="text-xl font-bold text-[#F2431E]">{getPaymentAmount()}€</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'fr' ? '30% - bloque votre date' : '30% - secures your date'}
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg mt-3">
                  <p className="text-sm text-blue-800 mb-1">
                    <strong>{language === 'fr' ? 'Solde à régler plus tard' : 'Balance to pay later'}</strong>: {remainingAmount}€
                  </p>
                  <p className="text-xs text-blue-700">
                    {language === 'fr' 
                      ? 'Le solde sera demandé avant votre événement' 
                      : 'Balance will be requested before your event'}
                  </p>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg mt-3">
                  <p className="text-xs text-orange-800">
                    {language === 'fr' 
                      ? `Caution demandée à l'approche de l'événement: ${cautionAmount}€` 
                      : `Security deposit requested near event: ${cautionAmount}€`}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-black mb-4">
                {texts[language].customer}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nom:</span>
                  <span className="font-medium">{personalInfo?.firstName || ''} {personalInfo?.lastName || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{personalInfo?.email || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Téléphone:</span>
                  <span className="font-medium">{personalInfo?.phone || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Adresse:</span>
                  <span className="font-medium">{personalInfo?.address || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ville:</span>
                  <span className="font-medium">{personalInfo?.city || ''} {personalInfo?.postalCode || ''}</span>
                </div>
              </div>
            </div>

            {/* Options de paiement */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-black mb-4">
                Paiement
              </h3>

              <div className="space-y-3">
                <div className="bg-[#F2431E]/10 border border-[#F2431E]/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-semibold text-gray-900">
                        {language === 'fr' ? 'Acompte 30%' : '30% Deposit'}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        {language === 'fr' ? 'Bloque votre date' : 'Secures your date'}
                      </p>
                    </div>
                    <span className="text-xl font-bold text-[#F2431E]">{depositAmount}€</span>
                  </div>
                </div>

                <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-600">
                  <p className="mb-1">
                    <strong>{language === 'fr' ? 'Solde à régler plus tard' : 'Balance to pay later'}</strong>: {remainingAmount}€
                  </p>
                  <p className="text-xs">
                    {language === 'fr' 
                      ? 'Le solde sera demandé avant votre événement' 
                      : 'Balance will be requested before your event'}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center text-blue-800">
                    <i className="ri-information-line mr-2"></i>
                    <span className="text-sm font-medium">
                      {language === 'fr' 
                        ? 'L\'acompte de 30% est obligatoire pour bloquer votre date' 
                        : '30% deposit is required to secure your date'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Information caution */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-black mb-4">
                {language === 'fr' ? 'Caution' : 'Security Deposit'}
              </h3>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  {language === 'fr' 
                    ? `La caution de ${cautionAmount}€ sera demandée à l'approche de votre événement. Elle sera bloquée sur votre carte mais non débitée, et libérée après retour du matériel en bon état.`
                    : `The security deposit of ${cautionAmount}€ will be requested near your event. It will be held on your card but not charged, and released after equipment return in good condition.`}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-center text-orange-800">
                    <i className="ri-information-line mr-2"></i>
                    <span className="text-sm font-medium">
                      {texts[language].cautionDescription}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne 2: Formulaire de paiement */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <i className="ri-shield-check-line text-green-600 mr-2"></i>
                <span className="text-sm font-medium text-green-600">
                  {texts[language].securePayment}
                </span>
              </div>

              <h3 className="text-lg font-bold text-black mb-4">
                {texts[language].paymentMethod}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts[language].cardNumber}
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardData.cardNumber}
                    onChange={handleCardChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {texts[language].expiryDate}
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={cardData.expiryDate}
                      onChange={handleCardChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {texts[language].cvv}
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={cardData.cvv}
                      onChange={handleCardChange}
                      placeholder="123"
                      maxLength={3}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {texts[language].cardholderName}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={cardData.name}
                    onChange={handleCardChange}
                    placeholder="John Doe"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F2431E] text-base"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                {texts[language].back}
              </button>

              <button
                type="submit"
                disabled={!isFormValid() || isProcessing}
                className="flex-1 py-3 bg-[#F2431E] text-white rounded-xl font-semibold hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    {texts[language].processing}
                  </>
                ) : (
                  <>
                    <i className="ri-secure-payment-line mr-2"></i>
                    {texts[language].confirmPayment}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}