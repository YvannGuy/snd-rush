'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function TestEmailConfirmationPage() {
  const { signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    windowOrigin: 'N/A',
    baseUrl: 'N/A',
    redirectUrl: 'N/A'
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDebugInfo({
        windowOrigin: window.location.origin,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'Non défini',
        redirectUrl: `${window.location.origin}/auth/callback`
      });
    }
  }, []);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const result = await signUpWithEmail(email, password);
      setResult(result);
      
      // Afficher l'URL qui serait utilisée
      if (typeof window !== 'undefined') {
        const baseUrl = window.location.origin;
        const redirectUrl = `${baseUrl}/auth/callback`;
        console.log('🔍 URL de redirection qui sera utilisée:', redirectUrl);
        
        // Tester si l'URL est valide
        try {
          const testUrl = new URL(redirectUrl);
          console.log('✅ URL valide:', testUrl.toString());
        } catch (error) {
          console.error('❌ URL invalide:', error);
        }
      }
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test Email Confirmation</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="test@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="password123"
              />
            </div>
            
            <button
              onClick={handleTest}
              disabled={loading || !email || !password}
              className="w-full bg-[#F2431E] text-white py-2 rounded-lg font-semibold hover:bg-[#E63A1A] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Envoi...' : 'Tester l\'inscription'}
            </button>
          </div>
          
          {result && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <h2 className="font-bold mb-2">Résultat:</h2>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-bold mb-2">Informations de débogage:</h2>
            <div className="text-sm space-y-1">
              <p><strong>Window origin:</strong> {debugInfo.windowOrigin}</p>
              <p><strong>NEXT_PUBLIC_BASE_URL:</strong> {debugInfo.baseUrl}</p>
              <p><strong>URL de redirection calculée:</strong> {debugInfo.redirectUrl}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Entrez un email de test</li>
            <li>Cliquez sur "Tester l'inscription"</li>
            <li>Vérifiez la console du navigateur (F12) pour voir l'URL générée</li>
            <li>Vérifiez votre boîte email pour le lien de confirmation</li>
            <li>Copiez l'URL complète du lien dans l'email et vérifiez qu'elle est valide</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
