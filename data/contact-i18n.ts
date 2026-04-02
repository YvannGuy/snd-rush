import { type HomeLocale, resolveHomeContentLocale } from '@/data/home-i18n';

export type ContactCopy = {
  trust: Array<{ icon: 'timer' | 'shield' | 'wrench' | 'users'; title: string }>;
  intro: {
    kicker: string;
    title: string;
    highlight: string;
    body: string;
    contactLabel: string;
    contactEmail: string;
    processLabel: string;
    steps: Array<{ number: string; title: string }>;
  };
  methodology: {
    title: string;
    steps: Array<{ number: string; title: string; body: string }>;
  };
  faq: {
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
  form: {
    sections: {
      contact: string;
      event: string;
      services: string;
      message: string;
      files: string;
    };
    labels: {
      name: string;
      company: string;
      email: string;
      phone: string;
      eventType: string;
      attendees: string;
      date: string;
      location: string;
      servicesCounter: string;
      message: string;
      fileDrop: string;
      fileHint: string;
      browse: string;
      consent: string;
    };
    placeholders: {
      name: string;
      company: string;
      email: string;
      phone: string;
      eventType: string;
      attendees: string;
      date: string;
      location: string;
      message: string;
    };
    servicesOptions: string[];
    selectServices: string;
    selectedServices: string; // use {count}
    cta: string;
    success: string;
    errors: {
      requiredIdentity: string;
      requiredEvent: string;
      requiredServices: string;
      requiredMessage: string;
      consent: string;
      fileTooLarge: string;
      submit: string;
    };
  };
};

const contactFR: ContactCopy = {
  trust: [
    { icon: 'timer', title: 'Réponse sous 24h' },
    { icon: 'shield', title: 'Devis sur mesure' },
    { icon: 'wrench', title: 'Expertise technique' },
    { icon: 'users', title: 'Événements 10K+ personnes' },
  ],
  intro: {
    kicker: 'Votre projet',
    title: 'Parlons de',
    highlight: 'votre événement',
    body:
      'Décrivez votre événement, votre lieu, vos contraintes et le rendu attendu. Nous vous accompagnons de la préparation technique à l’exploitation sur site, avec une exécution fluide et fiable.',
    contactLabel: 'Contact direct',
    contactEmail: 'devis@guylocationevents.com',
    processLabel: 'Processus de devis',
    steps: [
      { number: '01', title: 'Analyse du besoin' },
      { number: '02', title: 'Préparation technique' },
      { number: '03', title: 'Installation & exploitation' },
    ],
  },
  methodology: {
    title: 'Comment nous travaillons',
    steps: [
      {
        number: '01',
        title: 'Analyse du besoin',
        body: 'Nous échangeons sur votre événement, votre lieu, vos contraintes et le rendu attendu.',
      },
      {
        number: '02',
        title: 'Préparation technique',
        body: 'Nous définissons le matériel, l’installation et l’organisation les plus adaptés.',
      },
      {
        number: '03',
        title: 'Installation & exploitation',
        body: 'Nous installons le dispositif, faisons les réglages et assurons le bon déroulement le jour J.',
      },
    ],
  },
  faq: {
    title: 'Questions fréquentes',
    items: [
      {
        question: 'Quels sont les délais habituels pour un devis ?',
        answer:
          'Nous revenons sous 24h avec une première estimation ou une demande de précisions pour cadrer le budget.',
      },
      {
        question: 'Quelle est votre zone d’intervention ?',
        answer: 'Basés à Paris, nous intervenons partout en France et en Europe selon la logistique du projet.',
      },
      {
        question: 'Gérez-vous également la régie complète ?',
        answer:
          'Oui, régie audiovisuelle, coordination prestataires, show-call et supervision live pour garantir la fluidité.',
      },
      {
        question: 'Pouvez-vous intervenir sur de grands événements ?',
        answer:
          'Oui, nous dimensionnons son, lumière, vidéo et LED pour des jauges 10k+ avec redondance et tolérance de panne.',
      },
      {
        question: 'Peut-on vous contacter sans brief technique précis ?',
        answer:
          'Absolument. Nous pouvons co-construire le cadrage, prioriser les besoins et recommander les options techniques.',
      },
    ],
  },
  form: {
    sections: {
      contact: '01. Coordonnées',
      event: '02. Détail événement',
      services: '03. Prestations requises',
      message: 'Message / besoins spécifiques',
      files: 'Documents techniques (PDF, DWG, PNG, JPEG)',
    },
    labels: {
      name: 'Nom complet',
      company: 'Société (optionnel)',
      email: 'E-mail',
      phone: 'Téléphone (optionnel)',
      eventType: 'Type d’événement',
      attendees: 'Nombre de participants',
      date: 'Date désirée',
      location: 'Lieu / ville',
      servicesCounter: 'prestations sélectionnées',
      message: 'Message / besoins spécifiques',
      fileDrop: 'Déposez votre brief ou plan (PDF, DWG, PNG, JPEG)',
      fileHint: '10 Mo max',
      browse: 'Parcourir',
      consent: 'J’accepte que mes données soient utilisées pour traiter ma demande de devis.',
    },
    placeholders: {
      name: 'Nom Prénom',
      company: 'Votre structure',
      email: 'vous@exemple.com',
      phone: '+33 ...',
      eventType: 'Choisir mon événement',
      attendees: 'ex : 1 000',
      date: 'JJ/MM/AAAA',
      location: 'Paris, Lyon...',
      message: 'Détaillez votre vision ici…',
    },
    servicesOptions: ['Son', 'Lumière', 'Photo', 'Vidéo', 'Régie'],
    selectServices: 'Sélectionnez une ou plusieurs prestations souhaitées',
    selectedServices: '{count} sélectionnée(s)',
    cta: 'Envoyer ma demande',
    success: 'Demande envoyée. Nous revenons vers vous sous 24h.',
    errors: {
      requiredIdentity: 'Merci de renseigner votre nom et votre e-mail.',
      requiredEvent: 'Merci de compléter tous les champs de la section « Détail événement ».',
      requiredServices: 'Sélectionnez au moins une prestation requise.',
      requiredMessage: 'Merci de décrire votre besoin dans le message.',
      consent: 'Merci d’accepter l’utilisation de vos données pour traiter votre demande.',
      fileTooLarge: 'Fichier trop volumineux (10 Mo max).',
      submit: 'Une erreur est survenue. Merci de réessayer ou de nous contacter directement.',
    },
  },
};

const contactEN: ContactCopy = {
  trust: [
    { icon: 'timer', title: 'Reply within 24h' },
    { icon: 'shield', title: 'Tailored quote' },
    { icon: 'wrench', title: 'Technical expertise' },
    { icon: 'users', title: '10K+ capacity events' },
  ],
  intro: {
    kicker: 'Your project',
    title: 'Let’s talk about',
    highlight: 'your event',
    body:
      'Describe your event, venue, constraints and the expected outcome. We support you from technical prep to on-site delivery with smooth, reliable execution.',
    contactLabel: 'Direct contact',
    contactEmail: 'devis@guylocationevents.com',
    processLabel: 'Quote process',
    steps: [
      { number: '01', title: 'Needs analysis' },
      { number: '02', title: 'Technical preparation' },
      { number: '03', title: 'Setup & show control' },
    ],
  },
  methodology: {
    title: 'How we work',
    steps: [
      {
        number: '01',
        title: 'Needs analysis',
        body: 'We discuss your event, venue, constraints and desired outcome.',
      },
      {
        number: '02',
        title: 'Technical preparation',
        body: 'We define the right equipment, installation plan and organization.',
      },
      {
        number: '03',
        title: 'Setup & operation',
        body: 'We install, tune the system and ensure smooth operations on show day.',
      },
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        question: 'What is your usual turnaround for a quote?',
        answer: 'We reply within 24h with an estimate or clarifying questions to frame the budget.',
      },
      {
        question: 'Where do you operate?',
        answer: 'Based in Paris, we operate across France and Europe depending on logistics.',
      },
      {
        question: 'Do you handle full show control?',
        answer: 'Yes: AV direction, vendor coordination, show-calling and live supervision for smooth delivery.',
      },
      {
        question: 'Can you handle large-scale events?',
        answer:
          'Yes, we scale sound, lighting, video and LED for 10k+ audiences with redundancy and failure tolerance.',
      },
      {
        question: 'Can we contact you without a detailed brief?',
        answer: 'Absolutely. We can co-design the scope, prioritize needs and recommend technical options.',
      },
    ],
  },
  form: {
    sections: {
      contact: '01. Contact details',
      event: '02. Event details',
      services: '03. Required services',
      message: 'Message / specific needs',
      files: 'Technical documents (PDF, DWG, PNG, JPEG)',
    },
    labels: {
      name: 'Full name',
      company: 'Company (optional)',
      email: 'Email',
      phone: 'Phone (optional)',
      eventType: 'Event type',
      attendees: 'Number of attendees',
      date: 'Requested date',
      location: 'Venue / city',
      servicesCounter: 'selected services',
      message: 'Message / specific needs',
      fileDrop: 'Drop your brief or plan (PDF, DWG, PNG, JPEG)',
      fileHint: '10 MB max',
      browse: 'Browse',
      consent: 'I agree to the use of my data to process my request.',
    },
    placeholders: {
      name: 'First Last',
      company: 'Your company',
      email: 'you@example.com',
      phone: '+33 ...',
      eventType: 'Concert, conference, launch...',
      attendees: 'e.g. 1,000',
      date: 'DD/MM/YYYY',
      location: 'Paris, Lyon...',
      message: 'Describe your vision here…',
    },
    servicesOptions: ['Sound', 'Lighting', 'Photo', 'Video', 'Show control'],
    selectServices: 'Select your services',
    selectedServices: '{count} selected',
    cta: 'Submit my request',
    success: 'Request sent. We will get back to you within 24h.',
    errors: {
      requiredIdentity: 'Please enter your name and email.',
      requiredEvent: 'Please fill all fields in “Event details”.',
      requiredServices: 'Select at least one required service.',
      requiredMessage: 'Please describe your need in the message.',
      consent: 'Please accept data use to process your request.',
      fileTooLarge: 'File too large (10 MB max).',
      submit: 'An error occurred. Please try again or contact us directly.',
    },
  },
};

const contactIT: ContactCopy = {
  trust: [
    { icon: 'timer', title: 'Risposta entro 24h' },
    { icon: 'shield', title: 'Preventivo su misura' },
    { icon: 'wrench', title: 'Competenza tecnica' },
    { icon: 'users', title: 'Eventi 10K+ persone' },
  ],
  intro: {
    kicker: 'Il tuo progetto',
    title: 'Parliamo del',
    highlight: 'tuo evento',
    body:
      'Descrivi evento, location, vincoli e risultato atteso. Ti accompagniamo dalla preparazione tecnica alla produzione live, con esecuzione fluida e affidabile.',
    contactLabel: 'Contatto diretto',
    contactEmail: 'devis@guylocationevents.com',
    processLabel: 'Processo preventivo',
    steps: [
      { number: '01', title: 'Analisi del bisogno' },
      { number: '02', title: 'Preparazione tecnica' },
      { number: '03', title: 'Installazione e regia' },
    ],
  },
  methodology: {
    title: 'Come lavoriamo',
    steps: [
      {
        number: '01',
        title: 'Analisi del bisogno',
        body: 'Discutiamo evento, location, vincoli e risultato desiderato.',
      },
      {
        number: '02',
        title: 'Preparazione tecnica',
        body: 'Definiamo attrezzature, piano di installazione e organizzazione.',
      },
      {
        number: '03',
        title: 'Installazione e conduzione',
        body: 'Installiamo, regoliamo e garantiamo la fluidità il giorno dello show.',
      },
    ],
  },
  faq: {
    title: 'Domande frequenti',
    items: [
      {
        question: 'Quali sono i tempi per un preventivo?',
        answer: 'Rispondiamo entro 24h con una stima o richieste di dettaglio per definire il budget.',
      },
      {
        question: 'Dove operate?',
        answer: 'Basati a Parigi, lavoriamo in tutta la Francia e in Europa secondo la logistica.',
      },
      {
        question: 'Gestite anche la regia completa?',
        answer: 'Sì: direzione AV, coordinamento fornitori, show-call e supervisione live.',
      },
      {
        question: 'Gestite grandi eventi?',
        answer: 'Sì, dimensioniamo audio, luci, video e LED per 10k+ con ridondanza e tolleranza guasti.',
      },
      {
        question: 'Posso contattarvi senza brief dettagliato?',
        answer: 'Certo. Possiamo co-definire il perimetro, priorizzare i bisogni e proporre opzioni tecniche.',
      },
    ],
  },
  form: {
    sections: {
      contact: '01. Contatti',
      event: '02. Dettagli evento',
      services: '03. Servizi richiesti',
      message: 'Messaggio / esigenze specifiche',
      files: 'Documenti tecnici (PDF, DWG, PNG, JPEG)',
    },
    labels: {
      name: 'Nome completo',
      company: 'Azienda (opzionale)',
      email: 'E-mail',
      phone: 'Telefono (opzionale)',
      eventType: 'Tipo di evento',
      attendees: 'Numero di partecipanti',
      date: 'Data richiesta',
      location: 'Luogo / città',
      servicesCounter: 'servizi selezionati',
      message: 'Messaggio / esigenze specifiche',
      fileDrop: 'Carica il brief o il planimetrico (PDF, DWG, PNG, JPEG)',
      fileHint: 'Max 10 MB',
      browse: 'Sfoglia',
      consent: 'Accetto l’uso dei miei dati per gestire la richiesta.',
    },
    placeholders: {
      name: 'Nome Cognome',
      company: 'La tua azienda',
      email: 'nome@esempio.it',
      phone: '+39 ...',
      eventType: 'Concerto, conferenza, lancio...',
      attendees: 'es: 1.000',
      date: 'GG/MM/AAAA',
      location: 'Roma, Milano...',
      message: 'Descrivi qui la tua visione…',
    },
    servicesOptions: ['Audio', 'Luci', 'LED wall', 'Video', 'Regia tecnica'],
    selectServices: 'Seleziona i servizi',
    selectedServices: '{count} selezionato/i',
    cta: 'Invia la richiesta',
    success: 'Richiesta inviata. Ti ricontattiamo entro 24h.',
    errors: {
      requiredIdentity: 'Inserisci nome ed e-mail.',
      requiredEvent: 'Completa tutti i campi in “Dettagli evento”.',
      requiredServices: 'Seleziona almeno un servizio richiesto.',
      requiredMessage: 'Descrivi il bisogno nel messaggio.',
      consent: 'Accetta l’uso dei dati per gestire la richiesta.',
      fileTooLarge: 'File troppo grande (max 10 MB).',
      submit: 'Si è verificato un errore. Riprova o contattaci direttamente.',
    },
  },
};

const contactES: ContactCopy = {
  trust: [
    { icon: 'timer', title: 'Respuesta en 24h' },
    { icon: 'shield', title: 'Presupuesto a medida' },
    { icon: 'wrench', title: 'Experiencia técnica' },
    { icon: 'users', title: 'Eventos 10K+ personas' },
  ],
  intro: {
    kicker: 'Tu proyecto',
    title: 'Hablemos de',
    highlight: 'tu evento',
    body:
      'Describe el evento, el lugar, las restricciones y el resultado esperado. Te acompañamos desde la preparación técnica hasta la producción en vivo con una ejecución fluida y fiable.',
    contactLabel: 'Contacto directo',
    contactEmail: 'devis@guylocationevents.com',
    processLabel: 'Proceso de presupuesto',
    steps: [
      { number: '01', title: 'Análisis de la necesidad' },
      { number: '02', title: 'Preparación técnica' },
      { number: '03', title: 'Instalación y operación' },
    ],
  },
  methodology: {
    title: 'Cómo trabajamos',
    steps: [
      {
        number: '01',
        title: 'Análisis de la necesidad',
        body: 'Hablamos de tu evento, lugar, restricciones y resultado deseado.',
      },
      {
        number: '02',
        title: 'Preparación técnica',
        body: 'Definimos equipos, plan de instalación y organización óptimos.',
      },
      {
        number: '03',
        title: 'Instalación y regiduría',
        body: 'Instalamos, ajustamos y garantizamos fluidez el día del show.',
      },
    ],
  },
  faq: {
    title: 'Preguntas frecuentes',
    items: [
      {
        question: '¿Plazos habituales para un presupuesto?',
        answer: 'Respondemos en 24h con una estimación o aclaraciones para ajustar el presupuesto.',
      },
      {
        question: '¿En qué zonas trabajáis?',
        answer: 'Con base en París, trabajamos en Francia y Europa según la logística.',
      },
      {
        question: '¿Gestionáis también la regiduría completa?',
        answer: 'Sí: dirección AV, coordinación de proveedores, show-call y supervisión en vivo.',
      },
      {
        question: '¿Podéis manejar grandes eventos?',
        answer:
          'Sí, dimensionamos sonido, luces, video y LED para 10k+ con redundancia y tolerancia a fallos.',
      },
      {
        question: '¿Puedo contactar sin brief técnico detallado?',
        answer:
          'Claro. Podemos co-definir el alcance, priorizar necesidades y proponer opciones técnicas.',
      },
    ],
  },
  form: {
    sections: {
      contact: '01. Datos de contacto',
      event: '02. Detalles del evento',
      services: '03. Servicios requeridos',
      message: 'Mensaje / necesidades específicas',
      files: 'Documentos técnicos (PDF, DWG, PNG, JPEG)',
    },
    labels: {
      name: 'Nombre completo',
      company: 'Empresa (opcional)',
      email: 'Correo electrónico',
      phone: 'Teléfono (opcional)',
      eventType: 'Tipo de evento',
      attendees: 'Número de asistentes',
      date: 'Fecha deseada',
      location: 'Lugar / ciudad',
      servicesCounter: 'servicios seleccionados',
      message: 'Mensaje / necesidades específicas',
      fileDrop: 'Sube tu brief o plano (PDF, DWG, PNG, JPEG)',
      fileHint: 'Máx. 10 MB',
      browse: 'Explorar',
      consent: 'Acepto el uso de mis datos para tramitar la solicitud.',
    },
    placeholders: {
      name: 'Nombre Apellido',
      company: 'Tu empresa',
      email: 'tu@ejemplo.com',
      phone: '+34 ...',
      eventType: 'Concierto, conferencia, lanzamiento...',
      attendees: 'ej: 1.000',
      date: 'DD/MM/AAAA',
      location: 'Madrid, Barcelona...',
      message: 'Describe aquí tu visión…',
    },
    servicesOptions: ['Sonido', 'Iluminación', 'Foto', 'Vídeo', 'Regiduría'],
    selectServices: 'Selecciona tus servicios',
    selectedServices: '{count} seleccionado(s)',
    cta: 'Enviar mi solicitud',
    success: 'Solicitud enviada. Te contactamos en 24h.',
    errors: {
      requiredIdentity: 'Introduce tu nombre y e-mail.',
      requiredEvent: 'Completa todos los campos en “Detalles del evento”.',
      requiredServices: 'Selecciona al menos un servicio requerido.',
      requiredMessage: 'Describe tu necesidad en el mensaje.',
      consent: 'Acepta el uso de datos para tramitar la solicitud.',
      fileTooLarge: 'Archivo demasiado grande (máx. 10 MB).',
      submit: 'Ha ocurrido un error. Inténtalo de nuevo o contáctanos directamente.',
    },
  },
};

const contactZH: ContactCopy = {
  trust: [
    { icon: 'timer', title: '24 小时内回复' },
    { icon: 'shield', title: '定制报价' },
    { icon: 'wrench', title: '技术专家' },
    { icon: 'users', title: '10K+ 观众规模' },
  ],
  intro: {
    kicker: '你的项目',
    title: '聊聊',
    highlight: '你的活动',
    body: '描述活动、场地、限制和预期效果。我们从技术准备到现场执行全程陪伴，流程顺畅可靠。',
    contactLabel: '直接联系',
    contactEmail: 'devis@guylocationevents.com',
    processLabel: '报价流程',
    steps: [
      { number: '01', title: '需求分析' },
      { number: '02', title: '技术筹备' },
      { number: '03', title: '安装与执行' },
    ],
  },
  methodology: {
    title: '我们的工作方式',
    steps: [
      {
        number: '01',
        title: '需求分析',
        body: '讨论活动、场地、限制和期望结果。',
      },
      {
        number: '02',
        title: '技术筹备',
        body: '确定设备、安装方案与组织方式。',
      },
      {
        number: '03',
        title: '安装与执行',
        body: '完成安装、调试，并在演出当天确保顺畅运行。',
      },
    ],
  },
  faq: {
    title: '常见问题',
    items: [
      {
        question: '报价周期多久？',
        answer: '我们会在 24 小时内回复估算或确认问题以锁定预算。',
      },
      {
        question: '服务范围在哪里？',
        answer: '总部巴黎，可根据项目在法国和欧洲执行。',
      },
      {
        question: '能否负责完整舞台统筹？',
        answer: '可以：视听指挥、供应商协调、show-call 与现场监督，确保流畅。',
      },
      {
        question: '能否承接大型活动？',
        answer: '可以，我们为 10k+ 观众规模配置音视频和灯光，含冗余与容错。',
      },
      {
        question: '没有详细 brief 也能联系吗？',
        answer: '当然，我们可共建需求、排序优先级并提供技术建议。',
      },
    ],
  },
  form: {
    sections: {
      contact: '01. 联系方式',
      event: '02. 活动详情',
      services: '03. 需求服务',
      message: '留言 / 特殊需求',
      files: '技术文件 (PDF, DWG, PNG, JPEG)',
    },
    labels: {
      name: '姓名',
      company: '公司（可选）',
      email: '电子邮箱',
      phone: '电话（可选）',
      eventType: '活动类型',
      attendees: '人数',
      date: '期望日期',
      location: '场地 / 城市',
      servicesCounter: '项服务已选',
      message: '留言 / 特殊需求',
      fileDrop: '上传 brief 或平面图 (PDF, DWG, PNG, JPEG)',
      fileHint: '最大 10 MB',
      browse: '选择文件',
      consent: '我同意使用我的数据来处理本次请求。',
    },
    placeholders: {
      name: '姓名',
      company: '贵公司',
      email: 'you@example.com',
      phone: '+33 ...',
      eventType: '演唱会、会议、发布会…',
      attendees: '例：1 000',
      date: 'DD/MM/YYYY',
      location: 'Paris, Lyon...',
      message: '在此描述你的需求…',
    },
    servicesOptions: ['音响', '灯光', '摄影', '视频', '舞台统筹'],
    selectServices: '选择所需服务',
    selectedServices: '已选 {count} 项',
    cta: '提交请求',
    success: '请求已发送，我们会在 24 小时内回复。',
    errors: {
      requiredIdentity: '请填写姓名和邮箱。',
      requiredEvent: '请填写“活动详情”所有字段。',
      requiredServices: '请至少选择一项服务。',
      requiredMessage: '请在留言中描述需求。',
      consent: '请勾选同意使用数据以处理请求。',
      fileTooLarge: '文件过大（最大 10 MB）。',
      submit: '发生错误。请重试或直接联系我们。',
    },
  },
};

const CONTACT_COPIES: Record<'fr' | 'en' | 'it' | 'es' | 'zh', ContactCopy> = {
  fr: contactFR,
  en: contactEN,
  it: contactIT,
  es: contactES,
  zh: contactZH,
};

export function getContactCopy(locale: HomeLocale): ContactCopy {
  const lang = resolveHomeContentLocale(locale);
  return CONTACT_COPIES[lang];
}

