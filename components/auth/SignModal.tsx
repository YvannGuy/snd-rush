'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface SignModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillEmail?: string;
  onSuccess?: () => void;
  language?: 'fr' | 'en';
  initialTab?: 'signin' | 'signup';
  isAdmin?: boolean;
  onOpenAdminModal?: () => void;
  onOpenUserModal?: () => void;
}

type TabType = 'signin' | 'signup';

export default function SignModal({ 
  isOpen, 
  onClose, 
  prefillEmail = '', 
  onSuccess,
  language = 'fr',
  initialTab = 'signin',
  isAdmin = false,
  onOpenAdminModal,
  onOpenUserModal
}: SignModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // Réinitialiser l'onglet quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      // Pour admin, forcer l'onglet signin
      if (isAdmin) {
        setActiveTab('signin');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, initialTab, isAdmin]);
  const [title, setTitle] = useState<'mr' | 'mme'>('mr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('FR'); // Code pays par défaut
  const [phone, setPhone] = useState('');
  const { signInWithEmail, signUpWithEmail, loading, error } = useAuth();

  // Liste complète de tous les pays avec indicatifs téléphoniques
  const countries = [
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
    { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
    { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭' },
    { code: 'LU', name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺' },
    { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪' },
    { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸' },
    { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹' },
    { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
    { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
    { code: 'AD', name: 'Andorre', dialCode: '+376', flag: '🇦🇩' },
    { code: 'AE', name: 'Émirats arabes unis', dialCode: '+971', flag: '🇦🇪' },
    { code: 'AF', name: 'Afghanistan', dialCode: '+93', flag: '🇦🇫' },
    { code: 'AG', name: 'Antigua-et-Barbuda', dialCode: '+1', flag: '🇦🇬' },
    { code: 'AI', name: 'Anguilla', dialCode: '+1', flag: '🇦🇮' },
    { code: 'AL', name: 'Albanie', dialCode: '+355', flag: '🇦🇱' },
    { code: 'AM', name: 'Arménie', dialCode: '+374', flag: '🇦🇲' },
    { code: 'AO', name: 'Angola', dialCode: '+244', flag: '🇦🇴' },
    { code: 'AQ', name: 'Antarctique', dialCode: '+672', flag: '🇦🇶' },
    { code: 'AR', name: 'Argentine', dialCode: '+54', flag: '🇦🇷' },
    { code: 'AS', name: 'Samoa américaines', dialCode: '+1', flag: '🇦🇸' },
    { code: 'AT', name: 'Autriche', dialCode: '+43', flag: '🇦🇹' },
    { code: 'AU', name: 'Australie', dialCode: '+61', flag: '🇦🇺' },
    { code: 'AW', name: 'Aruba', dialCode: '+297', flag: '🇦🇼' },
    { code: 'AX', name: 'Îles Åland', dialCode: '+358', flag: '🇦🇽' },
    { code: 'AZ', name: 'Azerbaïdjan', dialCode: '+994', flag: '🇦🇿' },
    { code: 'BA', name: 'Bosnie-Herzégovine', dialCode: '+387', flag: '🇧🇦' },
    { code: 'BB', name: 'Barbade', dialCode: '+1', flag: '🇧🇧' },
    { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
    { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
    { code: 'BG', name: 'Bulgarie', dialCode: '+359', flag: '🇧🇬' },
    { code: 'BH', name: 'Bahreïn', dialCode: '+973', flag: '🇧🇭' },
    { code: 'BI', name: 'Burundi', dialCode: '+257', flag: '🇧🇮' },
    { code: 'BJ', name: 'Bénin', dialCode: '+229', flag: '🇧🇯' },
    { code: 'BL', name: 'Saint-Barthélemy', dialCode: '+590', flag: '🇧🇱' },
    { code: 'BM', name: 'Bermudes', dialCode: '+1', flag: '🇧🇲' },
    { code: 'BN', name: 'Brunei', dialCode: '+673', flag: '🇧🇳' },
    { code: 'BO', name: 'Bolivie', dialCode: '+591', flag: '🇧🇴' },
    { code: 'BQ', name: 'Bonaire', dialCode: '+599', flag: '🇧🇶' },
    { code: 'BR', name: 'Brésil', dialCode: '+55', flag: '🇧🇷' },
    { code: 'BS', name: 'Bahamas', dialCode: '+1', flag: '🇧🇸' },
    { code: 'BT', name: 'Bhoutan', dialCode: '+975', flag: '🇧🇹' },
    { code: 'BW', name: 'Botswana', dialCode: '+267', flag: '🇧🇼' },
    { code: 'BY', name: 'Biélorussie', dialCode: '+375', flag: '🇧🇾' },
    { code: 'BZ', name: 'Belize', dialCode: '+501', flag: '🇧🇿' },
    { code: 'CC', name: 'Îles Cocos', dialCode: '+61', flag: '🇨🇨' },
    { code: 'CD', name: 'RD Congo', dialCode: '+243', flag: '🇨🇩' },
    { code: 'CF', name: 'République centrafricaine', dialCode: '+236', flag: '🇨🇫' },
    { code: 'CG', name: 'Congo', dialCode: '+242', flag: '🇨🇬' },
    { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮' },
    { code: 'CK', name: 'Îles Cook', dialCode: '+682', flag: '🇨🇰' },
    { code: 'CL', name: 'Chili', dialCode: '+56', flag: '🇨🇱' },
    { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲' },
    { code: 'CN', name: 'Chine', dialCode: '+86', flag: '🇨🇳' },
    { code: 'CO', name: 'Colombie', dialCode: '+57', flag: '🇨🇴' },
    { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷' },
    { code: 'CU', name: 'Cuba', dialCode: '+53', flag: '🇨🇺' },
    { code: 'CV', name: 'Cap-Vert', dialCode: '+238', flag: '🇨🇻' },
    { code: 'CW', name: 'Curaçao', dialCode: '+599', flag: '🇨🇼' },
    { code: 'CX', name: 'Île Christmas', dialCode: '+61', flag: '🇨🇽' },
    { code: 'CY', name: 'Chypre', dialCode: '+357', flag: '🇨🇾' },
    { code: 'CZ', name: 'Tchéquie', dialCode: '+420', flag: '🇨🇿' },
    { code: 'DJ', name: 'Djibouti', dialCode: '+253', flag: '🇩🇯' },
    { code: 'DK', name: 'Danemark', dialCode: '+45', flag: '🇩🇰' },
    { code: 'DM', name: 'Dominique', dialCode: '+1', flag: '🇩🇲' },
    { code: 'DO', name: 'République dominicaine', dialCode: '+1', flag: '🇩🇴' },
    { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿' },
    { code: 'EC', name: 'Équateur', dialCode: '+593', flag: '🇪🇨' },
    { code: 'EE', name: 'Estonie', dialCode: '+372', flag: '🇪🇪' },
    { code: 'EG', name: 'Égypte', dialCode: '+20', flag: '🇪🇬' },
    { code: 'EH', name: 'Sahara occidental', dialCode: '+212', flag: '🇪🇭' },
    { code: 'ER', name: 'Érythrée', dialCode: '+291', flag: '🇪🇷' },
    { code: 'ET', name: 'Éthiopie', dialCode: '+251', flag: '🇪🇹' },
    { code: 'FI', name: 'Finlande', dialCode: '+358', flag: '🇫🇮' },
    { code: 'FJ', name: 'Fidji', dialCode: '+679', flag: '🇫🇯' },
    { code: 'FK', name: 'Îles Malouines', dialCode: '+500', flag: '🇫🇰' },
    { code: 'FM', name: 'Micronésie', dialCode: '+691', flag: '🇫🇲' },
    { code: 'FO', name: 'Îles Féroé', dialCode: '+298', flag: '🇫🇴' },
    { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦' },
    { code: 'GD', name: 'Grenade', dialCode: '+1', flag: '🇬🇩' },
    { code: 'GE', name: 'Géorgie', dialCode: '+995', flag: '🇬🇪' },
    { code: 'GF', name: 'Guyane française', dialCode: '+594', flag: '🇬🇫' },
    { code: 'GG', name: 'Guernesey', dialCode: '+44', flag: '🇬🇬' },
    { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
    { code: 'GI', name: 'Gibraltar', dialCode: '+350', flag: '🇬🇮' },
    { code: 'GL', name: 'Groenland', dialCode: '+299', flag: '🇬🇱' },
    { code: 'GM', name: 'Gambie', dialCode: '+220', flag: '🇬🇲' },
    { code: 'GN', name: 'Guinée', dialCode: '+224', flag: '🇬🇳' },
    { code: 'GP', name: 'Guadeloupe', dialCode: '+590', flag: '🇬🇵' },
    { code: 'GQ', name: 'Guinée équatoriale', dialCode: '+240', flag: '🇬🇶' },
    { code: 'GR', name: 'Grèce', dialCode: '+30', flag: '🇬🇷' },
    { code: 'GS', name: 'Géorgie du Sud', dialCode: '+500', flag: '🇬🇸' },
    { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹' },
    { code: 'GU', name: 'Guam', dialCode: '+1', flag: '🇬🇺' },
    { code: 'GW', name: 'Guinée-Bissau', dialCode: '+245', flag: '🇬🇼' },
    { code: 'GY', name: 'Guyane', dialCode: '+592', flag: '🇬🇾' },
    { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰' },
    { code: 'HM', name: 'Îles Heard-et-MacDonald', dialCode: '+672', flag: '🇭🇲' },
    { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳' },
    { code: 'HR', name: 'Croatie', dialCode: '+385', flag: '🇭🇷' },
    { code: 'HT', name: 'Haïti', dialCode: '+509', flag: '🇭🇹' },
    { code: 'HU', name: 'Hongrie', dialCode: '+36', flag: '🇭🇺' },
    { code: 'ID', name: 'Indonésie', dialCode: '+62', flag: '🇮🇩' },
    { code: 'IE', name: 'Irlande', dialCode: '+353', flag: '🇮🇪' },
    { code: 'IL', name: 'Israël', dialCode: '+972', flag: '🇮🇱' },
    { code: 'IM', name: 'Île de Man', dialCode: '+44', flag: '🇮🇲' },
    { code: 'IN', name: 'Inde', dialCode: '+91', flag: '🇮🇳' },
    { code: 'IO', name: 'Territoire britannique de l\'océan Indien', dialCode: '+246', flag: '🇮🇴' },
    { code: 'IQ', name: 'Irak', dialCode: '+964', flag: '🇮🇶' },
    { code: 'IR', name: 'Iran', dialCode: '+98', flag: '🇮🇷' },
    { code: 'IS', name: 'Islande', dialCode: '+354', flag: '🇮🇸' },
    { code: 'JE', name: 'Jersey', dialCode: '+44', flag: '🇯🇪' },
    { code: 'JM', name: 'Jamaïque', dialCode: '+1', flag: '🇯🇲' },
    { code: 'JO', name: 'Jordanie', dialCode: '+962', flag: '🇯🇴' },
    { code: 'JP', name: 'Japon', dialCode: '+81', flag: '🇯🇵' },
    { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
    { code: 'KG', name: 'Kirghizistan', dialCode: '+996', flag: '🇰🇬' },
    { code: 'KH', name: 'Cambodge', dialCode: '+855', flag: '🇰🇭' },
    { code: 'KI', name: 'Kiribati', dialCode: '+686', flag: '🇰🇮' },
    { code: 'KM', name: 'Comores', dialCode: '+269', flag: '🇰🇲' },
    { code: 'KN', name: 'Saint-Kitts-et-Nevis', dialCode: '+1', flag: '🇰🇳' },
    { code: 'KP', name: 'Corée du Nord', dialCode: '+850', flag: '🇰🇵' },
    { code: 'KR', name: 'Corée du Sud', dialCode: '+82', flag: '🇰🇷' },
    { code: 'KW', name: 'Koweït', dialCode: '+965', flag: '🇰🇼' },
    { code: 'KY', name: 'Îles Caïmans', dialCode: '+1', flag: '🇰🇾' },
    { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', flag: '🇰🇿' },
    { code: 'LA', name: 'Laos', dialCode: '+856', flag: '🇱🇦' },
    { code: 'LB', name: 'Liban', dialCode: '+961', flag: '🇱🇧' },
    { code: 'LC', name: 'Sainte-Lucie', dialCode: '+1', flag: '🇱🇨' },
    { code: 'LI', name: 'Liechtenstein', dialCode: '+423', flag: '🇱🇮' },
    { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
    { code: 'LR', name: 'Liberia', dialCode: '+231', flag: '🇱🇷' },
    { code: 'LS', name: 'Lesotho', dialCode: '+266', flag: '🇱🇸' },
    { code: 'LT', name: 'Lituanie', dialCode: '+370', flag: '🇱🇹' },
    { code: 'LV', name: 'Lettonie', dialCode: '+371', flag: '🇱🇻' },
    { code: 'LY', name: 'Libye', dialCode: '+218', flag: '🇱🇾' },
    { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦' },
    { code: 'MC', name: 'Monaco', dialCode: '+377', flag: '🇲🇨' },
    { code: 'MD', name: 'Moldavie', dialCode: '+373', flag: '🇲🇩' },
    { code: 'ME', name: 'Monténégro', dialCode: '+382', flag: '🇲🇪' },
    { code: 'MF', name: 'Saint-Martin', dialCode: '+590', flag: '🇲🇫' },
    { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: '🇲🇬' },
    { code: 'MH', name: 'Îles Marshall', dialCode: '+692', flag: '🇲🇭' },
    { code: 'MK', name: 'Macédoine du Nord', dialCode: '+389', flag: '🇲🇰' },
    { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱' },
    { code: 'MM', name: 'Myanmar', dialCode: '+95', flag: '🇲🇲' },
    { code: 'MN', name: 'Mongolie', dialCode: '+976', flag: '🇲🇳' },
    { code: 'MO', name: 'Macao', dialCode: '+853', flag: '🇲🇴' },
    { code: 'MP', name: 'Îles Mariannes du Nord', dialCode: '+1', flag: '🇲🇵' },
    { code: 'MQ', name: 'Martinique', dialCode: '+596', flag: '🇲🇶' },
    { code: 'MR', name: 'Mauritanie', dialCode: '+222', flag: '🇲🇷' },
    { code: 'MS', name: 'Montserrat', dialCode: '+1', flag: '🇲🇸' },
    { code: 'MT', name: 'Malte', dialCode: '+356', flag: '🇲🇹' },
    { code: 'MU', name: 'Maurice', dialCode: '+230', flag: '🇲🇺' },
    { code: 'MV', name: 'Maldives', dialCode: '+960', flag: '🇲🇻' },
    { code: 'MW', name: 'Malawi', dialCode: '+265', flag: '🇲🇼' },
    { code: 'MX', name: 'Mexique', dialCode: '+52', flag: '🇲🇽' },
    { code: 'MY', name: 'Malaisie', dialCode: '+60', flag: '🇲🇾' },
    { code: 'MZ', name: 'Mozambique', dialCode: '+258', flag: '🇲🇿' },
    { code: 'NA', name: 'Namibie', dialCode: '+264', flag: '🇳🇦' },
    { code: 'NC', name: 'Nouvelle-Calédonie', dialCode: '+687', flag: '🇳🇨' },
    { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪' },
    { code: 'NF', name: 'Île Norfolk', dialCode: '+672', flag: '🇳🇫' },
    { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
    { code: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮' },
    { code: 'NL', name: 'Pays-Bas', dialCode: '+31', flag: '🇳🇱' },
    { code: 'NO', name: 'Norvège', dialCode: '+47', flag: '🇳🇴' },
    { code: 'NP', name: 'Népal', dialCode: '+977', flag: '🇳🇵' },
    { code: 'NR', name: 'Nauru', dialCode: '+674', flag: '🇳🇷' },
    { code: 'NU', name: 'Niue', dialCode: '+683', flag: '🇳🇺' },
    { code: 'NZ', name: 'Nouvelle-Zélande', dialCode: '+64', flag: '🇳🇿' },
    { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲' },
    { code: 'PA', name: 'Panama', dialCode: '+507', flag: '🇵🇦' },
    { code: 'PE', name: 'Pérou', dialCode: '+51', flag: '🇵🇪' },
    { code: 'PF', name: 'Polynésie française', dialCode: '+689', flag: '🇵🇫' },
    { code: 'PG', name: 'Papouasie-Nouvelle-Guinée', dialCode: '+675', flag: '🇵🇬' },
    { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
    { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
    { code: 'PL', name: 'Pologne', dialCode: '+48', flag: '🇵🇱' },
    { code: 'PM', name: 'Saint-Pierre-et-Miquelon', dialCode: '+508', flag: '🇵🇲' },
    { code: 'PN', name: 'Pitcairn', dialCode: '+64', flag: '🇵🇳' },
    { code: 'PR', name: 'Porto Rico', dialCode: '+1', flag: '🇵🇷' },
    { code: 'PS', name: 'Palestine', dialCode: '+970', flag: '🇵🇸' },
    { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
    { code: 'PW', name: 'Palaos', dialCode: '+680', flag: '🇵🇼' },
    { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
    { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
    { code: 'RE', name: 'La Réunion', dialCode: '+262', flag: '🇷🇪' },
    { code: 'RO', name: 'Roumanie', dialCode: '+40', flag: '🇷🇴' },
    { code: 'RS', name: 'Serbie', dialCode: '+381', flag: '🇷🇸' },
    { code: 'RU', name: 'Russie', dialCode: '+7', flag: '🇷🇺' },
    { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼' },
    { code: 'SA', name: 'Arabie saoudite', dialCode: '+966', flag: '🇸🇦' },
    { code: 'SB', name: 'Îles Salomon', dialCode: '+677', flag: '🇸🇧' },
    { code: 'SC', name: 'Seychelles', dialCode: '+248', flag: '🇸🇨' },
    { code: 'SD', name: 'Soudan', dialCode: '+249', flag: '🇸🇩' },
    { code: 'SE', name: 'Suède', dialCode: '+46', flag: '🇸🇪' },
    { code: 'SG', name: 'Singapour', dialCode: '+65', flag: '🇸🇬' },
    { code: 'SH', name: 'Sainte-Hélène', dialCode: '+290', flag: '🇸🇭' },
    { code: 'SI', name: 'Slovénie', dialCode: '+386', flag: '🇸🇮' },
    { code: 'SJ', name: 'Svalbard et Jan Mayen', dialCode: '+47', flag: '🇸🇯' },
    { code: 'SK', name: 'Slovaquie', dialCode: '+421', flag: '🇸🇰' },
    { code: 'SL', name: 'Sierra Leone', dialCode: '+232', flag: '🇸🇱' },
    { code: 'SM', name: 'Saint-Marin', dialCode: '+378', flag: '🇸🇲' },
    { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳' },
    { code: 'SO', name: 'Somalie', dialCode: '+252', flag: '🇸🇴' },
    { code: 'SR', name: 'Suriname', dialCode: '+597', flag: '🇸🇷' },
    { code: 'SS', name: 'Soudan du Sud', dialCode: '+211', flag: '🇸🇸' },
    { code: 'ST', name: 'São Tomé-et-Príncipe', dialCode: '+239', flag: '🇸🇹' },
    { code: 'SV', name: 'Salvador', dialCode: '+503', flag: '🇸🇻' },
    { code: 'SX', name: 'Saint-Martin (partie néerlandaise)', dialCode: '+1', flag: '🇸🇽' },
    { code: 'SY', name: 'Syrie', dialCode: '+963', flag: '🇸🇾' },
    { code: 'SZ', name: 'Eswatini', dialCode: '+268', flag: '🇸🇿' },
    { code: 'TC', name: 'Îles Turques-et-Caïques', dialCode: '+1', flag: '🇹🇨' },
    { code: 'TD', name: 'Tchad', dialCode: '+235', flag: '🇹🇩' },
    { code: 'TF', name: 'Terres australes françaises', dialCode: '+262', flag: '🇹🇫' },
    { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬' },
    { code: 'TH', name: 'Thaïlande', dialCode: '+66', flag: '🇹🇭' },
    { code: 'TJ', name: 'Tadjikistan', dialCode: '+992', flag: '🇹🇯' },
    { code: 'TK', name: 'Tokelau', dialCode: '+690', flag: '🇹🇰' },
    { code: 'TL', name: 'Timor oriental', dialCode: '+670', flag: '🇹🇱' },
    { code: 'TM', name: 'Turkménistan', dialCode: '+993', flag: '🇹🇲' },
    { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳' },
    { code: 'TO', name: 'Tonga', dialCode: '+676', flag: '🇹🇴' },
    { code: 'TR', name: 'Turquie', dialCode: '+90', flag: '🇹🇷' },
    { code: 'TT', name: 'Trinité-et-Tobago', dialCode: '+1', flag: '🇹🇹' },
    { code: 'TV', name: 'Tuvalu', dialCode: '+688', flag: '🇹🇻' },
    { code: 'TW', name: 'Taïwan', dialCode: '+886', flag: '🇹🇼' },
    { code: 'TZ', name: 'Tanzanie', dialCode: '+255', flag: '🇹🇿' },
    { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦' },
    { code: 'UG', name: 'Ouganda', dialCode: '+256', flag: '🇺🇬' },
    { code: 'UM', name: 'Îles mineures éloignées des États-Unis', dialCode: '+1', flag: '🇺🇲' },
    { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
    { code: 'UZ', name: 'Ouzbékistan', dialCode: '+998', flag: '🇺🇿' },
    { code: 'VA', name: 'Vatican', dialCode: '+39', flag: '🇻🇦' },
    { code: 'VC', name: 'Saint-Vincent-et-les-Grenadines', dialCode: '+1', flag: '🇻🇨' },
    { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
    { code: 'VG', name: 'Îles Vierges britanniques', dialCode: '+1', flag: '🇻🇬' },
    { code: 'VI', name: 'Îles Vierges américaines', dialCode: '+1', flag: '🇻🇮' },
    { code: 'VN', name: 'Viêt Nam', dialCode: '+84', flag: '🇻🇳' },
    { code: 'VU', name: 'Vanuatu', dialCode: '+678', flag: '🇻🇺' },
    { code: 'WF', name: 'Wallis-et-Futuna', dialCode: '+681', flag: '🇼🇫' },
    { code: 'WS', name: 'Samoa', dialCode: '+685', flag: '🇼🇸' },
    { code: 'XK', name: 'Kosovo', dialCode: '+383', flag: '🇽🇰' },
    { code: 'YE', name: 'Yémen', dialCode: '+967', flag: '🇾🇪' },
    { code: 'YT', name: 'Mayotte', dialCode: '+262', flag: '🇾🇹' },
    { code: 'ZA', name: 'Afrique du Sud', dialCode: '+27', flag: '🇿🇦' },
    { code: 'ZM', name: 'Zambie', dialCode: '+260', flag: '🇿🇲' },
    { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼' },
  ];

  // Formater le numéro selon le pays (formatage simple)
  const formatPhoneNumber = (value: string, countryCode: string) => {
    if (!value) return value;
    
    // Retirer tous les caractères non numériques
    const digits = value.replace(/\D/g, '');
    
    // Retourner les chiffres sans formatage spécifique (formatage libre)
    return digits;
  };

  // Obtenir le placeholder selon le pays avec format complet
  const getPhonePlaceholder = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (!country) return '06 12 34 56 78';
    
    // Formats de numéros par pays (sans l'indicatif, qui est déjà dans le sélecteur)
    const phoneFormats: Record<string, string> = {
      'FR': '06 12 34 56 78',
      'BE': '0471 23 45 67',
      'CH': '079 123 45 67',
      'LU': '621 123 456',
      'DE': '0172 1234567',
      'ES': '612 34 56 78',
      'IT': '312 345 6789',
      'GB': '07123 456789',
      'US': '(555) 123-4567',
      'CA': '(555) 123-4567',
      'AD': '123 456',
      'AE': '50 123 4567',
      'AF': '70 123 4567',
      'AL': '67 123 4567',
      'AM': '91 123456',
      'AO': '923 123 456',
      'AR': '11 1234-5678',
      'AT': '0664 123456',
      'AU': '0412 345 678',
      'AZ': '50 123 45 67',
      'BA': '61 123 456',
      'BD': '1712 345678',
      'BG': '888 123 456',
      'BH': '3612 3456',
      'BR': '(11) 91234-5678',
      'BY': '29 123-45-67',
      'BZ': '612 3456',
      'CN': '138 0013 8000',
      'CO': '321 123 4567',
      'CR': '8312 3456',
      'CU': '5 123 4567',
      'CY': '96 123456',
      'CZ': '601 123 456',
      'DK': '20 12 34 56',
      'DO': '809 123 4567',
      'DZ': '551 23 45 67',
      'EC': '99 123 4567',
      'EE': '5123 4567',
      'EG': '10 1234 5678',
      'FI': '50 123 4567',
      'GR': '691 234 5678',
      'GT': '5123 4567',
      'HK': '9123 4567',
      'HR': '91 123 4567',
      'HU': '20 123 4567',
      'ID': '812-3456-7890',
      'IE': '85 123 4567',
      'IL': '50-123-4567',
      'IN': '98765 43210',
      'IS': '612 3456',
      'JP': '90-1234-5678',
      'KE': '712 123456',
      'KR': '10-1234-5678',
      'KW': '5012 3456',
      'KZ': '701 234 5678',
      'LB': '3 123 456',
      'LT': '612 34567',
      'LV': '21234567',
      'MA': '612-345678',
      'MC': '6 12 34 56 78',
      'MD': '621 12 345',
      'MX': '55 1234 5678',
      'MY': '12-345 6789',
      'NL': '6 12345678',
      'NO': '412 34 567',
      'NZ': '21 123 4567',
      'PA': '6123-4567',
      'PE': '987 654 321',
      'PH': '917 123 4567',
      'PL': '512 345 678',
      'PT': '912 345 678',
      'QA': '3312 3456',
      'RO': '712 345 678',
      'RS': '60 1234567',
      'RU': '912 345-67-89',
      'SA': '50 123 4567',
      'SE': '70-123 45 67',
      'SG': '8123 4567',
      'SI': '31 234 567',
      'SK': '912 123 456',
      'TH': '81 234 5678',
      'TN': '20 123 456',
      'TR': '532 123 45 67',
      'TW': '9123 4567',
      'UA': '50 123 4567',
      'UY': '99 123 456',
      'VE': '412-1234567',
      'VN': '91 234 5678',
      'ZA': '82 123 4567',
      'ZW': '71 234 5678',
    };
    
    return phoneFormats[countryCode] || '123 456 7890';
  };

  useEffect(() => {
    setEmail(prefillEmail);
  }, [prefillEmail]);

  if (!isOpen) return null;

  const texts = {
    fr: {
      signIn: 'Se connecter',
      signUp: 'Créer un compte',
      email: 'Email',
      password: 'Mot de passe',
      needHelp: 'Besoin d\'aide ?',
      call: 'Appeler',
      whatsapp: 'WhatsApp',
      whyAccount: 'Pourquoi créer un compte ?',
      benefits: [
        'Suivez vos réservations',
        'Accédez à vos factures',
        'Signez vos contrats',
        'Suivez vos livraisons',
      ],
      close: 'Fermer',
      title: 'Titre',
      mr: 'Monsieur',
      mme: 'Madame',
      firstName: 'Prénom',
      lastName: 'Nom',
      phone: 'Téléphone',
    },
    en: {
      signIn: 'Sign in',
      signUp: 'Sign up',
      email: 'Email',
      password: 'Password',
      needHelp: 'Need help?',
      call: 'Call',
      whatsapp: 'WhatsApp',
      whyAccount: 'Why create an account?',
      benefits: [
        'Track your reservations',
        'Access your invoices',
        'Sign your contracts',
        'Track your deliveries',
      ],
      close: 'Close',
      title: 'Title',
      mr: 'Mr',
      mme: 'Mrs',
      firstName: 'First name',
      lastName: 'Last name',
      phone: 'Phone',
    },
  };

  const currentTexts = texts[language];

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signInWithEmail(email, password);
    if (!result.error) {
      // Attendre un peu pour que la session soit bien établie
      setTimeout(() => {
        onSuccess?.();
        onClose();
        // Si pas de callback onSuccess, rediriger vers le dashboard
        if (!onSuccess && typeof window !== 'undefined') {
          window.location.href = isAdmin ? '/admin' : '/dashboard';
        }
      }, 500);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs requis
    if (!firstName || !lastName || !phone || !email || !password) {
      return;
    }
    
    // Formater le numéro de téléphone avec l'indicatif
    const selectedCountry = countries.find(c => c.code === phoneCountry);
    const fullPhone = selectedCountry ? `${selectedCountry.dialCode} ${phone}` : phone;
    
    const result = await signUpWithEmail(email, password, {
      title,
      firstName,
      lastName,
      phone: fullPhone,
    });
    
    if (!result.error) {
      setSignUpSuccess(true);
      // Ne pas fermer immédiatement pour afficher le message
      // Si l'utilisateur a une session, on peut appeler onSuccess après un délai
      if (result.data?.session && onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-2xl font-bold text-black">
            {isAdmin 
              ? (language === 'fr' ? 'Administrateur' : 'Administrator')
              : (activeTab === 'signin' ? currentTexts.signIn : currentTexts.signUp)
            }
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={currentTexts.close}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tabs - masqués pour admin */}
          {!isAdmin && (
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => {
                  setActiveTab('signin');
                }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'signin'
                    ? 'text-[#F2431E] border-b-2 border-[#F2431E]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {currentTexts.signIn}
              </button>
              <button
                onClick={() => {
                  setActiveTab('signup');
                }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'signup'
                    ? 'text-[#F2431E] border-b-2 border-[#F2431E]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {currentTexts.signUp}
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Sign up success message */}
          {signUpSuccess && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              <div className="font-semibold mb-2">
                {language === 'fr' ? '✅ Compte créé avec succès !' : '✅ Account created successfully!'}
              </div>
              <p className="mb-2">
                {language === 'fr' 
                  ? 'Nous vous avons envoyé un email de confirmation. Veuillez vérifier votre boîte de réception (et vos spams) et cliquer sur le lien pour valider votre compte.'
                  : 'We have sent you a confirmation email. Please check your inbox (and spam folder) and click the link to validate your account.'}
              </p>
              <button
                onClick={() => {
                  setSignUpSuccess(false);
                  onSuccess?.();
                  onClose();
                }}
                className="mt-2 w-full bg-[#F2431E] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#E63A1A] transition-colors"
              >
                {language === 'fr' ? 'Compris' : 'Got it'}
              </button>
            </div>
          )}


          {/* Forms */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.email}
                </label>
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.password}
                </label>
                <input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#F2431E] text-white rounded-xl font-bold hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '...' : currentTexts.signIn}
              </button>
            </form>
          )}

          {/* Lien administrateur - visible uniquement sur l'onglet connexion utilisateur */}
          {activeTab === 'signin' && !isAdmin && onOpenAdminModal && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminModal();
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#F2431E] transition-colors group"
              >
                <span>{language === 'fr' ? 'Administrateur' : 'Administrator'}</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Lien utilisateur - visible uniquement sur le modal admin */}
          {activeTab === 'signin' && isAdmin && onOpenUserModal && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  onClose();
                  onOpenUserModal();
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#F2431E] transition-colors group"
              >
                <span>{language === 'fr' ? 'Utilisateur' : 'User'}</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {activeTab === 'signup' && !isAdmin && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="signup-title" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.title} <span className="text-red-500">*</span>
                </label>
                <select
                  id="signup-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value as 'mr' | 'mme')}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none bg-white"
                >
                  <option value="mr">{currentTexts.mr}</option>
                  <option value="mme">{currentTexts.mme}</option>
                </select>
              </div>
              <div>
                <label htmlFor="signup-firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.firstName} <span className="text-red-500">*</span>
                </label>
                <input
                  id="signup-firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none"
                  placeholder={language === 'fr' ? 'Votre prénom' : 'Your first name'}
                />
              </div>
              <div>
                <label htmlFor="signup-lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.lastName} <span className="text-red-500">*</span>
                </label>
                <input
                  id="signup-lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none"
                  placeholder={language === 'fr' ? 'Votre nom' : 'Your last name'}
                />
              </div>
              <div>
                <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.phone} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={phoneCountry}
                    onChange={(e) => {
                      setPhoneCountry(e.target.value);
                      setPhone(''); // Réinitialiser le numéro quand on change de pays
                    }}
                    className="w-40 p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none bg-white text-sm"
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.dialCode} {country.name}
                      </option>
                    ))}
                  </select>
                  <input
                    id="signup-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value, phoneCountry);
                      setPhone(formatted);
                    }}
                    required
                    className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none"
                    placeholder={getPhonePlaceholder(phoneCountry)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.email} <span className="text-red-500">*</span>
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">
                  {currentTexts.password} <span className="text-red-500">*</span>
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-gray-500">Minimum 6 caractères</p>
              </div>
              <button
                type="submit"
                disabled={loading || !firstName || !lastName || !phone || !email || !password}
                className="w-full py-3 bg-[#F2431E] text-white rounded-xl font-bold hover:bg-[#E63A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '...' : currentTexts.signUp}
              </button>
            </form>
          )}


          {/* Why account section - masquée pour admin */}
          {!isAdmin && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold text-black mb-2">{currentTexts.whyAccount}</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {currentTexts.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-[#F2431E]">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Avertissement sécurité - visible uniquement sur le modal admin */}
          {isAdmin && activeTab === 'signin' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 text-center">
                {language === 'fr' 
                  ? '⚠️ Toute tentative de connexion non autorisée sera enregistrée'
                  : '⚠️ Any unauthorized login attempt will be recorded'}
              </p>
            </div>
          )}

          {/* Help section - masquée pour admin */}
          {!isAdmin && (
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">{currentTexts.needHelp}</p>
              <div className="flex gap-4 justify-center">
                <a
                  href="tel:+33123456789"
                  className="text-[#F2431E] font-semibold hover:underline"
                >
                  {currentTexts.call}
                </a>
                <a
                  href="https://wa.me/33123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F2431E] font-semibold hover:underline"
                >
                  {currentTexts.whatsapp}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

