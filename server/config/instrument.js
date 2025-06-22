import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: "https://41ce7d7e1b72d49d4149d2bceb99096c@o4509363716227072.ingest.us.sentry.io/4509363722715136",
integrations: [nodeProfilingIntegration(),
    Sentry.modulesIntegration,
    Sentry.mongooseIntegration()
],
 // tracesSampleRate: 1.0, // Capture 100% des transactions
});

// Démarrer le profiler
Sentry.profiler.startProfiler();

// Démarrer une transaction à profiler
Sentry.startSpan(
  {
    name: "My First Transaction",
  },
  async () => {
    // Code à profiler
    await new Promise(resolve => setTimeout(resolve, 1000)); // ex: pause d'1 sec

    // Arrêter le profiler
    Sentry.profiler.stopProfiler();
  }
);
