#!/bin/bash

# Script pour tester le webhook Stripe avec Stripe CLI
# Usage: ./scripts/test-webhook-stripe-cli.sh

echo "🚀 Test du webhook Stripe avec Stripe CLI\n"

# Vérifier que Stripe CLI est installé
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI n'est pas installé"
    echo ""
    echo "📦 Installation:"
    echo "   macOS: brew install stripe/stripe-cli/stripe"
    echo "   Linux: https://stripe.com/docs/stripe-cli#install"
    echo ""
    exit 1
fi

echo "✅ Stripe CLI détecté\n"

# Vérifier que l'utilisateur est connecté
if ! stripe config --list &> /dev/null; then
    echo "⚠️ Vous n'êtes pas connecté à Stripe CLI"
    echo "   Exécutez: stripe login"
    echo ""
    exit 1
fi

echo "✅ Stripe CLI connecté\n"

# Récupérer l'URL de base depuis .env.local
BASE_URL=$(grep NEXT_PUBLIC_BASE_URL .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')

if [ -z "$BASE_URL" ]; then
    BASE_URL="http://localhost:3000"
    echo "⚠️ NEXT_PUBLIC_BASE_URL non trouvé, utilisation de: $BASE_URL"
else
    echo "✅ URL de base: $BASE_URL"
fi

WEBHOOK_URL="${BASE_URL}/api/webhooks/stripe"

echo ""
echo "📋 Configuration:"
echo "   Webhook URL: $WEBHOOK_URL"
echo ""

# Démarrer le serveur de développement si ce n'est pas déjà fait
echo "⚠️ Assurez-vous que votre serveur Next.js est démarré sur $BASE_URL"
echo "   Si ce n'est pas le cas, ouvrez un nouveau terminal et exécutez: npm run dev"
echo ""
read -p "Appuyez sur Entrée pour continuer..."

echo ""
echo "🔄 Démarrage de l'écoute des webhooks..."
echo "   Les événements Stripe seront transférés vers: $WEBHOOK_URL"
echo ""
echo "💡 Pour tester un paiement:"
echo "   1. Ouvrez un autre terminal"
echo "   2. Exécutez: stripe trigger checkout.session.completed"
echo "   3. Ou effectuez un vrai paiement test dans votre application"
echo ""
echo "📝 Pour arrêter, appuyez sur Ctrl+C"
echo ""

# Écouter les webhooks et les transférer vers l'URL locale
stripe listen --forward-to "$WEBHOOK_URL"
