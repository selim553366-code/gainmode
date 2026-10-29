export const accountDeletionLanguages = ['tr', 'en', 'de', 'fr', 'es'] as const;
export type AccountDeletionLanguage = (typeof accountDeletionLanguages)[number];

type AccountDeletionSection = {
  title: string;
  paragraphs?: string[];
  steps?: string[];
};

type AccountDeletionCopy = {
  title: string;
  lead: string;
  sections: AccountDeletionSection[];
  footer: string;
  privacyLink: string;
  termsLink: string;
};

export const accountDeletionCopy: Record<AccountDeletionLanguage, AccountDeletionCopy> = {
  tr: {
    title: 'GainMode hesap ve veri silme',
    lead: 'GainMode kullanıcı hesabı oluşturmadan çalışır. Profil ve ilerleme bilgilerin cihazında saklanır.',
    sections: [
      {
        title: 'GainMode’da sunucu hesabı yoktur',
        paragraphs: [
          'GainMode’a e-posta, şifre veya sosyal hesapla giriş yapılmaz. Bu nedenle silinecek bir sunucu kullanıcı hesabı bulunmaz ve GainMode sunucuda profil veritabanı tutmaz.',
        ],
      },
      {
        title: 'Cihazındaki verileri sil',
        steps: [
          'Android cihazında Ayarlar’ı aç.',
          'Uygulamalar bölümünden GainMode’u seç.',
          'Depolama bölümüne gir.',
          'Verileri temizle veya Depolamayı temizle seçeneğine dokun.',
          'Alternatif olarak GainMode’u cihazından kaldır.',
        ],
        paragraphs: [
          'GainMode içinde Ayarlar > Cihazımdaki verileri sil seçeneğini kullan. Bu seçenek iOS ve Android’de yerel uygulama verilerini siler; mağaza aboneliğini iptal etmez.',
          'Bu işlem cihazdaki profil, kullanıcı adı, öğün, kilo, antrenman, arkadaş, challenge ve kullanım verilerini siler. Silinen yerel veriler geri getirilemez.',
        ],
      },
      {
        title: 'Premium aboneliğini iptal et',
        paragraphs: [
          'Uygulamayı kaldırmak Premium aboneliğini iptal etmez. Aboneliği App Store veya Google Play hesabının Abonelikler ayarlarından ayrıca iptal et.',
        ],
      },
      {
        title: 'Yapay zekâ verileri',
        paragraphs: [
          'Yapay zekâ koçuna gönderilen mesajlar ve yemek fotoğrafı analizleri yanıt oluşturmak için GainMode sunucusu üzerinden bir yapay zekâ hizmetine gönderilebilir. Bu özellikler için kullanıcı hesabı oluşturulmaz. Gizlilik talepleri için Google Play mağaza sayfasındaki geliştirici iletişim kanalını kullanabilir veya globestudiosdev@gmail.com adresine yazabilirsin.',
        ],
      },
    ],
    footer: 'GainMode — Verilerin üzerindeki kontrol sende.',
    privacyLink: 'Gizlilik politikasını görüntüle',
    termsLink: 'Kullanım şartlarını görüntüle',
  },
  en: {
    title: 'GainMode account and data deletion',
    lead: 'GainMode works without creating a user account. Your profile and progress information are stored on your device.',
    sections: [
      {
        title: 'GainMode does not have server accounts',
        paragraphs: [
          'GainMode does not require an email, password, or social sign-in. There is therefore no server user account to delete, and GainMode does not maintain a server-side profile database.',
        ],
      },
      {
        title: 'Delete data from your device',
        steps: [
          'Open Settings on your Android device.',
          'Select GainMode from Apps.',
          'Open Storage.',
          'Tap Clear data or Clear storage.',
          'Alternatively, uninstall GainMode from your device.',
        ],
        paragraphs: [
          'In GainMode, open Settings and select Delete my local data. This option clears local app data on iOS and Android; it does not cancel your store subscription.',
          'This removes profile, username, meal, weight, workout, friend, challenge, and usage data stored on the device. Deleted local data cannot be recovered.',
        ],
      },
      {
        title: 'Cancel your Premium subscription',
        paragraphs: [
          'Uninstalling the app does not cancel your Premium subscription. Cancel it separately in the Subscriptions settings of your App Store or Google Play account.',
        ],
      },
      {
        title: 'AI data',
        paragraphs: [
          'AI coach messages and food photo analyses may be sent through the GainMode server to an AI service to generate a response. No user account is created for these features. For a privacy request, use the developer contact channel on the Google Play listing or email globestudiosdev@gmail.com.',
        ],
      },
    ],
    footer: 'GainMode — You are in control of your data.',
    privacyLink: 'View privacy policy',
    termsLink: 'View terms of service',
  },
  de: {
    title: 'GainMode Konto- und Datenlöschung',
    lead: 'GainMode funktioniert ohne die Erstellung eines Benutzerkontos. Profil- und Fortschrittsdaten werden auf deinem Gerät gespeichert.',
    sections: [
      {
        title: 'GainMode hat keine Serverkonten',
        paragraphs: [
          'GainMode benötigt keine E-Mail-Adresse, kein Passwort und keine Anmeldung über soziale Netzwerke. Daher gibt es kein Serverkonto zu löschen und GainMode führt keine serverseitige Profildatenbank.',
        ],
      },
      {
        title: 'Daten auf deinem Gerät löschen',
        steps: [
          'Öffne die Einstellungen auf deinem Android-Gerät.',
          'Wähle GainMode unter Apps aus.',
          'Öffne den Bereich Speicher.',
          'Tippe auf Daten löschen oder Speicher löschen.',
          'Alternativ kannst du GainMode von deinem Gerät deinstallieren.',
        ],
        paragraphs: [
          'Öffne in GainMode die Einstellungen und wähle Meine lokalen Daten löschen. Damit werden lokale App-Daten unter iOS und Android gelöscht; dein Store-Abo wird nicht gekündigt.',
          'Dadurch werden Profil, Benutzername, Mahlzeiten, Gewicht, Training, Freunde, Challenges und Nutzungsdaten auf dem Gerät gelöscht. Gelöschte lokale Daten können nicht wiederhergestellt werden.',
        ],
      },
      {
        title: 'Premium-Abonnement kündigen',
        paragraphs: [
          'Die Deinstallation der App kündigt dein Premium-Abonnement nicht. Kündige es separat in den Abo-Einstellungen deines App-Store- oder Google-Play-Kontos.',
        ],
      },
      {
        title: 'KI-Daten',
        paragraphs: [
          'Nachrichten an den KI-Coach und Essensfotoanalysen können über den GainMode-Server an einen KI-Dienst gesendet werden, um eine Antwort zu erstellen. Für diese Funktionen wird kein Benutzerkonto erstellt. Für eine Datenschutzanfrage nutze den Entwicklerkontakt im Google-Play-Eintrag oder schreibe an globestudiosdev@gmail.com.',
        ],
      },
    ],
    footer: 'GainMode — Du hast die Kontrolle über deine Daten.',
    privacyLink: 'Datenschutzerklärung anzeigen',
    termsLink: 'Nutzungsbedingungen anzeigen',
  },
  fr: {
    title: 'Suppression du compte et des données GainMode',
    lead: 'GainMode fonctionne sans créer de compte utilisateur. Votre profil et vos données de progression sont stockés sur votre appareil.',
    sections: [
      {
        title: 'GainMode ne possède pas de comptes serveur',
        paragraphs: [
          'GainMode ne demande ni adresse e-mail, ni mot de passe, ni connexion sociale. Il n’y a donc aucun compte serveur à supprimer et GainMode ne conserve pas de base de profils côté serveur.',
        ],
      },
      {
        title: 'Supprimer les données de votre appareil',
        steps: [
          'Ouvrez les réglages sur votre appareil Android.',
          'Sélectionnez GainMode dans la section Applications.',
          'Ouvrez Stockage.',
          'Appuyez sur Effacer les données ou Effacer le stockage.',
          'Vous pouvez aussi désinstaller GainMode de votre appareil.',
        ],
        paragraphs: [
          'Dans GainMode, ouvrez les réglages et sélectionnez Supprimer mes données locales. Cette option efface les données locales sur iOS et Android ; elle ne résilie pas votre abonnement de store.',
          'Cette action supprime de l’appareil le profil, le nom d’utilisateur, les repas, le poids, les entraînements, les amis, les défis et les données d’utilisation. Les données locales supprimées ne peuvent pas être récupérées.',
        ],
      },
      {
        title: 'Annuler votre abonnement Premium',
        paragraphs: [
          'La désinstallation de l’application ne résilie pas votre abonnement Premium. Résiliez-le séparément dans les réglages d’abonnement de votre compte App Store ou Google Play.',
        ],
      },
      {
        title: 'Données liées à l’IA',
        paragraphs: [
          'Les messages du coach IA et les analyses de photos de repas peuvent être envoyés par le serveur GainMode à un service d’IA pour générer une réponse. Aucun compte utilisateur n’est créé pour ces fonctionnalités. Pour une demande relative à la confidentialité, utilisez le contact développeur indiqué sur la fiche Google Play ou écrivez à globestudiosdev@gmail.com.',
        ],
      },
    ],
    footer: 'GainMode — Vous gardez le contrôle de vos données.',
    privacyLink: 'Voir la politique de confidentialité',
    termsLink: 'Voir les conditions d’utilisation',
  },
  es: {
    title: 'Eliminación de cuenta y datos de GainMode',
    lead: 'GainMode funciona sin crear una cuenta de usuario. Tu perfil y tus datos de progreso se almacenan en tu dispositivo.',
    sections: [
      {
        title: 'GainMode no tiene cuentas en el servidor',
        paragraphs: [
          'GainMode no requiere correo electrónico, contraseña ni inicio de sesión social. Por lo tanto, no existe una cuenta de servidor que eliminar y GainMode no mantiene una base de datos de perfiles en el servidor.',
        ],
      },
      {
        title: 'Eliminar los datos del dispositivo',
        steps: [
          'Abre Ajustes en tu dispositivo Android.',
          'Selecciona GainMode en Aplicaciones.',
          'Abre Almacenamiento.',
          'Toca Borrar datos o Borrar almacenamiento.',
          'También puedes desinstalar GainMode del dispositivo.',
        ],
        paragraphs: [
          'En GainMode, abre Ajustes y selecciona Eliminar mis datos locales. Esta opción borra los datos locales de iOS y Android, pero no cancela tu suscripción de la tienda.',
          'Esto elimina del dispositivo los datos de perfil, nombre de usuario, comidas, peso, entrenamientos, amigos, retos y uso. Los datos locales eliminados no se pueden recuperar.',
        ],
      },
      {
        title: 'Cancelar la suscripción Premium',
        paragraphs: [
          'Desinstalar la aplicación no cancela tu suscripción Premium. Cancélala por separado en los ajustes de suscripciones de tu cuenta de App Store o Google Play.',
        ],
      },
      {
        title: 'Datos de IA',
        paragraphs: [
          'Los mensajes del coach de IA y los análisis de fotos de comida pueden enviarse a través del servidor GainMode a un servicio de IA para generar una respuesta. Estas funciones no crean una cuenta de usuario. Para solicitar información relacionada con la privacidad, utiliza el contacto del desarrollador que aparece en la ficha de Google Play o escribe a globestudiosdev@gmail.com.',
        ],
      },
    ],
    footer: 'GainMode — Tú tienes el control de tus datos.',
    privacyLink: 'Ver política de privacidad',
    termsLink: 'Ver condiciones del servicio',
  },
};
