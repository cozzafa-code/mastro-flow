// integrations/zapier/index.js
// MASTRO Zapier App - Definizione triggers + actions
//
// Setup:
//   1. cd integrations/zapier
//   2. npm install -g zapier-platform-cli
//   3. zapier register "MASTRO ERP"
//   4. zapier push
//   5. zapier promote 1.0.0
//
// Versione: 1.0.0
// Author: MASTRO Suite

const API_BASE = 'https://mastro-erp.vercel.app';

// ==================== AUTHENTICATION ====================

const authentication = {
  type: 'custom',
  fields: [
    {
      key: 'apiKey',
      label: 'MASTRO API Key',
      required: true,
      type: 'password',
      helpText:
        'Genera la tua API key in MASTRO → Settings → Sviluppatori. ' +
        'La key inizia con `mk_live_`. Servono almeno gli scopes commesse:read e leads:write.',
    },
  ],
  test: {
    url: `${API_BASE}/api/v1/status`,
    method: 'GET',
  },
  connectionLabel: (z, bundle) => 'MASTRO connesso',
};

const includeApiKey = (request, z, bundle) => {
  request.headers = request.headers || {};
  request.headers.Authorization = `Bearer ${bundle.authData.apiKey}`;
  return request;
};

// ==================== TRIGGERS ====================

const newCommessa = {
  key: 'new_commessa',
  noun: 'Commessa',
  display: {
    label: 'Nuova commessa',
    description: 'Si attiva quando viene creata una nuova commessa in MASTRO.',
  },
  operation: {
    perform: {
      url: `${API_BASE}/api/v1/commesse`,
      method: 'GET',
      params: { limit: 50, sort: 'created_at.desc' },
    },
    sample: {
      id: 'uuid-example',
      numero: 'S-0042',
      cliente_nome: 'Mario Rossi',
      stato: 'CONFERMATA',
      totale: 4500.0,
      created_at: '2026-05-09T14:30:00Z',
    },
    outputFields: [
      { key: 'id', label: 'ID' },
      { key: 'numero', label: 'Numero commessa' },
      { key: 'cliente_nome', label: 'Cliente' },
      { key: 'stato', label: 'Stato' },
      { key: 'totale', label: 'Totale €' },
      { key: 'created_at', label: 'Data creazione' },
    ],
  },
};

const newLead = {
  key: 'new_lead',
  noun: 'Lead',
  display: {
    label: 'Nuovo lead esterno',
    description: 'Si attiva quando arriva un nuovo lead in MASTRO (sito web, scraping, manuale).',
  },
  operation: {
    perform: {
      url: `${API_BASE}/api/v1/leads`,
      method: 'GET',
      params: { limit: 50 },
    },
    sample: {
      id: 'uuid-example',
      nome: 'Mario',
      cognome: 'Rossi',
      telefono: '+39 333 1234567',
      email: 'mario@example.com',
      fonte: 'sito_web',
      stato: 'nuovo',
    },
  },
};

const paymentReceived = {
  key: 'payment_received',
  noun: 'Pagamento',
  display: {
    label: 'Pagamento ricevuto',
    description: 'Si attiva quando un cliente paga acconto o saldo.',
  },
  operation: {
    perform: {
      url: `${API_BASE}/api/v1/pagamenti`,
      method: 'GET',
      params: { limit: 20 },
    },
    sample: {
      id: 'uuid',
      commessa_id: 'uuid',
      importo: 1500.0,
      metodo: 'stripe',
      data: '2026-05-09T14:30:00Z',
    },
  },
};

// ==================== ACTIONS ====================

const createLead = {
  key: 'create_lead',
  noun: 'Lead',
  display: {
    label: 'Crea lead',
    description: 'Crea un nuovo lead in MASTRO da una fonte esterna (form, CRM, ecc.).',
  },
  operation: {
    inputFields: [
      { key: 'nome', label: 'Nome', type: 'string' },
      { key: 'cognome', label: 'Cognome', type: 'string' },
      { key: 'telefono', label: 'Telefono', type: 'string', required: true },
      { key: 'email', label: 'Email', type: 'string' },
      { key: 'comune', label: 'Comune', type: 'string' },
      { key: 'provincia', label: 'Provincia', type: 'string' },
      { key: 'richiesta', label: 'Descrizione richiesta', type: 'text' },
      { key: 'fonte', label: 'Fonte', type: 'string', default: 'zapier' },
      { key: 'fonte_ref', label: 'Riferimento fonte', type: 'string' },
    ],
    perform: {
      url: `${API_BASE}/api/v1/leads`,
      method: 'POST',
      body: {
        nome: '{{bundle.inputData.nome}}',
        cognome: '{{bundle.inputData.cognome}}',
        telefono: '{{bundle.inputData.telefono}}',
        email: '{{bundle.inputData.email}}',
        comune: '{{bundle.inputData.comune}}',
        provincia: '{{bundle.inputData.provincia}}',
        richiesta: '{{bundle.inputData.richiesta}}',
        fonte: '{{bundle.inputData.fonte}}',
        fonte_ref: '{{bundle.inputData.fonte_ref}}',
      },
    },
    sample: {
      success: true,
      data: {
        id: 'uuid',
        nome: 'Mario',
        stato: 'nuovo',
      },
    },
  },
};

const findCommessa = {
  key: 'find_commessa',
  noun: 'Commessa',
  display: {
    label: 'Trova commessa per numero',
    description: 'Cerca una commessa specifica per il suo numero (es. S-0042).',
  },
  operation: {
    inputFields: [
      { key: 'numero', label: 'Numero commessa', type: 'string', required: true },
    ],
    perform: {
      url: `${API_BASE}/api/v1/commesse`,
      method: 'GET',
      params: {
        numero: '{{bundle.inputData.numero}}',
      },
    },
  },
};

// ==================== APP DEFINITION ====================

module.exports = {
  version: '1.0.0',
  platformVersion: '15.5.0',
  authentication,
  beforeRequest: [includeApiKey],
  triggers: {
    [newCommessa.key]: newCommessa,
    [newLead.key]: newLead,
    [paymentReceived.key]: paymentReceived,
  },
  creates: {
    [createLead.key]: createLead,
  },
  searches: {
    [findCommessa.key]: findCommessa,
  },
};
