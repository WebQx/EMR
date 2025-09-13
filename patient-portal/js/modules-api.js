/**
 * WebQx Patient Portal - Module Cards API Integration
 */

class ModuleCardsAPI {
    constructor() {
        this.baseURL = 'https://webqx.github.io/webqx';
    }

    async openAppointments() {
        window.location.href = `${this.baseURL}/demo-fhir-r4-appointment-booking.html`;
    }

    async openMedicalRecords() {
        window.location.href = `${this.baseURL}/demo-lab-results-viewer.html`;
    }

    async openPrescriptions() {
        window.location.href = `${this.baseURL}/demo/PharmacyLocator-demo.html`;
    }

    async openTelehealth() {
        window.location.href = `${this.baseURL}/telehealth.html`;
    }

    async openMessages() {
        alert('Messages: 1 new message from Dr. Smith about lab results');
    }
}

window.moduleAPI = new ModuleCardsAPI();