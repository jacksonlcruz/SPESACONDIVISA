import { ArrowLeft } from "lucide-react";

// ──────────────────────────────────────────────────────────
// Página: /privacy — Informativa sulla Privacy (Italiano)
// Pública, estática, conforme requisitos Apple App Store e
// Google Play Store para publicação do app.
// ──────────────────────────────────────────────────────────
export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-900">
      {/* Header */}
      <header className="bg-surface-800 px-4 pt-12 pb-4 border-b border-surface-700">
        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="p-2 rounded-xl hover:bg-surface-700 transition-colors"
            aria-label="Torna alla dashboard"
          >
            <ArrowLeft size={20} className="text-zinc-400" />
          </a>
          <div>
            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">
              Legale
            </p>
            <h1 className="text-xl font-bold text-zinc-100">
              Informativa sulla Privacy
            </h1>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 px-5 py-6 pb-16 space-y-8 max-w-2xl mx-auto w-full">
        {/* Última atualização */}
        <p className="text-xs text-zinc-600 italic">
          Ultimo aggiornamento: 5 Giugno 2026
        </p>

        {/* Introdução */}
        <section className="space-y-3">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Benvenuto nell'informativa sulla privacy di{" "}
            <strong className="text-white">Spesa Condivisa</strong> ("l'App").
            La tua privacy è importante per noi. Questo documento descrive
            quali dati raccogliamo, come li utilizziamo e quali diritti hai
            in merito ai tuoi dati personali, in conformità con il
            Regolamento Generale sulla Protezione dei Dati (GDPR) e le
            normative italiane applicabili.
          </p>
        </section>

        {/* Dados coletados */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
            1. Dati Raccolti
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Quando accedi a Spesa Condivisa tramite Google OAuth o
            Apple Sign-In, raccogliamo esclusivamente le seguenti
            informazioni fornite dal tuo provider di autenticazione:
          </p>
          <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1.5 pl-2">
            <li>
              <strong className="text-zinc-300">Nome completo</strong>{" "}
              — visualizzato nelle liste condivise per identificare i collaboratori.
            </li>
            <li>
              <strong className="text-zinc-300">Indirizzo email</strong>{" "}
              — utilizzato come identificativo univoco dell'account e per
              l'invio di inviti alle liste condivise.
            </li>
            <li>
              <strong className="text-zinc-300">Foto del profilo (avatar)</strong>{" "}
              — visualizzata nell'interfaccia per personalizzare l'esperienza.
            </li>
          </ul>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Non raccogliamo dati di pagamento, posizione geografica,
            contatti della rubrica né altre informazioni sensibili.
          </p>
        </section>

        {/* Finalidade */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
            2. Finalità del Trattamento
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            I tuoi dati personali sono trattati esclusivamente per le
            seguenti finalità:
          </p>
          <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1.5 pl-2">
            <li>
              <strong className="text-zinc-300">
                Sincronizzazione in tempo reale
              </strong>{" "}
              delle liste della spesa tra dispositivi autorizzati.
            </li>
            <li>
              <strong className="text-zinc-300">
                Collaborazione tra utenti
              </strong>{" "}
              — permettere a più persone di visualizzare e modificare
              la stessa lista della spesa.
            </li>
            <li>
              <strong className="text-zinc-300">
                Storico delle spese
              </strong>{" "}
              — conservare lo storico degli acquisti completati per
              offrire funzionalità di analisi e statistiche.
            </li>
            <li>
              <strong className="text-zinc-300">
                Miglioramento del servizio
              </strong>{" "}
              — analisi aggregate e anonime per migliorare
              l'esperienza utente.
            </li>
          </ul>
        </section>

        {/* Base jurídica */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
            3. Base Giuridica
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Il trattamento dei tuoi dati si basa su:
          </p>
          <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1.5 pl-2">
            <li>
              <strong className="text-zinc-300">Consenso esplicito</strong>{" "}
              — fornito al momento dell'accesso tramite Google OAuth o Apple Sign-In.
            </li>
            <li>
              <strong className="text-zinc-300">Legittimo interesse</strong>{" "}
              — per garantire il funzionamento tecnico dell'applicazione
              (sincronizzazione, Realtime, storage).
            </li>
          </ul>
        </section>

        {/* Segurança e conservação */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
            4. Sicurezza e Conservazione
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            I tuoi dati sono archiviati in modo sicuro su{" "}
            <strong className="text-zinc-300">Supabase</strong>, una
            piattaforma cloud conforme agli standard di sicurezza
            internazionali (SOC 2, ISO 27001).
          </p>
          <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1.5 pl-2">
            <li>
              Tutte le comunicazioni tra il tuo dispositivo e i server
              avvengono tramite protocollo{" "}
              <strong className="text-zinc-300">HTTPS/TLS</strong>.
            </li>
            <li>
              I dati sono conservati su server situati all'interno
              dello Spazio Economico Europeo (SEE).
            </li>
            <li>
              Conserviamo i tuoi dati finché il tuo account rimane
              attivo. In caso di inattività prolungata, non saranno
              presi provvedimenti automatici di cancellazione, ma potrai
              richiedere l'eliminazione in qualsiasi momento.
            </li>
          </ul>
        </section>

        {/* Direitos do usuário */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
            5. Diritti dell'Utente
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            In qualsiasi momento, hai il diritto di:
          </p>
          <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1.5 pl-2">
            <li>
              <strong className="text-zinc-300">Accesso</strong> — richiedere
              una copia dei tuoi dati personali in nostro possesso.
            </li>
            <li>
              <strong className="text-zinc-300">Rettifica</strong> — correggere
              dati inesatti o incompleti.
            </li>
            <li>
              <strong className="text-zinc-300">Cancellazione</strong>{" "}
              ("diritto all'oblio") — richiedere l'eliminazione
              permanente di tutti i tuoi dati.
            </li>
            <li>
              <strong className="text-zinc-300">Limitazione</strong> —
              limitare il trattamento dei tuoi dati in determinate circostanze.
            </li>
            <li>
              <strong className="text-zinc-300">Portabilità</strong> —
              ricevere i tuoi dati in un formato strutturato e leggibile.
            </li>
            <li>
              <strong className="text-zinc-300">Opposizione</strong> —
              opporti al trattamento basato sul legittimo interesse.
            </li>
          </ul>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Per esercitare uno qualsiasi di questi diritti, contattaci
            all'indirizzo email indicato nella sezione Contatti.
          </p>
        </section>

        {/* Eliminação de dados */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
            6. Eliminazione dei Dati
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Puoi eliminare il tuo account e tutti i dati associati in
            qualsiasi momento direttamente dall'applicazione:
          </p>
          <ol className="list-decimal list-inside text-sm text-zinc-400 space-y-1.5 pl-2">
            <li>
              Vai alla <strong className="text-zinc-300">Dashboard</strong>{" "}
              principale dell'app.
            </li>
            <li>
              Tocca l'icona{" "}
              <strong className="text-zinc-300">Impostazioni (⚙️)</strong>{" "}
              nell'intestazione.
            </li>
            <li>
              Seleziona{" "}
              <strong className="text-red-400">Elimina Account</strong>.
            </li>
            <li>
              Conferma l'operazione digitando la parola richiesta.
            </li>
          </ol>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Una volta confermata, tutti i tuoi dati personali (profilo,
            liste della spesa, storico acquisti e condivisioni) saranno
            eliminati permanentemente dai nostri server. L'operazione è
            irreversibile.
          </p>
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 mt-2">
            <p className="text-xs text-red-400 leading-relaxed">
              <strong>Nota:</strong> Se l'amministratore del sistema non ha
              configurato la chiave di servizio Supabase
              (SUPABASE_SERVICE_ROLE_KEY), il record di autenticazione
              (auth.user) potrebbe non essere eliminato automaticamente.
              In tal caso, i tuoi dati pubblici saranno comunque rimossi
              completamente. Per la cancellazione completa del record di
              autenticazione, contatta il supporto.
            </p>
          </div>
        </section>

        {/* Cookies */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
            7. Cookie e Tecnologie Simili
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Spesa Condivisa utilizza esclusivamente cookie tecnici di
            sessione necessari per:
          </p>
          <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1.5 pl-2">
            <li>Mantenere l'autenticazione dell'utente.</li>
            <li>Garantire la sicurezza delle comunicazioni.</li>
          </ul>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Non utilizziamo cookie di profilazione, tracciamento o
            marketing di terze parti. Non sono presenti strumenti di
            analytics comportamentale.
          </p>
        </section>

        {/* Compartilhamento com terceiros */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
            8. Condivisione con Terze Parti
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            I tuoi dati personali <strong className="text-zinc-300">non</strong>{" "}
            vengono venduti, affittati o condivisi con terze parti per
            finalità commerciali o di marketing.
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            I dati sono trattati esclusivamente tramite i seguenti
            fornitori di servizi tecnici:
          </p>
          <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1.5 pl-2">
            <li>
              <strong className="text-zinc-300">Supabase</strong> —
              hosting del database e autenticazione.
            </li>
            <li>
              <strong className="text-zinc-300">Google OAuth</strong> —
              servizio di autenticazione (Google Ireland Limited,
              conforme al GDPR).
            </li>
            <li>
              <strong className="text-zinc-300">Apple Sign-In</strong> —
              servizio di autenticazione (Apple Inc., conforme al GDPR).
            </li>
          </ul>
        </section>

        {/* Menores */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
            9. Minori
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Spesa Condivisa non è destinato a minori di 16 anni. Non
            raccogliamo consapevolmente dati personali di minori. Se
            vieni a conoscenza che un minore ci ha fornito dati
            personali, contattaci immediatamente.
          </p>
        </section>

        {/* Contatos */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
            10. Contatti
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Per qualsiasi domanda relativa a questa informativa sulla
            privacy o per esercitare i tuoi diritti, puoi contattarci:
          </p>
          <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl px-4 py-3">
            <p className="text-sm text-zinc-300">
              📧 Email:{" "}
              <strong className="text-[#deff9a]">
                contato@jacksonlcruz.com.br
              </strong>
            </p>
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Ci impegniamo a rispondere a tutte le richieste entro 30
            giorni lavorativi.
          </p>
        </section>

        {/* Modifiche */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
            11. Modifiche a Questa Informativa
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Ci riserviamo il diritto di aggiornare questa informativa
            sulla privacy in qualsiasi momento. Le modifiche saranno
            pubblicate su questa pagina con la data di ultimo
            aggiornamento. Ti invitiamo a consultare periodicamente
            questa pagina per rimanere informato.
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            In caso di modifiche sostanziali, ti informeremo tramite
            l'applicazione o via email con un preavviso adeguato.
          </p>
        </section>
      </main>
    </div>
  );
}