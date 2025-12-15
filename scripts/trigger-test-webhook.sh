#!/bin/bash

# Script pour déclencher un événement de test checkout.session.completed
# Usage: ./scripts/trigger-test-webhook.sh

echo "🚀 Déclenchement d'un événement de test checkout.session.completed\n"

# Vérifier que Stripe CLI est installé
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI n'est pas installé"
    echo "   Installation: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo "✅ Stripe CLI détecté\n"

# Déclencher l'événement de test
echo "📤 Envoi de l'événement checkout.session.completed...\n"

stripe trigger checkout.session.completed

echo ""
echo "✅ Événement envoyé !"
echo ""
echo "💡 Vérifiez:"
echo "   1. Les logs de votre serveur Next.js pour voir si le webhook a été reçu"
echo "   2. La base de données pour voir si un order a été créé"
echo "   3. Exécutez: node scripts/check-webhook-orders.js pour vérifier les orders"
