# WebQX™ Healthcare Platform

> Complete Healthcare EMR System with OpenEMR Integration, MariaDB 10.5, and FHIR R4 Compliance

## 🌍 Live Demo & Deployment
**GitHub Pages:** https://webqx.github.io/webqx/  
**Local EMR System:** Complete offline-capable OpenEMR deployment  
**Docker Stack:** MariaDB 10.5 + Node.js servers## 🤝 **Development & Contribution**

### **Getting Started**
- **Fork Repository**: Create your own fork for development and testing
- **Suggest Workflows**: Propose specialty clinical workflows and modules
- **Legal Compliance**: Sign IP Addendum/NDA before submitting pull requests
- **Branch Strategy**: Use feature branches with descriptive names and clear commit messages

### **Development Guidelines**
- **Code Standards**: Follow ESLint and TypeScript configurations
- **Testing**: Submit comprehensive tests with YAML logic and compliance notes
- **Documentation**: Update relevant documentation with code changes
- **Review Process**: All PRs require review and compliance verification

### **Contributing Resources**
- **Developer Guide**: See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for detailed instructions
- **Specialty Configuration**: Edit [`specialties.yaml`](./admin-console/ai-tuning/specialties.yaml) for clinical workflows
- **API Documentation**: Complete FHIR R4 endpoint documentation available
- **Sample Code**: Extensive examples in `/demo/` and `/examples/` directories

---

## 📊 **System Monitoring & Analytics**

### **Real-time Monitoring**
- **System Health**: Live monitoring of all servers and database connections
- **Performance Metrics**: Response times, throughput, and resource utilization
- **Error Tracking**: Comprehensive error logging with automated alerting
- **User Analytics**: HIPAA-compliant usage statistics and performance insights

### **Compliance Reporting**
- **Audit Trails**: Complete user activity logging for regulatory compliance
- **Security Reports**: Regular security assessments and vulnerability scans
- **Data Backup**: Automated backups with point-in-time recovery capabilities
- **Uptime Monitoring**: 99.9% availability with redundant failover systems

---

## 📜 **License & Legal**

### **Open Source License**
**Apache 2.0** — Enterprise-ready with contributor IP addendums for legal clarity and scalability

### **Legal Documentation**
- **Main License**: [`LICENSE.md`](./LICENSE.md) - Apache 2.0 terms and conditions
- **NDA Template**: [`nda-template.md`](./legal/nda-template.md) - Non-disclosure agreement template
- **IP Addendum**: [`ip-addendum.md`](./legal/ip-addendum.md) - Intellectual property contribution agreement
- **HIPAA Compliance**: [`HIPAA-COMPLIANCE.md`](./compliance/HIPAA-COMPLIANCE.md) - Healthcare compliance guide

### **Support & Resources**
- **Technical Support**: [support@webqx.healthcare](mailto:support@webqx.healthcare)
- **Business Inquiries**: [business@webqx.healthcare](mailto:business@webqx.healthcare)
- **GitHub Organization**: [github.com/webqx-health](https://github.com/webqx-health)
- **Documentation Site**: [docs.webqx.healthcare](https://docs.webqx.healthcare)

---

## 🌟 **Mission Statement**

### _"Care equity begins with code equity."_

**WebQX Healthcare** is committed to democratizing healthcare technology by providing open-source, HIPAA-compliant, and globally accessible healthcare management solutions. Our mission is to ensure that quality healthcare technology is available to all healthcare providers, regardless of size, location, or resources.

### **Our Values**
- **Accessibility**: Healthcare technology should be available to everyone
- **Security**: Patient data protection is our highest priority  
- **Interoperability**: Systems should work together seamlessly
- **Innovation**: Continuous improvement through community collaboration
- **Compliance**: Meeting and exceeding global healthcare regulations

---

📧 **Contact Information**: [info@webqx.healthcare](mailto:info@webqx.healthcare)  
🌐 **Live Demo**: [https://webqx.github.io/webqx/](https://webqx.github.io/webqx/)  
📚 **Documentation**: [https://docs.webqx.healthcare](https://docs.webqx.healthcare)ehealth

---

## 🎉 **NEW: Complete EMR System Deployment**

### 🗄️ **MariaDB 10.5 OpenEMR Integration**
- **Production-Ready OpenEMR**: Complete 7.x compatible database schema
- **Essential Tables**: Users, Patients, Facilities, Encounters, Prescriptions
- **HIPAA Compliance**: Comprehensive audit trails and access controls
- **Sample Data**: Test patients and realistic clinical scenarios
- **FHIR Ready**: Database structure prepared for R4 compliance

### 🖥️ **Multi-Server Architecture**
- **EMR Server (Port 3000)**: Node.js backend with authentication
- **API Proxy (Port 3001)**: CORS-enabled gateway with system control
- **Telehealth Server (Port 3003)**: WebSocket-based video conferencing
- **MariaDB (Port 3306)**: Healthcare database with UTF8MB4 support

### 🎛️ **Remote Control & Monitoring**
- **Control Panel**: Press `Ctrl+Shift+C` on any WebQX page for server management
- **Real-time Status**: Live server health monitoring and alerts
- **Session Management**: Secure user sessions with role-based routing
- **System Administration**: Remote start/stop/restart capabilities

---

## ✨ Core Features

### 🏥 **Complete OpenEMR 7.x System**
- **MariaDB 10.5**: Optimized database engine with healthcare configurations
- **Patient Management**: Complete demographics, history, and clinical records
- **Provider Workflows**: Clinical documentation, prescriptions, and billing
- **HIPAA Compliance**: Audit trails, access controls, and secure authentication
- **Sample Data**: Ready-to-test patient records and clinical scenarios

### 👤 **Enhanced Patient Portal**
- **Local Authentication**: Secure login through local EMR backend
- **Medical Records Access**: Complete patient history and documentation
- **Appointment Scheduling**: Integration with OpenEMR calendar system
- **Prescription Management**: Medication tracking and refill requests
- **Lab Results**: Secure access to diagnostic and laboratory findings

### 👨‍⚕️ **Advanced Provider Portal**
- **Clinical Workflows**: Complete EHR integration with OpenEMR backend
- **Patient Management**: Full access to patient records and history
- **Prescription System**: E-prescribing with drug interaction checking
- **Documentation Tools**: Clinical notes, encounters, and billing integration
- **Quality Measures**: Clinical decision support and reporting tools

### ⚙️ **System Administration Console**
- **Server Management**: Remote control of all WebQX services
- **User Administration**: Role-based access control and permissions
- **Database Monitoring**: MariaDB health and performance tracking
- **Integration Status**: Real-time monitoring of all system components
- **Audit & Compliance**: HIPAA-compliant logging and reporting

### 🌐 **WebQX Telehealth Platform**
- **Video Conferencing**: HIPAA-compliant video consultations
- **Real-time Chat**: Secure messaging between patients and providers
- **Remote Monitoring**: IoT device integration and patient data collection
- **Appointment Integration**: Seamless scheduling with EMR calendar
- **Session Recording**: Secure storage of telehealth encounters

### 🔧 **Technical Infrastructure**
- EHR Dashboard (React + GraphQL)
- Prescription Management (RxNorm + SmartRx)
- Secure Messaging (Matrix channels)
- Clinical Alerts/Decision Support (OpenCDS/Drools)
- CME Tracker (Open Badges)
- Provider Assistant Bot (LLM + Whisper)
- Transcription Suite (Whisper + Google Speech-to-Text)

### 📱 **Mobile & Web Applications**
- **Progressive Web App**: Offline-capable application with service worker
- **Mobile Responsive**: Optimized for all devices and screen sizes
- **Quick Deploy**: One-click deployment to major cloud platforms
- **GitHub Pages**: Instant web deployment with remote management capabilities
- **SSL/TLS**: Secure connections with automatic certificate management

## 🏗️ **System Architecture**

### **Multi-Server Environment**
```
EMR Server         →  Port 3000  →  OpenEMR Integration
Telehealth Server  →  Port 3003  →  Video Consultations  
API Proxy Server   →  Port 3001  →  Authentication & Routing
MariaDB 10.5      →  Port 3306  →  Healthcare Data Storage
```

### **Database Components**
- **Core Tables**: 40+ OpenEMR-compatible tables with healthcare workflows
- **Sample Data**: Pre-loaded patient records, providers, and clinical scenarios
- **FHIR Integration**: Complete R4 standard compliance with resource mapping
- **Audit System**: Comprehensive logging for HIPAA compliance requirements

### Admin Console
- Access Control (Keycloak/Firebase)
- Localization (i18next + Whisper)
- UI Theming (Tailwind/CSS-in-JS)
- Analytics (Grafana/Metabase)
- AI Tuning (YAML configs)
- Integration Engine (HL7/FHIR + OHIF PACS)
- Billing Logic (JSON rules)
- Compliance Modules (PostgreSQL + Vault)

### Telehealth
- Video Consultations (HIPAA-compliant)
- Real-Time Chat (encrypted)
- Remote Monitoring (IoT)
- Electronic Prescriptions
- Appointment Scheduling

## 🚀 **Quick Start**

### **1. Local Development Setup**
```bash
# Clone and setup the WebQX system
git clone https://github.com/webqx/webqx.git
cd webqx

# Start the complete EMR system
./start-webqx-complete.sh

# Access the applications
# EMR System:      http://localhost:3000
# Telehealth:      http://localhost:3003  
# API Proxy:       http://localhost:3001
# Admin Console:   http://localhost:3000/admin
```

### **2. Docker Deployment**
```bash
# Start MariaDB 10.5 with OpenEMR schema
cd webqx-emr-system
docker-compose up -d

# Verify database initialization
docker logs webqx-mariadb
```

### **3. GitHub Pages Deployment**
- **Live Demo**: [https://webqx.github.io/webqx/](https://webqx.github.io/webqx/)
- **Remote Control**: System management through web interface
- **One-Click Deploy**: Automatic deployment to GitHub Pages

---

## 🧑‍⚕️ MUP Access Program

Free/sponsored access for clinics serving Medically Underserved Populations.

**Eligibility:**
- Rural/tribal health centers
- Refugee/humanitarian clinics
- Disability/elder care facilities
- Low-income urban clinics

📥 [Apply for Equity Access](https://webqx.healthcare/equity-access)

---

## 🧱 **Technical Architecture**

### **Backend Infrastructure**
```plaintext
[GitHub Pages] → [API Gateway] → [Multi-Server Architecture] → [MariaDB 10.5]
     ↓               ↓                      ↓                      ↓
[Remote Control] [OAuth2/OIDC]    [EMR/Telehealth/Proxy]    [OpenEMR Schema]
```

### **Core Technology Stack**
- **Database**: MariaDB 10.5 with OpenEMR 7.x compatibility
- **Backend**: Node.js with Express.js multi-server architecture
- **Frontend**: Progressive Web App with service worker caching
- **Authentication**: OAuth 2.0, OIDC, and local EMR authentication
- **Standards**: FHIR R4, HL7, HIPAA compliance with audit trails
- **Deployment**: Docker containers with GitHub Pages integration

### **Integration Capabilities**
- **OpenEMR Adapters**: Complete integration with OpenEMR 7.x systems
- **FHIR Endpoints**: R4-compliant resource API for interoperability
- **HL7 Processing**: Message parsing and transformation capabilities
- **Database Adapters**: PostgreSQL, MySQL, and MariaDB support
- **API Gateway**: RESTful FHIR endpoints with OAuth 2.0 security
- **Session Control**: Stateless JWT tokens with comprehensive audit trails
- **Frontend Architecture**: React-based dashboard with real-time updates
- **Multilingual Support**: i18n-ready UI with multiple language support

---

## 📁 **Project Structure**

```plaintext
webqx/
├── webqx-emr-system/        # MariaDB 10.5 + OpenEMR integration
├── modules/                 # Specialty modules & AI transcription
├── sso/                    # Single Sign-On (OAuth2/SAML/OIDC)
├── ehr-integrations/       # EMR system adapters and connectors
├── auth/                   # Authentication & role-based access control
├── interoperability/       # HL7 FHIR R4, openEHR standards
├── messaging/              # Secure messaging with Matrix protocol
├── telehealth/             # Video conferencing and remote care
├── compliance/             # HIPAA compliance and audit framework
├── patient-portal/         # Patient-facing web application
├── provider/               # Provider portal and clinical tools
└── docs/                   # Documentation, legal, and contribution guides
```

---

## 🏥 **Clinical Interoperability**

### **EHR Integration**
- **Seamless Data Exchange**: OpenEMR, Epic, Cerner, and custom EMR systems
- **HL7 FHIR R4**: Complete standard compliance with resource mapping
- **Mirth Connect**: Advanced message processing and transformation
- **Real-time Sync**: Bidirectional data synchronization with audit trails

### **Healthcare Standards**
- **FHIR R4**: Patient, Practitioner, Encounter, and Observation resources
- **HL7 v2.x**: ADT, ORM, ORU message processing capabilities
- **CCD/C-CDA**: Clinical document exchange and continuity of care
- **IHE Profiles**: XDS, PIX, PDQ for healthcare information exchange

### **Multilingual Healthcare**
- **Clinical Terminology**: SNOMED CT, ICD-10, LOINC code translation
- **UI Localization**: Complete interface translation for global deployment
- **Voice Transcription**: AI-powered multilingual clinical documentation
- **Cultural Adaptation**: Healthcare workflow customization by region

---

## 🧬 Supported Specialties

Primary Care, Radiology, Cardiology, Pediatrics, Oncology, Psychiatry, Endocrinology, Orthopedics, Neurology, Gastroenterology, Pulmonology, Dermatology, OBGYN

---

## 🛡️ Security & Compliance

- TLS encryption
---

## 🔒 **Security & Compliance**

### **HIPAA Compliance Framework**
- **Audit-ready Backend**: Comprehensive logging and monitoring system
- **NDA & IP Templates**: Ready-to-use legal documentation
- **BAA Readiness**: Business Associate Agreement compliance tools
- **Data Encryption**: AES-256-GCM encryption for data at rest and in transit
- **Access Controls**: Role-based access control with audit trails

### **Global Regulatory Coverage**
| Country          | Healthcare Protocols      | Implementation Status |
|------------------|--------------------------|----------------------|
| 🇺🇸 US            | HIPAA, HITECH            | ✅ Complete         |
| 🇪🇺 EU            | GDPR, ePrivacy           | ✅ Complete         |
| 🇨🇦 Canada        | PIPEDA, PHIPA            | ✅ Complete         |
| 🇮🇳 India         | DISHA, NDHM              | ✅ Complete         |
| 🇧🇷 Brazil        | LGPD                     | ✅ Complete         |
| 🇿🇦 South Africa  | POPIA                    | ✅ Complete         |
| 🇵🇰 Pakistan      | PHIM, HIPC               | ✅ Complete         |
| 🇦🇪 UAE           | DHA, DoH Data Law        | ✅ Complete         |
| 🇸🇦 Saudi Arabia  | NHIC, PDPL               | ✅ Complete         |

---

## 🧪 **Laboratory Integration**

### **HL7 Lab Results Processing**
- **HL7 v2 → FHIR R4**: Automated transformation via Mirth Connect
- **Real-time Processing**: Live lab results with filtering and sorting
- **Clinical Decision Support**: Automated alerts and critical value notifications
- **Security Features**: TLS encryption, HIPAA compliance, comprehensive audit logging

### **Diagnostic Integration**
- **LOINC Coding**: Standardized laboratory and clinical codes
- **Reference Ranges**: Age and gender-specific normal values
- **Trending Analysis**: Historical lab value comparisons and graphing
- **Provider Notifications**: Automated alerts for critical and abnormal results

---

## 🩺 **ChatEHR Messaging System**

### **Secure Healthcare Communication**
- **Real-time Messaging**: HIPAA-compliant chat between providers and patients
- **Appointment Synchronization**: Integrated scheduling with EMR calendar
- **Clinical Dashboards**: Provider and patient communication portals
- **Audit Compliance**: Complete message logging for regulatory requirements

### **Advanced Features**
- **File Sharing**: Secure transmission of medical documents and images
- **Video Integration**: Seamless transition from chat to video consultations
- **Multi-language Support**: Automated translation for global healthcare teams
- **Mobile Applications**: Native iOS and Android apps with push notifications

---

## 🚀 **Deployment Options**

### **Cloud Platforms**
- **AWS Lambda**: Serverless deployment with automated packaging and dependency optimization
- **Railway**: Zero-configuration deployment with integrated health monitoring
- **GitHub Pages**: Static web deployment with remote system management
- **Docker**: Containerized deployment with MariaDB 10.5 integration

### **Local Development**
- **Mock Servers**: FHIR R4 and openEHR test servers for development
- **Database Options**: MariaDB, PostgreSQL, and MySQL support
- **Development Tools**: Complete testing framework with sample data
- **API Testing**: Comprehensive Postman collections and automated tests

---

## 🤝 **Development & Contribution**

- Fork, suggest specialty workflows
- Sign IP Addendum/NDA before PR
- Use feature branches, submit YAML logic + compliance notes

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`specialties.yaml`](./admin-console/ai-tuning/specialties.yaml)

---

## 📜 License

Apache 2.0 — Contributor IP addendums for legal clarity and scalability  
See [`LICENSE.md`](./LICENSE.md), [`nda-template.md`](./legal/nda-template.md), [`ip-addendum.md`](./legal/ip-addendum.md)

---

Contact: [info@webqx.healthcare](https://github.com/webqx-health)  
_“Care equity begins with code equity.”_

