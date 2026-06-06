// ── Tipagem compartilhada para todos os dicionários ─────────────────
export interface Translations {
  login: {
    title: string;
    subtitle: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    googleButton: string;
    appleButton: string;
    redirecting: string;
    divider: string;
    signIn: string;
    signUp: string;
    signInSwitch: string;
    signUpSwitch: string;
    checkEmail: string;
    providerNotConfigured: string;
    sessionExpired: string;
    genericAuthError: string;
    genericGoogleError: string;
    genericAppleError: string;
    oauthNotConfigured: { title: string; message: string };
    oauthSessionExpired: { title: string; message: string };
    oauthTimeout: { title: string; message: string };
    oauthGeneric: { title: string; message: string };
  };
  dashboard: {
    welcome: string;
    myLists: string;
    sharedWithMe: string;
    updated: string;
    shared: string;
    editor: string;
    viewer: string;
    noListsYet: string;
    tapPlusToCreate: string;
    storicoSpese: string;
    articlePurchased: string;
    articlesPurchased: string;
    tapForDetails: string;
    totalSpesa: string;
    copyAsNewList: string;
    cloning: string;
    cloneSuccess: string;
    cloneError: string;
    notAuthenticated: string;
    unknownError: string;
    errorCreatingList: string;
    noDetails: string;
    close: string;
    stats: string;
    settings: string;
    exit: string;
  };
  stats: {
    title: string;
    analytics: string;
    backToDashboard: string;
    currentMonth: string;
    last6Months: string;
    noSpendingThisMonth: string;
    noSpendingRecent: string;
    noSpendingThisMonthDesc: string;
    noSpendingRecentDesc: string;
    totalMonth: string;
    total6Months: string;
    avgSpending: string;
    days: string;
    day: string;
    articles: string;
    processed: string;
    weeklyTrend: string;
    monthlyTrend: string;
    topImpactOnBudget: string;
    insufficientData: string;
    topImpactFootnote: string;
  };
  list: {
    back: string;
    inCart: string;
    totalSpesa: string;
    estimatedTotal: string;
    toBuy: string;
    inCartSection: string;
    finalizePurchase: string;
    addItemPlaceholder: string;
    defaultListTitle: string;
    noItemsYet: string;
    scanner: string;
    addedToCart: string;
    errorRetry: string;
    impossibleAdd: string;
    nameUpdated: string;
    saveError: string;
    linkCopied: string;
    inviteSent: string;
    userAlreadyInvited: string;
    shareError: string;
    deleteArticle: string;
    si: string;
    no: string;
    shoppingCompleted: string;
    itemsPurchasedToast: string;
    itemPurchasedToast: string;
    finalizeError: string;
    listDeleted: string;
    deleteListError: string;
    articleUpdated: string;
    removedFromCart: string;
    shareList: string;
    deleteList: string;
    add: string;
    retry: string;
    emptyList: string;
    addFirstItem: string;
    completePurchase: string;
    finalizePartial: string;
    inCartLabel: string;
    stillToBuy: string;
    completeArchiveMsg: string;
    partialFinalizeMsg: string;
    cancel: string;
    archive: string;
    confirmFinalize: string;
    deleteListTitle: string;
    deleteListConfirm: string;
    irreversible: string;
    delete: string;
    inviteCollaborator: string;
    inviteEmailPlaceholder: string;
    copyInviteLink: string;
    inviteSubtitle: string;
    sendInvite: string;
    newProductDetected: string;
    productIdentified: string;
    priceDetected: string;
    noAdditionalDescription: string;
    itemNotInList: string;
    wantToAddNow: string;
    noThanks: string;
    yesAdd: string;
    withoutPrice: string;
    addedToCartToast: string;
    scanError: string;
  };
  language: {
    label: string;
    it: string;
    pt: string;
    en: string;
  };
}

// ── Italiano (fonte de verità) ──────────────────────────────────────
const it: Translations = {
  login: {
    title: "Spesa Condivisa",
    subtitle: "La tua lista della spesa collaborativa",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    googleButton: "Continua con Google",
    appleButton: "Continua con Apple",
    redirecting: "Reindirizzamento...",
    divider: "oppure",
    signIn: "Accedi",
    signUp: "Registrati",
    signInSwitch: "Non hai un account? Registrati",
    signUpSwitch: "Hai già un account? Accedi",
    checkEmail: "Controlla la tua email per confermare la registrazione!",
    providerNotConfigured: "Provider non configurato",
    sessionExpired: "Sessione scaduta",
    genericAuthError: "Errore di autenticazione",
    genericGoogleError: "Errore con Google",
    genericAppleError: "Errore con Apple",
    oauthNotConfigured: {
      title: "Provider non configurato",
      message:
        "Il provider di accesso selezionato non è stato ancora abilitato. " +
        "Contatta l'amministratore o utilizza un altro metodo di accesso.",
    },
    oauthSessionExpired: {
      title: "Sessione scaduta",
      message: "La tua sessione è scaduta. Per favore, riprova ad accedere.",
    },
    oauthTimeout: {
      title: "Tempo scaduto",
      message: "Il tempo per completare l'accesso è scaduto. Riprova.",
    },
    oauthGeneric: {
      title: "Errore di autenticazione",
      message: "Si è verificato un errore durante l'accesso. Riprova.",
    },
  },
  dashboard: {
    welcome: "Benvenuto/a",
    myLists: "Le mie liste",
    sharedWithMe: "Condivise con me",
    updated: "Aggiornata",
    shared: "Condivisa",
    editor: "Editor",
    viewer: "Visualizzatore",
    noListsYet: "Nessuna lista ancora",
    tapPlusToCreate: "Tocca il pulsante + per crearne una!",
    storicoSpese: "Storico Spese",
    articlePurchased: "articolo acquistato",
    articlesPurchased: "articoli acquistati",
    tapForDetails: "Tocca per dettagli",
    totalSpesa: "Totale spesa",
    copyAsNewList: "🔄 Copia come nuova lista",
    cloning: "Clonazione in corso…",
    cloneSuccess: "Lista clonata con successo! 🎉",
    cloneError: "Errore:",
    notAuthenticated: "Non autenticato",
    unknownError: "Errore sconosciuto",
    errorCreatingList: "Errore creazione lista",
    noDetails: "Nessun dettaglio disponibile.",
    close: "Chiudi",
    stats: "Statistiche",
    settings: "Impostazioni",
    exit: "Esci",
  },
  stats: {
    title: "Statistiche Spesa",
    analytics: "Analytics",
    backToDashboard: "Torna alla dashboard",
    currentMonth: "Mese Corrente",
    last6Months: "Storico 6 Mesi",
    noSpendingThisMonth: "Nessuna spesa questo mese",
    noSpendingRecent: "Nessuna spesa recente",
    noSpendingThisMonthDesc:
      "Inizia a fare la spesa e finalizza gli acquisti per vedere le tue statistiche mensili.",
    noSpendingRecentDesc:
      "Non hai completato acquisti negli ultimi 6 mesi. Torna a fare la spesa!",
    totalMonth: "Totale mese",
    total6Months: "Totale 6 mesi",
    avgSpending: "Media spesa",
    days: "giorni",
    day: "giorno",
    articles: "Articoli",
    processed: "processati",
    weeklyTrend: "Andamento settimanale",
    monthlyTrend: "Andamento mensile",
    topImpactOnBudget: "Top impatto sul budget",
    insufficientData: "Dati insufficienti",
    topImpactFootnote:
      "*Prodotti con il maggiore impatto sul totale speso nel periodo selezionato.",
  },
  list: {
    back: "Indietro",
    inCart: "Nel carrello",
    totalSpesa: "Totale spesa",
    estimatedTotal: "Stima totale",
    toBuy: "DA COMPRARE",
    inCartSection: "NEL CARRELLO",
    finalizePurchase: "Finalizza Spesa",
    addItemPlaceholder: "Aggiungi articolo...",
    defaultListTitle: "Lista della spesa",
    noItemsYet: "Nessun articolo ancora",
    scanner: "Scanner Generale",
    // Sub-keys especificas do ShoppingList
    addedToCart: "Aggiunto al carrello! 🛒",
    errorRetry: "Errore. Riprova.",
    impossibleAdd: "Impossibile aggiungere l'articolo",
    nameUpdated: "Nome aggiornato ✓",
    saveError: "Errore nel salvataggio",
    linkCopied: "Link copiato! 📋",
    inviteSent: "Invito inviato a",
    userAlreadyInvited: "Utente già invitato",
    shareError: "Errore nell'invio",
    deleteArticle: "Elimina articolo?",
    si: "Sì",
    no: "No",
    shoppingCompleted: "🎉 Spesa completata! Ottimo lavoro!",
    itemsPurchasedToast: "articoli acquistati!",
    itemPurchasedToast: "articolo acquistato!",
    finalizeError: "Errore nel finalizzare la spesa",
    listDeleted: "Lista eliminata con successo 🗑️",
    deleteListError: "Errore nell'eliminazione della lista",
    articleUpdated: "Articolo aggiornato ✓",
    removedFromCart: "Rimosso dal carrello",
    shareList: "Condividi lista",
    deleteList: "Elimina lista",
    add: "Aggiungi",
    retry: "Riprova",
    emptyList: "La lista è vuota.",
    addFirstItem: "Aggiungi il primo articolo!",
    completePurchase: "Completa la spesa",
    finalizePartial: "Finalizza pagamento parziale",
    inCartLabel: "nel carrello",
    stillToBuy: "ancora da comprare",
    completeArchiveMsg:
      "Vuoi completare e archiviare questa lista? Tutti gli articoli saranno salvati nello storico.",
    partialFinalizeMsg:
      "Ci sono ancora articoli da comprare. Vuoi finalizzare il pagamento solo per gli articoli attualmente nel carrello e mantenere gli altri per la prossima spesa?",
    cancel: "Annulla",
    archive: "✅ Archivia",
    confirmFinalize: "✅ Sì, Finalizza",
    deleteListTitle: "Elimina lista",
    deleteListConfirm: "Sei sicuro di voler eliminare questa lista e tutti i suoi articoli?",
    irreversible: "Questa azione è irreversibile.",
    delete: "Elimina",
    inviteCollaborator: "👥 Invita un collaboratore",
    inviteEmailPlaceholder: "Inserisci l'email o l'ID dell'utente",
    copyInviteLink: "🔗 Copia link di invito",
    inviteSubtitle: "Inserisci l'email per invitare",
    sendInvite: "✉️ Invia Invito",
    newProductDetected: "Nuovo prodotto rilevato",
    productIdentified: "Prodotto identificato",
    priceDetected: "Prezzo rilevato",
    noAdditionalDescription: "Nessuna descrizione aggiuntiva.",
    itemNotInList: "non è nella tua lista.",
    wantToAddNow: "Vuoi aggiungerlo ora",
    noThanks: "No, grazie",
    yesAdd: "✅ Sì, aggiungi",
    withoutPrice: "senza prezzo",
    addedToCartToast: "aggiunto al carrello! 🛒",
    scanError: "Impossibile aggiungere l'articolo scansionato",
  },
  language: {
    label: "Lingua",
    it: "🇮🇹 Italiano",
    pt: "🇧🇷 Português",
    en: "🇬🇧 English",
  },
};

export default it;