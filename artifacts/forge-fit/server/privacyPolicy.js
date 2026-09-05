const languageLabels = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
};

const policies = {
  tr: {
    htmlLang: 'tr',
    eyebrow: 'FORGE FIT',
    title: 'Gizlilik Politikası',
    lead: 'Forge Fit, fitness ve beslenme deneyimini kişiselleştirirken verilerinizi mümkün olduğunca cihazınızda tutmayı amaçlar.',
    updated: 'Son güncelleme: 30 Ağustos 2026',
    language: 'Dil',
    sections: [
      {
        heading: '1. Bu politika hakkında',
        paragraphs: [
          'Bu Gizlilik Politikası, Forge Fit mobil uygulamasının hangi bilgileri işlediğini, bunları hangi amaçlarla kullandığını ve seçeneklerinizi açıklar. Forge Fit’i kullanarak bu politikadaki uygulamaları kabul etmiş olursunuz.',
        ],
      },
      {
        heading: '2. Cihazınızda saklanan bilgiler',
        paragraphs: [
          'Profil bilgileriniz, kullanıcı adınız, öğünleriniz, kilo kayıtlarınız, antrenman ilerlemeniz, arkadaş ve challenge kayıtlarınız, uygulama diliniz ve kullanım sayaçlarınız varsayılan olarak cihazınızdaki uygulama depolamasında tutulur.',
          'Bu yerel veriler Forge Fit tarafından bir hesap profili oluşturmak amacıyla sunucuya gönderilmez. Uygulamayı silmek veya cihaz ayarlarından uygulama verilerini temizlemek yerel kayıtları silebilir.',
        ],
      },
      {
        heading: '3. Kamera ve canlı antrenman analizi',
        paragraphs: [
          'Canlı squat, şınav ve lunge analizi için kamera izni istenir. Canlı poz analizi cihaz üzerinde gerçekleştirilir; kamera görüntüsü Forge Fit sunucularına gönderilmez, kaydedilmez veya paylaşılmaz.',
          'Kamera iznini istediğiniz zaman cihazınızın ayarlarından kapatabilirsiniz. İzin verilmezse canlı antrenman özelliği kullanılamaz, ancak uygulamanın diğer bölümleri çalışmaya devam edebilir.',
        ],
      },
      {
        heading: '4. Yapay zekâ özellikleri',
        paragraphs: [
          'FitBud koçuna gönderdiğiniz mesajlar ve kişiselleştirme için gerekli uygulama bağlamı, yanıt oluşturulması amacıyla Forge Fit sunucusu üzerinden yapay zekâ hizmet sağlayıcısına iletilebilir.',
          'Yemek fotoğrafı analizi kullandığınızda seçtiğiniz görüntü, besin tahmini oluşturmak için Forge Fit sunucusu üzerinden yapay zekâ hizmet sağlayıcısına gönderilir. Fotoğraf analizi özelliğini kullanırken kimlik, sağlık belgesi veya başka hassas bilgiler içeren görüntüler göndermeyin.',
          'Bu veriler reklam profili oluşturmak veya satılmak amacıyla kullanılmaz. Yapay zekâ sağlayıcısının kendi veri işleme ve saklama koşulları ayrıca geçerli olabilir.',
        ],
      },
      {
        heading: '5. Beslenme araması',
        paragraphs: [
          'Yemek araması yaptığınızda arama metni, besin bilgisi sağlayan üçüncü taraf hizmetlere gönderilebilir. Forge Fit bu hizmetlerden gelen sonuçları uygulamada göstermek için işler.',
          'Arama kutusuna kişisel, tıbbi veya başka hassas bilgiler yazmayın.',
        ],
      },
      {
        heading: '6. Abonelikler ve satın almalar',
        paragraphs: [
          'Premium abonelikleri yönetmek için RevenueCat ve ilgili uygulama mağazasının satın alma altyapısı kullanılabilir. Abonelik durumu ve uygulama içi satın almayla ilgili teknik bilgiler, özelliğin çalışması ve erişimin doğrulanması için işlenebilir.',
          'Forge Fit ödeme kartı numaranızı veya mağaza hesabınızın ödeme bilgilerini almaz. Ödeme işlemleri Google Play veya ilgili mağaza tarafından yürütülür.',
        ],
      },
      {
        heading: '7. Teknik bilgiler ve güvenlik',
        paragraphs: [
          'Uygulamanın çalıştırıldığı altyapı, güvenlik ve hata ayıklama amacıyla IP adresi, istek zamanı, cihaz veya tarayıcı bilgisi gibi sınırlı teknik günlük bilgileri işleyebilir. Forge Fit bu bilgileri reklam amacıyla kullanmaz.',
          'Verileri korumak için makul teknik önlemler uygulanır; ancak internet üzerinden yapılan hiçbir aktarımın tamamen risksiz olduğu garanti edilemez.',
        ],
      },
      {
        heading: '8. Verileriniz üzerindeki seçenekleriniz',
        bullets: [
          'Kamera iznini cihaz ayarlarından kapatabilirsiniz.',
          'Yerel profil, öğün ve ilerleme kayıtlarını uygulama verilerini temizleyerek veya uygulamayı kaldırarak silebilirsiniz.',
          'Yapay zekâ koçu, yemek fotoğrafı analizi veya yemek aramasını kullanmayarak bu özellikler için veri aktarımını önleyebilirsiniz.',
          'Gizlilikle ilgili bir soru veya talep için Google Play mağaza listelemesinde yer alan geliştirici iletişim kanalını kullanabilirsiniz.',
        ],
      },
      {
        heading: '9. Çocukların gizliliği',
        paragraphs: [
          'Forge Fit, 13 yaşın altındaki çocuklara yönelik değildir. Bilerek 13 yaşın altındaki çocuklardan kişisel veri toplamaya çalışmayız.',
        ],
      },
      {
        heading: '10. Bu politikadaki değişiklikler',
        paragraphs: [
          'Bu politikayı uygulamadaki veya hizmetlerdeki değişiklikleri yansıtmak için güncelleyebiliriz. Güncel sürüm her zaman bu sayfada yayımlanır ve üst kısımda güncelleme tarihi gösterilir.',
        ],
      },
    ],
    footer: 'Forge Fit — Daha güçlü, daha bilinçli, daha tutarlı.',
  },
  en: {
    htmlLang: 'en',
    eyebrow: 'FORGE FIT',
    title: 'Privacy Policy',
    lead: 'Forge Fit is designed to keep your data on your device whenever possible while personalizing your fitness and nutrition experience.',
    updated: 'Last updated: August 30, 2026',
    language: 'Language',
    sections: [
      {
        heading: '1. About this policy',
        paragraphs: [
          'This Privacy Policy explains what information the Forge Fit mobile app processes, why it is used, and the choices available to you. By using Forge Fit, you acknowledge the practices described in this policy.',
        ],
      },
      {
        heading: '2. Information stored on your device',
        paragraphs: [
          'Your profile information, username, meals, weight logs, workout progress, friend and challenge records, app language, and usage counters are stored by default in the app storage on your device.',
          'Forge Fit does not send this local data to the server to create an account profile. Uninstalling the app or clearing its data in your device settings may delete these local records.',
        ],
      },
      {
        heading: '3. Camera and live workout analysis',
        paragraphs: [
          'Camera permission is requested for live squat, push-up, and lunge analysis. Live pose analysis runs on your device; camera video is not sent to Forge Fit servers, recorded, or shared.',
          'You can revoke camera permission at any time in your device settings. If permission is denied, live workout analysis will not work, but other parts of the app may remain available.',
        ],
      },
      {
        heading: '4. AI features',
        paragraphs: [
          'Messages you send to the FitBud coach and the app context needed for personalization may be sent through the Forge Fit server to an AI service provider to generate a response.',
          'When you use food photo analysis, the image you select may be sent through the Forge Fit server to an AI service provider to estimate nutritional information. Do not submit images containing identity documents, health records, or other sensitive information.',
          'This data is not used to build advertising profiles or sold. The AI provider may have its own data processing and retention terms.',
        ],
      },
      {
        heading: '5. Food search',
        paragraphs: [
          'When you search for food, the search text may be sent to third-party nutrition data services. Forge Fit processes results from these services to display them in the app.',
          'Do not enter personal, medical, or other sensitive information in the search field.',
        ],
      },
      {
        heading: '6. Subscriptions and purchases',
        paragraphs: [
          'RevenueCat and the relevant app store purchase infrastructure may be used to manage Premium subscriptions. Subscription status and technical purchase information may be processed to provide the feature and verify access.',
          'Forge Fit does not receive your payment card number or your store account payment details. Payments are handled by Google Play or the relevant app store.',
        ],
      },
      {
        heading: '7. Technical information and security',
        paragraphs: [
          'The infrastructure hosting the app may process limited technical logs, such as IP address, request time, and device or browser information, for operation, security, and troubleshooting. Forge Fit does not use this information for advertising.',
          'Reasonable technical safeguards are used to protect data, but no internet transmission can be guaranteed to be completely risk-free.',
        ],
      },
      {
        heading: '8. Your choices',
        bullets: [
          'You can revoke camera permission in your device settings.',
          'You can delete local profile, meal, and progress records by clearing app data or uninstalling the app.',
          'You can prevent data transfer for these features by not using the AI coach, food photo analysis, or food search.',
          'For privacy questions or requests, use the developer contact channel shown on the Google Play store listing.',
        ],
      },
      {
        heading: '9. Children’s privacy',
        paragraphs: [
          'Forge Fit is not directed to children under 13. We do not knowingly seek to collect personal information from children under 13.',
        ],
      },
      {
        heading: '10. Changes to this policy',
        paragraphs: [
          'We may update this policy to reflect changes to the app or services. The current version is always published on this page, with the update date shown at the top.',
        ],
      },
    ],
    footer: 'Forge Fit — Stronger, more mindful, more consistent.',
  },
  de: {
    htmlLang: 'de',
    eyebrow: 'FORGE FIT',
    title: 'Datenschutzerklärung',
    lead: 'Forge Fit möchte deine Daten möglichst auf deinem Gerät behalten und dein Fitness- und Ernährungserlebnis trotzdem personalisieren.',
    updated: 'Letzte Aktualisierung: 30. August 2026',
    language: 'Sprache',
    sections: [
      {
        heading: '1. Über diese Erklärung',
        paragraphs: [
          'Diese Datenschutzerklärung erklärt, welche Informationen die mobile Forge-Fit-App verarbeitet, warum sie verwendet werden und welche Möglichkeiten du hast. Durch die Nutzung von Forge Fit erkennst du die in dieser Erklärung beschriebenen Verfahren an.',
        ],
      },
      {
        heading: '2. Auf deinem Gerät gespeicherte Informationen',
        paragraphs: [
          'Profilinformationen, Benutzername, Mahlzeiten, Gewichtsprotokolle, Trainingsfortschritt, Freundes- und Challenge-Einträge, App-Sprache und Nutzungzähler werden standardmäßig im App-Speicher deines Geräts gespeichert.',
          'Forge Fit sendet diese lokalen Daten nicht an den Server, um ein Kontoprofil zu erstellen. Das Deinstallieren der App oder das Löschen ihrer Daten in den Geräteeinstellungen kann diese lokalen Einträge entfernen.',
        ],
      },
      {
        heading: '3. Kamera und Live-Trainingsanalyse',
        paragraphs: [
          'Für die Live-Analyse von Kniebeugen, Liegestützen und Ausfallschritten wird eine Kameraberechtigung angefordert. Die Live-Posenanalyse läuft auf deinem Gerät; Kameravideos werden nicht an Forge-Fit-Server gesendet, aufgezeichnet oder geteilt.',
          'Du kannst die Kameraberechtigung jederzeit in den Geräteeinstellungen widerrufen. Wenn du die Berechtigung verweigerst, funktioniert die Live-Analyse nicht, andere Bereiche der App können jedoch verfügbar bleiben.',
        ],
      },
      {
        heading: '4. KI-Funktionen',
        paragraphs: [
          'Nachrichten an den FitBud-Coach und der für die Personalisierung benötigte App-Kontext können über den Forge-Fit-Server an einen KI-Dienstleister gesendet werden, um eine Antwort zu erstellen.',
          'Bei der Analyse eines Essensfotos kann das ausgewählte Bild über den Forge-Fit-Server an einen KI-Dienstleister gesendet werden, um Nährwerte zu schätzen. Sende keine Bilder mit Ausweisdokumenten, Gesundheitsunterlagen oder anderen sensiblen Informationen.',
          'Diese Daten werden nicht für Werbeprofile verwendet und nicht verkauft. Für den KI-Dienstleister können eigene Bedingungen zur Datenverarbeitung und Speicherung gelten.',
        ],
      },
      {
        heading: '5. Lebensmittelsuche',
        paragraphs: [
          'Bei einer Lebensmittelsuche kann der Suchtext an Drittanbieter für Ernährungsdaten gesendet werden. Forge Fit verarbeitet deren Ergebnisse, um sie in der App anzuzeigen.',
          'Gib keine persönlichen, medizinischen oder anderen sensiblen Informationen in das Suchfeld ein.',
        ],
      },
      {
        heading: '6. Abonnements und Käufe',
        paragraphs: [
          'Für Premium-Abonnements können RevenueCat und die Kauf-Infrastruktur des jeweiligen App-Stores verwendet werden. Abonnementstatus und technische Kaufdaten können verarbeitet werden, um die Funktion bereitzustellen und den Zugriff zu prüfen.',
          'Forge Fit erhält weder deine Kartennummer noch die Zahlungsdaten deines Store-Kontos. Zahlungen werden von Google Play oder dem jeweiligen App-Store abgewickelt.',
        ],
      },
      {
        heading: '7. Technische Informationen und Sicherheit',
        paragraphs: [
          'Die Infrastruktur, auf der die App läuft, kann begrenzte technische Protokolldaten wie IP-Adresse, Anfragezeit sowie Geräte- oder Browserinformationen für Betrieb, Sicherheit und Fehlerbehebung verarbeiten. Forge Fit verwendet diese Informationen nicht für Werbung.',
          'Es werden angemessene technische Schutzmaßnahmen eingesetzt. Dennoch kann keine Übertragung über das Internet als vollständig risikofrei garantiert werden.',
        ],
      },
      {
        heading: '8. Deine Möglichkeiten',
        bullets: [
          'Du kannst die Kameraberechtigung in den Geräteeinstellungen widerrufen.',
          'Du kannst lokale Profil-, Mahlzeiten- und Fortschrittsdaten durch das Löschen der App-Daten oder die Deinstallation der App entfernen.',
          'Du kannst die Datenübertragung für diese Funktionen vermeiden, indem du KI-Coach, Essensfotoanalyse und Lebensmittelsuche nicht verwendest.',
          'Für Datenschutzfragen oder Anfragen nutze den Entwicklerkontakt in der Google-Play-Store-Auflistung.',
        ],
      },
      {
        heading: '9. Datenschutz von Kindern',
        paragraphs: [
          'Forge Fit richtet sich nicht an Kinder unter 13 Jahren. Wir versuchen nicht wissentlich, personenbezogene Daten von Kindern unter 13 Jahren zu erfassen.',
        ],
      },
      {
        heading: '10. Änderungen dieser Erklärung',
        paragraphs: [
          'Wir können diese Erklärung aktualisieren, um Änderungen an der App oder den Diensten abzubilden. Die aktuelle Version wird immer auf dieser Seite veröffentlicht; das Aktualisierungsdatum steht oben.',
        ],
      },
    ],
    footer: 'Forge Fit — Stärker, bewusster, konsequenter.',
  },
  fr: {
    htmlLang: 'fr',
    eyebrow: 'FORGE FIT',
    title: 'Politique de confidentialité',
    lead: 'Forge Fit est conçu pour garder vos données sur votre appareil autant que possible tout en personnalisant votre expérience fitness et nutrition.',
    updated: 'Dernière mise à jour : 30 août 2026',
    language: 'Langue',
    sections: [
      {
        heading: '1. À propos de cette politique',
        paragraphs: [
          'Cette Politique de confidentialité explique quelles informations l’application mobile Forge Fit traite, pourquoi elles sont utilisées et quels choix s’offrent à vous. En utilisant Forge Fit, vous reconnaissez les pratiques décrites dans cette politique.',
        ],
      },
      {
        heading: '2. Informations stockées sur votre appareil',
        paragraphs: [
          'Vos informations de profil, votre nom d’utilisateur, vos repas, vos relevés de poids, votre progression, vos amis et défis, la langue de l’application et vos compteurs d’utilisation sont stockés par défaut dans le stockage de l’application sur votre appareil.',
          'Forge Fit n’envoie pas ces données locales au serveur pour créer un profil de compte. La désinstallation de l’application ou l’effacement de ses données dans les réglages de l’appareil peut supprimer ces données locales.',
        ],
      },
      {
        heading: '3. Caméra et analyse des entraînements en direct',
        paragraphs: [
          'L’autorisation d’utiliser la caméra est demandée pour l’analyse en direct des squats, pompes et fentes. L’analyse de la pose s’effectue sur votre appareil ; les vidéos de la caméra ne sont pas envoyées aux serveurs Forge Fit, enregistrées ou partagées.',
          'Vous pouvez retirer l’autorisation de la caméra à tout moment dans les réglages de votre appareil. Si vous refusez cette autorisation, l’analyse en direct ne fonctionnera pas, mais les autres parties de l’application peuvent rester disponibles.',
        ],
      },
      {
        heading: '4. Fonctionnalités d’IA',
        paragraphs: [
          'Les messages envoyés au coach FitBud et le contexte de l’application nécessaire à la personnalisation peuvent être transmis par le serveur Forge Fit à un fournisseur de services d’IA afin de générer une réponse.',
          'Lorsque vous utilisez l’analyse d’une photo de repas, l’image sélectionnée peut être transmise par le serveur Forge Fit à un fournisseur d’IA afin d’estimer les informations nutritionnelles. N’envoyez pas d’images contenant des pièces d’identité, des dossiers médicaux ou d’autres informations sensibles.',
          'Ces données ne sont pas utilisées pour créer des profils publicitaires et ne sont pas vendues. Le fournisseur d’IA peut appliquer ses propres conditions de traitement et de conservation des données.',
        ],
      },
      {
        heading: '5. Recherche d’aliments',
        paragraphs: [
          'Lorsque vous recherchez un aliment, le texte de recherche peut être envoyé à des services tiers de données nutritionnelles. Forge Fit traite les résultats de ces services pour les afficher dans l’application.',
          'N’entrez pas d’informations personnelles, médicales ou autres informations sensibles dans le champ de recherche.',
        ],
      },
      {
        heading: '6. Abonnements et achats',
        paragraphs: [
          'RevenueCat et l’infrastructure d’achat de la boutique d’applications concernée peuvent être utilisés pour gérer les abonnements Premium. Le statut de l’abonnement et les informations techniques liées à l’achat peuvent être traités pour fournir la fonctionnalité et vérifier l’accès.',
          'Forge Fit ne reçoit pas votre numéro de carte bancaire ni les informations de paiement de votre compte de boutique. Les paiements sont gérés par Google Play ou la boutique concernée.',
        ],
      },
      {
        heading: '7. Informations techniques et sécurité',
        paragraphs: [
          'L’infrastructure qui héberge l’application peut traiter des journaux techniques limités, tels que l’adresse IP, l’heure de la requête et des informations sur l’appareil ou le navigateur, pour le fonctionnement, la sécurité et le dépannage. Forge Fit n’utilise pas ces informations à des fins publicitaires.',
          'Des mesures techniques raisonnables sont utilisées pour protéger les données, mais aucune transmission sur Internet ne peut être garantie comme totalement exempte de risques.',
        ],
      },
      {
        heading: '8. Vos choix',
        bullets: [
          'Vous pouvez retirer l’autorisation de la caméra dans les réglages de votre appareil.',
          'Vous pouvez supprimer les données locales de profil, de repas et de progression en effaçant les données de l’application ou en la désinstallant.',
          'Vous pouvez éviter le transfert de données pour ces fonctionnalités en n’utilisant pas le coach IA, l’analyse de photos de repas ou la recherche d’aliments.',
          'Pour toute question ou demande relative à la confidentialité, utilisez le contact développeur indiqué sur la fiche Google Play.',
        ],
      },
      {
        heading: '9. Vie privée des enfants',
        paragraphs: [
          'Forge Fit ne s’adresse pas aux enfants de moins de 13 ans. Nous ne cherchons pas sciemment à recueillir des informations personnelles auprès d’enfants de moins de 13 ans.',
        ],
      },
      {
        heading: '10. Modifications de cette politique',
        paragraphs: [
          'Nous pouvons mettre à jour cette politique pour refléter les changements de l’application ou des services. La version actuelle est toujours publiée sur cette page, avec la date de mise à jour affichée en haut.',
        ],
      },
    ],
    footer: 'Forge Fit — Plus fort, plus conscient, plus constant.',
  },
  es: {
    htmlLang: 'es',
    eyebrow: 'FORGE FIT',
    title: 'Política de privacidad',
    lead: 'Forge Fit está diseñado para mantener tus datos en tu dispositivo siempre que sea posible mientras personaliza tu experiencia de fitness y nutrición.',
    updated: 'Última actualización: 30 de agosto de 2026',
    language: 'Idioma',
    sections: [
      {
        heading: '1. Sobre esta política',
        paragraphs: [
          'Esta Política de privacidad explica qué información procesa la aplicación móvil Forge Fit, por qué se utiliza y qué opciones tienes. Al usar Forge Fit, reconoces las prácticas descritas en esta política.',
        ],
      },
      {
        heading: '2. Información almacenada en tu dispositivo',
        paragraphs: [
          'Tu información de perfil, nombre de usuario, comidas, registros de peso, progreso de entrenamiento, amigos y retos, idioma de la aplicación y contadores de uso se almacenan de forma predeterminada en el almacenamiento de la aplicación de tu dispositivo.',
          'Forge Fit no envía estos datos locales al servidor para crear un perfil de cuenta. Desinstalar la aplicación o borrar sus datos desde los ajustes del dispositivo puede eliminar estos registros locales.',
        ],
      },
      {
        heading: '3. Cámara y análisis del entrenamiento en directo',
        paragraphs: [
          'Se solicita permiso para la cámara para analizar en directo sentadillas, flexiones y zancadas. El análisis de postura se ejecuta en tu dispositivo; el vídeo de la cámara no se envía a los servidores de Forge Fit, no se graba ni se comparte.',
          'Puedes retirar el permiso de cámara en cualquier momento desde los ajustes del dispositivo. Si deniegas el permiso, el análisis en directo no funcionará, pero otras partes de la aplicación pueden seguir disponibles.',
        ],
      },
      {
        heading: '4. Funciones de IA',
        paragraphs: [
          'Los mensajes que envías al coach FitBud y el contexto de la aplicación necesario para personalizar la respuesta pueden enviarse a través del servidor de Forge Fit a un proveedor de servicios de IA para generar una respuesta.',
          'Cuando usas el análisis de fotos de comida, la imagen que seleccionas puede enviarse a través del servidor de Forge Fit a un proveedor de IA para estimar la información nutricional. No envíes imágenes que contengan documentos de identidad, historiales médicos u otra información sensible.',
          'Estos datos no se utilizan para crear perfiles publicitarios ni se venden. El proveedor de IA puede tener sus propias condiciones de tratamiento y conservación de datos.',
        ],
      },
      {
        heading: '5. Búsqueda de alimentos',
        paragraphs: [
          'Cuando buscas un alimento, el texto de búsqueda puede enviarse a servicios externos de datos nutricionales. Forge Fit procesa los resultados de estos servicios para mostrarlos en la aplicación.',
          'No introduzcas información personal, médica u otra información sensible en el campo de búsqueda.',
        ],
      },
      {
        heading: '6. Suscripciones y compras',
        paragraphs: [
          'RevenueCat y la infraestructura de compras de la tienda de aplicaciones correspondiente pueden utilizarse para gestionar las suscripciones Premium. El estado de la suscripción y la información técnica de la compra pueden procesarse para ofrecer la función y verificar el acceso.',
          'Forge Fit no recibe tu número de tarjeta ni los datos de pago de tu cuenta de la tienda. Los pagos los gestiona Google Play o la tienda correspondiente.',
        ],
      },
      {
        heading: '7. Información técnica y seguridad',
        paragraphs: [
          'La infraestructura donde se ejecuta la aplicación puede procesar registros técnicos limitados, como la dirección IP, la hora de la solicitud y datos del dispositivo o navegador, para el funcionamiento, la seguridad y la resolución de problemas. Forge Fit no utiliza esta información con fines publicitarios.',
          'Se aplican medidas técnicas razonables para proteger los datos, pero ninguna transmisión por Internet puede garantizarse como completamente libre de riesgos.',
        ],
      },
      {
        heading: '8. Tus opciones',
        bullets: [
          'Puedes retirar el permiso de cámara desde los ajustes del dispositivo.',
          'Puedes borrar los datos locales de perfil, comidas y progreso borrando los datos de la aplicación o desinstalándola.',
          'Puedes evitar la transferencia de datos de estas funciones si no utilizas el coach de IA, el análisis de fotos de comida o la búsqueda de alimentos.',
          'Para preguntas o solicitudes de privacidad, utiliza el contacto del desarrollador que aparece en la ficha de Google Play.',
        ],
      },
      {
        heading: '9. Privacidad de los menores',
        paragraphs: [
          'Forge Fit no está dirigido a menores de 13 años. No buscamos recopilar conscientemente información personal de menores de 13 años.',
        ],
      },
      {
        heading: '10. Cambios en esta política',
        paragraphs: [
          'Podemos actualizar esta política para reflejar cambios en la aplicación o los servicios. La versión actual siempre se publica en esta página y la fecha de actualización aparece en la parte superior.',
        ],
      },
    ],
    footer: 'Forge Fit — Más fuerte, más consciente, más constante.',
  },
};

function escapeHtml(value) {
  return String(value)
    .replace(/Forge Fit/g, 'GainMode')
    .replace(/FORGE FIT/g, 'GAINMODE')
    .replace(/Forge-Fit/g, 'GainMode')
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
  const bullets = section.bullets?.length
    ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
    : '';
  return `<section><h2>${escapeHtml(section.heading)}</h2>${paragraphs}${bullets}</section>`;
}

function renderPrivacyPolicyPage(language = 'en', basePath = '/') {
  const selectedLanguage = policies[language] ? language : 'en';
  const policy = policies[selectedLanguage];
  const prefix = normalizeBasePath(basePath);
  const languageLinks = Object.entries(languageLabels)
    .map(([code, label]) => {
      const active = code === selectedLanguage ? ' aria-current="page" class="active"' : '';
      return `<a href="${prefix}/privacy-policy?lang=${code}"${active}>${escapeHtml(label)}</a>`;
    })
    .join('');

  return `<!doctype html>
<html lang="${policy.htmlLang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(policy.title)} — GainMode">
    <title>${escapeHtml(policy.title)} · GainMode</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #090d12;
        --panel: #111923;
        --panel-soft: #182432;
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
      .lead { color: var(--muted); font-size: 18px; max-width: 720px; margin: 22px 0 12px; }
      .updated { color: var(--muted); font-size: 13px; margin: 0; }
      section { background: linear-gradient(145deg, rgba(24, 36, 50, .82), rgba(14, 22, 31, .82)); border: 1px solid var(--line); border-radius: 18px; margin-top: 18px; padding: 24px 26px; }
      h2 { color: var(--text); font-size: 19px; line-height: 1.3; margin: 0 0 13px; }
      p { color: var(--muted); font-size: 15px; margin: 0 0 12px; }
      p:last-child { margin-bottom: 0; }
      ul { color: var(--muted); margin: 8px 0 0; padding-left: 22px; }
      li { font-size: 15px; margin: 7px 0; }
      footer { color: var(--muted); font-size: 13px; padding: 32px 4px 0; }
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
        <a class="brand" href="${prefix}/">GAINMODE</a>
        <div class="language" aria-label="${escapeHtml(policy.language)}">
          <span class="language-label">${escapeHtml(policy.language)}:</span>
          ${languageLinks}
        </div>
      </nav>
      <header>
        <p class="eyebrow">${escapeHtml(policy.eyebrow)}</p>
        <h1>${escapeHtml(policy.title)}</h1>
        <p class="lead">${escapeHtml(policy.lead)}</p>
        <p class="updated">${escapeHtml(policy.updated)}</p>
      </header>
      ${policy.sections.map(renderSection).join('')}
      <footer>${escapeHtml(policy.footer)}</footer>
    </main>
  </body>
</html>`;
}

module.exports = { renderPrivacyPolicyPage };