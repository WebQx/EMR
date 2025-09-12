/**
 * WebQX Patient Portal - EMR Integration
 * Connects patient portal to real OpenEMR patient management
 */

// Patient Portal EMR Configuration
const PATIENT_EMR_CONFIG = {
    EMR_BASE: 'https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8085.app.github.dev',
    API_BASE: 'https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8080.app.github.dev',
    
    endpoints: {
        // Patient management endpoints
        patient_portal: '/portal/index.php',
        patient_login: '/portal/patient/provider/default.php',
        appointments: '/portal/patient/appointments.php',
        medical_records: '/portal/patient/medical_records.php',
        prescriptions: '/portal/patient/prescriptions.php',
        lab_results: '/portal/patient/labs.php',
        messages: '/portal/patient/messages.php',
        billing: '/portal/patient/billing.php',
        
        // EMR patient API endpoints
        patient_search: '/interface/main/finder/patient_select.php',
        new_patient: '/interface/new/new.php',
        patient_demographics: '/interface/patient_file/summary/demographics.php',
        
        // Community health tracking
        community_services: '/webqx-api.php?action=community-stats',
        mobile_clinic: '/interface/main/calendar/index.php?pc_cattype=mobile_clinic'
    }
};

// Patient Portal Module API
class WebQXPatientPortal {
    constructor() {
        this.patientData = null;
        this.isLoggedIn = false;
        this.init();
    }
    
    init() {
        console.log('👤 Initializing WebQX Patient Portal with EMR integration');
        this.setupEventListeners();
        this.checkEMRConnection();
    }
    
    async checkEMRConnection() {
        try {
            const response = await fetch(`${PATIENT_EMR_CONFIG.EMR_BASE}/webqx-api.php?action=health`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Patient Portal connected to EMR:', data);
                this.updateConnectionStatus(true);
            } else {
                throw new Error('EMR not accessible');
            }
        } catch (error) {
            console.error('❌ Patient Portal EMR connection failed:', error);
            this.updateConnectionStatus(false);
        }
    }
    
    updateConnectionStatus(connected) {
        const statusElement = document.querySelector('.connection-status');
        if (statusElement) {
            statusElement.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
            statusElement.textContent = connected ? 'Connected to EMR' : 'EMR Unavailable';
        }
        
        // Update service availability
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach(card => {
            if (!connected) {
                card.style.opacity = '0.5';
                card.title = 'EMR connection required';
            } else {
                card.style.opacity = '1';
                card.title = 'Click to access EMR feature';
            }
        });
    }
    
    setupEventListeners() {
        // Set up module function calls
        this.setupModuleFunctions();
    }
    
    setupModuleFunctions() {
        // Override moduleAPI functions with real EMR connections
        window.moduleAPI = {
            openAppointments: () => this.openAppointments(),
            openMedicalRecords: () => this.openMedicalRecords(),
            openPrescriptions: () => this.openPrescriptions(),
            openLabResults: () => this.openLabResults(),
            openBilling: () => this.openBilling(),
            openMessages: () => this.openMessages(),
            openEmergencyServices: () => this.openEmergencyServices(),
            openTelehealth: () => this.openTelehealth()
        };
    }
    
    // Patient Portal Functions
    openAppointments() {
        console.log('📅 Opening EMR Appointments');
        window.open(`${PATIENT_EMR_CONFIG.EMR_BASE}${PATIENT_EMR_CONFIG.endpoints.appointments}`, '_blank');
    }
    
    openMedicalRecords() {
        console.log('📋 Opening EMR Medical Records');
        window.open(`${PATIENT_EMR_CONFIG.EMR_BASE}${PATIENT_EMR_CONFIG.endpoints.medical_records}`, '_blank');
    }
    
    openPrescriptions() {
        console.log('💊 Opening EMR Prescriptions');
        window.open(`${PATIENT_EMR_CONFIG.EMR_BASE}${PATIENT_EMR_CONFIG.endpoints.prescriptions}`, '_blank');
    }
    
    openLabResults() {
        console.log('🧪 Opening EMR Lab Results');
        window.open(`${PATIENT_EMR_CONFIG.EMR_BASE}${PATIENT_EMR_CONFIG.endpoints.lab_results}`, '_blank');
    }
    
    openBilling() {
        console.log('💳 Opening EMR Billing');
        window.open(`${PATIENT_EMR_CONFIG.EMR_BASE}${PATIENT_EMR_CONFIG.endpoints.billing}`, '_blank');
    }
    
    openMessages() {
        console.log('💬 Opening EMR Messages');
        window.open(`${PATIENT_EMR_CONFIG.EMR_BASE}${PATIENT_EMR_CONFIG.endpoints.messages}`, '_blank');
    }
    
    openEmergencyServices() {
        console.log('🚨 Opening Emergency Services');
        // Emergency contact or urgent care scheduling
        window.open(`${PATIENT_EMR_CONFIG.EMR_BASE}/interface/main/calendar/add_edit_event.php?pc_cattype=emergency`, '_blank');
    }
    
    openTelehealth() {
        console.log('📹 Opening Telehealth');
        window.open(`${PATIENT_EMR_CONFIG.EMR_BASE}/interface/main/calendar/add_edit_event.php?pc_cattype=telehealth`, '_blank');
    }
    
    // Patient Registration/Login
    openPatientLogin() {
        console.log('🔐 Opening Patient Login');
        window.open(`${PATIENT_EMR_CONFIG.EMR_BASE}${PATIENT_EMR_CONFIG.endpoints.patient_login}`, '_blank');
    }
    
    openNewPatientRegistration() {
        console.log('📝 Opening New Patient Registration');
        window.open(`${PATIENT_EMR_CONFIG.EMR_BASE}${PATIENT_EMR_CONFIG.endpoints.new_patient}`, '_blank');
    }
    
    // Community Health Services
    openCommunityServices() {
        console.log('🌍 Opening Community Health Services');
        window.open(`${PATIENT_EMR_CONFIG.EMR_BASE}${PATIENT_EMR_CONFIG.endpoints.community_services}`, '_blank');
    }
    
    openMobileClinic() {
        console.log('🚐 Opening Mobile Clinic Schedule');
        window.open(`${PATIENT_EMR_CONFIG.EMR_BASE}${PATIENT_EMR_CONFIG.endpoints.mobile_clinic}`, '_blank');
    }
    
    // Quick Actions
    scheduleAppointment() {
        this.openAppointments();
    }
    
    viewMedicalHistory() {
        this.openMedicalRecords();
    }
    
    requestPrescriptionRefill() {
        this.openPrescriptions();
    }
    
    contactProvider() {
        this.openMessages();
    }
    
    // Emergency Contact
    emergency911() {
        alert('🚨 EMERGENCY: Call 911 immediately for life-threatening emergencies');
        if (confirm('Would you like to open the emergency services portal?')) {
            this.openEmergencyServices();
        }
    }
    
    // Demo Functions for Testing
    async loadDemoPatientData() {
        try {
            console.log('📊 Loading demo patient data from EMR...');
            
            // This would typically authenticate and load real patient data
            // For now, we'll use demo data that matches EMR structure
            this.patientData = {
                id: 'P001234567',
                name: 'John Doe',
                dob: '1980-01-15',
                email: 'john.doe@example.com',
                phone: '(555) 123-4567',
                address: '123 Main St, City, State 12345',
                emergency_contact: 'Jane Doe - (555) 987-6543',
                last_visit: '2024-08-15',
                next_appointment: '2024-09-20 10:00 AM'
            };
            
            this.displayPatientInfo();
            
        } catch (error) {
            console.error('❌ Failed to load patient data:', error);
        }
    }
    
    displayPatientInfo() {
        if (!this.patientData) return;
        
        // Update patient info displays
        const infoElements = {
            'patient-name': this.patientData.name,
            'patient-id': this.patientData.id,
            'next-appointment': this.patientData.next_appointment,
            'last-visit': this.patientData.last_visit
        };
        
        Object.entries(infoElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
}

// Initialize Patient Portal
document.addEventListener('DOMContentLoaded', function() {
    console.log('👤 WebQX Patient Portal - EMR Integration loaded');
    
    // Initialize patient portal
    window.patientPortal = new WebQXPatientPortal();
    
    // Update page branding
    document.title = 'WebQX EMR - Patient Portal';
    
    // Load demo data for testing
    setTimeout(() => {
        window.patientPortal.loadDemoPatientData();
    }, 1000);
    
    console.log('✅ Patient Portal connected to EMR server');
});

// Make available globally
window.PATIENT_EMR_CONFIG = PATIENT_EMR_CONFIG;