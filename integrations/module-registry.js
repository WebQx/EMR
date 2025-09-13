/**
 * WebQX Module Registry
 * Central registry for all WebQX modules and their integration
 */

class ModuleRegistry {
    constructor() {
        this.modules = new Map();
        this.hooks = new Map();
        this.init();
    }

    init() {
        // Register core modules
        this.register('patient-portal', {
            name: 'Patient Portal',
            path: './patient-portal/',
            icon: '👤',
            roles: ['patient', 'admin'],
            database: 'openemr',
            tables: ['patients', 'form_encounter', 'prescriptions'],
            api: '/api/patient',
            cards: ['appointments', 'records', 'prescriptions', 'messages']
        });

        this.register('provider-portal', {
            name: 'Provider Portal', 
            path: './provider/',
            icon: '👨⚕️',
            roles: ['provider', 'physician', 'nurse', 'admin'],
            database: 'openemr',
            tables: ['patients', 'users', 'openemr_postcalendar_events'],
            api: '/api/provider',
            cards: ['patients', 'schedule', 'clinical-notes']
        });

        this.register('admin-console', {
            name: 'Admin Console',
            path: './admin-console/',
            icon: '⚙️', 
            roles: ['admin'],
            database: 'openemr',
            tables: ['users', 'webqx_sessions', 'webqx_module_access'],
            api: '/api/admin',
            cards: ['users', 'system-status', 'analytics']
        });

        this.register('telehealth', {
            name: 'Telehealth',
            path: './telehealth.html',
            icon: '📹',
            roles: ['patient', 'provider', 'physician', 'nurse', 'admin'],
            database: 'webqx_telehealth',
            tables: ['sessions', 'participants', 'recordings'],
            api: '/api/telehealth',
            cards: ['active-sessions', 'scheduled-sessions']
        });

        this.register('emr-system', {
            name: 'EMR System',
            path: './webqx-emr-system/',
            icon: '🏥',
            roles: ['provider', 'physician', 'nurse', 'admin'],
            database: 'openemr',
            tables: ['patients', 'form_encounter', 'users', 'facility'],
            api: '/api/emr',
            cards: ['patient-summary', 'encounters', 'clinical-data']
        });
    }

    register(id, config) {
        this.modules.set(id, {
            id,
            ...config,
            status: 'registered',
            lastAccess: null,
            accessCount: 0
        });
    }

    get(id) {
        return this.modules.get(id);
    }

    getByRole(role) {
        return Array.from(this.modules.values()).filter(module => 
            module.roles.includes(role.toLowerCase())
        );
    }

    async launch(id, user) {
        const module = this.get(id);
        if (!module) throw new Error(`Module ${id} not found`);

        // Check access
        if (!this.hasAccess(module, user)) {
            throw new Error(`Access denied to module ${id}`);
        }

        // Update stats
        module.lastAccess = new Date();
        module.accessCount++;

        // Execute pre-launch hooks
        await this.executeHooks('pre-launch', { module, user });

        // Launch module
        if (module.path.startsWith('http')) {
            window.open(module.path, '_blank');
        } else {
            window.location.href = module.path;
        }

        // Execute post-launch hooks
        await this.executeHooks('post-launch', { module, user });

        return module;
    }

    hasAccess(module, user) {
        if (!user) return false;
        return module.roles.includes(user.role?.toLowerCase());
    }

    addHook(event, callback) {
        if (!this.hooks.has(event)) {
            this.hooks.set(event, []);
        }
        this.hooks.get(event).push(callback);
    }

    async executeHooks(event, data) {
        const hooks = this.hooks.get(event) || [];
        for (const hook of hooks) {
            try {
                await hook(data);
            } catch (error) {
                console.error(`Hook execution failed for ${event}:`, error);
            }
        }
    }

    getStats() {
        return Array.from(this.modules.values()).map(module => ({
            id: module.id,
            name: module.name,
            accessCount: module.accessCount,
            lastAccess: module.lastAccess,
            status: module.status
        }));
    }
}

window.ModuleRegistry = ModuleRegistry;