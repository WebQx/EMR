/**
 * WebQX Placement Cards Manager
 * Manages dynamic placement cards across all modules
 */

class PlacementCardsManager {
    constructor(dbConnector) {
        this.db = dbConnector;
        this.cards = new Map();
        this.activeUser = null;
        this.refreshIntervals = new Map();
    }

    async loadCards(userId, moduleId = null) {
        const cards = await this.db.getPlacementCards(userId, moduleId);
        
        cards.forEach(card => {
            this.cards.set(card.card_id, {
                ...card,
                data: null,
                lastRefresh: null
            });
            
            // Setup auto-refresh
            if (card.refresh_interval > 0) {
                this.setupAutoRefresh(card.card_id, card.refresh_interval);
            }
        });
        
        return cards;
    }

    async refreshCardData(cardId) {
        const card = this.cards.get(cardId);
        if (!card) return null;

        try {
            const data = await this.fetchCardData(card);
            card.data = data;
            card.lastRefresh = new Date();
            
            // Update UI
            this.updateCardUI(cardId, data);
            
            return data;
        } catch (error) {
            console.error(`Failed to refresh card ${cardId}:`, error);
            return null;
        }
    }

    async fetchCardData(card) {
        const queries = {
            'patient-appointments': `
                SELECT COUNT(*) as count, 
                       MIN(pc_eventDate) as next_date,
                       MIN(pc_startTime) as next_time
                FROM openemr_postcalendar_events 
                WHERE pc_eventDate >= CURDATE() AND pc_pid = ?
            `,
            'patient-records': `
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN date > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recent
                FROM form_encounter WHERE pid = ?
            `,
            'patient-prescriptions': `
                SELECT COUNT(*) as active,
                       SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as ready
                FROM prescriptions WHERE patient_id = ?
            `
        };

        const query = queries[card.card_id];
        if (!query) return { status: 'No data source' };

        const results = await this.db.query(query, [this.activeUser?.id]);
        return results[0] || {};
    }

    updateCardUI(cardId, data) {
        const element = document.querySelector(`[data-card-id="${cardId}"]`);
        if (!element) return;

        const dataElement = element.querySelector('.card-data');
        if (dataElement && data) {
            let displayText = '';
            
            switch (cardId) {
                case 'patient-appointments':
                    displayText = `${data.count || 0} upcoming`;
                    break;
                case 'patient-records':
                    displayText = `${data.recent || 0} recent, ${data.total || 0} total`;
                    break;
                case 'patient-prescriptions':
                    displayText = `${data.active || 0} active, ${data.ready || 0} ready`;
                    break;
                default:
                    displayText = JSON.stringify(data);
            }
            
            dataElement.textContent = displayText;
        }

        // Update timestamp
        const timestampElement = element.querySelector('.card-timestamp');
        if (timestampElement) {
            timestampElement.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
        }
    }

    setupAutoRefresh(cardId, intervalSeconds) {
        if (this.refreshIntervals.has(cardId)) {
            clearInterval(this.refreshIntervals.get(cardId));
        }

        const interval = setInterval(() => {
            this.refreshCardData(cardId);
        }, intervalSeconds * 1000);

        this.refreshIntervals.set(cardId, interval);
    }

    async moveCard(cardId, newX, newY) {
        await this.db.updatePlacementCard(cardId, this.activeUser?.id, {
            position_x: newX,
            position_y: newY
        });
        
        const card = this.cards.get(cardId);
        if (card) {
            card.position_x = newX;
            card.position_y = newY;
        }
    }

    async toggleCardVisibility(cardId) {
        const card = this.cards.get(cardId);
        if (!card) return;

        const newVisibility = !card.visible;
        await this.db.updatePlacementCard(cardId, this.activeUser?.id, {
            visible: newVisibility ? 1 : 0
        });
        
        card.visible = newVisibility;
        
        // Update UI
        const element = document.querySelector(`[data-card-id="${cardId}"]`);
        if (element) {
            element.style.display = newVisibility ? 'block' : 'none';
        }
    }

    setActiveUser(user) {
        this.activeUser = user;
    }

    destroy() {
        // Clear all intervals
        this.refreshIntervals.forEach(interval => clearInterval(interval));
        this.refreshIntervals.clear();
        this.cards.clear();
    }
}

window.PlacementCardsManager = PlacementCardsManager;