'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SignQuoteContent() {
  const searchParams = useSearchParams();
  const [quoteId, setQuoteId] = useState('');
  const [email, setEmail] = useState('');
  const [signature, setSignature] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const quoteIdParam = searchParams.get('quoteId');
    const emailParam = searchParams.get('email');
    
    if (quoteIdParam) setQuoteId(quoteIdParam);
    if (emailParam) setEmail(decodeURIComponent(emailParam));
  }, [searchParams]);

  const handleSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signature.trim()) {
      setError('Veuillez signer le devis');
      return;
    }

    setIsSigning(true);
    setError('');

    try {
      const response = await fetch('/api/sign-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId,
          email,
          signature: signature.trim(),
          signedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        setIsSigned(true);
      } else {
        throw new Error('Erreur lors de la signature');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la signature. Veuillez réessayer.');
    } finally {
      setIsSigning(false);
    }
  };

  if (isSigned) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
          <h1 style={{ color: '#10b981', marginBottom: '16px' }}>Devis signé avec succès !</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Merci pour votre signature. Nous avons reçu votre accord et vous contacterons rapidement pour finaliser la réservation.
          </p>
          <div style={{
            background: '#f0fdf4',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #bbf7d0'
          }}>
            <p style={{ fontSize: '14px', color: '#166534', margin: 0 }}>
              📧 Un email de confirmation vous a été envoyé avec le devis signé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✍️</div>
          <h1 style={{ color: '#1f2937', marginBottom: '8px' }}>Signature du devis</h1>
          <p style={{ color: '#6b7280' }}>
            SND Rush - Location Sono & Événementiel
          </p>
        </div>

        <form onSubmit={handleSignature}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
              Votre signature
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Tapez votre nom complet pour signer"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#e27431'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              En signant, vous acceptez les conditions du devis et confirmez votre accord.
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSigning || !signature.trim()}
            style={{
              width: '100%',
              padding: '16px',
              background: isSigning || !signature.trim() ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isSigning || !signature.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isSigning ? '⏳ Signature en cours...' : '✍️ Signer le devis'}
          </button>
        </form>

        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0 }}>
            🔒 Cette signature a une valeur légale. En signant, vous confirmez votre accord avec les conditions du devis.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignQuotePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h1 style={{ color: '#1f2937' }}>Chargement...</h1>
        </div>
      </div>
    }>
      <SignQuoteContent />
    </Suspense>
  );
}
