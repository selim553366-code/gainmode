import re
import sys

def modify():
    with open('artifacts/gainmode-site/src/lib/i18n.tsx', 'r') as f:
        content = f.read()

    en_add = """
    emailUs: 'Email us',
    supportEmailLabel: 'Support Email',
    notFoundTitle: '404',
    notFoundBody: 'The page you are looking for does not exist.',
    toggleMenu: 'Toggle menu',
    backToGlobe: 'Back to Globe Studios',
    navPrimary: 'Primary navigation',
    navMobile: 'Mobile navigation',
    gainmodeHome: 'GainMode home',
    yourRhythm: 'Your rhythm',
    statusLive: 'Live',
    statusComingSoon: 'Coming Soon',
"""

    tr_add = """emailUs: 'Bize e-posta gönderin', supportEmailLabel: 'Destek E-postası', notFoundTitle: '404', notFoundBody: 'Aradığınız sayfa mevcut değil.', toggleMenu: 'Menüyü aç/kapat', backToGlobe: 'Globe Studios\\'a dön', navPrimary: 'Ana menü', navMobile: 'Mobil menü', gainmodeHome: 'GainMode ana sayfa', yourRhythm: 'Senin ritmin', statusLive: 'Yayında', statusComingSoon: 'Yakında', """
    
    de_add = """emailUs: 'E-Mail senden', supportEmailLabel: 'Support-E-Mail', notFoundTitle: '404', notFoundBody: 'Die gesuchte Seite existiert nicht.', toggleMenu: 'Menü umschalten', backToGlobe: 'Zurück zu Globe Studios', navPrimary: 'Hauptnavigation', navMobile: 'Mobile Navigation', gainmodeHome: 'GainMode Startseite', yourRhythm: 'Dein Rhythmus', statusLive: 'Live', statusComingSoon: 'Demnächst', """
    
    fr_add = """emailUs: 'Nous envoyer un e-mail', supportEmailLabel: 'E-mail d\\'assistance', notFoundTitle: '404', notFoundBody: 'La page que vous recherchez n\\'existe pas.', toggleMenu: 'Basculer le menu', backToGlobe: 'Retour à Globe Studios', navPrimary: 'Navigation principale', navMobile: 'Navigation mobile', gainmodeHome: 'Accueil GainMode', yourRhythm: 'Ton rythme', statusLive: 'En ligne', statusComingSoon: 'Bientôt', """
    
    es_add = """emailUs: 'Envíanos un correo', supportEmailLabel: 'Correo de soporte', notFoundTitle: '404', notFoundBody: 'La página que buscas no existe.', toggleMenu: 'Alternar menú', backToGlobe: 'Volver a Globe Studios', navPrimary: 'Navegación principal', navMobile: 'Navegación móvil', gainmodeHome: 'Inicio de GainMode', yourRhythm: 'Tu ritmo', statusLive: 'En vivo', statusComingSoon: 'Próximamente', """

    # en
    content = content.replace("gmJoinError: 'We could not save your email right now. Please try again.',", f"gmJoinError: 'We could not save your email right now. Please try again.',{en_add}")
    
    # tr
    content = content.replace("gmJoinError: 'E-postanı şu anda kaydedemedik. Lütfen tekrar dene.',\n  },", f"gmJoinError: 'E-postanı şu anda kaydedemedik. Lütfen tekrar dene.', {tr_add}\n  }},")
    
    # de
    content = content.replace("gmJoinError: 'Deine E-Mail konnte gerade nicht gespeichert werden. Bitte versuche es erneut.',\n  },", f"gmJoinError: 'Deine E-Mail konnte gerade nicht gespeichert werden. Bitte versuche es erneut.', {de_add}\n  }},")
    
    # fr
    content = content.replace("gmJoinError: 'Nous ne pouvons pas enregistrer ton e-mail pour le moment. Réessaie.',\n  },", f"gmJoinError: 'Nous ne pouvons pas enregistrer ton e-mail pour le moment. Réessaie.', {fr_add}\n  }},")
    
    # es
    content = content.replace("gmJoinError: 'No hemos podido guardar tu correo ahora. Inténtalo de nuevo.',\n  }", f"gmJoinError: 'No hemos podido guardar tu correo ahora. Inténtalo de nuevo.', {es_add}\n  }}")

    with open('artifacts/gainmode-site/src/lib/i18n.tsx', 'w') as f:
        f.write(content)

modify()
