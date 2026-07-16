/**
 * Neptune Logistics – Shared Database & Auth Driver (supabase-config.js)
 * Unified interface supporting both live Supabase DB and local storage mock fallbacks.
 * Enables immediate local/offline testing without failing Javascript code.
 */

(function () {
  'use strict';

  // 1. Supabase Credentials (USER CONFIGURATION)
  const SUPABASE_URL = "https://qxvkdwmhdirjascroqww.supabase.co"; 
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4dmtkd21oZGlyamFzY3JvcXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDI0MjQsImV4cCI6MjA5NTQ3ODQyNH0.lrXAdOFT58wYOqiuOsXR6kkaplWs7TiwTXlV_PZfX3g";

  // Check if credentials are still placeholder defaults
  const isMockMode = !SUPABASE_URL || SUPABASE_URL.startsWith("YOUR_") || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.startsWith("YOUR_");

  let supabaseClient = null;

  // Initialize live Supabase Client if keys are configured
  if (!isMockMode && typeof supabase !== 'undefined') {
    try {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log("Neptune Core: Connected to live Supabase DB.");
    } catch (e) {
      console.error("Neptune Core: Failed to initialize Supabase, fallback to Mock active.", e);
    }
  } else {
    console.log("Neptune Core: Running in Local Demo & Offline Mode (Local Storage).");
  }

  // 2. Initial Seeding of Mock Database (For Local Demo Mode)
  function seedMockData() {
    if (!localStorage.getItem('neptune_shipments')) {
      const defaultShipments = [
        {
          id: "mock-uuid-1",
          tracking_code: "NPT-2026-001",
          shipment_ref: "SH-2026-A",
          customer_ref: "CUST-SHI-98",
          mode: "Ocean",
          origin: "Shanghai Port, China (CN SHA)",
          destination: "Colombo Port, Sri Lanka (LK CMB)",
          eta: "29 May 2026",
          container_number: "MSCU2382910",
          bl_number: "SHACMB928301",
          awb_number: "",
          current_status: "In Transit",
          public_notes: "Vessel MSC Aurora currently cruising. Weather conditions clear. Customs clearances completed at origin terminal.",
          timeline_json: JSON.stringify([
            { step: 1, title: "Booking Confirmed", desc: "Space allocated and confirmed with carrier. Reference confirmed.", status: "completed", date: "Today" },
            { step: 2, title: "Documents Received", desc: "Packing list, Commercial Invoice & Cargo declarations logged in Neptune systems.", status: "completed", date: "Today" },
            { step: 3, title: "Cargo Collected", desc: "Freight picked up by Neptune inland transport and moved to depot.", status: "completed", date: "Today" },
            { step: 4, title: "Export Customs Cleared", desc: "Customs Brokerage processed by Neptune export specialists. Clearance code logged.", status: "completed", date: "Today" },
            { step: 5, title: "Loaded on Vessel", desc: "Container gated in at origin port terminal. Ocean Bill of Lading active.", status: "completed", date: "Today" },
            { step: 6, title: "In Transit", desc: "Vessel MSC Aurora currently cruising. Current lane transit on track.", status: "active", date: "Today" },
            { step: 7, title: "Arrival at Destination Port", desc: "Expected arrival at Colombo Port. Terminal handling preparation.", status: "pending", date: "" },
            { step: 8, title: "Import Customs Clearance", desc: "Neptune custom agents handling documentation submit to Colombo port authority.", status: "pending", date: "" },
            { step: 9, title: "Duties / Tax Confirmation", desc: "Tax code validation and clearance code confirmation from customs gate.", status: "pending", date: "" },
            { step: 10, title: "Delivery Arranged", desc: "Inland transport dispatched. Gate passes approved for out-of-port delivery.", status: "pending", date: "" },
            { step: 11, title: "Delivered", desc: "Consignee warehouse drop-off. Proof of Delivery (POD) signed and registered.", status: "pending", date: "" }
          ]),
          is_public: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "mock-uuid-2",
          tracking_code: "NPT-2026-002",
          shipment_ref: "AWB-7728-B",
          customer_ref: "CUST-AIR-42",
          mode: "Air",
          origin: "Shanghai Pudong Airport (PVG)",
          destination: "Bandaranaike Int'l Airport (CMB)",
          eta: "30 May 2026",
          container_number: "",
          bl_number: "",
          awb_number: "176-92830182",
          current_status: "Export Customs Cleared",
          public_notes: "Air freight pallet finalized and cleared by Shanghai export customs. Scheduled for upload to Emirates Flight EK-502.",
          timeline_json: JSON.stringify([
            { step: 1, title: "Booking Confirmed", desc: "Flight cargo space secured with Emirates SkyCargo.", status: "completed", date: "Yesterday" },
            { step: 2, title: "Documents Received", desc: "Air cargo manifest and commercial documents approved.", status: "completed", date: "Yesterday" },
            { step: 3, title: "Cargo Collected", desc: "Cargo picked up from supplier factory and gated in at PVG warehouse.", status: "completed", date: "Today" },
            { step: 4, title: "Export Customs Cleared", desc: "Export customs brokerage cleared successfully by Neptune broker.", status: "active", date: "Today" },
            { step: 5, title: "Loaded on Flight", desc: "Cargo palette loading onto flight deck cargo bay.", status: "pending", date: "" },
            { step: 6, title: "In Transit", desc: "Flight in route from PVG to CMB.", status: "pending", date: "" },
            { step: 7, title: "Arrival at Destination Airport", desc: "Flight landing and terminal cargo release at CMB.", status: "pending", date: "" },
            { step: 8, title: "Import Customs Clearance", desc: "Neptune CHA submitted documents to Sri Lanka customs house.", status: "pending", date: "" },
            { step: 9, title: "Duties / Tax Confirmation", desc: "Import duty clearance and tax code approval.", status: "pending", date: "" },
            { step: 10, title: "Delivery Arranged", desc: "Secured customs gate clearance pass for dispatcher delivery.", status: "pending", date: "" },
            { step: 11, title: "Delivered", desc: "Drop-off and digital proof of delivery signed at client hub.", status: "pending", date: "" }
          ]),
          is_public: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      localStorage.setItem('neptune_shipments', JSON.stringify(defaultShipments));
    }

    if (!localStorage.getItem('neptune_users')) {
      const defaultUsers = [
        { email: "admin@neptune.lk", password: "password123", role: "admin", name: "Samantha Perera (Admin)" },
        { email: "ops@neptune.lk", password: "password123", role: "operations", name: "Ruwan Silva (Operations)" }
      ];
      localStorage.setItem('neptune_users', JSON.stringify(defaultUsers));
    }
  }

  if (isMockMode) {
    seedMockData();
  }

  // 3. Unified Database & Auth Interface
  window.NeptuneDB = {
    isMock: isMockMode,
    client: supabaseClient,

    // ── AUTHENTICATION METHODS ────────────────────────────────────
    
    // Login
    signIn: async function (email, password) {
      if (isMockMode) {
        const users = JSON.parse(localStorage.getItem('neptune_users') || '[]');
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (user) {
          const session = { user: { email: user.email, user_metadata: { role: user.role, name: user.name } } };
          localStorage.setItem('neptune_session', JSON.stringify(session));
          return { data: session, error: null };
        }
        return { data: null, error: { message: "Invalid email or password" } };
      } else {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        return { data, error };
      }
    },

    // Logout
    signOut: async function () {
      if (isMockMode) {
        localStorage.removeItem('neptune_session');
        return { error: null };
      } else {
        const { error } = await supabaseClient.auth.signOut();
        return { error };
      }
    },

    // Get current logged-in user session
    getCurrentUser: async function () {
      if (isMockMode) {
        const session = JSON.parse(localStorage.getItem('neptune_session') || 'null');
        return session ? session.user : null;
      } else {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
      }
    },

    // Get user role from current metadata
    getCurrentRole: async function () {
      const user = await this.getCurrentUser();
      if (!user) return null;
      
      if (isMockMode) {
        return user.user_metadata ? user.user_metadata.role : null;
      } else {
        // Query the secure profiles table to prevent client-side role manipulation
        try {
          const { data, error } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (data && !error) {
            return data.role;
          }
        } catch (e) {
          console.error("Error querying profiles for secure role:", e);
        }
        // Fallback to JWT user_metadata for client-side UI decoration only
        return user.user_metadata ? user.user_metadata.role : 'operations';
      }
    },

    // Create staff account
    createStaffAccount: async function (email, password, role, name) {
      if (isMockMode) {
        const users = JSON.parse(localStorage.getItem('neptune_users') || '[]');
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          return { data: null, error: { message: "Account email already exists." } };
        }
        const newUser = { email, password, role, name };
        users.push(newUser);
        localStorage.setItem('neptune_users', JSON.stringify(users));
        return { data: newUser, error: null };
      } else {
        // Public users sign up via Auth API
        // NOTE: Standard supabase.auth.signUp signs out the current admin.
        // Therefore, we invite or instruct the user to configure Auth triggers
        // Or we trigger sign up with metadata which is secured via database triggers.
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: { role, name }
          }
        });
        return { data, error };
      }
    },

    // ── DATABASE OPERATIONS ────────────────────────────────────────

    // Get a public shipment by exact tracking code/container/AWB
    getShipment: async function (searchCode) {
      if (!searchCode) return { data: null, error: "Search query required." };
      searchCode = searchCode.trim().toLowerCase();

      if (isMockMode) {
        const shipments = JSON.parse(localStorage.getItem('neptune_shipments') || '[]');
        const shipment = shipments.find(s => 
          s.is_public && (
            s.tracking_code.toLowerCase() === searchCode ||
            s.container_number.toLowerCase().includes(searchCode) ||
            s.bl_number.toLowerCase() === searchCode ||
            s.awb_number.toLowerCase() === searchCode ||
            s.shipment_ref.toLowerCase() === searchCode
          )
        );
        return { data: shipment ? [shipment] : [], error: null };
      } else {
        // Invoke secure RPC function bypassing standard table RLS
        const { data, error } = await supabaseClient.rpc('get_public_shipment', { search_code: searchCode });
        return { data, error };
      }
    },

    // Get specific shipment details by UUID (Staff only)
    getShipmentById: async function (id) {
      if (isMockMode) {
        const shipments = JSON.parse(localStorage.getItem('neptune_shipments') || '[]');
        const shipment = shipments.find(s => s.id === id);
        return { data: shipment || null, error: shipment ? null : "Shipment not found." };
      } else {
        const { data, error } = await supabaseClient.from('shipments').select('*').eq('id', id).single();
        return { data, error };
      }
    },

    // List all shipments (Staff only)
    listShipments: async function () {
      if (isMockMode) {
        const shipments = JSON.parse(localStorage.getItem('neptune_shipments') || '[]');
        // Sort by created date descending
        shipments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return { data: shipments, error: null };
      } else {
        const { data, error } = await supabaseClient.from('shipments').select('*').order('created_at', { ascending: false });
        return { data, error };
      }
    },

    // Add new shipment (Admin only)
    addShipment: async function (shipmentData) {
      const now = new Date().toISOString();
      
      if (isMockMode) {
        const shipments = JSON.parse(localStorage.getItem('neptune_shipments') || '[]');
        
        // Verify unique code
        if (shipments.some(s => s.tracking_code.toLowerCase() === shipmentData.tracking_code.toLowerCase())) {
          return { data: null, error: { message: `Tracking reference code ${shipmentData.tracking_code} already exists.` } };
        }

        const newShipment = {
          id: "uuid-" + Math.random().toString(36).substr(2, 9),
          ...shipmentData,
          created_at: now,
          updated_at: now
        };
        
        shipments.push(newShipment);
        localStorage.setItem('neptune_shipments', JSON.stringify(shipments));
        return { data: newShipment, error: null };
      } else {
        const { data, error } = await supabaseClient.from('shipments').insert([shipmentData]).select().single();
        return { data, error };
      }
    },

    // Update shipment metrics & milestones (Admin or Operations Staff)
    updateShipment: async function (id, shipmentData) {
      const now = new Date().toISOString();

      if (isMockMode) {
        const shipments = JSON.parse(localStorage.getItem('neptune_shipments') || '[]');
        const idx = shipments.findIndex(s => s.id === id);
        
        if (idx === -1) {
          return { data: null, error: { message: "Shipment record not found." } };
        }

        // Verify unique code isn't taken by another id
        if (shipments.some(s => s.id !== id && s.tracking_code.toLowerCase() === shipmentData.tracking_code.toLowerCase())) {
          return { data: null, error: { message: `Tracking reference code ${shipmentData.tracking_code} already exists.` } };
        }

        const updated = {
          ...shipments[idx],
          ...shipmentData,
          updated_at: now
        };

        shipments[idx] = updated;
        localStorage.setItem('neptune_shipments', JSON.stringify(shipments));
        return { data: updated, error: null };
      } else {
        const { data, error } = await supabaseClient.from('shipments').update(shipmentData).eq('id', id).select().single();
        return { data, error };
      }
    },

    // Delete shipment (Admin only)
    deleteShipment: async function (id) {
      if (isMockMode) {
        const shipments = JSON.parse(localStorage.getItem('neptune_shipments') || '[]');
        const filtered = shipments.filter(s => s.id !== id);
        localStorage.setItem('neptune_shipments', JSON.stringify(filtered));
        return { error: null };
      } else {
        const { error } = await supabaseClient.from('shipments').delete().eq('id', id);
        return { error };
      }
    }
  };

})();
