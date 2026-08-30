const languageLabels = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
};

const pages = {
  tr: {
    lang: 'tr',
    eyebrow: 'FORGE FIT',
    title: 'Hesap ve veri silme',
    lead: 'Forge Fit, kullanıcı hesabı oluşturmadan çalışır. Profiliniz ve ilerleme bilgileriniz cihazınızda saklanır.',
    sections: [
      {
        heading: 'Forge Fit’te sunucu hesabı yoktur',
        paragraphs: [
          'Forge Fit’e e-posta, şifre veya sosyal hesapla giriş yapılmaz. Bu nedenle silinecek bir sunucu kullanıcı hesabı bulunmaz ve sunucuda profil veritabanı tutulmaz.',
        ],
      },
      {
        heading: 'Cihazınızdaki verileri silme',
        steps: [
          'Android cihazınızda Ayarlar’ı açın.',
          'Uygulamalar bölümünden Forge Fit’i seçin.',
          'Depolama bölümüne girin.',
          'Verileri temizle veya Depolamayı temizle seçeneğine dokunun.',
          'Alternatif olarak Forge Fit’i cihazınızdan kaldırın.',
        ],
        paragraphs: [
          'Bu işlem cihazda bulunan profil, kullanıcı adı, öğün, kilo, antrenman, arkadaş, challenge ve kullanım verilerini siler. Silinen yerel veriler geri getirilemez.',
        ],
      },
      {
        heading: 'Premium aboneliği iptal etme',
        paragraphs: [
          'Uygulamayı kaldırmak Premium aboneliğinizi otomatik olarak iptal etmeyebilir. Aboneliği Google Play Store’daki Abonelikler bölümünden ayrıca iptal edin.',
        ],
      },
      {
        heading: 'Yapay zekâ verileri',
        paragraphs: [
          'AI koç mesajları ve yemek fotoğrafı analizleri yanıt oluşturmak için Forge Fit sunucusu üzerinden yapay zekâ hizmetine gönderilebilir. Bu işlemler için uygulamada bir kullanıcı hesabı oluşturulmaz. Bir gizlilik talebi için Google Play mağaza listelemesinde yer alan geliştirici iletişim kanalını kullanabilirsiniz.',
        ],
      },
    ],
    footer: 'Forge Fit — Verileriniz üzerindeki kontrol sizde.',
    language: 'Dil',
    privacy: 'Gizlilik politikasını görüntüle',
  },
  en: {
    lang: 'en',
    eyebrow: 'FORGE FIT',
    title: 'Account and data deletion',
    lead: 'Forge Fit works without creating a user account. Your profile and progress information are stored on your device.',
    sections: [
      {
        heading: 'Forge Fit does not have server accounts',
        paragraphs: [
          'Forge Fit does not require an email, password, or social sign-in. There is therefore no server user account to delete, and Forge Fit does not maintain a server-side profile database.',
        ],
      },
      {
        heading: 'Delete data from your device',
        steps: [
          'Open Settings on your Android device.',
          'Select Forge Fit from Apps.',
          'Open Storage.',
          'Tap Clear data or Clear storage.',
          'Alternatively, uninstall Forge Fit from your device.',
        ],
        paragraphs: [
          'This removes profile, username, meal, weight, workout, friend, challenge, and usage data stored on the device. Deleted local data cannot be recovered.',
        ],
      },
      {
        heading: 'Cancel your Premium subscription',
        paragraphs: [
          'Uninstalling the app may not automatically cancel your Premium subscription. Cancel the subscription separately from the Subscriptions section of Google Play Store.',
        ],
      },
      {
        heading: 'AI data',
        paragraphs: [
          'AI coach messages and food photo analyses may be sent through the Forge Fit server to an AI service to generate a response. No user account is created for these features. For a privacy request, use the developer contact channel shown on the Google Play store listing.',
        ],
      },
    ],
    footer: 'Forge Fit — You are in control of your data.',
    language: 'Language',
    privacy: 'View privacy policy',
  },
  de: {
    lang: 'de',
    eyebrow: 'FORGE FIT',
    title: 'Konto- und Datenlöschung',
    lead: 'Forge Fit funktioniert ohne die Erstellung eines Benutzerkontos. Profil- und Fortschrittsdaten werden auf deinem Gerät gespeichert.',
    sections: [
      {
        heading: 'Forge Fit hat keine Serverkonten',
        paragraphs: [
          'Forge Fit benötigt keine E-Mail-Adresse, kein Passwort und keine Anmeldung über soziale Netzwerke. Daher gibt es kein Serverkonto zu löschen und Forge Fit führt keine serverseitige Profildatenbank.',
        ],
      },
      {
        heading: 'Daten auf deinem Gerät löschen',
        steps: [
          'Öffne die Einstellungen auf deinem Android-Gerät.',
          'Wähle Forge Fit unter Apps aus.',
          'Öffne den Bereich Speicher.',
          'Tippe auf Daten löschen oder Speicher löschen.',
          'Alternativ kannst du Forge Fit von deinem Gerät deinstallieren.',
        ],
        paragraphs: [
          'Dadurch werden Profil, Benutzername, Mahlzeiten, Gewicht, Training, Freunde, Challenges und Nutzungsdaten auf dem Gerät gelöscht. Gelöschte lokale Daten können nicht wiederhergestellt werden.',
        ],
      },
      {
        heading: 'Premium-Abonnement kündigen',
        paragraphs: [
          'Die Deinstallation der App kündigt dein Premium-Abonnement möglicherweise nicht automatisch. Kündige das Abonnement separat im Bereich Abonnements des Google Play Store.',
        ],
      },
      {
        heading: 'KI-Daten',
        paragraphs: [
          'Nachrichten an den KI-Coach und Essensfotoanalysen können über den Forge-Fit-Server an einen KI-Dienst gesendet werden, um eine Antwort zu erstellen. Für diese Funktionen wird kein Benutzerkonto erstellt. Für eine Datenschutzanfrage nutze den Entwicklerkontakt in der Google-Play-Store-Auflistung.',
        ],
      },
    ],
    footer: 'Forge Fit — Du hast die Kontrolle über deine Daten.',
    language: 'Sprache',
    privacy: 'Datenschutzerklärung anzeigen',
  },
  fr: {
    lang: 'fr',
    eyebrow: 'FORGE FIT',
    title: 'Suppression du compte et des données',
    lead: 'Forge Fit fonctionne sans créer de compte utilisateur. Votre profil et vos données de progression sont stockés sur votre appareil.',
    sections: [
      {
        heading: 'Forge Fit ne possède pas de comptes serveur',
        paragraphs: [
          'Forge Fit ne demande ni adresse e-mail, ni mot de passe, ni connexion sociale. Il n’y a donc aucun compte serveur à supprimer et Forge Fit ne conserve pas de base de profils côté serveur.',
        ],
      },
      {
        heading: 'Supprimer les données de votre appareil',
        steps: [
          'Ouvrez les réglages sur votre appareil Android.',
          'Sélectionnez Forge Fit dans la section Applications.',
          'Ouvrez Stockage.',
          'Appuyez sur Effacer les données ou Effacer le stockage.',
          'Vous pouvez aussi désinstaller Forge Fit de votre appareil.',
        ],
        paragraphs: [
          'Cette action supprime de l’appareil le profil, le nom d’utilisateur, les repas, le poids, les entraînements, les amis, les défis et les données d’utilisation. Les données locales supprimées ne peuvent pas être récupérées.',
        ],
      },
      {
        heading: 'Annuler votre abonnement Premium',
        paragraphs: [
          'La désinstallation de l’application peut ne pas annuler automatiquement votre abonnement Premium. Annulez séparément l’abonnement dans la section Abonnements du Google Play Store.',
        ],
      },
      {
        heading: 'Données liées à l’IA',
        paragraphs: [
          'Les messages du coach IA et les analyses de photos de repas peuvent être envoyés par le serveur Forge Fit à un service d’IA pour générer une réponse. Aucun compte utilisateur n’est créé pour ces fonctionnalités. Pour une demande relative à la confidentialité, utilisez le contact développeur indiqué sur la fiche Google Play.',
        ],
      },
    ],
    footer: 'Forge Fit — Vous gardez le contrôle de vos données.',
    language: 'Langue',
    privacy: 'Voir la politique de confidentialité',
  },
  es: {
    lang: 'es',
    eyebrow: 'FORGE FIT',
    title: 'Eliminación de cuenta y datos',
    lead: 'Forge Fit funciona sin crear una cuenta de usuario. Tu perfil y tus datos de progreso se almacenan en tu dispositivo.',
    sections: [
      {
        heading: 'Forge Fit no tiene cuentas en el servidor',
        paragraphs: [
          'Forge Fit no requiere correo electrónico, contraseña ni inicio de sesión social. Por lo tanto, no existe una cuenta de servidor que eliminar y Forge Fit no mantiene una base de datos de perfiles en el servidor.',
        ],
      },
      {
        heading: 'Eliminar los datos del dispositivo',
        steps: [
          'Abre Ajustes en tu dispositivo Android.',
          'Selecciona Forge Fit en Aplicaciones.',
          'Abre Almacenamiento.',
          'Toca Borrar datos o Borrar almacenamiento.',
          'También puedes desinstalar Forge Fit del dispositivo.',
        ],
        paragraphs: [
          'Esto elimina del dispositivo los datos de perfil, nombre de usuario, comidas, peso, entrenamientos, amigos, retos y uso. Los datos locales eliminados no se pueden recuperar.',
        ],
      },
      {
        heading: 'Cancelar la suscripción Premium',
        paragraphs: [
          'Desinstalar la aplicación puede no cancelar automáticamente tu suscripción Premium. Cancela la suscripción por separado desde la sección Suscripciones de Google Play Store.',
        ],
      },
      {
        heading: 'Datos de IA',
        paragraphs: [
          'Los mensajes del coach de IA y los análisis de fotos de comida pueden enviarse a través del servidor de Forge Fit a un servicio de IA para generar una respuesta. Estas funciones no crean una cuenta de usuario. Para solicitar información relacionada con la privacidad, utiliza el contacto del desarrollador que aparece en la ficha de Google Play.',
        ],
      },
    ],
    footer: 'Forge Fit — Tú tienes el control de tus datos.',
    language: 'Idioma',
    privacy: 'Ver política de privacidad',
  },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeBasePath(basePath) {
  const normalized = String(basePath || '').replace(/^\/+|\/+$/g, '');
  return normalized ? `/${normalized}` : '';
}

function renderSection(section) {
  const paragraphs = (section.paragraphs || [])
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');
  const steps = section.steps?.length
    ? `<ol>${section.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>`
    : '';
  return `<section><h2>${escapeHtml(section.heading)}</h2>${paragraphs}${steps}</section>`;
}

function renderAccountDeletionPage(language = 'en', basePath = '/') {
  const selectedLanguage = pages[language] ? language : 'en';
  const page = pages[selectedLanguage];
  const prefix = normalizeBasePath(basePath);
  const languageLinks = Object.entries(languageLabels)
    .map(([code, label]) => {
      const active = code === selectedLanguage ? ' aria-current="page" class="active"' : '';
      return `<a href="${prefix}/delete-account?lang=${code}"${active}>${escapeHtml(label)}</a>`;
    })
    .join('');

  return `<!doctype html>
<html lang="${page.lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(page.title)} — Forge Fit">
    <title>${escapeHtml(page.title)} · Forge Fit</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #090d12;
        --panel: #111923;
        --text: #edf5ff;
        --muted: #a6b7c9;
        --accent: #63b8ff;
        --line: rgba(173, 210, 240, .16);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: radial-gradient(circle at 80% -10%, rgba(53, 151, 230, .22), transparent 38%), var(--bg);
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.7;
      }
      .page { width: min(920px, calc(100% - 32px)); margin: 0 auto; padding: 28px 0 64px; }
      nav { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 10px 0 52px; }
      .brand { color: var(--text); font-size: 15px; font-weight: 800; letter-spacing: .14em; text-decoration: none; }
      .language { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; }
      .language-label { color: var(--muted); font-size: 12px; margin-right: 3px; }
      .language a { border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font-size: 12px; padding: 3px 9px; text-decoration: none; }
      .language a:hover, .language a.active { border-color: var(--accent); color: var(--text); }
      header { border-bottom: 1px solid var(--line); padding-bottom: 34px; }
      .eyebrow { color: var(--accent); font-size: 12px; font-weight: 800; letter-spacing: .2em; margin: 0 0 12px; }
      h1 { font-size: clamp(32px, 6vw, 56px); letter-spacing: -.045em; line-height: 1.1; margin: 0; }
      .lead { color: var(--muted); font-size: 18px; max-width: 720px; margin: 22px 0 0; }
      section { background: linear-gradient(145deg, rgba(24, 36, 50, .82), rgba(14, 22, 31, .82)); border: 1px solid var(--line); border-radius: 18px; margin-top: 18px; padding: 24px 26px; }
      h2 { color: var(--text); font-size: 19px; line-height: 1.3; margin: 0 0 13px; }
      p, ol { color: var(--muted); font-size: 15px; margin: 0 0 12px; }
      p:last-child, ol:last-child { margin-bottom: 0; }
      ol { padding-left: 24px; }
      li { padding-left: 4px; margin: 7px 0; }
      footer { color: var(--muted); font-size: 13px; padding: 32px 4px 0; }
      .privacy { color: var(--accent); display: inline-block; font-size: 14px; margin-top: 12px; }
      @media (max-width: 620px) {
        .page { width: min(100% - 22px, 920px); padding-top: 16px; }
        nav { align-items: flex-start; flex-direction: column; padding-bottom: 34px; }
        .language { justify-content: flex-start; }
        section { border-radius: 14px; padding: 20px 18px; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <nav>
        <a class="brand" href="${prefix}/">FORGE FIT</a>
        <div class="language" aria-label="${escapeHtml(page.language)}">
          <span class="language-label">${escapeHtml(page.language)}:</span>
          ${languageLinks}
        </div>
      </nav>
      <header>
        <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
        <h1>${escapeHtml(page.title)}</h1>
        <p class="lead">${escapeHtml(page.lead)}</p>
      </header>
      ${page.sections.map(renderSection).join('')}
      <footer>
        ${escapeHtml(page.footer)}
        <br><a class="privacy" href="${prefix}/privacy-policy?lang=${selectedLanguage}">${escapeHtml(page.privacy)}</a>
      </footer>
    </main>
  </body>
</html>`;
}

module.exports = { renderAccountDeletionPage };