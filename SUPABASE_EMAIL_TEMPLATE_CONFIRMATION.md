# 📧 Template Email de Confirmation SND Rush pour Supabase

## Comment l'utiliser

1. Aller dans **Supabase Dashboard** > **Authentication** > **Email Templates**
2. Sélectionner **Confirm signup**
3. Copier-coller le code HTML ci-dessous
4. Sauvegarder

---

## Template HTML

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmer votre inscription - SND Rush</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #e27431 0%, #f2431e 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .header .subtitle {
      font-size: 16px;
      opacity: 0.95;
    }
    
    .content {
      padding: 40px 30px;
      background-color: #ffffff;
    }
    
    .welcome-message {
      font-size: 18px;
      color: #333333;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .confirmation-box {
      background: linear-gradient(135deg, #fff5f2 0%, #ffe8e0 100%);
      border: 2px solid #f2431e;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      text-align: center;
    }
    
    .confirmation-box p {
      font-size: 16px;
      color: #333333;
      margin-bottom: 25px;
      line-height: 1.8;
    }
    
    .confirm-button {
      display: inline-block;
      background: linear-gradient(135deg, #f2431e 0%, #e63a1a 100%);
      color: white !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(242, 67, 30, 0.3);
      transition: all 0.3s ease;
      margin: 10px 0;
    }
    
    .confirm-button:hover {
      background: linear-gradient(135deg, #e63a1a 0%, #d32f1a 100%);
      box-shadow: 0 6px 16px rgba(242, 67, 30, 0.4);
      transform: translateY(-2px);
    }
    
    .info-section {
      background-color: #f8f9fa;
      border-left: 4px solid #f2431e;
      padding: 20px;
      margin: 30px 0;
      border-radius: 8px;
    }
    
    .info-section h3 {
      color: #f2431e;
      font-size: 18px;
      margin-bottom: 10px;
    }
    
    .info-section ul {
      list-style: none;
      padding-left: 0;
    }
    
    .info-section li {
      padding: 8px 0;
      color: #555555;
      font-size: 14px;
    }
    
    .info-section li:before {
      content: "✓ ";
      color: #f2431e;
      font-weight: bold;
      margin-right: 8px;
    }
    
    .footer {
      background-color: #2c3e50;
      color: white;
      padding: 30px 20px;
      text-align: center;
      font-size: 14px;
    }
    
    .footer p {
      margin: 8px 0;
    }
    
    .footer a {
      color: #f2431e;
      text-decoration: none;
    }
    
    .footer a:hover {
      text-decoration: underline;
    }
    
    .social-links {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .social-links a {
      color: white;
      text-decoration: none;
      margin: 0 10px;
      font-size: 14px;
    }
    
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        border-radius: 0;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .header h1 {
        font-size: 24px;
      }
      
      .confirm-button {
        padding: 14px 30px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <h1>🎵 SND Rush</h1>
      <p class="subtitle">Location Sono & Événementiel Paris</p>
    </div>
    
    <!-- Content -->
    <div class="content">
      <div class="welcome-message">
        <strong>Bienvenue sur SND Rush !</strong>
      </div>
      
      <p style="font-size: 16px; color: #333333; margin-bottom: 20px; text-align: center;">
        Merci de vous être inscrit. Pour finaliser votre inscription et accéder à votre compte, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
      </p>
      
      <div class="confirmation-box">
        <p>
          <strong>Un clic suffit pour activer votre compte !</strong>
        </p>
        <a href="{{ .ConfirmationURL }}" class="confirm-button">
          ✅ Confirmer mon email
        </a>
        <p style="font-size: 12px; color: #666666; margin-top: 15px;">
          Ce lien est valide pendant 24 heures
        </p>
      </div>
      
      <div class="info-section">
        <h3>🎉 Que pouvez-vous faire avec votre compte ?</h3>
        <ul>
          <li>Suivre vos réservations en temps réel</li>
          <li>Accéder à vos factures et devis</li>
          <li>Réserver du matériel en quelques clics</li>
          <li>Bénéficier de la caution remboursée automatiquement</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #666666; margin-top: 30px; text-align: center;">
        Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br/>
        <a href="{{ .ConfirmationURL }}" style="color: #f2431e; word-break: break-all;">{{ .ConfirmationURL }}</a>
      </p>
      
      <p style="font-size: 12px; color: #999999; margin-top: 20px; text-align: center;">
        Si vous n'avez pas créé de compte sur SND Rush, vous pouvez ignorer cet email en toute sécurité.
      </p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p><strong>SND Rush</strong> - Location Sono & Événementiel Paris</p>
      <p style="margin-top: 10px; opacity: 0.9;">
        📧 contact@guylocationevents.com | 📞 06 51 08 49 94<br/>
        🌐 www.sndrush.com
      </p>
      <div class="social-links">
        <a href="https://www.sndrush.com">Site Web</a> • 
        <a href="mailto:contact@guylocationevents.com">Contact</a>
      </div>
      <p style="font-size: 12px; opacity: 0.8; margin-top: 15px;">
        © 2025 SND Rush. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>
```

---

## Version anglaise (optionnelle)

Si vous voulez aussi une version anglaise, créez un template séparé avec ce contenu :

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your signup - SND Rush</title>
  <!-- [Même CSS que ci-dessus] -->
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🎵 SND Rush</h1>
      <p class="subtitle">Sound Equipment Rental & Events Paris</p>
    </div>
    
    <div class="content">
      <div class="welcome-message">
        <strong>Welcome to SND Rush!</strong>
      </div>
      
      <p style="font-size: 16px; color: #333333; margin-bottom: 20px; text-align: center;">
        Thank you for signing up. To complete your registration and access your account, please confirm your email address by clicking the button below.
      </p>
      
      <div class="confirmation-box">
        <p>
          <strong>One click to activate your account!</strong>
        </p>
        <a href="{{ .ConfirmationURL }}" class="confirm-button">
          ✅ Confirm my email
        </a>
        <p style="font-size: 12px; color: #666666; margin-top: 15px;">
          This link is valid for 24 hours
        </p>
      </div>
      
      <div class="info-section">
        <h3>🎉 What can you do with your account?</h3>
        <ul>
          <li>Track your reservations in real-time</li>
          <li>Access your invoices and quotes</li>
          <li>Book equipment in a few clicks</li>
          <li>Benefit from automatic deposit refund</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #666666; margin-top: 30px; text-align: center;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="{{ .ConfirmationURL }}" style="color: #f2431e; word-break: break-all;">{{ .ConfirmationURL }}</a>
      </p>
      
      <p style="font-size: 12px; color: #999999; margin-top: 20px; text-align: center;">
        If you didn't create an account on SND Rush, you can safely ignore this email.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>SND Rush</strong> - Sound Equipment Rental & Events Paris</p>
      <p style="margin-top: 10px; opacity: 0.9;">
        📧 contact@guylocationevents.com | 📞 06 51 08 49 94<br/>
        🌐 www.sndrush.com
      </p>
      <div class="social-links">
        <a href="https://www.sndrush.com">Website</a> • 
        <a href="mailto:contact@guylocationevents.com">Contact</a>
      </div>
      <p style="font-size: 12px; opacity: 0.8; margin-top: 15px;">
        © 2025 SND Rush. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
```

---

## Caractéristiques du design

✅ **Design professionnel** avec les couleurs SND Rush (#F2431E, #E63A1A)  
✅ **Responsive** - s'adapte aux mobiles  
✅ **Bouton CTA** visible et attractif  
✅ **Informations claires** sur les avantages du compte  
✅ **Lien de secours** si le bouton ne fonctionne pas  
✅ **Footer** avec coordonnées et liens  
✅ **Compatible** avec tous les clients email

---

## Instructions d'installation

1. **Copier** le code HTML ci-dessus
2. **Aller dans** Supabase Dashboard > Authentication > Email Templates
3. **Sélectionner** "Confirm signup"
4. **Coller** le code dans l'éditeur
5. **Sauvegarder**
6. **Tester** en créant un compte de test

Le template utilise la variable `{{ .ConfirmationURL }}` qui est automatiquement remplacée par Supabase avec le vrai lien de confirmation.

